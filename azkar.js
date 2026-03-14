/* ============================================================
   GRIT Learn — Azkar Screen
   منطق شاشة الأذكار
   ============================================================ */

'use strict';

let _currentAzkarCat = null;
let _azkarCounts = {};

/* ══ فتح فئة أذكار ══ */
function openAzkarCategory(cat) {
  _currentAzkarCat = cat;
  _azkarCounts = {};

  const data = AZKAR_DATA[cat];
  if (!data) return;

  document.getElementById('azkarCatsView').style.display  = 'none';
  document.getElementById('azkarListView').style.display  = 'block';
  document.getElementById('azkarScreenTitle').textContent  = data.title;
  document.getElementById('azkarBackBtn').style.display    = 'flex';

  const container = document.getElementById('azkarItemsList');
  container.innerHTML = data.items.map((z, i) => `
    <div class="zikr-card">
      <div class="zikr-arabic">${z.a}</div>
      <div class="zikr-meaning">${z.m}</div>
      <div class="zikr-footer">
        <span class="zikr-repeat">${z.r}</span>
        <div class="zikr-counter">
          <button class="zikr-tap-btn" onclick="zikrTap(${i})">+</button>
          <div class="zikr-count-num" id="zc_${i}">0</div>
          <button class="zikr-done-btn" onclick="zikrMarkDone(${i})">✓ تم</button>
        </div>
      </div>
    </div>`).join('');
}

/* ══ الضغط على الذكر ══ */
function zikrTap(i) {
  _azkarCounts[i] = (_azkarCounts[i] || 0) + 1;
  const el = document.getElementById('zc_' + i);
  if (el) {
    el.textContent = _azkarCounts[i];
    el.classList.remove('bumped');
    void el.offsetWidth;
    el.classList.add('bumped');
    setTimeout(() => el.classList.remove('bumped'), 350);
  }
  const st = loadState();
  st.xp = (st.xp || 0) + 1;
  saveState(st);
}

/* ══ تمييز الذكر كمكتمل ══ */
function zikrMarkDone(i) {
  const el = document.getElementById('zc_' + i);
  if (el) el.style.color = '#059669';
  showToast('✅', 'أحسنت! تقبل الله');
}

/* ══ إعادة تعيين عرض الأذكار ══ */
function resetAzkarView() {
  _currentAzkarCat = null;
  _azkarCounts = {};
  const cats = document.getElementById('azkarCatsView');
  const list  = document.getElementById('azkarListView');
  const title = document.getElementById('azkarScreenTitle');
  const backBtn = document.getElementById('azkarBackBtn');

  if (cats)    cats.style.display  = 'grid';
  if (list)    list.style.display  = 'none';
  if (title)   title.textContent    = 'الذكرة 🤲';
  if (backBtn) backBtn.style.display = 'none';
}

/* ══ زر الرجوع في الأذكار ══ */
function azkarGoBack() {
  if (_currentAzkarCat) {
    resetAzkarView();
  } else {
    nav('homeScreen', document.getElementById('nHome'));
  }
}

/* ══ بناء الفئات ══ */
function renderAzkarCategories() {
  const container = document.getElementById('azkarCatsView');
  if (!container) return;
  container.innerHTML = Object.entries(AZKAR_DATA).map(([key, cat]) => `
    <button class="azkar-cat-card" style="background:${cat.color}"
      onclick="openAzkarCategory('${key}')">
      <span class="azkar-cat-icon">${cat.icon}</span>
      <div class="azkar-cat-name">${cat.title}</div>
      <div class="azkar-cat-sub">${cat.items.length} أذكار</div>
    </button>`).join('');
}

/* ══ Zikr counter view (used by index.html zikrView) ══ */

const AZKAR_CATEGORIES = {
  morning: { title:'أذكار الصباح', items: [] },
  evening: { title:'أذكار المساء', items: [] },
  sleep:   { title:'أذكار النوم',  items: [] },
  wakeup:  { title:'أذكار الاستيقاظ', items: [] },
  prayer:  { title:'أذكار بعد الصلاة', items: [] },
  study:   { title:'أدعية الدراسة', items: [] },
  exam:    { title:'أدعية الامتحان', items: [] },
  general: { title:'أذكار عامة',   items: [] },
};

let _zikrCat = null;
let _zikrIdx = 0;
let _zikrCount = 0;
let _zikrTarget = 1;

function openZikr(cat) {
  _zikrCat = cat;
  _zikrIdx = 0;
  _zikrCount = 0;
  const info = AZKAR_CATEGORIES[cat] || { title: cat, items: [] };
  setEl('zikrTitle', info.title);
  document.getElementById('azkarCatView').style.display = 'none';
  document.getElementById('zikrView').style.display = 'flex';
  _renderZikrCard();
}

function closeZikr() {
  document.getElementById('zikrView').style.display = 'none';
  document.getElementById('azkarCatView').style.display = 'block';
}

function tapZikr() {
  _zikrCount++;
  const countEl = document.getElementById('zikrCount');
  if (countEl) {
    countEl.textContent = _zikrCount;
    countEl.classList.remove('bumped');
    void countEl.offsetWidth;
    countEl.classList.add('bumped');
    setTimeout(() => countEl.classList.remove('bumped'), 350);
  }
  const btn = document.getElementById('zikrBtn');
  if (btn) {
    btn.style.transform = 'scale(0.92)';
    setTimeout(() => btn.style.transform = '', 120);
  }
  if (navigator.vibrate) navigator.vibrate(30);
  if (_zikrCount >= _zikrTarget) {
    showToast('✅ أحسنت! واصل', 'success');
    setTimeout(() => _nextZikr(), 500);
  }
}

function resetZikr() {
  _zikrCount = 0;
  const el = document.getElementById('zikrCount');
  if (el) el.textContent = '0';
}

function _nextZikr() {
  _zikrIdx++;
  _zikrCount = 0;
  _renderZikrCard();
}

function _renderZikrCard() {
  const cat = _zikrCat ? (AZKAR_CATEGORIES[_zikrCat] || {}) : {};
  const items = cat.items || [];
  const total = Math.max(items.length, 1);
  setEl('zikrProgressPill', `${_zikrIdx + 1} / ${total}`);
  if (items[_zikrIdx]) {
    const z = items[_zikrIdx];
    setEl('zikrArabic', z.a || z.text || '');
    setEl('zikrTrans', z.m || z.meaning || '');
    setEl('zikrRepeat', `يُكرر ${z.r || z.repeat || 1} مرة`);
    _zikrTarget = parseInt(z.r || z.repeat || 1) || 1;
  } else {
    setEl('zikrArabic', 'سبحان الله وبحمده');
    setEl('zikrTrans',  'سبحان الله وبحمده سبحان الله العظيم');
    setEl('zikrRepeat', 'يُكرر 100 مرة');
    _zikrTarget = 100;
  }
  const countEl = document.getElementById('zikrCount');
  if (countEl) countEl.textContent = '0';
}
