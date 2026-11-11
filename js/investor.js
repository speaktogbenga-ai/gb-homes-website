/* GB Homes — rental property cash-flow calculator. */
(function () {
  "use strict";
  var F = window.GBFinance, num = window.GBUI.num, money = F.money;
  function $(id) { return document.getElementById(id); }
  if (!$("i-price")) return;
  var ids = ["i-price", "i-down", "i-rate", "i-amort", "i-occupied", "i-rent", "i-vacancy", "i-mgmt", "i-tax", "i-ins", "i-maint", "i-other"];
  var moneyIds = ["i-price", "i-rent", "i-tax", "i-ins", "i-other"];

  function setClass(box, good) {
    box.classList.remove("stat--good", "stat--bad");
    box.classList.add(good ? "stat--good" : "stat--bad");
  }

  function update() {
    var price = num($("i-price"));
    var ownerOcc = $("i-occupied").value === "yes";
    var downPct = num($("i-down")) / 100;
    var minDown = F.minDownPayment(price, ownerOcc);
    var down = price * downPct;
    var notes = [];
    if (down < minDown - 0.5) {
      notes.push('<div class="notice notice--red">' + (ownerOcc
        ? "Minimum down payment at this price is " + money(minDown) + "."
        : "Rental properties you won’t live in need at least <strong>20% down</strong>.") + "</div>");
    }
    var amort = +$("i-amort").value;
    var ins = ownerOcc ? F.cmhcRate(price, down, amort) : null;
    var loan = (price - down) * (1 + (ins || 0));
    var rate = num($("i-rate"));
    var mortgage = F.paymentFor(loan, rate, amort, "monthly");

    var rent = num($("i-rent"));
    var vacancy = rent * num($("i-vacancy")) / 100;
    var effRent = rent - vacancy;
    var mgmt = effRent * num($("i-mgmt")) / 100;
    var maint = rent * num($("i-maint")) / 100;
    var tax = num($("i-tax")) / 12, insr = num($("i-ins")) / 12, other = num($("i-other"));
    var opex = mgmt + maint + tax + insr + other;
    var noiM = effRent - opex;
    var cf = noiM - mortgage;

    var ltt = F.landTransferTax(price, {}).total;
    var cash = down + ltt + 3500 + (ins ? (price - down) * ins * 0.08 : 0);
    var sched = F.schedule(loan, rate, amort, "monthly");
    var equity1 = sched.rows[0] ? sched.rows[0].principal : 0;
    var cap = price ? (noiM * 12) / price : 0;
    var coc = cash ? (cf * 12) / cash : 0;
    var dscr = mortgage ? noiM / mortgage : 0;

    $("i-cf").textContent = (cf < 0 ? "−" : "") + money(Math.abs(cf));
    $("i-cf").style.color = cf >= 0 ? "#7ee2a8" : "#ff8a8a";
    $("i-sub").textContent = money(cf * 12) + " a year · mortgage " + money(mortgage) + "/mo on " + money(loan);
    $("i-cap").textContent = F.pct(cap, 2);
    $("i-coc").textContent = F.pct(coc, 1);
    $("i-dscr").textContent = dscr.toFixed(2);
    $("i-equity").textContent = money(equity1);
    $("i-total").textContent = cash ? F.pct((cf * 12 + equity1) / cash, 1) : "—";
    $("i-cash").textContent = money(cash);
    setClass($("i-cap-box"), cap >= 0.04);
    setClass($("i-coc-box"), coc >= 0);
    setClass($("i-dscr-box"), dscr >= 1);

    if (ownerOcc) {
      notes.push('<div class="notice notice--info">House hack: because you live there, you can buy with less than 20% down. Remember your own share of the space isn’t earning rent.</div>');
    }
    if (cf < 0 && rent > 0) {
      var v = num($("i-vacancy")) / 100, m = num($("i-mgmt")) / 100, mt = num($("i-maint")) / 100;
      var needed = (tax + insr + other + mortgage) / (1 - v - (1 - v) * m - mt);
      notes.push('<div class="notice notice--warn">This property loses money each month at these numbers. You’d need about <strong>' + money(needed) +
        "</strong> in monthly rent to break even, or a larger down payment, or a legal extra unit.</div>");
    }
    $("i-notices").innerHTML = notes.join("");

    var rows = [
      ["Rent", rent], ["Vacancy", -vacancy], ["Management", -mgmt], ["Maintenance & repairs", -maint],
      ["Property tax", -tax], ["Insurance", -insr], ["Other", -other]
    ].filter(function (r) { return r[1] !== 0 || r[0] === "Rent"; });
    $("i-table").innerHTML = rows.map(function (r) {
      return "<tr><td>" + r[0] + "</td><td>" + (r[1] < 0 ? "−" + money(-r[1]) : money(r[1])) + "</td></tr>";
    }).join("") +
      '<tr class="total"><td>Net operating income</td><td>' + money(noiM) + "</td></tr>" +
      "<tr><td>Mortgage payment</td><td>−" + money(mortgage) + "</td></tr>" +
      '<tr class="total"><td>Cash flow</td><td>' + (cf < 0 ? "−" : "") + money(Math.abs(cf)) + "</td></tr>";
  }

  ids.forEach(function (id) {
    var el = $(id);
    el.addEventListener("input", function () {
      if (moneyIds.indexOf(id) !== -1) {
        var v = num(el);
        el.value = v ? Math.round(v).toLocaleString("en-CA") : "";
      }
      update();
    });
    el.addEventListener("change", update);
  });
  $("i-occupied").addEventListener("change", function () {
    if ($("i-occupied").value === "no" && num($("i-down")) < 20) $("i-down").value = 20;
    update();
  });
  update();
})();
