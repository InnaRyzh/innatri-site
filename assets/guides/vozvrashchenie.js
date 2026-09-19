/* ============================================================
   Лендинг гайда «Возвращение после перерыва».
   Формы нет: гайд отдаётся по кнопке сразу.
   Скрипт только считает события в Google Analytics.
   ============================================================ */
(function () {
  function track(name, label) {
    if (typeof gtag === 'function') {
      gtag('event', name, { event_category: 'guide', event_label: label });
    }
  }

  document.querySelectorAll('a[href$=".pdf"]').forEach(function (a, i) {
    a.addEventListener('click', function () {
      track('file_download', 'vozvrashchenie' + (i === 0 ? '-hero' : '-repeat'));
    });
  });

  var ig = document.getElementById('f-ig');
  var tg = document.getElementById('f-tg');
  if (ig) ig.addEventListener('click', function () { track('follow_click', 'instagram'); });
  if (tg) tg.addEventListener('click', function () { track('follow_click', 'telegram'); });
})();
