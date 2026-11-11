/* GB Homes — home page quick payment estimate. */
(function () {
  "use strict";
  var F = window.GBFinance, num = window.GBUI.num;
  var price = document.getElementById("qc-price");
  if (!price) return;
  var down = document.getElementById("qc-down");
  var rate = document.getElementById("qc-rate");
  var amort = document.getElementById("qc-amort");

  function update() {
    var p = +price.value;
    var minDown = F.minDownPayment(p, true);
    var minPct = Math.ceil((minDown / p) * 100);
    down.min = minPct;
    if (+down.value < minPct) down.value = minPct;
    var d = p * (+down.value / 100);
    var years = +amort.value;
    var ins = F.cmhcRate(p, d, years);
    var loan = (p - d) * (1 + (ins || 0));
    var pmt = F.paymentFor(loan, num(rate), years, "monthly");

    document.getElementById("qc-price-out").textContent = F.money(p);
    document.getElementById("qc-down-out").textContent = down.value + "% · " + F.money(d);
    document.getElementById("qc-pay").textContent = F.money(pmt);
    var note = "Mortgage of " + F.money(loan);
    if (ins) note += ", including " + F.money((p - d) * ins) + " CMHC insurance";
    if (ins && years > 25) note += ". 30-year insured mortgages are for first-time buyers and new builds";
    document.getElementById("qc-note").textContent = note + ".";
    document.getElementById("qc-more").href =
      "mortgage-calculator.html?price=" + p + "&down=" + Math.round(d) + "&rate=" + num(rate) + "&amort=" + years;
  }
  [price, down, rate, amort].forEach(function (el) { el.addEventListener("input", update); });
  update();
})();
