/* ==========================================================================
   GB Homes — Canadian mortgage maths
   Pure functions, no DOM. Rules reflect federal and Ontario rules as of
   November 2026. Always confirm with a lender before relying on them.
   ========================================================================== */
(function (root) {
  "use strict";

  var FREQUENCIES = {
    monthly:            { label: "Monthly",                perYear: 12 },
    "semi-monthly":     { label: "Semi-monthly",           perYear: 24 },
    "bi-weekly":        { label: "Bi-weekly",              perYear: 26 },
    "accel-bi-weekly":  { label: "Accelerated bi-weekly",  perYear: 26, accelerated: 2 },
    weekly:             { label: "Weekly",                 perYear: 52 },
    "accel-weekly":     { label: "Accelerated weekly",     perYear: 52, accelerated: 4 }
  };

  /** Canadian fixed-rate mortgages compound semi-annually, not monthly. */
  function periodicRate(annualRatePct, perYear) {
    var r = annualRatePct / 100;
    return Math.pow(1 + r / 2, 2 / perYear) - 1;
  }

  /** Level payment for a loan of `principal` over `years` at `ratePct`. */
  function levelPayment(principal, ratePct, years, perYear) {
    if (principal <= 0) return 0;
    var n = Math.round(years * perYear);
    var i = periodicRate(ratePct, perYear);
    if (i === 0) return principal / n;
    return principal * i / (1 - Math.pow(1 + i, -n));
  }

  /** Payment for a given frequency, handling the "accelerated" options. */
  function paymentFor(principal, ratePct, years, freqKey) {
    var f = FREQUENCIES[freqKey] || FREQUENCIES.monthly;
    if (f.accelerated) {
      return levelPayment(principal, ratePct, years, 12) / f.accelerated;
    }
    return levelPayment(principal, ratePct, years, f.perYear);
  }

  /**
   * Year-by-year amortization schedule. Returns totals and the years it takes
   * to pay off (accelerated schedules finish early).
   */
  function schedule(principal, ratePct, years, freqKey) {
    var f = FREQUENCIES[freqKey] || FREQUENCIES.monthly;
    var pmt = paymentFor(principal, ratePct, years, freqKey);
    var i = periodicRate(ratePct, f.perYear);
    var balance = principal;
    var rows = [];
    var totalInterest = 0;
    var period = 0;
    var maxPeriods = Math.round(years * f.perYear) + f.perYear;
    for (var y = 1; balance > 0.005 && period < maxPeriods; y++) {
      var yInt = 0, yPrin = 0;
      for (var k = 0; k < f.perYear && balance > 0.005; k++) {
        var interest = balance * i;
        var prin = Math.min(pmt - interest, balance);
        balance -= prin;
        yInt += interest;
        yPrin += prin;
        period++;
      }
      totalInterest += yInt;
      rows.push({ year: y, interest: yInt, principal: yPrin, balance: Math.max(balance, 0) });
    }
    return {
      payment: pmt,
      periods: period,
      payoffYears: period / f.perYear,
      totalInterest: totalInterest,
      rows: rows
    };
  }

  /** Balance remaining after `termYears` (e.g. at renewal). */
  function balanceAfter(principal, ratePct, years, freqKey, termYears) {
    var s = schedule(principal, ratePct, years, freqKey);
    var row = s.rows[Math.min(termYears, s.rows.length) - 1];
    return row ? row.balance : principal;
  }

  /**
   * Minimum down payment in Canada (owner-occupied):
   *  5% of the first $500,000, 10% of the portion between $500,000 and $1.5M,
   *  20% at $1.5M and above. Rental (non-owner-occupied) properties: 20%.
   */
  function minDownPayment(price, ownerOccupied) {
    if (ownerOccupied === false) return price * 0.20;
    if (price >= 1500000) return price * 0.20;
    if (price <= 500000) return price * 0.05;
    return 25000 + (price - 500000) * 0.10;
  }

  /**
   * CMHC (default insurance) premium rate by loan-to-value.
   * Adds 0.20% when a 30-year amortization is used on an insured mortgage.
   * Returns null when insurance is not required, or not available (price >= $1.5M).
   */
  function cmhcRate(price, down, amortYears) {
    var ltv = (price - down) / price;
    if (price >= 1500000 || ltv <= 0.80) return null;
    var rate;
    if (ltv <= 0.85) rate = 0.028;
    else if (ltv <= 0.90) rate = 0.031;
    else rate = 0.040;
    if (amortYears > 25) rate += 0.002;
    return rate;
  }

  function bracketTax(value, brackets) {
    var tax = 0, prev = 0;
    for (var b = 0; b < brackets.length; b++) {
      var cap = brackets[b][0], rate = brackets[b][1];
      if (value > prev) tax += (Math.min(value, cap) - prev) * rate;
      prev = cap;
    }
    return tax;
  }

  // Ontario land transfer tax: residential with one or two single-family residences.
  var ON_LTT = [
    [55000, 0.005], [250000, 0.01], [400000, 0.015], [2000000, 0.02], [Infinity, 0.025]
  ];
  // City of Toronto municipal land transfer tax (luxury tiers from April 1, 2024).
  var TO_MLTT = [
    [55000, 0.005], [250000, 0.01], [400000, 0.015], [2000000, 0.02], [3000000, 0.025],
    [4000000, 0.035], [5000000, 0.045], [10000000, 0.055], [20000000, 0.065], [Infinity, 0.075]
  ];
  var ON_FTB_REFUND_MAX = 4000;
  var TO_FTB_REBATE_MAX = 4475;

  function landTransferTax(price, opts) {
    opts = opts || {};
    var ontario = bracketTax(price, ON_LTT);
    var toronto = opts.toronto ? bracketTax(price, TO_MLTT) : 0;
    var onRebate = opts.firstTime ? Math.min(ontario, ON_FTB_REFUND_MAX) : 0;
    var toRebate = opts.firstTime && opts.toronto ? Math.min(toronto, TO_FTB_REBATE_MAX) : 0;
    return {
      ontario: ontario,
      toronto: toronto,
      ontarioRebate: onRebate,
      torontoRebate: toRebate,
      total: ontario + toronto - onRebate - toRebate
    };
  }

  /** Federal mortgage stress test: the higher of contract rate + 2% or 5.25%. */
  function qualifyingRate(ratePct) {
    return Math.max(ratePct + 2, 5.25);
  }

  /**
   * Maximum purchase price someone qualifies for, using GDS 39% / TDS 44%
   * at the stress-test rate. Binary search over price.
   */
  function affordability(o) {
    var monthlyIncome = o.income / 12;
    var qRate = qualifyingRate(o.rate);
    function check(price) {
      var down = Math.min(o.down, price);
      var minDown = minDownPayment(price, true);
      if (down < minDown - 0.5) return { ok: false, reason: "down" };
      var amort = o.amortYears;
      var insRate = cmhcRate(price, down, amort);
      if (insRate === null && (price - down) / price > 0.8) return { ok: false, reason: "down" };
      if (insRate !== null && amort > 25 && !o.firstTime) amort = 25;
      var loan = (price - down) * (1 + (insRate || 0));
      var qPay = levelPayment(loan, qRate, amort, 12);
      var housing = qPay + (price * o.taxRatePct / 100) / 12 + o.heat + o.condo * 0.5;
      var gds = housing / monthlyIncome;
      var tds = (housing + o.debts) / monthlyIncome;
      return { ok: gds <= 0.39 && tds <= 0.44, gds: gds, tds: tds, loan: loan, insRate: insRate, amort: amort, reason: "ratio" };
    }
    var lo = 0, hi = 5000000, best = null;
    if (o.income <= 0) return { maxPrice: 0, limitedBy: "income" };
    for (var it = 0; it < 60; it++) {
      var mid = (lo + hi) / 2;
      var c = check(mid);
      if (c.ok) { lo = mid; best = c; } else { hi = mid; }
    }
    var price = Math.floor(lo / 1000) * 1000;
    var final = check(price);
    var limitedBy = "ratio";
    if (price > 0 && check(price + 5000).reason === "down") limitedBy = "down";
    return {
      maxPrice: price,
      loan: final.loan || 0,
      gds: final.gds || 0,
      tds: final.tds || 0,
      insRate: final.insRate,
      amort: final.amort,
      qualifyingRate: qRate,
      limitedBy: limitedBy,
      payment: levelPayment(final.loan || 0, o.rate, final.amort || o.amortYears, 12)
    };
  }

  function money(n, decimals) {
    if (!isFinite(n)) return "—";
    var d = decimals == null ? 0 : decimals;
    return n.toLocaleString("en-CA", { style: "currency", currency: "CAD", minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function pct(n, decimals) {
    if (!isFinite(n)) return "—";
    return (n * 100).toFixed(decimals == null ? 1 : decimals) + "%";
  }

  root.GBFinance = {
    FREQUENCIES: FREQUENCIES,
    periodicRate: periodicRate,
    levelPayment: levelPayment,
    paymentFor: paymentFor,
    schedule: schedule,
    balanceAfter: balanceAfter,
    minDownPayment: minDownPayment,
    cmhcRate: cmhcRate,
    landTransferTax: landTransferTax,
    qualifyingRate: qualifyingRate,
    affordability: affordability,
    money: money,
    pct: pct
  };
  if (typeof module !== "undefined") module.exports = root.GBFinance;
})(typeof window !== "undefined" ? window : globalThis);
