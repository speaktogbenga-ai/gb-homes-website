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

  // WhatsApp click-to-chat link (opens the app on phones, WhatsApp Web on computers)
  function waLink() {
    var num = String(cfg.whatsapp || "").replace(/\D/g, "");
    var msg = cfg.whatsappMessage ? "?text=" + encodeURIComponent(cfg.whatsappMessage) : "";
    return "https://wa.me/" + num + msg;
  }
  var WA_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.8h-.01a9.8 9.8 0 0 1-5-1.37l-.36-.21-3.72.98 1-3.63-.24-.37a9.8 9.8 0 0 1-1.5-5.22c0-5.42 4.41-9.83 9.84-9.83 2.63 0 5.1 1.03 6.95 2.88a9.77 9.77 0 0 1 2.88 6.96c0 5.42-4.42 9.83-9.84 9.83zm8.37-18.2A11.75 11.75 0 0 0 12.04.13C5.52.13.2 5.44.2 11.97c0 2.09.55 4.13 1.59 5.92L.1 24l6.27-1.64a11.82 11.82 0 0 0 5.66 1.44h.01c6.52 0 11.83-5.31 11.84-11.84 0-3.16-1.23-6.13-3.47-8.37z"/></svg>';
  document.querySelectorAll("[data-wa-icon]").forEach(function (el) { el.innerHTML = WA_ICON; });

  // Floating "Chat on WhatsApp" button on every page
  if (cfg.whatsapp && !document.querySelector(".wa-float")) {
    var wa = document.createElement("a");
    wa.className = "wa-float";
    wa.href = waLink();
    wa.target = "_blank";
    wa.rel = "noopener";
    wa.setAttribute("aria-label", "Chat with " + (cfg.agentName || "us") + " on WhatsApp");
    wa.innerHTML = WA_ICON + '<span class="wa-float__label">Chat on WhatsApp</span>';
    document.body.appendChild(wa);
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
    else if (key === "whatsapp") { el.href = waLink(); el.target = "_blank"; el.rel = "noopener"; }
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
