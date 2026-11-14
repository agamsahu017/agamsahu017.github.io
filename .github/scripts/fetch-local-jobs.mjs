// Fetches non-tech jobs in Lucknow and Delhi NCR from public job APIs and writes jobs/feed.json.
// Runs daily from .github/workflows/local-jobs.yml. Keys come from GitHub Secrets (env), never the repo.
//
//   ADZUNA_APP_ID + ADZUNA_APP_KEY  -> https://developer.adzuna.com (free)
//   JOOBLE_KEY                      -> https://jooble.org/api/about (free, on request)
//
// Rules from the sources: show where each job came from, and send applicants to the original job link.
// Test without keys:  node .github/scripts/fetch-local-jobs.mjs --mock <fixture.json>
import { readFile, writeFile } from 'node:fs/promises';

const OUT = new URL('../../jobs/feed.json', import.meta.url);
const MAX_AGE_DAYS = 21;
const MAX_JOBS = 400;
const PAUSE_MS = 2500;

// What to search for, per job type on the page.
const QUERIES = {
  'front-office': ['front office executive', 'receptionist'],
  'back-office': ['back office executive', 'data entry operator'],
  telecaller: ['telecaller', 'customer care executive'],
  'store-manager': ['store manager'],
  'store-assistant': ['retail sales associate', 'store assistant'],
  mall: ['mall'],
  accounts: ['accountant', 'billing executive'],
  'field-sales': ['field sales executive'],
  delivery: ['delivery boy', 'driver'],
  security: ['security guard', 'housekeeping'],
};
const CITIES = ['Lucknow', 'Delhi', 'Noida', 'Gurgaon', 'Ghaziabad', 'Faridabad'];

// Listings that look like scams or are not local, real jobs.
const BAD = /registration fee|joining fee|security deposit|refundable deposit|pay (?:rs|₹|inr)?\s*\d+|processing fee|earn (?:rs|₹)?\s*\d+.*(?:daily|per day)|daily payout|typing work|copy[- ]paste|form filling|mlm|network marketing|investment required/i;
const TECH = /developer|engineer|software|programmer|devops|data scientist|full stack|frontend|backend|react|java\b|python|sde\b/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (s) => String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&amp;|&#\d+;/g, ' ').replace(/\s+/g, ' ').trim();
const cut = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
const day = (d) => { const t = new Date(d); return isNaN(t) ? null : t.toISOString().slice(0, 10); };

function normCity(text, fallback) {
  const t = String(text || '').toLowerCase();
  if (t.includes('lucknow')) return 'Lucknow';
  if (t.includes('greater noida')) return 'Greater Noida';
  if (t.includes('noida')) return 'Noida';
  if (t.includes('gurgaon') || t.includes('gurugram')) return 'Gurugram';
  if (t.includes('ghaziabad')) return 'Ghaziabad';
  if (t.includes('faridabad')) return 'Faridabad';
  if (t.includes('delhi')) return 'Delhi';
  return fallback === 'Gurgaon' ? 'Gurugram' : fallback;
}

function pickArea(text, city) {
  const parts = String(text || '').split(',').map((s) => s.trim()).filter(Boolean);
  const area = parts.find((p) => !new RegExp(city + '|uttar pradesh|haryana|india|delhi|ncr', 'i').test(p));
  return area ? cut(area, 40) : '';
}

function salaryFromText(s) {
  // Jooble gives text like "₹15,000 - ₹20,000 per month". Only trust clear monthly ranges.
  const t = String(s || '').replace(/,/g, '');
  if (!/month/i.test(t)) return {};
  const nums = (t.match(/\d{4,6}/g) || []).map(Number).filter((n) => n >= 5000 && n <= 300000);
  return nums.length ? { salary_min: nums[0], salary_max: nums[1] || undefined } : {};
}

async function adzuna(category, what, where) {
  const { ADZUNA_APP_ID: id, ADZUNA_APP_KEY: key } = process.env;
  const u = new URL('https://api.adzuna.com/v1/api/jobs/in/search/1');
  u.search = new URLSearchParams({ app_id: id, app_key: key, results_per_page: '30', what, where, max_days_old: String(MAX_AGE_DAYS), sort_by: 'date', 'content-type': 'application/json' });
  const r = await fetch(u);
  if (!r.ok) throw new Error('Adzuna ' + r.status);
  const data = await r.json();
  return (data.results || []).map((j) => {
    const loc = [j.location?.display_name, ...(j.location?.area || [])].join(', ');
    const city = normCity(loc, where);
    // Adzuna salaries are yearly; show monthly. Skip their guesses ("predicted").
    const real = j.salary_is_predicted === '0' || j.salary_is_predicted === 0;
    return {
      source: 'Adzuna', ext_id: String(j.id), category,
      title: clean(j.title), company: clean(j.company?.display_name), city, area: pickArea(j.location?.display_name, city),
      salary_min: real && j.salary_min ? Math.round(j.salary_min / 12 / 500) * 500 : undefined,
      salary_max: real && j.salary_max ? Math.round(j.salary_max / 12 / 500) * 500 : undefined,
      posted: day(j.created), url: j.redirect_url, snippet: cut(clean(j.description), 220),
    };
  });
}

async function jooble(category, what, where) {
  const r = await fetch('https://jooble.org/api/' + process.env.JOOBLE_KEY, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keywords: what, location: where + ', India', page: '1' }),
  });
  if (!r.ok) throw new Error('Jooble ' + r.status);
  const data = await r.json();
  return (data.jobs || []).map((j) => {
    const city = normCity(j.location, where);
    return {
      source: 'Jooble', ext_id: String(j.id), category,
      title: clean(j.title), company: clean(j.company), city, area: pickArea(j.location, city),
      ...salaryFromText(j.salary), posted: day(j.updated), url: j.link, snippet: cut(clean(j.snippet), 220),
    };
  });
}

function finish(all) {
  const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 864e5).toISOString().slice(0, 10);
  const seen = new Set();
  const jobs = [];
  for (const j of all) {
    if (!j.title || !j.url || !/^https:\/\//.test(j.url)) continue;
    if (j.posted && j.posted < cutoff) continue;
    if (BAD.test(j.title + ' ' + j.snippet) || TECH.test(j.title)) continue;
    if (!['Lucknow', 'Delhi', 'Noida', 'Greater Noida', 'Gurugram', 'Ghaziabad', 'Faridabad'].includes(j.city)) continue;
    const key = (j.title + '|' + j.company + '|' + j.city).toLowerCase().replace(/[^a-z0-9|]/g, '');
    if (seen.has(key)) continue;
    seen.add(key);
    if (j.category === 'mall' || /\bmall\b/i.test(j.area + ' ' + j.title)) j.mall = true;
    j.id = (j.source === 'Adzuna' ? 'AZ-' : 'JB-') + j.ext_id;
    delete j.ext_id;
    for (const k of Object.keys(j)) if (j[k] === undefined || j[k] === '') delete j[k];
    jobs.push(j);
  }
  jobs.sort((a, b) => String(b.posted || '').localeCompare(String(a.posted || '')));
  return jobs.slice(0, MAX_JOBS);
}

async function main() {
  const mockAt = process.argv.indexOf('--mock');
  let raw = [];
  const used = [];
  if (mockAt > -1) {
    raw = JSON.parse(await readFile(process.argv[mockAt + 1], 'utf8'));
    used.push('Mock');
  } else {
    const sources = [];
    if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) sources.push(['Adzuna', adzuna]);
    if (process.env.JOOBLE_KEY) sources.push(['Jooble', jooble]);
    if (!sources.length) { console.log('No API keys set. Add ADZUNA_APP_ID/ADZUNA_APP_KEY or JOOBLE_KEY as GitHub Secrets. Feed not changed.'); return; }
    for (const [name, fn] of sources) {
      let ok = 0, failed = 0;
      for (const [category, terms] of Object.entries(QUERIES)) {
        // Adzuna's free plan has a monthly call limit: use only the main term (10 types x 6 cities = 60 calls/day).
        for (const what of name === 'Adzuna' ? terms.slice(0, 1) : terms) {
          for (const where of CITIES) {
            try { raw.push(...(await fn(category, what, where))); ok++; }
            catch (e) { failed++; console.warn(name, what, where, e.message); }
            await sleep(PAUSE_MS);
          }
        }
      }
      console.log(name + ': ' + ok + ' searches ok, ' + failed + ' failed');
      if (ok) used.push(name);
    }
    if (!used.length) { console.log('All searches failed. Feed not changed.'); process.exitCode = 1; return; }
  }
  const jobs = finish(raw);
  const feed = { updated: new Date().toISOString(), sources: used, jobs };
  await writeFile(OUT, JSON.stringify(feed, null, 1) + '\n');
  console.log('Wrote ' + jobs.length + ' jobs (from ' + raw.length + ' raw) to jobs/feed.json');
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
