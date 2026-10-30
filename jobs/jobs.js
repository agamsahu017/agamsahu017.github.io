// Live remote developer/QA jobs from free public APIs (Remotive, Remote OK, Jobicy).
// Their terms: credit the source with a direct (followed) link and send applicants to the
// original job URL. Remotive asks for at most ~4 fetches a day, so results are cached in
// this browser for 6 hours. Nothing is sent to Kodivo; Kodivo does not verify listings.
(function () {
  const box = document.getElementById("job-list");
  if (!box) return;
  const CACHE_KEY = "kodivo-remote-jobs-v5";
  const PROFILE_KEY = "kodivo-job-profile";
  const SAVED_KEY = "kodivo-saved-jobs";
  const CACHE_MS = 6 * 60 * 60 * 1000;
  const status = document.getElementById("job-status");
  const more = document.getElementById("job-more");
  const f = {
    role: document.getElementById("f-role"),
    level: document.getElementById("f-level"),
    india: document.getElementById("f-india"),
    q: document.getElementById("f-q"),
    saved: document.getElementById("f-saved"),
  };
  const p = {
    exp: document.getElementById("p-exp"),
    role: document.getElementById("p-role"),
    skills: document.getElementById("p-skills"),
    avoid: document.getElementById("p-avoid"),
    msg: document.getElementById("p-msg"),
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
          tags: j.tags || [], date: j.publication_date, salary: j.salary, text: plain(j.description).slice(0, 220), full: plain(j.description).slice(0, 3000),
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
          text: plain(j.description).slice(0, 220), full: plain(j.description).slice(0, 3000),
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
          text: plain(j.jobExcerpt).slice(0, 220), full: plain(j.jobDescription || j.jobExcerpt).slice(0, 3000),
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

  // ---------- my profile (kept in this browser, or in the page link) ----------
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  };
  const words = (v) => String(v || "").toLowerCase().split(/[,;]+/).map((w) => w.trim()).filter(Boolean);
  let profile = store.get(PROFILE_KEY, null);
  const params = new URLSearchParams(location.search);
  if (params.has("skills") || params.has("exp")) {
    profile = { exp: params.get("exp") || "", role: params.get("role") || "", skills: words(params.get("skills")), avoid: words(params.get("avoid")) };
    store.set(PROFILE_KEY, profile);
  }
  let saved = store.get(SAVED_KEY, {});

  // "node" matches node.js / nodejs, "postgres" matches postgresql, but "java" never matches javascript.
  const skillRe = (w) => new RegExp("(?<![a-z0-9])" + w.replace(/[.*+?^$(){}|[\]\\]/g, "\\$&") + "(?:\\.?js|ql)?(?![a-z0-9])", "i");
  const LEVEL_FIT = { "0-1": ["junior"], "1-3": ["junior", "mid"], "3-6": ["mid", "senior"], "6-10": ["senior", "mid"], "10+": ["senior"] };
  function match(j) {
    if (!profile) return { score: 0, hits: [], fit: false, hidden: false };
    const hay = j.title + " " + j.tags.join(" ") + " " + (j.full || j.text || "");
    if ((profile.avoid || []).some((w) => skillRe(w).test(hay))) return { hidden: true };
    const hits = (profile.skills || []).filter((w) => skillRe(w).test(hay));
    const fits = LEVEL_FIT[profile.exp] || [];
    const fit = fits.includes(j.lvl);
    const fresh = (Date.now() - new Date(j.date)) / 86400000 <= 7; // newer posts get a small boost
    const score = hits.length * 2 + (fits[0] === j.lvl ? 3 : fit ? 1 : 0) + (j.india === "yes" ? 1 : 0) + (fresh ? 1 : 0);
    return { score, hits, fit, hidden: false };
  }
  function fillForm() {
    p.exp.value = (profile && profile.exp) || "";
    p.role.value = (profile && profile.role) || "";
    p.skills.value = ((profile && profile.skills) || []).join(", ");
    p.avoid.value = ((profile && profile.avoid) || []).join(", ");
    if (profile && profile.role) f.role.value = profile.role;
  }
  const profileLink = () => {
    const u = new URL(location.href.split("?")[0]);
    if (profile.exp) u.searchParams.set("exp", profile.exp);
    if (profile.role) u.searchParams.set("role", profile.role);
    if (profile.skills.length) u.searchParams.set("skills", profile.skills.join(","));
    if (profile.avoid.length) u.searchParams.set("avoid", profile.avoid.join(","));
    return u.toString();
  };
  document.getElementById("p-save").addEventListener("click", () => {
    profile = { exp: p.exp.value, role: p.role.value, skills: words(p.skills.value), avoid: words(p.avoid.value) };
    store.set(PROFILE_KEY, profile);
    if (profile.role) f.role.value = profile.role;
    p.msg.textContent = "Saved. Best matches are now at the top.";
    shown = PAGE; render();
  });
  document.getElementById("p-clear").addEventListener("click", () => {
    profile = null;
    try { localStorage.removeItem(PROFILE_KEY); } catch (e) { /* ignore */ }
    fillForm(); f.role.value = "all";
    p.msg.textContent = "Profile cleared.";
    shown = PAGE; render();
  });
  document.getElementById("p-link").addEventListener("click", async () => {
    if (!profile) { p.msg.textContent = "Save your profile first."; return; }
    const link = profileLink();
    try { await navigator.clipboard.writeText(link); p.msg.textContent = "Link copied. Bookmark it to open your matches directly."; }
    catch (e) { p.msg.textContent = link; }
  });
  box.addEventListener("click", (ev) => {
    const b = ev.target.closest("button[data-save]");
    if (!b) return;
    const j = all.find((x) => x.url === b.dataset.save) || saved[b.dataset.save];
    if (!j) return;
    if (saved[j.url]) delete saved[j.url];
    else saved[j.url] = { title: j.title, company: j.company, url: j.url, source: j.source, sourceHome: j.sourceHome, loc: j.loc, date: j.date, tags: j.tags, role: j.role, lvl: j.lvl, india: j.india, text: j.text, salary: j.salary };
    store.set(SAVED_KEY, saved);
    render();
  });

  const ago = (d) => {
    const days = Math.floor((Date.now() - new Date(d)) / 86400000);
    if (!isFinite(days) || days < 0) return "";
    return days === 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`;
  };
  const LEVEL = { junior: "Fresher / junior", mid: "Mid level", senior: "Senior / lead" };
  const INDIA = { yes: ["✅ Open to India", "ok"], maybe: ["❔ Location not stated", "maybe"], no: ["🌍 Region-restricted", "no"] };

  function render() {
    const q = f.q.value.trim().toLowerCase();
    // saved jobs that have dropped out of today's feed are still shown when "Saved only" is on
    const pool = f.saved.checked
      ? [...all.filter((j) => saved[j.url]), ...Object.values(saved).filter((sv) => !all.some((j) => j.url === sv.url)).map((sv) => ({ ...sv, gone: true }))]
      : all;
    const list = pool.map((j) => ({ ...j, m: match(j) })).filter((j) => !j.m.hidden).filter((j) =>
      (f.role.value === "all" || j.role === f.role.value) &&
      (f.level.value === "all" || j.lvl === f.level.value) &&
      (!f.india.checked || j.india !== "no") &&
      (!q || `${j.title} ${j.company} ${j.tags.join(" ")} ${j.loc}`.toLowerCase().includes(q)));
    if (profile) list.sort((a, b) => b.m.score - a.m.score || new Date(b.date) - new Date(a.date));
    status.textContent = `${list.length} job${list.length === 1 ? " matches" : "s match"} your filters${profile ? ", best matches for your profile first" : ""}.`;
    box.innerHTML = list.slice(0, shown).map((j) => {
      const [indiaText, indiaCls] = INDIA[j.india];
      return `<article class="job">
        <div class="job-top"><h3><a href="${esc(j.url)}" target="_blank" rel="noopener">${esc(j.title)}</a></h3><span class="job-date">${esc(ago(j.date))}</span></div>
        <p class="job-co">${esc(j.company)}${j.loc ? ` · ${esc(j.loc)}` : ""}</p>
        ${j.m.hits && j.m.hits.length ? `<p class="job-match">🎯 Matches your skills: <b>${esc(j.m.hits.join(", "))}</b>${j.m.fit ? " · fits your experience" : ""}</p>` : j.m.fit ? `<p class="job-match">🎯 Fits your experience</p>` : ""}
        ${j.gone ? `<p class="job-match">This job is no longer in today's feed. It may be closed; check the original post.</p>` : ""}
        <div class="job-tags"><span class="jt">${j.role === "qa" ? "QA / testing" : "Developer"}</span><span class="jt">${LEVEL[j.lvl]}</span><span class="jt india-${indiaCls}">${indiaText}</span>${j.salary ? `<span class="jt">${esc(j.salary)}</span>` : ""}</div>
        ${j.text ? `<p class="job-text">${esc(j.text)}…</p>` : ""}
        <div class="job-foot"><a class="btn btn-primary btn-sm" href="${esc(j.url)}" target="_blank" rel="noopener">Apply on ${esc(j.source)} →</a><button type="button" class="btn btn-outline btn-sm job-save" data-save="${esc(j.url)}" aria-pressed="${saved[j.url] ? "true" : "false"}">${saved[j.url] ? "★ Saved" : "☆ Save"}</button><span class="job-src">Source: <a href="${esc(j.sourceHome)}" target="_blank" rel="noopener">${esc(j.source)}</a></span></div>
      </article>`;
    }).join("") || `<p class="job-empty">${f.saved.checked ? "No saved jobs yet. Tap ☆ Save on any job." : "No jobs match. Try removing a filter or a skill."}</p>`;
    more.hidden = list.length <= shown;
  }

  Object.values(f).forEach((el) => el.addEventListener(el.type === "search" ? "input" : "change", () => { shown = PAGE; render(); }));
  more.addEventListener("click", () => { shown += PAGE; render(); });

  fillForm();
  if (profile) document.getElementById("my-profile").open = true;
  status.textContent = "Loading live remote jobs…";
  loadAll().then((data) => {
    all = data.jobs;
    if (!all.length) { status.textContent = "Couldn't load jobs right now. Please try again later, or use the job boards listed below."; return; }
    const when = new Date(data.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    document.getElementById("job-updated").textContent = `Updated ${when}${data.failed && data.failed.length ? ` · ${data.failed.join(", ")} didn't respond` : ""}.`;
    render();
  }).catch(() => { status.textContent = "Couldn't load jobs right now. Please try again later."; });
})();
