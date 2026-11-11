/* GB Homes — shared page behaviour: menu, contact details, scroll reveal. */
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");
  var cfg = window.GB_CONFIG || {};

  // Mobile menu
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Business details from js/config.js
  var REMIND = { brokerageName: "Brokerage name", registeredTitle: "Registered title" };
  document.querySelectorAll("[data-config]").forEach(function (el) {
    var key = el.getAttribute("data-config");
    var val = cfg[key];
    if (val) {
      el.textContent = key === "instagram" ? "@" + val : val;
    } else if (REMIND[key]) {
      el.innerHTML = '<span class="placeholder" title="Add this in js/config.js">' + REMIND[key] + "</span>";
    } else {
      var hideTarget = el.closest("[data-config-wrap]") || el;
      hideTarget.hidden = true;
    }
  });
  document.querySelectorAll("[data-config-href]").forEach(function (el) {
    var key = el.getAttribute("data-config-href");
    var val = cfg[key];
    var wrap = el.closest("[data-config-wrap]") || el;
    if (!val) { wrap.hidden = true; return; }
    if (key === "phone") el.href = "tel:" + val.replace(/[^\d+]/g, "");
    else if (key === "email") el.href = "mailto:" + val;
    else if (key === "instagram") el.href = "https://www.instagram.com/" + val + "/";
    else el.href = val;
  });

  // Home page background video
  var heroVideo = document.getElementById("hero-video");
  if (heroVideo && cfg.heroVideo) {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (cfg.heroPoster) heroVideo.poster = cfg.heroPoster;
    heroVideo.src = cfg.heroVideo;
    heroVideo.addEventListener("canplay", function () { heroVideo.classList.add("is-ready"); });
    if (!reduce) {
      heroVideo.autoplay = true;
      var p = heroVideo.play();
      if (p && p.catch) p.catch(function () { /* autoplay blocked: poster stays */ });
    } else {
      heroVideo.classList.add("is-ready");
    }
  }

  // Cloudflare Web Analytics (privacy-friendly, no cookies)
  if (cfg.cloudflareAnalyticsToken && !document.querySelector("script[data-cf-beacon]")) {
    var cf = document.createElement("script");
    cf.defer = true;
    cf.src = "https://static.cloudflareinsights.com/beacon.min.js";
    cf.setAttribute("data-cf-beacon", JSON.stringify({ token: cfg.cloudflareAnalyticsToken }));
    document.head.appendChild(cf);
  }

  // Footer year
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // Reveal on scroll
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && items.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // Guide table of contents: highlight the section in view
  var tocLinks = document.querySelectorAll(".toc a[href^='#']");
  if (tocLinks.length && "IntersectionObserver" in window) {
    var map = {};
    tocLinks.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var tio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          tocLinks.forEach(function (a) { a.classList.remove("is-active"); });
          var a = map[en.target.id];
          if (a) a.classList.add("is-active");
        }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    Object.keys(map).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) tio.observe(sec);
    });
  }

  // Shared helpers for page scripts
  window.GBUI = {
    num: function (el) {
      if (!el) return 0;
      var v = parseFloat(String(el.value).replace(/[^\d.\-]/g, ""));
      return isFinite(v) ? v : 0;
    },
    store: {
      get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
      set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
    }
  };
})();
