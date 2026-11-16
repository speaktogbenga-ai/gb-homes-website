/* GB Homes — online booking calendar (Calendly) on the Contact page.
   Shows only when bookingUrl is filled in js/config.js. */
(function () {
  "use strict";
  var cfg = window.GB_CONFIG || {};
  var url = (cfg.bookingUrl || "").trim();
  var section = document.querySelector("[data-booking]");
  var box = document.getElementById("booking-embed");

  if (!url || !section || !box) return;

  section.hidden = false;
  document.querySelectorAll("[data-booking-jump]").forEach(function (a) {
    a.setAttribute("href", "#book");
    a.removeAttribute("target");
  });

  if (/^https:\/\/calendly\.com\//i.test(url)) {
    var full = url + (url.indexOf("?") > -1 ? "&" : "?") +
      "hide_gdpr_banner=1&primary_color=e52020&embed_domain=" + encodeURIComponent(location.hostname) + "&embed_type=Inline";
    var frame = document.createElement("iframe");
    frame.src = full;
    frame.title = "Book a time with Gbenga";
    frame.loading = "lazy";
    frame.setAttribute("frameborder", "0");
    box.appendChild(frame);
  } else {
    // Any other booking page (Google Calendar, etc.): show a button instead.
    box.innerHTML = '<p><a class="btn btn--red" target="_blank" rel="noopener" href="' +
      url.replace(/"/g, "&quot;") + '">Open my booking calendar</a></p>';
    box.classList.add("booking-embed--link");
  }

  if (location.hash === "#book") {
    setTimeout(function () { section.scrollIntoView(); }, 50);
  }
})();
