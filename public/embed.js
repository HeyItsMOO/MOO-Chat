/*!
 * ChatMOO — embed loader.
 * Usage on any website:
 *   <script src="https://app.yourdomain.com/embed.js" data-key="moo_xxx" async></script>
 *
 * This tiny loader figures out its own origin, reads the tenant key, and loads
 * the full widget. The heavy widget file is cached separately so this stays small.
 */
(function () {
  var me =
    document.currentScript ||
    (function () {
      var s = document.getElementsByTagName('script');
      return s[s.length - 1];
    })();
  if (!me) return;

  var key = me.getAttribute('data-key') || me.getAttribute('data-tenant') || '';
  if (!key) {
    console.warn('[ChatMOO] Missing data-key on the embed script tag.');
    return;
  }

  // Origin of this script = the app/API origin.
  var base;
  try {
    base = new URL(me.src).origin;
  } catch (e) {
    base = '';
  }

  window.MooChat = window.MooChat || {};
  window.MooChat.key = key;
  window.MooChat.base = base;

  if (window.MooChat.__loaded) return;
  window.MooChat.__loaded = true;

  var w = document.createElement('script');
  w.src = base + '/widget.js';
  w.async = true;
  document.head.appendChild(w);
})();
