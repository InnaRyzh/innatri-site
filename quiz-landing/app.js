/* ============================================================
   Настройки — заменить перед запуском
   ============================================================ */
const ENDPOINT_URL = 'ENDPOINT_URL'; // URL Google Apps Script Web App

/* ============================================================
   Состояние
   ============================================================ */
const LANG_KEY = 'quiz_lang';
const QUEUE_KEY = 'quiz_lead_queue';

let lang = localStorage.getItem(LANG_KEY) || 'ru';
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
    { code: 'marathon', labelKey: 'q_distance_marathon' },
    { code: 'half', labelKey: 'q_distance_half' },
    { code: 'undecided', labelKey: 'q_distance_undecided' }
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
/* Для полумарафона пороги объёма и длинной снижены на уровень:
   ответ засчитывается как уровень выше. */
const HALF_VOLUME_MAP = { v0: 'v1', v1: 'v2', v2: 'v3', v3: 'v3' };
const HALF_LONG_MAP = { l0: 'l1', l1: 'l2', l2: 'l3', l3: 'l4', l4: 'l4' };

const VOLUME_POINTS = { v0: 5, v1: 15, v2: 25, v3: 30 };
const LONG_POINTS = { l0: 3, l1: 10, l2: 18, l3: 25, l4: 25 };
const INJURY_POINTS = { i0: 15, i1: 12, i2: 6, i3: 0 };
const DAYS_POINTS = { d0: 5, d1: 10, d2: 10 };
const EXP_POINTS = { e0: 0, e1: 3, e2: 5 };

function computeResult() {
  const a = state.answers;
  const pain = a.injuries === 'i3';
  let score = 0;

  // weeks_to_race
  const w = state.weeks_to_race;
  if (w >= 16) score += 15;
  else if (w >= 12) score += 12;
  else if (w >= 8) score += 8;
  else if (w >= 4) score += 4;

  // volume и long run (для half сдвиг уровня)
  const isHalf = a.distance === 'half';
  const volCode = isHalf ? HALF_VOLUME_MAP[a.volume] : a.volume;
  score += VOLUME_POINTS[volCode];
  const longCode = isHalf ? HALF_LONG_MAP[a.long_run] : a.long_run;
  score += LONG_POINTS[longCode];

  score += INJURY_POINTS[a.injuries];
  score += DAYS_POINTS[a.days];
  score += EXP_POINTS[a.experience];

  // бонус: полумарафон с целью «финишировать»
  if (isHalf && a.goal === 'g0') score += 5;

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
    h2.textContent = state.answers.distance === 'undecided' ? t('q_race_date_undecided') : t('q_race_date');

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
  const raceKey = state.answers.distance === 'half' ? 'race_half' : 'race_marathon';
  return text
    .replaceAll('{weeks}', String(state.weeks_to_race))
    .replaceAll('{race}', t(raceKey));
}

function renderVerdict() {
  const zone = state.zone;
  const card = $('verdict-card');
  card.dataset.zone = zone;

  const dateStr = formatDate(new Date());
  $('verdict-diag-label').textContent = t('diag_label') + ' · ' + dateStr;

  const zoneNameKey = zone === 'green' ? 'zone_green' : zone === 'yellow' ? 'zone_yellow' : 'zone_red';
  $('verdict-zone').textContent = t(zoneNameKey);

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
function setLang(next) {
  lang = next;
  localStorage.setItem(LANG_KEY, lang);
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

applyStaticTexts();
retryQueue();
