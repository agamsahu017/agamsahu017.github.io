// Lead forms (free consultation + free session registration).
// Sends to the Kodivo Worker, which saves the lead in the database.
// Messages follow the current page language (English / Hindi).
(function () {
  const API = "https://kodivo-counter.agamsahu017.workers.dev/lead";
  const WHATSAPP = "919235266579";

  const TEXT = {
    sending: ["Sending…", "भेजा जा रहा है…"],
    name: ["Please enter your name.", "कृपया अपना नाम लिखें।"],
    phone: ["Please enter a valid 10-digit mobile number.", "कृपया सही 10 अंकों का मोबाइल नंबर लिखें।"],
    consent: ["Please tick the checkbox so we can contact you.", "कृपया चेकबॉक्स पर टिक करें, ताकि हम आपसे संपर्क कर सकें।"],
    limit: ["You've already sent a few requests today. We'll get back to you soon!", "आप आज पहले ही कुछ रिक्वेस्ट भेज चुके हैं। हम जल्द संपर्क करेंगे!"],
    error: ["Something went wrong. Please message us on WhatsApp instead.", "कुछ गड़बड़ हो गई। कृपया WhatsApp पर मैसेज करें।"],
    business_ok_title: ["✅ Thank you! We've received your enquiry.", "✅ धन्यवाद! आपकी पूछताछ हमें मिल गई है।"],
    business_ok_text: ["We'll call or WhatsApp you within a few hours.", "हम कुछ ही घंटों में आपको कॉल या WhatsApp करेंगे।"],
    session_ok_title: ["🎉 You're registered!", "🎉 आपका रजिस्ट्रेशन हो गया!"],
    session_ok_text: ["The session date and joining link will be sent to you on WhatsApp.", "सेशन की तारीख़ और जुड़ने का लिंक आपको WhatsApp पर भेजा जाएगा।"],
    faster: ["💬 Want a faster reply? Send on WhatsApp", "💬 जल्दी जवाब चाहिए? WhatsApp पर भेजें"],
  };
  const t = (key) => TEXT[key][document.documentElement.lang === "hi" ? 1 : 0];

  const normalizePhone = (raw) => {
    let digits = String(raw || "").replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
    return /^[6-9]\d{9}$/.test(digits) ? digits : null;
  };

  function whatsappText(kind, data) {
    if (kind === "session") {
      return `Hi Agam, I just registered for the free AI session on your website.\nName: ${data.name}\nI am: ${data.profile}`;
    }
    return `Hi Agam, I just sent an enquiry on your website.\nName: ${data.name}\nNeed: ${data.need}\nCity: ${data.city}`;
  }

  document.querySelectorAll("form[data-lead]").forEach((form) => {
    const status = form.querySelector(".form-status");
    const button = form.querySelector('button[type="submit"]');
    const kind = form.dataset.lead;

    const show = (message, isError) => {
      status.textContent = message;
      status.classList.toggle("error", Boolean(isError));
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      data.kind = kind;
      data.consent = form.querySelector('[name="consent"]').checked;
      data.page = location.pathname;

      if (!data.name || data.name.trim().length < 2) return show(t("name"), true);
      if (!normalizePhone(data.phone)) return show(t("phone"), true);
      if (!data.consent) return show(t("consent"), true);

      button.disabled = true;
      show(t("sending"));
      try {
        const response = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
          const key = ["name", "phone", "consent", "limit"].includes(result.error) ? result.error : "error";
          show(t(key), true);
          button.disabled = false;
          return;
        }

        const link = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(whatsappText(kind, data))}`;
        const done = document.createElement("div");
        done.className = "form-done";
        const title = document.createElement("h3");
        title.textContent = t(`${kind}_ok_title`);
        const text = document.createElement("p");
        text.textContent = t(`${kind}_ok_text`);
        const wa = document.createElement("a");
        wa.className = "btn btn-wa btn-block";
        wa.href = link;
        wa.target = "_blank";
        wa.rel = "noopener";
        wa.textContent = t("faster");
        done.append(title, text, wa);
        form.replaceWith(done);
      } catch (e) {
        show(t("error"), true);
        button.disabled = false;
      }
    });
  });
})();
