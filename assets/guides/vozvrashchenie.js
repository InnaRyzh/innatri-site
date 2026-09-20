/* ============================================================
   Лендинг гайда «Возвращение после перерыва».
   Формы нет: гайд отдаётся по кнопке сразу.
   Просмотр фрагментов и события Google Analytics.
   ============================================================ */
(function () {
  function track(name, label) {
    if (typeof gtag === 'function') {
      gtag('event', name, { event_category: 'guide', event_label: label });
    }
  }

  document.querySelectorAll('a[href$=".pdf"], a[href*=".pdf?"]').forEach(function (a, i) {
    a.addEventListener('click', function () {
      track('file_download', 'vozvrashchenie' + (i === 0 ? '-hero' : '-repeat'));
    });
  });

  var ig = document.getElementById('f-ig');
  var tg = document.getElementById('f-tg');
  if (ig) ig.addEventListener('click', function () { track('follow_click', 'instagram'); });
  if (tg) tg.addEventListener('click', function () { track('follow_click', 'telegram'); });

  var dialog = document.querySelector('.preview-dialog');
  var previews = Array.from(document.querySelectorAll('.page-preview'));
  if (!dialog || !previews.length) return;
  var current = 0;
  var opener;
  var image = document.getElementById('preview-image');
  var title = document.getElementById('preview-title');
  var count = document.getElementById('preview-count');

  function show(index) {
    current = (index + previews.length) % previews.length;
    var preview = previews[current];
    var original = preview.querySelector('img');
    image.src = original.src;
    image.alt = original.alt;
    title.textContent = 'Страница ' + preview.dataset.page + ' из 46';
    count.textContent = (current + 1) + ' / ' + previews.length;
    dialog.querySelector('.dialog-scroll').scrollTop = 0;
  }
  previews.forEach(function (preview, index) {
    preview.addEventListener('click', function () {
      opener = preview;
      show(index);
      dialog.showModal();
      document.body.classList.add('preview-open');
      track('guide_preview', 'page-' + preview.dataset.page);
    });
  });
  document.getElementById('preview-close').addEventListener('click', function () { dialog.close(); });
  document.getElementById('preview-prev').addEventListener('click', function () { show(current - 1); });
  document.getElementById('preview-next').addEventListener('click', function () { show(current + 1); });
  dialog.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(current + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  dialog.addEventListener('click', function (event) {
    if (event.target !== dialog) return;
    var rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', function () {
    document.body.classList.remove('preview-open');
    if (opener) opener.focus({ preventScroll: true });
  });
})();
