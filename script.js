// FAQ accordion
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

// Capitol AI demo assistant — this bot IS Capitol AI's front desk.
// Paste a Cal.com / Calendly booking link here when ready and the bot
// will offer real time-slot picking for the free audit.
const AUDIT_SCHEDULING_URL = 'https://cal.com/capital-ai/free-ai-audit';

const chatBody = document.getElementById('chatBody');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');

// chatState tracks where we are in a conversation so "yes" actually means something
const chatState = { mode: 'idle', name: null, business: null };

function addMsg(text, who) {
  const div = document.createElement('div');
  div.className = 'msg ' + who;
  div.textContent = text;
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function addMsgHtml(html, who) {
  const div = document.createElement('div');
  div.className = 'msg ' + who;
  div.innerHTML = html;
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
}

const SERVICES = {
  review: { name: 'Review Responder', price: '$297/mo',
    desc: 'Every Google and Yelp review answered in your voice, within the hour — the good, the bad, and the unfair.' },
  chatbot: { name: 'Website Chatbot', price: '$497/mo',
    desc: 'Captures leads 24/7. Answers FAQs, quotes jobs, and books appointments while you\'re on the tools.' },
  content: { name: 'Content Autopilot', price: '$397/mo',
    desc: 'A month of social posts written, designed, and scheduled for you. You approve, we publish.' },
  reminders: { name: 'Appointment Reminders', price: '$297/mo',
    desc: 'Automatic texts that cut no-shows and fill cancellations from your waitlist.' },
  full: { name: 'The Full Front Desk', price: '$997/mo',
    desc: 'All of the above in one package. Your entire front office, automated.' }
};

function servicesSummary() {
  return 'We offer five services: Review Responder ($297/mo), Website Chatbot ($497/mo), ' +
    'Content Autopilot ($397/mo), Appointment Reminders ($297/mo), and the Full Front Desk ' +
    '($997/mo). Every plan is month-to-month — cancel anytime.';
}

function matchService(t) {
  if (/review/.test(t)) return SERVICES.review;
  if (/chat\s?bot/.test(t)) return SERVICES.chatbot;
  if (/content|social|post/.test(t)) return SERVICES.content;
  if (/reminder|no-?show/.test(t)) return SERVICES.reminders;
  if (/full|front desk|everything|all of/.test(t)) return SERVICES.full;
  return null;
}

function parsePhone(t) {
  const m = t.match(/(\+?1[\s.-]?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/);
  return m ? m[0] : null;
}

function capName(s) {
  return s.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function offerScheduling() {
  if (AUDIT_SCHEDULING_URL) {
    addMsgHtml('Prefer to pick a time yourself? <a href="' + AUDIT_SCHEDULING_URL +
      '" target="_blank" rel="noopener">Grab a slot here</a>.', 'bot');
  }
}

function startAuditFlow() {
  chatState.mode = 'audit_name';
  chatState.name = null;
  chatState.business = null;
  addMsg('Let\'s get your free AI audit booked. What\'s your name?', 'bot');
}

function auditConfirmation(phone) {
  const name = chatState.name || 'there';
  const biz = chatState.business ? ' ' + chatState.business : ' your business';
  chatState.mode = 'idle';
  chatState.name = null;
  chatState.business = null;
  addMsg('You\'re all set, ' + name + '! Korey will personally review' + biz +
    ' and send your free audit video within 48 hours — to ' + phone + '. Anything else I can help with?', 'bot');
  offerScheduling();
}

function botReply(q) {
  const t = q.toLowerCase().trim();
  addMsg('…', 'bot');
  setTimeout(() => {
    chatBody.lastChild.remove();

    // --- Audit flow: collecting name → business → phone ---
    if (chatState.mode === 'audit_name') {
      if (!t) { addMsg('What\'s your name?', 'bot'); return; }
      chatState.name = capName(t);
      chatState.mode = 'audit_business';
      addMsg('Thanks ' + chatState.name + ' — what\'s your business name?', 'bot');
      return;
    }
    if (chatState.mode === 'audit_business') {
      if (!t) { addMsg('What\'s your business name?', 'bot'); return; }
      chatState.business = capName(t);
      chatState.mode = 'audit_phone';
      addMsg('And the best number to reach you at?', 'bot');
      return;
    }
    if (chatState.mode === 'audit_phone') {
      const phone = parsePhone(t);
      if (phone) { auditConfirmation(phone); return; }
      addMsg('What number should we send your audit to? Just digits is fine.', 'bot');
      return;
    }

    // --- Callback flow ---
    if (chatState.mode === 'callback_phone') {
      const phone = parsePhone(t);
      if (phone) {
        chatState.mode = 'idle';
        addMsg('Done — Korey will call you personally at ' + phone + '. Anything else I can help with?', 'bot');
        return;
      }
      addMsg('What\'s the best number for Korey to call?', 'bot');
      return;
    }

    const isYes = /^(yes|yeah|yep|sure|ok|okay|please|do it|sounds good)\b/.test(t) || /\byes\b/.test(t);
    const isNo = /^(no|nope|nah|not right now|no thanks)\b/.test(t);

    // Offer accepted / declined
    if (chatState.mode === 'offer' && isYes && !isNo) { startAuditFlow(); return; }
    if (chatState.mode === 'offer' && isNo) {
      chatState.mode = 'idle';
      addMsg('No problem! Anything else — services, pricing, or how it works?', 'bot');
      return;
    }

    // Book the free audit / schedule / call
    if (/book|audit|schedule|appointment|demo|sign\s?up|get started/.test(t)) {
      startAuditFlow();
      return;
    }
    if (/call me|call back|talk to (someone|a person|korey)|human|real person|phone call/.test(t)) {
      chatState.mode = 'callback_phone';
      addMsg('You got it — what\'s the best number for Korey to call?', 'bot');
      return;
    }

    // Specific service deep-dive
    const svc = matchService(t);
    if (svc && /service|what|tell|detail|more|about|do you|offer/.test(t)) {
      chatState.mode = 'offer';
      addMsg(svc.name + ' — ' + svc.price + '. ' + svc.desc +
        ' Want me to book your free audit so Korey can show you exactly what it\'d do for your business?', 'bot');
      return;
    }
    // Service name on its own ("chatbot", "reminders") — treat as interest
    if (svc) {
      chatState.mode = 'offer';
      addMsg(svc.name + ' — ' + svc.price + '. ' + svc.desc +
        ' Want me to book your free audit so Korey can show you exactly what it\'d do for your business?', 'bot');
      return;
    }

    // Services overview
    if (/service|what do you do|offer|help with/.test(t)) {
      chatState.mode = 'offer';
      addMsg(servicesSummary() +
        ' Want details on any of them — or should we book your free audit?', 'bot');
      return;
    }

    // Pricing
    if (/price|pricing|cost|much|charge/.test(t)) {
      chatState.mode = 'offer';
      addMsg('Simple: Starter $297/mo, Growth $497/mo (most popular), Full Front Desk $997/mo. ' +
        'Every plan is month-to-month, cancel anytime, and setup is free on annual plans. ' +
        'Want to book the free audit and see what fits?', 'bot');
      return;
    }

    // How it works
    if (/how|work|process|start|long|setup/.test(t)) {
      chatState.mode = 'offer';
      addMsg('Three steps: 1) Free AI audit — Korey personally reviews your business and sends you a short video. ' +
        '2) Setup in 7 days — built in your voice, you approve before anything goes live. ' +
        '3) It runs itself — you get a monthly report of what the AI handled. Ready to book your audit?', 'bot');
      return;
    }

    // Who / about
    if (/who|korey|about|company|yourself/.test(t)) {
      chatState.mode = 'offer';
      addMsg('I\'m the AI front desk for Capitol AI Co. — built by Korey Crawford, a Lansing local who\'s spent ' +
        '15 years learning the internet inside and out. Now he puts local businesses on autopilot. ' +
        'Want to book your free audit with him?', 'bot');
      return;
    }

    // Cancel / contract worries
    if (/cancel|contract|commit/.test(t)) {
      addMsg('No contracts, no cancellation fees — every plan is month-to-month. If it\'s not paying for itself, you shouldn\'t pay for it.', 'bot');
      return;
    }

    // Thanks
    if (/thank|thanks|great|awesome|perfect/.test(t)) {
      chatState.mode = 'idle';
      addMsg('Anytime! Anything else I can help with?', 'bot');
      return;
    }

    // A bare "yes" with no context
    if (isYes && !isNo) {
      addMsg('Great — I can walk you through our services, pricing, or how it works. Or we can book your free AI audit right now. What sounds good?', 'bot');
      return;
    }

    // Fallback — stays useful
    chatState.mode = 'idle';
    addMsg('I can walk you through our services, pricing, or how it works — or book your free AI audit right here. What do you need?', 'bot');
  }, 900);
}

function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return;
  addMsg(text, 'user');
  chatInput.value = '';
  botReply(text);
}
chatSend.addEventListener('click', sendChat);
chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });

// Audit form — front-end only for now; wire to Formspree (free) before launch
document.getElementById('auditForm').addEventListener('submit', e => {
  e.preventDefault();
  const note = document.getElementById('formNote');
  note.textContent = 'Got it — your free audit is on the way. Check your phone within 48 hours.';
  note.style.color = '#34d399';
  e.target.querySelectorAll('input, select, button').forEach(el => el.disabled = true);
});
