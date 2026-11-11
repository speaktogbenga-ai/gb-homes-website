/* GB Homes — mortgage calculator page (payment, affordability, closing costs). */
(function () {
  "use strict";
  var F = window.GBFinance, num = window.GBUI.num, money = F.money;
  function $(id) { return document.getElementById(id); }
  function fmtInput(el) {
    var v = num(el);
    var pos = el.selectionStart, len = el.value.length;
    el.value = v ? Math.round(v).toLocaleString("en-CA") : el.value.replace(/[^\d]/g, "");
    if (document.activeElement === el && pos != null) {
      var p = Math.max(0, pos + (el.value.length - len));
      try { el.setSelectionRange(p, p); } catch (e) { /* ignore */ }
    }
  }
  function setMoney(el, v) { el.value = Math.round(v).toLocaleString("en-CA"); }
  function notice(kind, html) { return '<div class="notice notice--' + kind + '">' + html + "</div>"; }

  // ---------- Tabs ----------
  var tabs = document.querySelectorAll('[role="tab"]');
  function showTab(id, push) {
    tabs.forEach(function (t) {
      var on = t.getAttribute("aria-controls") === id;
      t.setAttribute("aria-selected", on ? "true" : "false");
      $(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (push) history.replaceState(null, "", "#" + id);
  }
  tabs.forEach(function (t) {
    t.addEventListener("click", function () { showTab(t.getAttribute("aria-controls"), true); });
  });
  window.addEventListener("hashchange", function () {
    var h = location.hash.slice(1);
    if ($(h) && $(h).getAttribute("role") === "tabpanel") showTab(h, false);
  });

  // ---------- Payment ----------
  var pPrice = $("p-price"), pDown = $("p-down"), pRange = $("p-down-range"), pRate = $("p-rate"),
      pTerm = $("p-term"), pAmort = $("p-amort"), pFreq = $("p-freq"), pFtb = $("p-ftb");
  Object.keys(F.FREQUENCIES).forEach(function (k) {
    pFreq.insertAdjacentHTML("beforeend", '<option value="' + k + '">' + F.FREQUENCIES[k].label + "</option>");
  });

  function drawChart(rows, termYears) {
    var svg = $("p-chart");
    var W = 640, H = 220, L = 62, R = 10, T = 10, B = 28;
    var max = rows.length ? rows[0].balance + rows[0].principal : 1;
    var n = rows.length;
    var x = function (i) { return L + (i / n) * (W - L - R); };
    var y = function (v) { return T + (1 - v / max) * (H - T - B); };
    var pts = [[x(0), y(max)]].concat(rows.map(function (r, i) { return [x(i + 1), y(r.balance)]; }));
    var line = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
    var area = line + " L" + x(n).toFixed(1) + " " + y(0) + " L" + x(0) + " " + y(0) + " Z";
    var grid = "";
    for (var g = 0; g <= 4; g++) {
      var v = (max * g) / 4;
      grid += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#e6e3df"/>' +
        '<text x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end" font-size="11" fill="#5f6368">' +
        (v >= 1e6 ? "$" + (v / 1e6).toFixed(1) + "M" : "$" + Math.round(v / 1000) + "k") + "</text>";
    }
    var ticks = "";
    var step = n > 20 ? 5 : n > 10 ? 2 : 1;
    for (var t = 0; t <= n; t += step) {
      ticks += '<text x="' + x(t) + '" y="' + (H - 8) + '" text-anchor="' + (t === 0 ? "start" : t + step > n ? "end" : "middle") + '" font-size="11" fill="#5f6368">' + (t === 0 ? "Now" : "Yr " + t) + "</text>";
    }
    var term = termYears <= n
      ? '<line x1="' + x(termYears) + '" x2="' + x(termYears) + '" y1="' + T + '" y2="' + y(0) + '" stroke="#111" stroke-dasharray="4 4"/>' +
        '<text x="' + (x(termYears) + 6) + '" y="' + (T + 12) + '" font-size="11" fill="#111" font-weight="600">Renewal</text>'
      : "";
    svg.innerHTML = grid +
      '<path d="' + area + '" fill="#e52020" fill-opacity="0.10"/>' +
      '<path d="' + line + '" fill="none" stroke="#e52020" stroke-width="2.5"/>' + term + ticks;
  }

  var lastEdited = "pct";
  function updatePayment() {
    var price = num(pPrice);
    var ftb = pFtb.checked;
    if (lastEdited === "pct") setMoney(pDown, price * (+pRange.value / 100));
    var down = Math.min(num(pDown), price);
    var downPct = price ? (down / price) * 100 : 0;
    if (lastEdited !== "pct") pRange.value = Math.min(50, Math.max(5, downPct));
    var rate = num(pRate);
    var amort = +pAmort.value;
    var freq = pFreq.value;
    var term = +pTerm.value;
    var minDown = F.minDownPayment(price, true);
    var notices = [];

    $("p-down-pct").textContent = downPct.toFixed(1) + "% down";
    $("p-down-min").textContent = "Minimum for this price: " + money(minDown);

    if (price <= 0) { $("p-payment").textContent = "—"; return; }
    if (down < minDown - 0.5) {
      notices.push(notice("red", "<strong>Down payment too low.</strong> At " + money(price) + " the minimum is " + money(minDown) +
        (price >= 1500000 ? " (20% for homes $1.5M and up)." : " (5% of the first $500,000 and 10% of the rest).")));
    }
    var ins = F.cmhcRate(price, down, amort);
    if (ins !== null && amort > 25 && !ftb) {
      notices.push(notice("warn", "With less than 20% down, a 30-year amortization is only allowed for first-time buyers or new builds. Showing 25 years instead."));
      amort = 25;
      ins = F.cmhcRate(price, down, amort);
    }
    var premium = ins ? (price - down) * ins : 0;
    var loan = price - down + premium;
    if (ins) {
      notices.push(notice("info", "With under 20% down you need mortgage default insurance. The premium of " + money(premium) +
        " (" + (ins * 100).toFixed(2) + "%) is added to your mortgage. Ontario also charges 8% PST on it (" + money(premium * 0.08) + "), paid in cash at closing."));
    }

    var s = F.schedule(loan, rate, amort, freq);
    var f = F.FREQUENCIES[freq];
    var termInt = s.rows.slice(0, term).reduce(function (a, r) { return a + r.interest; }, 0);
    var renew = s.rows[Math.min(term, s.rows.length) - 1];

    $("p-freq-label").textContent = f.label + " payment";
    $("p-payment").textContent = money(s.payment, 2);
    $("p-sub").textContent = money(loan) + " mortgage at " + rate + "% · " + amort + "-year amortization";
    $("p-loan").textContent = money(loan);
    $("p-cmhc").textContent = premium ? money(premium) : "Not needed";
    $("p-term-int").textContent = money(termInt);
    $("p-renew").textContent = money(renew ? renew.balance : 0);
    $("p-total-int").textContent = money(s.totalInterest);
    var yrs = Math.floor(s.payoffYears), mos = Math.round((s.payoffYears - yrs) * 12);
    if (mos === 12) { yrs++; mos = 0; }
    $("p-payoff").textContent = yrs + " yrs" + (mos ? " " + mos + " mo" : "");
    if (f.accelerated) {
      var normal = F.schedule(loan, rate, amort, "monthly");
      notices.push(notice("ok", "Accelerated payments save about <strong>" + money(normal.totalInterest - s.totalInterest) +
        "</strong> in interest and pay off your mortgage around " + (amort - s.payoffYears).toFixed(1) + " years sooner than monthly payments."));
    }
    $("p-notices").innerHTML = notices.join("");

    var tot = loan + s.totalInterest;
    $("p-bar-prin").style.width = (loan / tot) * 100 + "%";
    $("p-bar-int").style.width = (s.totalInterest / tot) * 100 + "%";
    $("p-leg-prin").textContent = money(loan);
    $("p-leg-int").textContent = money(s.totalInterest);

    drawChart(s.rows, term);
    $("p-table").innerHTML = s.rows.map(function (r) {
      return '<tr' + (r.year === term ? ' class="term-end"' : "") + "><td>" + r.year + "</td><td>" + money(r.principal) +
        "</td><td>" + money(r.interest) + "</td><td>" + money(r.balance) + "</td></tr>";
    }).join("");

    // keep closing-cost tab in sync
    setMoney($("c-price"), price); setMoney($("c-down"), down); $("c-ftb").checked = ftb;
    updateClosing();
  }

  pPrice.addEventListener("input", function () { fmtInput(pPrice); updatePayment(); });
  pDown.addEventListener("input", function () { fmtInput(pDown); lastEdited = "amount"; updatePayment(); });
  pRange.addEventListener("input", function () { lastEdited = "pct"; updatePayment(); });
  [pRate, pTerm, pAmort, pFreq, pFtb].forEach(function (el) { el.addEventListener("input", updatePayment); el.addEventListener("change", updatePayment); });

  // ---------- Affordability ----------
  var aIds = ["a-income", "a-down", "a-debts", "a-rate", "a-amort", "a-tax", "a-heat", "a-condo", "a-ftb"];
  function updateAfford() {
    var o = {
      income: num($("a-income")), down: num($("a-down")), debts: num($("a-debts")), rate: num($("a-rate")),
      amortYears: +$("a-amort").value, taxRatePct: num($("a-tax")), heat: num($("a-heat")), condo: num($("a-condo")),
      firstTime: $("a-ftb").checked
    };
    var r = F.affordability(o);
    var notes = [];
    $("a-max").textContent = r.maxPrice ? money(r.maxPrice) : "—";
    $("a-sub").textContent = r.maxPrice ? "With " + money(Math.min(o.down, r.maxPrice)) + " down (" + F.pct(Math.min(o.down, r.maxPrice) / r.maxPrice) + ")" : "Enter your income to see an estimate";
    $("a-loan").textContent = money(r.loan || 0);
    $("a-pay").textContent = money(r.payment || 0);
    $("a-qrate").textContent = r.qualifyingRate ? r.qualifyingRate.toFixed(2) + "%" : "—";
    $("a-gds").textContent = F.pct(r.gds || 0);
    $("a-tds").textContent = F.pct(r.tds || 0);
    if (r.limitedBy === "down" && r.maxPrice) {
      notes.push(notice("warn", "Your <strong>down payment</strong> is what limits you here, not your income. Saving more, or using an FHSA or the RRSP Home Buyers’ Plan, would raise your maximum price."));
    }
    if (r.insRate) {
      notes.push(notice("info", "This includes CMHC insurance of " + (r.insRate * 100).toFixed(2) + "% added to the mortgage, because the down payment is under 20%."));
    }
    if (!o.firstTime && o.amortYears > 25 && r.insRate) {
      notes.push(notice("info", "Insured mortgages are capped at 25 years unless you’re a first-time buyer or buying a new build, so 25 years was used."));
    }
    $("a-notices").innerHTML = notes.join("");
    $("a-to-payment").dataset.price = r.maxPrice;
    $("a-to-payment").dataset.down = Math.min(o.down, r.maxPrice);
  }
  aIds.forEach(function (id) {
    var el = $(id);
    el.addEventListener("input", function () {
      if (el.tagName === "INPUT" && el.type !== "checkbox" && !/rate|tax/.test(id)) fmtInput(el);
      updateAfford();
    });
    el.addEventListener("change", updateAfford);
  });
  $("a-to-payment").addEventListener("click", function () {
    var b = $("a-to-payment");
    if (!+b.dataset.price) return;
    setMoney(pPrice, +b.dataset.price);
    setMoney(pDown, +b.dataset.down);
    lastEdited = "amount";
    pRate.value = $("a-rate").value;
    pAmort.value = $("a-amort").value;
    pFtb.checked = $("a-ftb").checked;
    updatePayment();
    showTab("payment", true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // ---------- Closing costs ----------
  var cIds = ["c-price", "c-down", "c-ftb", "c-toronto", "c-legal", "c-title", "c-inspect", "c-adjust"];
  function updateClosing() {
    var price = num($("c-price")), down = num($("c-down"));
    var ftb = $("c-ftb").checked, toronto = $("c-toronto").checked;
    var ltt = F.landTransferTax(price, { firstTime: ftb, toronto: toronto });
    var ins = F.cmhcRate(price, down, 25);
    var pst = ins ? (price - down) * ins * 0.08 : 0;
    var rows = [["Ontario land transfer tax", ltt.ontario]];
    if (ltt.ontarioRebate) rows.push(["Ontario first-time buyer refund", -ltt.ontarioRebate]);
    if (toronto) rows.push(["Toronto municipal land transfer tax", ltt.toronto]);
    if (ltt.torontoRebate) rows.push(["Toronto first-time buyer rebate", -ltt.torontoRebate]);
    if (pst) rows.push(["PST on CMHC insurance (8%)", pst]);
    rows.push(["Lawyer & disbursements", num($("c-legal"))]);
    rows.push(["Title insurance", num($("c-title"))]);
    rows.push(["Home inspection", num($("c-inspect"))]);
    rows.push(["Adjustments & misc.", num($("c-adjust"))]);
    var total = rows.reduce(function (a, r) { return a + r[1]; }, 0);
    $("c-table").innerHTML = rows.map(function (r) {
      return "<tr" + (r[1] < 0 ? ' class="minus"' : "") + "><td>" + r[0] + "</td><td>" + (r[1] < 0 ? "−" + money(-r[1]) : money(r[1])) + "</td></tr>";
    }).join("") +
      '<tr class="total"><td>Closing costs</td><td>' + money(total) + "</td></tr>" +
      "<tr><td>Down payment</td><td>" + money(down) + "</td></tr>" +
      '<tr class="total"><td>Total cash needed</td><td>' + money(total + down) + "</td></tr>";
    $("c-cash").textContent = money(total + down);
    $("c-sub").textContent = money(down) + " down payment + " + money(total) + " closing costs (" + (price ? ((total / price) * 100).toFixed(1) : 0) + "% of price)";
  }
  cIds.forEach(function (id) {
    var el = $(id);
    el.addEventListener("input", function () { if (el.type !== "checkbox") fmtInput(el); updateClosing(); });
    el.addEventListener("change", updateClosing);
  });

  // ---------- Initial state from URL ----------
  var q = new URLSearchParams(location.search);
  if (q.get("price")) setMoney(pPrice, +q.get("price"));
  if (q.get("down")) { setMoney(pDown, +q.get("down")); lastEdited = "amount"; }
  if (q.get("rate")) pRate.value = q.get("rate");
  if (q.get("amort")) pAmort.value = q.get("amort");
  if (!q.get("down")) {
    var pr = num(pPrice);
    pRange.value = Math.max(10, Math.ceil((F.minDownPayment(pr, true) / pr) * 200) / 2);
  }
  updatePayment();
  updateAfford();
  var h = location.hash.slice(1);
  if (h === "afford" || h === "closing") showTab(h, false);
})();
