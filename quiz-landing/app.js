/* ============================================================
   Настройки — заменить перед запуском
   ============================================================ */
const ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbxXyAtoXhwa1sb5ERJYlG-i_lwQwCKvHzdd62NML8y0Av-d8SE6qyN-aiB62pZ8wGzi/exec'; // URL Google Apps Script Web App

/* ============================================================
   Состояние
   ============================================================ */
const LANG_KEY = 'quiz_lang';
const QUEUE_KEY = 'quiz_lead_queue';

let lang = localStorage.getItem(LANG_KEY) || 'ru';
const urlLang = new URLSearchParams(location.search).get('lang');
if (urlLang && I18N[urlLang]) lang = urlLang;
if (!I18N[lang]) lang = 'ru';

const state = {
  step: 0,          // индекс текущего вопроса (0..8)
  answers: {},      // ключ вопроса -> код ответа
  race_date: null,  // ISO-строка даты
  weeks_to_race: null,
  goal_time: '',
  score: 0,
  zone: null,       // green | yellow | red | red_pain
  segment: null     // hot | warm | cold
};

const t = (key) => I18N[lang][key];

/* ============================================================
   Вопросы
   ============================================================ */
const QUESTIONS = [
  { key: 'distance', type: 'options', titleKey: 'q_distance', options: [
    { code: '5k', labelKey: 'q_distance_5k' },
    { code: '10k', labelKey: 'q_distance_10k' },
    { code: 'half', labelKey: 'q_distance_half' },
    { code: 'marathon', labelKey: 'q_distance_marathon' }
  ]},
  { key: 'race_date', type: 'date' },
  { key: 'volume', type: 'options', titleKey: 'q_volume', options: [
    { code: 'v0', labelKey: 'q_volume_v0' },
    { code: 'v1', labelKey: 'q_volume_v1' },
    { code: 'v2', labelKey: 'q_volume_v2' },
    { code: 'v3', labelKey: 'q_volume_v3' }
  ]},
  { key: 'long_run', type: 'options', titleKey: 'q_long_run', options: [
    { code: 'l0', labelKey: 'q_long_run_l0' },
    { code: 'l1', labelKey: 'q_long_run_l1' },
    { code: 'l2', labelKey: 'q_long_run_l2' },
    { code: 'l3', labelKey: 'q_long_run_l3' },
    { code: 'l4', labelKey: 'q_long_run_l4' }
  ]},
  { key: 'experience', type: 'options', titleKey: 'q_experience', options: [
    { code: 'e0', labelKey: 'q_experience_e0' },
    { code: 'e1', labelKey: 'q_experience_e1' },
    { code: 'e2', labelKey: 'q_experience_e2' }
  ]},
  { key: 'injuries', type: 'options', titleKey: 'q_injuries', options: [
    { code: 'i0', labelKey: 'q_injuries_i0' },
    { code: 'i1', labelKey: 'q_injuries_i1' },
    { code: 'i2', labelKey: 'q_injuries_i2' },
    { code: 'i3', labelKey: 'q_injuries_i3' }
  ]},
  { key: 'days', type: 'options', titleKey: 'q_days', options: [
    { code: 'd0', labelKey: 'q_days_d0' },
    { code: 'd1', labelKey: 'q_days_d1' },
    { code: 'd2', labelKey: 'q_days_d2' }
  ]},
  { key: 'current_training', type: 'options', titleKey: 'q_current_training', options: [
    { code: 't0', labelKey: 'q_current_training_t0' },
    { code: 't1', labelKey: 'q_current_training_t1' },
    { code: 't2', labelKey: 'q_current_training_t2' },
    { code: 't3', labelKey: 'q_current_training_t3' }
  ]},
  { key: 'goal', type: 'goal', titleKey: 'q_goal', options: [
    { code: 'g0', labelKey: 'q_goal_g0' },
    { code: 'g1', labelKey: 'q_goal_g1' },
    { code: 'g2', labelKey: 'q_goal_g2' }
  ]}
];

/* ============================================================
   Скоринг
   ============================================================ */
/* Пороги зависят от дистанции: объём «меньше 20 км/нед» для марафона - мало,
   для 5К - рабочая норма. У каждой дистанции своя таблица очков. */
const VOLUME_POINTS_BY_DIST = {
  '5k':     { v0: 25, v1: 30, v2: 30, v3: 30 },
  '10k':    { v0: 18, v1: 28, v2: 30, v3: 30 },
  half:     { v0: 15, v1: 25, v2: 30, v3: 30 },
  marathon: { v0: 5,  v1: 15, v2: 25, v3: 30 }
};
const LONG_POINTS_BY_DIST = {
  '5k':     { l0: 25, l1: 25, l2: 25, l3: 25, l4: 25 },
  '10k':    { l0: 15, l1: 25, l2: 25, l3: 25, l4: 25 },
  half:     { l0: 10, l1: 18, l2: 25, l3: 25, l4: 25 },
  marathon: { l0: 3,  l1: 10, l2: 18, l3: 25, l4: 25 }
};
/* Сколько недель до старта достаточно - тоже своё для каждой дистанции */
const WEEKS_POINTS_BY_DIST = {
  '5k':     [[6, 15], [4, 12], [3, 8], [2, 4]],
  '10k':    [[8, 15], [6, 12], [4, 8], [2, 4]],
  half:     [[12, 15], [10, 12], [8, 8], [4, 4]],
  marathon: [[16, 15], [12, 12], [8, 8], [4, 4]]
};
const INJURY_POINTS = { i0: 15, i1: 12, i2: 6, i3: 0 };
const DAYS_POINTS = { d0: 5, d1: 10, d2: 10 };
const EXP_POINTS = { e0: 0, e1: 3, e2: 5 };

function computeResult() {
  const a = state.answers;
  const pain = a.injuries === 'i3';
  let score = 0;

  const dist = VOLUME_POINTS_BY_DIST[a.distance] ? a.distance : 'marathon';

  // weeks_to_race - по порогам своей дистанции
  const w = state.weeks_to_race;
  for (const [minW, pts] of WEEKS_POINTS_BY_DIST[dist]) {
    if (w >= minW) { score += pts; break; }
  }

  score += VOLUME_POINTS_BY_DIST[dist][a.volume];
  score += LONG_POINTS_BY_DIST[dist][a.long_run];

  score += INJURY_POINTS[a.injuries];
  score += DAYS_POINTS[a.days];
  score += EXP_POINTS[a.experience];

  // бонус: короткая дистанция с целью «финишировать» - база достижимее
  if (dist !== 'marathon' && a.goal === 'g0') score += 5;

  // Зона: только боль даёт отдельный сценарий, остальное - по сумме баллов
  let zone;
  if (pain) zone = 'red_pain';
  else if (score >= 72) zone = 'green';
  else if (score >= 45) zone = 'yellow';
  else zone = 'risk';

  // Сегмент (пользователю не показывается)
  let segment;
  const hot = (w >= 8 && w <= 20
    && (['v2', 'v3'].includes(a.volume) || ['g1', 'g2'].includes(a.goal))
    && ['d1', 'd2'].includes(a.days)
    && !pain)
    || (zone === 'risk' && w >= 4 && w <= 20 && ['d1', 'd2'].includes(a.days));
  if (hot) segment = 'hot';
  else if (score >= 45) segment = 'warm';
  else segment = 'cold';

  state.score = score;
  state.zone = zone;
  state.segment = segment;
}

/* ============================================================
   Рендер
   ============================================================ */
const $ = (id) => document.getElementById(id);

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  window.scrollTo(0, 0);
}

function applyStaticTexts() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.documentElement.lang = lang === 'ua' ? 'uk' : 'ru';
  document.querySelectorAll('.lang-switch button').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
  });
  $('f-city').placeholder = t('form_city_placeholder');
}

function renderQuestion() {
  const q = QUESTIONS[state.step];
  $('progress-label').textContent = (state.step + 1) + ' / ' + QUESTIONS.length;
  $('progress-fill').style.width = ((state.step + 1) / QUESTIONS.length * 100) + '%';
  $('btn-back').hidden = state.step === 0;

  const box = $('question-box');
  box.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'question anim-in';

  const h2 = document.createElement('h2');
  wrap.appendChild(h2);

  if (q.type === 'options' || q.type === 'goal') {
    h2.textContent = t(q.titleKey);
    const list = document.createElement('div');
    list.className = 'options';
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option' + (state.answers[q.key] === opt.code ? ' selected' : '');
      btn.textContent = t(opt.labelKey);
      btn.addEventListener('click', () => onSelect(q, opt.code, wrap));
      list.appendChild(btn);
    });
    wrap.appendChild(list);

    if (q.type === 'goal') {
      const sub = document.createElement('div');
      sub.className = 'field-block';
      sub.hidden = state.answers.goal !== 'g2';
      sub.id = 'goal-time-block';

      const label = document.createElement('label');
      label.className = 'q-sub-label';
      label.setAttribute('for', 'goal-time-input');
      label.textContent = t('q_goal_time_label');

      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'goal-time-input';
      input.value = state.goal_time;
      input.inputMode = 'text';

      const next = document.createElement('button');
      next.type = 'button';
      next.className = 'btn btn-next';
      next.textContent = t('next');
      next.addEventListener('click', () => {
        state.goal_time = input.value.trim();
        goNext();
      });

      sub.appendChild(label);
      sub.appendChild(input);
      sub.appendChild(next);
      wrap.appendChild(sub);
    }
  } else if (q.type === 'date') {
    h2.textContent = t('q_race_date');

    const block = document.createElement('div');
    block.className = 'field-block';

    const input = document.createElement('input');
    input.type = 'date';
    input.id = 'race-date-input';
    if (state.race_date) input.value = state.race_date;
    const today = new Date();
    input.min = toISODate(today);

    const err = document.createElement('div');
    err.className = 'field-error';
    err.id = 'race-date-error';

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'btn btn-next';
    next.textContent = t('next');
    next.addEventListener('click', () => {
      const weeks = weeksFromToday(input.value);
      if (input.value === '' || weeks === null || weeks < 1) {
        err.textContent = t('q_race_date_error');
        return;
      }
      state.race_date = input.value;
      state.weeks_to_race = weeks;
      goNext();
    });

    block.appendChild(input);
    block.appendChild(err);
    block.appendChild(next);
    wrap.appendChild(block);
  }

  box.appendChild(wrap);
}

function onSelect(q, code, wrap) {
  state.answers[q.key] = code;

  if (q.type === 'goal') {
    // подсветить выбор
    wrap.querySelectorAll('.option').forEach((b, i) => {
      b.classList.toggle('selected', q.options[i].code === code);
    });
    const sub = $('goal-time-block');
    if (code === 'g2') {
      sub.hidden = false;
      $('goal-time-input').focus();
      return; // ждём кнопку «Дальше»
    }
    sub.hidden = true;
    state.goal_time = '';
    goNext();
    return;
  }

  goNext();
}

function goNext() {
  if (state.step < QUESTIONS.length - 1) {
    state.step++;
    renderQuestion();
  } else {
    finishQuiz();
  }
}

function goBack() {
  if (state.step === 0) return;
  state.step--;
  renderQuestion();
}

/* ============================================================
   Вердикт
   ============================================================ */
function interpolate(text) {
  const raceKeys = { '5k': 'race_5k', '10k': 'race_10k', half: 'race_half', marathon: 'race_marathon' };
  const raceKey = raceKeys[state.answers.distance] || 'race_marathon';
  return text
    .replaceAll('{weeks}', String(state.weeks_to_race))
    .replaceAll('{race}', t(raceKey));
}


function computeStrengths() {
  const a = state.answers;
  const dist = VOLUME_POINTS_BY_DIST[a.distance] ? a.distance : 'marathon';
  const out = [];
  if (VOLUME_POINTS_BY_DIST[dist][a.volume] >= 25) out.push('st_volume');
  if (LONG_POINTS_BY_DIST[dist][a.long_run] >= 18) out.push('st_long');
  if (state.weeks_to_race >= WEEKS_POINTS_BY_DIST[dist][0][0]) out.push('st_weeks');
  if (['d1', 'd2'].includes(a.days)) out.push('st_days');
  if (['i0', 'i1'].includes(a.injuries)) out.push('st_clean');
  if (['e1', 'e2'].includes(a.experience)) out.push('st_exp');
  return out.slice(0, 3);
}

function renderVerdict() {
  const zone = state.zone;
  const card = $('verdict-card');
  card.dataset.zone = zone;

  const dateStr = formatDate(new Date());
  $('verdict-diag-label').textContent = t('diag_label') + ' · ' + dateStr;

  const zoneNameKey = zone === 'green' ? 'zone_green'
    : zone === 'yellow' ? 'zone_yellow'
    : zone === 'red_pain' ? 'zone_redpain' : 'zone_red';
  $('verdict-zone').textContent = t(zoneNameKey);

  // «Что у тебя уже есть» - признать сильные стороны до разговора о пробелах
  const strengths = computeStrengths();
  const stEl = $('verdict-strengths');
  if (strengths.length) {
    stEl.hidden = false;
    stEl.textContent = '';
    stEl.append(t('strengths_label') + ' ');
    strengths.forEach((k, i) => {
      const item = document.createElement('span');
      item.className = 'st-item';
      const check = document.createElement('span');
      check.className = 'st-check';
      check.textContent = '\u2713';
      item.append(check, interpolate(t(k)));
      stEl.append(item);
      if (i < strengths.length - 1) stEl.append('   ');
    });
  } else {
    stEl.hidden = true;
  }

  const keyBase = zone === 'red_pain' ? 'verdict_redpain' : 'verdict_' + zone;
  $('verdict-title').textContent = t(keyBase + '_title');
  $('verdict-text').textContent = interpolate(t(keyBase + '_text'));

  const hotEl = $('review-hot');
  hotEl.hidden = state.segment !== 'hot';
  hotEl.textContent = t('review_hot');
}

function finishQuiz() {
  computeResult();
  renderVerdict();
  showScreen('screen-verdict');
}

/* ============================================================
   Форма и отправка
   ============================================================ */
function isValidContact(v) {
  if (v.startsWith('@') && v.length > 1) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}


/* ============================================================
   Telegram-текст лида формируется ЗДЕСЬ, а не в Apps Script.
   Скрипт в таблице - тупая труба: любые правки логики/текстов
   делаются в этом файле и уезжают через git, без переустановки
   скрипта у Инны.
   ============================================================ */
const TG_RU = {
  distance: { '5k': '5 км', '10k': '10 км', half: 'Полумарафон (21.1 км)', marathon: 'Марафон (42.2 км)' },
  zone: { green: '\u{1F7E2} Зелёная', yellow: '\u{1F7E1} Жёлтая', risk: '\u{1F534} Красная (разрыв база/дистанция)', red_pain: '\u{1F534} Красная (боль сейчас)' },
  segment: { hot: 'горячий \u{1F525}', warm: 'тёплый', cold: 'холодный' }
};

/* Черновик ответа клиенту - на языке клиента, готов к отправке */
const DRAFTS = {
  ru: {
    hi: 'Привет, {name}! Посмотрела твои ответы - вот с чего я бы начала:',
    pain: 'Сначала - боль. Любой план поверх боли - это подготовка к травме, а не к старту. Разберись, что болит и на чём усиливается. Если дольше недели или нарастает - к спортивному врачу, а бег пока замени на вело или плавание.',
    volume: 'Объём сейчас {vol} - для дистанции «{race}» этого мало. Поднимай постепенно: не больше +10% в неделю, каждая 4-я неделя - легче на треть. Резкий скачок объёма - главная причина травм у любителей.',
    long: 'Длинная сейчас {long} - для «{race}» коротко. Наращивай на 1-2 км раз в 1-2 недели, всю длинную беги разговорным темпом. Пик - за 2-3 недели до старта, дальше тейпер.',
    weeks: 'До старта {weeks} нед. - впритык. Приоритет: длинная + одна качественная работа в неделю, всё остальное - легко. Догонять форму героизмом опаснее, чем скорректировать цель.',
    aches: 'Периодические боли - это звонок, не фон. Добавь силовую 2 раза в неделю (стопа, голень, ягодицы, кор) и следи за реакцией на рост нагрузки. Усиливается - не терпи, к врачу.',
    structure: 'Сейчас у тренировок нет структуры. База: 80% объёма - лёгкий бег, 20% - качество. Три ключевые тренировки в неделе: интервалы, темп, длинная. Остальное - восстановление.',
    goalgap: 'Цель «{goal}» амбициозна относительно текущей базы. Честный вариант: этот старт - сильный ровный финиш, рекорд - в следующем цикле.',
    solid: 'База у тебя в порядке - дальше решает качество: структура интенсивности, подводка к старту, раскладка темпа и питание на дистанции. Именно здесь прячется результат.',
    bye: 'Если захочешь, разложу это в конкретный план под твой календарь и график - просто ответь на это сообщение.'
  },
  ua: {
    hi: 'Привіт, {name}! Подивилася твої відповіді - ось з чого я б почала:',
    pain: 'Спочатку - біль. Будь-який план поверх болю - це підготовка до травми, а не до старту. Розберися, що болить і на чому посилюється. Якщо довше тижня або наростає - до спортивного лікаря, а біг поки заміни на вело чи плавання.',
    volume: "Об'єм зараз {vol} - для дистанції «{race}» цього мало. Піднімай поступово: не більше +10% на тиждень, кожен 4-й тиждень - легший на третину. Різкий стрибок об'єму - головна причина травм у любителів.",
    long: 'Довготривала зараз {long} - для «{race}» коротко. Нарощуй на 1-2 км раз на 1-2 тижні, всю довгу біжи розмовним темпом. Пік - за 2-3 тижні до старту, далі тейпер.',
    weeks: 'До старту {weeks} тиж. - впритул. Пріоритет: довга + одна якісна робота на тиждень, решта - легко. Наздоганяти форму героїзмом небезпечніше, ніж скоригувати ціль.',
    aches: 'Періодичні болі - це дзвінок, не фон. Додай силову 2 рази на тиждень (стопа, гомілка, сідниці, кор) і стеж за реакцією на зростання навантаження. Посилюється - не терпи, до лікаря.',
    structure: 'Зараз у тренувань немає структури. База: 80% об\'єму - легкий біг, 20% - якість. Три ключові тренування на тижні: інтервали, темп, довга. Решта - відновлення.',
    goalgap: 'Ціль «{goal}» амбітна відносно поточної бази. Чесний варіант: цей старт - сильний рівний фініш, рекорд - у наступному циклі.',
    solid: 'База в тебе в порядку - далі вирішує якість: структура інтенсивності, підводка до старту, розкладка темпу та харчування на дистанції. Саме тут ховається результат.',
    bye: 'Якщо захочеш, розкладу це в конкретний план під твій календар і графік - просто відповіси на це повідомлення.'
  },
  en: {
    hi: "Hi {name}! I went through your answers - here is where I would start:",
    pain: 'First - the pain. Any training plan on top of pain is training for an injury, not for a race. Figure out what hurts and what makes it worse. If it lasts more than a week or grows - see a sports doctor, and swap running for cycling or swimming meanwhile.',
    volume: 'Your volume is {vol} right now - for a {race} that is low. Build it gradually: no more than +10% per week, every 4th week a third lighter. A volume spike is the #1 cause of injuries in recreational runners.',
    long: 'Your long run is {long} - short for a {race}. Add 1-2 km every week or two, run all of it at a conversational pace. Peak 2-3 weeks before race day, then taper.',
    weeks: '{weeks} weeks to race day is tight. Priority: the long run plus one quality session per week, everything else easy. Chasing fitness with heroics is more dangerous than adjusting the goal.',
    aches: 'Recurring aches are a signal, not background noise. Add strength work twice a week (feet, calves, glutes, core) and watch how your body reacts to added load. If it grows - do not push through, see a doctor.',
    structure: 'Right now your training has no structure. The base rule: 80% of volume easy, 20% quality. Three key sessions a week - intervals, tempo, long run. Everything else is recovery.',
    goalgap: 'The goal "{goal}" is ambitious relative to your current base. The honest play: make this race a strong, even finish - and chase the record next cycle.',
    solid: 'Your base is in good shape - from here it is about quality: intensity structure, the taper, race pacing and fueling. That is where the result hides.',
    bye: 'If you want, I can turn this into a concrete plan around your calendar and schedule - just reply to this message.'
  }
};

function tgLabel(l, key) { return (I18N[l] && I18N[l][key]) || I18N.ru[key] || ''; }

function buildTelegramText(formData) {
  const a = state.answers;
  const dist = VOLUME_POINTS_BY_DIST[a.distance] ? a.distance : 'marathon';
  const L = DRAFTS[lang] ? lang : 'ru';
  const D = DRAFTS[L];
  const ruLabel = (key) => I18N.ru[key] || '';
  const raceRu = TG_RU.distance[dist] || dist;
  const raceLead = tgLabel(L, 'q_distance_' + dist).replace(/\s*\(.*\)/, '');
  const fill = (t, extra) => t
    .replaceAll('{name}', formData.name || '')
    .replaceAll('{race}', raceLead)
    .replaceAll('{weeks}', String(state.weeks_to_race))
    .replaceAll('{vol}', tgLabel(L, 'q_volume_' + a.volume))
    .replaceAll('{long}', tgLabel(L, 'q_long_run_' + a.long_run))
    .replaceAll('{goal}', tgLabel(L, 'q_goal_' + a.goal) + (state.goal_time ? ' ' + state.goal_time : ''));

  /* Пробелы - те же пороги, что в скоринге */
  const gaps = [];
  if (a.injuries === 'i3') gaps.push(D.pain);
  if (VOLUME_POINTS_BY_DIST[dist][a.volume] < 25) gaps.push(fill(D.volume));
  if (LONG_POINTS_BY_DIST[dist][a.long_run] < 18) gaps.push(fill(D.long));
  const minWeeks = { '5k': 4, '10k': 6, half: 10, marathon: 12 }[dist];
  if (state.weeks_to_race < minWeeks && a.injuries !== 'i3') gaps.push(fill(D.weeks));
  if (a.injuries === 'i2') gaps.push(D.aches);
  if (a.current_training !== 't2') gaps.push(D.structure);
  if ((a.goal === 'g1' || a.goal === 'g2') && VOLUME_POINTS_BY_DIST[dist][a.volume] < 25) gaps.push(fill(D.goalgap));
  const top = gaps.length ? gaps.slice(0, 3) : [D.solid];

  const draft = [fill(D.hi), '']
    .concat(top.map((g, i) => (i + 1) + '. ' + g + '\n'))
    .concat([D.bye]).join('\n');

  const fire = state.segment === 'hot' ? ' \u{1F525}' : '';
  const langNote = L === 'en' ? ' - черновик ниже уже НА АНГЛИЙСКОМ' : (L === 'ua' ? ' - чернетка нижче українською' : '');
  const header = [
    'Новый лид с квиза' + fire,
    '',
    '\u{1F464} ' + (formData.name || '-') + ' \u00B7 ' + (formData.contact || '-') + ' \u00B7 ' + (formData.city || '-'),
    'Язык: ' + L.toUpperCase() + langNote,
    '',
    'Дистанция: ' + raceRu,
    'Старт: ' + (state.race_date || 'дата не выбрана') + ' (через ' + state.weeks_to_race + ' нед.)',
    'Цель: ' + ruLabel('q_goal_' + a.goal).toLowerCase() + (state.goal_time ? ' - ' + state.goal_time : ''),
    'Объём: ' + ruLabel('q_volume_' + a.volume) + ' \u00B7 Длинная: ' + ruLabel('q_long_run_' + a.long_run),
    'Опыт: ' + ruLabel('q_experience_' + a.experience) + ' \u00B7 Травмы: ' + ruLabel('q_injuries_' + a.injuries),
    'Дней в неделю: ' + ruLabel('q_days_' + a.days) + ' \u00B7 Сейчас: ' + ruLabel('q_current_training_' + a.current_training),
    '',
    'Зона: ' + (TG_RU.zone[state.zone] || state.zone) + ' \u00B7 Сегмент: ' + (TG_RU.segment[state.segment] || state.segment) + ' \u00B7 ' + state.score + ' баллов',
    '',
    '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501',
    '\u{1F4DD} ЧЕРНОВИК ОТВЕТА (поправь и отправь клиенту):',
    '',
    draft
  ].join('\n');
  return header.slice(0, 3900);
}

function buildPayload(formData) {
  return {
    distance: state.answers.distance,
    race_date: state.race_date,
    weeks_to_race: state.weeks_to_race,
    volume: state.answers.volume,
    long_run: state.answers.long_run,
    experience: state.answers.experience,
    injuries: state.answers.injuries,
    days: state.answers.days,
    current_training: state.answers.current_training,
    goal: state.answers.goal,
    goal_time: state.goal_time,
    score: state.score,
    zone: state.zone,
    segment: state.segment,
    name: formData.name,
    contact: formData.contact,
    city: formData.city,
    lang: lang,
    tg_text: buildTelegramText(formData),
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  };
}

async function sendPayload(payload) {
  const res = fetch(ENDPOINT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  return res;
}

function enqueue(payload) {
  try {
    const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    q.push(payload);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch (e) { /* localStorage недоступен — ничего не делаем */ }
}

async function retryQueue() {
  if (ENDPOINT_URL === 'ENDPOINT_URL') return;
  let q;
  try { q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch (e) { return; }
  if (!Array.isArray(q) || q.length === 0) return;
  const remaining = [];
  for (const payload of q) {
    try { await sendPayload(payload); }
    catch (e) { remaining.push(payload); }
  }
  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
}

function track(event, custom) {
  if (typeof gtag === 'function') gtag('event', 'quiz_' + event.toLowerCase());
  if (typeof fbq !== 'function') return;
  if (custom) fbq('trackCustom', event);
  else fbq('track', event);
}

async function onSubmit(e) {
  e.preventDefault();

  const name = $('f-name').value.trim();
  const contact = $('f-contact').value.trim();
  const city = $('f-city').value.trim();

  let ok = true;
  $('err-name').textContent = name ? '' : t('form_error_required');
  if (!name) ok = false;
  if (!contact) { $('err-contact').textContent = t('form_error_required'); ok = false; }
  else if (!isValidContact(contact)) { $('err-contact').textContent = t('form_error_contact'); ok = false; }
  else $('err-contact').textContent = '';
  $('err-city').textContent = city ? '' : t('form_error_required');
  if (!city) ok = false;
  if (!ok) return;

  const payload = buildPayload({ name, contact, city });

  if (ENDPOINT_URL === 'ENDPOINT_URL') {
    enqueue(payload); // endpoint ещё не настроен — лид в очередь
  } else {
    try { await sendPayload(payload); }
    catch (err) { enqueue(payload); } // сеть упала — лид не теряем
  }

  track('Lead', false);
  $('thanks-blog-link').href = blogUrl();
  showScreen('screen-thanks');
}

/* ============================================================
   Утилиты
   ============================================================ */
function toISODate(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + m + '-' + day;
}

function weeksFromToday(iso) {
  if (!iso) return null;
  const target = new Date(iso + 'T00:00:00');
  if (isNaN(target)) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((target - today) / 86400000);
  return Math.floor(days / 7);
}

function formatDate(d) {
  const day = String(d.getDate()).padStart(2, '0');
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return day + '.' + m + '.' + d.getFullYear();
}

/* ============================================================
   Инициализация
   ============================================================ */

function blogUrl() {
  const half = state.answers.distance === 'half';
  const map = {
    ru: half ? 'https://innatri.com/blog/polumarafon-3-trenirovki-v-nedelyu.html' : 'https://innatri.com/blog.html',
    ua: half ? 'https://innatri.com/ua/blog/pivmarafon-3-trenuvannya-na-tyzhden.html' : 'https://innatri.com/ua/blog.html',
    en: half ? 'https://innatri.com/en/blog/half-marathon-3-runs-a-week.html' : 'https://innatri.com/en/blog.html'
  };
  return map[lang] || map.ru;
}

function setLang(next) {
  lang = next;
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = t('lang_code');
  document.title = t('title_tag');
  applyStaticTexts();
  const active = document.querySelector('.screen.active').id;
  if (active === 'screen-quiz') renderQuestion();
  if (active === 'screen-verdict') renderVerdict();
}

document.querySelectorAll('.lang-switch button').forEach(b => {
  b.addEventListener('click', () => setLang(b.dataset.lang));
});

$('btn-start').addEventListener('click', () => {
  track('StartQuiz', true);
  state.step = 0;
  showScreen('screen-quiz');
  renderQuestion();
});

$('btn-back').addEventListener('click', goBack);
$('btn-to-form').addEventListener('click', () => showScreen('screen-form'));
$('lead-form').addEventListener('submit', onSubmit);

document.documentElement.lang = t('lang_code');
document.title = t('title_tag');
applyStaticTexts();
retryQueue();
