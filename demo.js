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
    name: "Spice Route Café (Sample)",
    icon: "🍽️",
    welcome: "Hey there! 😋 Welcome to Spice Route Café.\nAsk me about the menu, prices, opening hours, or reserve a table.",
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
  const b = BIZ[biz];
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

async function handle(raw) {
  const text = raw.trim();
  if (!text) return;
  addMsg(text, "user");
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

function startBiz(key) {
  biz = key; flow = null;
  const b = BIZ[key];
  document.getElementById("bizName").textContent = b.name;
  document.getElementById("bizAvatar").textContent = b.icon;
  body.innerHTML = "";
  botSay(b.welcome, 400).then(() => setQuick(b.quick));
  setQuick([]);
}

document.querySelectorAll(".biz-tab").forEach((tab) =>
  tab.addEventListener("click", () => {
    document.querySelectorAll(".biz-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    startBiz(tab.dataset.biz);
  })
);

form.addEventListener("submit", (e) => { e.preventDefault(); const v = input.value; input.value = ""; handle(v); });

startBiz("coaching");
