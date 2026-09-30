/* Заявки: считаем в Google Analytics нажатия на контакты и показываем
   на телефоне кнопку «Написать», которая всегда под рукой. */
(function () {
  function track(name, params) {
    if (typeof gtag === 'function') gtag('event', name, params);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    var where = a.closest('.lead-sticky') ? 'sticky' : 'page';
    var method = /t\.me\//.test(href) ? 'telegram'
      : /wa\.me\/|whatsapp/.test(href) ? 'whatsapp'
      : /^mailto:/.test(href) ? 'email' : '';
    if (method) return track('contact_click', { method: method, link_location: where });
    if (/quiz-landing/.test(href)) return track('quiz_open', { link_location: where });
    if (/(^|\/)contact\.html/.test(href)) return track('contact_page_click', { link_location: where, link_text: a.textContent.trim().slice(0, 60) });
    if (/instagram\.com|youtube\.com/.test(href)) track('social_click', { network: /instagram/.test(href) ? 'instagram' : 'youtube' });
  });

  var body = document.body;
  var isSite = body.classList.contains('site-page') || document.getElementById('view-home');
  if (!isSite || body.classList.contains('page-contact')) return;

  var lang = (document.documentElement.lang || 'ru').slice(0, 2);
  var cfg = {
    en: ['/en/contact.html', 'Message the coach'],
    uk: ['/ua/contact.html', 'Написати тренерці'],
    ru: ['/contact.html', 'Написать тренеру']
  }[lang] || ['/contact.html', 'Написать тренеру'];

  var bar = document.createElement('div');
  bar.className = 'lead-sticky';
  bar.innerHTML = '<a href="' + cfg[0] + '">' + cfg[1] + ' <i class="ph ph-arrow-right" aria-hidden="true"></i></a>';
  body.appendChild(bar);

  var footerSeen = false;
  function update() {
    var on = window.scrollY > 600 && !footerSeen;
    bar.classList.toggle('is-on', on);
    body.classList.toggle('lead-sticky-on', on);
  }
  var footer = document.querySelector('footer');
  if (footer && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      footerSeen = entries[0].isIntersecting;
      update();
    }).observe(footer);
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();
