// Bill checks for the Kodivo Bill Reader demo. Runs in the browser (and in Node for tests).
// The AI copies what is printed; these rules decide what a person should double-check.
(function (root) {
  const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

  // GSTIN check digit (15th character), mod-36 algorithm used by the GST system.
  function gstinCheckChar(first14) {
    let sum = 0;
    for (let i = 0; i < 14; i++) {
      const p = CHARS.indexOf(first14[i]) * (i % 2 ? 2 : 1);
      sum += Math.floor(p / 36) + (p % 36);
    }
    return CHARS[(36 - (sum % 36)) % 36];
  }
  function gstinStatus(g) {
    if (!g) return 'missing';
    const s = String(g).replace(/\s/g, '').toUpperCase();
    if (!GSTIN_RE.test(s)) return 'bad_format';
    if (Number(s.slice(0, 2)) < 1 || Number(s.slice(0, 2)) > 38) return 'bad_state';
    return gstinCheckChar(s.slice(0, 14)) === s[14] ? 'ok' : 'bad_check';
  }

  const n = (v) => (v === null || v === undefined || v === '' || isNaN(Number(v)) ? null : Number(v));
  const money = (v) => '₹' + Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const near = (a, b, tol) => Math.abs(a - b) <= Math.max(tol, Math.abs(b) * 0.005);

  function checkBill(bill, today) {
    const out = [];
    const add = (level, field, msg) => out.push({ level, field, msg });
    const items = Array.isArray(bill.items) ? bill.items : [];
    const total = n(bill.total);

    if (bill.document_type === 'not_a_bill') { add('error', 'document_type', 'This does not look like a bill.'); return out; }
    if (total === null) add('error', 'total', 'Total not found. Please type it.');
    if (!items.length) add('warn', 'items', 'No items found.');

    // 1. each line: quantity × rate ≈ amount (before tax/discount differences)
    items.forEach((it, i) => {
      const q = n(it.quantity), r = n(it.rate), a = n(it.amount);
      if (a === null) { add('warn', `items.${i}.amount`, `Item ${i + 1}: amount missing.`); return; }
      if (q !== null && r !== null) {
        const base = q * r;
        const afterDisc = base * (1 - (n(it.discount_percent) || 0) / 100);
        const withTax = afterDisc * (1 + (n(it.tax_percent) || 0) / 100);
        if (!near(base, a, 1) && !near(afterDisc, a, 1) && !near(withTax, a, 1)) {
          add('warn', `items.${i}.amount`, `Item ${i + 1}: ${q} × ${r} = ${money(base)}, but the bill says ${money(a)}.`);
        }
      }
    });

    // 2. items add up to the bill (with taxes, charges, discount and round-off)
    const itemSum = items.reduce((s, it) => s + (n(it.amount) || 0), 0);
    if (items.length && total !== null) {
      const sub = n(bill.subtotal);
      if (sub !== null && !near(itemSum, sub, 1)) add('warn', 'subtotal', `Items add up to ${money(itemSum)}, but the subtotal says ${money(sub)}.`);
      const extra = (n(bill.cgst) || 0) + (n(bill.sgst) || 0) + (n(bill.igst) || 0) + (n(bill.other_charges) || 0) - (n(bill.discount_total) || 0) + (n(bill.round_off) || 0);
      const candidates = [itemSum, itemSum + extra, (sub ?? itemSum) + extra];
      if (!candidates.some((c) => near(c, total, 1.5))) {
        add('error', 'total', `Total does not match: items${extra ? ' + taxes/charges' : ''} = ${money(itemSum + extra)}, but the bill says ${money(total)}.`);
      } else {
        add('ok', 'total', `Total matches the items (${money(total)}).`);
      }
    }

    // 3. GST rules
    const cg = n(bill.cgst), sg = n(bill.sgst), ig = n(bill.igst);
    if (cg !== null && sg !== null && !near(cg, sg, 0.5)) add('warn', 'cgst', `CGST (${money(cg)}) and SGST (${money(sg)}) are usually equal.`);
    if (ig && (cg || sg)) add('warn', 'igst', 'Both IGST and CGST/SGST are charged. Usually it is one or the other.');
    for (const [field, label] of [['vendor_gstin', 'Seller GSTIN'], ['buyer_gstin', 'Buyer GSTIN']]) {
      const st = gstinStatus(bill[field]);
      if (st === 'ok') add('ok', field, `${label} is valid.`);
      else if (st === 'bad_format') add('error', field, `${label} "${bill[field]}" is not in GSTIN format (15 characters).`);
      else if (st === 'bad_state') add('error', field, `${label} has a wrong state code.`);
      else if (st === 'bad_check') add('error', field, `${label} check digit is wrong. It may be misread or fake.`);
      else if (field === 'vendor_gstin' && (cg || sg || ig)) add('warn', field, 'GST is charged but the seller GSTIN is missing.');
    }

    // 4. date
    const d = bill.invoice_date;
    if (!d) add('warn', 'invoice_date', 'Bill date not found.');
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || isNaN(new Date(d + 'T00:00:00'))) add('warn', 'invoice_date', `Date "${d}" is not clear.`);
    else if (d > (today || new Date().toISOString().slice(0, 10))) add('error', 'invoice_date', 'Bill date is in the future.');

    // 5. what the AI itself was unsure about
    (bill.unreadable || []).forEach((f) => add('warn', String(f), `Not clearly readable: ${f}. Please check.`));
    if (bill.confidence === 'low') add('warn', 'confidence', 'The photo was hard to read. Check every value.');
    return out;
  }

  const api = { checkBill, gstinStatus, gstinCheckChar };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BillCheck = api;
})(this);
