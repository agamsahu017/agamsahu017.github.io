// Private visitor counter (see D:\personal\kodivo-visitor-counter).
// Sends the page path, plus a "ref" tag when the link has one, e.g.
// https://agamsahu017.github.io/?ref=lko-rwa, so the dashboard can show which
// WhatsApp group, QR code or post brought the visitor. The counter hashes the
// IP and never stores it.
// To stop counting your own visits, open any page once with ?notrack
// (and ?track to undo).
(function () {
  const COUNTER_URL = "https://kodivo-counter.agamsahu017.workers.dev";
  if (!COUNTER_URL) return;

  const params = new URLSearchParams(location.search);
  const cleanRef = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
  const ref = cleanRef(params.get("ref"));

  try {
    // Remember the ref for this visit so a form filled on a later page is still credited to it.
    if (ref) sessionStorage.setItem("kodivo-ref", ref);
    if (params.has("notrack")) localStorage.setItem("kodivo-notrack", "1");
    if (params.has("track")) localStorage.removeItem("kodivo-notrack");
    if (localStorage.getItem("kodivo-notrack")) return;
  } catch (e) {
    // storage blocked: still count
  }

  const body = JSON.stringify({ path: location.pathname || "/", ref: ref || undefined });
  fetch(COUNTER_URL + "/hit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body,
    keepalive: true,
  }).catch(function () {});
})();
