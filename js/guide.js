/* GB Homes — saved checklists on the guide pages. */
(function () {
  "use strict";
  var store = window.GBUI.store;
  document.querySelectorAll("[data-checklist]").forEach(function (box) {
    var key = box.getAttribute("data-checklist");
    var inputs = box.querySelectorAll('input[type="checkbox"]');
    var saved = store.get(key, []);
    var label = box.querySelector("[data-progress-label]");
    var bar = box.querySelector("[data-progress-bar]");
    inputs.forEach(function (inp, i) { inp.checked = saved.indexOf(i) !== -1; });
    function update() {
      var done = [];
      inputs.forEach(function (inp, i) { if (inp.checked) done.push(i); });
      store.set(key, done);
      if (label) label.textContent = done.length + " of " + inputs.length + " done";
      if (bar) bar.style.width = (done.length / inputs.length) * 100 + "%";
    }
    box.addEventListener("change", update);
    update();
  });
})();
