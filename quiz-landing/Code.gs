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

function notifyTelegram_(data) {
  if (TELEGRAM_BOT_TOKEN === 'TELEGRAM_BOT_TOKEN') return;

  var fire = data.segment === 'hot' ? ' 🔥' : '';
  var lines = [
    'Новый лид с квиза' + fire,
    '',
    'Имя: ' + (data.name || '—'),
    'Контакт: ' + (data.contact || '—'),
    'Город: ' + (data.city || '—'),
    '',
    'Зона: ' + (data.zone || '—'),
    'Сегмент: ' + (data.segment || '—') + fire,
    'Недель до старта: ' + (data.weeks_to_race != null ? data.weeks_to_race : '—'),
    'Объём: ' + (data.volume || '—'),
    'Цель: ' + (data.goal || '—') + (data.goal_time ? ' (' + data.goal_time + ')' : '')
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
