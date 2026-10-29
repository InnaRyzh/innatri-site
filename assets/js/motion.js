/* Motion layer (29.10.2026).
   1. Blocks below the first screen enter once: heading, then text, then picture, 70 ms apart, 20 px rise.
   2. Signature move: the finish photo opens from a card to the full frame (full screen width on phones).
   Prices, buttons, forms, FAQ lists and article text never animate. Nothing runs with reduced motion or without
   IntersectionObserver, and nothing is hidden until this script has decided to animate it. */
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var SIGNATURE = '#about .about-img-wrap, .tp-why-photo';
  var TARGETS = 'h2, h3, p, ul, ol, blockquote, figure, .about-img-wrap, .stats-wrapper, .bento-card, ' +
    '.step-card, .review-card, .rn-card, .blog-card, .featured-article, .calc-promo, .contact-quiz';
  var SKIP = 'header, footer, nav, .hero, .mobile-menu, .lead-sticky, .header-island, form, ' +
    '[class*="price"], .tp-prices, .article-content, .calc-container, .marquee-section, .faq-item, details, ' + SIGNATURE;
  var STEP = 70, MAX_STEPS = 5;

  function belowFold(el) { return el.getBoundingClientRect().top > window.innerHeight * 0.92; }

  var entrance = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      entrance.unobserve(el);
      el.classList.add('mv-in');
      el.addEventListener('transitionend', function done(ev) {
        if (ev.propertyName !== 'transform') return;
        el.removeEventListener('transitionend', done);
        el.classList.remove('mv-hide', 'mv-in');
        el.style.removeProperty('transition-delay');
      });
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

  document.querySelectorAll('main section, body > section, .run-section, .section').forEach(function (section) {
    if (section.closest(SKIP)) return;
    var step = 0;
    section.querySelectorAll(TARGETS).forEach(function (el) {
      if (el.closest(SKIP)) return;
      var outer = el.parentElement && el.parentElement.closest(TARGETS);
      if (outer && section.contains(outer)) return;      // animate the outermost block only
      if (el.classList.contains('mv-hide') || !belowFold(el)) return;
      el.classList.add('mv-hide');
      el.style.transitionDelay = Math.min(step, MAX_STEPS) * STEP + 'ms';
      step++;
      entrance.observe(el);
    });
  });

  var signature = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      signature.unobserve(e.target);
      e.target.classList.add('mv-open');
    });
  }, { threshold: 0.3 });

  document.querySelectorAll(SIGNATURE).forEach(function (el) {
    if (!belowFold(el)) return;
    el.classList.add('mv-sig');
    signature.observe(el);
  });
})();
