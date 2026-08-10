/* ============================================================
   Google Apps Script для приёма лидов квиза.
   Скрипт должен быть привязан к Google Таблице
   (Расширения → Apps Script внутри таблицы).

   Перед деплоем заменить два плейсхолдера ниже.
   ============================================================ */
var TELEGRAM_BOT_TOKEN = 'TELEGRAM_BOT_TOKEN';
var TELEGRAM_CHAT_ID = 'TELEGRAM_CHAT_ID';

var HEADERS = [
  'timestamp', 'name', 'contact', 'city',
  'zone', 'segment', 'score',
  'distance', 'race_date', 'weeks_to_race',
  'volume', 'long_run', 'experience', 'injuries', 'days',
  'current_training', 'goal', 'goal_time',
  'lang', 'userAgent'
];

/* Расшифровка кодов ответов - для человекочитаемого уведомления */
var DECODE = {
  distance: { marathon: 'Марафон (42.2 км)', half: 'Полумарафон (21.1 км)', undecided: 'Ещё выбирает старт' },
  volume: { v0: 'меньше 20 км/нед', v1: '20–40 км/нед', v2: '40–60 км/нед', v3: 'больше 60 км/нед' },
  long_run: { l0: 'до 10 км', l1: '10–15 км', l2: '16–21 км', l3: '22–28 км', l4: '29+ км' },
  experience: { e0: 'первый раз на дистанции', e1: 'бегал(а) один раз', e2: 'несколько стартов' },
  injuries: { i0: 'травм не было', i1: 'было, но прошло', i2: 'периодически побаливает', i3: 'БОЛИТ СЕЙЧАС' },
  days: { d0: '2–3 дня/нед', d1: '4–5 дней/нед', d2: '6–7 дней/нед' },
  current_training: { t0: 'план из интернета/приложения', t1: 'сам(а), без чёткого плана', t2: 'с тренером', t3: 'нерегулярно' },
  goal: { g0: 'финишировать', g1: 'личный рекорд', g2: 'конкретное время' },
  zone: { green: '🟢 Зелёная', yellow: '🟡 Жёлтая', risk: '🔴 Красная (разрыв база/дистанция)', red_pain: '🔴 Красная (боль сейчас)' },
  segment: { hot: 'горячий 🔥', warm: 'тёплый', cold: 'холодный' }
};

function dec(cat, code) {
  return (DECODE[cat] && DECODE[cat][code]) || code || '—';
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    appendRow_(data);
    notifyTelegram_(data);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function appendRow_(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  var row = HEADERS.map(function (key) {
    var v = data[key];
    return v === undefined || v === null ? '' : v;
  });
  sheet.appendRow(row);
}

/* Черновик разбора: 2-3 главных пробела по ответам + что делать.
   Это базис - Инна правит под человека и отправляет. */
function buildDraft_(d) {
  var isHalf = d.distance === 'half';
  var HV = { v0: 'v1', v1: 'v2', v2: 'v3', v3: 'v3' };
  var HL = { l0: 'l1', l1: 'l2', l2: 'l3', l3: 'l4', l4: 'l4' };
  var vol = isHalf ? (HV[d.volume] || d.volume) : d.volume;
  var lng = isHalf ? (HL[d.long_run] || d.long_run) : d.long_run;
  var w = Number(d.weeks_to_race);
  var gaps = [];

  if (d.injuries === 'i3') {
    gaps.push('Сначала - боль. Любой план поверх боли - это подготовка к травме, а не к старту. Разобраться, что болит и на чём усиливается (рост объёма? темп? рельеф?). Если больше недели или усиливается - к спортивному врачу, до этого бег заменить на низкоударное (вело/плавание).');
  }
  if (vol === 'v0' || vol === 'v1') {
    gaps.push('Объём ниже рабочего для дистанции (сейчас ' + dec('volume', d.volume) + '). Поднимать постепенно: не больше +10% в неделю, каждая 4-я неделя - разгрузочная (-30%). Резкий скачок объёма - главная причина травм у любителей.');
  }
  if (lng === 'l0' || lng === 'l1') {
    gaps.push('Длинная короткая (сейчас ' + dec('long_run', d.long_run) + '). Наращивать на 1-2 км раз в 1-2 недели, всю длинную бежать разговорным темпом. Пик - за 2-3 недели до старта, дальше тейпер.');
  }
  if (!isNaN(w) && w < 12 && d.injuries !== 'i3') {
    gaps.push('До старта ' + w + ' нед. - впритык. Приоритет: длинная + одна качественная работа в неделю, всё остальное - легко. Догонять форму героизмом опаснее, чем скорректировать цель на этот старт.');
  }
  if (d.injuries === 'i2') {
    gaps.push('Периодические боли - это звонок, не фон. Силовая 2 раза в неделю (стопа, голень, ягодицы, кор), следить за реакцией на рост нагрузки. Усиливается - не перетерпливать, к врачу.');
  }
  if (d.current_training === 't0' || d.current_training === 't1' || d.current_training === 't3') {
    gaps.push('Нет структуры (' + dec('current_training', d.current_training) + '). База: 80% объёма - лёгкий бег, 20% - качество. Три ключевые тренировки в неделе: интервалы, темп, длинная. Всё остальное - восстановительное, не "как пойдёт".');
  }
  if ((d.goal === 'g1' || d.goal === 'g2') && (vol === 'v0' || vol === 'v1')) {
    gaps.push('Цель "' + dec('goal', d.goal) + (d.goal_time ? ' ' + d.goal_time : '') + '" амбициозна относительно текущей базы. Честный вариант: этот старт - сильный ровный финиш, рекорд - в следующем цикле на выросшей базе.');
  }
  if (gaps.length === 0) {
    gaps.push('База в порядке - разбор про качество: структура интенсивности (не все тренировки в "серой зоне"), подводка к старту, раскладка темпа на гонку и питание на дистанции.');
  }

  var top = gaps.slice(0, 3);
  var out = ['📝 ЧЕРНОВИК РАЗБОРА - поправь под человека и отправь:', ''];
  for (var i = 0; i < top.length; i++) {
    out.push((i + 1) + '. ' + top[i]);
    out.push('');
  }
  return out.join('\n').trim();
}

function notifyTelegram_(data) {
  if (TELEGRAM_BOT_TOKEN === 'TELEGRAM_BOT_TOKEN') return;

  var fire = data.segment === 'hot' ? ' 🔥' : '';
  var langNote = data.lang === 'en' ? ' - ОТВЕЧАТЬ ПО-АНГЛИЙСКИ' : (data.lang === 'ua' ? ' - відповідати українською' : '');
  var lines = [
    'Новый лид с квиза' + fire,
    '',
    '👤 ' + (data.name || '—') + ' · ' + (data.contact || '—') + ' · ' + (data.city || '—'),
    'Язык: ' + String(data.lang || 'ru').toUpperCase() + langNote,
    '',
    'Дистанция: ' + dec('distance', data.distance),
    'Старт: ' + (data.race_date || 'дата не выбрана') + (data.weeks_to_race != null && data.weeks_to_race !== '' ? ' (через ' + data.weeks_to_race + ' нед.)' : ''),
    'Цель: ' + dec('goal', data.goal) + (data.goal_time ? ' - ' + data.goal_time : ''),
    '',
    'Объём: ' + dec('volume', data.volume),
    'Длинная: ' + dec('long_run', data.long_run),
    'Опыт: ' + dec('experience', data.experience),
    'Травмы: ' + dec('injuries', data.injuries),
    'Дней в неделю: ' + dec('days', data.days),
    'Тренируется сейчас: ' + dec('current_training', data.current_training),
    '',
    'Зона: ' + dec('zone', data.zone) + ' · Сегмент: ' + dec('segment', data.segment) + (data.score ? ' · ' + data.score + ' баллов' : ''),
    '',
    '━━━━━━━━━━━━━━',
    buildDraft_(data)
  ];

  var url = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage';
  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: lines.join('\n')
    }),
    muteHttpExceptions: true
  });
}
