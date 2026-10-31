/* InnaTri book design (29.10.2026): the phone menu, the video player and the one-time entrance of section parts. */
(function () {
  var btn = document.querySelector('.menu-btn'), menu = document.getElementById('menu');
  if (btn && menu) {
    var closeBtn = menu.querySelector('.menu-close');
    function open() {
      menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
      document.documentElement.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
    }
    function close() {
      menu.hidden = true; btn.setAttribute('aria-expanded', 'false');
      document.documentElement.style.overflow = '';
      btn.focus();
    }
    btn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    menu.addEventListener('click', function (e) { if (e.target.closest('a[href^="#"], a[href*="/#"]')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) close(); });
  }

  /* video: a cover turns into the YouTube player on the click; chapters jump the player to their second */
  function player(id, start) {
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube.com/embed/' + id + '?rel=0&enablejsapi=1&autoplay=1' + (start ? '&start=' + start : '');
    f.title = 'YouTube'; f.allowFullscreen = true;
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    return f;
  }
  document.querySelectorAll('.vid-lite').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var box = document.createElement('div'); box.className = 'vid-frame';
      var f = player(a.dataset.yt); f.title = a.dataset.title || f.title;
      box.appendChild(f); a.replaceWith(box);
    });
  });
  document.querySelectorAll('.chapters a[data-t]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var f = document.querySelector('.vid-frame iframe');
      if (!f) return;
      e.preventDefault();
      var t = +a.dataset.t;
      f.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [t, true] }), '*');
      f.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
      f.closest('.vid-frame').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  /* parts of every section below the first screen enter once, 70 ms apart */
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var PARTS = 'h2, .lead, .enter';
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .1 });
  document.querySelectorAll('main > section:not(:first-child)').forEach(function (sec) {
    var step = 0;
    sec.querySelectorAll(PARTS).forEach(function (el) {
      if (el.closest('.in-hide') || el.getBoundingClientRect().top < innerHeight) return;
      el.classList.add('in-hide');
      el.style.transitionDelay = Math.min(step++, 4) * 70 + 'ms';
      io.observe(el);
    });
  });
})();
