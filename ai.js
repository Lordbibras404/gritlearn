/* ============================================================
   GRIT Learn v7 — AI Assistant
   Gemini 1.5 Flash · Rate Limiting · Caching · Daily Quota
   Developer: @ZarVenox · Channel: @bacDz_09
   ============================================================ */
'use strict';

/* ══ Config ══ */
const AI_CONFIG = {
  API_KEY:      'AIzaSyD14v-w5Um-3p7LAcB46-MPs_WNocDVlwc',
  API_URL:      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  DAILY_LIMIT:  10,          // messages per day (free tier)
  CACHE_TTL:    3600000,     // 1 hour cache per prompt
  MIN_INTERVAL: 2000,        // min ms between requests
  MAX_TOKENS:   1024,
  TEMPERATURE:  0.7,
  STORAGE_KEY:  'grit_ai_v7',
};

/* ══ System Prompt ══ */
const AI_SYSTEM = `أنت مساعد ذكي متخصص في تحضير طلاب البكالوريا الجزائرية 2026.
مهمتك: شرح الدروس، حل التمارين، وتقديم نصائح دراسية.

قواعد صارمة:
- أجب دائماً بالعربية الفصحى البسيطة
- اجعل شروحاتك مختصرة وواضحة (لا تتجاوز 200 كلمة)
- استخدم الأمثلة العملية من المنهج الجزائري
- إذا كان السؤال غير دراسي، أعد توجيه المحادثة للمنهج
- استخدم الرموز التعبيرية باعتدال لجعل الشرح ممتعاً
- قدّم النقاط المهمة في قائمة مرقّمة عند الحاجة
- إذا طُلب منك حل رياضي، اشرح الخطوات خطوة بخطوة

المواد: رياضيات، فيزياء، كيمياء، علوم طبيعية، عربية، تاريخ، جغرافيا، فلسفة، إنجليزية، فرنسية، اقتصاد، أمازيغية.`;

/* ══ State ══ */
const aiState = {
  msgs:         [],          // conversation history [{role, text, time}]
  cache:        {},          // prompt -> {response, ts}
  lastRequestTs: 0,
  isTyping:     false,
  currentQuota: null,        // loaded lazily
};

/* ════════════════════════════════════════════════════════
   QUOTA MANAGEMENT
════════════════════════════════════════════════════════ */

function aiGetQuota() {
  const today = new Date().toLocaleDateString('en-CA');  // YYYY-MM-DD in Algiers
  let raw;
  try { raw = JSON.parse(localStorage.getItem(AI_CONFIG.STORAGE_KEY) || '{}'); }
  catch { raw = {}; }

  if (raw.date !== today) {
    // new day → reset
    raw = { date: today, used: 0, cache: raw.cache || {} };
    aiSaveQuota(raw);
  }
  return raw;
}

function aiSaveQuota(data) {
  try { localStorage.setItem(AI_CONFIG.STORAGE_KEY, JSON.stringify(data)); }
  catch { /* storage full */ }
}

function aiGetRemaining() {
  const q = aiGetQuota();
  return Math.max(0, AI_CONFIG.DAILY_LIMIT - (q.used || 0));
}

function aiIncrementUsage() {
  const q = aiGetQuota();
  q.used = (q.used || 0) + 1;
  aiSaveQuota(q);
  aiUpdateQuotaUI(aiGetRemaining());
}

function aiUpdateQuotaUI(remaining) {
  const chip  = document.getElementById('aiQuotaChip');
  const left  = document.getElementById('aiQuotaLeft');
  const num   = document.getElementById('aiQuotaNum');
  const fill  = document.getElementById('aiQuotaFill');
  const reset = document.getElementById('aiQuotaReset');

  if (left)  left.textContent  = `${remaining} رسالة`;
  if (num)   num.textContent   = remaining;
  if (fill)  fill.style.width  = `${(remaining / AI_CONFIG.DAILY_LIMIT) * 100}%`;
  if (reset) reset.textContent = 'تجدد كل يوم عند منتصف الليل';
  if (chip) {
    chip.style.background = remaining <= 2
      ? 'rgba(239,68,68,0.12)' : 'var(--overlay-medium)';
  }
}

/* ════════════════════════════════════════════════════════
   CACHE
════════════════════════════════════════════════════════ */

function aiCacheKey(prompt) {
  // simple hash
  let h = 0;
  for (let i = 0; i < prompt.length; i++) {
    h = ((h << 5) - h) + prompt.charCodeAt(i);
    h |= 0;
  }
  return `c${h}`;
}

function aiGetCached(prompt) {
  const q   = aiGetQuota();
  const key = aiCacheKey(prompt);
  const hit = (q.cache || {})[key];
  if (!hit) return null;
  if (Date.now() - hit.ts > AI_CONFIG.CACHE_TTL) return null;
  return hit.text;
}

function aiSetCache(prompt, text) {
  const q   = aiGetQuota();
  const key = aiCacheKey(prompt);
  if (!q.cache) q.cache = {};

  // prune if > 40 entries
  const keys = Object.keys(q.cache);
  if (keys.length > 40) {
    const oldest = keys.sort((a, b) => q.cache[a].ts - q.cache[b].ts)[0];
    delete q.cache[oldest];
  }

  q.cache[key] = { text, ts: Date.now() };
  aiSaveQuota(q);
}

/* ════════════════════════════════════════════════════════
   CORE API CALL
════════════════════════════════════════════════════════ */

async function aiCallGemini(userPrompt) {
  // rate limit
  const now = Date.now();
  const gap = now - aiState.lastRequestTs;
  if (gap < AI_CONFIG.MIN_INTERVAL) {
    await new Promise(r => setTimeout(r, AI_CONFIG.MIN_INTERVAL - gap));
  }
  aiState.lastRequestTs = Date.now();

  // build contents array (last 6 turns for context window efficiency)
  const history = aiState.msgs.slice(-6).map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }]
  }));

  // append current message
  history.push({ role: 'user', parts: [{ text: userPrompt }] });

  const body = {
    system_instruction: { parts: [{ text: AI_SYSTEM }] },
    contents: history,
    generationConfig: {
      temperature:     AI_CONFIG.TEMPERATURE,
      maxOutputTokens: AI_CONFIG.MAX_TOKENS,
      topP: 0.9,
      topK: 40,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };

  const res = await fetch(`${AI_CONFIG.API_URL}?key=${AI_CONFIG.API_KEY}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const code = err?.error?.code || res.status;
    if (code === 429) throw new Error('QUOTA_EXCEEDED');
    if (code === 400) throw new Error('BAD_REQUEST');
    throw new Error(`API_ERROR_${code}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('EMPTY_RESPONSE');
  return text.trim();
}

/* ════════════════════════════════════════════════════════
   SEND MESSAGE (main entry)
════════════════════════════════════════════════════════ */

async function sendAiMsg() {
  const input = document.getElementById('aiTextInput');
  const sendBtn = document.getElementById('aiSendBtn');
  if (!input) return;

  const prompt = input.value.trim();
  if (!prompt || aiState.isTyping) return;

  // quota check
  if (aiGetRemaining() <= 0) {
    showToast('انتهت رسائلك اليوم ⛔ تجدد غداً', 'error');
    return;
  }

  // clear input
  input.value = '';
  input.disabled = true;
  if (sendBtn) sendBtn.disabled = true;

  // show chat if hidden
  aiShowChat();

  // add user bubble
  aiAddMsg('user', prompt);

  // check cache first (doesn't consume quota)
  const cached = aiGetCached(prompt);
  if (cached) {
    aiAddMsg('bot', cached, true);
    input.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    input.focus();
    return;
  }

  // show typing
  aiShowTyping();
  aiState.isTyping = true;

  try {
    const reply = await aiCallGemini(prompt);
    aiHideTyping();
    aiAddMsg('bot', reply);
    aiSetCache(prompt, reply);
    aiIncrementUsage();

    // save to history
    aiState.msgs.push({ role: 'user', text: prompt,  time: Date.now() });
    aiState.msgs.push({ role: 'bot',  text: reply,   time: Date.now() });

    // keep history lean
    if (aiState.msgs.length > 20) aiState.msgs = aiState.msgs.slice(-20);

  } catch (err) {
    aiHideTyping();
    let errMsg = '❌ حدث خطأ، حاول مجدداً';
    if (err.message === 'QUOTA_EXCEEDED')   errMsg = '⛔ تجاوزت الحد اليومي للـ API';
    if (err.message === 'BAD_REQUEST')      errMsg = '⚠️ الطلب غير صالح';
    if (err.message === 'EMPTY_RESPONSE')   errMsg = '🤔 لم أحصل على رد، حاول مجدداً';
    aiAddMsg('bot', errMsg);
    console.error('[AI]', err.message);
  } finally {
    aiState.isTyping = false;
    input.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    input.focus();
  }
}

/* ════════════════════════════════════════════════════════
   QUICK PROMPT
════════════════════════════════════════════════════════ */

function aiQuickPrompt(text) {
  const input = document.getElementById('aiTextInput');
  if (!input) return;
  input.value = text;
  sendAiMsg();
}

/* ════════════════════════════════════════════════════════
   UI HELPERS
════════════════════════════════════════════════════════ */

function aiShowChat() {
  const emptyView = document.getElementById('aiEmptyView');
  const chatView  = document.getElementById('aiChatView');
  if (emptyView) emptyView.style.display = 'none';
  if (chatView)  { chatView.style.display = 'flex'; }
}

function aiAddMsg(role, text, fromCache = false) {
  const msgs = document.getElementById('aiMsgs');
  if (!msgs) return;

  const wrap = document.createElement('div');
  wrap.className = `ai-msg ${role}`;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });

  // Format text: convert **bold** and line breaks
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

  wrap.innerHTML = `
    <div class="ai-msg-bubble">${formatted}</div>
    <div class="ai-msg-time">${timeStr}${fromCache ? ' · من الذاكرة' : ''}</div>
  `;

  msgs.appendChild(wrap);

  // scroll to bottom
  requestAnimationFrame(() => {
    msgs.scrollTop = msgs.scrollHeight;
  });
}

function aiShowTyping() {
  const msgs = document.getElementById('aiMsgs');
  if (!msgs) return;

  const el = document.createElement('div');
  el.id = 'aiTypingBubble';
  el.className = 'ai-typing-bubble';
  el.innerHTML = `
    <div class="ai-typing-dot"></div>
    <div class="ai-typing-dot"></div>
    <div class="ai-typing-dot"></div>
  `;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;

  // status text
  const sub = document.getElementById('aiStatusText');
  if (sub) sub.textContent = 'يكتب...';
}

function aiHideTyping() {
  const el = document.getElementById('aiTypingBubble');
  if (el) el.remove();

  const sub = document.getElementById('aiStatusText');
  if (sub) sub.textContent = 'متاح الآن';
}

function clearAiChat() {
  const msgs = document.getElementById('aiMsgs');
  if (msgs) msgs.innerHTML = '';
  aiState.msgs = [];

  const emptyView = document.getElementById('aiEmptyView');
  const chatView  = document.getElementById('aiChatView');
  if (emptyView) emptyView.style.display = 'flex';
  if (chatView)  chatView.style.display = 'none';
}

/* ════════════════════════════════════════════════════════
   EXPLAIN SUMMARY (called from summaries reader)
════════════════════════════════════════════════════════ */

function aiExplainSumm() {
  const title = document.getElementById('summReaderBigTitle');
  if (!title) return;
  const text = title.textContent.trim();
  if (!text) return;

  showScreen('aiScreen');
  setTimeout(() => {
    aiQuickPrompt(`اشرح لي بالتفصيل: ${text}`);
  }, 400);
}

/* ════════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════════ */

function initAI() {
  aiUpdateQuotaUI(aiGetRemaining());

  // Enter key on input
  const input = document.getElementById('aiTextInput');
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendAiMsg();
      }
    });
  }

  // Status dot pulse
  const dot = document.getElementById('aiStatusDot');
  if (dot) dot.style.animation = 'pulse 2s ease-in-out infinite';
}

// Auto-init when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAI);
} else {
  initAI();
}
