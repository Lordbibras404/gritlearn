/* ============================================================
   GRIT Learn v6 — Summaries Module (ملخصات الدروس)
   ============================================================ */
'use strict';

const Summaries = (() => {

  const SUBJECT_META = {
    math:       { name: 'الرياضيات',        icon: '📐', color: '#3b82f6' },
    physics:    { name: 'الفيزياء',          icon: '⚡', color: '#8b5cf6' },
    arabic:     { name: 'اللغة العربية',    icon: '📝', color: '#f59e0b' },
    history:    { name: 'التاريخ والجغرافيا',icon: '🌍', color: '#ef4444' },
    chemistry:  { name: 'الكيمياء',          icon: '⚗️', color: '#10b981' },
    science:    { name: 'علوم طبيعية',       icon: '🧬', color: '#22d3ee' },
    english:    { name: 'اللغة الإنجليزية', icon: '🇬🇧', color: '#60a5fa' },
    french:     { name: 'اللغة الفرنسية',   icon: '🇫🇷', color: '#818cf8' },
    islamic:    { name: 'العلوم الإسلامية', icon: '☪️', color: '#a3e635' },
    philosophy: { name: 'الفلسفة',           icon: '🤔', color: '#c084fc' },
    economics:  { name: 'الاقتصاد',          icon: '📊', color: '#fb923c' },
    tamazight:  { name: 'الأمازيغية',       icon: '⵱', color: '#fbbf24' },
  };

  let currentSubject = null;

  // ════════════════════════
  // RENDER SUBJECT LIST
  // ════════════════════════
  function renderSubjectList() {
    const subjects = Object.keys(SUBJECT_META).filter(s => SUMMARIES[s]?.length > 0);

    return `
      <div class="summaries-screen">
        <div class="screen-header" style="padding:16px 16px 0">
          <h2 class="screen-title">📖 ملخصات الدروس</h2>
          <p style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;padding:0 0 12px">
            مراجعة سريعة لكل مادة ✨
          </p>
        </div>

        <div class="summary-subject-list">
          ${subjects.map(subj => {
            const meta = SUBJECT_META[subj];
            const count = SUMMARIES[subj]?.length || 0;
            return `
              <button class="summary-subject-btn hover-lift" onclick="Summaries.showSubject('${subj}')">
                <div class="summary-subj-icon" style="color:${meta.color}">${meta.icon}</div>
                <div class="summary-subj-info">
                  <div class="summary-subj-name">${meta.name}</div>
                  <div class="summary-subj-count">${count} درس</div>
                </div>
                <span style="color:var(--text-muted);font-size:1.2rem">›</span>
              </button>
            `;
          }).join('')}

          ${Object.keys(SUBJECT_META).filter(s => !SUMMARIES[s]?.length).map(subj => {
            const meta = SUBJECT_META[subj];
            return `
              <div class="summary-subject-btn" style="opacity:0.4;cursor:default">
                <div class="summary-subj-icon" style="color:${meta.color}">${meta.icon}</div>
                <div class="summary-subj-info">
                  <div class="summary-subj-name">${meta.name}</div>
                  <div class="summary-subj-count">قريباً...</div>
                </div>
                <span style="color:var(--text-muted);font-size:0.8rem">🔒</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ════════════════════════
  // RENDER SUBJECT LESSONS
  // ════════════════════════
  function renderSubjectSummaries(subjKey) {
    const meta = SUBJECT_META[subjKey];
    const lessons = SUMMARIES[subjKey] || [];
    currentSubject = subjKey;

    return `
      <div class="summary-detail-screen">

        <div class="screen-header" style="display:flex;align-items:center;gap:10px;padding:16px 0 8px">
          <button onclick="Summaries.backToList()" style="background:rgba(255,255,255,0.07);border:none;border-radius:10px;padding:8px 12px;color:var(--text-primary);cursor:pointer;font-size:0.9rem">
            ← رجوع
          </button>
          <h2 style="font-size:1rem;font-weight:800;color:${meta.color}">${meta.icon} ${meta.name}</h2>
        </div>

        <div style="display:flex;flex-direction:column;gap:14px;padding-bottom:20px">
          ${lessons.map((lesson, i) => `
            <div class="summary-card anim-fade-in-up" style="animation-delay:${i*60}ms">
              <div class="summary-card-title">
                <span style="font-size:1.3rem">${lesson.icon}</span>
                ${lesson.title}
              </div>
              <div class="summary-content">
                ${renderMarkdown(lesson.content)}
              </div>
            </div>
          `).join('')}
        </div>

      </div>
    `;
  }

  // ════════════════════════
  // SIMPLE MARKDOWN PARSER
  // ════════════════════════
  function renderMarkdown(text) {
    if (!text) return '';

    return text
      .trim()
      // Headings
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic/em
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Table: detect |...|
      .replace(/(\|.+\|\n)+/g, (match) => {
        const rows = match.trim().split('\n');
        let html = '<table>';
        rows.forEach((row, i) => {
          if (row.match(/^\|[-\s|]+\|$/)) return; // skip separator
          const cells = row.split('|').filter((c, idx) => idx > 0 && idx < row.split('|').length - 1);
          const tag = i === 0 ? 'th' : 'td';
          html += '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>';
        });
        html += '</table>';
        return html;
      })
      // Code inline
      .replace(/`(.+?)`/g, '<code style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-size:0.85em">$1</code>')
      // Math inline $...$
      .replace(/\$\$(.+?)\$\$/gs, '<div class="math-block" style="font-family:monospace;background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.2);border-radius:8px;padding:10px 14px;margin:8px 0;font-size:0.9rem;direction:ltr;text-align:center">$1</div>')
      .replace(/\$(.+?)\$/g, '<code style="font-family:monospace;color:var(--accent)">$1</code>')
      // Horizontal rule
      .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:14px 0">')
      // Unordered list
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.+<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
      // Ordered list
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      // Paragraphs (double newline)
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$(?!<\/)/gm, (m) => {
        if (m.startsWith('<')) return m;
        return m;
      })
      // Clean up
      .replace(/\n/g, '<br>');
  }

  // ════════════════════════
  // NAVIGATION
  // ════════════════════════
  function init() {
    const container = document.getElementById('summaries-container');
    if (!container) return;
    container.innerHTML = renderSubjectList();
    currentSubject = null;
  }

  function showSubject(subjKey) {
    const container = document.getElementById('summaries-container');
    if (!container) return;
    container.innerHTML = renderSubjectSummaries(subjKey);
    container.scrollTop = 0;
  }

  function backToList() {
    init();
  }

  return { init, showSubject, backToList };

})();
