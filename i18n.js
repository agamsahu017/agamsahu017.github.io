// Language switch: English by default, Hindi on request.
// Adds an "हिंदी / EN" button to the nav. The choice is remembered in this
// browser, and ?lang=hi (or ?lang=en) in the URL also sets it.
//
// How it works: every text block matching SELECTOR is looked up by its exact
// English HTML in HI below. If you edit English text on a page, update the
// matching key here too; a missing key simply stays in English.
(function () {
  const SELECTOR =
    "h1, h2, h3, p, li, summary, .offer-banner, .nav-links a, .nav-actions a.btn, .pill, .float-card, " +
    ".founder-tag, .strip-inner > span, .strip-inner > b, .eyebrow, .tag, .price, .mini b, .mini span, " +
    "a.btn, .socials span, .socials-inline a, .footer .container, .logo-sub, .biz-tab, .chat-status, " +
    ".lead-empty, .demo-note, .work-link, label, option, button.btn";
  const STORAGE_KEY = "kodivo-lang";

  const HI = new Map([
    // ---------- shared: nav, footer, cities ----------
    [`Services`, `सर्विसेज़`],
    [`Pricing`, `कीमतें`],
    [`💰 See all packages &amp; prices`, `💰 सभी पैकेज और कीमतें देखें`],
    [`🏢 AI for your business`, `🏢 आपके बिज़नेस के लिए AI`],
    [`AI Demo`, `AI डेमो`],
    [`Industries`, `इंडस्ट्रीज़`],
    [`Founder`, `फ़ाउंडर`],
    [`Academy`, `अकादमी`],
    [`Contact`, `संपर्क`],
    [`Our Work`, `हमारा काम`],
    [`Delhi`, `दिल्ली`],
    [`Noida`, `नोएडा`],
    [`Gurugram`, `गुरुग्राम`],
    [`Ghaziabad`, `ग़ाज़ियाबाद`],
    [`Lucknow`, `लखनऊ`],
    [`Kanpur`, `कानपुर`],
    [`Ayodhya`, `अयोध्या`],
    [`Prayagraj`, `प्रयागराज`],

    // ---------- footer links (all main pages) ----------
    ["<a href=\"pricing.html\">Pricing</a> · <a href=\"ai-for-business.html\">AI for Business</a> · <a href=\"website-development.html\">Website Development</a> · <a href=\"ai-chatbot-whatsapp-automation.html\">AI Chatbot &amp; WhatsApp Automation</a> · <a href=\"delhi-ncr.html\">Delhi NCR</a> · <a href=\"lucknow.html\">Lucknow</a> · <a href=\"academy.html\">Academy</a>", "<a href=\"pricing.html\">कीमतें</a> · <a href=\"ai-for-business.html\">बिज़नेस के लिए AI</a> · <a href=\"website-development.html\">वेबसाइट डेवलपमेंट</a> · <a href=\"ai-chatbot-whatsapp-automation.html\">AI चैटबॉट और WhatsApp ऑटोमेशन</a> · <a href=\"delhi-ncr.html\">दिल्ली NCR</a> · <a href=\"lucknow.html\">लखनऊ</a> · <a href=\"academy.html\">अकादमी</a>"],

    ["Reviews", "रिव्यू"],
    ["What our clients say", "हमारे क्लाइंट्स क्या कहते हैं"],

    // ---------- forms (index + academy) ----------
    ["📝 Get a free consultation", "📝 फ़्री सलाह पाएँ"],
    ["Share a few details and we'll call you back.", "थोड़ी जानकारी दीजिए, हम आपको वापस कॉल करेंगे।"],
    ["Your name", "आपका नाम"],
    ["Mobile number", "मोबाइल नंबर"],
    ["City", "शहर"],
    ["Delhi NCR", "दिल्ली NCR"],
    ["Other city in UP", "UP का कोई और शहर"],
    ["Other", "अन्य"],
    ["What do you need?", "आपको क्या चाहिए?"],
    ["Website", "वेबसाइट"],
    ["AI chatbot / WhatsApp automation", "AI चैटबॉट / WhatsApp ऑटोमेशन"],
    ["Custom software", "कस्टम सॉफ्टवेयर"],
    ["Online store", "ऑनलाइन स्टोर"],
    ["AI automation for my company", "मेरी कंपनी के लिए AI ऑटोमेशन"],
    ["AI workshop for my team", "मेरी टीम के लिए AI वर्कशॉप"],
    ["Mobile app", "मोबाइल ऐप"],
    ["Not sure yet", "अभी तय नहीं"],
    ["Budget", "बजट"],
    ["Not sure", "पता नहीं"],
    ["Under ₹10,000", "₹10,000 से कम"],
    ["Above ₹2,00,000", "₹2,00,000 से ज़्यादा"],
    ["Tell us about your business (optional)", "अपने बिज़नेस के बारे में बताइए (वैकल्पिक)"],
    ["I agree to be contacted on WhatsApp or phone about my enquiry.", "मैं अपनी पूछताछ के बारे में WhatsApp या फ़ोन पर संपर्क किए जाने के लिए सहमत हूँ।"],
    ["Get Free Consultation", "फ़्री सलाह लें"],
    ["🎁 Join the Free Live Session", "🎁 फ़्री लाइव सेशन से जुड़ें"],
    ["🎁 Free Live Session", "🎁 फ़्री लाइव सेशन"],
    ["How to become a developer in the AI era (2026 roadmap)", "AI के दौर में डेवलपर कैसे बनें (2026 रोडमैप)"],
    ["A free 1-hour online session for students and developers with 0–3 years of experience.", "स्टूडेंट्स और 0–3 साल के अनुभव वाले डेवलपर्स के लिए 1 घंटे का फ़्री ऑनलाइन सेशन।"],
    ["What skills companies actually hire for now", "कंपनियाँ अभी असल में किन स्किल्स पर हायर कर रही हैं"],
    ["React + Node + AI: what to learn, in what order", "React + Node + AI: क्या सीखें, किस क्रम में"],
    ["RAG and AI agents, explained simply", "RAG और AI एजेंट्स, आसान भाषा में"],
    ["Resume and projects that get shortlisted", "ऐसा रिज़्यूमे और प्रोजेक्ट्स जो शॉर्टलिस्ट करवाएँ"],
    ["Live Q&amp;A with a working senior engineer", "वर्किंग सीनियर इंजीनियर के साथ लाइव सवाल-जवाब"],
    ["📅 <b>Saturday, 31 October · 7–8 PM IST</b> · Online on Google Meet. The joining link is shared on WhatsApp after you register.", "📅 <b>शनिवार, 31 अक्टूबर · शाम 7–8 बजे</b> · Google Meet पर ऑनलाइन। रजिस्ट्रेशन के बाद जुड़ने का लिंक WhatsApp पर भेजा जाता है।"],
    ["🎓 Register for free", "🎓 फ़्री रजिस्टर करें"],
    ["WhatsApp number", "WhatsApp नंबर"],
    ["You are", "आप हैं"],
    ["Student", "स्टूडेंट"],
    ["Fresher (0–1 yr)", "फ़्रेशर (0–1 साल)"],
    ["Developer (1–3 yrs)", "डेवलपर (1–3 साल)"],
    ["Developer (3+ yrs)", "डेवलपर (3+ साल)"],
    ["College / Company (optional)", "कॉलेज / कंपनी (वैकल्पिक)"],
    ["Most interested in", "सबसे ज़्यादा रुचि"],
    ["AI for developers", "डेवलपर्स के लिए AI"],
    ["Full Stack (React, Node)", "फुल स्टैक (React, Node)"],
    ["Interview preparation", "इंटरव्यू की तैयारी"],
    ["Career guidance", "करियर गाइडेंस"],
    ["I agree to receive session details and updates on WhatsApp.", "मैं WhatsApp पर सेशन की जानकारी और अपडेट पाने के लिए सहमत हूँ।"],
    ["Register for Free", "फ़्री रजिस्टर करें"],
    ["<b>Website forms:</b> when you fill the consultation or free session form, we save your name, mobile number, city and the details you choose to share in our database, only to contact you about your request. Ask us any time and we'll delete it.", "<b>वेबसाइट फ़ॉर्म:</b> जब आप सलाह या फ़्री सेशन का फ़ॉर्म भरते हैं, तो हम आपका नाम, मोबाइल नंबर, शहर और आपकी दी हुई जानकारी अपने डेटाबेस में सेव करते हैं, सिर्फ़ आपकी रिक्वेस्ट के बारे में आपसे संपर्क करने के लिए। आप कभी भी कहें, हम इसे हटा देंगे।"],

    // ---------- index.html ----------
    [`Kodivo | AI-First Software Studio · Delhi NCR & Lucknow`, `Kodivo | AI-First सॉफ्टवेयर स्टूडियो · दिल्ली NCR और लखनऊ`],
    [`🎉 Launch offer: up to 70% off for our first 10 clients. <a href="#services">See services</a>`,
     `🎉 लॉन्च ऑफ़र: हमारे पहले 10 क्लाइंट्स के लिए 70% तक की छूट। <a href="#services">सर्विसेज़ देखें</a>`],
    [`🤖 AI-first software studio · Delhi NCR &amp; Lucknow`, `🤖 AI-first सॉफ्टवेयर स्टूडियो · दिल्ली NCR और लखनऊ`],
    [`We build <span class="grad">AI-powered software</span> that grows your business.`,
     `हम बनाते हैं <span class="grad">AI से चलने वाला सॉफ्टवेयर</span>, जो आपका बिज़नेस बढ़ाए।`],
    [`AI chatbots, WhatsApp automation, business software and modern websites, led by founder <strong>Agam Sahu</strong>, a Senior Full Stack Engineer with 8+ years of experience.`,
     `AI चैटबॉट, WhatsApp ऑटोमेशन, बिज़नेस सॉफ्टवेयर और मॉडर्न वेबसाइट्स। फ़ाउंडर <strong>अगम साहू</strong> के नेतृत्व में, जो 8+ साल के अनुभव वाले सीनियर फुल स्टैक इंजीनियर हैं।`],
    [`💬 Get a Free Consultation`, `💬 फ़्री सलाह लें`],
    [`🤖 Try Our AI Chatbot Demo`, `🤖 हमारा AI चैटबॉट डेमो आज़माएँ`],
    [`<strong>AI-first</strong><span>Every product, AI-ready</span>`, `<strong>AI-first</strong><span>हर प्रोडक्ट AI के लिए तैयार</span>`],
    [`<strong>8+ yrs</strong><span>Engineering experience</span>`, `<strong>8+ साल</strong><span>इंजीनियरिंग का अनुभव</span>`],
    [`<strong>2 cities</strong><span>Delhi NCR &amp; Lucknow</span>`, `<strong>2 शहर</strong><span>दिल्ली NCR और लखनऊ</span>`],
    [`🤖 AI Agents`, `🤖 AI एजेंट्स`],
    [`💬 WhatsApp Automation`, `💬 WhatsApp ऑटोमेशन`],
    [`Agam Sahu · Founder`, `अगम साहू · फ़ाउंडर`],
    [`Working with businesses in`, `इन शहरों के बिज़नेस के साथ:`],
    [`What we do`, `हम क्या करते हैं`],
    [`AI-first solutions for real businesses`, `असली बिज़नेस के लिए AI-first समाधान`],
    [`We don't just build software. We build software that works for you 24×7: answering customers, capturing leads and automating repetitive work.`,
     `हम सिर्फ़ सॉफ्टवेयर नहीं बनाते। हम ऐसा सॉफ्टवेयर बनाते हैं जो आपके लिए 24×7 काम करे: ग्राहकों को जवाब दे, लीड्स जुटाए और बार-बार होने वाले काम अपने आप करे।`],
    [`Most Popular`, `सबसे लोकप्रिय`],
    [`AI Chatbots &amp; WhatsApp Automation`, `AI चैटबॉट और WhatsApp ऑटोमेशन`],
    [`An AI assistant trained on your business that answers customers, books appointments and follows up on leads, on your website and WhatsApp.`,
     `आपके बिज़नेस की जानकारी पर ट्रेन किया गया AI असिस्टेंट, जो आपकी वेबसाइट और WhatsApp पर ग्राहकों को जवाब देता है, अपॉइंटमेंट बुक करता है और लीड्स का फ़ॉलो-अप करता है।`],
    [`Replies 24×7 in English &amp; Hindi`, `हिंदी और इंग्लिश में 24×7 जवाब`],
    [`Lead capture &amp; auto follow-ups`, `लीड कैप्चर और ऑटो फ़ॉलो-अप`],
    [`Appointment / payment reminders`, `अपॉइंटमेंट / पेमेंट रिमाइंडर`],
    [`<span class="launch">🎉 Launch offer</span>Starting <s>₹14,999</s> <b>₹4,499</b>`,
     `<span class="launch">🎉 लॉन्च ऑफ़र</span><s>₹14,999</s> <b>₹4,499</b> से शुरू`],
    [`🤖 Try Live Demo`, `🤖 लाइव डेमो देखें`],
    [`AI-Powered Business Software`, `AI वाला बिज़नेस सॉफ्टवेयर`],
    [`CRM, ERP, coaching &amp; clinic management, billing, inventory and admin panels, with AI built in: smart reports, document reading and automation.`,
     `CRM, ERP, कोचिंग और क्लिनिक मैनेजमेंट, बिलिंग, इन्वेंटरी और एडमिन पैनल, जिनमें AI पहले से जुड़ा हो: स्मार्ट रिपोर्ट, डॉक्यूमेंट पढ़ना और ऑटोमेशन।`],
    [`Multi-user roles (RBAC)`, `कई यूज़र, अलग-अलग रोल (RBAC)`],
    [`Online payments (UPI, cards)`, `ऑनलाइन पेमेंट (UPI, कार्ड)`],
    [`Secure cloud hosting`, `सुरक्षित क्लाउड होस्टिंग`],
    [`Custom <b>quote</b>`, `ज़रूरत के हिसाब से <b>कोटेशन</b>`],
    [`Websites &amp; Web Apps`, `वेबसाइट और वेब ऐप्स`],
    [`Fast, mobile-friendly websites and web apps with SEO, WhatsApp integration and an AI chat assistant ready to plug in.`,
     `तेज़, मोबाइल-फ़्रेंडली वेबसाइट और वेब ऐप्स, SEO, WhatsApp इंटीग्रेशन और AI चैट असिस्टेंट जोड़ने की सुविधा के साथ।`],
    [`Google-ready SEO`, `Google के लिए तैयार SEO`],
    [`Your own domain`, `आपका अपना डोमेन`],
    [`Delivered in 5–7 days`, `5–7 दिन में डिलीवरी`],
    [`<span class="launch">🎉 Launch offer</span>Starting <s>₹9,999</s> <b>₹2,999</b>`,
     `<span class="launch">🎉 लॉन्च ऑफ़र</span><s>₹9,999</s> <b>₹2,999</b> से शुरू`],
    [`⚙️ AI Agents &amp; Workflow Automation`, `⚙️ AI एजेंट्स और वर्कफ़्लो ऑटोमेशन`],
    [`Automate emails, reports, data entry and follow-ups`, `ईमेल, रिपोर्ट, डेटा एंट्री और फ़ॉलो-अप, सब अपने आप`],
    [`📄 AI Document Processing`, `📄 AI डॉक्यूमेंट प्रोसेसिंग`],
    [`Read invoices, forms &amp; PDFs automatically`, `बिल, फ़ॉर्म और PDF अपने आप पढ़ें`],
    [`📱 Mobile Apps`, `📱 मोबाइल ऐप्स`],
    [`Android &amp; iOS apps with React Native`, `React Native से Android और iOS ऐप्स`],
    [`See what your website could look like`, `देखिए, आपकी वेबसाइट कैसी दिख सकती है`],
    [`Live sample websites we designed for common local businesses. Open them on your phone and try the booking buttons.`,
     `लोकल बिज़नेस के लिए हमारी बनाई सैंपल वेबसाइट्स। इन्हें अपने फ़ोन पर खोलिए और बुकिंग बटन दबाकर देखिए।`],
    [`🩺 Clinic Website`, `🩺 क्लिनिक वेबसाइट`],
    [`Doctors, timings, fees and WhatsApp appointment booking.`, `डॉक्टर, टाइमिंग, फ़ीस और WhatsApp पर अपॉइंटमेंट बुकिंग।`],
    [`🎓 Coaching Institute Website`, `🎓 कोचिंग इंस्टीट्यूट वेबसाइट`],
    [`Courses, fees, results, batch timings and free demo class booking.`, `कोर्स, फ़ीस, रिज़ल्ट, बैच टाइमिंग और फ़्री डेमो क्लास बुकिंग।`],
    [`🍽️ Restaurant &amp; Café Website`, `🍽️ रेस्टोरेंट और कैफ़े वेबसाइट`],
    [`Menu with prices, chef's specials and table reservation.`, `दाम के साथ मेन्यू, शेफ़ की ख़ास डिशेज़ और टेबल रिज़र्वेशन।`],
    [`View live sample →`, `लाइव सैंपल देखें →`],
    [`Every website comes with mobile design, Google SEO and WhatsApp integration. An AI chatbot can be added on top.`,
     `हर वेबसाइट में मोबाइल डिज़ाइन, Google SEO और WhatsApp इंटीग्रेशन शामिल है। चाहें तो साथ में AI चैटबॉट भी जुड़ सकता है।`],
    [`Built for businesses like yours`, `आप जैसे बिज़नेस के लिए बना`],
    [`Coaching &amp; Education`, `कोचिंग और शिक्षा`],
    [`Admission enquiries on WhatsApp, fee reminders, student portals, online tests.`, `WhatsApp पर एडमिशन पूछताछ, फ़ीस रिमाइंडर, स्टूडेंट पोर्टल, ऑनलाइन टेस्ट।`],
    [`Clinics &amp; Healthcare`, `क्लिनिक और हेल्थकेयर`],
    [`Appointment booking bots, patient reminders, clinic management software.`, `अपॉइंटमेंट बुकिंग बॉट, मरीज़ों को रिमाइंडर, क्लिनिक मैनेजमेंट सॉफ्टवेयर।`],
    [`Real Estate`, `रियल एस्टेट`],
    [`Lead capture, instant property replies, site-visit booking, CRM.`, `लीड कैप्चर, प्रॉपर्टी के सवालों का तुरंत जवाब, साइट-विज़िट बुकिंग, CRM।`],
    [`Retail &amp; E-commerce`, `रिटेल और ई-कॉमर्स`],
    [`Online stores, order updates on WhatsApp, inventory and billing.`, `ऑनलाइन स्टोर, WhatsApp पर ऑर्डर अपडेट, इन्वेंटरी और बिलिंग।`],
    [`Hotels &amp; Restaurants`, `होटल और रेस्टोरेंट`],
    [`Booking websites, table reservations, review and feedback automation.`, `बुकिंग वेबसाइट, टेबल रिज़र्वेशन, रिव्यू और फ़ीडबैक ऑटोमेशन।`],
    [`Startups`, `स्टार्टअप्स`],
    [`MVPs, AI features in your product, full stack development (Next.js, Node, NestJS).`, `MVP, आपके प्रोडक्ट में AI फ़ीचर्स, फुल स्टैक डेवलपमेंट (Next.js, Node, NestJS)।`],
    [`Why Kodivo`, `Kodivo ही क्यों`],
    [`Your money and your project are safe`, `आपका पैसा और आपका प्रोजेक्ट, दोनों सुरक्षित`],
    [`Choosing a tech partner is a big decision. That's why every project runs on clear, written terms.`, `टेक पार्टनर चुनना एक बड़ा फ़ैसला है। इसलिए हर प्रोजेक्ट साफ़, लिखित शर्तों पर चलता है।`],
    [`Pay in milestones`, `किस्तों में पेमेंट`],
    [`Only a small advance to start. The rest is paid after you see the work, never everything upfront.`, `शुरू करने के लिए बस थोड़ा-सा एडवांस। बाक़ी पेमेंट काम देखने के बाद, पूरा पैसा कभी पहले नहीं।`],
    [`Written agreement`, `लिखित एग्रीमेंट`],
    [`Scope, price, timeline and deliverables are written down and signed before work begins.`, `काम शुरू होने से पहले काम का दायरा, क़ीमत, समय-सीमा और डिलीवरी लिखकर साइन की जाती है।`],
    [`Everything in your name`, `सब कुछ आपके नाम पर`],
    [`Domain, hosting, source code and accounts belong to you. You are never locked in.`, `डोमेन, होस्टिंग, सोर्स कोड और अकाउंट्स आपके हैं। आप कभी हम पर निर्भर नहीं रहते।`],
    [`Founder-led`, `फ़ाउंडर ख़ुद संभालते हैं`],
    [`Talk directly to the founder, and meet in person in Delhi NCR or Lucknow.`, `सीधे फ़ाउंडर से बात करें, और दिल्ली NCR या लखनऊ में आमने-सामने मिलें।`],
    [`Weekly demos`, `हर हफ़्ते डेमो`],
    [`See progress every week. No disappearing, no surprises at the end.`, `हर हफ़्ते काम की प्रगति देखें। न ग़ायब होना, न आख़िर में कोई सरप्राइज़।`],
    [`Support after launch`, `लॉन्च के बाद भी सपोर्ट`],
    [`Free support period after launch, plus affordable maintenance plans.`, `लॉन्च के बाद कुछ समय तक फ़्री सपोर्ट, और किफ़ायती मेंटेनेंस प्लान।`],
    [`<span>1</span><b>Free consultation</b>Understand your goals`, `<span>1</span><b>फ़्री सलाह</b>आपके लक्ष्य समझना`],
    [`<span>2</span><b>Clear proposal</b>Fixed price &amp; timeline`, `<span>2</span><b>साफ़ प्रस्ताव</b>तय क़ीमत और समय-सीमा`],
    [`<span>3</span><b>Build &amp; demo</b>Weekly updates`, `<span>3</span><b>बनाना और डेमो</b>हर हफ़्ते अपडेट`],
    [`<span>4</span><b>Launch &amp; support</b>We stay with you`, `<span>4</span><b>लॉन्च और सपोर्ट</b>हम आपके साथ रहते हैं`],
    [`Meet the Founder`, `फ़ाउंडर से मिलिए`],
    [`Agam Sahu`, `अगम साहू`],
    [`Kodivo is founded by <b>Agam Sahu</b>, a Senior Full Stack Engineer with <b>8+ years</b> of experience building e-commerce platforms with payment gateways (Stripe, BillDesk), multi-user admin systems with role-based access, approval workflows and cloud backends.`,
     `Kodivo की शुरुआत <b>अगम साहू</b> ने की है, जो <b>8+ साल</b> के अनुभव वाले सीनियर फुल स्टैक इंजीनियर हैं। उन्होंने पेमेंट गेटवे (Stripe, BillDesk) वाले ई-कॉमर्स प्लेटफ़ॉर्म, रोल-आधारित एक्सेस वाले मल्टी-यूज़र एडमिन सिस्टम, अप्रूवल वर्कफ़्लो और क्लाउड बैकएंड बनाए हैं।`],
    [`I started Kodivo with one belief: <b>every business, big or small, deserves AI</b>. Kodivo brings solid engineering and practical AI to businesses in Delhi NCR and Lucknow, with the trust of someone you can actually meet and call.`,
     `मैंने Kodivo एक सोच के साथ शुरू किया: <b>हर बिज़नेस, छोटा हो या बड़ा, AI का हक़दार है</b>। Kodivo दिल्ली NCR और लखनऊ के बिज़नेस तक मज़बूत इंजीनियरिंग और काम का AI पहुँचाता है, ऐसे इंसान के भरोसे के साथ जिससे आप सच में मिल सकें और फ़ोन पर बात कर सकें।`],
    [`Our Tech Stack`, `हमारा टेक स्टैक`],
    [`Experience highlights`, `अनुभव की झलक`],
    [`E-commerce with Stripe &amp; BillDesk, incl. payment-failure handling`, `Stripe और BillDesk के साथ ई-कॉमर्स, पेमेंट फ़ेल होने की हैंडलिंग समेत`],
    [`Multi-user RBAC admin panels &amp; approval workflows`, `मल्टी-यूज़र RBAC एडमिन पैनल और अप्रूवल वर्कफ़्लो`],
    [`Blockchain &amp; NFT modules (Web3 fundamentals)`, `ब्लॉकचेन और NFT मॉड्यूल (Web3 की बुनियादी समझ)`],
    [`Kodivo Academy`, `Kodivo अकादमी`],
    [`Want to learn Full Stack + AI?`, `Full Stack + AI सीखना चाहते हैं?`],
    [`1:1 mentoring, interview prep and weekend batches in React, Node.js, Next.js, SQL &amp; AI, taught by a working senior engineer.`,
     `React, Node.js, Next.js, SQL और AI में 1:1 मेंटरिंग, इंटरव्यू की तैयारी और वीकेंड बैच, एक वर्किंग सीनियर इंजीनियर से।`],
    [`Explore Academy →`, `अकादमी देखें →`],
    [`FAQ`, `सवाल-जवाब`],
    [`Common questions`, `अक्सर पूछे जाने वाले सवाल`],
    [`What does "AI-first" mean for my business?`, `मेरे बिज़नेस के लिए "AI-first" का क्या मतलब है?`],
    [`Every solution we build is designed to save you time with AI: chatbots that answer customers, automation that handles follow-ups, and software that reads documents and generates reports, so you and your team can focus on growth.`,
     `हम जो भी बनाते हैं, उसका मक़सद AI से आपका समय बचाना है: ग्राहकों को जवाब देने वाले चैटबॉट, फ़ॉलो-अप संभालने वाला ऑटोमेशन, और डॉक्यूमेंट पढ़कर रिपोर्ट बनाने वाला सॉफ्टवेयर, ताकि आप और आपकी टीम बिज़नेस बढ़ाने पर ध्यान दे सकें।`],
    [`Is Kodivo an agency or a freelancer?`, `Kodivo एजेंसी है या फ़्रीलांसर?`],
    [`Kodivo is a founder-led software studio. The founder personally leads every project, so you get senior-level work and one accountable point of contact. For larger projects, trusted specialists join the team.`,
     `Kodivo एक फ़ाउंडर-लेड सॉफ्टवेयर स्टूडियो है। हर प्रोजेक्ट फ़ाउंडर ख़ुद संभालते हैं, इसलिए आपको सीनियर-लेवल काम और एक ही ज़िम्मेदार व्यक्ति मिलता है। बड़े प्रोजेक्ट्स में भरोसेमंद एक्सपर्ट्स टीम से जुड़ते हैं।`],
    [`Do you work with small businesses?`, `क्या आप छोटे बिज़नेस के साथ काम करते हैं?`],
    [`Yes! Shops, clinics, coaching centres, hotels, startups — we'll suggest a solution that fits your budget.`, `हाँ! दुकानें, क्लिनिक, कोचिंग सेंटर, होटल, स्टार्टअप्स — हम आपके बजट के हिसाब से समाधान सुझाएँगे।`],
    [`Can we meet in person?`, `क्या हम आमने-सामने मिल सकते हैं?`],
    [`Yes. We're based in Delhi NCR and Lucknow, so we can meet in person in either city. We also work fully online with clients elsewhere.`,
     `हाँ। हम दिल्ली NCR और लखनऊ में हैं, इसलिए दोनों में से किसी भी शहर में मिल सकते हैं। दूसरे शहरों के क्लाइंट्स के साथ हम पूरी तरह ऑनलाइन भी काम करते हैं।`],
    [`How do payments work?`, `पेमेंट कैसे होता है?`],
    [`In milestones, for example 40% to start, 40% at demo and 20% at launch. Everything is agreed in writing first.`, `किस्तों में, जैसे 40% शुरुआत में, 40% डेमो पर और 20% लॉन्च पर। सब कुछ पहले लिखित में तय होता है।`],
    [`Will I own the code and data?`, `क्या कोड और डेटा मेरा होगा?`],
    [`Yes. The domain, hosting, code and your customer data belong to you. See our <a href="privacy.html">privacy policy</a>.`,
     `हाँ। डोमेन, होस्टिंग, कोड और आपके ग्राहकों का डेटा, सब आपका है। हमारी <a href="privacy.html">प्राइवेसी पॉलिसी</a> देखें।`],
    [`Let's build something smart 🚀`, `चलिए कुछ स्मार्ट बनाते हैं 🚀`],
    [`Tell us about your business. We usually reply within a few hours.`, `अपने बिज़नेस के बारे में बताइए। हम आमतौर पर कुछ ही घंटों में जवाब देते हैं।`],
    [`📞 Call Now`, `📞 अभी कॉल करें`],
    [`✉️ Email`, `✉️ ईमेल`],
    [`📍 Delhi NCR &amp; Lucknow, India`, `📍 दिल्ली NCR और लखनऊ, भारत`],
    [`© <span id="year"></span> Kodivo · Founded by Agam Sahu · Delhi NCR &amp; Lucknow · <a href="privacy.html">Privacy</a>`,
     `© <span id="year"></span> Kodivo · फ़ाउंडर: अगम साहू · दिल्ली NCR और लखनऊ · <a href="privacy.html">प्राइवेसी</a>`],

    // ---------- academy.html ----------
    [`Kodivo Academy | Full Stack + AI Mentoring`, `Kodivo अकादमी | Full Stack + AI मेंटरिंग`],
    [`🎓 Online · Students across India`, `🎓 ऑनलाइन · पूरे भारत के स्टूडेंट्स`],
    [`Become a job-ready <span class="grad">Full Stack + AI</span> developer.`, `बनिए जॉब के लिए तैयार <span class="grad">Full Stack + AI</span> डेवलपर।`],
    [`Learn React, Node.js, Next.js, SQL and AI from <strong>Agam Sahu</strong>, a working Senior Full Stack Engineer with 8+ years of industry experience. Real projects, not just theory.`,
     `<strong>अगम साहू</strong> से React, Node.js, Next.js, SQL और AI सीखिए, जो 8+ साल के इंडस्ट्री अनुभव वाले वर्किंग सीनियर फुल स्टैक इंजीनियर हैं। असली प्रोजेक्ट्स, सिर्फ़ थ्योरी नहीं।`],
    [`💬 Book a Free 20-min Call`, `💬 20 मिनट की फ़्री कॉल बुक करें`],
    [`Programs`, `प्रोग्राम्स`],
    [`Choose how you want to learn`, `चुनिए, आप कैसे सीखना चाहते हैं`],
    [`Ideal for BCA, MCA and B.Tech students, freshers, and developers preparing for a job switch.`, `BCA, MCA और B.Tech स्टूडेंट्स, फ़्रेशर्स, और जॉब बदलने की तैयारी कर रहे डेवलपर्स के लिए बिल्कुल सही।`],
    [`1:1 Mentoring &amp; Interview Prep`, `1:1 मेंटरिंग और इंटरव्यू की तैयारी`],
    [`Personal sessions on your exact needs: doubt solving, project guidance, resume review, mock interviews and a career roadmap.`,
     `आपकी ज़रूरत के हिसाब से पर्सनल सेशन: डाउट सॉल्विंग, प्रोजेक्ट गाइडेंस, रिज़्यूमे रिव्यू, मॉक इंटरव्यू और करियर रोडमैप।`],
    [`Flexible timings (evenings / weekends)`, `लचीला समय (शाम / वीकेंड)`],
    [`Mock interviews with real feedback`, `असली फ़ीडबैक के साथ मॉक इंटरव्यू`],
    [`Resume &amp; GitHub review`, `रिज़्यूमे और GitHub रिव्यू`],
    [`<span class="launch">🎉 Launch offer</span><s>₹799</s> <b>₹249</b> / hour · first 20-min call free`,
     `<span class="launch">🎉 लॉन्च ऑफ़र</span><s>₹799</s> <b>₹249</b> / घंटा · पहली 20 मिनट की कॉल फ़्री`],
    [`Book a Free Call`, `फ़्री कॉल बुक करें`],
    [`New Batch`, `नया बैच`],
    [`Weekend Batch: Full Stack + AI`, `वीकेंड बैच: Full Stack + AI`],
    [`8-week live online program (Sat–Sun). Build and deploy real projects, from frontend to backend to AI features.`,
     `8 हफ़्ते का लाइव ऑनलाइन प्रोग्राम (शनिवार–रविवार)। फ्रंटएंड से बैकएंड और AI फ़ीचर्स तक, असली प्रोजेक्ट्स बनाइए और डिप्लॉय कीजिए।`],
    [`<b>Wk 1–2</b> JavaScript &amp; TypeScript essentials`, `<b>हफ़्ता 1–2</b> JavaScript और TypeScript की ज़रूरी बातें`],
    [`<b>Wk 3–4</b> React.js &amp; Next.js`, `<b>हफ़्ता 3–4</b> React.js और Next.js`],
    [`<b>Wk 5–6</b> Node.js, APIs, SQL / PostgreSQL`, `<b>हफ़्ता 5–6</b> Node.js, APIs, SQL / PostgreSQL`],
    [`<b>Wk 7</b> AI integration (LLM APIs, chatbots)`, `<b>हफ़्ता 7</b> AI इंटीग्रेशन (LLM APIs, चैटबॉट)`],
    [`<b>Wk 8</b> Deploy on cloud + capstone project`, `<b>हफ़्ता 8</b> क्लाउड पर डिप्लॉय + कैपस्टोन प्रोजेक्ट`],
    [`<span class="launch">🎉 Launch offer · limited seats</span><s>₹4,999</s> <b>₹1,499</b> · small batch`,
     `<span class="launch">🎉 लॉन्च ऑफ़र · सीमित सीटें</span><s>₹4,999</s> <b>₹1,499</b> · छोटा बैच`],
    [`Reserve My Seat`, `मेरी सीट रिज़र्व करें`],
    [`🏫 Colleges &amp; institutes: we also run 1–2 day workshops on <b>Full Stack + AI</b>. <a href="https://wa.me/919235266579?text=Hi%20Agam%2C%20I%27d%20like%20to%20discuss%20a%20workshop%20for%20our%20college." target="_blank" rel="noopener">Get in touch</a>.`,
     `🏫 कॉलेज और संस्थान: हम <b>Full Stack + AI</b> पर 1–2 दिन की वर्कशॉप भी कराते हैं। <a href="https://wa.me/919235266579?text=Hi%20Agam%2C%20I%27d%20like%20to%20discuss%20a%20workshop%20for%20our%20college." target="_blank" rel="noopener">संपर्क करें</a>।`],
    [`Are classes online or offline?`, `क्लासेज़ ऑनलाइन हैं या ऑफ़लाइन?`],
    [`Mentoring and weekend batches are live online, so you can join from anywhere. Notes and recordings are shared.`,
     `मेंटरिंग और वीकेंड बैच लाइव ऑनलाइन होते हैं, इसलिए आप कहीं से भी जुड़ सकते हैं। नोट्स और रिकॉर्डिंग शेयर की जाती हैं।`],
    [`I'm a beginner. Can I join?`, `मैं बिगिनर हूँ। क्या मैं जुड़ सकता/सकती हूँ?`],
    [`If you know basic programming, yes. Message on WhatsApp and you'll get an honest answer on whether the batch is right for you.`,
     `अगर आपको बेसिक प्रोग्रामिंग आती है, तो हाँ। WhatsApp पर मैसेज करें, आपको ईमानदारी से बताया जाएगा कि बैच आपके लिए सही है या नहीं।`],
    [`How do I pay?`, `पेमेंट कैसे करूँ?`],
    [`UPI, before the session or batch starts.`, `UPI से, सेशन या बैच शुरू होने से पहले।`],
    [`© <span id="year"></span> Kodivo Academy · <a href="index.html">Kodivo</a> · <a href="privacy.html">Privacy</a>`,
     `© <span id="year"></span> Kodivo अकादमी · <a href="index.html">Kodivo</a> · <a href="privacy.html">प्राइवेसी</a>`],

    // ---------- demo.html ----------
    [`AI Chatbot Demo | Kodivo`, `AI चैटबॉट डेमो | Kodivo`],
    [`← Back to site`, `← वेबसाइट पर वापस`],
    [`Live Demo`, `लाइव डेमो`],
    [`AI Chatbot for your business 🤖`, `आपके बिज़नेस के लिए AI चैटबॉट 🤖`],
    [`Pick a sample business and chat like a customer would. Ask about fees, timings, location, or try booking. English or Hinglish both work.`,
     `कोई सैंपल बिज़नेस चुनिए और ग्राहक की तरह चैट कीजिए। फ़ीस, टाइमिंग, लोकेशन के बारे में पूछिए, या बुकिंग करके देखिए। इंग्लिश या हिंग्लिश, दोनों चलेंगे।`],
    [`🎓 Coaching Institute`, `🎓 कोचिंग इंस्टीट्यूट`],
    [`🩺 Clinic`, `🩺 क्लिनिक`],
    [`🍽️ Restaurant / Café`, `🍽️ रेस्टोरेंट / कैफ़े`],
    [`<span class="dot"></span> AI Assistant · online 24×7`, `<span class="dot"></span> AI असिस्टेंट · 24×7 ऑनलाइन`],
    [`📋 What the owner sees`, `📋 मालिक को क्या दिखता है`],
    [`Every enquiry the bot captures lands here (and on the owner's WhatsApp / email in the real version).`,
     `बॉट जो भी पूछताछ लेता है, वो यहाँ आती है (असली वर्ज़न में मालिक के WhatsApp / ईमेल पर भी)।`],
    [`No leads yet. Try booking in the chat →`, `अभी कोई लीड नहीं। चैट में बुकिंग करके देखिए →`],
    [`✨ In the real version`, `✨ असली वर्ज़न में`],
    [`Trained on <b>your</b> fees, timings, FAQs &amp; documents`, `<b>आपकी</b> फ़ीस, टाइमिंग, FAQ और डॉक्यूमेंट्स पर ट्रेन किया हुआ`],
    [`Works on your website <b>and WhatsApp</b>`, `आपकी वेबसाइट <b>और WhatsApp</b>, दोनों पर काम करता है`],
    [`Understands any question, not just keywords`, `सिर्फ़ कीवर्ड नहीं, हर तरह का सवाल समझता है`],
    [`Sends leads to WhatsApp / Google Sheet / CRM`, `लीड्स WhatsApp / Google Sheet / CRM पर भेजता है`],
    [`Automatic reminders &amp; follow-ups`, `अपने आप रिमाइंडर और फ़ॉलो-अप`],
    [`💬 Get this for my business`, `💬 मेरे बिज़नेस के लिए चाहिए`],
    [`This is a demo with sample businesses and pre-set answers. No data is stored or sent anywhere.`,
     `यह सैंपल बिज़नेस और पहले से तय जवाबों वाला डेमो है। कोई भी डेटा न सेव होता है, न कहीं भेजा जाता है।`],
    [`© <span id="year"></span> Kodivo · Founded by Agam Sahu · Delhi NCR &amp; Lucknow`, `© <span id="year"></span> Kodivo · फ़ाउंडर: अगम साहू · दिल्ली NCR और लखनऊ`],

    // ---------- privacy.html ----------
    [`Privacy Policy | Kodivo`, `प्राइवेसी पॉलिसी | Kodivo`],
    [`← Home`, `← होम`],
    [`Privacy Policy`, `प्राइवेसी पॉलिसी`],
    [`Last updated: October 2026`, `आख़िरी अपडेट: अक्टूबर 2026`],
    [`Kodivo ("we", "us") is a software studio founded by Agam Sahu, based in Delhi NCR and Lucknow, India. This policy explains what information we collect and how we use it.`,
     `Kodivo ("हम") अगम साहू द्वारा शुरू किया गया एक सॉफ्टवेयर स्टूडियो है, जो दिल्ली NCR और लखनऊ, भारत में है। यह पॉलिसी बताती है कि हम कौन-सी जानकारी लेते हैं और उसका इस्तेमाल कैसे करते हैं।`],
    [`Information we collect`, `हम कौन-सी जानकारी लेते हैं`],
    [`<b>Information you give us:</b> your name, phone number, email and project details when you contact us by WhatsApp, phone or email.`,
     `<b>आप जो जानकारी देते हैं:</b> जब आप WhatsApp, फ़ोन या ईमेल से संपर्क करते हैं, तब आपका नाम, फ़ोन नंबर, ईमेल और प्रोजेक्ट की जानकारी।`],
    [`<b>Website:</b> this website does not use cookies. Your theme (light/dark) and language choices are saved only in your own browser.`,
     `<b>वेबसाइट:</b> यह वेबसाइट कुकीज़ का इस्तेमाल नहीं करती। आपकी थीम (लाइट/डार्क) और भाषा की पसंद सिर्फ़ आपके अपने ब्राउज़र में सेव होती है।`],
    [`<b>Visitor statistics:</b> to count daily visitors, we record the page you open, your country, and whether you use a mobile or desktop. Your IP address is turned into a one-way code that changes every day, and the IP itself is never stored, so we can't identify you or follow you across days. These statistics are private and are never shared or sold.`,
     `<b>विज़िटर आँकड़े:</b> रोज़ के विज़िटर गिनने के लिए हम दर्ज करते हैं कि आपने कौन-सा पेज खोला, आप किस देश से हैं, और आप मोबाइल इस्तेमाल कर रहे हैं या डेस्कटॉप। आपका IP एड्रेस एक ऐसे कोड में बदला जाता है जिसे वापस IP में नहीं बदला जा सकता और जो हर दिन बदल जाता है। असली IP कभी सेव नहीं होता, इसलिए हम न आपको पहचान सकते हैं, न अलग-अलग दिनों में आपको ट्रैक कर सकते हैं। ये आँकड़े निजी हैं और कभी शेयर या बेचे नहीं जाते।`],
    [`<b>AI chatbot demo:</b> the demo runs entirely in your browser. Nothing you type is stored or sent to us.`,
     `<b>AI चैटबॉट डेमो:</b> डेमो पूरी तरह आपके ब्राउज़र में चलता है। आप जो भी टाइप करते हैं, वो न सेव होता है, न हमें भेजा जाता है।`],
    [`How we use it`, `हम इसका इस्तेमाल कैसे करते हैं`],
    [`To reply to your enquiry and discuss your project or classes.`, `आपकी पूछताछ का जवाब देने और आपके प्रोजेक्ट या क्लासेज़ पर बात करने के लिए।`],
    [`To prepare proposals, agreements and invoices.`, `प्रस्ताव, एग्रीमेंट और इनवॉइस बनाने के लिए।`],
    [`We never sell or rent your information to anyone.`, `हम आपकी जानकारी कभी किसी को बेचते या किराए पर नहीं देते।`],
    [`Client projects and data`, `क्लाइंट प्रोजेक्ट्स और डेटा`],
    [`When we build software for you, your business data and your customers' data belong to you. We access it only to build, test and support your project, and we follow India's Digital Personal Data Protection Act, 2023. Specific terms are written into each project agreement.`,
     `जब हम आपके लिए सॉफ्टवेयर बनाते हैं, तो आपके बिज़नेस और आपके ग्राहकों का डेटा आपका होता है। हम इसे सिर्फ़ आपका प्रोजेक्ट बनाने, टेस्ट करने और सपोर्ट करने के लिए एक्सेस करते हैं, और भारत के डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 (DPDP Act) का पालन करते हैं। विस्तृत शर्तें हर प्रोजेक्ट एग्रीमेंट में लिखी होती हैं।`],
    [`Third-party services`, `थर्ड-पार्टी सर्विसेज़`],
    [`We use WhatsApp, email and phone to communicate. Their own privacy policies apply to messages sent through them.`,
     `बातचीत के लिए हम WhatsApp, ईमेल और फ़ोन का इस्तेमाल करते हैं। उनके ज़रिए भेजे गए मैसेज पर उनकी अपनी प्राइवेसी पॉलिसी लागू होती है।`],
    [`Your rights`, `आपके अधिकार`],
    [`You can ask us to show, correct or delete the information we hold about you at any time.`, `आप कभी भी कह सकते हैं कि हम आपके बारे में रखी जानकारी आपको दिखाएँ, सुधारें या हटा दें।`],
    [`Email <a href="mailto:agamsahu015@gmail.com">agamsahu015@gmail.com</a> or WhatsApp <a href="https://wa.me/919235266579" target="_blank" rel="noopener">+91 92352 66579</a>.`,
     `ईमेल करें <a href="mailto:agamsahu015@gmail.com">agamsahu015@gmail.com</a> या WhatsApp करें <a href="https://wa.me/919235266579" target="_blank" rel="noopener">+91 92352 66579</a>।`],
    [`© <span id="year"></span> Kodivo · Founded by Agam Sahu`, `© <span id="year"></span> Kodivo · फ़ाउंडर: अगम साहू`],
  ]);

  const keyOf = (el) =>
    el.innerHTML.replace(/<span id="year">\d*<\/span>/, '<span id="year"></span>').replace(/\s+/g, " ").trim();

  // Remember each translatable block's English so we can switch back.
  const blocks = [];
  document.querySelectorAll(SELECTOR).forEach((el) => {
    if (el.parentElement && el.parentElement.closest(SELECTOR)) return; // outermost only
    const en = keyOf(el);
    if (HI.has(en)) blocks.push({ el, en });
  });
  const titleEn = document.title;

  const actions = document.querySelector(".nav-actions");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "lang-btn";
  if (actions) actions.insertBefore(button, actions.firstChild);

  function apply(lang) {
    const hindi = lang === "hi";
    blocks.forEach(({ el, en }) => { el.innerHTML = hindi ? HI.get(en) : en; });
    document.title = hindi && HI.has(titleEn) ? HI.get(titleEn) : titleEn;
    document.documentElement.lang = hindi ? "hi" : "en";
    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
    button.textContent = hindi ? "EN" : "हिंदी";
    button.setAttribute("aria-label", hindi ? "Switch to English" : "हिंदी में देखें");
    button.title = button.getAttribute("aria-label");
  }

  let lang = "en";
  try {
    const fromUrl = new URLSearchParams(location.search).get("lang");
    if (fromUrl === "hi" || fromUrl === "en") localStorage.setItem(STORAGE_KEY, fromUrl);
    lang = localStorage.getItem(STORAGE_KEY) || "en";
  } catch (e) {
    lang = new URLSearchParams(location.search).get("lang") === "hi" ? "hi" : "en";
  }
  apply(lang);

  button.addEventListener("click", () => {
    lang = lang === "hi" ? "en" : "hi";
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    apply(lang);
  });
})();
