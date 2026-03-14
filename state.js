/* ============================================================
   GRIT Learn v7 — State Management
   Single source of truth · localStorage · deep merge
   Developer: @ZarVenox · Channel: @bacDz_09
   ============================================================ */
'use strict';

const STORAGE_KEY = 'grit_v7';

/* ══ Level definitions ══ */
const LEVELS = [
  { min:    0, max:   99,       name:'مبتدئ',    icon:'🌱', cls:'bronze',  color:'#cd7f32' },
  { min:  100, max:  299,       name:'متعلم',    icon:'📖', cls:'bronze',  color:'#cd7f32' },
  { min:  300, max:  599,       name:'متقدم',    icon:'⚡', cls:'silver',  color:'#9ca3af' },
  { min:  600, max:  999,       name:'محترف',    icon:'🎯', cls:'silver',  color:'#9ca3af' },
  { min: 1000, max: 1599,       name:'خبير',     icon:'🏆', cls:'gold',    color:'#f59e0b' },
  { min: 1600, max: 2499,       name:'نخبة',     icon:'💎', cls:'diamond', color:'#67e8f9' },
  { min: 2500, max: 3999,       name:'أسطورة',   icon:'👑', cls:'legend',  color:'#a78bfa' },
  { min: 4000, max: Infinity,   name:'بطل BAC',  icon:'🎓', cls:'legend',  color:'#ec4899' },
];

/* ══ Badges ══ */
const BADGES = [
  { id:'first_quiz',   icon:'🎯', name:'البداية',      desc:'أجب على أول سؤال',          check: s => (s.ok+s.wrong)>=1 },
  { id:'streak_3',     icon:'🔥', name:'3 أيام',       desc:'3 أيام متواصلة',             check: s => s.streak>=3 },
  { id:'streak_7',     icon:'🔥', name:'أسبوع كامل',   desc:'7 أيام متواصلة',             check: s => s.streak>=7 },
  { id:'streak_30',    icon:'🔥', name:'شهر كامل',     desc:'30 يوم متواصل',              check: s => s.streak>=30 },
  { id:'xp_100',       icon:'⭐', name:'نجم',          desc:'اجمع 100 XP',                check: s => s.xp>=100 },
  { id:'xp_500',       icon:'💫', name:'نجم ساطع',     desc:'اجمع 500 XP',                check: s => s.xp>=500 },
  { id:'xp_1000',      icon:'🌟', name:'نجم الألف',    desc:'اجمع 1000 XP',               check: s => s.xp>=1000 },
  { id:'xp_5000',      icon:'🚀', name:'محترف',        desc:'اجمع 5000 XP',               check: s => s.xp>=5000 },
  { id:'perfect_3',    icon:'💯', name:'3 مثاليات',    desc:'3 اختبارات 100%',            check: s => (s.perfectCount||0)>=3 },
  { id:'q_50',         icon:'📝', name:'50 سؤال',      desc:'أجب على 50 سؤالاً',          check: s => (s.ok+s.wrong)>=50 },
  { id:'q_100',        icon:'📚', name:'100 سؤال',     desc:'أجب على 100 سؤال',           check: s => (s.ok+s.wrong)>=100 },
  { id:'q_500',        icon:'🏛',  name:'500 سؤال',    desc:'أجب على 500 سؤال',           check: s => (s.ok+s.wrong)>=500 },
  { id:'pomo_5',       icon:'⏱', name:'بومودورو',      desc:'أكمل 5 جلسات بومودورو',      check: s => (s.pomSessions||0)>=5 },
  { id:'ai_chat',      icon:'🤖', name:'الذكاء',       desc:'استخدم المساعد الذكي',        check: s => (s.aiChats||0)>=1 },
  { id:'all_subjects', icon:'🎓', name:'موسوعة',       desc:'أجب في كل المواد',            check: s => Object.values(s.subjectStats||{}).filter(v=>(v.ok+v.wrong)>0).length>=8 },
  { id:'ramadan',      icon:'📿', name:'رمضان',        desc:'ذاكر في رمضان',               check: s => (s.ramadanSessions||0)>=1 },
  { id:'night_owl',    icon:'🦉', name:'بومة الليل',   desc:'ذاكر بعد منتصف الليل',        check: s => (s.nightSessions||0)>=3 },
  { id:'early_bird',   icon:'🌅', name:'الباكر',       desc:'ذاكر قبل الفجر',             check: s => (s.earlySessions||0)>=3 },
];

/* ══ Subjects ══ */
const SUBJECTS = {
  math:       { n:'رياضيات',       i:'📐', c:'#6c63ff' },
  physics:    { n:'فيزياء',        i:'⚡', c:'#3b82f6' },
  arabic:     { n:'عربية',         i:'📖', c:'#10b981' },
  history:    { n:'تاريخ وجغرافيا',i:'🏛', c:'#f59e0b' },
  english:    { n:'إنجليزية',      i:'🇬🇧', c:'#ef4444' },
  french:     { n:'فرنسية',        i:'🇫🇷', c:'#3b82f6' },
  islamic:    { n:'إسلامية',       i:'☪️', c:'#10b981' },
  philosophy: { n:'فلسفة',         i:'🧠', c:'#8b5cf6' },
  science:    { n:'علوم طبيعية',   i:'🧬', c:'#06b6d4' },
  chemistry:  { n:'كيمياء',        i:'🧪', c:'#f97316' },
  economics:  { n:'اقتصاد وتسيير', i:'📊', c:'#84cc16' },
  tamazight:  { n:'أمازيغية',      i:'🌿', c:'#14b8a6' },
};

/* ══ Branches ══ */
const BRANCHES = {
  science: { n:'علوم تجريبية', i:'🔬', s:['math','physics','arabic','history','english','french','islamic','philosophy','science','chemistry'] },
  math:    { n:'رياضيات',      i:'📐', s:['math','physics','arabic','history','english','french','islamic','philosophy'] },
  letters: { n:'آداب وفلسفة',  i:'📖', s:['arabic','history','english','french','islamic','philosophy'] },
  manage:  { n:'تسيير واقتصاد',i:'📊', s:['economics','math','arabic','history','english','french','islamic','philosophy'] },
};

/* ══ Default state ══ */
const DEFAULT_STATE = {
  /* Identity */
  name:     '',
  avatar:   null,
  branch:   'science',
  onboarded: false,
  notif:    true,
  theme:    'light',

  /* Progress */
  xp:           0,
  streak:       0,
  ok:           0,
  wrong:        0,
  ses:          0,
  perfectCount: 0,
  lastStudyDate: null,
  studyDays:    {},   /* { 'YYYY-MM-DD': true } */
  dailyCount:   {},   /* { 'YYYY-MM-DD': N } */
  dailyXp:      {},   /* { 'YYYY-MM-DD': N } */

  /* Per-subject mastery 0-100 */
  mastery: { math:0,physics:0,arabic:0,history:0,english:0,french:0,islamic:0,philosophy:0,science:0,chemistry:0,economics:0,tamazight:0 },

  /* Per-subject detailed stats */
  subjectStats: {
    math:       {ok:0,wrong:0,sessions:0},
    physics:    {ok:0,wrong:0,sessions:0},
    arabic:     {ok:0,wrong:0,sessions:0},
    history:    {ok:0,wrong:0,sessions:0},
    english:    {ok:0,wrong:0,sessions:0},
    french:     {ok:0,wrong:0,sessions:0},
    islamic:    {ok:0,wrong:0,sessions:0},
    philosophy: {ok:0,wrong:0,sessions:0},
    science:    {ok:0,wrong:0,sessions:0},
    chemistry:  {ok:0,wrong:0,sessions:0},
    economics:  {ok:0,wrong:0,sessions:0},
    tamazight:  {ok:0,wrong:0,sessions:0},
  },

  /* Adaptive weights per subject/diff */
  adaptiveWeights: {
    math:       {easy:1,medium:1,hard:1},
    physics:    {easy:1,medium:1,hard:1},
    arabic:     {easy:1,medium:1,hard:1},
    history:    {easy:1,medium:1,hard:1},
    english:    {easy:1,medium:1,hard:1},
    french:     {easy:1,medium:1,hard:1},
    islamic:    {easy:1,medium:1,hard:1},
    philosophy: {easy:1,medium:1,hard:1},
    science:    {easy:1,medium:1,hard:1},
    chemistry:  {easy:1,medium:1,hard:1},
    economics:  {easy:1,medium:1,hard:1},
    tamazight:  {easy:1,medium:1,hard:1},
  },

  /* Feature counters */
  pomSessions:     0,
  aiChats:         0,
  nightSessions:   0,
  earlySessions:   0,
  ramadanSessions: 0,
  shares:          0,

  /* Badges */
  earnedBadges: [],

  /* Tasks */
  tasks: [],

  /* Wrong answers history */
  wrong: [],

  /* Daily log — FIX: was missing, caused crash in quiz showScore */
  dailyLog: {},   /* { 'YYYY-MM-DD': { xp:0, sessions:0, ok:0 } } */

  /* Pomodoro */
  timerSec:      25 * 60,
  shortBreakSec: 5  * 60,
  longBreakSec:  15 * 60,
};

/* ════════════════════════════════════════════════════════
   LOAD / SAVE / RESET
════════════════════════════════════════════════════════ */

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return _deepMerge(DEFAULT_STATE, JSON.parse(raw));
  } catch (e) {
    console.warn('[GRIT] loadState error:', e);
    return { ...DEFAULT_STATE };
  }
}

function saveState(st) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(st));
  } catch (e) {
    console.warn('[GRIT] saveState error:', e);
  }
}

function resetState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
}

function _deepMerge(defaults, saved) {
  const result = { ...defaults };
  for (const key in saved) {
    if (
      saved[key] !== null &&
      typeof saved[key] === 'object' &&
      !Array.isArray(saved[key]) &&
      typeof defaults[key] === 'object' &&
      defaults[key] !== null &&
      !Array.isArray(defaults[key])
    ) {
      result[key] = _deepMerge(defaults[key], saved[key]);
    } else {
      result[key] = saved[key];
    }
  }
  return result;
}

/* ════════════════════════════════════════════════════════
   LEVEL HELPERS
════════════════════════════════════════════════════════ */

function getLevelInfo(xp) {
  const lvl = LEVELS.find(l => xp >= l.min && xp <= l.max) || LEVELS[LEVELS.length - 1];
  const range  = lvl.max === Infinity ? 1000 : lvl.max - lvl.min + 1;
  const gained = xp - lvl.min;
  const pct    = Math.min(100, Math.round((gained / range) * 100));
  const needed = lvl.max === Infinity ? 0 : lvl.max - xp + 1;
  return { ...lvl, pct, needed };
}

function getLevelClass(xp) {
  return getLevelInfo(xp).cls;
}

/* ════════════════════════════════════════════════════════
   XP
════════════════════════════════════════════════════════ */

function addXpToState(st, amount) {
  const before = getLevelInfo(st.xp);
  st.xp = (st.xp || 0) + amount;
  const after  = getLevelInfo(st.xp);

  /* Record daily XP */
  const today = getAlgiersDate().toLocaleDateString('en-CA');
  if (!st.dailyXp) st.dailyXp = {};
  st.dailyXp[today] = (st.dailyXp[today] || 0) + amount;

  /* Prune old daily records */
  const keys = Object.keys(st.dailyXp).sort();
  while (keys.length > 60) delete st.dailyXp[keys.shift()];

  saveState(st);

  if (after.name !== before.name) {
    setTimeout(() => showLevelUp(after), 600);
  }

  return amount;
}

/* ════════════════════════════════════════════════════════
   ADAPTIVE WEIGHTS
════════════════════════════════════════════════════════ */

function updateAdaptiveWeight(st, subject, diff, correct) {
  if (!st.adaptiveWeights[subject]) return;
  const w = st.adaptiveWeights[subject];
  const diffs = ['easy','medium','hard'];
  const idx = diffs.indexOf(diff);
  if (correct) {
    w[diff] = Math.max(0.3, w[diff] - 0.2);
    if (idx < 2) w[diffs[idx+1]] = Math.min(3, w[diffs[idx+1]] + 0.1);
  } else {
    w[diff] = Math.min(3, w[diff] + 0.3);
  }
  saveState(st);
}

function suggestDiff(st, subject) {
  const w = (st.adaptiveWeights || {})[subject] || {easy:1,medium:1,hard:1};
  const total = w.easy + w.medium + w.hard;
  const r = Math.random() * total;
  if (r < w.easy)            return 'easy';
  if (r < w.easy + w.medium) return 'medium';
  return 'hard';
}

/* ════════════════════════════════════════════════════════
   RECORD ANSWER
════════════════════════════════════════════════════════ */

function recordAnswer(st, subjectKey, diff, correct) {
  /* Global counts */
  if (correct) st.ok = (st.ok||0) + 1;
  else         st.wrong = (st.wrong||0) + 1;

  /* Subject stats */
  if (!st.subjectStats[subjectKey]) st.subjectStats[subjectKey] = {ok:0,wrong:0,sessions:0};
  if (correct) st.subjectStats[subjectKey].ok++;
  else         st.subjectStats[subjectKey].wrong++;

  /* Mastery update */
  const ss    = st.subjectStats[subjectKey];
  const total = ss.ok + ss.wrong;
  if (total > 0) st.mastery[subjectKey] = Math.round((ss.ok / total) * 100);

  /* Daily count */
  const today = getAlgiersDate().toLocaleDateString('en-CA');
  if (!st.dailyCount) st.dailyCount = {};
  st.dailyCount[today] = (st.dailyCount[today] || 0) + 1;

  /* Prune */
  const keys = Object.keys(st.dailyCount).sort();
  while (keys.length > 60) delete st.dailyCount[keys.shift()];

  /* Adaptive */
  updateAdaptiveWeight(st, subjectKey, diff, correct);

  /* Study day */
  if (!st.studyDays) st.studyDays = {};
  st.studyDays[today] = true;

  /* Streak update */
  if (st.lastStudyDate !== today) {
    const yest = new Date(getAlgiersDate()); yest.setDate(yest.getDate()-1);
    const yKey = yest.toLocaleDateString('en-CA');
    if (st.lastStudyDate === yKey) st.streak = (st.streak||0)+1;
    else if (!st.lastStudyDate)    st.streak = 1;
    // else streak already broken (handled in checkStreak on boot)
    st.lastStudyDate = today;
  }

  saveState(st);
}

/* ════════════════════════════════════════════════════════
   STRENGTHS & WEAKNESSES
════════════════════════════════════════════════════════ */

function getStrengthsWeaknesses(st) {
  const entries = Object.entries(st.subjectStats || {}).map(([k,v]) => {
    const total = (v.ok||0) + (v.wrong||0);
    const rate  = total > 0 ? Math.round((v.ok/total)*100) : -1;
    return { key:k, subj:SUBJECTS[k], rate, total };
  }).filter(e => e.total > 0);

  if (!entries.length) return { strengths:[], weaknesses:[] };

  const sorted     = [...entries].sort((a,b) => b.rate - a.rate);
  const strengths  = sorted.slice(0,3);
  const weaknesses = sorted.slice(-3).reverse();
  return { strengths, weaknesses };
}

/* ════════════════════════════════════════════════════════
   BADGE CHECK
════════════════════════════════════════════════════════ */

function checkAndAwardBadges(st) {
  let awarded = false;
  BADGES.forEach(badge => {
    if (!(st.earnedBadges||[]).includes(badge.id) && badge.check(st)) {
      if (!st.earnedBadges) st.earnedBadges = [];
      st.earnedBadges.push(badge.id);
      awarded = true;
      saveState(st);
      setTimeout(() => showBadgePopup(badge), 800);
    }
  });
  return awarded;
}

/* ════════════════════════════════════════════════════════
   DATE HELPERS (exported globally)
════════════════════════════════════════════════════════ */

function getAlgiersDate() {
  return new Date(new Date().toLocaleString('en-US', { timeZone:'Africa/Algiers' }));
}

function getTodayStr() {
  return getAlgiersDate().toLocaleDateString('en-CA');
}
