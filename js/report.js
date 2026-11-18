/* ==========================================================================
   GB Homes — "Download my results (PDF)" for the mortgage calculator page.
   Reads what the visitor sees on the page (all three tabs) and builds a
   branded PDF in the browser. Nothing is sent anywhere.
   The PDF library (js/vendor) is only loaded when the button is pressed.
   ========================================================================== */
(function () {
  "use strict";
  var btn = document.getElementById("dl-pdf");
  if (!btn) return;
  var C = window.GB_CONFIG || {};
  var SITE = "gbluxuryhomes.ca";
  var RED = [229, 32, 32], INK = [17, 17, 17], MUTED = [95, 99, 104], LINE = [230, 227, 223], CREAM = [247, 245, 242];

  function $(id) { return document.getElementById(id); }
  // The built-in PDF fonts can't show a few typographic characters; swap them for plain ones.
  function clean(s) {
    return String(s == null ? "" : s)
      .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
      .replace(/[−–—]/g, "-").replace(/ | /g, " ")
      .replace(/\s+/g, " ").trim();
  }
  function txt(id) { return clean($(id) ? $(id).textContent : ""); }
  function val(id) { return clean($(id) ? $(id).value : ""); }
  function sel(id) { var s = $(id); return s ? clean(s.options[s.selectedIndex].text) : ""; }
  function yes(id) { return $(id) && $(id).checked ? "Yes" : "No"; }
  function notices(id) {
    return Array.prototype.map.call(document.querySelectorAll("#" + id + " .notice"), function (n) { return clean(n.textContent); });
  }
  function tableRows(id) {
    return Array.prototype.map.call(document.querySelectorAll("#" + id + " tr"), function (tr) {
      return { cells: Array.prototype.map.call(tr.children, function (td) { return clean(td.textContent); }), cls: tr.className };
    });
  }

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
      libs = loadScript("js/vendor/jspdf.umd.min.js").then(function () {
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
  // Turn the balance chart (an SVG on the page) into a picture for the PDF.
  function chartImage() {
    var svg = $("p-chart");
    if (!svg || !svg.innerHTML.trim()) return Promise.resolve(null);
    var xml = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 220" width="640" height="220" font-family="Helvetica, Arial, sans-serif">' +
      '<rect width="640" height="220" fill="#fff"/>' + svg.innerHTML + "</svg>";
    return loadImage("data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml)).then(function (img) {
      if (!img) return null;
      var c = document.createElement("canvas");
      c.width = 1920; c.height = 660;
      var ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      try { return c.toDataURL("image/jpeg", 0.92); } catch (e) { return null; }
    });
  }

  function build(logo, chart) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: "pt", format: "letter", compress: true });
    var W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
    var M = 40, CW = W - M * 2;
    var name = clean($("r-name") ? $("r-name").value : "");
    var today = new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
    var y;

    function header() {
      if (logo) doc.addImage(logo, "PNG", M, 30, 176, 30);
      else { doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor.apply(doc, RED); doc.text("GB HOMES", M, 52); }
      doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor.apply(doc, INK);
      doc.text("Mortgage Estimate", W - M, 44, { align: "right" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor.apply(doc, MUTED);
      doc.text(today, W - M, 58, { align: "right" });
      doc.setDrawColor.apply(doc, RED); doc.setLineWidth(2); doc.line(M, 72, W - M, 72);
      return 92;
    }
    function ensure(space) {
      if (y + space > H - 70) { doc.addPage(); y = header(); }
    }
    function heading(t, room) {
      ensure(room || 170);
      doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor.apply(doc, INK);
      doc.text(t, M, y);
      doc.setFillColor.apply(doc, RED); doc.rect(M, y + 5, 28, 2.5, "F");
      y += 20;
    }
    function bigNumber(label, value, sub) {
      ensure(70);
      doc.setFillColor.apply(doc, CREAM); doc.setDrawColor.apply(doc, LINE); doc.setLineWidth(0.8);
      doc.roundedRect(M, y, CW, 62, 6, 6, "FD");
      doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor.apply(doc, MUTED);
      doc.text(label, M + 14, y + 18);
      doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor.apply(doc, RED);
      doc.text(value, M + 14, y + 43);
      if (sub) {
        doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor.apply(doc, INK);
        doc.text(doc.splitTextToSize(sub, CW / 2 - 10), W - M - 14, y + 30, { align: "right" });
      }
      y += 74;
    }
    var tableBase = {
      theme: "grid",
      margin: { left: M, right: M, top: 92, bottom: 70 },
      styles: { font: "helvetica", fontSize: 9.5, cellPadding: 5, textColor: INK, lineColor: LINE, lineWidth: 0.6 },
      headStyles: { fillColor: INK, textColor: [255, 255, 255], fontStyle: "bold" },
      didDrawPage: function () { header(); }
    };
    function twoTables(leftTitle, left, rightTitle, right) {
      ensure((Math.max(left.length, right.length) + 1) * 23 + 10);
      var half = (CW - 14) / 2, startY = y, endY = y;
      [[leftTitle, left, M], [rightTitle, right, M + half + 14]].forEach(function (t) {
        doc.autoTable(Object.assign({}, tableBase, {
          startY: startY,
          tableWidth: half,
          margin: Object.assign({}, tableBase.margin, { left: t[2] }),
          head: [[{ content: t[0], colSpan: 2 }]],
          body: t[1],
          columnStyles: { 1: { halign: "right", fontStyle: "bold" } }
        }));
        endY = Math.max(endY, doc.lastAutoTable.finalY);
      });
      y = endY + 14;
    }
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
      "Here is a summary of the numbers you ran on the GB Homes mortgage calculator.";
    doc.text(doc.splitTextToSize(intro, CW), M, y);
    y += 24;

    // ---- 1. Payment ----
    heading("1. Your mortgage payment");
    bigNumber(txt("p-freq-label"), txt("p-payment"), txt("p-sub"));
    twoTables("Your details", [
      ["Purchase price", "$" + val("p-price")],
      ["Down payment", "$" + val("p-down") + " (" + txt("p-down-pct").replace(" down", "") + ")"],
      ["Interest rate", val("p-rate") + "%"],
      ["Term", sel("p-term")],
      ["Amortization", sel("p-amort")],
      ["Payment frequency", sel("p-freq")],
      ["First-time buyer or new build", yes("p-ftb")]
    ], "Your results", [
      ["Mortgage amount", txt("p-loan")],
      ["CMHC insurance", txt("p-cmhc")],
      ["Interest over the term", txt("p-term-int")],
      ["Balance at renewal", txt("p-renew")],
      ["Total interest (full amortization)", txt("p-total-int")],
      ["Mortgage-free in", txt("p-payoff")]
    ]);
    bullets(notices("p-notices"));
    if (chart) {
      ensure(200);
      doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor.apply(doc, INK);
      doc.text("Mortgage balance over time", M, y);
      y += 6;
      var ch = CW * 220 / 640;
      doc.addImage(chart, "JPEG", M, y, CW, ch);
      y += ch + 16;
    }

    // ---- 2. Closing costs ----
    heading("2. Cash you'll need on closing day");
    bigNumber("Total cash needed on closing day", txt("c-cash"), txt("c-sub"));
    ensure(120);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor.apply(doc, MUTED);
    doc.text("First-time buyer: " + yes("c-ftb") + "   |   Home in the City of Toronto: " + yes("c-toronto"), M, y);
    y += 8;
    var cRows = tableRows("c-table");
    doc.autoTable(Object.assign({}, tableBase, {
      startY: y,
      head: [["Closing cost", "Amount"]],
      body: cRows.map(function (r) { return r.cells; }),
      columnStyles: { 1: { halign: "right" } },
      didParseCell: function (d) {
        if (d.section === "head" && d.column.index === 1) d.cell.styles.halign = "right";
        if (d.section !== "body") return;
        var cls = cRows[d.row.index].cls;
        if (/total/.test(cls)) { d.cell.styles.fontStyle = "bold"; d.cell.styles.fillColor = CREAM; }
        if (/minus/.test(cls)) d.cell.styles.textColor = [26, 127, 55];
      }
    }));
    y = doc.lastAutoTable.finalY + 20;

    // ---- 3. Affordability ----
    heading("3. How much home you could afford", 420);
    bigNumber("You could afford a home up to about", txt("a-max"), txt("a-sub"));
    twoTables("Your finances", [
      ["Household income (yearly, before tax)", "$" + val("a-income")],
      ["Down payment saved", "$" + val("a-down")],
      ["Monthly debt payments", "$" + val("a-debts")],
      ["Interest rate", val("a-rate") + "%"],
      ["Amortization", sel("a-amort")],
      ["Property tax (% of price / yr)", val("a-tax") + "%"],
      ["Heating / month", "$" + val("a-heat")],
      ["Condo fees / month", "$" + val("a-condo")],
      ["First-time buyer", yes("a-ftb")]
    ], "Your results", [
      ["Mortgage amount", txt("a-loan")],
      ["Monthly payment", txt("a-pay")],
      ["Stress-test rate", txt("a-qrate")],
      ["GDS ratio (max 39%)", txt("a-gds")],
      ["TDS ratio (max 44%)", txt("a-tds")]
    ]);
    bullets(notices("a-notices"));

    // ---- 4. Schedule ----
    var sRows = tableRows("p-table");
    if (sRows.length) {
      doc.addPage(); y = header();
      heading("4. Year-by-year schedule", 60);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor.apply(doc, MUTED);
      doc.text("The highlighted row is the end of your term, when you renew.", M, y);
      y += 8;
      doc.autoTable(Object.assign({}, tableBase, {
        startY: y,
        head: [["Year", "Principal paid", "Interest paid", "Balance"]],
        body: sRows.map(function (r) { return r.cells; }),
        styles: Object.assign({}, tableBase.styles, { fontSize: 9, cellPadding: 3.5 }),
        columnStyles: { 0: { halign: "center", cellWidth: 50 }, 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
        didParseCell: function (d) {
          if (d.section === "head") d.cell.styles.halign = d.column.index === 0 ? "center" : "right";
          if (d.section === "body" && /term-end/.test(sRows[d.row.index].cls)) {
            d.cell.styles.fillColor = [253, 232, 232]; d.cell.styles.fontStyle = "bold";
          }
        }
      }));
      y = doc.lastAutoTable.finalY + 20;
    }

    // ---- Contact box ----
    ensure(110);
    doc.setFillColor.apply(doc, INK);
    doc.roundedRect(M, y, CW, 92, 6, 6, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(255, 255, 255);
    doc.text("Want me to run the numbers with you?", M + 16, y + 26);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
    doc.text(doc.splitTextToSize("I'll walk you through your budget, programs you qualify for and what to expect on closing day. A free call, no pressure.", CW - 32), M + 16, y + 44);
    doc.setFont("helvetica", "bold"); doc.setTextColor.apply(doc, [255, 180, 180]);
    var contact = [C.agentName, C.registeredTitle].filter(Boolean).join(", ") + (C.brokerageName ? "  |  " + C.brokerageName : "");
    doc.text(clean(contact), M + 16, y + 68);
    doc.setFont("helvetica", "normal"); doc.setTextColor(255, 255, 255);
    doc.text(clean([C.phone, C.email, SITE].filter(Boolean).join("   |   ")), M + 16, y + 82);
    if (C.phone) doc.link(M + 16, y + 72, CW - 32, 14, { url: "https://" + SITE + "/contact.html" });

    // ---- Footer on every page ----
    var pages = doc.getNumberOfPages();
    var disclaimer = "Estimates for planning only, not a mortgage approval or financial advice. Fixed rate, compounded semi-annually. " +
      "CMHC, stress-test and Ontario / Toronto land transfer tax rules as of November 2026. Confirm with your lender and lawyer.";
    for (var p = 1; p <= pages; p++) {
      doc.setPage(p);
      doc.setDrawColor.apply(doc, LINE); doc.setLineWidth(0.8); doc.line(M, H - 58, W - M, H - 58);
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor.apply(doc, INK);
      doc.text(clean([contact, C.phone, C.email].filter(Boolean).join("  |  ")), M, H - 44);
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor.apply(doc, MUTED);
      doc.text(doc.splitTextToSize(disclaimer, CW - 60), M, H - 32);
      doc.text("Page " + p + " of " + pages, W - M, H - 44, { align: "right" });
    }

    var file = "GB-Homes-Mortgage-Estimate" + (name ? "-" + name.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") : "") + ".pdf";
    doc.save(file);
  }

  btn.addEventListener("click", function () {
    var label = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = "Preparing your PDF…";
    Promise.all([loadLibs(), loadImage("assets/brand/logo-horizontal.png"), chartImage()])
      .then(function (r) { build(r[1], r[2]); })
      .catch(function (e) {
        if (window.console) console.error(e);
        btn.textContent = "Sorry, that didn't work. Please try again.";
        setTimeout(function () { btn.innerHTML = label; }, 3500);
        btn.disabled = false;
        return "failed";
      })
      .then(function (r) {
        if (r !== "failed") { btn.innerHTML = label; btn.disabled = false; }
      });
  });
})();
