/* PEUI advisor — one in-world voice, the family solicitor. Speech bubbles at
   the top of the relevant screen, each tied to a first occurrence (margin
   call, auction, rival offer, forced sale, succession, negative cash, era
   change, stretch deal). Each fires once per device (prefs). No generic tips. */
(function (root) {
  var PEUI = root.PEUI, h = PEUI.h, icon = PEUI.icon;
  function PE() { return root.PE; }
  function prefs() { var p = PEUI.prefs; if (!p.advisor) p.advisor = { seen: {} }; if (!p.advisor.seen) p.advisor.seen = {}; return p.advisor; }

  var A = PEUI.advisor = {};
  A.name = function () { var D = PE().Data; return (D && D.advisor && D.advisor.name) || 'Mr. Ashworth'; };
  A.PORTRAIT = 'assets/advisor.svg';

  /* Era voice: the same man, a little older each time. */
  function voice() {
    var s = PE().Game.state(), id = s ? s.eraId : 'victorian';
    if (id === 'victorian' || id === 'gilded') return 'victorian';
    if (id === 'crisis' || id === 'boom') return 'mid';
    return 'modern';
  }
  var LINES = {
    margin_call: {
      victorian: 'The bank has written, and banks do not write to enquire after one\'s health. Repay the shortfall this year or they will sell the building for you, badly.',
      mid: 'A margin call. The lender is within its rights and knows it. Find the shortfall this year; a forced sale fetches eighty-five pence in the pound.',
      modern: 'The covenant has tripped and the bank wants its loan-to-value back under eighty-five percent. Repay or sell on your own terms before they sell on theirs.'
    },
    auction: {
      victorian: 'An auction. Decide your ceiling before the first bid, write it down, and treat the rival\'s nod as a provocation rather than an argument.',
      mid: 'The room will warm up and so will you. Fix a ceiling now; the man who bids past his own appraisal has bought a lesson, not a building.',
      modern: 'Auctions are designed to make you feel the loss before you feel the price. Set a ceiling and let someone else overpay.'
    },
    rival_offer: {
      victorian: 'A rival wishes to buy one of yours. Flattering; also informative. Nobody offers a premium for a building they think is fairly priced.',
      mid: 'An offer on your property. Count what you keep after fees, tax and the mortgage, not the headline. Then ask why they want it.',
      modern: 'Someone has made an unsolicited offer. The number that matters is cash in hand after everything; the question that matters is what they know.'
    },
    covenant: {
      victorian: 'The bank has sold a building out from under us. I shall not say I warned you, as it would be in poor taste, and in any case I did.',
      mid: 'A forced sale. The lender took its money and left you the remainder. Two of these in two years and the house falls; keep cash against the next dip.',
      modern: 'The bank enforced the covenant and sold at a discount. One more inside two years ends the dynasty. Deleverage before the next downturn, not during it.'
    },
    succession: {
      victorian: 'My condolences, and my congratulations: the estate passes, the tax is paid, and the name continues. Your late parent\'s mortgages are now yours.',
      mid: 'A new head of the family. The estate tax has been settled; what remains is the portfolio and the reputation, both of which you inherit in full.',
      modern: 'The succession is complete. Estate tax is the one certainty in this business; a family trust halves it next time, if you set it up early.'
    },
    negative_cash: {
      victorian: 'We are overdrawn. Gentlemen may be overdrawn for a season; two years of it with nothing to sell and the house is bankrupt. Raise cash.',
      mid: 'Cash is below zero. Sell something, borrow against something, or cut the rents to fill the rooms. Two years in the red ends the game.',
      modern: 'Negative cash. The portfolio can be worth a fortune and still fail to pay the bills; liquidity is the whole game. Raise cash this year.'
    },
    era: {
      victorian: 'A new age, they say. New building types, new ways to borrow, the same arithmetic. Watch the base rate; it is the one number that moves everything.',
      mid: 'The era has turned. The skyline changes, the finance tools change, the crashes keep their appointments. Read the morning paper.',
      modern: 'Another era. The instruments are cleverer and the leverage is higher, which is to say the falls are further. The loop has not changed.'
    },
    stretch: {
      victorian: 'A stretch, this one. You could reach it with every penny and the bank\'s full seventy percent. Do so only if the rent covers the payment with room to spare.',
      mid: 'This one takes all your cash and all the bank will lend. It can be done; it cannot be undone cheaply. Check the rent against the payment first.',
      modern: 'A stretch deal: maximum leverage, no cushion. Fine in a rising market, fatal in a falling one. Decide which market you think this is.'
    }
  };

  var active = null; // { key, where, text }

  A.line = function (key) { var L = LINES[key]; if (!L) return null; return L[voice()] || L.victorian; };

  /* Fire once: returns true when the bubble became active. */
  A.trigger = function (key, where) {
    var p = prefs(); if (p.seen[key] || !LINES[key]) return false;
    p.seen[key] = PE().Game.state().year; PEUI.savePrefs();
    active = { key: key, where: where, text: A.line(key) };
    return true;
  };
  A.clear = function () { active = null; };
  A.pending = function (where) { return active && active.where === where ? active : null; };

  /* Report-driven firsts, in priority order; only one bubble per report. */
  A.onReport = function (r) {
    active = null;
    var s = PE().Game.state();
    if (r.succession && A.trigger('succession', 'report')) return;
    if (r.deals.some(function (d) { return d.kind === 'forced_sale'; }) && A.trigger('covenant', 'report')) return;
    if (r.warnings.some(function (w) { return w.indexOf('margin_call') === 0; }) && A.trigger('margin_call', 'report')) return;
    if (r.warnings.indexOf('negative_cash') >= 0 && A.trigger('negative_cash', 'report')) return;
    if (r.eraChanged && A.trigger('era', 'report')) return;
    if (s && s.offers.length && A.trigger('rival_offer', 'portfolio')) return;
  };

  /* The bubble itself. */
  A.mount = function (where) {
    var a = A.pending(where); if (!a) return null;
    var el = h('div', { class: 'advisor', role: 'note', 'aria-label': 'Your solicitor' });
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'advisor__portrait'); svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', A.PORTRAIT + '#advisor'); use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', A.PORTRAIT + '#advisor');
    svg.appendChild(use); el.appendChild(svg);
    var bubble = h('div', { class: 'advisor__bubble' });
    bubble.appendChild(h('div', { class: 'advisor__name', text: A.name() + ', solicitor' }));
    bubble.appendChild(h('p', { class: 'advisor__text', text: a.text }));
    el.appendChild(bubble);
    el.appendChild(PEUI.btn('', { cls: 'btn--ghost btn-icon advisor__close', icon: 'close', action: 'advisor-dismiss', ariaLabel: 'Dismiss' }));
    return el;
  };
  PEUI.actions['advisor-dismiss'] = function (b) {
    active = null;
    var el = b.parentNode; if (el && el.parentNode) el.parentNode.removeChild(el);
  };
})(window);
