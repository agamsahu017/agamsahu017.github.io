// AI Basics Check (before the free workshop).
// Scores in the browser, shows the right answers, and sends name + score to the
// Kodivo Worker (/lead, kind "quiz") so the owner sees it on the dashboard and Telegram.
(function () {
  const API = "https://kodivo-counter.agamsahu017.workers.dev/lead";
  const WHATSAPP = "919235266579";
  const $ = (id) => document.getElementById(id);

  // a = index of the right option. Easy first, then a few harder ones.
  const QUESTIONS = [
    { q: "What is ChatGPT?", o: ["A search engine like Google", "An AI chatbot that writes answers in plain language", "A social media app", "An antivirus"], a: 1,
      why: "ChatGPT is an AI chatbot. It writes answers based on what it learned; it is not a search engine." },
    { q: "In AI tools, what is a \"prompt\"?", o: ["The price of the tool", "The instruction or question you type for the AI", "A type of computer virus", "The AI's memory card"], a: 1,
      why: "A prompt is what you ask or tell the AI. Better prompts give better answers." },
    { q: "Which prompt will give the best result?", o: ["\"email\"", "\"write leave email\"", "\"Write a polite 5-line email to my manager asking for leave on Friday for a family function.\"", "\"help me\""], a: 2,
      why: "Good prompts say what you want, for whom, the tone and the length." },
    { q: "Which of these should you NEVER type into a free AI tool?", o: ["A news article to summarise", "Your passwords, OTP, Aadhaar or bank details", "A recipe", "A poem you wrote"], a: 1,
      why: "Never share passwords, OTPs, Aadhaar or bank details with any AI tool." },
    { q: "AI gives a confident answer with a fact or link that is actually fake. This is called:", o: ["Hallucination", "Encryption", "Debugging", "Formatting"], a: 0,
      why: "When AI makes up wrong facts confidently, it is called hallucination. Always check important facts." },
    { q: "What is the best way to check an important fact that AI gave you?", o: ["Trust it, AI is always right", "Ask the same AI again", "Check it on a reliable source (official website, book, teacher)", "Forward it to friends"], a: 2,
      why: "Verify important facts from a reliable source. Asking the same AI again can repeat the same mistake." },
    { q: "Which of these can AI help you with?", o: ["Summarising long notes", "Writing a first draft of an email", "Making a study or work plan", "All of these"], a: 3,
      why: "AI is good at all of these. You still check and improve the result." },
    { q: "You want AI to explain a topic simply, like a teacher to a 12-year-old. What should you do?", o: ["Nothing, AI already knows", "Say the role and level in the prompt, e.g. \"Explain like a teacher to a 12-year-old\"", "Type in capital letters", "Use a different keyboard"], a: 1,
      why: "Telling the AI who it should act as, and for whom, changes the style and level of the answer." },
    { q: "Using AI for a college assignment or office report, what is the right approach?", o: ["Copy-paste the AI answer as it is", "Use it as a first draft, then check facts and rewrite in your own words", "Never use AI for anything", "Ask AI to submit it for you"], a: 1,
      why: "Use AI as a helper for the first draft. You stay responsible for facts and your own words." },
    { q: "AI models read text in small pieces. These pieces are called:", o: ["Pixels", "Cookies", "Tokens", "Folders"], a: 2,
      why: "AI reads and writes text as tokens (small pieces of words). Limits and prices are counted in tokens." },
    { q: "You show the AI 2 examples of the exact format you want before asking your question. This is called:", o: ["Few-shot prompting", "Hacking", "Formatting the disk", "Debugging"], a: 0,
      why: "Giving a few examples in the prompt is called few-shot prompting. It helps the AI copy your format." },
    { q: "A school wants a chatbot that answers ONLY from its own rulebook PDF and shows the page number. The common method is:", o: ["Buy a faster computer", "RAG: find the right parts of the PDF, then let the AI answer from them", "Turn off the internet", "Type every answer by hand"], a: 1,
      why: "RAG (Retrieval-Augmented Generation) finds the right parts of your documents first, then the AI answers from them, with sources." },
  ];
  const N = QUESTIONS.length;
  const LETTERS = ["A", "B", "C", "D"];

  // ---------- render ----------
  const box = $("questions");
  QUESTIONS.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "q";
    div.id = "q" + i;
    const h = document.createElement("h3");
    h.innerHTML = `<span>Q${i + 1}.</span>`;
    h.appendChild(document.createTextNode(item.q));
    div.appendChild(h);
    item.o.forEach((text, j) => {
      const label = document.createElement("label");
      label.className = "opt";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "q" + i;
      input.value = String(j);
      label.append(input, document.createTextNode(`${LETTERS[j]}. ${text}`));
      div.appendChild(label);
    });
    const why = document.createElement("p");
    why.className = "why";
    why.textContent = "💡 " + item.why;
    div.appendChild(why);
    box.appendChild(div);
  });

  const answered = () => QUESTIONS.map((_, i) => {
    const c = document.querySelector(`input[name="q${i}"]:checked`);
    return c ? Number(c.value) : null;
  });
  const updateProgress = () => {
    const n = answered().filter((x) => x !== null).length;
    $("progText").textContent = `${n} / ${N} answered`;
    $("progBar").style.width = (100 * n) / N + "%";
  };
  box.addEventListener("change", updateProgress);

  // ---------- submit ----------
  const normalizePhone = (raw) => {
    let d = String(raw || "").replace(/\D/g, "");
    if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
    if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
    return /^[6-9]\d{9}$/.test(d) ? d : null;
  };
  const status = $("quizStatus"), button = $("quizSubmit"), form = $("quizForm");
  const show = (msg, err) => { status.textContent = msg; status.classList.toggle("error", !!err); };

  function level(score) {
    if (score >= 10) return ["🚀 Advanced", "Great! You already know the basics well. In the workshop, focus on the live mini project and advanced prompting."];
    if (score >= 6) return ["⭐ Intermediate", "Good start! The workshop will fill the gaps: better prompts, checking AI answers and saving time on daily tasks."];
    return ["🌱 Beginner", "Perfect time to start! The workshop is made for you. We'll begin from the basics, step by step."];
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if (!data.name || data.name.trim().length < 2) { $("q-name").focus(); return show("Please enter your name.", true); }
    if (!normalizePhone(data.phone)) { $("q-phone").focus(); return show("Please enter a valid 10-digit WhatsApp number.", true); }
    const ans = answered();
    const missing = ans.findIndex((x) => x === null);
    if (missing >= 0) {
      document.querySelectorAll(".q").forEach((q, i) => q.classList.toggle("missed", ans[i] === null));
      $("q" + missing).scrollIntoView({ behavior: "smooth", block: "center" });
      return show(`Please answer all questions (Q${missing + 1} is empty).`, true);
    }
    if (!$("q-consent").checked) return show("Please tick the checkbox so we can send you the workshop details.", true);

    const score = ans.reduce((s, x, i) => s + (x === QUESTIONS[i].a ? 1 : 0), 0);
    const [lvl, text] = level(score);
    const payload = {
      kind: "quiz",
      name: data.name, phone: data.phone, consent: true, website: data.website,
      profile: data.profile, used_ai: data.used_ai, goal: data.goal,
      score: `${score}/${N}`, level: lvl.replace(/^\S+\s/, ""),
      answers: ans.map((x, i) => `${i + 1}${LETTERS[x]}${x === QUESTIONS[i].a ? "" : "✗"}`).join(" "),
      page: location.pathname,
    };
    try { payload.ref = sessionStorage.getItem("kodivo-ref") || undefined; } catch (err) {}

    button.disabled = true;
    show("Checking…");
    let saved = false;
    try {
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = await r.json().catch(() => ({}));
      saved = r.ok && j.ok;
      if (!saved && j.error === "phone") { button.disabled = false; return show("Please enter a valid 10-digit WhatsApp number.", true); }
    } catch (err) { /* still show the result; WhatsApp button below sends it */ }

    // Show result + right answers
    form.classList.add("done");
    document.querySelectorAll(".q").forEach((div, i) => {
      div.classList.remove("missed");
      div.querySelectorAll(".opt").forEach((opt, j) => {
        opt.querySelector("input").disabled = true;
        if (j === QUESTIONS[i].a) opt.classList.add("right");
        else if (j === ans[i]) opt.classList.add("wrong");
      });
    });
    document.querySelectorAll(".form-grid input, .form-grid select, #q-consent").forEach((el) => { el.disabled = true; });
    button.hidden = true;
    show(saved ? "" : "We couldn't save your result online. Please tap the WhatsApp button so we get it.", !saved);

    $("resScore").textContent = `${score}/${N}`;
    $("resLevel").textContent = lvl;
    $("resText").textContent = text;
    const msg = `Hi Kodivo, I took the AI Basics Check.\nName: ${data.name.trim()}\nScore: ${score}/${N} (${payload.level})\nPlease confirm my seat for the free AI workshop (Sun 22 Nov, 2–3 PM).`;
    $("resWa").href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
    $("result").hidden = false;
    $("result").scrollIntoView({ behavior: "smooth", block: "start" });
  });
})();
