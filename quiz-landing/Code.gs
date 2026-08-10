/* ============================================================
   Google Apps Script для приёма лидов квиза. ФИНАЛЬНАЯ ВЕРСИЯ.

   Это «тупая труба»: текст уведомления формирует сам квиз
   (поле tg_text) — вся логика и тексты правятся на сайте,
   без переустановки этого скрипта.

   Скрипт привязан к Google Таблице (Расширения → Apps Script).
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

function doPost(e) {
  var sheetOk = false, tgOk = false, errors = [];
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'bad json' });
  }

  /* Таблица и Telegram независимы: падение одного не убивает другое */
  try { appendRow_(data); sheetOk = true; }
  catch (err) { errors.push('sheet: ' + err); }

  try { notifyTelegram_(data); tgOk = true; }
  catch (err) { errors.push('tg: ' + err); }

  /* Если сломалась таблица, но жив Telegram - сообщить об этом Инне,
     чтобы поломка не осталась незамеченной */
  if (!sheetOk && tgOk) {
    try { sendTg_('⚠️ Лид пришёл, но НЕ записался в таблицу (' + errors.join('; ') + '). Данные выше в уведомлении.'); } catch (ignored) {}
  }

  return json_({ ok: sheetOk || tgOk, errors: errors });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
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

function notifyTelegram_(data) {
  if (TELEGRAM_BOT_TOKEN === 'TELEGRAM_BOT_TOKEN') return;
  /* Основной путь: готовый текст из квиза */
  if (data.tg_text) { sendTg_(String(data.tg_text).slice(0, 4000)); return; }
  /* Запасной путь: посетитель со старой закэшированной версией квиза */
  var lines = [
    'Новый лид с квиза' + (data.segment === 'hot' ? ' 🔥' : ''),
    '',
    'Имя: ' + (data.name || '—'),
    'Контакт: ' + (data.contact || '—'),
    'Город: ' + (data.city || '—'),
    'Язык: ' + (data.lang || 'ru'),
    'Дистанция: ' + (data.distance || '—') + ' · старт: ' + (data.race_date || '—') + ' · недель: ' + (data.weeks_to_race != null ? data.weeks_to_race : '—'),
    'Ответы: ' + [data.volume, data.long_run, data.experience, data.injuries, data.days, data.current_training, data.goal].join(' '),
    'Зона: ' + (data.zone || '—') + ' · ' + (data.score || '') + ' баллов'
  ];
  sendTg_(lines.join('\n'));
}

function sendTg_(text) {
  var url = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage';
  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text }),
    muteHttpExceptions: true
  });
}
