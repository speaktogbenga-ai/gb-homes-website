/* GB Homes — tiny Supabase client (REST, no library needed).
   Turned on by supabaseUrl + supabaseAnonKey in js/config.js. The anon key is
   meant to be public: what it can do is limited by the row-level security
   rules in supabase/schema.sql (visitors can add a lead and read published
   listings, nothing else). */
(function () {
  "use strict";
  var cfg = window.GB_CONFIG || {};
  var base = String(cfg.supabaseUrl || "").replace(/\/+$/, "");
  var key = cfg.supabaseAnonKey || "";
  var enabled = !!(base && key);

  function request(method, path, body, extra) {
    var headers = { apikey: key, Authorization: "Bearer " + key, Accept: "application/json" };
    if (body) headers["Content-Type"] = "application/json";
    for (var h in extra || {}) headers[h] = extra[h];
    return fetch(base + "/rest/v1/" + path, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) {
        if (!r.ok) return r.text().then(function (t) { throw new Error("Supabase " + r.status + ": " + t); });
        return r.status === 204 || r.status === 201 ? null : r.json();
      });
  }

  window.GBDB = {
    enabled: enabled,
    /** Add one row. Does not read it back (visitors can't read leads). */
    insert: function (table, row) {
      if (!enabled) return Promise.reject(new Error("Supabase not configured"));
      return request("POST", encodeURIComponent(table), row, { Prefer: "return=minimal" });
    },
    /** Read rows, e.g. select("listings", "published=eq.true&order=sort_order.asc"). */
    select: function (table, query) {
      if (!enabled) return Promise.reject(new Error("Supabase not configured"));
      return request("GET", encodeURIComponent(table) + "?select=*" + (query ? "&" + query : ""));
    }
  };
})();
