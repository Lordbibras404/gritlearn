/* ============================================================
   GRIT Learn — TDL (To-Do List) + Pomodoro
   ============================================================ */

'use strict';

/* ══ حالة Pomodoro ══ */
const pomodoro = {
  running: false,
  seconds: 25 * 60,  // 25 دقيقة
  total: 25 * 60,
  interval: null,
  mode: 'work',      // 'work' | 'break'
};

/* ══ فلتر المهام الحالي ══ */
let tdlFilter = 'all';

/* ══ إضافة مهمة ══ */
function addTask(title, subject, priority = 'medium') {
  if (!title.trim()) return;
  const task = {
    id: Date.now(),
    title: title.trim(),
    subject: subject || 'general',
    priority,
    done: false,
    createdAt: new Date().toISOString(),
  };
  state.tasks.unshift(task);
  saveState();
  renderTasks();
  showToast('✅', 'تمت إضافة المهمة');
}

/* ══ تبديل حالة المهمة ══ */
function toggleTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  if (task.done) {
    state.tasksCompleted = (state.tasksCompleted || 0) + 1;
    showToast('🎉', 'أحسنت! مهمة مكتملة');
    checkBadges();
  }
  saveState();
  renderTasks();
}

/* ══ حذف مهمة ══ */
function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveState();
  renderTasks();
}

/* ══ عرض المهام ══ */
function renderTasks() {
  const container = document.getElementById('tasksList');
  if (!container) return;

  let filtered = state.tasks;
  if (tdlFilter === 'pending') filtered = filtered.filter(t => !t.done);
  if (tdlFilter === 'done')    filtered = filtered.filter(t => t.done);
  if (tdlFilter !== 'all' && tdlFilter !== 'pending' && tdlFilter !== 'done') {
    filtered = filtered.filter(t => t.subject === tdlFilter);
  }

  // تحديث العدادات
  const total   = state.tasks.length;
  const done    = state.tasks.filter(t => t.done).length;
  const pending = total - done;

  const el = document.getElementById('tdlCountDone');
  if (el) el.textContent = done;
  const el2 = document.getElementById('tdlCountTotal');
  if (el2) el2.textContent = total;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <h4>لا توجد مهام</h4>
        <p>أضف مهمة جديدة للبدء</p>
      </div>`;
    return;
  }

  const prioColors = { high: '#dc2626', medium: '#d97706', low: '#059669' };
  container.innerHTML = filtered.map(task => {
    const subj = SUBJECTS[task.subject];
    return `
      <div class="task-item prio-${task.priority} ${task.done ? 'done' : ''}">
        <div class="task-check ${task.done ? 'checked' : ''}"
          onclick="toggleTask(${task.id})">${task.done ? '✓' : ''}</div>
        <div class="task-body">
          <div class="task-title">${task.title}</div>
          <div class="task-meta">
            ${subj ? `<span class="task-subj" style="background:${subj.c}22;color:${subj.c}">${subj.i} ${subj.n}</span>` : ''}
            <span class="task-due">${formatDate(task.createdAt)}</span>
          </div>
        </div>
        <button class="task-delete" onclick="deleteTask(${task.id})">🗑</button>
      </div>`;
  }).join('');
}

/* ══ فلترة المهام ══ */
function setTdlFilter(f, btn) {
  tdlFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTasks();
}

/* ══ نموذج إضافة مهمة ══ */
function showAddTaskModal() {
  const title   = prompt('اسم المهمة:');
  if (!title) return;
  const subjects = Object.entries(SUBJECTS).map(([k, v]) => `${k}: ${v.i} ${v.n}`).join('\n');
  const subjInput = prompt(`المادة (اكتب الرمز):\n${subjects}\nأو اتركه فارغاً`);
  const subjKey = Object.keys(SUBJECTS).includes(subjInput) ? subjInput : 'general';
  addTask(title, subjKey);
}

/* ══ تنسيق التاريخ ══ */
function formatDate(isoStr) {
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('ar-DZ', { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

/* ══ Pomodoro ══ */
function pomodoroStart() {
  if (pomodoro.running) {
    pomodoroStop();
    return;
  }
  pomodoro.running = true;
  document.getElementById('pomStartBtn').textContent = '⏸ إيقاف';
  pomodoro.interval = setInterval(pomodoroTick, 1000);
}

function pomodoroStop() {
  pomodoro.running = false;
  clearInterval(pomodoro.interval);
  document.getElementById('pomStartBtn').textContent = '▶ ابدأ';
}

function pomodoroReset() {
  pomodoroStop();
  pomodoro.seconds = pomodoro.total;
  pomodoroUpdateUI();
}

function pomodoroTick() {
  if (pomodoro.seconds <= 0) {
    pomodoroStop();
    const isWork = pomodoro.mode === 'work';
    showToast(isWork ? '☕' : '📚', isWork ? 'وقت الراحة!' : 'عودة للدراسة!');
    pomodoro.mode   = isWork ? 'break' : 'work';
    pomodoro.total  = (pomodoro.mode === 'work' ? 25 : 5) * 60;
    pomodoro.seconds = pomodoro.total;
    if (pomodoro.mode === 'work') {
      state.xp += 15;
      saveState();
      showXP(15);
    }
    return;
  }
  pomodoro.seconds--;
  pomodoroUpdateUI();
}

function pomodoroUpdateUI() {
  const mins = Math.floor(pomodoro.seconds / 60).toString().padStart(2, '0');
  const secs = (pomodoro.seconds % 60).toString().padStart(2, '0');
  const el = document.getElementById('pomTime');
  if (el) el.textContent = `${mins}:${secs}`;

  const label = document.getElementById('pomLabel');
  if (label) label.textContent = pomodoro.mode === 'work' ? '🍅 جلسة تركيز' : '☕ استراحة قصيرة';

  // SVG ring
  const circle = document.getElementById('pomCircle');
  if (circle) {
    const pct = pomodoro.seconds / pomodoro.total;
    circle.style.strokeDashoffset = 314 * (1 - pct);
  }
}
