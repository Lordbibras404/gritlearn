/* ============================================================
   GRIT Learn v7 — App Bootstrap & Home Screen
   Developer: @ZarVenox · Channel: @bacDz_09
   ============================================================ */
'use strict';

const BAC_DATE   = new Date('2026-06-07T08:00:00+01:00');
const TOTAL_DAYS = Math.ceil((BAC_DATE - new Date('2025-09-01')) / 86400000);

const QUOTES = [
  { text:'النجاح ليس نهائياً، والفشل ليس قاتلاً — الشجاعة هي ما يهم.',          icon:'💪' },
  { text:'كل دقيقة تقضيها في المذاكرة اليوم هي خطوة نحو نجاحك غداً.',           icon:'📚' },
  { text:'الفرق بين المستحيل والممكن يكمن في إرادة الإنسان.',                    icon:'🎯' },
  { text:'لا تقارن نفسك بالآخرين، قارن نفسك بمن كنت بالأمس.',                   icon:'🌟' },
  { text:'العقل كالعضلة، كلما تدرّبت عليه زاد قوةً وكفاءةً.',                   icon:'🧠' },
  { text:'النتائج الكبيرة تأتي من خطوات صغيرة متواصلة.',                        icon:'🚀' },
  { text:'اجعل من صعوبات اليوم وقود إنجازاتك الغد.',                           icon:'🔥' },
  { text:'المذاكرة المنتظمة أقوى بكثير من الحشو في اللحظة الأخيرة.',             icon:'⏰' },
  { text:'ثق بنفسك — أنت أكثر قدرةً مما تتخيل.',                               icon:'✨' },
  { text:'كل سؤال تحله اليوم هو سؤال أقل تقلق بشأنه في الامتحان.',              icon:'📝' },
];

const DAYS_AR    = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const DAYS_SHORT = ['أح','اث','ثل','أر','خم','جم','سب'];

const RAMADAN_START = new Date('2026-02-18');
const RAMADAN_END   = new Date('2026-03-20');

/* ════════════════ INIT ════════════════ */

function initApp() {
  initTelegram();
  applyTheme();
  generateSplashStars();
  /* FIX: was hard-coded 2800ms. Now waits for DOM ready + min 1500ms — faster on fast devices */
  const minDelay = new Promise(r => setTimeout(r, 1500));
  const domReady = new Promise(r => {
    if (document.readyState === 'complete') r();
    else window.addEventListener('load', r, { once: true });
  });
  Promise.all([minDelay, domReady]).then(bootApp);
}

function bootApp() {
  const st = loadState();
  showSplashOut();
  setTimeout(() => {
    if (!st.onboarded) showOnboarding();
    else { showMainApp(); renderHome(); checkStreak(); }
  }, 420);
}

/* ════════════════ TELEGRAM ════════════════ */

function initTelegram() {
  if (!window.Telegram?.WebApp) return;
  const tg = window.Telegram.WebApp;
  tg.ready(); tg.expand();
  if (tg.colorScheme === 'dark') {
    const st = loadState(); st.theme = 'dark'; saveState(st);
  }
  const user = tg.initDataUnsafe?.user;
  if (user?.first_name) {
    const st = loadState();
    if (!st.onboarded && !st.name) { st.name = user.first_name; saveState(st); }
  }
  tg.BackButton.onClick(() => {
    const active = document.querySelector('.screen.active');
    if (active && active.id !== 'homeScreen') { showScreen('homeScreen'); tg.BackButton.hide(); }
  });
}

/* ════════════════ SPLASH ════════════════ */

function generateSplashStars() {
  const container = document.getElementById('splashStars');
  if (!container) return;
  for (let i = 0; i < 40; i++) {
    const star = document.createElement('div');
    star.className = 'splash-star';
    const size = Math.random() * 3 + 1;
    star.style.cssText = `
      width:${size}px;height:${size}px;
      top:${Math.random()*100}%;left:${Math.random()*100}%;
      opacity:${Math.random()*0.6+0.1};
      animation-delay:${Math.random()*4}s;
      animation-duration:${Math.random()*3+2}s;
    `;
    container.appendChild(star);
  }
}

function showSplashOut() {
  const splash = document.getElementById('splashScreen');
  if (!splash) return;
  splash.style.animation = 'splashExit 0.5s ease forwards';
  setTimeout(() => { splash.style.display = 'none'; }, 480);
}

/* ════════════════ ONBOARDING ════════════════ */

let _obStep = 1;
const OB_ILLUS = { 1:'🎓', 2:'✏️', 3:'🏫' };
const OB_CTA   = { 1:'التالي ›', 2:'التالي ›', 3:'ابدأ رحلتك 🚀' };

function showOnboarding() {
  const ov = document.getElementById('onboardingOverlay');
  if (ov) ov.style.display = 'flex';
}

function obNext() {
  const st = loadState();

  if (_obStep === 2) {
    const inp  = document.getElementById('obNameInput');
    const name = inp?.value.trim();
    if (!name || name.length < 2) {
      inp?.classList.add('shake');
      setTimeout(() => inp?.classList.remove('shake'), 500);
      showToast('أدخل اسمك أولاً ✏️', 'warning'); return;
    }
    st.name = name; saveState(st);
  }

  if (_obStep === 3) {
    const sel = document.querySelector('.ob-branch-card.active');
    if (!sel) { showToast('اختر شعبتك أولاً 🎓', 'warning'); return; }
    st.branch = sel.dataset.branch;
    st.onboarded = true; saveState(st);
    finishOnboarding(); return;
  }

  _obStep++;
  _renderObStep(_obStep);
}

function _renderObStep(step) {
  document.querySelectorAll('.ob-step').forEach(el => el.classList.remove('active'));
  const cur = document.querySelector(`.ob-step[data-step="${step}"]`);
  if (cur) cur.classList.add('active');

  const illus = document.getElementById('obIllus');
  if (illus) {
    illus.style.animation = 'none';
    illus.textContent = OB_ILLUS[step] || '🎓';
    requestAnimationFrame(() => { illus.style.animation = 'obBounce 0.6s cubic-bezier(0.34,1.56,0.64,1) both'; });
  }

  const cta = document.getElementById('obCtaBtn');
  if (cta) cta.textContent = OB_CTA[step] || 'التالي ›';

  document.querySelectorAll('.ob-dot').forEach(dot => {
    const d = parseInt(dot.dataset.dot);
    dot.classList.remove('active','done');
    if (d === step) dot.classList.add('active');
    else if (d < step) dot.classList.add('done');
  });

  if (step === 2) {
    const st = loadState();
    const inp = document.getElementById('obNameInput');
    if (inp && st.name) inp.value = st.name;
    setTimeout(() => inp?.focus(), 300);
  }
}

document.addEventListener('click', e => {
  const card = e.target.closest('.ob-branch-card');
  if (!card) return;
  document.querySelectorAll('.ob-branch-card').forEach(c => c.classList.remove('active'));
  card.classList.add('active');
});

function finishOnboarding() {
  const ov = document.getElementById('onboardingOverlay');
  if (ov) { ov.style.animation = 'fadeOut 0.4s ease forwards'; setTimeout(() => ov.style.display = 'none', 380); }
  showMainApp(); renderHome(); checkStreak();
  showToast('مرحباً بك في GRIT Learn 🎉', 'success');
}

/* ════════════════ SHOW MAIN APP ════════════════ */

function showMainApp() {
  const app = document.getElementById('mainApp');
  if (app) { app.style.display = 'flex'; app.style.animation = 'fadeIn 0.4s ease both'; }
  checkRamadan();
  initNavIndicator();
}

function initNavIndicator() {
  updateNavIndicator('homeScreen');
}

/* ════════════════ RENDER HOME ════════════════ */

function renderHome() {
  const st = loadState();
  _renderGreeting(st);
  _renderBacStrip();
  _renderXpBar(st);
  _renderHomeStats(st);
  _renderMotivation();
  _renderStreak(st);
  _renderDailyPlan(st);
  _renderWeeklyChart(st);
  _renderHomeAvatar(st);
}

function _renderGreeting(st) {
  const now  = getAlgiersDate();
  const h    = now.getHours();
  let greet, icon;
  if      (h >= 4  && h < 12) { greet = 'صباح الخير';  icon = '☀️'; }
  else if (h >= 12 && h < 17) { greet = 'مساء الخير';  icon = '🌤'; }
  else if (h >= 17 && h < 21) { greet = 'مساء النور';  icon = '🌅'; }
  else                         { greet = 'مساء الخير';  icon = '🌙'; }

  setEl('homeGreetTime', `${greet} ${icon}`);
  setEl('homeGreetName', `أهلاً، ${st.name || 'طالب'}!`);

  const total = (st.ok||0)+(st.wrong||0);
  const subs  = [
    'استمر في التقدم 💪',
    `${_bacDays()} يوم على البكالوريا ⏰`,
    total > 0 ? `${total.toLocaleString('ar-DZ')} سؤال حتى الآن 📝` : 'ابدأ أول اختبار اليوم 🚀',
    `سلسلتك: ${st.streak||0} يوم 🔥`,
  ];
  setEl('homeGreetSub', subs[Math.floor(Math.random() * subs.length)]);
}

function _renderBacStrip() {
  const days    = _bacDays();
  const elapsed = TOTAL_DAYS - days;
  const pct     = Math.min(100, Math.round((elapsed / TOTAL_DAYS) * 100));
  setEl('homeBacDays', days.toString());
  const fill = document.getElementById('homeBacFill');
  if (fill) setTimeout(() => { fill.style.width = `${pct}%`; }, 400);
}

function _bacDays() {
  const now  = getAlgiersDate();
  const diff = BAC_DATE - now;
  return Math.max(0, Math.ceil(diff / 86400000));
}

function _renderXpBar(st) {
  const info = getLevelInfo(st.xp || 0);
  setEl('homeXpVal',    `${(st.xp||0).toLocaleString('ar-DZ')} XP`);
  setEl('homeXpNext',   `${info.needed.toLocaleString('ar-DZ')} للمستوى التالي`);
  setEl('homeLevelBadge', `${info.icon} ${info.name}`);
  const fill = document.getElementById('homeXpFill');
  if (fill) setTimeout(() => { fill.style.width = `${info.pct}%`; }, 450);
}

function _renderHomeStats(st) {
  const total = (st.ok||0)+(st.wrong||0);
  const acc   = total > 0 ? Math.round(((st.ok||0)/total)*100) : 0;
  setEl('homeStatStreak', (st.streak||0).toString());
  setEl('homeStatTotal',  total.toLocaleString('ar-DZ'));
  setEl('homeStatAcc',    `${acc}%`);
  setEl('homeStatRank',   '#' + _calcRank(st));
}

function _renderMotivation() {
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  setEl('homeMotivText', q.text);
  setEl('homeMotivIcon', q.icon);
}

function _renderStreak(st) {
  const streak = st.streak || 0;
  setEl('homeStreakVal', streak.toString());
  const c = document.getElementById('homeStreakDots');
  if (!c) return;
  const now = getAlgiersDate();
  c.innerHTML = Array.from({length:7},(_,i)=>{
    const d   = new Date(now); d.setDate(d.getDate()-(6-i));
    const key = d.toLocaleDateString('en-CA');
    const lit = (st.studyDays||{})[key];
    const isToday = i === 6;
    return `<div class="home-streak-dot ${lit?'lit':''}" style="${isToday?'border-color:var(--warning)':''}">${DAYS_SHORT[d.getDay()]}</div>`;
  }).join('');
}

function _renderDailyPlan(st) {
  const c = document.getElementById('homePlanList');
  if (!c) return;
  const branch   = st.branch || 'science';
  const subjects = (BRANCHES[branch]?.s || ['math','physics','arabic']).slice(0,4);
  c.innerHTML = subjects.map((subj,i) => {
    const info    = SUBJECTS[subj] || {n:subj,i:'📚',c:'#6c63ff'};
    const mastery = Math.round((st.mastery||{})[subj] || 0);
    return `
      <div class="home-plan-item" style="--item-c:${info.c};animation-delay:${i*80}ms"
           onclick="startQuizForSubject('${subj}')">
        <div class="home-plan-icon" style="background:${info.c}18">${info.i}</div>
        <div class="home-plan-body">
          <div class="home-plan-name">${info.n}</div>
          <div class="home-plan-sub">${_mastLabel(mastery)}</div>
        </div>
        <div class="home-plan-right">
          <div class="home-plan-pct" style="color:${info.c}">${mastery}%</div>
          <div class="home-plan-mini-bar">
            <div class="home-plan-mini-fill" style="width:${mastery}%;background:${info.c}"></div>
          </div>
        </div>
      </div>`;
  }).join('');
}
function _mastLabel(m){ return m>=80?'💪 ممتاز':m>=60?'📈 جيد':m>=40?'📚 مراجعة':'🆕 ابدأ'; }

function _renderWeeklyChart(st) {
  const c = document.getElementById('homeWeeklyBars');
  if (!c) return;
  const now  = getAlgiersDate();
  const data = Array.from({length:7},(_,i)=>{
    const d   = new Date(now); d.setDate(d.getDate()-(6-i));
    const key = d.toLocaleDateString('en-CA');
    return { d, count:(st.dailyCount||{})[key]||0 };
  });
  const max   = Math.max(1,...data.map(x=>x.count));
  const total = data.reduce((s,x)=>s+x.count,0);
  setEl('homeWeeklyTotal',`${total.toLocaleString('ar-DZ')} هذا الأسبوع`);
  c.innerHTML = data.map((x,i)=>{
    const hpct    = Math.round((x.count/max)*100);
    const isToday = i===6;
    return `
      <div class="home-weekly-col">
        <div class="home-wbar ${isToday?'today':x.count>0?'active':''}"
             style="height:${Math.max(5,hpct)}%" title="${x.count} سؤال"></div>
        <div class="home-wday ${isToday?'today':''}">${DAYS_SHORT[x.d.getDay()]}</div>
      </div>`;
  }).join('');
}

function _renderHomeAvatar(st) {
  const btn = document.getElementById('homeAvatarBtn');
  if (!btn) return;
  if (st.avatar) {
    btn.innerHTML = `<img src="${st.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:13px">`;
  } else {
    const letter = (st.name||'ط')[0];
    btn.innerHTML = `<span style="position:relative;z-index:1;font-size:20px;font-weight:900">${letter}</span>`;
  }
}

/* ════════════════ STREAK ════════════════ */

function checkStreak() {
  const st = loadState();
  if (!st.lastStudyDate) return;
  const today = getTodayStr();
  const last  = st.lastStudyDate;
  if (last === today) return;
  /* FIX: compare date strings at noon to avoid UTC/Algiers timezone mismatch */
  const lastDate  = new Date(last  + 'T12:00:00');
  const todayDate = new Date(today + 'T12:00:00');
  const diff = Math.round((todayDate - lastDate) / 86400000);
  if (diff > 1 && (st.streak || 0) > 0) {
    st.streak = 0; saveState(st);
    showToast('💔 انقطعت سلسلتك — ابدأ من جديد!', 'warning');
  }
}

function recordStudyDay() {
  const st    = loadState();
  const now   = getAlgiersDate();
  const today = now.toLocaleDateString('en-CA');
  if (!st.studyDays)  st.studyDays  = {};
  if (!st.dailyCount) st.dailyCount = {};
  if (st.lastStudyDate !== today) {
    const yest = new Date(now); yest.setDate(yest.getDate()-1);
    const yKey = yest.toLocaleDateString('en-CA');
    if (st.lastStudyDate === yKey) st.streak = (st.streak||0)+1;
    else if (!st.lastStudyDate)   st.streak = 1;
    st.lastStudyDate = today;
  }
  st.studyDays[today] = true;
  st.ses = (st.ses||0)+1;
  saveState(st);
}

/* ════════════════ RAMADAN ════════════════ */

function checkRamadan() {
  const now = getAlgiersDate();
  const hdr = document.getElementById('ramadanHeader');
  if (!hdr) return;
  if (now >= RAMADAN_START && now <= RAMADAN_END) {
    hdr.style.display = 'flex';
    const day = Math.ceil((now - RAMADAN_START)/86400000)+1;
    setEl('ramDayChip', `يوم ${day}`);
    const msgs = ['رمضان كريم! 🌙','بارك الله فيك 🤲','شهر العلم والعبادة 📿'];
    const msgEl = document.getElementById('ramMsg');
    if (msgEl) { msgEl.textContent = msgs[day%msgs.length]; setTimeout(()=>msgEl.classList.add('show'),500); }
  } else { hdr.style.display = 'none'; }
}

/* ════════════════ SCREEN NAV ════════════════ */

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) { target.classList.add('active'); target.scrollTop = 0; }
  updateNavIndicator(id);
  _onShow(id);
  if (window.Telegram?.WebApp) {
    if (id==='homeScreen') Telegram.WebApp.BackButton.hide();
    else Telegram.WebApp.BackButton.show();
  }
}

function updateNavIndicator(id) {
  const items = document.querySelectorAll('.nav-item');
  const ind   = document.getElementById('navIndicator');
  items.forEach(item => item.classList.remove('active'));
  const active = document.querySelector(`.nav-item[data-screen="${id}"]`);
  if (active) {
    active.classList.add('active');
    if (ind) {
      const r  = active.getBoundingClientRect();
      const nr = document.getElementById('bottomNav')?.getBoundingClientRect();
      if (nr) ind.style.transform = `translateX(${r.left - nr.left + r.width/2 - 20}px)`;
    }
  }
}

function _onShow(id) {
  switch(id) {
    case 'homeScreen':       renderHome();        break;
    case 'pointsScreen':     if(typeof renderDashboard==='function')   renderDashboard();   break;
    case 'profileScreen':    if(typeof renderProfile==='function')     renderProfile();     break;
    case 'leaderScreen':     if(typeof renderLeaderboard==='function') renderLeaderboard(); break;
    case 'summariesScreen':  if(typeof renderSummaries==='function')   renderSummaries();   break;
    case 'pomodoroScreen':   if(typeof renderPomoTasks==='function')   renderPomoTasks();   break;
    case 'studyPlanScreen':  if(typeof renderStudyPlan==='function')   renderStudyPlan();   break;
  }
}

/* ════════════════ QUIZ QUICK START ════════════════ */

function startQuizForSubject(subj) {
  showScreen('quizScreen');
  setTimeout(() => {
    document.querySelectorAll('#quizSubjectTabs .tab-btn').forEach(btn =>
      btn.classList.toggle('active', btn.dataset.subj === subj));
    if (typeof startQuiz === 'function') startQuiz();
  }, 200);
}

/* ════════════════ THEME ════════════════ */

function applyTheme() {
  const st   = loadState();
  const dark = st.theme === 'dark';
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  updateThemeToggles(dark);
}

function toggleTheme() {
  const st = loadState();
  const dark = st.theme !== 'dark';
  st.theme = dark ? 'dark' : 'light'; saveState(st);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  updateThemeToggles(dark);
  showToast(dark ? '🌙 الوضع الليلي' : '☀️ الوضع النهاري', 'info');
}

function updateThemeToggles(dark) {
  ['themeToggle','settingsThemeToggle'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('on', dark);
  });
}

/* ════════════════ NOTIFICATIONS ════════════════ */

function toggleNotif() {
  const st = loadState();
  st.notif = !st.notif; saveState(st);
  ['notifToggle','settingsNotifToggle'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('on', !!st.notif);
  });
}

/* ════════════════ SHARE / CHANNEL ════════════════ */

function openChannel() {
  const url = 'https://t.me/bacDz_09';
  if (window.Telegram?.WebApp) Telegram.WebApp.openTelegramLink(url);
  else window.open(url, '_blank');
}

function shareApp() {
  const text = `📚 GRIT Learn — أفضل تطبيق للتحضير لبكالوريا الجزائر 2026\n🎯 أسئلة · 📊 تقدم · 🤖 ذكاء اصطناعي\n@bacDz_09`;
  if (window.Telegram?.WebApp)
    Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=https://t.me/bacDz_09&text=${encodeURIComponent(text)}`);
  else if (navigator.share) navigator.share({ title:'GRIT Learn', text });
}

/* ════════════════ CONFIRM / RESET ════════════════ */

let _confirmCb = null;

function confirmReset() {
  showConfirm('🗑 حذف البيانات','سيتم حذف كل بياناتك ونقاطك ولا يمكن التراجع!','⚠️', ()=>{
    resetState(); window.location.reload();
  });
}

function showConfirm(title, sub, icon, cb) {
  _confirmCb = cb;
  setEl('confirmTitle', title); setEl('confirmSub', sub); setEl('confirmIcon', icon);
  const m = document.getElementById('confirmModal');
  const o = document.getElementById('overlay');
  if (m) { m.style.display = 'flex'; }
  if (o) { o.style.display = 'block'; }
}

function confirmAction() { if (_confirmCb) _confirmCb(); closeConfirm(); }

function closeConfirm() {
  const m = document.getElementById('confirmModal');
  const o = document.getElementById('overlay');
  if (m) m.style.display = 'none';
  if (o) o.style.display = 'none';
  _confirmCb = null;
}

function closeOverlay() {
  closeConfirm();
  const sheet = document.getElementById('pomoTaskSheet');
  if (sheet) sheet.classList.remove('show');
}

/* ════════════════ UTILS ════════════════ */

function setEl(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
/* NOTE: getAlgiersDate() and getTodayStr() are defined in state.js — no duplicate needed here */
function _calcRank(st) {
  const xp = st.xp || 0;
  /* FIX: was Math.random() → rank changed every render. Now deterministic based on XP */
  if (xp >= 5000) return (xp % 10) + 1;
  if (xp >= 2000) return (xp % 50) + 10;
  if (xp >= 500)  return (xp % 200) + 50;
  return (xp % 500) + 200;
}

/* ════════════════ RIPPLE EFFECT ════════════════ */

function addRipple(e) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'ripple-effect';
  ripple.style.left = (e.clientX - rect.left) + 'px';
  ripple.style.top  = (e.clientY - rect.top)  + 'px';
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

/* ════════════════ CONFETTI ════════════════ */

function launchConfetti(count = 40) {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);
  const colors = ['#6c63ff','#a855f7','#f59e0b','#10b981','#f43f5e','#0ea5e9','#fcd34d'];
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      --duration:${1.5+Math.random()*1.5}s;
      --delay:${Math.random()*0.6}s;
      width:${6+Math.random()*6}px;
      height:${6+Math.random()*6}px;
      border-radius:${Math.random()>0.5?'50%':'2px'};
    `;
    container.appendChild(piece);
  }
  setTimeout(() => container.remove(), 3500);
}

/* ════════════════════════════════════════════════════════
   STUDY PLAN SCREEN — Full Implementation
   خطة الدراسة الذكية
════════════════════════════════════════════════════════ */

const STUDY_TIPS = [
  { icon:'⏰', text:'درس 25 دقيقة ثم خذ استراحة 5 دقائق — تقنية بومودورو مثبتة علمياً.' },
  { icon:'📝', text:'راجع أخطاءك الأخيرة قبل بدء جلسة جديدة لتثبيت التعلم.' },
  { icon:'💧', text:'اشرب الماء باستمرار خلال المذاكرة — الجفاف يقلل التركيز بنسبة 15%.' },
  { icon:'🌙', text:'النوم الكافي (7-8 ساعات) يثبّت المعلومات في الذاكرة طويلة المدى.' },
  { icon:'📚', text:'المذاكرة الموزعة على أيام أفضل من الحشو في ليلة واحدة.' },
  { icon:'🎯', text:'ركّز على نقاط ضعفك الأولى — الساعة الواحدة فيها تساوي 3 ساعات في المواد القوية.' },
  { icon:'🤖', text:'استخدم المساعد الذكي لفهم المفاهيم الصعبة — لا تمر على شيء لا تفهمه.' },
  { icon:'🏆', text:'المقارنة مع نفسك فقط — تقدمك أمس هو معيارك اليوم.' },
  { icon:'🧘', text:'خذ نفساً عميقاً قبل الجلسة — التنفس البطيء يرفع التركيز ويقلل القلق.' },
  { icon:'✍️', text:'اكتب الملاحظات بيدك — الكتابة اليدوية تثبّت المعلومات أكثر من الطباعة.' },
  { icon:'🗂', text:'قسّم الدرس الطويل إلى أجزاء صغيرة ودرّسها على مراحل.' },
  { icon:'🔁', text:'راجع ما درسته أمس قبل البدء اليوم — قاعدة التكرار المتباعد.' },
];

const DAYS_SHORT_PLAN = ['أح','اث','ثل','أر','خم','جم','سب'];

/* ── الدالة الرئيسية ── */
function renderStudyPlan() {
  const st = loadState();
  _renderSpBac(st);
  _renderSpSummaryStats(st);
  _renderSpWeek(st);
  _renderSpSmartSuggestion(st);
  _renderSpTodayFocus(st);
  _renderSpSubjectStatus(st);
  _renderSpGoalProgress(st);
  _renderSpTips();
}

/* ── BAC Countdown ── */
function _renderSpBac(st) {
  const days    = _bacDays();
  const elapsed = TOTAL_DAYS - days;
  const pct     = Math.min(100, Math.round((elapsed / TOTAL_DAYS) * 100));
  const weeks   = Math.floor(days / 7);
  const rem     = days % 7;

  setEl('spBacDays', days.toString());

  /* Sub-label: أسابيع + أيام */
  const subEl = document.getElementById('spBacSubLabel');
  if (subEl) subEl.textContent = weeks > 0
    ? `${weeks} أسبوع و${rem} يوم`
    : `${days} يوم فقط!`;

  /* Urgency color */
  const hero = document.getElementById('spBacHero');
  if (hero) {
    if (days <= 30)       hero.style.background = 'linear-gradient(135deg,#ef4444 0%,#f97316 100%)';
    else if (days <= 60)  hero.style.background = 'linear-gradient(135deg,#f59e0b 0%,#f97316 100%)';
    else                  hero.style.background = 'linear-gradient(135deg,#6c63ff 0%,#a855f7 100%)';
  }

  const fill = document.getElementById('spBacFill');
  if (fill) setTimeout(() => { fill.style.width = `${pct}%`; }, 400);

  /* Pulse animation on days number when urgent */
  const daysEl = document.getElementById('spBacDays');
  if (daysEl && days <= 30) daysEl.style.animation = 'glowPulse 1.5s ease-in-out infinite';
}

/* ── Summary Stats Row ── */
function _renderSpSummaryStats(st) {
  const c = document.getElementById('spSummaryStats');
  if (!c) return;

  const today      = getTodayStr();
  const todayQ     = (st.dailyCount || {})[today] || 0;
  const todayXp    = (st.dailyXp    || {})[today] || 0;
  const weekDays   = _spCountStudyDaysThisWeek(st);
  const totalQ     = (st.ok || 0) + (st.wrong || 0);
  const acc        = totalQ > 0 ? Math.round(((st.ok||0) / totalQ) * 100) : 0;

  c.innerHTML = `
    <div class="sp-stat-pill" onclick="showScreen('pointsScreen')">
      <div class="sp-stat-pill-val">${todayQ}</div>
      <div class="sp-stat-pill-lbl">📝 اليوم</div>
    </div>
    <div class="sp-stat-pill" onclick="showScreen('pointsScreen')">
      <div class="sp-stat-pill-val">${todayXp}</div>
      <div class="sp-stat-pill-lbl">⭐ XP اليوم</div>
    </div>
    <div class="sp-stat-pill" onclick="showScreen('pointsScreen')">
      <div class="sp-stat-pill-val">${weekDays}/7</div>
      <div class="sp-stat-pill-lbl">🔥 أيام الأسبوع</div>
    </div>
    <div class="sp-stat-pill" onclick="showScreen('pointsScreen')">
      <div class="sp-stat-pill-val">${acc}%</div>
      <div class="sp-stat-pill-lbl">🎯 دقة</div>
    </div>`;
}

function _spCountStudyDaysThisWeek(st) {
  const now = getAlgiersDate();
  let count = 0;
  for (let i = 0; i < 7; i++) {
    const d   = new Date(now); d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-CA');
    if ((st.studyDays || {})[key]) count++;
  }
  return count;
}

/* ── Week Grid ── */
function _renderSpWeek(st) {
  const c = document.getElementById('spWeekGrid');
  if (!c) return;
  const now   = getAlgiersDate();
  const today = getTodayStr();

  /* Show Mon–Sun of current week starting from Saturday (Algerian week) */
  const startOffset = now.getDay(); /* days from start of week */
  c.innerHTML = Array.from({length: 7}, (_, i) => {
    const d   = new Date(now); d.setDate(d.getDate() - startOffset + i);
    const key = d.toLocaleDateString('en-CA');
    const isToday  = key === today;
    const isFuture = d > now && !isToday;
    const done     = !isFuture && !!(st.studyDays || {})[key];
    const dayQ     = (st.dailyCount || {})[key] || 0;

    return `
      <div class="sp-week-day ${isToday ? 'today' : ''} ${done ? 'done' : ''} ${isFuture ? 'future' : ''}"
           onclick="${isFuture ? '' : `showScreen('quizScreen')`}"
           title="${d.toLocaleDateString('ar-DZ')}">
        <div class="sp-week-day-name">${DAYS_SHORT_PLAN[d.getDay()]}</div>
        <div class="sp-week-day-icon">
          ${done ? '✅' : isToday ? '⚡' : isFuture ? '○' : '✗'}
        </div>
        <div class="sp-week-day-count">${done && dayQ > 0 ? dayQ : ''}</div>
        <div class="sp-week-day-dot"></div>
      </div>`;
  }).join('');
}

/* ── Smart Suggestion (AI-like) ── */
function _renderSpSmartSuggestion(st) {
  const c = document.getElementById('spSmartSuggestion');
  if (!c) return;

  const sw      = getStrengthsWeaknesses(st);
  const weakest = sw.weaknesses[0];
  const streak  = st.streak || 0;
  const days    = _bacDays();
  const today   = getTodayStr();
  const todayQ  = (st.dailyCount || {})[today] || 0;

  let icon, title, body, action, actionFn;

  if (days <= 14) {
    icon = '🚨'; title = 'أسبوعان الأخيران!';
    body = 'الوقت يداهمك. ركّز على المراجعة السريعة والأسئلة الصعبة فقط.';
    action = 'راجع الآن'; actionFn = `showScreen('quizScreen')`;
  } else if (todayQ === 0) {
    icon = '👆'; title = 'لم تبدأ اليوم بعد!';
    body = 'كل يوم بدون مذاكرة يُضعف سلسلتك. خمسة أسئلة تكفي للبداية.';
    action = 'ابدأ 5 أسئلة'; actionFn = `showScreen('quizScreen')`;
  } else if (weakest && weakest.rate < 50) {
    icon = '🎯'; title = `ضعف في ${weakest.subj?.n}`;
    body = `دقتك ${weakest.rate}% فقط في ${weakest.subj?.n}. خصص 20 دقيقة لها اليوم.`;
    action = `ابدأ ${weakest.subj?.n}`; actionFn = `startQuizForSubject('${weakest.key}')`;
  } else if (streak >= 7) {
    icon = '🔥'; title = `${streak} يوم متواصل! رائع`;
    body = 'سلسلتك قوية جداً. واصل الزخم — النجاح قريب.';
    action = 'واصل اليوم'; actionFn = `showScreen('quizScreen')`;
  } else if (todayQ < 10) {
    icon = '💪'; title = 'قريب من هدفك اليومي';
    body = `أجبت على ${todayQ} سؤال اليوم. هدف اليوم 20 سؤال — أنت في منتصف الطريق.`;
    action = 'أكمل الهدف'; actionFn = `showScreen('quizScreen')`;
  } else {
    icon = '🌟'; title = 'أداء ممتاز اليوم!';
    body = `أجبت على ${todayQ} سؤال اليوم. استمر في هذا المستوى وستكون الأفضل.`;
    action = 'تحدٍّ إضافي'; actionFn = `showScreen('quizScreen')`;
  }

  c.innerHTML = `
    <div class="sp-suggestion-card">
      <div class="sp-suggestion-icon">${icon}</div>
      <div class="sp-suggestion-body">
        <div class="sp-suggestion-title">${title}</div>
        <div class="sp-suggestion-text">${body}</div>
      </div>
      <button class="sp-suggestion-btn" onclick="${actionFn}">${action}</button>
    </div>`;
}

/* ── Today Focus (أولويات اليوم) ── */
function _renderSpTodayFocus(st) {
  const c = document.getElementById('spTodayFocus');
  if (!c) return;

  const branch   = st.branch || 'science';
  const allSubjs = BRANCHES[branch]?.s || [];

  /* Sort by mastery ascending — weakest first */
  const sorted = [...allSubjs]
    .map(key => ({
      key,
      mastery: Math.round((st.mastery || {})[key] || 0),
      sessions: (st.subjectStats || {})[key]?.sessions || 0,
    }))
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 4);

  c.innerHTML = sorted.map((item, i) => {
    const info    = SUBJECTS[item.key] || { n: item.key, i: '📚', c: '#6c63ff' };
    const m       = item.mastery;
    const urgency = m < 30 ? '🔴 عاجل'
                  : m < 60 ? '🟡 مهم'
                  : m < 80 ? '🟢 جيد'
                  : '✅ ممتاز';
    const timeEst = m < 30 ? '45 د' : m < 60 ? '30 د' : '15 د';

    return `
      <div class="sp-focus-card stagger-item" style="animation-delay:${i * 80}ms"
           onclick="startQuizForSubject('${item.key}')">
        <div class="sp-focus-rank">${i + 1}</div>
        <div class="sp-focus-icon" style="background:${info.c}18">${info.i}</div>
        <div class="sp-focus-body">
          <div class="sp-focus-name">${info.n}</div>
          <div class="sp-focus-meta">
            <span class="sp-focus-urgency">${urgency}</span>
            <span style="color:var(--text4)">·</span>
            <span style="color:var(--text3)">⏱ ${timeEst} موصى</span>
          </div>
          <div class="sp-focus-mini-bar-track">
            <div class="sp-focus-mini-bar-fill"
                 style="width:${m}%;background:${info.c}"></div>
          </div>
        </div>
        <div class="sp-focus-right">
          <div class="sp-focus-pct" style="color:${info.c}">${m}%</div>
          <div class="sp-focus-action">ابدأ ›</div>
        </div>
      </div>`;
  }).join('');
}

/* ── Subject Status (كل المواد) ── */
function _renderSpSubjectStatus(st) {
  const c = document.getElementById('spSubjectStatus');
  if (!c) return;

  const branch   = st.branch || 'science';
  const subjects = BRANCHES[branch]?.s || [];

  /* Group by status */
  const rows = subjects.map(key => {
    const info    = SUBJECTS[key] || { n: key, i: '📚', c: '#6c63ff' };
    const mastery = Math.round((st.mastery || {})[key] || 0);
    const ss      = (st.subjectStats || {})[key] || { ok: 0, wrong: 0, sessions: 0 };
    const total   = ss.ok + ss.wrong;
    const acc     = total > 0 ? Math.round((ss.ok / total) * 100) : 0;

    const statusLabel = mastery >= 80 ? 'ممتاز' : mastery >= 60 ? 'جيد' : mastery >= 40 ? 'متوسط' : 'ضعيف';
    const statusBg    = mastery >= 80 ? 'rgba(16,185,129,0.12)'
                      : mastery >= 60 ? 'rgba(245,158,11,0.12)'
                      : mastery >= 40 ? 'rgba(249,115,22,0.12)'
                      : 'rgba(239,68,68,0.12)';
    const statusClr   = mastery >= 80 ? '#10b981'
                      : mastery >= 60 ? '#f59e0b'
                      : mastery >= 40 ? '#f97316'
                      : '#ef4444';

    return { key, info, mastery, acc, total, statusLabel, statusBg, statusClr, ss };
  });

  c.innerHTML = rows.map((r, i) => `
    <div class="sp-subj-row stagger-item" style="animation-delay:${i * 45}ms"
         onclick="startQuizForSubject('${r.key}')">
      <div class="sp-subj-icon">${r.info.i}</div>
      <div class="sp-subj-body">
        <div class="sp-subj-top">
          <span class="sp-subj-name">${r.info.n}</span>
          <div class="sp-subj-meta">
            <span style="font-size:10px;color:var(--text3);font-weight:700">${r.total} سؤال · ${r.acc}% دقة</span>
          </div>
        </div>
        <div class="sp-subj-bar-track">
          <div class="sp-subj-bar-fill"
               style="width:${r.mastery}%;background:${r.info.c};
                      transition-delay:${i * 60}ms"></div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0">
        <div class="sp-subj-pct" style="color:${r.info.c}">${r.mastery}%</div>
        <div class="sp-subj-status"
             style="background:${r.statusBg};color:${r.statusClr}">${r.statusLabel}</div>
      </div>
    </div>`).join('');
}

/* ── Goal Progress (هدف اليوم) ── */
function _renderSpGoalProgress(st) {
  const c = document.getElementById('spGoalProgress');
  if (!c) return;

  const today   = getTodayStr();
  const todayQ  = (st.dailyCount || {})[today] || 0;
  const todayXp = (st.dailyXp    || {})[today] || 0;
  const GOAL_Q  = 20;
  const GOAL_XP = 100;
  const qPct    = Math.min(100, Math.round((todayQ  / GOAL_Q)  * 100));
  const xpPct   = Math.min(100, Math.round((todayXp / GOAL_XP) * 100));

  c.innerHTML = `
    <div class="sp-goal-item">
      <div class="sp-goal-header">
        <span class="sp-goal-label">📝 أسئلة اليوم</span>
        <span class="sp-goal-val" style="color:${qPct>=100?'var(--success)':'var(--accent)'}">
          ${todayQ} / ${GOAL_Q}
        </span>
      </div>
      <div class="sp-goal-track">
        <div class="sp-goal-fill" style="width:${qPct}%;background:var(--accent);transition-delay:200ms">
          ${qPct >= 100 ? '<span class="sp-goal-check">✓</span>' : ''}
        </div>
      </div>
    </div>
    <div class="sp-goal-item">
      <div class="sp-goal-header">
        <span class="sp-goal-label">⭐ XP اليوم</span>
        <span class="sp-goal-val" style="color:${xpPct>=100?'var(--success)':'var(--warning)'}">
          ${todayXp} / ${GOAL_XP}
        </span>
      </div>
      <div class="sp-goal-track">
        <div class="sp-goal-fill" style="width:${xpPct}%;background:var(--warning);transition-delay:350ms">
          ${xpPct >= 100 ? '<span class="sp-goal-check">✓</span>' : ''}
        </div>
      </div>
    </div>
    <div class="sp-goal-item">
      <div class="sp-goal-header">
        <span class="sp-goal-label">🔥 السلسلة</span>
        <span class="sp-goal-val" style="color:var(--error)">${st.streak || 0} يوم</span>
      </div>
      <div class="sp-goal-track">
        <div class="sp-goal-fill"
             style="width:${Math.min(100,(st.streak||0)/30*100)}%;
                    background:var(--error);transition-delay:500ms"></div>
      </div>
    </div>`;

  /* Celebrate if both goals hit */
  if (qPct >= 100 && xpPct >= 100 && typeof launchConfetti === 'function') {
    setTimeout(() => launchConfetti(25), 600);
  }
}

/* ── Study Tips ── */
function _renderSpTips() {
  const c = document.getElementById('spTipsList');
  if (!c) return;

  const tips = [...STUDY_TIPS]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  c.innerHTML = tips.map((t, i) => `
    <div class="sp-tip-item stagger-item" style="animation-delay:${i * 70}ms">
      <div class="sp-tip-icon">${t.icon}</div>
      <div class="sp-tip-text">${t.text}</div>
    </div>`).join('');
}

/* ── Refresh ── */
function refreshStudyPlan() {
  /* Re-render with animation reset */
  const screen = document.getElementById('studyPlanScreen');
  if (screen) {
    screen.style.animation = 'none';
    void screen.offsetWidth;
    screen.style.animation = '';
  }
  renderStudyPlan();
  showToast('✅ تم تحديث الخطة', 'success');
}
