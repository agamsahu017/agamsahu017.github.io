// DSA course: language switch, progress tracking, quizzes, copy buttons and
// the small visualizers. Progress is kept only in this browser (localStorage).
(function () {
  const LANG_KEY = "kodivo-lang"; // shared with the main site's i18n.js
  const PROGRESS_KEY = "kodivo-dsa-progress";

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
    },
  };
  const both = (en, hi) => `<span class="en">${en}</span><span class="hi">${hi}</span>`;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- language ----------
  function getLang() {
    try {
      const fromUrl = new URLSearchParams(location.search).get("lang");
      if (fromUrl === "hi" || fromUrl === "en") localStorage.setItem(LANG_KEY, fromUrl);
      return localStorage.getItem(LANG_KEY) === "hi" ? "hi" : "en";
    } catch (e) {
      return new URLSearchParams(location.search).get("lang") === "hi" ? "hi" : "en";
    }
  }
  const langBtn = document.createElement("button");
  langBtn.type = "button";
  langBtn.className = "lang-btn";
  const actions = document.querySelector(".nav-actions");
  // English-only courses (like the interview series) have no Hindi copy, so no switch.
  const enOnly = document.documentElement.hasAttribute("data-en-only");
  if (actions && !enOnly) actions.insertBefore(langBtn, actions.firstChild);
  function applyLang(lang) {
    document.documentElement.lang = lang;
    langBtn.textContent = lang === "hi" ? "EN" : "हिंदी";
    langBtn.setAttribute("aria-label", lang === "hi" ? "Switch to English" : "हिंदी में देखें");
  }
  applyLang(enOnly ? "en" : getLang());
  langBtn.addEventListener("click", () => {
    const next = document.documentElement.lang === "hi" ? "en" : "hi";
    try { localStorage.setItem(LANG_KEY, next); } catch (e) {}
    applyLang(next);
  });

  // ---------- progress ----------
  const progress = store.get(PROGRESS_KEY, { modules: {}, problems: {} });
  progress.modules = progress.modules || {};
  progress.problems = progress.problems || {};
  const save = () => store.set(PROGRESS_KEY, progress);

  document.querySelectorAll("input[data-problem]").forEach((box) => {
    box.checked = !!progress.problems[box.dataset.problem];
    box.addEventListener("change", () => {
      if (box.checked) progress.problems[box.dataset.problem] = true;
      else delete progress.problems[box.dataset.problem];
      save();
    });
  });

  document.querySelectorAll("[data-complete]").forEach((btn) => {
    const id = btn.dataset.complete;
    const render = () => {
      const done = !!progress.modules[id];
      btn.innerHTML = done ? both("✅ Completed (click to undo)", "✅ पूरा हो गया (वापस करने के लिए क्लिक करें)")
                           : both("Mark this module as complete", "इस मॉड्यूल को पूरा मार्क करें");
      btn.classList.toggle("btn-primary", !done);
      btn.classList.toggle("btn-outline", done);
    };
    render();
    btn.addEventListener("click", () => {
      if (progress.modules[id]) delete progress.modules[id];
      else progress.modules[id] = true;
      save();
      render();
    });
  });

  const cards = document.querySelectorAll("[data-module]");
  if (cards.length) {
    let done = 0;
    cards.forEach((card) => {
      if (progress.modules[card.dataset.module]) {
        done++;
        card.classList.add("done");
        const status = card.querySelector(".status");
        if (status) status.innerHTML = both("Done", "पूरा");
      }
    });
    const total = document.querySelectorAll(".module").length;
    const bar = document.querySelector(".progress span");
    const text = document.querySelector(".progress-text");
    if (bar) bar.style.width = Math.round((done / total) * 100) + "%";
    if (text) text.innerHTML = both(`${done} of ${total} modules completed`, `${total} में से ${done} मॉड्यूल पूरे`);
  }

  // ---------- copy buttons ----------
  document.querySelectorAll("pre.code[data-copy]").forEach((pre) => {
    const wrap = document.createElement("div");
    wrap.className = "code-wrap";
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.textContent = "Copy";
    btn.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(pre.innerText); btn.textContent = "Copied ✓"; }
      catch (e) { btn.textContent = "Select & copy"; }
      setTimeout(() => (btn.textContent = "Copy"), 1500);
    });
    wrap.appendChild(btn);
  });

  // ---------- quiz ----------
  const quizData = document.getElementById("quiz-data");
  const quizBox = document.getElementById("quiz");
  if (quizData && quizBox) {
    const questions = JSON.parse(quizData.textContent);
    let answered = 0, correct = 0;
    const score = document.createElement("p");
    score.className = "score";
    questions.forEach((q, qi) => {
      const el = document.createElement("div");
      el.className = "q";
      el.innerHTML = `<div class="q-text">${qi + 1}. ${both(q.q.en, q.q.hi)}</div>` +
        (q.code ? `<pre class="code">${q.code}</pre>` : "") +
        `<div class="opts"></div><div class="why" hidden></div>`;
      const opts = el.querySelector(".opts");
      q.options.forEach((opt, oi) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "opt";
        b.innerHTML = typeof opt === "string" ? opt : both(opt.en, opt.hi);
        b.addEventListener("click", () => {
          opts.querySelectorAll(".opt").forEach((x, xi) => {
            x.disabled = true;
            if (xi === q.answer) x.classList.add("right");
          });
          if (oi !== q.answer) b.classList.add("wrong"); else correct++;
          answered++;
          const why = el.querySelector(".why");
          why.innerHTML = (oi === q.answer ? both("✅ Correct. ", "✅ सही। ") : both("❌ Not quite. ", "❌ सही नहीं। ")) + both(q.why.en, q.why.hi);
          why.hidden = false;
          if (answered === questions.length) {
            score.innerHTML = both(`Your score: ${correct} / ${questions.length}`, `आपका स्कोर: ${correct} / ${questions.length}`);
          }
        });
        opts.appendChild(b);
      });
      quizBox.appendChild(el);
    });
    quizBox.appendChild(score);
  }

  // ---------- glossary: explain hard words on first use (hover or tap) ----------
  const gData = document.getElementById("glossary-data");
  if (gData) {
    const terms = JSON.parse(gData.textContent);
    const list = [];
    terms.forEach((t) => t.m.forEach((m) => list.push({ m, t, re: new RegExp(`\\b${m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, /[A-Z]/.test(m) ? "" : "i") })));
    list.sort((a, b) => b.m.length - a.m.length);
    const SKIP = "pre, code, a, button, h1, h2, h3, summary, .table-wrap, .viz, .flow, .q, .term, .toc, .lesson-meta, .badge";
    ["en", "hi"].forEach((lang) => {
      const used = new Set();
      document.querySelectorAll(`.lesson section .${lang}`).forEach((root) => {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode: (n) => (n.parentElement.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
        });
        const queue = [];
        while (walker.nextNode()) queue.push(walker.currentNode);
        while (queue.length) {
          const node = queue.shift();
          let best = null;
          for (const item of list) {
            if (used.has(item.t.s)) continue;
            const hit = item.re.exec(node.nodeValue);
            if (hit && (!best || hit.index < best.index)) best = { index: hit.index, len: hit[0].length, item };
          }
          if (!best) continue;
          used.add(best.item.t.s);
          const mid = node.splitText(best.index);
          const rest = mid.splitText(best.len);
          const span = document.createElement("span");
          span.className = "term";
          span.tabIndex = 0;
          span.dataset.def = best.item.t[lang];
          span.textContent = mid.nodeValue;
          mid.replaceWith(span);
          queue.unshift(rest);
        }
      });
    });
  }

  // ---------- step-by-step diagrams: Play / Back / Next with one narration line per step ----------
  document.querySelectorAll(".flow[data-steps]").forEach((fig) => {
    let lines;
    try { lines = JSON.parse(fig.dataset.steps); } catch (e) { return; }
    const row = fig.querySelector(".flow-row");
    const steps = [...row.children].filter((c) => !c.classList.contains("arrow"));
    const arrows = [...row.children].filter((c) => c.classList.contains("arrow"));
    if (steps.length !== lines.length) return;
    steps.forEach((s) => s.classList.add("step"));
    const bar = document.createElement("div");
    bar.className = "flow-player";
    bar.innerHTML = '<div class="flow-say" aria-live="polite"></div><div class="flow-ctrl">' +
      '<button type="button" data-a="back" aria-label="Previous step">◀ Back</button>' +
      '<button type="button" data-a="play" class="play">▶ Play</button>' +
      '<button type="button" data-a="next" aria-label="Next step">Next ▶</button>' +
      '<span class="flow-count"></span></div>';
    fig.insertBefore(bar, row.nextSibling);
    const say = bar.querySelector(".flow-say");
    const count = bar.querySelector(".flow-count");
    const playBtn = bar.querySelector(".play");
    let i = -1, timer = null;
    say.textContent = "Press ▶ Play to see it step by step, or use Next to go at your own pace.";
    function show(k) {
      i = Math.max(0, Math.min(k, steps.length - 1));
      fig.classList.add("playing");
      steps.forEach((s, j) => { s.classList.toggle("active", j === i); s.classList.toggle("done", j < i); });
      arrows.forEach((a, j) => a.classList.toggle("done", j < i));
      say.textContent = lines[i];
      count.textContent = `Step ${i + 1} of ${steps.length}`;
    }
    function stop(label) { clearTimeout(timer); timer = null; playBtn.textContent = label || "▶ Play"; }
    function tick() {
      if (i >= steps.length - 1) { stop("↺ Replay"); return; }
      show(i + 1);
      timer = setTimeout(tick, 1800 + lines[i].length * 45); // longer lines stay longer
    }
    bar.addEventListener("click", (ev) => {
      const a = ev.target.closest("button")?.dataset.a;
      if (!a) return;
      if (a === "play") {
        if (timer) { stop("▶ Resume"); return; }
        if (i >= steps.length - 1) i = -1;
        playBtn.textContent = "❚❚ Pause";
        if (i < 0) { show(0); timer = setTimeout(tick, 1800 + lines[0].length * 45); } else tick();
      } else { stop(i >= 0 && i < steps.length - 1 ? "▶ Resume" : undefined); show(a === "next" ? i + 1 : i - 1); if (i === steps.length - 1) playBtn.textContent = "↺ Replay"; }
    });
  });

  // ---------- glossary page search ----------
  const gSearch = document.getElementById("gloss-search");
  if (gSearch) {
    const items = document.querySelectorAll(".gloss-item");
    const groups = document.querySelectorAll(".gloss-group");
    gSearch.addEventListener("input", () => {
      const qv = gSearch.value.trim().toLowerCase();
      items.forEach((it) => { it.hidden = qv && !it.textContent.toLowerCase().includes(qv); });
      groups.forEach((g) => { g.hidden = ![...g.querySelectorAll(".gloss-item")].some((it) => !it.hidden); });
    });
  }

  // ---------- shared cell renderer ----------
  function renderCells(container, values, showIndex = true) {
    container.innerHTML = values.map((v, i) =>
      `<div class="cell"><div class="box">${String(v).replace(/</g, "&lt;")}</div>${showIndex ? `<div class="idx">${i}</div>` : ""}</div>`).join("");
    return [...container.children];
  }
  const setMsg = (el, en, hi) => { el.innerHTML = both(en, hi); };

  // ---------- Big-O growth ----------
  const bigo = document.getElementById("bigo-viz");
  if (bigo) {
    const range = bigo.querySelector("input[type=range]");
    const nOut = bigo.querySelector("[data-n]");
    const rows = [
      ["O(1)", () => 1],
      ["O(log n)", (n) => Math.max(1, Math.ceil(Math.log2(n)))],
      ["O(n)", (n) => n],
      ["O(n log n)", (n) => Math.ceil(n * Math.max(1, Math.log2(n)))],
      ["O(n²)", (n) => n * n],
    ];
    const bars = bigo.querySelector(".bars");
    bars.innerHTML = rows.map(([label]) => `<div class="row"><b>${label}</b><div class="bar"></div><span class="val"></span></div>`).join("");
    const update = () => {
      const n = Number(range.value);
      nOut.textContent = n.toLocaleString("en-IN");
      const values = rows.map(([, f]) => f(n));
      const max = Math.max(...values);
      [...bars.children].forEach((row, i) => {
        row.querySelector(".bar").style.width = Math.max(0.6, (values[i] / max) * 100) + "%";
        row.querySelector(".val").textContent = values[i].toLocaleString("en-IN");
      });
    };
    range.addEventListener("input", update);
    update();
  }

  // ---------- Array operations ----------
  const arrViz = document.getElementById("array-viz");
  if (arrViz) {
    let arr = [7, 3, 9, 4, 1];
    const cellsEl = arrViz.querySelector(".cells");
    const msg = arrViz.querySelector(".viz-msg");
    const valIn = arrViz.querySelector("[data-value]");
    const idxIn = arrViz.querySelector("[data-index]");
    let busy = false;
    const draw = () => renderCells(cellsEl, arr);
    draw();
    const readVal = () => {
      const v = Number(valIn.value);
      return Number.isFinite(v) && valIn.value !== "" ? v : Math.floor(Math.random() * 50) + 1;
    };
    const run = (fn) => async () => { if (busy) return; busy = true; try { await fn(); } finally { busy = false; } };

    arrViz.querySelector("[data-act=access]").addEventListener("click", run(async () => {
      const i = Number(idxIn.value);
      const cells = draw();
      if (!Number.isInteger(i) || i < 0 || i >= arr.length) {
        const shown = Number.isFinite(i) && idxIn.value !== "" ? i : "?";
        setMsg(msg, `Index ${shown} is outside the array (0 to ${arr.length - 1}). In JS you get <code>undefined</code>.`,
          `Index ${shown} array के बाहर है (0 से ${arr.length - 1})। JS में <code>undefined</code> मिलता है।`);
        return;
      }
      cells[i].classList.add("found");
      setMsg(msg, `<code>arr[${i}]</code> = ${arr[i]}. Found in <b>1 step</b>, because the computer jumps straight to the index: <b>O(1)</b>.`,
        `<code>arr[${i}]</code> = ${arr[i]}। सिर्फ़ <b>1 step</b> में मिला, क्योंकि computer सीधे उस index पर जाता है: <b>O(1)</b>।`);
    }));

    arrViz.querySelector("[data-act=push]").addEventListener("click", run(async () => {
      if (arr.length >= 12) { setMsg(msg, "The demo holds up to 12 items. Remove some first.", "डेमो में ज़्यादा से ज़्यादा 12 items हैं। पहले कुछ हटाएँ।"); return; }
      arr.push(readVal());
      const cells = draw();
      cells[cells.length - 1].classList.add("found");
      setMsg(msg, `<code>push()</code> adds at the end. No other item moves: <b>O(1)</b>.`,
        `<code>push()</code> आख़िर में जोड़ता है। कोई दूसरा item नहीं हिलता: <b>O(1)</b>।`);
    }));

    arrViz.querySelector("[data-act=unshift]").addEventListener("click", run(async () => {
      if (arr.length >= 12) { setMsg(msg, "The demo holds up to 12 items. Remove some first.", "डेमो में ज़्यादा से ज़्यादा 12 items हैं। पहले कुछ हटाएँ।"); return; }
      const v = readVal();
      let cells = draw();
      for (let i = cells.length - 1; i >= 0; i--) {
        cells[i].classList.add("moved");
        setMsg(msg, `Moving ${arr[i]} one place right to make space…`, `जगह बनाने के लिए ${arr[i]} को एक जगह दाएँ खिसका रहे हैं…`);
        await sleep(280);
      }
      arr.unshift(v);
      cells = draw();
      cells[0].classList.add("found");
      setMsg(msg, `<code>unshift()</code> adds at the start, so <b>every item had to move</b>: ${arr.length - 1} moves. That is <b>O(n)</b>.`,
        `<code>unshift()</code> शुरुआत में जोड़ता है, इसलिए <b>हर item को खिसकना पड़ा</b>: ${arr.length - 1} moves। यह <b>O(n)</b> है।`);
    }));

    arrViz.querySelector("[data-act=pop]").addEventListener("click", run(async () => {
      if (!arr.length) { setMsg(msg, "The array is empty.", "Array ख़ाली है।"); return; }
      const cells = draw();
      cells[cells.length - 1].classList.add("bad");
      await sleep(350);
      const v = arr.pop();
      draw();
      setMsg(msg, `<code>pop()</code> removed ${v} from the end. Nothing else moved: <b>O(1)</b>.`,
        `<code>pop()</code> ने आख़िर से ${v} हटाया। कुछ और नहीं हिला: <b>O(1)</b>।`);
    }));

    arrViz.querySelector("[data-act=shift]").addEventListener("click", run(async () => {
      if (!arr.length) { setMsg(msg, "The array is empty.", "Array ख़ाली है।"); return; }
      let cells = draw();
      cells[0].classList.add("bad");
      await sleep(350);
      for (let i = 1; i < cells.length; i++) {
        cells[i].classList.add("moved");
        setMsg(msg, `Moving ${arr[i]} one place left to fill the gap…`, `ख़ाली जगह भरने के लिए ${arr[i]} को एक जगह बाएँ खिसका रहे हैं…`);
        await sleep(280);
      }
      const v = arr.shift();
      draw();
      setMsg(msg, `<code>shift()</code> removed ${v} from the start, and <b>every other item moved</b>: <b>O(n)</b>.`,
        `<code>shift()</code> ने शुरुआत से ${v} हटाया, और <b>बाक़ी हर item खिसका</b>: <b>O(n)</b>।`);
    }));

    arrViz.querySelector("[data-act=search]").addEventListener("click", run(async () => {
      const target = Number(valIn.value);
      if (valIn.value === "" || !Number.isFinite(target)) { setMsg(msg, "Type a value to search for.", "ढूँढने के लिए कोई value लिखें।"); return; }
      const cells = draw();
      for (let i = 0; i < arr.length; i++) {
        cells[i].classList.add("active");
        setMsg(msg, `Step ${i + 1}: is arr[${i}] (${arr[i]}) equal to ${target}?`, `Step ${i + 1}: क्या arr[${i}] (${arr[i]}) बराबर है ${target} के?`);
        await sleep(450);
        if (arr[i] === target) {
          cells[i].classList.remove("active");
          cells[i].classList.add("found");
          setMsg(msg, `Found ${target} at index ${i} after ${i + 1} step(s). In the worst case we check all n items: <b>O(n)</b>.`,
            `${target} index ${i} पर ${i + 1} step में मिला। सबसे ख़राब स्थिति में सारे n items देखने पड़ते हैं: <b>O(n)</b>।`);
          return;
        }
        cells[i].classList.remove("active");
        cells[i].classList.add("dim");
      }
      setMsg(msg, `${target} is not in the array. We checked all ${arr.length} items: <b>O(n)</b>.`,
        `${target} array में नहीं है। हमने सारे ${arr.length} items देखे: <b>O(n)</b>।`);
    }));

    arrViz.querySelector("[data-act=reset]").addEventListener("click", run(async () => {
      arr = [7, 3, 9, 4, 1];
      draw();
      setMsg(msg, "Reset to [7, 3, 9, 4, 1].", "वापस [7, 3, 9, 4, 1] कर दिया।");
    }));
  }

  // ---------- Two pointers: palindrome ----------
  const pal = document.getElementById("pal-viz");
  if (pal) {
    const input = pal.querySelector("input");
    const cellsEl = pal.querySelector(".cells");
    const msg = pal.querySelector(".viz-msg");
    let busy = false;
    pal.querySelector("[data-act=check]").addEventListener("click", async () => {
      if (busy) return;
      busy = true;
      try {
        const s = input.value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16);
        if (!s) { setMsg(msg, "Type a word with letters or numbers.", "अक्षर या नंबर वाला कोई शब्द लिखें।"); return; }
        const cells = renderCells(cellsEl, s.split(""));
        let left = 0, right = s.length - 1;
        while (left < right) {
          cells[left].classList.add("active");
          cells[right].classList.add("active");
          setMsg(msg, `left = ${left} ('${s[left]}'), right = ${right} ('${s[right]}'). Same?`,
            `left = ${left} ('${s[left]}'), right = ${right} ('${s[right]}')। क्या दोनों एक जैसे हैं?`);
          await sleep(650);
          if (s[left] !== s[right]) {
            cells[left].classList.add("bad");
            cells[right].classList.add("bad");
            setMsg(msg, `'${s[left]}' ≠ '${s[right]}', so it is <b>not a palindrome</b>. We stopped early.`,
              `'${s[left]}' ≠ '${s[right]}', इसलिए यह <b>palindrome नहीं है</b>। हम जल्दी रुक गए।`);
            return;
          }
          cells[left].classList.replace("active", "found");
          cells[right].classList.replace("active", "found");
          left++; right--;
        }
        if (left === right) cells[left].classList.add("found");
        setMsg(msg, `All pairs matched, so "${s}" <b>is a palindrome</b>. Time O(n), extra space O(1).`,
          `सारे जोड़े मिल गए, इसलिए "${s}" <b>palindrome है</b>। Time O(n), extra space O(1)।`);
      } finally {
        busy = false;
      }
    });
  }

  // ---------- Frequency count: anagram ----------
  const ana = document.getElementById("anagram-viz");
  if (ana) {
    const [a, b] = ana.querySelectorAll("input");
    const freqEl = ana.querySelector(".freq");
    const msg = ana.querySelector(".viz-msg");
    const update = () => {
      const s = a.value.toLowerCase().replace(/[^a-z]/g, "");
      const t = b.value.toLowerCase().replace(/[^a-z]/g, "");
      const count = {};
      for (const ch of s) count[ch] = (count[ch] || 0) + 1;
      for (const ch of t) count[ch] = (count[ch] || 0) - 1;
      const keys = Object.keys(count).sort();
      freqEl.innerHTML = keys.map((k) => `<div class="${count[k] ? "bad" : ""}"><b>${k}</b>: ${count[k] > 0 ? "+" : ""}${count[k]}</div>`).join("");
      if (!s && !t) { setMsg(msg, "Type two words.", "दो शब्द लिखें।"); return; }
      const ok = s.length === t.length && keys.every((k) => count[k] === 0);
      if (ok) setMsg(msg, "Every count is 0, so these words <b>are anagrams</b>.", "हर count 0 है, इसलिए ये शब्द <b>anagram हैं</b>।");
      else setMsg(msg, "Some counts are not 0 (shown in red), so they are <b>not anagrams</b>.", "कुछ counts 0 नहीं हैं (लाल में), इसलिए ये <b>anagram नहीं हैं</b>।");
    };
    a.addEventListener("input", update);
    b.addEventListener("input", update);
    update();
  }

  // ---------- System design: back-of-envelope calculator ----------
  const est = document.getElementById("estimate-viz");
  if (est) {
    const field = (name) => est.querySelector(`[data-in=${name}]`);
    const out = (name) => est.querySelector(`[data-out=${name}]`);
    const fmt = (n) => (n >= 100 ? Math.round(n) : Math.round(n * 10) / 10).toLocaleString("en-IN");
    const size = (bytes) => {
      const units = ["B", "KB", "MB", "GB", "TB", "PB"];
      let i = 0;
      while (bytes >= 1000 && i < units.length - 1) { bytes /= 1000; i++; }
      return `${fmt(bytes)} ${units[i]}`;
    };
    const update = () => {
      const users = Math.max(0, Number(field("users").value) || 0);
      const perUser = Math.max(0, Number(field("per-user").value) || 0);
      const writePct = Math.min(100, Math.max(0, Number(field("write-pct").value) || 0));
      const kb = Math.max(0, Number(field("kb").value) || 0);
      const peak = Math.max(1, Number(field("peak").value) || 1);
      const perDay = users * perUser;
      const qps = perDay / 86400;
      const writesPerDay = perDay * (writePct / 100);
      const storagePerDay = writesPerDay * kb * 1000;
      out("per-day").textContent = fmt(perDay);
      out("qps").textContent = fmt(qps);
      out("peak").textContent = fmt(qps * peak);
      out("write-qps").textContent = fmt(writesPerDay / 86400);
      out("day").textContent = size(storagePerDay);
      out("year").textContent = size(storagePerDay * 365);
      out("five").textContent = size(storagePerDay * 365 * 5);
    };
    est.querySelectorAll("input").forEach((x) => x.addEventListener("input", update));
    update();
  }

  // ---------- System design: load balancer (round robin vs least connections) ----------
  const lb = document.getElementById("lb-viz");
  if (lb) {
    const serversEl = lb.querySelector(".servers");
    const msg = lb.querySelector(".viz-msg");
    const mode = lb.querySelector("select");
    let load, next, down, reqNo;
    const reset = () => { load = [0, 0, 0]; next = 0; down = [false, false, false]; reqNo = 0; draw(); };
    function draw(hit = -1) {
      serversEl.innerHTML = load.map((n, i) => `<button type="button" class="server${down[i] ? " down" : ""}${i === hit ? " hit" : ""}" data-i="${i}" title="Click to switch this server on/off"><b>Server ${i + 1}</b><span>${down[i] ? "❌ down" : `${n} ${n === 1 ? "request" : "requests"}`}</span><div class="meter"><i style="width:${Math.min(100, n * 10)}%"></i></div></button>`).join("");
    }
    serversEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".server");
      if (!btn) return;
      const i = Number(btn.dataset.i);
      down[i] = !down[i];
      draw();
      setMsg(msg, down[i] ? `Server ${i + 1} is down. The health check notices, and the load balancer stops sending traffic to it.` : `Server ${i + 1} is back. It starts getting requests again.`,
        down[i] ? `Server ${i + 1} बंद है। Health check इसे पकड़ लेता है, और load balancer इसे traffic भेजना बंद कर देता है।` : `Server ${i + 1} वापस आ गया। इसे फिर से requests मिलने लगीं।`);
    });
    lb.querySelector("[data-act=send]").addEventListener("click", () => {
      const alive = [0, 1, 2].filter((i) => !down[i]);
      if (!alive.length) { setMsg(msg, "All servers are down! This is why we need enough servers and alerts.", "सारे servers बंद हैं! इसीलिए पर्याप्त servers और alerts ज़रूरी हैं।"); return; }
      let pick;
      if (mode.value === "least") {
        pick = alive.reduce((best, i) => (load[i] < load[best] ? i : best), alive[0]);
      } else {
        for (let k = 0; k < 3; k++) { const c = (next + k) % 3; if (!down[c]) { pick = c; break; } }
        next = (pick + 1) % 3;
      }
      load[pick]++;
      reqNo++;
      draw(pick);
      const why = mode.value === "least" ? both("it has the fewest requests", "इस पर सबसे कम requests हैं") : both("it's next in turn", "अब इसकी बारी है");
      msg.innerHTML = both(`Request #${reqNo} → Server ${pick + 1}, because `, `Request #${reqNo} → Server ${pick + 1}, क्योंकि `) + why + ".";
    });
    lb.querySelector("[data-act=burst]").addEventListener("click", async () => {
      for (let k = 0; k < 6; k++) { lb.querySelector("[data-act=send]").click(); await sleep(220); }
    });
    lb.querySelector("[data-act=reset]").addEventListener("click", () => { reset(); setMsg(msg, "Reset. Send some requests.", "Reset हो गया। कुछ requests भेजिए।"); });
    reset();
  }

  // ---------- System design: LRU cache simulator ----------
  const lru = document.getElementById("cache-viz");
  if (lru) {
    const input = lru.querySelector("input");
    const cellsEl = lru.querySelector(".cells");
    const msg = lru.querySelector(".viz-msg");
    const stats = lru.querySelector(".cache-stats");
    const CAP = 3;
    let cache, hits, misses, busy = false;
    const reset = () => { cache = []; hits = 0; misses = 0; renderCells(cellsEl, ["·", "·", "·"], false); stats.textContent = ""; };
    reset();
    lru.querySelector("[data-act=run]").addEventListener("click", async () => {
      if (busy) return;
      busy = true;
      try {
        reset();
        const keys = input.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 16).split("");
        if (!keys.length) { setMsg(msg, "Type some letters, like A B C A D.", "कुछ अक्षर लिखिए, जैसे A B C A D।"); return; }
        for (const k of keys) {
          const idx = cache.indexOf(k);
          let en, hi;
          if (idx !== -1) {
            hits++;
            cache.splice(idx, 1);
            cache.push(k);
            en = `Get ${k}: <b>HIT</b> ✅ found in cache (fast). Moved to "most recent".`;
            hi = `${k} माँगा: <b>HIT</b> ✅ cache में मिल गया (तेज़)। "सबसे नया" में खिसकाया।`;
          } else {
            misses++;
            let evicted = "";
            if (cache.length === CAP) evicted = cache.shift();
            cache.push(k);
            en = `Get ${k}: <b>MISS</b> ❌ read from database (slow), then saved in cache.` + (evicted ? ` Cache full, so <b>${evicted}</b> (least recently used) was removed.` : "");
            hi = `${k} माँगा: <b>MISS</b> ❌ database से पढ़ा (धीमा), फिर cache में रखा।` + (evicted ? ` Cache भरा था, इसलिए <b>${evicted}</b> (सबसे पुराना इस्तेमाल) हटाया गया।` : "");
          }
          const shown = [...cache, ...Array(CAP - cache.length).fill("·")];
          const cells = renderCells(cellsEl, shown, false);
          const pos = cache.indexOf(k);
          cells[pos].classList.add(idx !== -1 ? "found" : "moved");
          setMsg(msg, en, hi);
          stats.innerHTML = both(`Hits: ${hits} · Misses: ${misses} · Hit rate: ${Math.round((hits / (hits + misses)) * 100)}%`, `Hits: ${hits} · Misses: ${misses} · Hit rate: ${Math.round((hits / (hits + misses)) * 100)}%`);
          await sleep(1100);
        }
      } finally {
        busy = false;
      }
    });
  }

  // ---------- AI: temperature and next-word probabilities ----------
  const tempViz = document.getElementById("temp-viz");
  if (tempViz) {
    // Example scores (logits) a model might give for the next word after "Chai ke saath…".
    const words = [["samosa", 3.2], ["biscuit", 2.6], ["pakode", 2.3], ["toast", 1.4], ["gossip", 0.8], ["cake", 0.5]];
    const range = tempViz.querySelector("input[type=range]");
    const tOut = tempViz.querySelector("[data-t]");
    const bars = tempViz.querySelector(".bars");
    const msg = tempViz.querySelector(".viz-msg");
    bars.innerHTML = words.map(([w]) => `<div class="row"><b>${w}</b><div class="bar"></div><span class="val"></span></div>`).join("");
    let probs = [];
    const update = () => {
      const t = Number(range.value);
      tOut.textContent = t.toFixed(1);
      const exps = words.map(([, logit]) => Math.exp(logit / t));
      const sum = exps.reduce((a, b) => a + b, 0);
      probs = exps.map((e) => e / sum);
      [...bars.children].forEach((row, i) => {
        row.querySelector(".bar").style.width = Math.max(0.8, probs[i] * 100) + "%";
        row.querySelector(".val").textContent = Math.round(probs[i] * 1000) / 10 + "%";
      });
    };
    tempViz.querySelector("[data-act=sample]").addEventListener("click", () => {
      let r = Math.random(), i = 0;
      while (i < probs.length - 1 && r > probs[i]) { r -= probs[i]; i++; }
      setMsg(msg, `The model picked: <b>"Chai ke saath ${words[i][0]}"</b>. Click again: at low temperature you'll almost always get the same word; at high temperature you'll see surprises.`,
        `Model ने चुना: <b>"Chai ke saath ${words[i][0]}"</b>। फिर से क्लिक कीजिए: कम temperature पर लगभग हमेशा वही शब्द आएगा; ज़्यादा temperature पर नए-नए शब्द दिखेंगे।`);
    });
    range.addEventListener("input", update);
    update();
  }

  // ---------- AI: rough token counter ----------
  const tokViz = document.getElementById("token-viz");
  if (tokViz) {
    const input = tokViz.querySelector("textarea");
    const out = tokViz.querySelector(".tokens");
    const msg = tokViz.querySelector(".viz-msg");
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    // Simplified illustration: common short words = 1 token, long words are cut
    // into pieces of ~4 characters, punctuation is separate. Real tokenizers differ.
    const tokenize = (text) => {
      const parts = text.match(/\s*[\p{L}\p{M}\p{N}]+|\s*[^\s\p{L}\p{M}\p{N}]/gu) || [];
      const pieces = [];
      for (const p of parts) {
        const lead = p.match(/^\s*/)[0];
        const word = p.slice(lead.length);
        if (word.length <= 5) { pieces.push(p); continue; }
        for (let i = 0; i < word.length; i += 4) pieces.push((i === 0 ? lead : "") + word.slice(i, i + 4));
      }
      return pieces;
    };
    const update = () => {
      const pieces = tokenize(input.value.slice(0, 600));
      out.innerHTML = pieces.map((p, i) => `<span class="tok t${i % 5}">${esc(p).replace(/ /g, "&nbsp;")}</span>`).join("");
      const words = (input.value.trim().match(/\S+/g) || []).length;
      setMsg(msg, `About <b>${pieces.length} tokens</b> for ${words} words (simplified example: real tokenizers split text a little differently).`,
        `${words} शब्दों के लिए लगभग <b>${pieces.length} tokens</b> (आसान उदाहरण: असली tokenizers text को थोड़ा अलग तरह से तोड़ते हैं)।`);
    };
    input.addEventListener("input", update);
    update();
  }

  // ---------- AI: toy "meaning map" for embeddings and retrieval ----------
  const embViz = document.getElementById("embed-viz");
  if (embViz) {
    // Hand-made 3-number "embeddings" so the idea is visible. Real ones have hundreds of numbers.
    const docs = [
      ["Consultation fee is ₹500", [0.9, 0.1, 0.05]],
      ["Doctor charges ₹500 per visit", [0.85, 0.15, 0.1]],
      ["Clinic is open 9 AM to 9 PM", [0.1, 0.9, 0.1]],
      ["On Sunday we open 10 AM to 1 PM", [0.15, 0.85, 0.2]],
      ["Free parking is available", [0.1, 0.2, 0.9]],
      ["It will rain in Lucknow today", [-0.2, 0.1, 0.3]],
    ];
    const questions = [
      ["Kitna paisa lagega? (How much will it cost?)", [0.88, 0.12, 0.08]],
      ["Is the clinic open on Sunday?", [0.12, 0.88, 0.15]],
      ["Where can I park my car?", [0.08, 0.15, 0.92]],
    ];
    const select = embViz.querySelector("select");
    const list = embViz.querySelector(".sim-list");
    select.innerHTML = questions.map(([q], i) => `<option value="${i}">${q}</option>`).join("");
    const cos = (a, b) => {
      const dot = a.reduce((s, x, i) => s + x * b[i], 0);
      const len = (v) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));
      return dot / (len(a) * len(b));
    };
    const update = () => {
      const qv = questions[Number(select.value)][1];
      const scored = docs.map(([text, v]) => ({ text, v, s: cos(qv, v) })).sort((a, b) => b.s - a.s);
      list.innerHTML = scored.map((d, i) => `<div class="sim-row${i < 2 ? " top" : ""}"><span>${i < 2 ? "✅ " : ""}${d.text}<small>[${d.v.join(", ")}]</small></span><div class="bar" style="width:${Math.max(2, d.s * 100)}%"></div><b>${d.s.toFixed(2)}</b></div>`).join("");
    };
    select.addEventListener("change", update);
    update();
  }
})();
