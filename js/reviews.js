/* GB Homes — Google reviews.
   Fills in the Google rating badges (hero, footer, contact page) and the
   "What clients say" section on the home page from js/reviews-data.js. */
(function () {
  "use strict";
  var R = window.GB_REVIEWS;
  if (!R || !R.reviews) return;

  var ALL_URL = "https://search.google.com/local/reviews?placeid=" + encodeURIComponent(R.placeId);
  var WRITE_URL = "https://search.google.com/local/writereview?placeid=" + encodeURIComponent(R.placeId);
  var G_ICON = '<svg class="g-icon" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  var STAR = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"/></svg>';

  function stars(n) {
    var out = "";
    for (var i = 1; i <= 5; i++) out += '<span class="' + (i <= Math.round(n) ? "on" : "off") + '">' + STAR + "</span>";
    return '<span class="g-stars" role="img" aria-label="' + n + ' out of 5 stars">' + out + "</span>";
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function cap(w) { return w ? w.charAt(0).toUpperCase() + w.slice(1) : ""; }
  // "Temilola Abiola Komolafe" -> "Temilola K."
  function shortName(full) {
    var parts = String(full).trim().split(/\s+/);
    var first = cap(parts[0]);
    return parts.length > 1 ? first + " " + parts[parts.length - 1].charAt(0).toUpperCase() + "." : first;
  }
  function paragraphs(text) {
    return text.split(/\n\s*\n/).map(function (p) { return "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>"; }).join("");
  }

  var rating = Number(R.rating).toFixed(1);
  var countLabel = R.count + " Google review" + (R.count === 1 ? "" : "s");

  /* ---------- Links ---------- */
  document.querySelectorAll("[data-review-link]").forEach(function (a) {
    a.href = a.getAttribute("data-review-link") === "write" ? WRITE_URL : ALL_URL;
    a.target = "_blank";
    a.rel = "noopener";
  });

  /* ---------- Rating badges ---------- */
  document.querySelectorAll("[data-google-badge]").forEach(function (el) {
    if (!el.getAttribute("href")) { el.href = ALL_URL; el.target = "_blank"; el.rel = "noopener"; }
    el.setAttribute("aria-label", "Rated " + rating + " out of 5 from " + countLabel);
    el.innerHTML = G_ICON + '<span class="g-badge__score">' + rating + "</span>" + stars(R.rating) +
      '<span class="g-badge__count">' + countLabel + "</span>";
  });
  document.querySelectorAll("[data-review-rating]").forEach(function (el) { el.textContent = rating; });
  document.querySelectorAll("[data-review-count]").forEach(function (el) { el.textContent = countLabel; });
  document.querySelectorAll("[data-review-stars]").forEach(function (el) { el.innerHTML = stars(R.rating); });

  /* ---------- Review cards (home page) ---------- */
  var grid = document.getElementById("reviews-grid");
  if (!grid) return;
  // Six reviews on computers, three on phones (the rest open with "Show all").
  var SHOW = window.matchMedia && window.matchMedia("(max-width: 640px)").matches ? 3 : 6;
  var list = R.reviews.filter(function (r) { return r.featured; })
    .concat(R.reviews.filter(function (r) { return !r.featured; }));

  grid.innerHTML = list.map(function (r, i) {
    var initial = esc(cap(r.name.trim().charAt(0)));
    return '<article class="card review-card"' + (i >= SHOW ? " hidden" : "") + ">" +
      '<div class="review-card__top">' + stars(r.stars) + G_ICON + "</div>" +
      '<div class="review-card__text">' + paragraphs(r.text) + "</div>" +
      '<button type="button" class="review-card__more" hidden aria-expanded="false">Read more</button>' +
      '<footer class="review-card__by"><span class="review-card__avatar" aria-hidden="true">' + initial + "</span>" +
      "<span><strong>" + esc(shortName(r.name)) + "</strong>" +
      (r.tag ? '<span class="review-card__tag">' + esc(r.tag) + "</span>" : "") + "</span></footer>" +
      "</article>";
  }).join("");

  // "Read more" only on reviews that are cut off.
  function setupMore(card) {
    var text = card.querySelector(".review-card__text");
    var btn = card.querySelector(".review-card__more");
    if (text.scrollHeight > text.clientHeight + 4) { btn.hidden = false; card.classList.add("is-clamped"); }
    btn.addEventListener("click", function () {
      var open = card.classList.toggle("is-open");
      btn.textContent = open ? "Show less" : "Read more";
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  var cards = Array.prototype.slice.call(grid.children);
  cards.forEach(function (c) { if (!c.hidden) setupMore(c); });

  var moreBtn = document.getElementById("reviews-more");
  var extra = cards.slice(SHOW);
  if (moreBtn && extra.length) {
    moreBtn.hidden = false;
    moreBtn.textContent = "Show all " + list.length + " reviews";
    moreBtn.addEventListener("click", function () {
      extra.forEach(function (c) { c.hidden = false; setupMore(c); });
      moreBtn.hidden = true;
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (window.gsap && !reduce) {
        window.gsap.fromTo(extra, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, ease: "power3.out", clearProps: "transform,opacity" });
      }
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      extra[0].setAttribute("tabindex", "-1");
      extra[0].focus({ preventScroll: true });
    });
  }
})();
