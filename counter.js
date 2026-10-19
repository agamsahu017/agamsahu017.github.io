// Private visitor counter (see D:\personal\kodivo-visitor-counter).
// Sends the page path only. The counter hashes the IP and never stores it.
// To stop counting your own visits, open any page once with ?notrack
// (and ?track to undo).
(function () {
  const COUNTER_URL = ""; // set after deploying the Worker, e.g. "https://kodivo-counter.<you>.workers.dev"
  if (!COUNTER_URL) return;

  try {
    const params = new URLSearchParams(location.search);
    if (params.has("notrack")) localStorage.setItem("kodivo-notrack", "1");
    if (params.has("track")) localStorage.removeItem("kodivo-notrack");
    if (localStorage.getItem("kodivo-notrack")) return;
  } catch (e) {
    // storage blocked: still count
  }

  const body = JSON.stringify({ path: location.pathname || "/" });
  fetch(COUNTER_URL + "/hit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body,
    keepalive: true,
  }).catch(function () {});
})();
