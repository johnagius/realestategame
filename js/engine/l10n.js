/* PE.L10N — localisation scaffolding (P6.5).
   en-GB is the source of truth: English literals stay in the UI code and are
   passed as the fallback to PE.T(key, fallback); only other locales carry a
   dictionary. PE.setLocale(l) persists to localStorage (pe_v8_locale) and
   dispatches a 'pe:locale' event; PE.L10N.apply(rootEl) translates every
   [data-t] node (optional data-t-fallback attribute = the en-GB literal).
   PEUI.t is attached when PEUI exists so UI modules can label via PEUI.t('nav.deals','Deals').

   Wire-up still owed (not this file): the <script> tag after data.js in
   index.html, data-t attributes in js/ui/*, and full string extraction
   (see docs/l10n.md). */
(function (root) {
  var PE = root.PE = root.PE || {};

  var LOCALE_KEY = 'pe_v8_locale';
  var memLocale = null;
  function storeGet() {
    try { if (root.localStorage) return root.localStorage.getItem(LOCALE_KEY); } catch (e) {}
    return memLocale;
  }
  function storeSet(v) {
    memLocale = v;
    try { if (root.localStorage) { root.localStorage.setItem(LOCALE_KEY, v); return; } } catch (e) {}
  }

  /* Test locale fr — ~40 core strings: nav, HUD, settings, common actions, menu. */
  var fr = {
    'nav.deals': 'Affaires',
    'nav.city': 'Ville',
    'nav.portfolio': 'Patrimoine',
    'nav.dynasty': 'Dynastie',
    'nav.rivals': 'Rivaux',
    'hud.cash': 'Liquidités',
    'hud.net_worth': 'Valeur nette',
    'hud.end_year': 'Terminer l’année',
    'hud.year_menu': 'Menu de l’année',
    'settings.title': 'Réglages',
    'settings.sound': 'Son',
    'settings.quality': 'Qualité 3D',
    'settings.theme': 'Thème',
    'settings.guide': 'Guide des premières années',
    'settings.export': 'Exporter la sauvegarde (JSON)',
    'settings.import': 'Importer une sauvegarde',
    'settings.delete_save': 'Supprimer la sauvegarde',
    'settings.close': 'Fermer',
    'common.ok': 'OK',
    'common.cancel': 'Annuler',
    'common.close': 'Fermer',
    'common.confirm': 'Confirmer',
    'common.back': 'Retour',
    'common.buy': 'Acheter',
    'common.sell': 'Vendre',
    'common.save': 'Sauvegarder',
    'common.loading': 'Chargement…',
    'menu.continue': 'Continuer',
    'menu.new_game': 'Nouvelle dynastie',
    'menu.how_to_play': 'Comment jouer',
    'menu.settings': 'Réglages',
    'menu.challenge': 'Défi hebdomadaire',
    'menu.scenarios': 'Scénarios',
    'deals.title': 'Le marché',
    'deals.make_offer': 'Faire une offre',
    'deals.appraise': 'Estimer',
    'deals.auction': 'Enchères',
    'year.end_year': 'Terminer l’année',
    'year.report': 'Bilan de l’année',
    'year.skip_quiet': 'Passer les années calmes'
  };

  var L10N = PE.L10N = {
    LOCALE_KEY: LOCALE_KEY,
    locales: ['en-GB', 'fr'],
    dict: { 'fr': fr },

    locale: function () {
      var l = storeGet();
      return L10N.locales.indexOf(l) >= 0 ? l : 'en-GB';
    },
    /* Switch locale. Unknown locales are refused (returns false, current locale kept).
       Persists and broadcasts 'pe:locale' so views can re-render/translate. */
    setLocale: function (l) {
      if (L10N.locales.indexOf(l) < 0) return false;
      storeSet(l);
      attach();
      if (typeof root.dispatchEvent === 'function' && typeof root.CustomEvent === 'function') {
        try { root.dispatchEvent(new root.CustomEvent('pe:locale', { detail: { locale: l } })); } catch (e) {}
      }
      return true;
    },
    T: function (key, fallback) {
      var loc = L10N.locale();
      if (loc !== 'en-GB') {
        var d = L10N.dict[loc];
        if (d && Object.prototype.hasOwnProperty.call(d, key)) return d[key];
      }
      return fallback !== undefined ? fallback : key;
    },
    /* Translate every [data-t] node under rootEl (default document).
       data-t = key; optional data-t-fallback = the en-GB literal (keeps
       two-way switching exact; without it the current text is the fallback). */
    apply: function (rootEl) {
      if (!rootEl && typeof root.document !== 'undefined') rootEl = root.document;
      if (!rootEl || typeof rootEl.querySelectorAll !== 'function') return 0;
      var nodes = rootEl.querySelectorAll('[data-t]'), n = 0;
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i], key = node.getAttribute('data-t');
        if (!key) continue;
        var fb = node.getAttribute('data-t-fallback');
        if (fb === undefined || fb === null) fb = node.textContent;
        node.textContent = L10N.T(key, fb);
        n++;
      }
      return n;
    }
  };

  /* PE.T(key, fallback) and PE.setLocale / PE.locale are the engine-level surface. */
  PE.T = L10N.T;
  PE.setLocale = L10N.setLocale;
  PE.locale = L10N.locale;

  function attach() {
    if (root.PEUI && typeof root.PEUI === 'object' && root.PEUI.t !== PE.T) root.PEUI.t = PE.T;
  }
  L10N.attach = attach;
  attach();
  /* Re-translate the document on every locale switch when we own the DOM. */
  if (typeof root.addEventListener === 'function' && typeof root.document !== 'undefined') {
    try {
      root.addEventListener('pe:locale', function () { L10N.apply(root.document); });
    } catch (e) {}
  }
})(typeof window !== 'undefined' ? window : global);
