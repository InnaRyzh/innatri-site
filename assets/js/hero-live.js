/* Живой портрет на главной: сначала показано фото, видео грузится после
   загрузки страницы и плавно его подменяет. Не грузится при экономии
   трафика, медленной сети и «уменьшении движения»; вне экрана на паузе. */
(function () {
  var v = document.querySelector('.hero-video');
  if (!v) return;
  var c = navigator.connection || {};
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (c.saveData || /(^|-)(2g|3g)$/.test(c.effectiveType || '')) return;
  var fig = v.parentNode;
  function start() {
    // density capped at 2x: phones get the 720p file, retina desktops 1080p
    var w = fig.getBoundingClientRect().width * Math.min(window.devicePixelRatio || 1, 2);
    v.src = w > 900 ? v.getAttribute('data-src-lg') : v.getAttribute('data-src-sm');
    v.addEventListener('playing', function () { fig.classList.add('is-playing'); }, { once: true });
    var p = v.play(); if (p && p.catch) p.catch(function () {});
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { var q = v.play(); if (q && q.catch) q.catch(function () {}); } else v.pause();
      }).observe(fig);
    }
  }
  if (document.readyState === 'complete') setTimeout(start, 300);
  else window.addEventListener('load', function () { setTimeout(start, 300); });
})();
