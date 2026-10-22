/* PEUI boot — wires HUD, nav, screens and the game lifecycle. */
(function (root) {
  var PEUI = root.PEUI;
  function PE() { return root.PE; }

  PEUI.enterGame = function () {
    var s = PE().Game.state(); if (!s) { PEUI.toast('No game loaded.', 'danger'); return; }
    if (PEUI.current === 'start' && PEUI.screens.start.unmount) PEUI.screens.start.unmount();
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('nav').classList.remove('hidden');
    if (!PEUI.prefs.gameStartedAt) { PEUI.prefs.gameStartedAt = Date.now(); PEUI.savePrefs(); }
    PEUI.render('deals');
    if (s.status === 'bankrupt' || s.status === 'ended') { PEUI.showEnd(); return; }
    if (s.auction) { var sm = PEUI.summary(); if (sm.auction) PEUI.openAuction(sm.auction, 'You left an auction open. Bid again or withdraw.'); return; }
    PEUI.showPendingEvent(function () { PEUI.refresh(); });
  };
  PEUI.leaveGame = function () {
    if (PEUI.sheet.isOpen()) PEUI.sheet.close();
    if (PEUI.destroyCity) PEUI.destroyCity();
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('nav').classList.add('hidden');
    var tc = document.getElementById('titlecard'); if (tc) tc.classList.remove('is-open');
    var rp = document.getElementById('report'); if (rp) rp.classList.remove('is-open');
    PEUI.render('start');
  };

  function boot() {
    PEUI.loadPrefs();
    PEUI.buildHUD(); PEUI.buildNav();
    if (root.AdManager && root.AdManager.init) { try { root.AdManager.init(); } catch (e) {} }
    PEUI.render('start');
    if ('serviceWorker' in navigator && location.protocol !== 'file:') { try { navigator.serviceWorker.register('sw.js').catch(function () {}); } catch (e) {} }
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') PEUI.save(); });
    root.addEventListener('pagehide', function () { PEUI.save(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window);
