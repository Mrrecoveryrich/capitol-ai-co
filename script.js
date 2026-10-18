// FAQ accordion
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

// Demo chatbot — scripted responses
const chatBody = document.getElementById('chatBody');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');

function addMsg(text, who) {
  const div = document.createElement('div');
  div.className = 'msg ' + who;
  div.textContent = text;
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function botReply(q) {
  const t = q.toLowerCase();
  addMsg('…', 'bot');
  setTimeout(() => {
    chatBody.lastChild.remove();
    if (/hour|open|close|when/.test(t)) {
      addMsg("We're open Mon–Fri 9am–6pm and Sat 9am–2pm. Want me to book you in?", 'bot');
    } else if (/price|cost|much|quote/.test(t)) {
      addMsg("Most jobs run $150–$400 depending on scope. I can have a tech call you with an exact quote — what's the best number?", 'bot');
    } else if (/book|appointment|schedule|slot/.test(t)) {
      addMsg("I can book you right now! What day works best — weekday or weekend?", 'bot');
    } else if (/service|offer|do you do/.test(t)) {
      addMsg("We handle repairs, maintenance, and emergency calls. Which one do you need help with?", 'bot');
    } else if (/human|person|real|call me|phone/.test(t)) {
      addMsg("Of course — I'll have someone call you within 15 minutes during business hours. What's your number?", 'bot');
    } else if (/thank|thanks|great|awesome|perfect/.test(t)) {
      addMsg("Anytime! Anything else I can help with?", 'bot');
    } else {
      addMsg("Good question — I can help with hours, services, pricing, or booking. What do you need?", 'bot');
    }
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
