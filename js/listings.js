/* GB Homes — listing cards, filters and detail dialog. */
(function () {
  "use strict";
  var F = window.GBFinance;
  var LISTINGS = window.GB_LISTINGS || [];

  var ICON = {
    bed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/></svg>',
    bath: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.7 3 4 3.7 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><path d="M2 12h20M7 19v2M17 19v2"/></svg>',
    car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2.7-3.4A2 2 0 0 0 13.7 6H8.3a2 2 0 0 0-1.6.8L4 10l-2.5 1.1C.7 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>'
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function priceText(l) { return l.price ? F.money(l.price) : "Contact for price"; }
  function place(l) { return [l.address, l.city, l.province].filter(Boolean).join(", "); }
  function photoUrl(p) { return /^https?:\/\//.test(p) ? p : "assets/listings/" + p; }
  function cover(l) {
    if (l.photos && l.photos.length) {
      return '<img src="' + esc(photoUrl(l.photos[0])) + '" alt="' + esc(l.title + " in " + l.city) + '" loading="lazy">';
    }
    return '<img src="assets/listings/placeholder.svg" alt="" loading="lazy">';
  }
  function meta(l) {
    var bits = [];
    if (l.beds) bits.push("<span>" + ICON.bed + l.beds + " bed</span>");
    if (l.baths) bits.push("<span>" + ICON.bath + l.baths + " bath</span>");
    if (l.parking) bits.push("<span>" + ICON.car + l.parking + " parking</span>");
    bits.push("<span>" + ICON.home + esc(l.type) + "</span>");
    return bits.join("");
  }
  function estPayment(l) {
    if (!l.price) return "";
    var down = Math.max(F.minDownPayment(l.price, true), l.price * 0.10);
    var ins = F.cmhcRate(l.price, down, 25) || 0;
    var pmt = F.paymentFor((l.price - down) * (1 + ins), 4.29, 25, "monthly");
    return '<p class="muted small" style="margin:0">Est. ' + F.money(pmt) + "/mo with 10% down at 4.29% over 25 years</p>";
  }

  function card(l) {
    return (
      '<article class="card listing-card reveal">' +
        '<div class="listing-media">' + cover(l) +
          '<span class="listing-badge' + (/sold|leased/i.test(l.status) ? " listing-badge--ink" : "") + '">' + esc(l.status) + "</span>" +
        "</div>" +
        '<div class="listing-body">' +
          '<div class="listing-price">' + priceText(l) + "</div>" +
          '<div class="listing-title">' + esc(l.title) + "</div>" +
          '<div class="muted small">' + esc(place(l)) + "</div>" +
          estPayment(l) +
          '<div class="listing-meta">' + meta(l) + "</div>" +
          '<div class="listing-actions">' +
            '<button class="btn btn--ink btn--sm" type="button" data-open="' + esc(l.id) + '">View details</button>' +
            '<a class="btn btn--ghost btn--sm" href="contact.html?listing=' + encodeURIComponent(l.id) + '">Book a showing</a>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function comingSoonCard() {
    return (
      '<article class="card coming-card reveal">' +
        '<span class="eyebrow">More coming soon</span>' +
        "<h3>Get new listings before they hit the big sites</h3>" +
        '<p class="muted">Tell me what you’re looking for and I’ll send you matching homes, including off-market and coming-soon properties.</p>' +
        '<a class="btn btn--red btn--sm" href="contact.html?topic=alerts">Get listing alerts</a>' +
      "</article>"
    );
  }

  function render(container, list, withComingSoon) {
    container.innerHTML = list.map(card).join("") + (withComingSoon ? comingSoonCard() : "");
    container.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-visible"); });
  }

  // ----- Detail dialog -----
  var dialog;
  function openDetail(id) {
    var l = LISTINGS.filter(function (x) { return x.id === id; })[0];
    if (!l) return;
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.className = "listing-dialog";
      dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
      document.body.appendChild(dialog);
    }
    var facts = [];
    if (l.beds) facts.push(["Bedrooms", l.beds]);
    if (l.baths) facts.push(["Bathrooms", l.baths]);
    if (l.parking) facts.push(["Parking", l.parking]);
    if (l.sqft) facts.push(["Size", l.sqft + " sq ft"]);
    facts.push(["Type", l.type]);
    if (l.mlsNumber) facts.push(["MLS®", l.mlsNumber]);

    var calcLink = l.price ? '<a class="btn btn--ghost btn--sm" href="mortgage-calculator.html?price=' + l.price + '">Calculate payment</a>' : "";
    dialog.innerHTML =
      '<button class="dialog-close" type="button" aria-label="Close">×</button>' +
      '<div class="dialog-inner">' +
        '<div class="listing-media">' + cover(l) + "</div>" +
        '<div class="dialog-content">' +
          '<span class="eyebrow">' + esc(l.status) + " · " + esc(l.city) + "</span>" +
          '<h2 style="font-size:1.6rem;margin-bottom:4px">' + esc(l.title) + "</h2>" +
          '<div class="listing-price" style="margin-bottom:6px">' + priceText(l) + "</div>" +
          '<p class="muted small">' + esc(place(l)) + "</p>" +
          "<p>" + esc(l.summary) + "</p>" +
          (l.highlights && l.highlights.length ? '<ul class="feature-list">' + l.highlights.map(function (h) { return "<li>" + esc(h) + "</li>"; }).join("") + "</ul>" : "") +
          '<table class="breakdown" style="margin-bottom:20px"><tbody>' +
            facts.map(function (f) { return "<tr><td>" + esc(f[0]) + "</td><td>" + esc(f[1]) + "</td></tr>"; }).join("") +
          "</tbody></table>" +
          (l.goodFor && l.goodFor.length ? '<p class="small muted">Good for: ' + l.goodFor.map(esc).join(" · ") + "</p>" : "") +
          '<div class="btn-row">' +
            '<a class="btn btn--red btn--sm" href="contact.html?listing=' + encodeURIComponent(l.id) + '">Book a showing</a>' + calcLink +
          "</div>" +
        "</div>" +
      "</div>";
    dialog.querySelector(".dialog-close").addEventListener("click", function () { dialog.close(); });
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute("open", "");
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-open]");
    if (btn) openDetail(btn.getAttribute("data-open"));
  });

  // ----- Listings page -----
  var grid = document.getElementById("listings-grid");
  var featured = document.getElementById("featured-listings");
  var filtersWired = false;

  function uniq(key) {
    return LISTINGS.map(function (l) { return l[key]; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; }).sort();
  }
  function fillOptions(sel, values) {
    var keep = sel.value;
    while (sel.options.length > 1) sel.remove(1);
    values.forEach(function (c) { sel.insertAdjacentHTML("beforeend", "<option>" + esc(c) + "</option>"); });
    if (values.indexOf(keep) !== -1) sel.value = keep;
  }

  function renderAll() {
    if (grid) {
      var fCity = document.getElementById("f-city");
      var fType = document.getElementById("f-type");
      var fBeds = document.getElementById("f-beds");
      var fStatus = document.getElementById("f-status");
      var count = document.getElementById("listings-count");
      fillOptions(fCity, uniq("city"));
      fillOptions(fType, uniq("type"));
      var apply = function () {
        var list = LISTINGS.filter(function (l) {
          if (fCity.value && l.city !== fCity.value) return false;
          if (fType.value && l.type !== fType.value) return false;
          if (fBeds.value && (l.beds || 0) < +fBeds.value) return false;
          if (fStatus.value === "available" && /sold|leased/i.test(l.status)) return false;
          if (fStatus.value === "sold" && !/sold|leased/i.test(l.status)) return false;
          return true;
        });
        count.textContent = list.length === 1 ? "1 home" : list.length + " homes";
        render(grid, list, true);
      };
      if (!filtersWired) {
        [fCity, fType, fBeds, fStatus].forEach(function (el) { el.addEventListener("change", function () { apply(); }); });
        filtersWired = true;
      }
      grid._apply = apply;
      apply();
    }
    if (featured) {
      render(featured, LISTINGS.filter(function (l) { return l.featured; }).slice(0, 2), true);
    }
  }

  renderAll();
  var hash = grid && location.hash.slice(1);
  var opened = false;
  if (hash && LISTINGS.some(function (l) { return l.id === hash; })) { openDetail(hash); opened = true; }

  // ----- Supabase: replace the built-in list with the "listings" table -----
  if (window.GBDB && window.GBDB.enabled && (grid || featured)) {
    window.GBDB.select("listings", "published=eq.true&order=sort_order.asc,updated_at.desc").then(function (rows) {
      if (!rows || !rows.length) return; // empty table: keep the built-in list
      LISTINGS = rows.map(function (r) {
        return {
          id: r.id, status: r.status, type: r.type, title: r.title, address: r.address || "",
          city: r.city, province: r.province || "ON", price: r.price == null ? null : +r.price,
          beds: r.beds, baths: r.baths, parking: r.parking, sqft: r.sqft || "", mlsNumber: r.mls_number || "",
          photos: r.photos || [], featured: !!r.featured, goodFor: r.good_for || [],
          summary: r.summary || "", highlights: r.highlights || []
        };
      });
      window.GB_LISTINGS = LISTINGS;
      renderAll();
      if (hash && !opened && LISTINGS.some(function (l) { return l.id === hash; })) openDetail(hash);
      document.dispatchEvent(new CustomEvent("gb:listings", { detail: LISTINGS }));
    }).catch(function (e) { if (window.console) console.warn("Listings: using built-in list.", e); });
  }
})();
