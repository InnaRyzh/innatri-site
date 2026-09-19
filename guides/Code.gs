/* ============================================================
   Google Apps Script для лид-магнита «Возвращение после перерыва».

   Что делает при каждой заявке:
   1. пишет строку в Google Таблицу (база подписчиков);
   2. отправляет человеку письмо со ссылкой на гайд;
   3. присылает тебе уведомление в Telegram.

   Ставится на ОТДЕЛЬНУЮ таблицу, не на ту, где лежит квиз.
   Инструкция по установке - в README-gajd.md.
   ============================================================ */

/* ---------- Настройки: заменить перед деплоем ---------- */
var TELEGRAM_BOT_TOKEN = 'TELEGRAM_BOT_TOKEN';   // тот же бот, что у квиза
var TELEGRAM_CHAT_ID   = 'TELEGRAM_CHAT_ID';     // тот же chat id

var PDF_URL    = 'https://innatri.com/guides/vozvrashchenie-posle-pereryva.pdf';
var PAGE_URL   = 'https://innatri.com/guides/vozvrashchenie.html';
var FROM_NAME  = 'Инна Рыжих · InnaTri';
var SUBJECT    = 'Твой гайд «Возвращение после перерыва»';

var HEADERS = ['timestamp', 'name', 'email', 'source', 'lang', 'referrer', 'mail_sent', 'userAgent'];

/* ============================================================ */

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'bad json' });
  }

  var errors = [], mailOk = false;

  /* Письмо человеку - самое важное, поэтому первым */
  try { sendGuide_(data); mailOk = true; }
  catch (err) { errors.push('mail: ' + err); }

  /* Таблица, Telegram и письмо независимы: падение одного не убивает остальные */
  try { appendRow_(data, mailOk); }
  catch (err) { errors.push('sheet: ' + err); }

  try { notifyTelegram_(data, mailOk, errors); }
  catch (err) { errors.push('tg: ' + err); }

  return json_({ ok: true, errors: errors });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function appendRow_(data, mailOk) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  var row = HEADERS.map(function (key) {
    if (key === 'mail_sent') return mailOk ? 'да' : 'НЕТ';
    var v = data[key];
    return v === undefined || v === null ? '' : v;
  });
  sheet.appendRow(row);
}

/* ---------- Письмо с гайдом ---------- */
function sendGuide_(data) {
  var email = String(data.email || '').trim();
  if (!email || email.indexOf('@') === -1) throw 'нет адреса';

  var name = String(data.name || '').trim();
  var hi = name ? (name + ', привет!') : 'Привет!';

  var plain =
    hi + '\n\n' +
    'Вот гайд «Возвращение после перерыва»:\n' + PDF_URL + '\n\n' +
    'Начни с части 3 - там четыре сценария перерыва. Найди свой и работай по нему,\n' +
    'остальные читать необязательно.\n\n' +
    'И одна просьба. Ответь на это письмо одним словом: отпуск, болезнь, травма или выгорание.\n' +
    'Мне правда интересно, с чем чаще всего приходят, а тебе я смогу подсказать точнее.\n\n' +
    'Инна Рыжих\n' +
    'Тренер по бегу и триатлону\n' +
    'innatri.com';

  var html =
    '<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:16px;' +
    'line-height:1.6;color:#211D19;max-width:520px">' +
      '<p style="margin:0 0 18px">' + escape_(hi) + '</p>' +
      '<p style="margin:0 0 22px">Вот твой гайд - 22 страницы, четыре сценария перерыва ' +
      'и схемы первых недель под каждый.</p>' +
      '<p style="margin:0 0 26px">' +
        '<a href="' + PDF_URL + '" style="display:inline-block;background:#FF3B30;color:#fff;' +
        'text-decoration:none;font-weight:700;padding:14px 28px;border-radius:12px">' +
        'Скачать гайд (PDF)</a>' +
      '</p>' +
      '<p style="margin:0 0 18px">Начни с <b>части 3</b> - там четыре сценария. Найди свой ' +
      'и работай по нему, остальные читать необязательно.</p>' +
      '<p style="margin:0 0 22px">И одна просьба. Ответь на это письмо одним словом: ' +
      '<b>отпуск</b>, <b>болезнь</b>, <b>травма</b> или <b>выгорание</b>. Мне правда интересно, ' +
      'с чем чаще всего приходят, а тебе я смогу подсказать точнее.</p>' +
      '<p style="margin:0 0 4px;color:#635D57;font-size:14px">Инна Рыжих</p>' +
      '<p style="margin:0 0 4px;color:#635D57;font-size:14px">Тренер по бегу и триатлону</p>' +
      '<p style="margin:0;color:#635D57;font-size:14px">' +
        '<a href="' + PAGE_URL + '" style="color:#C9271D">innatri.com</a></p>' +
    '</div>';

  MailApp.sendEmail({
    to: email,
    subject: SUBJECT,
    body: plain,
    htmlBody: html,
    name: FROM_NAME
  });
}

function escape_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ---------- Уведомление в Telegram ---------- */
function notifyTelegram_(data, mailOk, errors) {
  if (TELEGRAM_BOT_TOKEN === 'TELEGRAM_BOT_TOKEN') return;
  var text = data.tg_text
    ? String(data.tg_text).slice(0, 3500)
    : ('Новый лид с гайда\n\nИмя: ' + (data.name || '—') + '\nПочта: ' + (data.email || '—'));
  if (!mailOk) text += '\n\n⚠️ ПИСЬМО НЕ УШЛО (' + errors.join('; ') + ') - отправь вручную';
  sendTg_(text);
}

function sendTg_(text) {
  UrlFetchApp.fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text }),
    muteHttpExceptions: true
  });
}

/* ---------- Проверка перед деплоем ----------
   Запусти эту функцию один раз из редактора Apps Script:
   она отправит тестовое письмо на твой же адрес и строку в таблицу.
   ------------------------------------------------ */
function testMe() {
  var me = Session.getActiveUser().getEmail();
  doPost({ postData: { contents: JSON.stringify({
    source: 'guide-vozvrashchenie',
    timestamp: new Date().toISOString(),
    name: 'Тест',
    email: me,
    lang: 'ru',
    referrer: 'test',
    userAgent: 'test',
    tg_text: '🧪 Тестовый лид с гайда'
  })}});
}
