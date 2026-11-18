/* ==========================================================================
   GB Homes — "Download my analysis (PDF)" for the rental calculator on the
   Investors page. Reads what the visitor sees in the calculator and builds a
   branded PDF in the browser. Nothing is sent anywhere.
   The PDF library (js/vendor) is only loaded when the button is pressed.
   ========================================================================== */
(function () {
  "use strict";
  var btn = document.getElementById("dl-rental-pdf");
  if (!btn) return;
  var C = window.GB_CONFIG || {};
  var SITE = "gbluxuryhomes.ca";
  var RED = [229, 32, 32], INK = [17, 17, 17], MUTED = [95, 99, 104], LINE = [230, 227, 223], CREAM = [247, 245, 242];
  var GREEN = [26, 127, 55], BAD = [192, 32, 32];

  function $(id) { return document.getElementById(id); }
  // The built-in PDF fonts can't show a few typographic characters; swap them for plain ones.
  function clean(s) {
    return String(s == null ? "" : s)
      .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
      .replace(/[−–—]/g, "-").replace(/[  ]/g, " ")
      .replace(/·/g, "|").replace(/\s+/g, " ").trim();
  }
  function txt(id) { return clean($(id) ? $(id).textContent : ""); }
  function val(id) { return clean($(id) ? $(id).value : ""); }
  function sel(id) { var s = $(id); return s ? clean(s.options[s.selectedIndex].text) : ""; }
  function notices() {
    return Array.prototype.map.call(document.querySelectorAll("#i-notices .notice"), function (n) { return clean(n.textContent); });
  }
  function good(id) { var b = $(id); return b ? b.classList.contains("stat--good") : null; }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src; s.onload = resolve; s.onerror = function () { reject(new Error("Could not load " + src)); };
      document.head.appendChild(s);
    });
  }
  var libs;
  function loadLibs() {
    if (!libs) {
      libs = (window.jspdf ? Promise.resolve() : loadScript("js/vendor/jspdf.umd.min.js")).then(function () {
        return loadScript("js/vendor/jspdf.plugin.autotable.min.js");
      });
    }
    return libs;
  }
  function loadImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }

  function build(logo) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: "pt", format: "letter", compress: true });
    var W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
    var M = 40, CW = W - M * 2;
    var name = clean($("r-name") ? $("r-name").value : "");
    var address = clean($("r-address") ? $("r-address").value : "");
    var today = new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
    var y;

    function header() {
      if (logo) doc.addImage(logo, "PNG", M, 30, 176, 30);
      else { doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor.apply(doc, RED); doc.text("GB HOMES", M, 52); }
      doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor.apply(doc, INK);
      doc.text("Rental Property Analysis", W - M, 44, { align: "right" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor.apply(doc, MUTED);
      doc.text(today, W - M, 58, { align: "right" });
      doc.setDrawColor.apply(doc, RED); doc.setLineWidth(2); doc.line(M, 72, W - M, 72);
      return 92;
    }
    function ensure(space) {
      if (y + space > H - 70) { doc.addPage(); y = header(); }
    }
    function heading(t, room) {
      ensure(room || 150);
      doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor.apply(doc, INK);
      doc.text(t, M, y);
      doc.setFillColor.apply(doc, RED); doc.rect(M, y + 5, 28, 2.5, "F");
      y += 20;
    }
    var tableBase = {
      theme: "grid",
      margin: { left: M, right: M, top: 92, bottom: 70 },
      styles: { font: "helvetica", fontSize: 9.5, cellPadding: 5, textColor: INK, lineColor: LINE, lineWidth: 0.6 },
      headStyles: { fillColor: INK, textColor: [255, 255, 255], fontStyle: "bold" },
      didDrawPage: function () { header(); }
    };
    function bullets(list) {
      list.forEach(function (n) {
        doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        var lines = doc.splitTextToSize(n, CW - 16);
        ensure(lines.length * 12 + 6);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor.apply(doc, INK);
        doc.setFillColor.apply(doc, RED); doc.circle(M + 4, y - 3, 1.8, "F");
        doc.text(lines, M + 14, y);
        y += lines.length * 12 + 4;
      });
      if (list.length) y += 6;
    }

    y = header();
    doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor.apply(doc, INK);
    var intro = (name ? "Prepared for " + name + ". " : "") +
      (address ? "Property: " + address + ". " : "") +
      "Here is a summary of the rental numbers you ran on the GB Homes investor calculator.";
    var introLines = doc.splitTextToSize(intro, CW);
    doc.text(introLines, M, y);
    y += introLines.length * 13 + 12;

    // ---- Big number: monthly cash flow ----
    var cfText = txt("i-cf");
    var negative = /^-/.test(cfText);
    doc.setFillColor.apply(doc, CREAM); doc.setDrawColor.apply(doc, LINE); doc.setLineWidth(0.8);
    doc.roundedRect(M, y, CW, 62, 6, 6, "FD");
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor.apply(doc, MUTED);
    doc.text("Monthly cash flow (before income tax)", M + 14, y + 18);
    doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor.apply(doc, negative ? BAD : GREEN);
    doc.text(cfText, M + 14, y + 43);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor.apply(doc, INK);
    doc.text(doc.splitTextToSize(txt("i-sub"), CW / 2 - 10), W - M - 14, y + 30, { align: "right" });
    y += 76;

    // ---- Key numbers: six tiles ----
    var tiles = [
      ["Cap rate", txt("i-cap"), good("i-cap-box")],
      ["Cash-on-cash return", txt("i-coc"), good("i-coc-box")],
      ["DSCR", txt("i-dscr"), good("i-dscr-box")],
      ["Equity built, year 1", txt("i-equity"), null],
      ["Total return, year 1", txt("i-total"), null],
      ["Cash needed to buy", txt("i-cash"), null]
    ];
    var tw = (CW - 2 * 10) / 3, th = 48;
    tiles.forEach(function (t, i) {
      var tx = M + (i % 3) * (tw + 10), ty = y + Math.floor(i / 3) * (th + 10);
      doc.setFillColor(255, 255, 255); doc.setDrawColor.apply(doc, LINE); doc.setLineWidth(0.8);
      doc.roundedRect(tx, ty, tw, th, 5, 5, "FD");
      if (t[2] !== null) { doc.setFillColor.apply(doc, t[2] ? GREEN : BAD); doc.rect(tx, ty + 6, 2.5, th - 12, "F"); }
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor.apply(doc, MUTED);
      doc.text(t[0], tx + 12, ty + 17);
      doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor.apply(doc, INK);
      doc.text(t[1], tx + 12, ty + 37);
    });
    y += 2 * (th + 10) + 10;

    bullets(notices());

    // ---- Details and monthly breakdown side by side ----
    heading("The property and the numbers", 300);
    var half = (CW - 14) / 2, startY = y, endY = y;
    doc.autoTable(Object.assign({}, tableBase, {
      startY: startY,
      tableWidth: half,
      head: [[{ content: "Your details", colSpan: 2 }]],
      body: [
        ["Purchase price", "$" + val("i-price")],
        ["Down payment", val("i-down") + "%"],
        ["Interest rate", val("i-rate") + "%"],
        ["Amortization", sel("i-amort")],
        ["Plan", sel("i-occupied")],
        ["Total monthly rent", "$" + val("i-rent")],
        ["Vacancy", val("i-vacancy") + "%"],
        ["Management", val("i-mgmt") + "%"],
        ["Property tax / year", "$" + val("i-tax")],
        ["Insurance / year", "$" + val("i-ins")],
        ["Maintenance (% of rent)", val("i-maint") + "%"],
        ["Other / month", "$" + val("i-other")]
      ],
      columnStyles: { 1: { halign: "right", fontStyle: "bold" } }
    }));
    endY = Math.max(endY, doc.lastAutoTable.finalY);
    var rows = Array.prototype.map.call(document.querySelectorAll("#i-table tr"), function (tr) {
      return { cells: Array.prototype.map.call(tr.children, function (td) { return clean(td.textContent); }), total: tr.classList.contains("total") };
    });
    doc.autoTable(Object.assign({}, tableBase, {
      startY: startY,
      tableWidth: half,
      margin: Object.assign({}, tableBase.margin, { left: M + half + 14 }),
      head: [[{ content: "Monthly breakdown", colSpan: 2 }]],
      body: rows.map(function (r) { return r.cells; }),
      columnStyles: { 1: { halign: "right" } },
      didParseCell: function (d) {
        if (d.section !== "body") return;
        var r = rows[d.row.index];
        if (r && r.total) { d.cell.styles.fontStyle = "bold"; d.cell.styles.fillColor = CREAM; }
      }
    }));
    endY = Math.max(endY, doc.lastAutoTable.finalY);
    y = endY + 16;

    // ---- What the numbers mean ----
    heading("What these numbers mean", 150);
    bullets([
      "Cap rate: yearly net operating income divided by the price. It compares properties before financing; around 4% or more is a common GTA benchmark.",
      "Cash-on-cash return: yearly cash flow divided by the cash you put in (down payment and closing costs).",
      "DSCR: net operating income divided by the mortgage payment. Above 1.0 means the rent covers the mortgage; many lenders look for 1.2 or more on rentals.",
      "Equity built: the part of your mortgage payments that pays down the loan in year one. Total return adds this to your cash flow.",
      "Cash needed includes the down payment, Ontario land transfer tax (no first-time refund) and about $3,500 in legal and other closing costs."
    ]);

    // ---- Contact box ----
    ensure(110);
    doc.setFillColor.apply(doc, INK);
    doc.roundedRect(M, y, CW, 92, 6, 6, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(255, 255, 255);
    doc.text("Want a second set of eyes on this property?", M + 16, y + 26);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
    doc.text(doc.splitTextToSize("I'll check the rent, the comparable sales and the financing with you before you make an offer, so you buy on numbers, not hope. A free call, no pressure.", CW - 32), M + 16, y + 44);
    doc.setFont("helvetica", "bold"); doc.setTextColor.apply(doc, [255, 180, 180]);
    var contact = [C.agentName, C.registeredTitle].filter(Boolean).join(", ") + (C.brokerageName ? "  |  " + C.brokerageName : "");
    doc.text(clean(contact), M + 16, y + 68);
    doc.setFont("helvetica", "normal"); doc.setTextColor(255, 255, 255);
    doc.text(clean([C.phone, C.email, SITE].filter(Boolean).join("   |   ")), M + 16, y + 82);
    doc.link(M + 16, y + 72, CW - 32, 14, { url: "https://" + SITE + "/contact.html" });

    // ---- Footer on every page ----
    var pages = doc.getNumberOfPages();
    var disclaimer = "Estimates for planning only, not financial, tax or mortgage advice. Fixed rate, compounded semi-annually. " +
      "Rent, vacancy and expenses are your own assumptions. Rules as of November 2026. Confirm with your lender, lawyer and accountant.";
    for (var p = 1; p <= pages; p++) {
      doc.setPage(p);
      doc.setDrawColor.apply(doc, LINE); doc.setLineWidth(0.8); doc.line(M, H - 58, W - M, H - 58);
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor.apply(doc, INK);
      doc.text(clean([contact, C.phone, C.email].filter(Boolean).join("  |  ")), M, H - 44);
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor.apply(doc, MUTED);
      doc.text(doc.splitTextToSize(disclaimer, CW - 60), M, H - 32);
      doc.text("Page " + p + " of " + pages, W - M, H - 44, { align: "right" });
    }

    var tag = (address || name).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
    doc.save("GB-Homes-Rental-Analysis" + (tag ? "-" + tag : "") + ".pdf");
  }

  btn.addEventListener("click", function () {
    var label = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = "Preparing your PDF…";
    Promise.all([loadLibs(), loadImage("assets/brand/logo-horizontal.png")])
      .then(function (r) { build(r[1]); btn.innerHTML = label; btn.disabled = false; })
      .catch(function (e) {
        if (window.console) console.error(e);
        btn.textContent = "Sorry, that didn't work. Please try again.";
        setTimeout(function () { btn.innerHTML = label; btn.disabled = false; }, 3500);
      });
  });
})();
