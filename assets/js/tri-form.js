/* Форма «Обсудить мой старт» на странице «Тренер по триатлону».
   Отправляет заявку туда же, куда и квиз: в Google Таблицу и Telegram Инны. */
(function () {
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbwlo6QLsbzaryUHIJnnyFhcLc0aY9lFc32cCQn6GDasYTbDf2-vYSLBSJYN_Qkt32TB/exec';
  var form = document.getElementById('tp-form');
  if (!form) return;
  var lang = form.getAttribute('data-lang') || 'ru';
  var done = form.parentNode.querySelector('.tp-form-done');
  var err = form.querySelector('.tp-form-error');

  function weeksTo(iso) {
    if (!iso) return '';
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return '';
    return Math.floor((d - new Date()) / 604800000);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements;
    var distance = f.distance.value, contact = f.contact.value.trim();
    if (!distance || !contact) { err.hidden = false; (distance ? f.contact : f.distance).focus(); return; }
    err.hidden = true;
    var raceDate = f.race_date.value, hours = f.hours.value.trim(), notes = f.notes.value.trim();
    var payload = {
      timestamp: new Date().toISOString(),
      name: '', contact: contact, city: '',
      zone: 'triathlon-page', segment: 'form',
      distance: distance, race_date: raceDate, weeks_to_race: weeksTo(raceDate),
      volume: hours ? hours + ' h/week' : '', current_training: notes,
      lang: lang, userAgent: navigator.userAgent,
      tg_text: ['Заявка со страницы «Тренер по триатлону» (' + lang + ')', '',
        'Дистанция: ' + distance,
        'Дата старта: ' + (raceDate || '-'),
        'Часов в неделю: ' + (hours || '-'),
        'Контакт: ' + contact,
        'О подготовке: ' + (notes || '-')].join('\n')
    };
    try {
      fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
        .catch(function () {});
    } catch (ignored) {}
    if (typeof gtag === 'function') gtag('event', 'generate_lead', { form: 'triathlon', distance: distance });
    form.hidden = true;
    done.hidden = false;
  });
})();
