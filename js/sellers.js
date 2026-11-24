/* GB Homes — seller page: net proceeds calculator and "What's my home worth?" form.
   The form saves each request to the Supabase "leads" table (topic "Home value estimate")
   and emails it through GB_CONFIG.formEndpoint, the same way the contact form does. */
(function () {
  "use strict";
  var cfg = window.GB_CONFIG || {};
  var num = window.GBUI.num;
  var F = window.GBFinance;
  function $(id) { return document.getElementById(id); }
  function money(n) { return F ? F.money(n) : "$" + Math.round(n).toLocaleString("en-CA"); }

  /* ---------- Net proceeds calculator ---------- */
  if ($("s-price")) {
    var ids = ["s-price", "s-mortgage", "s-comm", "s-penalty", "s-legal", "s-other"];
    var moneyIds = ["s-price", "s-mortgage", "s-penalty", "s-legal", "s-other"];
    var HST = 0.13;

    function update() {
      var price = num($("s-price"));
      var mortgage = num($("s-mortgage"));
      var commPct = num($("s-comm")) / 100;
      var comm = price * commPct;
      var hst = comm * HST;
      var penalty = num($("s-penalty"));
      var legal = num($("s-legal"));
      var other = num($("s-other"));
      var costs = comm + hst + penalty + legal + other;
      var net = price - mortgage - costs;

      $("s-net").textContent = (net < 0 ? "−" : "") + money(Math.abs(net));
      $("s-net").style.color = net >= 0 ? "#7ee2a8" : "#ff8a8a";
      $("s-sub").textContent = price
        ? "Selling costs about " + money(costs) + " (" + (costs / price * 100).toFixed(1) + "% of the price)"
        : "";

      var notes = [];
      if (net < 0 && price > 0) {
        notes.push('<div class="notice notice--warn">At these numbers the sale wouldn’t cover your mortgage and costs. Let’s talk before you list so we can plan for it.</div>');
      }
      $("s-notices").innerHTML = notes.join("");

      var rows = [
        ["Sale price", price],
        ["Mortgage payoff", -mortgage],
        ["Commission (" + (commPct * 100).toFixed(1).replace(/\.0$/, "") + "%)", -comm],
        ["HST on commission (13%)", -hst],
        ["Mortgage penalty", -penalty],
        ["Lawyer and mortgage discharge fees", -legal],
        ["Staging, repairs, moving", -other]
      ].filter(function (r) { return r[1] !== 0 || r[0] === "Sale price"; });
      $("s-table").innerHTML = rows.map(function (r) {
        return "<tr><td>" + r[0] + "</td><td>" + (r[1] < 0 ? "−" + money(-r[1]) : money(r[1])) + "</td></tr>";
      }).join("") + "<tr><td><strong>Money in your pocket</strong></td><td><strong>" + (net < 0 ? "−" : "") + money(Math.abs(net)) + "</strong></td></tr>";
    }

    ids.forEach(function (id) { $(id).addEventListener("input", update); });
    moneyIds.forEach(function (id) {
      $(id).addEventListener("blur", function () {
        var v = num(this);
        this.value = v ? Math.round(v).toLocaleString("en-CA") : "0";
      });
    });
    update();
  }

  /* ---------- What's my home worth? ---------- */
  var form = $("value-form");
  if (!form) return;
  var status = $("v-status");
  function show(kind, html) { status.innerHTML = '<div class="notice notice--' + kind + '">' + html + "</div>"; }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = new FormData(form);
    if (data.get("_gotcha")) return;
    var name = String(data.get("name") || "").trim();
    var email = String(data.get("email") || "").trim();
    var address = String(data.get("address") || "").trim();
    if (!address) { show("red", "Please add the property address."); return; }
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { show("red", "Please add your name and a valid email address."); return; }
    if (!$("v-consent").checked) { show("red", "Please tick the box so I can send you your estimate."); return; }

    var details = "Property: " + address + "\nType: " + data.get("property_type") + ", " + data.get("bedrooms") + " bedrooms";
    var note = String(data.get("message") || "").trim();
    var message = details + (note ? "\n\n" + note : "");
    var topic = "Home value estimate";
    var thanks = "<strong>Thanks, " + name.split(" ")[0] + "!</strong> I’ll look at recent sales near " + address.replace(/[<>&"]/g, "") +
      " and send your home value estimate within one business day.";
    var btn = form.querySelector('button[type="submit"]');

    function emailData() {
      var d = new FormData();
      d.set("name", name); d.set("email", email); d.set("phone", String(data.get("phone") || ""));
      d.set("topic", topic); d.set("address", address);
      d.set("property_type", String(data.get("property_type"))); d.set("bedrooms", String(data.get("bedrooms")));
      d.set("timeline", String(data.get("timeline"))); d.set("message", note);
      d.set("_subject", "Home value request: " + address + " from " + name);
      d.set("_replyto", email); d.set("_template", "table"); d.set("_captcha", "false");
      return d;
    }
    function sendEmail() {
      return fetch(cfg.formEndpoint, { method: "POST", body: emailData(), headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error("bad status"); });
    }
    function done() { form.reset(); show("ok", thanks); }
    function fail() {
      show("red", "Sorry, that didn’t send. Please try again" + (cfg.email ? ' or email <a href="mailto:' + cfg.email + '">' + cfg.email + "</a>" : "") + ".");
    }

    btn.disabled = true;
    var db = window.GBDB;
    var saved = db && db.enabled
      ? db.insert("leads", {
          name: name, email: email,
          phone: String(data.get("phone") || "").trim() || null,
          topic: topic, timeline: String(data.get("timeline") || ""),
          budget: null, message: message, listing_id: null,
          page: location.pathname + location.search
        }).then(function () { return true; }, function () { return false; })
      : Promise.resolve(false);

    saved.then(function (inDb) {
      if (cfg.formEndpoint) {
        // Saved to the database: send the email alert in the background.
        if (inDb) { sendEmail().catch(function () {}); done(); return; }
        return sendEmail().then(done, fail);
      }
      if (inDb) { done(); return; }
      if (cfg.email) {
        location.href = "mailto:" + cfg.email + "?subject=" + encodeURIComponent("Home value request: " + address) +
          "&body=" + encodeURIComponent("Name: " + name + "\nEmail: " + email + "\nPhone: " + (data.get("phone") || "") + "\nTimeline: " + data.get("timeline") + "\n\n" + message);
        show("ok", "Your email app should open with your request ready to send.");
      } else {
        show("warn", "The form isn’t connected yet. Please reach out on Instagram for now.");
      }
    }).then(function () { btn.disabled = false; });
  });
})();
