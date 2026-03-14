/* ============================================================
   GRIT Learn v5.0 — Leaderboard
   ترتيب محلي + مشاركة Telegram
   ============================================================ */
'use strict';

/* بيانات وهمية واقعية للتشجيع */
const LB_MOCK_PLAYERS = [
  { name:'ياسين بلقاسم',  xp:4850, streak:22, branch:'science', avatar:'ي' },
  { name:'أميرة حمداني',  xp:4200, streak:18, branch:'math_b',  avatar:'أ' },
  { name:'عمر زروق',      xp:3700, streak:15, branch:'science', avatar:'ع' },
  { name:'نور الهدى',     xp:3100, streak:12, branch:'letters', avatar:'ن' },
  { name:'رياض مزيان',    xp:2900, streak:10, branch:'tech',    avatar:'ر' },
  { name:'سارة بن علي',   xp:2400, streak:9,  branch:'mgmt',   avatar:'س' },
  { name:'أنس طاهري',     xp:2100, streak:7,  branch:'science', avatar:'ا' },
  { name:'لمياء قاسمي',   xp:1800, streak:6,  branch:'letters', avatar:'ل' },
  { name:'هاني بوعزيز',   xp:1500, streak:5,  branch:'math_b',  avatar:'ه' },
  { name:'دنيا مسعود',    xp:1200, streak:4,  branch:'mgmt',   avatar:'د' },
];

/* ══ Render Leaderboard ══ */
function renderLeaderboard() {
  const players = buildLeaderboard();
  renderTop3(players);
  renderLBList(players);
  renderMyRank(players);
}

/* ══ Build Players Array ══ */
function buildLeaderboard() {
  const myEntry = {
    name:   state.name || 'أنت',
    xp:     state.xp,
    streak: state.streak,
    branch: state.branch || 'all',
    avatar: state.avatar || (state.name?.[0] || 'أ'),
    isMe:   true,
  };

  // Mix mock players with the user
  let players = [...LB_MOCK_PLAYERS.map(p => ({ ...p, isMe: false })), myEntry];

  // Sort by XP desc
  players.sort((a, b) => b.xp - a.xp);

  // Add rank
  players = players.map((p, i) => ({ ...p, rank: i + 1 }));

  return players;
}

/* ══ Top 3 Podium ══ */
function renderTop3(players) {
  const top3 = players.slice(0, 3);
  const container = document.getElementById('lbTop3');
  if (!container) return;

  const orders  = ['second', 'first', 'third'];
  const heights = ['second', 'first', 'third'];
  const medals  = ['🥈', '🥇', '🥉'];
  const displayOrder = [top3[1], top3[0], top3[2]]; // 2nd, 1st, 3rd

  container.innerHTML = displayOrder.map((p, i) => {
    if (!p) return '';
    const cls    = orders[i];
    const medal  = medals[i];
    const isMe   = p.isMe;
    const lvl    = getLevel(p.xp);
    const avatarContent = (typeof p.avatar === 'string' && p.avatar.startsWith('data:'))
      ? `<img src="${p.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
      : p.avatar;

    return `
      <div class="lb-top3-item ${cls} ${isMe ? 'is-me' : ''}">
        <div class="lb-top3-avatar ${isMe ? 'me-ring' : ''}">
          ${cls === 'first' ? '<span class="lb-crown">👑</span>' : ''}
          ${avatarContent}
        </div>
        <div class="lb-top3-name">${p.name}${isMe ? ' (أنت)' : ''}</div>
        <div class="lb-top3-xp">⚡ ${p.xp.toLocaleString()}</div>
        <div class="lb-top3-medal">${medal}</div>
        <div class="lb-top3-podium">${lvl.icon}</div>
      </div>`;
  }).join('');
}

/* ══ Full List (rank 4+) ══ */
function renderLBList(players) {
  const container = document.getElementById('lbList');
  if (!container) return;

  const rest = players.slice(3);
  if (!rest.length) { container.innerHTML = ''; return; }

  container.innerHTML = rest.map(p => {
    const isMe = p.isMe;
    const lvl  = getLevel(p.xp);
    const branch = BRANCHES[p.branch]?.n || '';
    const avatarContent = (typeof p.avatar === 'string' && p.avatar.startsWith('data:'))
      ? `<img src="${p.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
      : p.avatar;

    return `
      <div class="lb-item ${isMe ? 'me' : ''}">
        <div class="lb-rank ${p.rank <= 3 ? 'top' : ''}">${p.rank}</div>
        <div class="lb-avatar">${avatarContent}</div>
        <div class="lb-info">
          <div class="lb-name">${p.name}${isMe ? ' 👈' : ''}</div>
          <div class="lb-level">${lvl.icon} ${lvl.name} ${branch ? '· ' + branch : ''}</div>
        </div>
        <div class="lb-xp">⚡ ${p.xp.toLocaleString()}</div>
      </div>`;
  }).join('');
}

/* ══ My Rank Banner ══ */
function renderMyRank(players) {
  const me = players.find(p => p.isMe);
  if (!me) return;

  const lvl = getLevel(me.xp);
  setText('lbMyRankNum',  '#' + me.rank);
  setText('lbMyRankName', me.name);
  setText('lbMyRankXP',   '⚡ ' + me.xp.toLocaleString() + ' XP · 🔥 ' + me.streak + ' يوم');
  const iconEl = document.getElementById('lbMyRankIcon');
  if (iconEl) iconEl.textContent = lvl.icon;
}

/* ══ Share to Telegram ══ */
function shareLBResult() {
  const players = buildLeaderboard();
  const me = players.find(p => p.isMe);
  if (!me) return;

  const lvl  = getLevel(me.xp);
  const total = players.length;
  const text = `🏆 ترتيبي في GRIT Learn\n` +
               `📍 المركز #${me.rank} من ${total} طالب\n` +
               `⚡ ${me.xp} XP | 🔥 ${me.streak} يوم streak\n` +
               `${lvl.icon} مستوى: ${lvl.name}\n` +
               `\n📢 @GritLearnDz — BAC 2026 🇩🇿\n#باك2026 #GRIT_Learn`;

  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.openTelegramLink(
      'https://t.me/share/url?text=' + encodeURIComponent(text)
    );
  } else {
    navigator.clipboard?.writeText(text).then(() => showToast('📋', 'تم نسخ الترتيب!'));
  }

  state.shares = (state.shares || 0) + 1;
  saveState();
  checkBadges();
}
