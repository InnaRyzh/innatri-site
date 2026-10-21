/*
 * Автовыбор языковой версии innatri.com.
 *
 * Сайт статический (GitHub Pages), поэтому определение языка возможно
 * только на клиенте. Правила, в порядке важности:
 *
 * 1. Явный выбор человека сильнее всего. Клик по переключателю RU/UA/EN
 *    запоминается в localStorage и дальше уважается всегда — авторедирект
 *    никогда не спорит с человеком.
 * 2. Автоматика срабатывает только на русских страницах верхнего уровня
 *    и только один класс случаев: браузер явно украинский или английский.
 *    Русскоязычные браузеры и все прочие языки остаются на русской версии.
 * 3. Поисковые роботы не редиректятся: hreflang уже расставлен, пусть
 *    индексируют каждую версию по своему адресу.
 * 4. Прямые ссылки на /ua/ и /en/ всегда открываются как есть — человеку,
 *    которому прислали ссылку, не дёргают страницу из-под ног.
 */
(function () {
  'use strict';

  var KEY = 'innatri_lang';

  function savedPref() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function savePref(lang) {
    try { localStorage.setItem(KEY, lang); } catch (e) { /* приватный режим */ }
  }

  /* --- Запоминание явного выбора: клик по плашке RU / UA / EN --- */
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a') : null;
    if (!a) return;
    var label = (a.textContent || '').trim().toUpperCase();
    if (label === 'RU') savePref('ru');
    else if (label === 'UA') savePref('ua');
    else if (label === 'EN') savePref('en');
  }, true);

  /* --- Автоматический редирект --- */
  if (/bot|crawl|spider|slurp|bing|yandex|duckduck|baidu|lighthouse|headless/i
      .test(navigator.userAgent)) return;

  var path = location.pathname;
  if (/^\/(ua|en)(\/|$)/.test(path)) return; // уже на языковой версии

  // Только страницы, существующие во всех трёх версиях.
  var page = path.replace(/^\//, '');
  var MIRRORED = ['', 'index.html', 'blog.html', 'calculator.html',
    'contact.html', 'plans.html', 'pricing.html', 'reviews.html',
    'run.html', 'article.html'];
  if (MIRRORED.indexOf(page) === -1) return;

  var target = null;
  var pref = savedPref();
  if (pref === 'ru') return;
  if (pref === 'ua' || pref === 'en') {
    target = pref;
  } else if (pref) {
    return; // неизвестное значение — ничего не делаем
  } else {
    // Первый визит: смотрим языки браузера в порядке предпочтения
    // и решаем по первому знакомому.
    var langs = navigator.languages || [navigator.language || ''];
    for (var i = 0; i < langs.length; i++) {
      var l = String(langs[i]).toLowerCase();
      if (l.indexOf('ru') === 0) return;
      if (l.indexOf('uk') === 0) { target = 'ua'; break; }
      if (l.indexOf('en') === 0) { target = 'en'; break; }
    }
  }

  if (!target) return;
  location.replace('/' + target + '/' + page);
})();
