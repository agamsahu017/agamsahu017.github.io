// Kodivo "Ask your documents" demo.
// PDF -> text per page (pdf.js, in the browser) -> Kodivo demo API /docs/ingest (chunk + embed + store)
// -> /docs/ask (vector search + Claude with citations) -> answer with [1] [2] page references.
(function () {
  const $ = (id) => document.getElementById(id);

  // footer year + theme (same as the other demos)
  $('year').textContent = new Date().getFullYear();
  const root = document.documentElement, themeBtn = $('themeToggle');
  const applyTheme = (t) => { root.setAttribute('data-theme', t); themeBtn.textContent = t === 'dark' ? '☀️' : '🌙'; };
  let saved = null; try { saved = localStorage.getItem('theme'); } catch (e) {}
  applyTheme(saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  themeBtn.addEventListener('click', () => { const t = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; applyTheme(t); try { localStorage.setItem('theme', t); } catch (e) {} });

  const API = (() => {
    const q = new URLSearchParams(location.search).get('api');
    return q && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(q) ? q : 'https://kodivo-demo-api.agamsahu017.workers.dev';
  })();

  if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const SAMPLES = {
    'sample-school': {
      name: 'Sunrise Public School handbook', pdf: 'assets/samples/docs/school-handbook.pdf',
      quick: ['What is the late fee?', 'Bus fee for 8 km?', 'TC kitne din mein milega?', 'Mobile phone allowed hai?', 'Is there a swimming pool?'],
    },
    'sample-coaching': {
      name: 'BrightPath Classes rules', pdf: 'assets/samples/docs/coaching-rules.pdf',
      quick: ['20 din baad chhoda to refund?', 'NEET dropper fees?', 'Girls ko scholarship?', 'Test miss ho gaya to?', 'Do you give hostel?'],
    },
  };
  const MAX_PAGES = 40, MAX_MB = 10;

  const state = { ns: null, name: '', pdf: null, history: [], busy: false };
  const body = $('chatBody'), input = $('askInput'), askBtn = $('askBtn'), status = $('docStatus');

  // ---------- small helpers ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const scroll = () => { body.scrollTop = body.scrollHeight; };
  function setStatus(html, isErr) { status.innerHTML = html; status.classList.toggle('err', !!isErr); }
  function addMsg(html, who) {
    const el = document.createElement('div');
    el.className = 'msg ' + who;
    el.innerHTML = html;
    body.appendChild(el); scroll();
    return el;
  }
  const note = (t) => addMsg(esc(t), 'note');
  function typing() { return addMsg('<span class="typing"><span></span><span></span><span></span></span>', 'bot'); }
  function setReady(on) {
    input.disabled = askBtn.disabled = !on;
    input.placeholder = on ? 'Ask a question… e.g. fees kab tak jama karni hai?' : 'Pick a document first';
  }
  function setQuick(list) {
    const row = $('quickQs');
    row.innerHTML = '';
    for (const q of list || []) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = q;
      b.addEventListener('click', () => ask(q));
      row.appendChild(b);
    }
  }
  function resetChat(title) {
    body.innerHTML = ''; state.history = [];
    $('docName').textContent = title || 'No document yet';
    $('sources').innerHTML = '<div class="src-empty">Ask a question to see its sources here.</div>';
  }
  const ERR = {
    daily_limit: 'You have used today\'s free demo limit. Please try again tomorrow, or WhatsApp us for a full demo.',
    demo_busy: 'The demo is very busy today. Please try again tomorrow.',
    slow_down: 'Too fast 🙂 Please wait a few seconds and try again.',
    doc_expired: 'This document has expired (we keep uploads for 24 hours). Please upload it again.',
    too_many_pages: `This PDF has more than ${MAX_PAGES} pages. The demo takes up to ${MAX_PAGES}; the real version has no such limit.`,
    too_long: 'This PDF has too much text for the demo. Please try a shorter one.',
    no_text: 'This PDF has no text layer (it is a scan or photo). The demo reads text PDFs only; the real version reads scans too.',
    ai_unavailable: 'The AI is not responding right now. Please try again in a minute.',
    refused: 'The AI could not answer this one. Please ask in a different way.',
    origin_not_allowed: 'This demo only works on the Kodivo website.',
  };
  const errText = (code) => ERR[code] || 'Something went wrong. Please try again.';

  async function post(path, payload) {
    const r = await fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    let j = {}; try { j = await r.json(); } catch (e) {}
    if (!r.ok || j.error) throw Object.assign(new Error(j.error || 'http_' + r.status), { code: j.error });
    return j;
  }

  // ---------- PDF ----------
  async function loadPdf(data) {
    return pdfjsLib.getDocument({ data }).promise;
  }
  // Same extraction as the sample loader: one string per page, line breaks kept.
  async function pdfPages(doc) {
    const pages = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const tc = await (await doc.getPage(i)).getTextContent();
      pages.push(tc.items.map((it) => it.str + (it.hasEOL ? '\n' : ' ')).join('').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim());
    }
    return pages;
  }

  // ---------- choose a document ----------
  const tabs = [...document.querySelectorAll('.biz-tab[data-ns]')];
  function markTab(ns) { tabs.forEach((t) => t.classList.toggle('active', t.dataset.ns === ns)); }

  async function useSample(ns) {
    if (state.busy) return;
    const s = SAMPLES[ns];
    markTab(ns);
    state.ns = ns; state.name = s.name; state.pdf = null;
    resetChat(s.name + ' (sample)');
    setStatus('Using the sample: <b>' + esc(s.name) + '</b>. Ask anything below.');
    addMsg(esc(`Hi! 👋 Ask me anything about the ${s.name}. I answer only from the document and show the page for every answer.`), 'bot');
    setQuick(s.quick);
    setReady(true);
    // Load the PDF in the background so "Open page" can show the real page.
    try { const buf = await (await fetch(s.pdf)).arrayBuffer(); if (state.ns === ns) state.pdf = await loadPdf(new Uint8Array(buf)); } catch (e) { /* page view is optional */ }
  }
  tabs.forEach((t) => t.addEventListener('click', () => useSample(t.dataset.ns)));

  $('pdfFile').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file || state.busy) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') { setStatus('Please choose a PDF file.', true); return; }
    if (file.size > MAX_MB * 1024 * 1024) { setStatus(`This PDF is bigger than ${MAX_MB} MB. Please try a smaller one.`, true); return; }
    if (!window.pdfjsLib) { setStatus('The PDF reader did not load. Please refresh the page.', true); return; }

    state.busy = true; setReady(false); setQuick([]); markTab(null);
    try {
      setStatus('<span class="spinner"></span>Reading your PDF…');
      const doc = await loadPdf(new Uint8Array(await file.arrayBuffer()));
      if (doc.numPages > MAX_PAGES) throw Object.assign(new Error(), { code: 'too_many_pages' });
      const pages = await pdfPages(doc);
      if (pages.join('').replace(/\s/g, '').length < 100) throw Object.assign(new Error(), { code: 'no_text' });

      setStatus(`<span class="spinner"></span>Preparing ${doc.numPages} page${doc.numPages > 1 ? 's' : ''} for search…`);
      const res = await post('/docs/ingest', { name: file.name, pages });

      // The search index takes a few seconds to include new pages.
      setStatus('<span class="spinner"></span>Making it searchable… this takes about a minute.');
      const t0 = Date.now();
      for (;;) {
        const r = await fetch(API + '/docs/ready?ns=' + encodeURIComponent(res.ns));
        const j = await r.json().catch(() => ({}));
        if (j.ready) break;
        if (j.error) throw Object.assign(new Error(), { code: j.error });
        if (Date.now() - t0 > 150000) throw Object.assign(new Error(), { code: 'ai_unavailable' });
        await new Promise((ok) => setTimeout(ok, 2500));
      }

      state.ns = res.ns; state.name = res.name; state.pdf = doc;
      resetChat(res.name);
      setStatus(`✅ <b>${esc(res.name)}</b> is ready (${res.pages} pages). Ask anything below.`);
      addMsg(esc(`Your document "${res.name}" is ready. Ask me anything about it. I answer only from the document and show the page for every answer.`), 'bot');
      setReady(true);
      input.focus();
    } catch (err) {
      setStatus(esc(errText(err.code)), true);
      if (state.ns) setReady(true);
    } finally {
      state.busy = false;
    }
  });

  // ---------- ask ----------
  function renderAnswer(j) {
    let html = '';
    for (const p of j.parts && j.parts.length ? j.parts : [{ text: j.answer, refs: [] }]) {
      html += esc(p.text).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
      for (const n of p.refs) html += `<button type="button" class="ref" data-n="${n}" aria-label="Source ${n}">${n}</button>`;
    }
    const pages = [...new Set(j.sources.map((s) => s.page))].sort((a, b) => a - b);
    if (pages.length) html += `<span class="src-line">📄 Page ${pages.join(', ')}</span>`;
    else html += '<span class="src-line">No page cited</span>';
    return html;
  }

  function renderSources(sources) {
    const box = $('sources');
    if (!sources.length) { box.innerHTML = '<div class="src-empty">No source for this answer: the document does not cover it.</div>'; return; }
    box.innerHTML = sources.map((s) => `
      <div class="src" id="src-${s.n}">
        <div class="src-head"><b>[${s.n}] Page ${s.page}</b>${state.pdf ? `<button type="button" class="page-btn" data-page="${s.page}" data-n="${s.n}">Open page ${s.page}</button>` : ''}</div>
        <q>${esc(s.quote)}</q>
      </div>`).join('');
    box._sources = sources;
  }

  body.addEventListener('click', (e) => {
    const b = e.target.closest('.ref');
    if (!b) return;
    const el = $('src-' + b.dataset.n);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  });

  async function ask(q) {
    q = String(q || '').trim();
    if (!q || !state.ns || state.busy) return;
    state.busy = true; setReady(false);
    addMsg(esc(q), 'user');
    input.value = '';
    const t = typing();
    try {
      const j = await post('/docs/ask', { ns: state.ns, question: q, history: state.history.slice(-4) });
      t.innerHTML = renderAnswer(j);
      renderSources(j.sources || []);
      state.history.push({ role: 'user', content: q }, { role: 'assistant', content: j.answer });
      if (typeof j.remaining === 'number' && j.remaining <= 3) note(`${j.remaining} free questions left today.`);
    } catch (err) {
      t.remove();
      note(errText(err.code));
      if (err.code === 'doc_expired') { state.ns = null; resetChat(); setQuick([]); markTab(null); }
    } finally {
      state.busy = false;
      if (state.ns) { setReady(true); input.focus({ preventScroll: true }); }
      scroll();
    }
  }
  $('askForm').addEventListener('submit', (e) => { e.preventDefault(); ask(input.value); });

  // ---------- open the cited page ----------
  const modal = $('pgModal');
  async function openPage(page, n) {
    if (!state.pdf) return;
    const src = ($('sources')._sources || []).find((s) => String(s.n) === String(n));
    $('pgTitle').textContent = `${state.name} · page ${page}`;
    $('pgQuote').textContent = src ? '“' + src.quote + '”' : '';
    modal.hidden = false;
    const p = await state.pdf.getPage(Number(page));
    const vp = p.getViewport({ scale: 1.6 });
    const c = $('pgCanvas');
    c.width = vp.width; c.height = vp.height;
    await p.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
  }
  $('sources').addEventListener('click', (e) => {
    const b = e.target.closest('.page-btn');
    if (b) openPage(b.dataset.page, b.dataset.n);
  });
  const closeModal = () => { modal.hidden = true; };
  $('pgClose').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  // ---------- test results (filled in from assets/samples/docs/eval.json when it exists) ----------
  fetch('assets/samples/docs/eval.json').then((r) => (r.ok ? r.json() : null)).then((ev) => {
    if (!ev || !ev.total) return;
    $('evalIntro').textContent = `We test this demo with ${ev.total} questions about the two sample documents, with the right answer and page written down by hand. ${ev.unanswerable} of them are NOT in the documents, to check that it says so instead of guessing.`;
    const pct = (x, of) => Math.round((100 * x) / of) + '%';
    $('evalNums').innerHTML = [
      [pct(ev.correct, ev.total), 'answers correct'],
      [pct(ev.right_page, ev.answerable), 'cited the right page'],
      [`${ev.refused_ok}/${ev.unanswerable}`, 'said "not in the document" when it wasn\'t'],
    ].map(([b, s]) => `<div class="eval-num"><b>${b}</b><span>${s}</span></div>`).join('');
    $('evalNote').textContent = `Last run: ${ev.date}. Answers checked by an AI grader against the expected answer.`;
    $('evalCard').hidden = false;
  }).catch(() => {});

  // Start with the school sample, so there is something to try right away.
  useSample('sample-school');
})();
