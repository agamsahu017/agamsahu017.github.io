// Live remote developer/QA jobs from free public APIs (Remotive, Remote OK, Jobicy).
// Their terms: credit the source with a direct (followed) link and send applicants to the
// original job URL. Remotive asks for at most ~4 fetches a day, so results are cached in
// this browser for 6 hours. Nothing is sent to Kodivo; Kodivo does not verify listings.
(function () {
  const box = document.getElementById("job-list");
  if (!box) return;
  const CACHE_KEY = "kodivo-remote-jobs-v4";
  const CACHE_MS = 6 * 60 * 60 * 1000;
  const status = document.getElementById("job-status");
  const more = document.getElementById("job-more");
  const f = {
    role: document.getElementById("f-role"),
    level: document.getElementById("f-level"),
    india: document.getElementById("f-india"),
    q: document.getElementById("f-q"),
  };
  const PAGE = 30;
  let all = [];
  let shown = PAGE;

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? u : "");
  // Some feeds send UTF-8 text that was wrongly read as Windows-1252 ("WeÃ¢â‚¬â„¢re"); turn it back.
  const CP1252 = { "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84, "…": 0x85, "†": 0x86, "‡": 0x87, "ˆ": 0x88, "‰": 0x89, "Š": 0x8a, "‹": 0x8b, "Œ": 0x8c, "Ž": 0x8e, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97, "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b, "œ": 0x9c, "ž": 0x9e, "Ÿ": 0x9f };
  const fixText = (s) => {
    if (!/[ÃÂâ]/.test(s)) return s;
    const bytes = [];
    for (const ch of s) {
      const code = CP1252[ch] ?? ch.charCodeAt(0);
      if (code > 255) return s; // real non-Latin text mixed in: leave it alone
      bytes.push(code);
    }
    try { return new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes)); } catch (e) { return s; }
  };
  const plain = (html) => { const d = document.createElement("div"); d.innerHTML = html || ""; return fixText((d.textContent || "").replace(/\s+/g, " ").trim()); };

  const QA = /\b(qa|quality|test|tester|testing|sdet|automation engineer)\b/i;
  const DEV = /\b(developer|engineer|programmer|frontend|front-end|backend|back-end|full[ -]?stack|software|mobile|ios|android|devops|sre|web|react|node|java|python|golang|\.net|php|ruby)\b/i;
  function roleOf(title, tags) {
    const text = `${title} ${tags.join(" ")}`;
    if (QA.test(title) || /\b(qa|testing|sdet)\b/i.test(tags.join(" "))) return "qa";
    if (DEV.test(text)) return "dev";
    return "";
  }
  function levelOf(title) {
    if (/\b(intern|internship|trainee|graduate|fresher|entry[ -]level|junior|jr\.?)\b/i.test(title)) return "junior";
    if (/\b(senior|sr\.?|lead|staff|principal|architect|head|manager|director)\b/i.test(title)) return "senior";
    return "mid";
  }
  // "Open to India" = location says worldwide/anywhere/APAC/Asia/India, or no restriction given.
  // A region named in the title (e.g. "Engineer LATAM", "US only") also counts as a restriction.
  const OPEN = /(worldwide|anywhere|global|india|apac|asia)/;
  const REGION = /\b(latam|latin america|us only|usa only|us-based|united states|north america|canada|europe|emea|uk only|brazil|mexico)\b/;
  // Descriptions often say "Location: Fully Remote (US)" even when the location field is empty.
  const TEXT_REGION = /location:[^.]{0,40}\b(us|usa|united states|canada|europe|uk|latam|brazil|mexico)\b/;
  function openToIndia(loc, title, text) {
    const l = (loc || "").toLowerCase().trim();
    const t = (title || "").toLowerCase();
    if (OPEN.test(l)) return "yes";
    if (REGION.test(t) || TEXT_REGION.test((text || "").toLowerCase())) return "no";
    if (!l || l === "remote") return "maybe";
    return "no";
  }

  async function getJSON(url) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error(res.status);
      return await res.json();
    } finally { clearTimeout(t); }
  }

  const SOURCES = [
    {
      name: "Remotive", home: "https://remotive.com",
      load: async () => {
        const data = await getJSON("https://remotive.com/api/remote-jobs");
        return (data.jobs || []).map((j) => ({
          title: j.title, company: j.company_name, url: j.url, loc: j.candidate_required_location,
          tags: j.tags || [], date: j.publication_date, salary: j.salary, text: plain(j.description).slice(0, 220),
        }));
      },
    },
    {
      name: "Remote OK", home: "https://remoteok.com",
      load: async () => {
        const data = await getJSON("https://remoteok.com/api");
        return data.slice(1).map((j) => ({
          title: fixText(j.position), company: fixText(j.company), url: j.url, loc: j.location,
          tags: j.tags || [], date: j.date, salary: j.salary_min ? `$${j.salary_min.toLocaleString()}–$${(j.salary_max || j.salary_min).toLocaleString()}` : "",
          text: plain(j.description).slice(0, 220),
        }));
      },
    },
    {
      name: "Jobicy", home: "https://jobicy.com",
      load: async () => {
        const lists = await Promise.all(["anywhere", "apac"].map((g) => getJSON(`https://jobicy.com/api/v2/remote-jobs?count=50&industry=dev&geo=${g}`).catch(() => ({ jobs: [] }))));
        return lists.flatMap((d) => d.jobs || []).map((j) => ({
          title: plain(j.jobTitle), company: plain(j.companyName), url: j.url, loc: j.jobGeo,
          tags: [].concat(j.jobIndustry || []), date: j.pubDate, level: j.jobLevel,
          salary: j.salaryMin ? `${j.salaryCurrency || ""} ${j.salaryMin}–${j.salaryMax || j.salaryMin} / ${j.salaryPeriod || "year"}` : "",
          text: plain(j.jobExcerpt).slice(0, 220),
        }));
      },
    },
  ];

  async function loadAll() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (cached && Date.now() - cached.at < CACHE_MS && cached.jobs.length) return cached;
    } catch (e) { /* storage blocked: just fetch */ }
    const results = await Promise.allSettled(SOURCES.map((s) => s.load().then((jobs) => jobs.map((j) => ({ ...j, source: s.name, sourceHome: s.home })))));
    const failed = SOURCES.filter((s, i) => results[i].status === "rejected").map((s) => s.name);
    const seen = new Set();
    const jobs = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []))
      .map((j) => ({ ...j, url: safeUrl(j.url), tags: (j.tags || []).map(String) }))
      .filter((j) => j.url && j.title)
      .map((j) => ({ ...j, role: roleOf(j.title, j.tags), lvl: levelOf(j.title), india: openToIndia(j.loc, j.title, j.text) }))
      .filter((j) => j.role)
      .filter((j) => { const k = `${j.title}|${j.company}`.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const out = { at: Date.now(), jobs, failed };
    try { if (jobs.length) localStorage.setItem(CACHE_KEY, JSON.stringify(out)); } catch (e) { /* ignore */ }
    return out;
  }

  const ago = (d) => {
    const days = Math.floor((Date.now() - new Date(d)) / 86400000);
    if (!isFinite(days) || days < 0) return "";
    return days === 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`;
  };
  const LEVEL = { junior: "Fresher / junior", mid: "Mid level", senior: "Senior / lead" };
  const INDIA = { yes: ["✅ Open to India", "ok"], maybe: ["❔ Location not stated", "maybe"], no: ["🌍 Region-restricted", "no"] };

  function render() {
    const q = f.q.value.trim().toLowerCase();
    const list = all.filter((j) =>
      (f.role.value === "all" || j.role === f.role.value) &&
      (f.level.value === "all" || j.lvl === f.level.value) &&
      (!f.india.checked || j.india !== "no") &&
      (!q || `${j.title} ${j.company} ${j.tags.join(" ")} ${j.loc}`.toLowerCase().includes(q)));
    status.textContent = `${list.length} job${list.length === 1 ? "" : "s"} match your filters.`;
    box.innerHTML = list.slice(0, shown).map((j) => {
      const [indiaText, indiaCls] = INDIA[j.india];
      return `<article class="job">
        <div class="job-top"><h3><a href="${esc(j.url)}" target="_blank" rel="noopener">${esc(j.title)}</a></h3><span class="job-date">${esc(ago(j.date))}</span></div>
        <p class="job-co">${esc(j.company)}${j.loc ? ` · ${esc(j.loc)}` : ""}</p>
        <div class="job-tags"><span class="jt">${j.role === "qa" ? "QA / testing" : "Developer"}</span><span class="jt">${LEVEL[j.lvl]}</span><span class="jt india-${indiaCls}">${indiaText}</span>${j.salary ? `<span class="jt">${esc(j.salary)}</span>` : ""}</div>
        ${j.text ? `<p class="job-text">${esc(j.text)}…</p>` : ""}
        <div class="job-foot"><a class="btn btn-primary btn-sm" href="${esc(j.url)}" target="_blank" rel="noopener">Apply on ${esc(j.source)} →</a><span class="job-src">Source: <a href="${esc(j.sourceHome)}" target="_blank" rel="noopener">${esc(j.source)}</a></span></div>
      </article>`;
    }).join("") || `<p class="job-empty">No jobs match. Try removing a filter.</p>`;
    more.hidden = list.length <= shown;
  }

  Object.values(f).forEach((el) => el.addEventListener(el.type === "search" ? "input" : "change", () => { shown = PAGE; render(); }));
  more.addEventListener("click", () => { shown += PAGE; render(); });

  status.textContent = "Loading live remote jobs…";
  loadAll().then((data) => {
    all = data.jobs;
    if (!all.length) { status.textContent = "Couldn't load jobs right now. Please try again later, or use the job boards listed below."; return; }
    const when = new Date(data.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    document.getElementById("job-updated").textContent = `Updated ${when}${data.failed && data.failed.length ? ` · ${data.failed.join(", ")} didn't respond` : ""}.`;
    render();
  }).catch(() => { status.textContent = "Couldn't load jobs right now. Please try again later."; });
})();
