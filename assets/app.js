(function () {
  'use strict';

  // قائمة الجوّال
  var burger = document.querySelector('[data-burger]');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
  }

  // الخروج السريع: يستبدل الصفحة الحالية بموقع محايد بلا ما يخلّي أثراً في زرّ الرجوع
  function quickExit() {
    try { window.location.replace('https://www.google.com/search?q=meteo'); }
    catch (e) { window.location.href = 'https://www.google.com'; }
  }

  var exitBtn = document.querySelector('[data-quick-exit]');
  if (exitBtn) exitBtn.addEventListener('click', quickExit);

  // Échap ثلاث مرات في ظرف ثانيتين
  var taps = 0, timer = null;
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    taps++;
    clearTimeout(timer);
    timer = setTimeout(function () { taps = 0; }, 2000);
    if (taps >= 3) quickExit();
  });

  // طباعة النموذج
  var printBtn = document.querySelector('[data-print]');
  if (printBtn) printBtn.addEventListener('click', function () { window.print(); });
})();
