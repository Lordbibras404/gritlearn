/* ============================================================
   GRIT Learn v7 — Exam Mode
   Developer: @ZarVenox · Channel: @bacDz_09
   ============================================================ */
'use strict';

/* ══ Exam State ══ */
const examState = {
  questions:    [],
  answers:      {},   // idx → chosen option index
  flagged:      {},   // idx → bool
  current:      0,
  subj:         'math',
  duration:     30,   // minutes (0 = unlimited)
  timerEl:      null,
  startTime:    null,
  elapsed:      0,
  running:      false,
  finished:     false,
};

/* ════════════════════════════════════════════════════════
   SETUP INTERACTIONS
════════════════════════════════════════════════════════ */

document.addEventListener('click', e => {
  /* Subject tab */
  const subjBtn = e.target.closest('#examSubjectTabs .diff-btn');
  if (subjBtn) {
    document.querySelectorAll('#examSubjectTabs .diff-btn').forEach(b => b.classList.remove('active'));
    subjBtn.classList.add('active');
    examState.subj = subjBtn.dataset.subj || 'math';
  }

  /* Duration selector */
  const durBtn = e.target.closest('.exam-year-btn[data-dur]');
  if (durBtn) {
    durBtn.closest('.exam-year-grid').querySelectorAll('.exam-year-btn').forEach(b => b.classList.remove('active'));
    durBtn.classList.add('active');
    examState.duration = parseInt(durBtn.dataset.dur) || 0;
  }

  /* Question count selector */
  const qcBtn = e.target.closest('.exam-year-btn[data-qcount]');
  if (qcBtn) {
    qcBtn.closest('.exam-year-grid').querySelectorAll('.exam-year-btn').forEach(b => b.classList.remove('active'));
    qcBtn.classList.add('active');
  }
});

/* ════════════════════════════════════════════════════════
   START EXAM
════════════════════════════════════════════════════════ */

function startExam() {
  /* Read config */
  const subjBtn  = document.querySelector('#examSubjectTabs .diff-btn.active');
  const qcBtn    = document.querySelector('.exam-year-btn[data-qcount].active');
  const durBtn   = document.querySelector('.exam-year-btn[data-dur].active');

  examState.subj     = subjBtn?.dataset.subj  || 'math';
  examState.duration = parseInt(durBtn?.dataset.dur || '30');
  const qCount       = parseInt(qcBtn?.dataset.qcount || '10');

  /* Get questions */
  let pool = getQuestions(examState.subj, 'mixed', qCount === 0 ? 999 : qCount);
  if (pool.length === 0) {
    showToast('لا توجد أسئلة لهذه المادة بعد 📚', 'warning');
    return;
  }

  /* Reset state */
  examState.questions = pool;
  examState.answers   = {};
  examState.flagged   = {};
  examState.current   = 0;
  examState.startTime = Date.now();
  examState.elapsed   = 0;
  examState.running   = true;
  examState.finished  = false;

  /* Show active view */
  _showExamView('active');
  _renderExamHeader();
  _renderQStrip();
  _renderQuestion(0);
  _startTimer();
}

function showExamSetup() {
  _stopTimer();
  _showExamView('setup');
}

function _showExamView(view) {
  document.getElementById('examSetupView').style.display  = view === 'setup'  ? 'block' : 'none';
  document.getElementById('examActiveView').style.display = view === 'active' ? 'flex'  : 'none';
  document.getElementById('examResultView').style.display = view === 'result' ? 'block' : 'none';
}

/* ════════════════════════════════════════════════════════
   TIMER
════════════════════════════════════════════════════════ */

function _startTimer() {
  _stopTimer();
  if (examState.duration === 0) {
    setEl('examTimerBadge', '⏱ بدون وقت');
    return;
  }
  examState.timerEl = setInterval(_tickTimer, 1000);
}

function _stopTimer() {
  if (examState.timerEl) { clearInterval(examState.timerEl); examState.timerEl = null; }
}

function _tickTimer() {
  if (!examState.running) return;
  examState.elapsed = Math.floor((Date.now() - examState.startTime) / 1000);
  const total  = examState.duration * 60;
  const remain = Math.max(0, total - examState.elapsed);
  const mm     = String(Math.floor(remain / 60)).padStart(2, '0');
  const ss     = String(remain % 60).padStart(2, '0');

  const badge = document.getElementById('examTimerBadge');
  if (badge) {
    badge.textContent = `⏱ ${mm}:${ss}`;
    badge.classList.toggle('warning', remain <= 300 && remain > 60);
    badge.classList.toggle('hot',     remain <= 60);
  }

  if (remain === 0) {
    showToast('⏰ انتهى الوقت! جاري التسليم...', 'warning');
    setTimeout(submitExam, 1500);
  }
}

/* ════════════════════════════════════════════════════════
   HEADER
════════════════════════════════════════════════════════ */

function _renderExamHeader() {
  const info = SUBJECTS[examState.subj] || { n: examState.subj, i: '📚' };
  setEl('examSubjectTag',   `${info.i} ${info.n}`);
  setEl('examAnsweredCount', '0 أجبت');
  _updateExamPill();
}

function _updateExamPill() {
  const cur   = examState.current + 1;
  const total = examState.questions.length;
  setEl('examQPill', `${cur}/${total}`);

  const pct  = Math.round((cur / total) * 100);
  const fill = document.getElementById('examProgFill');
  if (fill) fill.style.width = `${pct}%`;

  const answered = Object.keys(examState.answers).length;
  setEl('examAnsweredCount', `${answered} أجبت`);
}

/* ════════════════════════════════════════════════════════
   QUESTION STRIP (dots)
════════════════════════════════════════════════════════ */

function _renderQStrip() {
  const strip = document.getElementById('examQStrip');
  if (!strip) return;

  strip.innerHTML = examState.questions.map((_, i) => `
    <div class="exam-q-dot ${i === 0 ? 'current' : ''}"
         id="examDot${i}"
         onclick="examGoTo(${i})">
      ${i + 1}
    </div>
  `).join('');
}

function _updateQStrip() {
  examState.questions.forEach((_, i) => {
    const dot = document.getElementById(`examDot${i}`);
    if (!dot) return;
    dot.className = 'exam-q-dot';
    if (i === examState.current)            dot.classList.add('current');
    else if (examState.answers[i] !== undefined) dot.classList.add('answered');
    if (examState.flagged[i])               dot.classList.add('flagged');
  });
}

/* ════════════════════════════════════════════════════════
   RENDER QUESTION
════════════════════════════════════════════════════════ */

function _renderQuestion(idx) {
  const body = document.getElementById('examBodyScroll');
  if (!body) return;

  const q   = examState.questions[idx];
  if (!q) return;

  const chosen = examState.answers[idx];
  const flag   = examState.flagged[idx];

  body.innerHTML = `
    <div class="exam-q-card">

      <div class="exam-q-top">
        <div class="exam-q-num">السؤال ${idx + 1}</div>
        <div class="exam-diff-badge ${q.diff}">${_diffLabel(q.diff)}</div>
        <button class="exam-flag-btn ${flag ? 'flagged' : ''}"
                onclick="toggleExamFlag(${idx})"
                title="علّم هذا السؤال">
          ${flag ? '🚩' : '⚑'}
        </button>
      </div>

      <div class="exam-q-text">${q.q}</div>

      <div class="exam-opts-list">
        ${q.opts.map((opt, oi) => `
          <div class="exam-opt ${chosen === oi ? 'selected' : ''}"
               onclick="examChoose(${idx}, ${oi})">
            <div class="exam-opt-letter">${['أ','ب','ج','د'][oi]}</div>
            <div class="exam-opt-text">${opt}</div>
            <div class="exam-opt-check">✓</div>
          </div>
        `).join('')}
      </div>

    </div>
  `;

  _updateExamPill();
  _updateQStrip();
  _updateNavBtns();

  /* Scroll strip to current */
  const dot = document.getElementById(`examDot${idx}`);
  if (dot) dot.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' });
}

function _diffLabel(d) {
  return d === 'easy' ? '🌱 سهل' : d === 'hard' ? '🔥 صعب' : '⚡ متوسط';
}

/* ════════════════════════════════════════════════════════
   INTERACTIONS
════════════════════════════════════════════════════════ */

function examChoose(idx, optIdx) {
  if (examState.finished) return;
  examState.answers[idx] = optIdx;
  _renderQuestion(idx);
}

function toggleExamFlag(idx) {
  examState.flagged[idx] = !examState.flagged[idx];
  _renderQuestion(idx);
  showToast(examState.flagged[idx] ? '🚩 تم تعليم السؤال' : '⚑ تم إلغاء التعليم', 'info');
}

function examNav(dir) {
  const next = examState.current + dir;
  if (next < 0 || next >= examState.questions.length) return;
  examState.current = next;
  _renderQuestion(next);
}

function examGoTo(idx) {
  examState.current = idx;
  _renderQuestion(idx);
}

function _updateNavBtns() {
  const prev = document.getElementById('examPrevBtn');
  const next = document.getElementById('examNextBtn');
  const cur  = examState.current;
  const last = examState.questions.length - 1;
  if (prev) prev.disabled = cur === 0;
  if (next) {
    next.textContent = cur === last ? 'تسليم ✓' : 'التالي ›';
    next.onclick     = cur === last ? confirmSubmitExam : () => examNav(1);
  }
}

/* ════════════════════════════════════════════════════════
   SUBMIT
════════════════════════════════════════════════════════ */

function confirmSubmitExam() {
  const answered  = Object.keys(examState.answers).length;
  const total     = examState.questions.length;
  const unanswered = total - answered;

  if (unanswered > 0) {
    showConfirm(
      '📋 تسليم الامتحان',
      `لديك ${unanswered} سؤال لم تُجِب عليه. هل تريد التسليم الآن؟`,
      '⚠️',
      submitExam
    );
  } else {
    submitExam();
  }
}

function submitExam() {
  _stopTimer();
  examState.running  = false;
  examState.finished = true;

  /* Grade */
  let correct = 0;
  examState.questions.forEach((q, i) => {
    if (examState.answers[i] === q.ans) correct++;
  });

  const total    = examState.questions.length;
  const wrong    = total - correct;
  const pct      = total > 0 ? Math.round((correct / total) * 100) : 0;
  const grade    = (correct / total * 20).toFixed(2);
  const timeSecs = Math.floor((Date.now() - examState.startTime) / 1000);
  const mm       = String(Math.floor(timeSecs / 60)).padStart(2, '0');
  const ss       = String(timeSecs % 60).padStart(2, '0');

  /* XP */
  const xpEarned = Math.round((correct * XP_REWARDS.correct_medium) + XP_REWARDS.exam_complete);
  const st = loadState();
  st.xp    = (st.xp || 0) + xpEarned;
  st.ok    = (st.ok || 0) + correct;
  st.wrong = (st.wrong || 0) + wrong;
  if (!st.subjectStats) st.subjectStats = {};
  if (!st.subjectStats[examState.subj]) st.subjectStats[examState.subj] = { ok:0, wrong:0 };
  st.subjectStats[examState.subj].ok    += correct;
  st.subjectStats[examState.subj].wrong += wrong;
  if (!st.mastery) st.mastery = {};
  const prevM  = st.mastery[examState.subj] || 0;
  st.mastery[examState.subj] = Math.min(100, Math.round(prevM * 0.6 + pct * 0.4));
  saveState(st);
  recordStudyDay();

  /* Result emoji */
  const emoji = pct >= 90 ? '🏆' : pct >= 70 ? '🎓' : pct >= 50 ? '📚' : '💪';

  /* Show result */
  _showExamView('result');

  setEl('examResultEmoji',  emoji);
  setEl('examResultGrade',  `${grade}/20`);
  setEl('examResultTitle',  _resultTitle(pct));
  setEl('examResCorrect',   correct.toString());
  setEl('examResWrong',     wrong.toString());
  setEl('examResTime',      `${mm}:${ss}`);
  setEl('examResXp',        `+${xpEarned}`);

  /* Animate grade color */
  const gradeEl = document.getElementById('examResultGrade');
  if (gradeEl) {
    gradeEl.style.color = pct >= 70 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--error)';
  }

  /* XP popup */
  if (typeof showXpPopup === 'function') showXpPopup(xpEarned);

  /* Check badges */
  if (typeof checkBadges === 'function') checkBadges();
}

function _resultTitle(pct) {
  if (pct === 100) return '🌟 نتيجة مثالية!';
  if (pct >= 90)   return '🏆 ممتاز جداً!';
  if (pct >= 75)   return '🎓 جيد جداً!';
  if (pct >= 60)   return '📈 جيد — واصل!';
  if (pct >= 50)   return '📚 مقبول — راجع!';
  return '💪 حاول مرة أخرى!';
}

/* ════════════════════════════════════════════════════════
   REVIEW MODE (show correct answers after submit)
════════════════════════════════════════════════════════ */

function reviewExam() {
  _showExamView('active');
  examState.current = 0;
  _renderReviewQuestion(0);
}

function _renderReviewQuestion(idx) {
  const body = document.getElementById('examBodyScroll');
  if (!body) return;
  const q      = examState.questions[idx];
  const chosen = examState.answers[idx];

  body.innerHTML = `
    <div class="exam-q-card review-mode">
      <div class="exam-q-top">
        <div class="exam-q-num">السؤال ${idx + 1}</div>
        <div class="exam-diff-badge ${q.diff}">${_diffLabel(q.diff)}</div>
        ${chosen === q.ans
          ? '<div class="review-correct-badge">✓ صحيح</div>'
          : '<div class="review-wrong-badge">✗ خطأ</div>'
        }
      </div>
      <div class="exam-q-text">${q.q}</div>
      <div class="exam-opts-list">
        ${q.opts.map((opt, oi) => {
          let cls = 'exam-opt';
          if (oi === q.ans)                     cls += ' correct-opt';
          else if (oi === chosen && chosen !== q.ans) cls += ' wrong-opt';
          return `
            <div class="${cls}">
              <div class="exam-opt-letter">${['أ','ب','ج','د'][oi]}</div>
              <div class="exam-opt-text">${opt}</div>
            </div>`;
        }).join('')}
      </div>
      ${q.exp ? `<div class="exam-explain-card">💡 ${q.exp}</div>` : ''}
    </div>
  `;

  _updateNavBtns();

  const next = document.getElementById('examNextBtn');
  if (next) {
    const last = idx === examState.questions.length - 1;
    next.textContent = last ? 'إغلاق المراجعة' : 'التالي ›';
    next.onclick = last
      ? () => _showExamView('result')
      : () => { examState.current++; _renderReviewQuestion(examState.current); };
  }
  const prev = document.getElementById('examPrevBtn');
  if (prev) {
    prev.disabled = idx === 0;
    prev.onclick  = () => { examState.current--; _renderReviewQuestion(examState.current); };
  }
}
