// Kodivo Bill Reader demo: photo → AI (Kodivo demo API /bill) → editable table + checks → Excel.
(function () {
  const $ = (id) => document.getElementById(id);

  // footer year + theme (same as the chatbot demo)
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

  const HEAD = [
    ['vendor_name', 'Seller'], ['vendor_gstin', 'Seller GSTIN'], ['invoice_number', 'Bill / invoice no.'], ['invoice_date', 'Date (YYYY-MM-DD)'],
    ['buyer_name', 'Buyer'], ['buyer_gstin', 'Buyer GSTIN'], ['payment_mode', 'Payment'], ['vendor_phone', 'Seller phone'],
  ];
  const COLS = [
    ['description', 'Item', ''], ['hsn', 'HSN', 'sm'], ['batch', 'Batch', 'sm'], ['expiry', 'Expiry', 'sm'],
    ['quantity', 'Qty', 'num'], ['unit', 'Unit', 'sm'], ['rate', 'Rate', 'num'], ['tax_percent', 'GST %', 'num'], ['amount', 'Amount', 'num'],
  ];
  const TOTALS = [['subtotal', 'Subtotal'], ['cgst', 'CGST'], ['sgst', 'SGST'], ['igst', 'IGST'], ['other_charges', 'Other charges'], ['discount_total', 'Discount'], ['round_off', 'Round off'], ['total', 'TOTAL']];
  const NUMERIC = new Set(['quantity', 'rate', 'tax_percent', 'amount', 'discount_percent', 'subtotal', 'cgst', 'sgst', 'igst', 'other_charges', 'discount_total', 'round_off', 'total']);
  const TYPE_LABEL = { tax_invoice: 'GST invoice', bill_of_supply: 'Bill of supply', cash_memo: 'Cash memo', handwritten_bill: 'Handwritten bill', receipt: 'Receipt', estimate: 'Estimate', not_a_bill: 'Not a bill' };

  const session = []; // every bill read in this visit: { bill, name }
  let cur = null;     // the bill being shown
  let busy = false;

  function status(msg, isErr) { const s = $('status'); s.className = 'br-status' + (isErr ? ' err' : ''); s.innerHTML = msg; }

  // Phone photos can be 5-10 MB. Shrink to max 1600 px as JPEG before sending (faster, cheaper, enough to read).
  function toJpegBase64(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        const dataUrl = c.toDataURL('image/jpeg', 0.85);
        resolve({ media_type: 'image/jpeg', data: dataUrl.split(',')[1], preview: dataUrl });
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')); };
      img.src = url;
    });
  }
  function fileBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1]);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  async function readBill(blob, name) {
    if (busy) return;
    busy = true;
    try {
      let payload, preview;
      if (blob.type === 'application/pdf') {
        if (blob.size > 4.5 * 1024 * 1024) throw new Error('pdf_big');
        payload = { media_type: 'application/pdf', data: await fileBase64(blob) };
        preview = null;
      } else {
        const img = await toJpegBase64(blob);
        payload = { media_type: img.media_type, data: img.data };
        preview = img.preview;
      }
      status('<span class="spinner"></span>Reading the bill… (about 5–15 seconds)');
      const t0 = performance.now();
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 60000);
      let r, data;
      try {
        r = await fetch(API + '/bill', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctrl.signal });
        data = await r.json().catch(() => ({}));
      } finally { clearTimeout(timer); }
      if (!r.ok) throw new Error(data.error || 'http_' + r.status);
      const secs = ((performance.now() - t0) / 1000).toFixed(1);
      const bill = normalise(data.bill || {});
      cur = { bill, name, preview, secs };
      session.push(cur);
      if (bill.document_type === 'not_a_bill') status('This does not look like a bill. Please try a clearer photo of a bill or invoice.', true);
      else status(`Done in ${secs} s. Check the highlighted values, correct anything wrong, then download.` + (data.remaining <= 2 ? ` (${data.remaining} demo reads left today)` : ''));
      render();
    } catch (e) {
      const m = e.message;
      status(
        m === 'daily_limit' ? "You've reached today's demo limit (10 bills). WhatsApp us for a full demo: 92352 66579" :
        m === 'slow_down' ? 'Please wait a few seconds and try again.' :
        m === 'pdf_big' ? 'This PDF is too big for the demo (max 4.5 MB). Try a photo instead.' :
        m === 'image' ? 'Could not open this image. Please use a JPG or PNG photo.' :
        m === 'demo_busy' ? 'The demo is busy right now. Please try again later.' :
        m === 'too_long' ? 'This bill is too long for the demo. Try a photo of one page.' :
        m === 'refused' ? 'This image could not be processed. Please try a different bill.' :
        'Could not read the bill right now. Please try again.', true);
    } finally { busy = false; $('file').value = ''; }
  }

  // The API uses "" for missing text and 0 for missing small amounts; show those as empty boxes.
  function normalise(b) {
    for (const k of Object.keys(b)) if (b[k] === '') b[k] = null;
    for (const k of ['discount_total', 'other_charges', 'round_off']) if (b[k] === 0) b[k] = null;
    b.items = Array.isArray(b.items) ? b.items : [];
    b.items.forEach((it) => {
      for (const k of Object.keys(it)) if (it[k] === '') it[k] = null;
      for (const k of ['discount_percent', 'tax_percent']) if (it[k] === 0) it[k] = null;
    });
    b.unreadable = Array.isArray(b.unreadable) ? b.unreadable : [];
    return b;
  }

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const input = (path, val, cls) => `<input class="br-in ${cls || ''}" data-path="${path}" value="${esc(val)}"${NUMERIC.has(path.split('.').pop()) ? ' inputmode="decimal"' : ''}>`;

  function render() {
    $('result').hidden = false;
    const b = cur.bill;
    $('preview').innerHTML = cur.preview ? `<img src="${cur.preview}" alt="Uploaded bill">` : '<div class="pdf">📄 PDF uploaded</div>';
    $('meta').innerHTML = `<span class="tag">${esc(TYPE_LABEL[b.document_type] || 'Bill')}</span>${b.handwritten ? '<span class="tag">✍️ Handwritten</span>' : ''}<span class="tag">AI confidence: ${esc(b.confidence || '?')}</span>`;
    $('fields').innerHTML = HEAD.map(([k, l]) => `<label>${l}${input(k, b[k])}</label>`).join('');
    $('items').innerHTML = '<tr>' + COLS.map(([, l]) => `<th>${l}</th>`).join('') + '<th></th></tr>' +
      b.items.map((it, i) => '<tr>' + COLS.map(([k, , cls]) => `<td>${input(`items.${i}.${k}`, it[k], cls)}</td>`).join('') +
        `<td><button type="button" class="btn btn-outline btn-sm" data-del="${i}" aria-label="Delete row">✕</button></td></tr>`).join('');
    $('totals').innerHTML = TOTALS.map(([k, l]) => `<label>${l}${input(k, b[k])}</label>`).join('');
    $('sessionInfo').textContent = session.length === 1 ? '1 bill read. Upload more: the Excel will include all of them.' : `${session.length} bills read in this session. Excel includes all of them.`;
    runChecks();
  }

  function runChecks() {
    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const res = window.BillCheck.checkBill(cur.bill, today);
    const order = { error: 0, warn: 1, ok: 2 };
    res.sort((a, b) => order[a.level] - order[b.level]);
    const icon = { ok: '✅', warn: '⚠️', error: '❌' };
    $('checks').innerHTML = res.length ? res.map((c) => `<li class="${c.level}">${icon[c.level]} ${esc(c.msg)}</li>`).join('') : '<li class="ok">✅ No problems found.</li>';
    // highlight the fields the checks talk about
    document.querySelectorAll('.br-in').forEach((el) => el.classList.remove('f-error', 'f-warn'));
    res.forEach((c) => {
      if (c.level === 'ok') return;
      const el = document.querySelector(`.br-in[data-path="${c.field}"]`);
      if (el) el.classList.add(c.level === 'error' ? 'f-error' : 'f-warn');
    });
  }

  // edits: update the bill object and re-check
  document.addEventListener('input', (e) => {
    const el = e.target.closest('.br-in');
    if (!el || !cur) return;
    const parts = el.dataset.path.split('.');
    const key = parts[parts.length - 1];
    let v = el.value.trim();
    if (NUMERIC.has(key)) v = v === '' ? null : Number(v.replace(/[,₹\s]/g, ''));
    else if (key.endsWith('gstin')) v = v.toUpperCase() || null;
    else v = v || null;
    if (parts[0] === 'items') cur.bill.items[Number(parts[1])][key] = v;
    else cur.bill[key] = v;
    runChecks();
  });
  document.addEventListener('click', (e) => {
    const del = e.target.closest('[data-del]');
    if (del && cur) { cur.bill.items.splice(Number(del.dataset.del), 1); render(); }
  });
  $('addRow').addEventListener('click', () => { if (cur) { cur.bill.items.push({ description: '', quantity: null, rate: null, amount: null }); render(); } });

  $('file').addEventListener('change', (e) => { const f = e.target.files[0]; if (f) readBill(f, f.name); });
  document.querySelectorAll('[data-sample]').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      status('<span class="spinner"></span>Loading sample…');
      const blob = await (await fetch(btn.dataset.sample)).blob();
      readBill(blob, btn.textContent.replace(/^\S+\s/, '') + ' (sample)');
    } catch (e) { status('Could not load the sample.', true); }
  }));

  // ---------- export ----------
  const ITEM_COLS = ['Bill', 'Seller', 'Seller GSTIN', 'Bill no.', 'Date', 'Item', 'HSN', 'Batch', 'Expiry', 'Qty', 'Unit', 'Rate', 'GST %', 'Amount'];
  function itemRows() {
    const rows = [];
    session.forEach((s, i) => s.bill.items.forEach((it) => rows.push([i + 1, s.bill.vendor_name, s.bill.vendor_gstin, s.bill.invoice_number, s.bill.invoice_date,
      it.description, it.hsn, it.batch, it.expiry, it.quantity, it.unit, it.rate, it.tax_percent, it.amount].map((v) => v ?? ''))));
    return rows;
  }
  function billRows() {
    return session.map((s, i) => {
      const b = s.bill;
      const problems = window.BillCheck.checkBill(b).filter((c) => c.level !== 'ok').map((c) => c.msg).join(' | ');
      return [i + 1, s.name, b.vendor_name, b.vendor_gstin, b.invoice_number, b.invoice_date, b.subtotal, b.cgst, b.sgst, b.igst, b.round_off, b.total, b.payment_mode, problems || 'OK'].map((v) => v ?? '');
    });
  }
  const BILL_COLS = ['Bill', 'File', 'Seller', 'Seller GSTIN', 'Bill no.', 'Date', 'Subtotal', 'CGST', 'SGST', 'IGST', 'Round off', 'Total', 'Payment', 'Checks'];

  function download(name, blob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  const stamp = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10); // local date

  $('csvBtn').addEventListener('click', () => {
    const cell = (v) => /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
    const csv = [ITEM_COLS, ...itemRows()].map((r) => r.map(cell).join(',')).join('\r\n');
    download(`bills-${stamp()}.csv`, new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  });

  let xlsxLoading = null;
  function loadXlsx() {
    if (window.XLSX) return Promise.resolve();
    return xlsxLoading || (xlsxLoading = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      s.onload = res; s.onerror = () => { xlsxLoading = null; rej(new Error('xlsx')); };
      document.head.appendChild(s);
    }));
  }
  $('xlsxBtn').addEventListener('click', async () => {
    try {
      await loadXlsx();
      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.aoa_to_sheet([BILL_COLS, ...billRows()]);
      const ws2 = XLSX.utils.aoa_to_sheet([ITEM_COLS, ...itemRows()]);
      ws1['!cols'] = BILL_COLS.map((c) => ({ wch: c === 'Checks' ? 60 : c === 'Seller' || c === 'File' ? 28 : 14 }));
      ws2['!cols'] = ITEM_COLS.map((c) => ({ wch: c === 'Item' || c === 'Seller' ? 28 : 12 }));
      XLSX.utils.book_append_sheet(wb, ws1, 'Bills');
      XLSX.utils.book_append_sheet(wb, ws2, 'Items');
      XLSX.writeFile(wb, `bills-${stamp()}.xlsx`);
    } catch (e) {
      status('Excel download failed. Use the CSV button instead.', true);
    }
  });
})();
