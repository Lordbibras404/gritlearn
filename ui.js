/* ============================================================
   GRIT Learn v7 — UI Layer
   Toasts · Popups · Dashboard · Profile · Leaderboard
   Developer: @ZarVenox · Channel: @bacDz_09
   ============================================================ */
'use strict';

/* ════════════════════════════════════════════════════════
   TOAST SYSTEM
════════════════════════════════════════════════════════ */

const _toastQueue  = [];
let   _toastActive = false;

function showToast(msg, type = 'info') {
  _toastQueue.push({ msg, type });
  if (!_toastActive) _processToastQueue();
}

function _processToastQueue() {
  if (!_toastQueue.length) { _toastActive = false; return; }
  _toastActive = true;

  const { msg, type } = _toastQueue.shift();
  const container = document.getElementById('toastContainer');
  if (!container) { _toastActive = false; return; }

  const el  = document.createElement('div');
  el.className = `toast-item toast-${type}`;
  el.textContent = msg;
  container.appendChild(el);

  // Animate in
  requestAnimationFrame(() => el.classList.add('show'));

  setTimeout(() => {
    el.classList.remove('show');
    el.classList.add('hide');
    setTimeout(() => {
      el.remove();
      setTimeout(_processToastQueue, 150);
    }, 300);
  }, 2400);
}

/* ════════════════════════════════════════════════════════
   XP FLOAT POPUP
════════════════════════════════════════════════════════ */

function showXpFloat(amount) {
  const el = document.getElementById('xpPopup');
  if (!el) return;
  const txt = document.getElementById('xpPopupText');
  if (txt) txt.textContent = `+${amount} XP 🌟`;
  el.classList.remove('show');
  void el.offsetWidth; // reflow
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

/* ════════════════════════════════════════════════════════
   LEVEL UP POPUP
════════════════════════════════════════════════════════ */

function showLevelUp(levelInfo) {
  const popup = document.getElementById('levelUpPopup');
  if (!popup) return;

  const icon = document.getElementById('luIcon');
  const title = document.getElementById('luTitle');
  const sub   = document.getElementById('luSub');

  if (icon)  icon.textContent  = levelInfo.icon;
  if (title) title.textContent = `${levelInfo.name} ${levelInfo.icon}`;
  if (sub)   sub.textContent   = `وصلت إلى مستوى ${levelInfo.name}! واصل الإنجاز 💪`;

  popup.style.display = 'flex';
  requestAnimationFrame(() => popup.classList.add('show'));

  showToast(`🎉 مستوى جديد: ${levelInfo.name} ${levelInfo.icon}`, 'success');
}

function closeLevelUp() {
  const popup = document.getElementById('levelUpPopup');
  if (popup) {
    popup.classList.remove('show');
    setTimeout(() => popup.style.display = 'none', 400);
  }
}

/* ════════════════════════════════════════════════════════
   BADGE POPUP
════════════════════════════════════════════════════════ */

function showBadgePopup(badge) {
  const popup = document.getElementById('badgePopup');
  if (!popup) return;
  const icon = document.getElementById('bpIcon');
  const name = document.getElementById('bpName');
  const desc = document.getElementById('bpDesc');
  if (icon) icon.textContent = badge.icon;
  if (name) name.textContent = badge.name;
  if (desc) desc.textContent = badge.desc;
  popup.style.display = 'flex';
  requestAnimationFrame(() => popup.classList.add('show'));
}

function closeBadgePopup() {
  const popup = document.getElementById('badgePopup');
  if (popup) {
    popup.classList.remove('show');
    setTimeout(() => popup.style.display = 'none', 400);
  }
}

/* ════════════════════════════════════════════════════════
   AVATAR
════════════════════════════════════════════════════════ */

function triggerAvatarUpload() {
  document.getElementById('avatarInput')?.click();
}

function handleAvatarChange(input) {
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const st = loadState();
    st.avatar = e.target.result;
    st.hasCustomAvatar = true;
    saveState(st);
    // Update all avatar spots
    const main = document.getElementById('profileAvatarMain');
    if (main) main.innerHTML = `<img src="${st.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    const homeBtn = document.getElementById('homeAvatarBtn');
    if (homeBtn) homeBtn.innerHTML = `<img src="${st.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:13px">`;
    showToast('📸 تم تحديث الصورة', 'success');
  };
  reader.readAsDataURL(file);
}

/* ════════════════════════════════════════════════════════
   DASHBOARD RENDER
════════════════════════════════════════════════════════ */

function renderDashboard() {
  const st   = loadState();
  const info = getLevelInfo(st.xp || 0);
  const total = (st.ok||0) + (st.wrong||0);
  const acc   = total > 0 ? Math.round(((st.ok||0)/total)*100) : 0;

  /* Hero */
  _setEl('pointsXpNum',   (st.xp||0).toLocaleString('ar-DZ'));
  _setEl('pointsHeroSub', `${info.needed.toLocaleString('ar-DZ')} XP للمستوى التالي`);
  _setEl('pointsLevelName', `${info.icon} مستوى ${info.name}`);
  _setEl('pointsLevelNext', `${info.needed.toLocaleString('ar-DZ')} XP متبقي`);

  const lvlFill = document.getElementById('pointsLvlFill');
  if (lvlFill) setTimeout(() => lvlFill.style.width = `${info.pct}%`, 300);

  /* Hero stats */
  _setEl('phStatStreak',  (st.streak||0).toString());
  _setEl('phStatTotal',   total.toLocaleString('ar-DZ'));
  _setEl('phStatAcc',     `${acc}%`);
  _setEl('phStatSessions',(st.ses||0).toString());
  _setEl('phStatBadges',  (st.earnedBadges||[]).length.toString());
  _setEl('phStatRank',    `#${_calcRank(st)}`);

  /* Mini grid */
  _setEl('dashCorrect', (st.ok||0).toLocaleString('ar-DZ'));
  _setEl('dashWrong',   (st.wrong||0).toLocaleString('ar-DZ'));
  _setEl('dashPomo',    (st.pomSessions||0).toString());
  _setEl('dashDays',    (st.streak||0).toString());

  /* Weekly bars */
  _renderDashWeekly(st);

  /* Subject rows */
  _renderSubjectBars(st);

  /* Strengths/Weaknesses */
  _renderSwSection(st);

  /* AI tip */
  const sw = getStrengthsWeaknesses(st);
  if (sw.weaknesses[0]) {
    _setEl('dashAiTip', `💡 ركز على ${sw.weaknesses[0].subj?.n} — دقتك ${sw.weaknesses[0].rate}% فقط. جرّب المساعد الذكي للشرح.`);
  }
}

function _renderDashWeekly(st) {
  const c = document.getElementById('dashWeeklyBars');
  if (!c) return;
  const now  = getAlgiersDate();
  const DAYS = ['أح','اث','ثل','أر','خم','جم','سب'];
  const data = Array.from({length:7},(_,i)=>{
    const d = new Date(now); d.setDate(d.getDate()-(6-i));
    const key = d.toLocaleDateString('en-CA');
    return { d, n:(st.dailyCount||{})[key]||0 };
  });
  const max = Math.max(1,...data.map(x=>x.n));
  c.innerHTML = data.map((x,i)=>{
    const h = Math.round((x.n/max)*100);
    const isToday = i===6;
    return `
      <div class="home-weekly-col">
        <div class="home-wbar ${isToday?'today':x.n>0?'active':''}" style="height:${Math.max(5,h)}%" title="${x.n}"></div>
        <div class="home-wday ${isToday?'today':''}">${DAYS[x.d.getDay()]}</div>
      </div>`;
  }).join('');
}

function _renderSubjectBars(st) {
  const c = document.getElementById('dashSubjectRows');
  if (!c) return;
  const branch  = st.branch || 'science';
  const allowed = BRANCHES[branch]?.s || Object.keys(SUBJECTS);
  c.innerHTML = allowed.map(key => {
    const info = SUBJECTS[key];
    const ss   = (st.subjectStats||{})[key] || {ok:0,wrong:0};
    const tot  = ss.ok + ss.wrong;
    const pct  = tot > 0 ? Math.round((ss.ok/tot)*100) : 0;
    const mast = Math.round((st.mastery||{})[key]||0);
    return `
      <div class="dash-subj-row">
        <div class="dash-subj-icon" style="background:${info.c}15">${info.i}</div>
        <div class="dash-subj-body">
          <div class="dash-subj-name">${info.n}</div>
          <div class="dash-subj-bar-wrap">
            <div class="dash-subj-bar">
              <div class="dash-subj-fill" style="width:${mast}%;background:linear-gradient(90deg,${info.c},${info.c}88)"></div>
            </div>
          </div>
        </div>
        <div class="dash-subj-right">
          <div class="dash-subj-pct" style="color:${info.c}">${mast}%</div>
          <div class="dash-subj-tot" style="color:var(--text4)">${tot} س</div>
        </div>
      </div>`;
  }).join('');
}

function _renderSwSection(st) {
  const { strengths, weaknesses } = getStrengthsWeaknesses(st);

  const sc = document.getElementById('dashStrengths');
  const wc = document.getElementById('dashWeaknesses');

  const _renderPill = (e) => {
    const info = SUBJECTS[e.key] || {n:e.key,i:'📚',c:'#6c63ff'};
    return `<div class="dash-sw-pill" style="--sw-c:${info.c}">
      <span>${info.i}</span>
      <span style="font-size:12px;font-weight:800">${info.n}</span>
      <span style="font-size:11px;opacity:0.7">${e.rate}%</span>
    </div>`;
  };

  if (sc) sc.innerHTML = strengths.length  ? `<div style="display:flex;flex-wrap:wrap;gap:8px">${strengths.map(_renderPill).join('')}</div>`  : '<div style="color:var(--text4);font-size:12px;padding:8px">ابدأ التمارين لرؤية نقاط قوتك</div>';
  if (wc) wc.innerHTML = weaknesses.length ? `<div style="display:flex;flex-wrap:wrap;gap:8px">${weaknesses.map(_renderPill).join('')}</div>` : '<div style="color:var(--text4);font-size:12px;padding:8px">رائع! لا توجد نقاط ضعف واضحة</div>';
}

/* ════════════════════════════════════════════════════════
   PROFILE RENDER
════════════════════════════════════════════════════════ */

function renderProfile() {
  const st   = loadState();
  const info = getLevelInfo(st.xp||0);
  const total = (st.ok||0)+(st.wrong||0);
  const acc   = total>0 ? Math.round(((st.ok||0)/total)*100) : 0;

  /* Avatar */
  const avatarEl = document.getElementById('profileAvatarMain');
  if (avatarEl) {
    if (st.avatar) avatarEl.innerHTML = `<img src="${st.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    else avatarEl.textContent = (st.name||'ط')[0].toUpperCase();
  }

  /* Info */
  _setEl('profileName',       st.name || 'طالب');
  _setEl('profileHandle',     `@bac2026`);
  _setEl('profileLevelPill',  `${info.icon} مستوى ${info.name}`);

  const branchInfo = BRANCHES[st.branch||'science'];
  _setEl('profileBranch', `${branchInfo?.i||'🎓'} ${branchInfo?.n||'علوم'}`);

  /* Quick stats */
  _setEl('profileQsXp',     (st.xp||0).toLocaleString('ar-DZ'));
  _setEl('profileQsStreak', (st.streak||0).toString());
  _setEl('profileQsTotal',  total.toLocaleString('ar-DZ'));
  _setEl('profileQsAcc',    `${acc}%`);

  /* Branch tabs */
  document.querySelectorAll('.profile-branch-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.branch === (st.branch||'science'));
  });
  document.querySelectorAll('.profile-branch-tab').forEach(tab => {
    tab.onclick = () => {
      const st2 = loadState();
      st2.branch = tab.dataset.branch;
      saveState(st2);
      renderProfile();
      showToast(`✅ تم تغيير الشعبة إلى ${BRANCHES[tab.dataset.branch]?.n}`, 'success');
    };
  });

  /* Timer sub */
  const timerMins = Math.round((st.timerSec||1500)/60);
  _setEl('profileTimerSub', `${timerMins} دقيقة`);
  _setEl('profileTimerVal', `${timerMins} د`);
  _setEl('settingsBranchSub', branchInfo?.n||'علوم');
  _setEl('settingsTimerVal', `${timerMins} د`);

  /* Badges */
  const bc = document.getElementById('profileBadgesGrid');
  if (bc) {
    bc.innerHTML = BADGES.map(b => {
      const earned = (st.earnedBadges||[]).includes(b.id);
      return `
        <div class="profile-badge ${earned?'earned':'locked'}" title="${b.desc}"
             onclick="showToast('${b.name}: ${b.desc}','${earned?'success':'info'}')">
          <div class="profile-badge-icon">${b.icon}</div>
          <div class="profile-badge-name">${b.name}</div>
        </div>`;
    }).join('');
  }

  /* Subject bars */
  const sbc = document.getElementById('profileSubjectBars');
  if (sbc) {
    const branch  = st.branch || 'science';
    const allowed = BRANCHES[branch]?.s || Object.keys(SUBJECTS);
    sbc.innerHTML = allowed.map(key => {
      const info2 = SUBJECTS[key];
      const mast  = Math.round((st.mastery||{})[key]||0);
      return `
        <div class="profile-subj-row">
          <span class="profile-subj-icon">${info2.i}</span>
          <div class="profile-subj-body">
            <div class="profile-subj-top">
              <span class="profile-subj-name">${info2.n}</span>
              <span class="profile-subj-pct" style="color:${info2.c}">${mast}%</span>
            </div>
            <div class="profile-subj-bar">
              <div class="profile-subj-fill" style="width:${mast}%;background:${info2.c}"></div>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  /* Theme toggle */
  updateThemeToggles(st.theme === 'dark');
}

/* ════════════════════════════════════════════════════════
   LEADERBOARD RENDER
════════════════════════════════════════════════════════ */

function renderLeaderboard() {
  const st = loadState();
  const info = getLevelInfo(st.xp||0);

  _setEl('lbMyRankVal', `#${_calcRank(st)}`);
  _setEl('lbMyName',    st.name || 'أنت');
  _setEl('lbMyXp',      `${(st.xp||0).toLocaleString('ar-DZ')} XP`);

  /* Generate mock leaderboard */
  const mockUsers = _generateMockLeaderboard(st);

  /* Podium top 3 */
  const podium = document.getElementById('lbPodium');
  if (podium && mockUsers.length >= 3) {
    const [first, second, third] = mockUsers;
    podium.innerHTML = `
      <div class="lb-podium-wrap">
        <div class="lb-podium-item second">
          <div class="lb-podium-avatar">${second.avatar}</div>
          <div class="lb-podium-crown">🥈</div>
          <div class="lb-podium-name">${second.name}</div>
          <div class="lb-podium-xp">${second.xp.toLocaleString('ar-DZ')}</div>
          <div class="lb-podium-block" style="height:80px;background:linear-gradient(180deg,#9ca3af,#6b7280)">
            <div class="lb-podium-rank">2</div>
          </div>
        </div>
        <div class="lb-podium-item first">
          <div class="lb-podium-crown first-crown">🏆</div>
          <div class="lb-podium-avatar large">${first.avatar}</div>
          <div class="lb-podium-name">${first.name}</div>
          <div class="lb-podium-xp">${first.xp.toLocaleString('ar-DZ')}</div>
          <div class="lb-podium-block" style="height:110px;background:linear-gradient(180deg,#fcd34d,#d97706)">
            <div class="lb-podium-rank">1</div>
          </div>
        </div>
        <div class="lb-podium-item third">
          <div class="lb-podium-avatar">${third.avatar}</div>
          <div class="lb-podium-crown">🥉</div>
          <div class="lb-podium-name">${third.name}</div>
          <div class="lb-podium-xp">${third.xp.toLocaleString('ar-DZ')}</div>
          <div class="lb-podium-block" style="height:60px;background:linear-gradient(180deg,#cd7f32,#b45309)">
            <div class="lb-podium-rank">3</div>
          </div>
        </div>
      </div>`;
  }

  /* List */
  const list = document.getElementById('lbList');
  if (list) {
    list.innerHTML = mockUsers.slice(3).map((u, i) => {
      const rank = i + 4;
      const isMe = u.isMe;
      return `
        <div class="lb-list-item ${isMe?'is-me':''}">
          <div class="lb-list-rank">${rank}</div>
          <div class="lb-list-avatar">${u.avatar}</div>
          <div class="lb-list-body">
            <div class="lb-list-name">${u.name}${isMe?' (أنت)':''}</div>
            <div class="lb-list-sub">${u.level}</div>
          </div>
          <div class="lb-list-xp" style="color:${isMe?'var(--accent)':'var(--text2)'}">${u.xp.toLocaleString('ar-DZ')} XP</div>
        </div>`;
    }).join('');
  }
}

function switchLbPeriod(el, period) {
  document.querySelectorAll('.lb-period-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderLeaderboard(); // refresh (same mock data for now)
}

function _generateMockLeaderboard(st) {
  const myXp   = st.xp || 0;
  const myRank = _calcRank(st);
  const names  = ['أحمد','فاطمة','يوسف','مريم','خالد','نور','عمر','زينب','كريم','أسماء','رامي','هيبة','تامر','لينة'];
  const avts   = ['👨‍🎓','👩‍🎓','🧑‍🎓','👩‍🏫','🧑','👧','👦','👩','🧑‍💻','👩‍💻'];

  const users = names.slice(0,12).map((n,i) => {
    const rank = i+1;
    const xp   = rank < myRank
      ? myXp + (myRank - rank) * Math.floor(Math.random()*200+100)
      : rank === myRank ? myXp
      : Math.max(0, myXp - (rank - myRank) * Math.floor(Math.random()*150+50));
    const lvl = getLevelInfo(xp);
    return { name:n, avatar:avts[i%avts.length], xp, level:`${lvl.icon} ${lvl.name}`, isMe:false };
  });

  /* Insert self at correct rank */
  const meEntry = {
    name: st.name||'أنت', avatar:st.avatar?'📸':'🎓',
    xp: myXp, level:`${getLevelInfo(myXp).icon} ${getLevelInfo(myXp).name}`, isMe:true,
  };
  users.splice(Math.min(myRank-1, users.length), 0, meEntry);

  return users.sort((a,b) => b.xp - a.xp);
}

function _calcRank(st) {
  const xp = st.xp||0;
  if (xp>=5000) return Math.max(1, 5  + Math.floor(xp/1000));
  if (xp>=2000) return Math.max(6, 20 + Math.floor(xp/500));
  if (xp>=500)  return Math.max(21,80 + Math.floor(xp/100));
  return Math.max(80, 300 + Math.floor((500-xp)/5));
}

/* ════════════════════════════════════════════════════════
   POMODORO TASK SHEET
════════════════════════════════════════════════════════ */

function renderPomoTasks() {
  const st      = loadState();
  const branch  = st.branch || 'science';
  const subjects = BRANCHES[branch]?.s || Object.keys(SUBJECTS);
  const list    = document.getElementById('pomoTaskList');
  if (!list) return;

  list.innerHTML = subjects.map(key => {
    const info = SUBJECTS[key];
    const mast = Math.round((st.mastery||{})[key]||0);
    return `
      <div class="bs-option" onclick="setPomoSubject('${key}')">
        <div style="font-size:22px">${info.i}</div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:900;color:var(--text)">${info.n}</div>
          <div style="font-size:11px;color:var(--text3);font-weight:600">إتقان: ${mast}%</div>
        </div>
        <div style="font-size:11px;font-weight:800;color:${info.c};background:${info.c}15;border-radius:999px;padding:4px 10px">${mast}%</div>
      </div>`;
  }).join('');
}

function selectPomoTask() {
  renderPomoTasks();
  const sheet   = document.getElementById('pomoTaskSheet');
  const overlay = document.getElementById('overlay');
  if (sheet)   sheet.classList.add('show');
  if (overlay) overlay.style.display = 'block';
}

function setPomoSubject(key) {
  const info = SUBJECTS[key];
  _setEl('pomoTaskLabel', `${info.i} ${info.n}`);
  const dot = document.querySelector('.pomo-task-chip-dot');
  if (dot) dot.style.background = info.c;
  const sheet   = document.getElementById('pomoTaskSheet');
  const overlay = document.getElementById('overlay');
  if (sheet)   sheet.classList.remove('show');
  if (overlay) overlay.style.display = 'none';
}

/* ════════════════════════════════════════════════════════
   SHARE RESULT
════════════════════════════════════════════════════════ */

function shareResult(subjKey, score, total, xp) {
  const st   = loadState();
  const subj = SUBJECTS[subjKey];
  const pct  = Math.round((score/total)*100);
  const lvl  = getLevelInfo(st.xp||0);
  const text = `🎯 نتيجتي في GRIT Learn\n📚 ${subj?.n||subjKey}\n✅ ${score}/${total} — ${pct}%\n⚡ +${xp} XP | 🔥 ${st.streak||0} يوم | ${lvl.icon} ${lvl.name}\n\n📢 @bacDz_09 — BAC 2026 🇩🇿`;
  if (window.Telegram?.WebApp) {
    Telegram.WebApp.openTelegramLink('https://t.me/share/url?text=' + encodeURIComponent(text));
  } else if (navigator.share) {
    navigator.share({ title:'GRIT Learn', text });
  } else {
    navigator.clipboard?.writeText(text).then(() => showToast('📋 تم نسخ النتيجة', 'success'));
  }
}

/* ════════════════════════════════════════════════════════
   SUMMARIES
════════════════════════════════════════════════════════ */

let _summFilter = 'all';
let _summSearch = '';

function renderSummaries() {
  if (typeof SUMMARIES_DATA === 'undefined') return;
  const st = loadState();
  filterSummaries('');
  _setEl('summCountChip', `${SUMMARIES_DATA.length} درس`);
}

function filterSummaries(search) {
  _summSearch = search.toLowerCase();
  _applySummFilter();
}

function filterSummSubj(el, subj) {
  _summFilter = subj;
  document.querySelectorAll('.summ-filter-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  _applySummFilter();
}

function _applySummFilter() {
  if (typeof SUMMARIES_DATA === 'undefined') return;
  const grid = document.getElementById('summGrid');
  if (!grid) return;

  let filtered = SUMMARIES_DATA;
  if (_summFilter !== 'all') filtered = filtered.filter(s => s.subject === _summFilter);
  if (_summSearch) filtered = filtered.filter(s =>
    s.title.toLowerCase().includes(_summSearch) ||
    s.summary?.toLowerCase().includes(_summSearch)
  );

  grid.innerHTML = filtered.map(s => {
    const info = SUBJECTS[s.subject] || {n:s.subject,i:'📚',c:'#6c63ff'};
    return `
      <div class="summ-card" onclick="openSummary('${s.id}')" style="--card-c:${info.c}">
        <div class="summ-card-icon">${info.i}</div>
        <div class="summ-card-body">
          <div class="summ-card-subject" style="color:${info.c}">${info.n}</div>
          <div class="summ-card-title">${s.title}</div>
          <div class="summ-card-preview">${(s.summary||'').substring(0,80)}...</div>
        </div>
        <div class="summ-card-arrow">‹</div>
      </div>`;
  }).join('') || '<div class="summ-empty"><div style="font-size:40px">🔍</div><div>لا توجد نتائج</div></div>';
}

function openSummary(id) {
  if (typeof SUMMARIES_DATA === 'undefined') return;
  const s = SUMMARIES_DATA.find(x => x.id === id);
  if (!s) return;
  const info = SUBJECTS[s.subject] || {n:s.subject,i:'📚',c:'#6c63ff'};

  _setEl('summReaderTitle',   s.title);
  _setEl('summReaderBigTitle', s.title);
  _setEl('summReaderMeta',    `${info.i} ${info.n}`);

  const body = document.getElementById('summReaderBody');
  if (body) body.innerHTML = (s.content || s.summary || '').replace(/\n/g,'<br>');

  const list   = document.getElementById('summListView');
  const reader = document.getElementById('summReaderView');
  if (list)   list.style.display   = 'none';
  if (reader) reader.style.display = 'flex';
}

function closeSummReader() {
  const list   = document.getElementById('summListView');
  const reader = document.getElementById('summReaderView');
  if (list)   list.style.display   = 'block';
  if (reader) reader.style.display = 'none';
}

function shareSumm() {
  const title = document.getElementById('summReaderBigTitle')?.textContent;
  if (!title) return;
  const text = `📚 ملخص: ${title}\n\n@bacDz_09 — GRIT Learn BAC 2026 🇩🇿`;
  if (window.Telegram?.WebApp)
    Telegram.WebApp.openTelegramLink('https://t.me/share/url?text='+encodeURIComponent(text));
  else if (navigator.share) navigator.share({ title:'GRIT Learn', text });
}

/* ════════════════════════════════════════════════════════
   UTIL
════════════════════════════════════════════════════════ */

/* FIX: _setEl was a duplicate of setEl in app.js — now aliased to avoid breakage */
function _setEl(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
