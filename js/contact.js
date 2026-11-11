/* GB Homes — contact form.
   If Supabase is set up (GB_CONFIG.supabaseUrl + supabaseAnonKey), each enquiry
   is saved to the "leads" table first.
   If GB_CONFIG.formEndpoint is set (e.g. a Formspree URL), the form posts there.
   Otherwise it opens the visitor's email app addressed to GB_CONFIG.email. */
(function () {
  "use strict";
  var form = document.getElementById("contact-form");
  if (!form) return;
  var cfg = window.GB_CONFIG || {};
  var status = document.getElementById("cf-status");
  var topic = document.getElementById("cf-topic");
  var msg = document.getElementById("cf-message");

  // Pre-fill from links like contact.html?listing=pickering-3-bed-semi or ?topic=investor
  var q = new URLSearchParams(location.search);
  if (q.get("topic") && topic.querySelector('option[value="' + q.get("topic") + '"]')) topic.value = q.get("topic");
  if (q.get("listing")) {
    var l = (window.GB_LISTINGS || []).filter(function (x) { return x.id === q.get("listing"); })[0];
    topic.value = "showing";
    var ask = function (l) { msg.value = "I’d like to book a showing for the " + l.title + " in " + l.city + (l.address ? " (" + l.address + ")" : "") + "."; };
    if (l) ask(l);
    else if (window.GBDB && window.GBDB.enabled) {
      window.GBDB.select("listings", "id=eq." + encodeURIComponent(q.get("listing"))).then(function (rows) {
        if (rows && rows[0] && !msg.value) ask(rows[0]);
      }).catch(function () {});
    }
  }

  function show(kind, html) { status.innerHTML = '<div class="notice notice--' + kind + '">' + html + "</div>"; }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = new FormData(form);
    if (data.get("_gotcha")) return;
    var name = String(data.get("name") || "").trim();
    var email = String(data.get("email") || "").trim();
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      show("red", "Please add your name and a valid email address.");
      return;
    }
    if (!document.getElementById("cf-consent").checked) {
      show("red", "Please tick the box so I can reply to you.");
      return;
    }
    var topicLabel = topic.options[topic.selectedIndex].text;
    var body =
      "Name: " + name + "\nEmail: " + email + "\nPhone: " + (data.get("phone") || "") +
      "\nInterested in: " + topicLabel + "\nTimeline: " + data.get("timeline") +
      "\nBudget: " + (data.get("budget") || "") + "\n\n" + (data.get("message") || "");

    var btn = form.querySelector('button[type="submit"]');
    var thanks = "<strong>Thanks, " + name.split(" ")[0] + "!</strong> Your message is on its way. I’ll be in touch within one business day.";

    // 1) Supabase: save the lead to your database (see supabase/schema.sql).
    var db = window.GBDB;
    if (db && db.enabled && !form.dataset.dbFailed) {
      btn.disabled = true;
      db.insert("leads", {
        name: name, email: email,
        phone: String(data.get("phone") || "").trim() || null,
        topic: topicLabel, timeline: String(data.get("timeline") || ""),
        budget: String(data.get("budget") || "").trim() || null,
        message: String(data.get("message") || "").trim() || null,
        listing_id: q.get("listing") || null,
        page: location.pathname + location.search
      }).then(function () {
        // Also send the email notification if a Formspree link is set.
        if (cfg.formEndpoint) fetch(cfg.formEndpoint, { method: "POST", body: data, headers: { Accept: "application/json" } }).catch(function () {});
        form.reset();
        show("ok", thanks);
      }).catch(function () {
        // Database unreachable: fall back to Formspree / email below.
        form.dataset.dbFailed = "1";
        form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true }));
      }).then(function () { btn.disabled = false; });
      return;
    }

    if (cfg.formEndpoint) {
      btn.disabled = true;
      fetch(cfg.formEndpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (r) {
          if (!r.ok) throw new Error("bad status");
          form.reset();
          show("ok", thanks);
        })
        .catch(function () {
          show("red", "Sorry, that didn’t send. Please try again" + (cfg.email ? ' or email <a href="mailto:' + cfg.email + '">' + cfg.email + "</a>" : "") + ".");
        })
        .then(function () { btn.disabled = false; });
      return;
    }

    if (cfg.email) {
      var url = "mailto:" + cfg.email + "?subject=" + encodeURIComponent("Website enquiry: " + topicLabel) + "&body=" + encodeURIComponent(body);
      window.location.href = url;
      show("ok", "Your email app should open with your message ready to send. If it doesn’t, email <a href=\"mailto:" + cfg.email + "\">" + cfg.email + "</a>.");
    } else {
      show("warn", "The contact form isn’t connected yet. Please reach out on Instagram for now.");
    }
  });
})();
