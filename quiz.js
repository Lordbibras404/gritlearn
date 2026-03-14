/* ============================================================
   GRIT Learn v7 — Quiz Engine (Adaptive)
   كويز متكيّف حسب أخطاء الطالب
   FIX: global state, missing functions, wrong API calls
   Developer: @ZarVenox · Channel: @bacDz_09
   ============================================================ */

'use strict';

/* ══ Global quiz state (loaded fresh when quiz starts) ══ */
let state = loadState();

const quiz = {
  subject:  'math',
  diff:     'medium',
  mode:     'exam',    /* 'exam' | 'review' | 'adaptive' */
  questions: [],
  current:  0,
  score:    0,
  xp:       0,
  answered: false,
  wrongs:   [],
  startTime: 0,
  sessionTime: 0,
};

let _timerInterval = null;
let _timerLeft = 30;

/* ══ Helper: reload state from storage ══ */
function _quizReloadState() {
  state = loadState();
}

/* ══ Helper: stub for nav (uses showScreen from app.js) ══ */
function nav(screenId) {
  if (typeof showScreen === 'function') showScreen(screenId);
}

/* ══ Helper: setText → maps to setEl from app.js ══ */
function setText(id, val) {
  if (typeof setEl === 'function') setEl(id, val);
  else { const el = document.getElementById(id); if (el) el.textContent = val; }
}

/* ══ Helper: showXP → maps to showXpFloat from ui.js ══ */
function showXP(amount) {
  if (typeof showXpFloat === 'function') showXpFloat(amount);
}

/* ══ Helper: addXP ══ */
function addXP(amount) {
  addXpToState(state, amount);
}

/* ══ Helper: checkBadges ══ */
function checkBadges() {
  checkAndAwardBadges(state);
}

/* ══ Helper: renderBadges — no-op stub (badges shown via popup) ══ */
function renderBadges() { /* handled by checkAndAwardBadges popup */ }

/* ══ Helper: getDailyPlan — returns subjects for today based on branch ══ */
function getDailyPlan() {
  const branch   = state.branch || 'science';
  const subjects = (BRANCHES[branch]?.s || []).slice(0, 4);
  return subjects.map(key => ({
    key,
    suggestedDiff: suggestDiff(state, key),
  }));
}

/* ══ تهيئة ══ */
function initQuiz() {
  _quizReloadState();
  buildSubjectTabs();
  showQuizSection('none');
  syncQuizModeUI();
  loadQuizQuestions();
}

function buildSubjectTabs() {
  /* FIX: was BRANCHES.all.s (undefined) → fallback to science */
  const allowed = BRANCHES[state.branch]?.s || BRANCHES.science.s;
  const c = document.getElementById('quizSubjectTabs');
  if (!c) return;
  c.innerHTML = allowed.map(k => {
    const s = SUBJECTS[k];
    return `<button class="tab-btn ${k === quiz.subject ? 'active' : ''}"
      onclick="setQuizSubject('${k}',this)">${s.i} ${s.n}</button>`;
  }).join('');
}

/* ══ تغييرات الإعداد ══ */
function setQuizSubject(key, btn) {
  quiz.subject = key;
  document.querySelectorAll('#quizSubjectTabs .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  /* FIX: suggestDiff(st, subject) needs state param */
  if (quiz.mode === 'adaptive') quiz.diff = suggestDiff(state, key);
  updateAdaptiveBadge();
  loadQuizQuestions();
}

function setQuizDiff(d, btn) {
  quiz.diff = d;
  if (quiz.mode === 'adaptive') {
    quiz.mode = 'exam';
    syncQuizModeUI();
  }
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadQuizQuestions();
}

function setQuizMode(m, btn) {
  quiz.mode = m;
  if (m === 'adaptive') {
    /* FIX: suggestDiff needs state param */
    quiz.diff = suggestDiff(state, quiz.subject);
    syncDiffUI();
  }
  syncQuizModeUI();
  updateAdaptiveBadge();
  loadQuizQuestions();
}

function syncQuizModeUI() {
  ['exam','review','adaptive'].forEach(m => {
    const el = document.getElementById('mode_' + m);
    if (el) el.classList.toggle('active', quiz.mode === m);
  });
}

function syncDiffUI() {
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.diff === quiz.diff);
  });
}

function updateAdaptiveBadge() {
  const el = document.getElementById('adaptiveBadge');
  if (!el) return;
  if (quiz.mode === 'adaptive') {
    const diffN = { easy:'سهل', medium:'متوسط', hard:'صعب' }[quiz.diff];
    el.style.display = 'inline-flex';
    el.textContent   = `🧠 ذكي — ${diffN} موصى`;
  } else {
    el.style.display = 'none';
  }
}

/* ══ تحميل الأسئلة ══ */
function loadQuizQuestions() {
  stopTimer();
  _quizReloadState();
  const pool = QUESTIONS[quiz.subject]?.[quiz.diff] || [];

  /* خلط ذكي: نعطي أولوية للأسئلة الموجودة في قائمة الأخطاء */
  const wrongIds = (state.wrong || [])
    .filter(w => w.subj === SUBJECTS[quiz.subject]?.n)
    .map(w => w.q);

  const prioritized = pool.filter(q => wrongIds.includes(q.q));
  const rest        = pool.filter(q => !wrongIds.includes(q.q));
  const shuffled    = [
    ...prioritized.sort(() => Math.random() - 0.5),
    ...rest.sort(() => Math.random() - 0.5),
  ].slice(0, 5);

  quiz.questions   = shuffled;
  quiz.current     = 0;
  quiz.score       = 0;
  quiz.xp          = 0;
  quiz.answered    = false;
  quiz.wrongs      = [];
  quiz.startTime   = Date.now();
  quiz.sessionTime = 0;

  if (quiz.mode === 'review') {
    showQuizSection('review');
    renderReviewMode();
  } else {
    showQuizSection('exam');
    renderQuestion();
  }
}

/* ══ إظهار قسم ══ */
function showQuizSection(which) {
  ['exam','review','score'].forEach(s => {
    const el = document.getElementById('quizSec_' + s);
    if (el) el.style.display = s === which ? 'block' : 'none';
  });
  const tr = document.getElementById('timerRow');
  if (tr) tr.style.display = which === 'exam' ? 'flex' : 'none';
}

/* ══ رسم السؤال ══ */
function renderQuestion() {
  if (quiz.current >= quiz.questions.length) { showScore(); return; }

  const q = quiz.questions[quiz.current];
  quiz.answered = false;

  /* header */
  setText('qCounter', `${quiz.current + 1}/${quiz.questions.length}`);
  setText('qXP', quiz.xp);
  const pf = document.getElementById('quizProgressFill');
  if (pf) pf.style.width = ((quiz.current + 1) / quiz.questions.length * 100) + '%';

  /* تاغات */
  const subj = SUBJECTS[quiz.subject];
  const diffColors = { easy: '#059669', medium: '#d97706', hard: '#dc2626' };
  const diffNames  = { easy: 'سهل',    medium: 'متوسط',  hard: 'صعب' };

  const ts = document.getElementById('qTagSubj');
  const td = document.getElementById('qTagDiff');
  if (ts) { ts.textContent = subj.i + ' ' + subj.n; ts.style.cssText = `background:${subj.c}1a;border:1px solid ${subj.c}33;color:${subj.c}`; }
  if (td) { td.textContent = diffNames[quiz.diff]; td.style.cssText = `background:${diffColors[quiz.diff]}1a;border:1px solid ${diffColors[quiz.diff]}33;color:${diffColors[quiz.diff]}`; }

  /* نص السؤال */
  setText('questionText', q.q);

  /* خيارات */
  const letters = ['أ','ب','ج','د'];
  const ol = document.getElementById('optionsList');
  if (ol) {
    ol.innerHTML = q.o.map((opt, i) => `
      <button class="option-btn" onclick="pickAnswer(${i})" style="animation-delay:${i*50}ms">
        <div class="option-letter">${letters[i]}</div>
        <span>${opt}</span>
      </button>`).join('');
  }

  /* إخفاء */
  const fb = document.getElementById('feedbackCard');
  const nb = document.getElementById('nextBtn');
  if (fb) fb.style.display = 'none';
  if (nb) nb.style.display = 'none';

  startTimer();
}

/* ══ اختيار إجابة ══ */
function pickAnswer(idx) {
  if (quiz.answered) return;
  stopTimer();
  quiz.answered = true;

  const q = quiz.questions[quiz.current];
  const correct = idx === q.a;

  /* تلوين الخيارات */
  const btns = document.querySelectorAll('#optionsList .option-btn');
  btns.forEach((btn, i) => {
    btn.disabled = true;
    btn.style.pointerEvents = 'none';
    if (i === q.a)             btn.classList.add('correct');
    if (i === idx && !correct) btn.classList.add('wrong');
  });

  if (correct) {
    const xpGain = { easy: 5, medium: 10, hard: 20 }[quiz.diff] || 10;
    quiz.score++;
    quiz.xp    += xpGain;
    state.ok = (state.ok || 0) + 1;
    if (!state.subjectStats[quiz.subject]) state.subjectStats[quiz.subject] = { ok:0, wrong:0, sessions:0 };
    state.subjectStats[quiz.subject].ok++;
    /* FIX: was addXP(xpGain) — now uses correct function with state param */
    addXP(xpGain);
    /* FIX: updateAdaptiveWeight needs state as first param */
    updateAdaptiveWeight(state, quiz.subject, quiz.diff, true);
    showFeedback('correct', '🎉', 'إجابة صحيحة!', q.e);
  } else {
    quiz.wrongs.push({ q: q.q, a: q.o[q.a], subj: SUBJECTS[quiz.subject]?.n, subjectKey: quiz.subject, diff: quiz.diff });
    if (!state.subjectStats[quiz.subject]) state.subjectStats[quiz.subject] = { ok:0, wrong:0, sessions:0 };
    state.subjectStats[quiz.subject].wrong++;
    /* FIX: updateAdaptiveWeight needs state as first param */
    updateAdaptiveWeight(state, quiz.subject, quiz.diff, false);
    showFeedback('wrong', '💡', 'إجابة خاطئة', q.e);
  }

  setText('qXP', quiz.xp);
  const nb = document.getElementById('nextBtn');
  if (nb) nb.style.display = 'block';
  /* FIX: saveState() needs state param */
  saveState(state);
}

/* ══ انتهاء الوقت ══ */
function timeOut() {
  if (quiz.answered) return;
  quiz.answered = true;
  stopTimer();

  const q = quiz.questions[quiz.current];
  document.querySelectorAll('#optionsList .option-btn').forEach((btn, i) => {
    btn.disabled = true;
    btn.style.pointerEvents = 'none';
    if (i === q.a) btn.classList.add('correct');
  });

  quiz.wrongs.push({ q: q.q, a: q.o[q.a], subj: SUBJECTS[quiz.subject]?.n, subjectKey: quiz.subject, diff: quiz.diff });
  if (!state.subjectStats[quiz.subject]) state.subjectStats[quiz.subject] = { ok:0, wrong:0, sessions:0 };
  state.subjectStats[quiz.subject].wrong++;
  /* FIX: updateAdaptiveWeight needs state as first param */
  updateAdaptiveWeight(state, quiz.subject, quiz.diff, false);
  showFeedback('timeout', '⏰', 'انتهى الوقت!', q.e);
  const nb = document.getElementById('nextBtn');
  if (nb) nb.style.display = 'block';
}

/* ══ التغذية الراجعة ══ */
function showFeedback(cls, icon, title, expl) {
  const el = document.getElementById('feedbackCard');
  if (!el) return;
  el.className = 'feedback-card ' + cls;
  el.innerHTML = `
    <div class="feedback-icon">${icon}</div>
    <div class="feedback-text"><h4>${title}</h4><p>${expl}</p></div>`;
  el.style.display = 'flex';
}

/* ══ السؤال التالي ══ */
function nextQuestion() {
  quiz.current++;
  renderQuestion();
}

/* ══ النتيجة النهائية ══ */
function showScore() {
  stopTimer();
  showQuizSection('score');

  quiz.sessionTime = Math.round((Date.now() - quiz.startTime) / 1000);

  const total = quiz.questions.length;
  /* FIX: guard division by zero */
  const pct = total > 0 ? Math.round(quiz.score / total * 100) : 0;

  /* تحديث الإحصائيات */
  if (pct === 100) state.perfectCount = (state.perfectCount || 0) + 1;
  state.ses = (state.ses || 0) + 1;
  if (!state.subjectStats[quiz.subject]) state.subjectStats[quiz.subject] = { ok:0, wrong:0, sessions:0 };
  state.subjectStats[quiz.subject].sessions++;
  state.subjectStats[quiz.subject].totalTime =
    (state.subjectStats[quiz.subject].totalTime || 0) + quiz.sessionTime;
  state.mastery[quiz.subject] = Math.min(100,
    (state.mastery[quiz.subject] || 0) + Math.round(pct / 10));

  /* FIX: dailyLog was missing from DEFAULT_STATE — guard with fallback */
  const today = getTodayStr();
  if (!state.dailyLog) state.dailyLog = {};
  if (!state.dailyLog[today]) state.dailyLog[today] = { xp: 0, sessions: 0, ok: 0 };
  state.dailyLog[today].sessions++;
  state.dailyLog[today].ok += quiz.score;

  /* حفظ الأخطاء */
  if (quiz.wrongs.length) {
    if (!state.wrong) state.wrong = [];
    state.wrong = [...quiz.wrongs, ...state.wrong].slice(0, 30);
  }

  /* FIX: saveState needs param */
  saveState(state);
  /* FIX: checkBadges/renderBadges now use correct functions */
  checkBadges();
  renderBadges();

  /* 🎉 Confetti on perfect score */
  if (pct === 100 && typeof launchConfetti === 'function') {
    setTimeout(() => launchConfetti(60), 400);
  }

  /* UI */
  let emoji, title;
  if (pct === 100)    { emoji = '🏆'; title = 'مثالي! أنت بطل حقيقي!'; }
  else if (pct >= 80) { emoji = '🌟'; title = 'ممتاز! أداء رائع!'; }
  else if (pct >= 60) { emoji = '✅'; title = 'جيد! استمر في التحسن'; }
  else                { emoji = '💪'; title = 'تحتاج مزيداً من المراجعة'; }

  setText('scoreEmoji', emoji);
  const ring = document.getElementById('scoreRing');
  if (ring) ring.style.setProperty('--pct', pct + '%');
  setText('scoreNum',   pct + '%');
  setText('scoreTitle', title);
  setText('scoreSub',   `${quiz.score} من ${total} إجابة صحيحة`);
  setText('scoreOk',    quiz.score);
  setText('scoreWrong', total - quiz.score);
  setText('scoreXP',    quiz.xp);

  /* اقتراح ذكي */
  const tip = document.getElementById('scoreTip');
  if (tip) {
    /* FIX: getStrengthsWeaknesses needs state param; returns {strengths,weaknesses} not {tip} */
    const sw = getStrengthsWeaknesses(state);
    const weakest = sw.weaknesses[0];
    const tipText = weakest ? `💡 ركز على ${weakest.subj?.n} — دقتك ${weakest.rate}% فقط` : null;
    tip.style.display = tipText ? 'block' : 'none';
    if (tipText) tip.textContent = tipText;
  }

  /* الأخطاء */
  const ws = document.getElementById('scoreWrongSection');
  if (quiz.wrongs.length && ws) {
    ws.style.display = 'block';
    const wl = document.getElementById('scoreWrongList');
    if (wl) wl.innerHTML = quiz.wrongs.map(w => `
      <div class="wrong-item">
        <div class="wrong-q">❓ ${w.q}</div>
        <div class="wrong-a">✅ ${w.a}${w.subj ? ' — ' + w.subj : ''}</div>
      </div>`).join('');
  }

  if (quiz.xp > 0) showXP(quiz.xp);
}

/* ══ وضع المراجعة ══ */
function renderReviewMode() {
  const c = document.getElementById('reviewList');
  if (!c) return;
  c.innerHTML = quiz.questions.map((q, i) => `
    <div class="review-card" onclick="this.classList.toggle('open')">
      <div class="review-card-header">
        <span class="review-num">${i + 1}</span>
        <div class="review-q-text">${q.q}</div>
      </div>
      <div class="review-answer">✅ ${q.o[q.a]}<br>
        <small class="review-explain">${q.e}</small>
      </div>
      <div class="review-hint">👆 اضغط لإظهار الجواب</div>
    </div>`).join('');
}

/* ══ إعادة الاختبار ══ */
function restartQuiz() { loadQuizQuestions(); }

/* ══ عرض الأخطاء ══ */
function goToWrongAnswers() {
  nav('quizScreen');
  showQuizSection('score');
  const mc = document.getElementById('scoreCard_main');
  if (mc) mc.style.display = 'none';
  const ws = document.getElementById('scoreWrongSection');
  if (ws) ws.style.display = 'block';
  const wl = document.getElementById('scoreWrongList');
  if (!wl) return;
  const wrongs = state.wrong || [];
  if (!wrongs.length) {
    wl.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">🎉</div>
      <h4>لا توجد أخطاء!</h4>
      <p>أحسنت، استمر في هذا المستوى</p>
    </div>`;
  } else {
    wl.innerHTML = wrongs.map(w => `
      <div class="wrong-item">
        <div class="wrong-q">❓ ${w.q}</div>
        <div class="wrong-a">✅ ${w.a}${w.subj ? ' — ' + w.subj : ''}</div>
      </div>`).join('');
  }
}

/* ══ بدء اختبار اليوم ══ */
function startTodayQuiz() {
  const plan = getDailyPlan();
  if (plan.length) {
    quiz.subject = plan[0].key;
    quiz.diff    = plan[0].suggestedDiff;
    quiz.mode    = 'adaptive';
  } else {
    quiz.mode    = 'exam';
  }
  nav('quizScreen');
  initQuiz();
}

function goToReviewMode() {
  quiz.mode = 'review';
  nav('quizScreen');
  initQuiz();
}

function goToAdaptiveQuiz() {
  quiz.mode = 'adaptive';
  /* FIX: suggestDiff needs state param */
  quiz.diff = suggestDiff(state, quiz.subject);
  nav('quizScreen');
  initQuiz();
}

/* ══ المؤقت ══ */
function startTimer() {
  stopTimer();
  const timerSec = state.timerSec || (25 * 60);
  if (timerSec === 0) {
    const tr = document.getElementById('timerRow');
    if (tr) tr.style.display = 'none';
    return;
  }
  const tr = document.getElementById('timerRow');
  if (tr) tr.style.display = 'flex';
  _timerLeft = timerSec;
  updateTimerUI();
  _timerInterval = setInterval(() => {
    _timerLeft--;
    updateTimerUI();
    if (_timerLeft <= 0) timeOut();
  }, 1000);
}

function stopTimer() {
  clearInterval(_timerInterval);
  _timerInterval = null;
}

function updateTimerUI() {
  const fill = document.getElementById('timerBarFill');
  const num  = document.getElementById('timerNum');
  if (!fill || !num) return;
  const timerSec = state.timerSec || (25 * 60);
  const pct = timerSec > 0 ? (_timerLeft / timerSec) * 100 : 0;
  fill.style.width = pct + '%';
  const isDanger = _timerLeft <= 10;
  const isWarn   = _timerLeft <= timerSec * 0.4;
  fill.className = 'timer-bar-fill' + (isDanger ? ' danger' : isWarn ? ' warn' : '');
  num.className  = 'timer-num' + (isDanger ? ' danger' : '');
  num.textContent = _timerLeft;
}
