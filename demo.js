// Footer year + theme (same behaviour as main site)
document.getElementById("year").textContent = new Date().getFullYear();
const root = document.documentElement;
const themeBtn = document.getElementById("themeToggle");
function applyTheme(t) { root.setAttribute("data-theme", t); themeBtn.textContent = t === "dark" ? "☀️" : "🌙"; }
let savedTheme = null;
try { savedTheme = localStorage.getItem("theme"); } catch (e) {}
applyTheme(savedTheme || (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
themeBtn.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
  try { localStorage.setItem("theme", next); } catch (e) {}
});

// ---------- Sample businesses (fictional) ----------
const KW = {
  greet: ["hi", "hello", "hey", "namaste", "namaskar", "hii", "good morning", "good evening"],
  fees: ["fee", "fees", "price", "cost", "charge", "charges", "kitna", "kitni", "kitne", "paisa", "rate", "menu", "rs", "₹"],
  timing: ["time", "timing", "timings", "kab", "open", "close", "schedule", "batch", "hours", "slot"],
  location: ["where", "address", "location", "kahan", "kaha", "map", "direction", "branch", "located"],
  offer: ["course", "courses", "subject", "service", "services", "treatment", "doctor", "special", "dish", "food", "kya kya", "offer", "padhate", "classes"],
  book: ["book", "booking", "admission", "join", "enroll", "enrol", "appointment", "register", "reserve", "table", "demo class", "order", "visit"],
  human: ["call", "contact", "number", "phone", "baat", "talk", "human", "person", "owner", "manager"],
  thanks: ["thanks", "thank you", "thank", "shukriya", "dhanyavad", "ok", "okay", "great", "nice"],
};

const BIZ = {
  coaching: {
    name: "BrightPath Classes (Sample)",
    icon: "🎓",
    welcome: "Hi! 👋 Welcome to BrightPath Classes.\nI can help with courses, fees, batch timings, location or booking a FREE demo class. What would you like to know?",
    quick: ["Courses", "Fees kitni hai?", "Batch timings", "Location", "Book free demo"],
    bookWhat: "free demo class",
    answers: {
      offer: "We offer:\n📘 Class 9–10 Maths & Science (CBSE)\n📗 Class 11–12 PCM / PCB\n💻 Coding for school students (Python, Web)\n🎯 JEE / NEET foundation",
      fees: "Fee structure (per month):\n• Class 9–10: ₹2,500\n• Class 11–12: ₹3,500\n• Coding: ₹1,800\nSibling discount 10% 🙂 First demo class is FREE!",
      timing: "Batch timings:\n🌅 Morning: 7:00–9:00 AM\n🌇 Evening: 4:00–6:00 PM & 6:00–8:00 PM\nSunday: doubt-clearing sessions.",
      location: "📍 Sector 12, near Metro Station (sample address).\nOpen Google Maps for directions — free parking available.",
    },
  },
  clinic: {
    name: "CareWell Clinic (Sample)",
    icon: "🩺",
    welcome: "Namaste! 🙏 Welcome to CareWell Clinic.\nI can share doctor timings, consultation fees, services, or book an appointment for you.",
    quick: ["Services", "Consultation fee", "Doctor timings", "Address", "Book appointment"],
    bookWhat: "appointment",
    answers: {
      offer: "Our services:\n👨‍⚕️ General Physician\n🦷 Dental care\n🧒 Paediatrics\n🧪 Blood tests & health check-ups (home sample collection available)",
      fees: "Consultation fees:\n• General Physician: ₹400\n• Dental check-up: ₹300\n• Full body check-up package: ₹1,499\nFollow-up within 7 days is free.",
      timing: "Clinic timings:\n🕘 Mon–Sat: 9:00 AM – 1:00 PM & 5:00 – 9:00 PM\n🕙 Sunday: 10:00 AM – 1:00 PM\nEmergency? Please call directly.",
      location: "📍 Main Market Road, opposite City Mall (sample address).\nLift & wheelchair access available.",
    },
  },
  restaurant: {
    name: "Zaika House Café (Sample)",
    icon: "🍽️",
    welcome: "Hey there! 😋 Welcome to Zaika House Café.\nAsk me about the menu, prices, opening hours, or reserve a table.",
    quick: ["Specials", "Menu prices", "Opening hours", "Location", "Reserve a table"],
    bookWhat: "table reservation",
    answers: {
      offer: "Today's specials 🌟\n🍛 Awadhi Biryani\n🥙 Galouti Kebab Platter\n🍕 Wood-fired Pizza\n☕ Cold Coffee & Kulhad Chai",
      fees: "Popular items:\n• Awadhi Biryani — ₹299\n• Galouti Kebab (6 pcs) — ₹249\n• Pizza — from ₹349\n• Kulhad Chai — ₹49\nAverage for two: ~₹700",
      timing: "We're open every day 🕛 12:00 PM – 11:30 PM.\nWeekends get busy after 8 PM — reserve a table to skip the wait!",
      location: "📍 Food Street, Block C (sample address).\nValet parking on weekends.",
    },
  },
};

// ---------- Chat engine ----------
const body = document.getElementById("chatBody");
const quickRow = document.getElementById("quickReplies");
const form = document.getElementById("chatForm");
const input = document.getElementById("chatInput");
const leadList = document.getElementById("leadList");

let biz = "coaching";
let flow = null; // null | { step: "name" | "phone", name?: string }

function addMsg(text, who) {
  const el = document.createElement("div");
  el.className = "msg " + who;
  el.textContent = text;
  body.appendChild(el);
  body.scrollTop = body.scrollHeight;
}

function botSay(text, delay = 650) {
  const t = document.createElement("div");
  t.className = "msg bot";
  t.innerHTML = '<span class="typing"><span></span><span></span><span></span></span>';
  body.appendChild(t);
  body.scrollTop = body.scrollHeight;
  return new Promise((res) => setTimeout(() => { t.remove(); addMsg(text, "bot"); res(); }, delay));
}

function setQuick(list) {
  quickRow.innerHTML = "";
  list.forEach((q) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = q;
    b.addEventListener("click", () => handle(q));
    quickRow.appendChild(b);
  });
}

function detect(text) {
  const t = " " + text.toLowerCase().replace(/[?!.,]/g, " ") + " ";
  const has = (words) => words.some((w) => t.includes(w.length <= 3 ? " " + w + " " : w));
  // order matters: booking intent wins over generic words
  for (const intent of ["book", "fees", "timing", "location", "offer", "human", "greet", "thanks"]) {
    if (has(KW[intent])) return intent;
  }
  return "unknown";
}

function addLead(name, phone) {
  const b = biz === "custom" ? { name: custom ? custom.name : "Your business", bookWhat: "enquiry" } : BIZ[biz];
  const empty = leadList.querySelector(".lead-empty");
  if (empty) empty.remove();
  const el = document.createElement("div");
  el.className = "lead";
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  el.innerHTML = "🆕 <b></b> · <span></span><small></small>";
  el.querySelector("b").textContent = name;
  el.querySelector("span").textContent = phone;
  el.querySelector("small").textContent = `${b.bookWhat} · ${b.name.replace(" (Sample)", "")} · ${time} · via chatbot`;
  leadList.prepend(el);
}

// ---------- Live AI (Kodivo demo API on Cloudflare Workers) ----------
const API = (() => {
  const q = new URLSearchParams(location.search).get("api");
  return q && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(q) ? q : "https://kodivo-demo-api.agamsahu017.workers.dev";
})();
let history = [];      // [{ role, content }] for the current bot
let aiOff = false;     // true after the AI is unavailable: use pre-set answers
let custom = null;     // { name, info } for "Your business"
let busy = false;

function note(text) {
  const el = document.createElement("div");
  el.className = "msg note";
  el.textContent = text;
  body.appendChild(el);
  body.scrollTop = body.scrollHeight;
}

// If the customer shares a mobile number, show it in the owner view (masked).
function captureLead(text) {
  const digits = (text.match(/(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/) || [""])[0].replace(/\D/g, "").slice(-10);
  if (!/^[6-9]\d{9}$/.test(digits)) return;
  const all = history.filter((m) => m.role === "user").map((m) => m.content).join("\n");
  const m = all.match(/(?:my name is|i am|i'm|mera naam|naam)\s*(?:hai|is|:)?\s*([A-Za-z][A-Za-z]{1,20})/i) || text.match(/^([A-Za-z]{2,20})[\s,]+(?:\+?91)?[6-9]/);
  const name = m ? m[1].charAt(0).toUpperCase() + m[1].slice(1) : "New customer";
  addLead(name, digits.slice(0, 2) + "XXXXXX" + digits.slice(8));
}

async function askAI() {
  const payload = biz === "custom"
    ? { mode: "custom", bizName: custom.name, info: custom.info, messages: history }
    : { biz, messages: history };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const r = await fetch(API + "/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: ctrl.signal });
    const data = await r.json().catch(() => ({}));
    return r.ok ? { reply: data.reply, remaining: data.remaining } : { error: data.error || "http_" + r.status };
  } catch (e) {
    return { error: "network" };
  } finally {
    clearTimeout(timer);
  }
}

async function handle(raw) {
  const text = raw.trim().slice(0, 500);
  if (!text || busy) return;
  addMsg(text, "user");
  if (aiOff) {
    if (biz === "custom") { note("Live AI is not available right now. Please try again later, or WhatsApp us for a live demo."); return; }
    return offlineHandle(text);
  }
  history.push({ role: "user", content: text });
  busy = true;
  setQuick([]);
  const t = document.createElement("div");
  t.className = "msg bot";
  t.innerHTML = '<span class="typing"><span></span><span></span><span></span></span>';
  body.appendChild(t);
  body.scrollTop = body.scrollHeight;
  const res = await askAI();
  t.remove();
  busy = false;
  if (res.reply) {
    history.push({ role: "assistant", content: res.reply });
    addMsg(res.reply, "bot");
    captureLead(text);
    if (res.remaining === 3) note("3 demo messages left for today.");
    return;
  }
  history.pop(); // the question was not answered; don't keep it
  if (res.error === "slow_down") { note("You're typing fast 🙂 Please wait a few seconds and send again."); return; }
  if (res.error === "daily_limit") note("You've reached today's demo limit. Want a full demo for your business? WhatsApp us: 92352 66579");
  else note("Live AI is busy right now, so you'll see pre-set answers.");
  aiOff = true;
  if (biz !== "custom") offlineHandle(text);
}

async function offlineHandle(text) {
  const b = BIZ[biz];

  // Lead-capture flow
  if (flow && flow.step === "name") {
    if (detect(text) !== "unknown" && text.split(" ").length > 3) { flow = null; return reply(text); }
    flow = { step: "phone", name: text.replace(/^(my name is|i am|main|mera naam)\s*/i, "").slice(0, 40) };
    await botSay(`Thanks ${flow.name}! 😊 Please share your 10-digit mobile number so we can confirm your ${b.bookWhat}.`);
    setQuick([]);
    return;
  }
  if (flow && flow.step === "phone") {
    const digits = text.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(digits)) {
      await botSay("Hmm, that doesn't look like a valid mobile number. Please enter 10 digits (e.g. 98xxxxxx10).");
      return;
    }
    const masked = digits.slice(0, 2) + "XXXXXX" + digits.slice(8);
    addLead(flow.name, masked);
    await botSay(`✅ Done! Your ${b.bookWhat} request is confirmed, ${flow.name}.\nOur team will call you on ${masked} shortly. You'll also get a WhatsApp reminder.`);
    flow = null;
    setQuick(b.quick.slice(0, 4));
    return;
  }
  reply(text);
}

async function reply(text) {
  const b = BIZ[biz];
  const intent = detect(text);
  switch (intent) {
    case "greet":
      await botSay(b.welcome); setQuick(b.quick); break;
    case "fees": case "timing": case "location": case "offer":
      await botSay(b.answers[intent]);
      await botSay(`Would you like to book a ${b.bookWhat}? 🙂`, 500);
      setQuick(["Yes, book now", ...b.quick.filter((q) => !q.toLowerCase().startsWith("book") && !q.toLowerCase().startsWith("reserve")).slice(0, 3)]);
      break;
    case "book":
      flow = { step: "name" };
      await botSay(`Great choice! Let's book your ${b.bookWhat}. 📝\nMay I know your name?`);
      setQuick([]);
      break;
    case "human":
      await botSay("Sure! I've notified our team — someone will call you back within 30 minutes during working hours. 📞\nWant me to book a slot for you meanwhile?");
      setQuick(["Yes, book now", "No thanks"]);
      break;
    case "thanks":
      await botSay("You're welcome! 😊 Anything else I can help with?"); setQuick(b.quick); break;
    default:
      if (/^(yes|haan|ha|han|ok book|sure)/i.test(text)) { flow = { step: "name" }; await botSay(`Perfect! May I know your name for the ${b.bookWhat}?`); setQuick([]); break; }
      if (/^(no|nahi|nahin)/i.test(text)) { await botSay("No problem! Feel free to ask anything else. 🙂"); setQuick(b.quick); break; }
      await botSay("I'm not sure I understood that 🤔 — in the real version, AI understands any question.\nFor now, try one of these:");
      setQuick(b.quick);
  }
}

const setup = document.getElementById("customSetup");
const chatBox = document.querySelector(".demo-grid");
const cName = document.getElementById("customName");
const cInfo = document.getElementById("customInfo");
const cErr = document.getElementById("customErr");
const EXAMPLE = {
  name: "Glow Studio Salon",
  info: "Glow Studio Salon, Aliganj, Lucknow (near Kapoorthala).\nHaircut: men ₹200, women ₹500, kids ₹150. Hair spa ₹900. Hair colour from ₹1,200.\nFacial from ₹800. Cleanup ₹500. Waxing (full arms) ₹300.\nBridal makeup from ₹12,000 (book at least 1 month before, ₹3,000 advance).\nOpen 10 AM to 8 PM. Tuesday closed.\nPayment: cash and UPI. Ladies and men both. Parking on the street.\nAppointment: share name, phone number, service and time. Walk-ins welcome if a chair is free.",
};

function startBiz(key) {
  biz = key; flow = null; history = []; busy = false;
  const isCustom = key === "custom";
  setup.hidden = !isCustom || !!custom;
  chatBox.hidden = isCustom && !custom;
  if (isCustom && !custom) { setQuick([]); body.innerHTML = ""; return; }
  const b = isCustom
    ? { name: custom.name, icon: "✨", welcome: `Hi! 👋 Welcome to ${custom.name}.\nAsk me anything about our services, prices or timings, or book an appointment.`, quick: ["Price list", "Timings?", "Address", "Book appointment"] }
    : BIZ[key];
  document.getElementById("bizName").textContent = b.name;
  document.getElementById("bizAvatar").textContent = b.icon;
  body.innerHTML = "";
  botSay(b.welcome, 400).then(() => {
    setQuick(b.quick);
    if (isCustom) {
      const edit = document.createElement("button");
      edit.type = "button";
      edit.textContent = "✏️ Edit details";
      edit.addEventListener("click", () => { custom = null; startBiz("custom"); });
      quickRow.appendChild(edit);
    }
  });
  setQuick([]);
}

cInfo.addEventListener("input", () => { document.getElementById("customCount").textContent = cInfo.value.length + " / 6000"; });
document.getElementById("customExample").addEventListener("click", () => {
  cName.value = EXAMPLE.name; cInfo.value = EXAMPLE.info; cInfo.dispatchEvent(new Event("input"));
});
document.getElementById("customStart").addEventListener("click", () => {
  const info = cInfo.value.trim();
  if (info.length < 40) { cErr.textContent = "Please add a few more details (at least 40 characters): services, prices, timings."; return; }
  cErr.textContent = "";
  custom = { name: cName.value.trim().slice(0, 60) || "Your Business", info: info.slice(0, 6000) };
  aiOff = false; // give the live AI another try for the owner's own bot
  startBiz("custom");
});

document.querySelectorAll(".biz-tab").forEach((tab) =>
  tab.addEventListener("click", () => {
    document.querySelectorAll(".biz-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    startBiz(tab.dataset.biz);
  })
);

form.addEventListener("submit", (e) => { e.preventDefault(); const v = input.value; input.value = ""; handle(v); });

startBiz("coaching");
