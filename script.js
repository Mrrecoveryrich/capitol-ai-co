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

function fmtDay(d) {
  if (!d) return 'your day';
  return /^(today|tomorrow|a weekday)$/.test(d) ? d : capDay(d);
}

function fmtTime(tm) {
  if (!tm) return 'your time';
  return /^the /.test(tm) ? 'in ' + tm : 'at ' + tm;
}

function shortTime(tm) { return (tm || '').replace(/^the /, ''); }

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
  return 'You\'re booked for ' + fmtDay(chatState.day) + ' ' + fmtTime(chatState.time) +
    '. What\'s the best number to send the confirmation to?';
}

function finishBooking(phone) {
  const s = 'All set — you\'re booked for ' + fmtDay(chatState.day) + ' ' + fmtTime(chatState.time) +
    '. Confirmation is on its way to ' + phone + '. Anything else I can help with?';
  chatState.mode = 'idle';
  chatState.day = null;
  chatState.time = null;
  return s;
}

function sundayClosed() {
  chatState.mode = 'booking_day';
  chatState.day = null;
  addMsg("We're closed on Sundays — want Saturday or a weekday instead?", 'bot');
}

function resumeBookingQ() {
  if (chatState.mode === 'booking_time' && chatState.day)
    return ' Still booking — what time on ' + fmtDay(chatState.day) + '?';
  return ' Still want to book? What day works — a weekday or Saturday?';
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
      if (day === 'Sunday') { sundayClosed(); return; }
      if (day && time) {
        chatState.day = day; chatState.time = time;
        chatState.mode = 'booking_phone';
        addMsg(bookingConfirmation(), 'bot');
      } else if (day) {
        chatState.day = day; chatState.mode = 'booking_time';
        addMsg('Great — ' + fmtDay(day) + '. What time works? We\'re open 9am–6pm weekdays, 9am–2pm Saturday.', 'bot');
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
      // They changed the subject mid-booking — answer it, then resume
      if (/price|cost|much|quote/.test(t)) {
        addMsg('Most jobs run $150–$400 depending on scope.' + resumeBookingQ(), 'bot');
        return;
      }
      if (/hour|open|close/.test(t)) {
        addMsg('We\'re open Mon–Fri 9am–6pm and Sat 9am–2pm.' + resumeBookingQ(), 'bot');
        return;
      }
      if (/human|person|real|call me|talk to someone/.test(t)) {
        chatState.mode = 'quote_phone';
        addMsg('Of course — I\'ll have someone call you within 15 minutes during business hours. What\'s your number?', 'bot');
        return;
      }
      const day = parseDay(t) || chatState.day;
      const time = parseTime(t);
      if (day === 'Sunday' && !chatState.day) { sundayClosed(); return; }
      if (day && time) {
        chatState.day = day; chatState.time = time;
        chatState.mode = 'booking_phone';
        addMsg(bookingConfirmation(), 'bot');
      } else if (day && chatState.mode === 'booking_day') {
        chatState.day = day; chatState.mode = 'booking_time';
        addMsg('Got it — ' + fmtDay(day) + '. What time works? We\'re open 9am–6pm weekdays, 9am–2pm Saturday.', 'bot');
      } else if (time) {
        chatState.time = time;
        if (chatState.day) {
          chatState.mode = 'booking_phone';
          addMsg(bookingConfirmation(), 'bot');
        } else {
          chatState.mode = 'booking_day';
          addMsg('Okay, ' + shortTime(time) + ' — which day? Weekday or Saturday?', 'bot');
        }
      } else {
        addMsg('Sorry, I missed that — which day did you want? Weekday or Saturday?', 'bot');
      }
      return;
    }

    // Fresh booking intent
    if (/book|appointment|schedule|slot|set up a/.test(t)) {
      const day = parseDay(t), time = parseTime(t);
      if (day === 'Sunday') { sundayClosed(); return; }
      if (day && time) {
        chatState.day = day; chatState.time = time;
        chatState.mode = 'booking_phone';
        addMsg(bookingConfirmation(), 'bot');
      } else if (day) {
        chatState.day = day; chatState.mode = 'booking_time';
        addMsg(fmtDay(day) + ' — what time works? We\'re open 9am–6pm weekdays, 9am–2pm Saturday.', 'bot');
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

    // User picked one of the offered services — acknowledge and move to booking
    if (chatState.mode === 'booking_offer' && /repair|maintenance|emergency/.test(t)) {
      const svc = /emergency/.test(t) ? 'an emergency call'
        : /maintenance/.test(t) ? 'maintenance' : 'repairs';
      chatState.mode = 'booking_day';
      addMsg('Got it — ' + svc + '. I can book you right now! What day works — a weekday or Saturday?', 'bot');
      return;
    }

    // Emergency as a first message gets the urgent path, not the services list
    if (chatState.mode === 'idle' && /emergency/.test(t)) {
      chatState.mode = 'quote_phone';
      addMsg('For emergencies we jump the line with same-day service. What\'s the best number — I\'ll have someone call you right now?', 'bot');
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

    // A bare "yes" with no context — invite them in instead of falling flat
    if (chatState.mode === 'idle' && isYes && !isNo) {
      addMsg('Great — what can I do for you? I can share hours, services, pricing, or book an appointment.', 'bot');
      return;
    }

    // Day or time out of nowhere = they want to book
    const coldDay = parseDay(t), coldTime = parseTime(t);
    if (chatState.mode === 'idle' && (coldDay || coldTime)) {
      if (coldDay === 'Sunday') { sundayClosed(); return; }
      if (coldDay && coldTime) {
        chatState.day = coldDay; chatState.time = coldTime;
        chatState.mode = 'booking_phone';
        addMsg(bookingConfirmation(), 'bot');
      } else if (coldDay) {
        chatState.day = coldDay; chatState.mode = 'booking_time';
        addMsg(fmtDay(coldDay) + ' — what time works? We\'re open 9am–6pm weekdays, 9am–2pm Saturday.', 'bot');
      } else {
        chatState.time = coldTime; chatState.mode = 'booking_day';
        addMsg('Okay, ' + shortTime(coldTime) + ' — which day? Weekday or Saturday?', 'bot');
      }
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
