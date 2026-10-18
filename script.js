// FAQ accordion
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

// Demo chatbot — scripted responses with simple conversation state
const chatBody = document.getElementById('chatBody');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');

// chatState tracks where we are in a conversation so "yes" actually means something
const chatState = { mode: 'idle', day: null, time: null };

function addMsg(text, who) {
  const div = document.createElement('div');
  div.className = 'msg ' + who;
  div.textContent = text;
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
}

const DAYS = {
  mon: 'Monday', monday: 'Monday',
  tue: 'Tuesday', tues: 'Tuesday', tuesday: 'Tuesday',
  wed: 'Wednesday', wednesday: 'Wednesday',
  thu: 'Thursday', thur: 'Thursday', thurs: 'Thursday', thursday: 'Thursday',
  fri: 'Friday', friday: 'Friday',
  sat: 'Saturday', saturday: 'Saturday',
  sun: 'Sunday', sunday: 'Sunday'
};

function capDay(d) { return d.charAt(0).toUpperCase() + d.slice(1); }

function parseDay(t) {
  for (const k of Object.keys(DAYS)) {
    if (new RegExp('\\b' + k + '\\b').test(t)) return DAYS[k];
  }
  if (/\btoday\b/.test(t)) return 'today';
  if (/\btomorrow\b/.test(t)) return 'tomorrow';
  if (/\bweekday\b/.test(t)) return 'a weekday';
  if (/\bweekend\b/.test(t)) return 'Saturday';
  return null;
}

function parseTime(t) {
  const m = t.match(/\b(1[0-2]|[1-9])(:\d{2})?\s*(am|pm)\b/);
  if (m) return m[0].replace(/\s+/, '');
  if (/\bmorning\b/.test(t)) return 'the morning';
  if (/\bafternoon\b/.test(t)) return 'the afternoon';
  if (/\bevening\b/.test(t)) return 'the evening';
  return null;
}

function parsePhone(t) {
  const m = t.match(/(\+?1[\s.-]?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/);
  return m ? m[0] : null;
}

function bookingConfirmation() {
  const day = chatState.day || 'the day you picked';
  const time = chatState.time || 'your time';
  return 'You\'re booked for ' + capDay(day) + ' at ' + time + '. What\'s the best number to send the confirmation to?';
}

function finishBooking(phone) {
  const day = capDay(chatState.day || 'your day');
  const time = chatState.time || 'your time';
  chatState.mode = 'idle';
  chatState.day = null;
  chatState.time = null;
  return "All set — you're booked for " + day + ' at ' + time +
    '. Confirmation is on its way to ' + phone + '. Anything else I can help with?';
}

function botReply(q) {
  const t = q.toLowerCase();
  addMsg('…', 'bot');
  setTimeout(() => {
    chatBody.lastChild.remove();

    // Phone number anywhere in a booking flow = done
    const phone = parsePhone(t);
    if (phone && (chatState.mode === 'booking_phone' || chatState.mode === 'quote_phone')) {
      addMsg(chatState.mode === 'quote_phone'
        ? 'Got it — someone will call you at ' + phone + ' within 15 minutes during business hours. Anything else?'
        : finishBooking(phone), 'bot');
      return;
    }

    const isYes = /^(yes|yeah|yep|sure|ok|okay|please|do it|sounds good)\b/.test(t.trim()) || /\byes\b/.test(t);
    const isNo = /^(no|nope|nah|not right now|no thanks)\b/.test(t.trim());

    // Booking offer accepted
    if ((chatState.mode === 'booking_offer' || chatState.mode === 'hours_offer') && isYes && !isNo) {
      const day = parseDay(t), time = parseTime(t);
      if (day && time) {
        chatState.day = day; chatState.time = time;
        chatState.mode = 'booking_phone';
        addMsg(bookingConfirmation(), 'bot');
      } else if (day) {
        chatState.day = day; chatState.mode = 'booking_time';
        addMsg('Great — ' + capDay(day) + '. What time works? We\'re open 9am–6pm weekdays, 9am–2pm Saturday.', 'bot');
      } else {
        chatState.mode = 'booking_day';
        addMsg('Great! What day works for you — a weekday or Saturday?', 'bot');
      }
      return;
    }
    if ((chatState.mode === 'booking_offer' || chatState.mode === 'hours_offer') && isNo) {
      chatState.mode = 'idle';
      addMsg('No problem! Anything else — hours, services, pricing?', 'bot');
      return;
    }

    // Mid-booking: collecting day, then time
    if (chatState.mode === 'booking_day' || chatState.mode === 'booking_time') {
      const day = parseDay(t) || chatState.day;
      const time = parseTime(t);
      if (day && time) {
        chatState.day = day; chatState.time = time;
        chatState.mode = 'booking_phone';
        addMsg(bookingConfirmation(), 'bot');
      } else if (day && chatState.mode === 'booking_day') {
        chatState.day = day; chatState.mode = 'booking_time';
        addMsg('Got it — ' + capDay(day) + '. What time works? We\'re open 9am–6pm weekdays, 9am–2pm Saturday.', 'bot');
      } else if (time) {
        chatState.time = time;
        if (chatState.day) {
          chatState.mode = 'booking_phone';
          addMsg(bookingConfirmation(), 'bot');
        } else {
          chatState.mode = 'booking_day';
          addMsg('Okay, ' + time + ' — which day? Weekday or Saturday?', 'bot');
        }
      } else {
        addMsg('Sorry, I missed that — which day did you want? Weekday or Saturday?', 'bot');
      }
      return;
    }

    // Fresh booking intent
    if (/book|appointment|schedule|slot|set up a/.test(t)) {
      const day = parseDay(t), time = parseTime(t);
      if (day && time) {
        chatState.day = day; chatState.time = time;
        chatState.mode = 'booking_phone';
        addMsg(bookingConfirmation(), 'bot');
      } else if (day) {
        chatState.day = day; chatState.mode = 'booking_time';
        addMsg(capDay(day) + ' — what time works? We\'re open 9am–6pm weekdays, 9am–2pm Saturday.', 'bot');
      } else {
        chatState.mode = 'booking_day';
        addMsg('I can book you right now! What day works — a weekday or Saturday?', 'bot');
      }
      return;
    }

    // Hours
    if (/hour|open|close|when are you/.test(t)) {
      chatState.mode = 'hours_offer';
      addMsg("We're open Mon–Fri 9am–6pm and Sat 9am–2pm. Want me to book you in?", 'bot');
      return;
    }

    // Pricing
    if (/price|cost|much|quote/.test(t)) {
      chatState.mode = 'quote_phone';
      addMsg("Most jobs run $150–$400 depending on scope. I can have a tech call you with an exact quote — what's the best number?", 'bot');
      return;
    }

    // Services
    if (/service|offer|what do you do|repair|maintenance|emergency/.test(t)) {
      chatState.mode = 'booking_offer';
      addMsg('We handle repairs, maintenance, and emergency calls. Which one do you need — want me to book you in?', 'bot');
      return;
    }

    // Talk to a human
    if (/human|person|real|call me|talk to someone/.test(t)) {
      chatState.mode = 'quote_phone';
      addMsg("Of course — I'll have someone call you within 15 minutes during business hours. What's your number?", 'bot');
      return;
    }

    // Thanks
    if (/thank|thanks|great|awesome|perfect/.test(t)) {
      chatState.mode = 'idle';
      addMsg('Anytime! Anything else I can help with?', 'bot');
      return;
    }

    // Fallback — stays useful
    chatState.mode = 'idle';
    addMsg('I can help with hours, services, pricing, or booking an appointment. What do you need?', 'bot');
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
