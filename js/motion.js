/* GB Homes — motion and animation (GSAP + ScrollTrigger).
   - Hero entrance: headline words rise and sharpen in, then the text, buttons and calculator follow.
   - Scroll reveals: section headings, cards, steps and guide content fade up as they come into view.
   - Small extras: number count-ups, a progress line on "The process", gentle parallax on big photos,
     "magnetic" main buttons on computers, and a header shadow once you scroll.
   Everything is skipped for visitors who turn on "reduce motion" in their phone or computer settings,
   and the site still works normally if this file or GSAP fails to load. */
(function () {
  "use strict";
  var root = document.documentElement;
  var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function showAll() { root.classList.remove("motion"); }
  if (!gsap || !ScrollTrigger || reduce) { showAll(); return; }

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "power3.out", duration: 0.8 });
  root.classList.add("gsap-ready");

  var CLEAR = "transform,opacity,visibility,filter,transition";
  var desktop = window.matchMedia("(min-width: 901px)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  // Leave interactive tools alone: calculator panels, sticky sidebars, hidden tabs and pop-ups.
  function skip(el) { return !!el.closest(".calc, .toc, [hidden], dialog, .booking-embed"); }

  /* ---------- Split a heading into words (keeps links and coloured spans) ---------- */
  function splitWords(el) {
    if (!el || el.dataset.split) return [];
    el.dataset.split = "1";
    var words = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var outer = document.createElement("span");
            outer.className = "split-word";
            var inner = document.createElement("span");
            inner.className = "split-word__inner";
            inner.textContent = part;
            outer.appendChild(inner);
            frag.appendChild(outer);
            words.push(inner);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    })(el);
    return words;
  }

  /* ---------- Count a number up from zero, keeping its text around it ---------- */
  function countUp(el, opts) {
    opts = opts || {};
    var text = el.textContent;
    var m = text.match(/\d[\d,]*(\.\d+)?/);
    if (!m) return null;
    var target = parseFloat(m[0].replace(/,/g, ""));
    var decimals = m[1] ? m[1].length - 1 : 0;
    var before = text.slice(0, m.index), after = text.slice(m.index + m[0].length);
    var obj = { v: 0 };
    el.setAttribute("aria-label", text);
    var tween = gsap.to(obj, {
      v: target, duration: opts.duration || 1.4, ease: "power2.out", delay: opts.delay || 0,
      paused: !!opts.paused,
      onUpdate: function () {
        el.textContent = before + obj.v.toLocaleString("en-CA", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + after;
      },
      onComplete: function () { el.textContent = text; el.removeAttribute("aria-label"); }
    });
    return tween;
  }

  /* ---------- Header: soft shadow once the page scrolls ---------- */
  var header = $(".site-header");
  if (header) {
    ScrollTrigger.create({
      start: 8, end: "max",
      onToggle: function (self) { header.classList.toggle("is-scrolled", self.isActive); }
    });
  }

  /* ---------- Home hero entrance ---------- */
  var hero = $(".hero");
  if (hero) {
    var copy = $(".wrap > div", hero);
    var h1 = $("h1", hero);
    var words = splitWords(h1);
    var calcCard = $(".quick-calc", hero);
    var pay = $("#qc-pay");
    var tl = gsap.timeline({ defaults: { duration: 0.9, ease: "power3.out" } });

    gsap.set([copy, calcCard], { autoAlpha: 1 });
    tl.addLabel("start", 0.1)
      .from($(".eyebrow", hero), { autoAlpha: 0, y: 16, duration: 0.6 }, "start")
      .from(words, {
        autoAlpha: 0, yPercent: 60, rotation: 2,
        filter: desktop ? "blur(8px)" : "none",
        stagger: 0.06, duration: 1, clearProps: "filter"
      }, "start+=0.1")
      .from($(".lead", hero), { autoAlpha: 0, y: 20 }, "-=0.6")
      .from($$(".btn-row .btn", hero), { autoAlpha: 0, y: 18, stagger: 0.1, clearProps: "opacity,visibility" }, "-=0.55")
      .from($$(".hero-points li", hero), { autoAlpha: 0, x: -12, stagger: 0.08, duration: 0.6 }, "-=0.5")
      .from($(".hero-call", hero), { autoAlpha: 0, duration: 0.6 }, "-=0.4");

    if (calcCard) {
      tl.from(calcCard, {
        autoAlpha: 0, y: 40, scale: 0.97, duration: 1.1, ease: "expo.out", clearProps: CLEAR
      }, "start+=0.45");
      if (pay) {
        var payTween = countUp(pay, { paused: true, duration: 1.2 });
        if (payTween) {
          var touched = false;
          tl.add(function () { if (!touched) payTween.play(); }, "start+=0.8");
          // If the visitor moves a slider first, stop counting and show their real number.
          calcCard.addEventListener("input", function () {
            touched = true;
            payTween.kill();
            pay.removeAttribute("aria-label");
          }, { once: true, capture: true });
        }
      }
    }

    // The video settles in, then drifts slightly slower than the page as you scroll.
    var media = $(".hero-media", hero);
    if (media) {
      gsap.from(media, { scale: 1.12, duration: 2.6, ease: "power2.out" });
      if (desktop) {
        gsap.to(media, {
          yPercent: 14, ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true }
        });
      }
    }
  }

  /* ---------- Inner page header (photo banner) ---------- */
  var pageHero = $(".page-hero");
  if (pageHero) {
    var phWrap = $(".wrap", pageHero);
    var phH1 = $("h1", pageHero);
    var phWords = splitWords(phH1);
    gsap.set(phWrap, { autoAlpha: 1 });
    var ptl = gsap.timeline({ defaults: { duration: 0.85, ease: "power3.out" } });
    ptl.from($(".eyebrow", pageHero), { autoAlpha: 0, y: 14, duration: 0.6 }, 0.1)
      .from(phWords, {
        autoAlpha: 0, yPercent: 60, filter: desktop ? "blur(6px)" : "none",
        stagger: 0.05, duration: 0.9, clearProps: "filter"
      }, 0.2)
      .from($$(".wrap > *:not(.eyebrow):not(h1)", pageHero), { autoAlpha: 0, y: 18, stagger: 0.1, clearProps: CLEAR }, "-=0.55");

    if (desktop && pageHero.classList.contains("page-hero--photo")) {
      gsap.fromTo(pageHero, { backgroundPosition: "50% 40%" }, {
        backgroundPosition: "50% 65%", ease: "none",
        scrollTrigger: { trigger: pageHero, start: "top top", end: "bottom top", scrub: true }
      });
    }
  }
  showAll(); // hero content is now controlled by GSAP; safe to drop the pre-load hiding

  /* ---------- Scroll reveals ---------- */
  function batchReveal(elements, opts) {
    elements = elements.filter(function (el) { return !skip(el) && !el.dataset.revealed; });
    if (!elements.length) return;
    opts = opts || {};
    elements.forEach(function (el) { el.dataset.revealed = "1"; el.classList.add("is-pending"); });
    // Opacity (not visibility) so links and buttons can still be reached with the keyboard.
    gsap.set(elements, { opacity: 0, y: opts.y || 28, transition: "none" });
    function show(batch) {
      batch = batch.filter(function (el) { return el.classList.contains("is-pending"); });
      if (!batch.length) return;
      batch.forEach(function (el) { el.classList.remove("is-pending"); });
      gsap.to(batch, {
        opacity: 1, y: 0, duration: opts.duration || 0.85, ease: "power3.out",
        stagger: opts.stagger || 0.12, overwrite: true, clearProps: CLEAR
      });
    }
    ScrollTrigger.batch(elements, {
      start: "top 88%",
      once: true,
      interval: 0.08,
      onEnter: show,
      onEnterBack: show,
      onLeave: show // e.g. after jumping straight to a section further down
    });
  }
  // Someone tabbing through with the keyboard: show whatever they land on straight away.
  document.addEventListener("focusin", function (e) {
    var el = e.target.closest && e.target.closest(".is-pending");
    if (el) { el.classList.remove("is-pending"); gsap.to(el, { opacity: 1, y: 0, duration: 0.3, overwrite: true, clearProps: CLEAR }); }
  });

  // Section headings: eyebrow, then title, then intro text.
  $$(".section-head, .section .center, .section--tight .center").forEach(function (head) {
    if (skip(head)) return;
    var parts = $$(".eyebrow, h2, .lead, .btn", head);
    if (!parts.length) return;
    parts.forEach(function (p) { p.dataset.revealed = "1"; });
    gsap.from(parts, {
      opacity: 0, y: 22, stagger: 0.1, duration: 0.8, clearProps: CLEAR,
      scrollTrigger: { trigger: head, start: "top 85%", once: true }
    });
  });

  // Cards and grid items, staggered as each row arrives.
  batchReveal($$(".grid > *, .program-grid > *, .contact-grid > *, .stats > *"));
  batchReveal($$(".steps > .step"), { stagger: 0.15 });
  batchReveal($$(".about > *"), { y: 36, stagger: 0.18 });
  batchReveal($$(".cta-band, .download-bar, .filters, .callout, .checklist-card"));
  // Long guide pages: headings and paragraphs drift in gently.
  batchReveal($$(".prose > h2, .prose > h3, .prose > p, .prose > ul, .prose > ol, .prose > table, .prose > .card, .prose > details, .faq > *"), { y: 18, stagger: 0.06, duration: 0.7 });
  batchReveal($$(".reveal"));

  // About photo: slow zoom-out as it comes into view.
  var aboutImg = $(".about-photo img");
  if (aboutImg) {
    gsap.fromTo(aboutImg, { scale: 1.12 }, {
      scale: 1, ease: "none",
      scrollTrigger: { trigger: aboutImg, start: "top bottom", end: "bottom 40%", scrub: true }
    });
  }

  // Program amounts ($40,000, Up to $4,000 ...) count up when they appear.
  $$(".program .amount").forEach(function (el) {
    var t = countUp(el, { paused: true, duration: 1.3 });
    if (t) ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: function () { t.play(); } });
  });

  // "The process": a red line fills across the four steps as you scroll (computers and tablets).
  var steps = $(".steps");
  if (steps && desktop) {
    var line = document.createElement("div");
    line.className = "steps-line";
    line.setAttribute("aria-hidden", "true");
    line.innerHTML = "<span></span>";
    steps.appendChild(line);
    gsap.fromTo(line.firstChild, { scaleX: 0 }, {
      scaleX: 1, ease: "none",
      scrollTrigger: { trigger: steps, start: "top 80%", end: "bottom 55%", scrub: 0.6 }
    });
  }

  /* ---------- Listings drawn later (from the listings database or filters) ---------- */
  ["featured-listings", "listings-grid"].forEach(function (id) {
    var box = document.getElementById(id);
    if (!box || !window.MutationObserver) return;
    new MutationObserver(function () {
      var fresh = $$(":scope > *", box).filter(function (el) { return !el.dataset.revealed; });
      if (!fresh.length) return;
      var r = box.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        fresh.forEach(function (el) { el.dataset.revealed = "1"; });
        gsap.fromTo(fresh, { opacity: 0, y: 24, transition: "none" }, {
          opacity: 1, y: 0, duration: 0.6, stagger: 0.08, clearProps: CLEAR
        });
      } else {
        batchReveal(fresh);
      }
      ScrollTrigger.refresh();
    }).observe(box, { childList: true });
  });

  /* ---------- Magnetic main buttons (computers with a mouse only) ---------- */
  if (finePointer) {
    $$(".hero .btn, .cta-band .btn").forEach(function (btn) {
      btn.style.transition = "background .15s ease, color .15s ease, border-color .15s ease";
      var xTo = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3.out" });
      var yTo = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3.out" });
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.25);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
      });
      btn.addEventListener("pointerleave", function () { xTo(0); yTo(0); });
    });
  }

  /* ---------- Keep scroll positions right when the page changes size ---------- */
  var timer;
  function refreshSoon() { clearTimeout(timer); timer = setTimeout(function () { ScrollTrigger.refresh(); }, 150); }
  document.addEventListener("click", function (e) { if (e.target.closest("[role=tab], summary")) refreshSoon(); });
  document.addEventListener("toggle", refreshSoon, true);
  if (window.ResizeObserver) new ResizeObserver(refreshSoon).observe(document.body);
  window.addEventListener("load", refreshSoon);
})();
