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
  if (actions) actions.insertBefore(langBtn, actions.firstChild);
  function applyLang(lang) {
    document.documentElement.lang = lang;
    langBtn.textContent = lang === "hi" ? "EN" : "हिंदी";
    langBtn.setAttribute("aria-label", lang === "hi" ? "Switch to English" : "हिंदी में देखें");
  }
  applyLang(getLang());
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
})();
