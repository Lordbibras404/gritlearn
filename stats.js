/* ============================================================
   GRIT Learn v6 — Stats & Analytics Module (Enhanced)
   ============================================================ */
'use strict';

const StatsModule = (() => {

  // ─── Heatmap ───────────────────────────────────────────────
  function buildHeatmap() {
    const activity = (typeof State !== 'undefined' && State.get('activityLog')) || {};
    const dayLabels = ['أحد','إثن','ثلا','أرب','خمس','جمع','سبت'];
    const cells = [];
    for (let i = 48; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const count = activity[key] || 0;
      const level = count === 0 ? '' : count < 3 ? 'l1' : count < 8 ? 'l2' : count < 15 ? 'l3' : 'l4';
      cells.push({ key, count, level, day: d.getDay() });
    }
    return `
      <div class="glass-card" style="margin:0 16px;padding:16px;border-radius:18px">
        <div style="font-size:.75rem;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">📅 النشاط — 7 أسابيع</div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:4px">
          ${dayLabels.map(d=>`<div style="font-size:.55rem;color:var(--text3);text-align:center;font-weight:600">${d}</div>`).join('')}
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px">
          ${cells.map(c=>`
            <div title="${c.key}: ${c.count} سؤال"
              style="aspect-ratio:1;border-radius:3px;background:${
                c.level==='l4'?'var(--accent)':
                c.level==='l3'?'rgba(139,92,246,.6)':
                c.level==='l2'?'rgba(139,92,246,.35)':
                c.level==='l1'?'rgba(139,92,246,.18)':
                'rgba(255,255,255,.05)'
              };transition:transform .15s ease;cursor:default"
              onmouseover="this.style.transform='scale(1.3)'"
              onmouseout="this.style.transform='scale(1)'"
            ></div>`).join('')}
        </div>
        <div style="display:flex;align-items:center;gap:5px;margin-top:10px;font-size:.6rem;color:var(--text3)">
          <span>أقل</span>
          ${['rgba(255,255,255,.05)','rgba(139,92,246,.18)','rgba(139,92,246,.35)','rgba(139,92,246,.6)','var(--accent)'].map(bg=>
            `<div style="width:11px;height:11px;border-radius:2px;background:${bg}"></div>`).join('')}
          <span>أكثر</span>
        </div>
      </div>`;
  }

  // ─── Mastery Bars ─────────────────────────────────────────
  function buildMastery() {
    const mastery = (typeof State !== 'undefined' && State.get('mastery')) || {};
    const subjects = [
      {key:'math',      icon:'📐', name:'رياضيات',    color:'#3b82f6'},
      {key:'physics',   icon:'⚡', name:'فيزياء',      color:'#8b5cf6'},
      {key:'arabic',    icon:'📝', name:'عربية',       color:'#f59e0b'},
      {key:'history',   icon:'🌍', name:'تاريخ',       color:'#ef4444'},
      {key:'chemistry', icon:'⚗️', name:'كيمياء',      color:'#10b981'},
      {key:'science',   icon:'🧬', name:'ع.طبيعية',    color:'#22d3ee'},
      {key:'english',   icon:'🇬🇧', name:'إنجليزية',   color:'#60a5fa'},
      {key:'french',    icon:'🇫🇷', name:'فرنسية',     color:'#818cf8'},
      {key:'islamic',   icon:'☪️',  name:'إسلامية',    color:'#a3e635'},
      {key:'philosophy',icon:'🤔', name:'فلسفة',       color:'#c084fc'},
      {key:'economics', icon:'📊', name:'اقتصاد',      color:'#fb923c'},
      {key:'tamazight', icon:'⵱',  name:'تامازيغت',   color:'#f472b6'},
    ];
    return `
      <div class="glass-card" style="margin:0 16px;padding:16px;border-radius:18px">
        <div style="font-size:.75rem;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px">📚 إتقان المواد</div>
        ${subjects.map(s => {
          const pct = Math.min(100, Math.round((mastery[s.key] || 0) * 100));
          return `
            <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.04)">
              <div style="font-size:1.1rem;width:28px;text-align:center">${s.icon}</div>
              <div style="flex:1;min-width:0">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                  <span style="font-size:.78rem;font-weight:700;color:var(--text1)">${s.name}</span>
                  <span style="font-size:.7rem;font-weight:700;color:var(--text3)">${pct}%</span>
                </div>
                <div style="height:4px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden">
                  <div style="height:100%;width:${pct}%;background:${s.color};border-radius:2px;transition:width 1.4s cubic-bezier(.22,1,.36,1)"></div>
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>`;
  }

  // ─── Overview Cards ───────────────────────────────────────
  function buildOverview() {
    const s = (typeof State !== 'undefined') ? State.getAll() : {};
    const totalQ   = s.totalAnswered || 0;
    const correct  = s.totalCorrect  || 0;
    const streak   = s.streak        || 0;
    const xp       = s.xp            || 0;
    const sessions = s.pomSessions   || 0;
    const accuracy = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0;
    const level    = Math.floor(xp / 500) + 1;
    const nextXP   = level * 500;
    const xpPct    = Math.round(((xp % 500) / 500) * 100);

    function ring(val, max, color, label, unit='') {
      const r = 30, C = 2 * Math.PI * r;
      const pct = Math.min(1, val / (max || 1));
      return `
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:16px">
          <div style="position:relative;width:72px;height:72px;display:flex;align-items:center;justify-content:center">
            <svg width="72" height="72" viewBox="0 0 72 72" style="position:absolute;top:0;left:0;transform:rotate(-90deg)">
              <circle cx="36" cy="36" r="${r}" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="5"/>
              <circle cx="36" cy="36" r="${r}" fill="none" stroke="${color}" stroke-width="5"
                stroke-linecap="round"
                stroke-dasharray="${C}"
                stroke-dashoffset="${C*(1-pct)}"
                style="transition:stroke-dashoffset 1.5s cubic-bezier(.22,1,.36,1)"/>
            </svg>
            <div style="position:relative;font-size:.95rem;font-weight:900;color:${color}">${val}${unit}</div>
          </div>
          <div style="font-size:.65rem;font-weight:600;color:var(--text3);text-align:center;line-height:1.3">${label}</div>
        </div>`;
    }

    return `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:0 16px">
        ${ring(accuracy, 100, '#10b981', 'الدقة', '%')}
        ${ring(level, 20, '#f59e0b', 'المستوى')}
        ${ring(streak, 30, '#ef4444', 'السلسلة', ' 🔥')}
      </div>

      <div style="margin:0 16px;padding:14px 16px;background:rgba(139,92,246,.08);border:1px solid rgba(139,92,246,.18);border-radius:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:.8rem;font-weight:800;color:var(--text1)">⚡ المستوى ${level}</span>
          <span style="font-size:.72rem;color:var(--text3)">${xp} / ${nextXP} XP</span>
        </div>
        <div style="height:6px;background:rgba(255,255,255,.07);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${xpPct}%;background:linear-gradient(90deg,var(--accent),#818cf8);border-radius:3px;transition:width 1.2s ease"></div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;padding:0 16px">
        ${[
          {icon:'✅', val:correct.toLocaleString(),    lbl:'إجابة صحيحة',  color:'#10b981'},
          {icon:'❌', val:(totalQ-correct).toLocaleString(), lbl:'إجابة خاطئة', color:'#ef4444'},
          {icon:'🎯', val:totalQ.toLocaleString(),     lbl:'إجمالي الأسئلة', color:'var(--accent)'},
          {icon:'🍅', val:sessions,                   lbl:'جلسة بومودورو', color:'#f59e0b'},
        ].map(it=>`
          <div style="display:flex;align-items:center;gap:10px;padding:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:14px">
            <span style="font-size:1.5rem">${it.icon}</span>
            <div>
              <div style="font-size:1.1rem;font-weight:900;color:${it.color}">${it.val}</div>
              <div style="font-size:.65rem;color:var(--text3);font-weight:600">${it.lbl}</div>
            </div>
          </div>`).join('')}
      </div>`;
  }

  // ─── Exam History ─────────────────────────────────────────
  function buildExamHistory() {
    const history = (typeof State !== 'undefined' && State.get('examHistory')) || [];
    if (!history.length) return `
      <div style="text-align:center;padding:32px 16px;color:var(--text3)">
        <div style="font-size:2.5rem;margin-bottom:8px">📋</div>
        <div style="font-size:.85rem">لم تُؤدِ أي امتحان بعد</div>
      </div>`;
    return `
      <div style="display:flex;flex-direction:column;gap:8px;padding:0 16px">
        ${history.slice(-10).reverse().map(e=>{
          const passed = e.mark >= 10;
          const d = new Date(e.date);
          const dateStr = `${d.getDate()}/${d.getMonth()+1}`;
          return `
            <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:14px">
              <div style="font-size:.68rem;color:var(--text3);width:28px;text-align:center;flex-shrink:0">${dateStr}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:.82rem;font-weight:700;color:var(--text1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.title||'امتحان'}</div>
                <div style="font-size:.67rem;color:var(--text3)">${e.correct||0}/${e.total||0} صحيحة</div>
              </div>
              <div style="font-size:1rem;font-weight:900;color:${passed?'#10b981':'#ef4444'};flex-shrink:0">${e.mark}/20</div>
            </div>`;
        }).join('')}
      </div>`;
  }

  // ─── Render Full Screen ───────────────────────────────────
  function renderStatsScreen() {
    return `
      <div style="display:flex;flex-direction:column;gap:16px;padding:8px 0 120px">
        ${buildOverview()}
        ${buildHeatmap()}
        ${buildMastery()}
        <div style="padding:0 16px">
          <div style="font-size:.75rem;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px">🎓 سجل الامتحانات</div>
          ${buildExamHistory()}
        </div>
      </div>`;
  }

  function init(containerId) {
    const el = document.getElementById(containerId || 'stats-container');
    if (el) el.innerHTML = renderStatsScreen();
  }

  return { init, renderStatsScreen };
})();
