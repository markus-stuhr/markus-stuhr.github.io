// Zentrales Tracking für markusstuhr.de – GoatCounter (cookielos, DSGVO-freundlich)
// Änderungen hier wirken auf allen Unterseiten.
(function () {
  var h = location.hostname;
  // Lokale Entwicklung nicht zählen
  if (h === 'localhost' || h === '127.0.0.1' || h === '' || h.endsWith('.local')) return;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', 'https://defill.goatcounter.com/count');
  document.head.appendChild(s);
})();
