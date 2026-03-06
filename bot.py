#!/usr/bin/env python3
# ══════════════════════════════════════════════
# GRIT Learn — Admin Bot
# بوت تحكم كامل لإدارة التطبيق
# ══════════════════════════════════════════════

import os, json, base64, logging, requests
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, CommandHandler, CallbackQueryHandler,
    MessageHandler, filters, ContextTypes, ConversationHandler
)

# ══ CONFIG ══
BOT_TOKEN    = "8509947051:AAHMc7OTZuPe8eX2cEziN1jnyXsWb8ygaw8"
GITHUB_TOKEN = "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"
GITHUB_REPO  = "lordbibras404/grit-admin-bot"   # ✅ الـ repo الصحيح
GITHUB_BRANCH= "main"

MAIN_ADMIN_ID = 6332519968
ADMIN_IDS = {6332519968}

# ══ LOGGING ══
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# ══ STATES ══
(
    WAIT_ANNOUNCE_TEXT,
    WAIT_SUMMARY_SUBJECT, WAIT_SUMMARY_TITLE, WAIT_SUMMARY_URL,
    WAIT_EXAM_TYPE, WAIT_EXAM_TITLE, WAIT_EXAM_YEAR, WAIT_EXAM_URL,
    WAIT_QUIZ_SUBJECT, WAIT_QUIZ_DIFF, WAIT_QUIZ_Q,
    WAIT_QUIZ_OA, WAIT_QUIZ_OB, WAIT_QUIZ_OC, WAIT_QUIZ_OD,
    WAIT_QUIZ_ANS, WAIT_QUIZ_EXP,
    WAIT_DELETE_CONFIRM,
) = range(18)

# ══ GITHUB API ══
HEADERS = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}
BASE_URL = f"https://api.github.com/repos/{GITHUB_REPO}/contents"  # ✅ بدون /data

def gh_get(filename):
    url = f"{BASE_URL}/{filename}"
    r = requests.get(url, headers=HEADERS)
    if r.status_code == 200:
        data = r.json()
        content = base64.b64decode(data['content']).decode('utf-8')
        return json.loads(content), data['sha']
    return None, None

def gh_put(filename, content_dict, sha, message):
    url = f"{BASE_URL}/{filename}"
    content_str = json.dumps(content_dict, ensure_ascii=False, indent=2)
    content_b64 = base64.b64encode(content_str.encode('utf-8')).decode('utf-8')
    payload = {
        "message": f"🤖 {message}",
        "content": content_b64,
        "sha": sha,
        "branch": GITHUB_BRANCH
    }
    r = requests.put(url, headers=HEADERS, json=payload)
    return r.status_code in (200, 201)

def gh_create(filename, content_dict, message):
    url = f"{BASE_URL}/{filename}"
    content_str = json.dumps(content_dict, ensure_ascii=False, indent=2)
    content_b64 = base64.b64encode(content_str.encode('utf-8')).decode('utf-8')
    payload = {
        "message": f"🤖 {message}",
        "content": content_b64,
        "branch": GITHUB_BRANCH
    }
    r = requests.put(url, headers=HEADERS, json=payload)
    return r.status_code in (200, 201)

# ══ AUTH ══
def is_admin(user_id):
    return user_id in ADMIN_IDS

def is_main_admin(user_id):
    return user_id == MAIN_ADMIN_ID

# ══ KEYBOARDS ══
def kb_main():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("⚙️ إدارة الأقسام",     callback_data="sections")],
        [InlineKeyboardButton("📝 إدارة الكويز",       callback_data="quiz_mgr")],
        [InlineKeyboardButton("📖 إدارة الملخصات",     callback_data="summaries")],
        [InlineKeyboardButton("📋 إدارة الامتحانات",   callback_data="exams")],
        [InlineKeyboardButton("📊 الإحصائيات",         callback_data="stats")],
        [InlineKeyboardButton("📢 إرسال إعلان",        callback_data="announce")],
    ])

def kb_sections(sections_data):
    buttons = []
    for key, sec in sections_data['sections'].items():
        status = "✅" if sec['visible'] else "❌"
        buttons.append([InlineKeyboardButton(
            f"{status} {sec['icon']} {sec['name']}",
            callback_data=f"sec_{key}"
        )])
    buttons.append([InlineKeyboardButton("🔙 رجوع", callback_data="main")])
    return InlineKeyboardMarkup(buttons)

def kb_section_actions(key, visible):
    toggle_text = "🙈 إخفاء" if visible else "👁 إظهار"
    return InlineKeyboardMarkup([
        [InlineKeyboardButton(toggle_text, callback_data=f"sec_toggle_{key}")],
        [InlineKeyboardButton("🔙 رجوع للأقسام", callback_data="sections")],
    ])

def kb_summaries():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("➕ إضافة ملخص",    callback_data="sum_add")],
        [InlineKeyboardButton("📂 عرض الملخصات",  callback_data="sum_view")],
        [InlineKeyboardButton("❌ حذف ملخص",      callback_data="sum_del")],
        [InlineKeyboardButton("🔙 رجوع",          callback_data="main")],
    ])

def kb_exams():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("📚 بكالوريات سابقة",  callback_data="exam_prev")],
        [InlineKeyboardButton("📋 امتحانات تجريبية", callback_data="exam_trial")],
        [InlineKeyboardButton("🌍 بكالوريات أجنبية", callback_data="exam_foreign")],
        [InlineKeyboardButton("🔙 رجوع",            callback_data="main")],
    ])

def kb_exam_actions(exam_type):
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("➕ إضافة",   callback_data=f"exam_add_{exam_type}")],
        [InlineKeyboardButton("📂 عرض",    callback_data=f"exam_view_{exam_type}")],
        [InlineKeyboardButton("❌ حذف",    callback_data=f"exam_del_{exam_type}")],
        [InlineKeyboardButton("🔙 رجوع",  callback_data="exams")],
    ])

def kb_quiz():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("➕ إضافة سؤال",   callback_data="quiz_add")],
        [InlineKeyboardButton("📂 عرض الأسئلة", callback_data="quiz_view")],
        [InlineKeyboardButton("❌ حذف سؤال",    callback_data="quiz_del")],
        [InlineKeyboardButton("🔙 رجوع",        callback_data="main")],
    ])

def kb_subjects():
    subjects = {
        "math":"📐 رياضيات", "physics":"⚡ فيزياء",
        "arabic":"📝 عربية", "history":"🏛 تاريخ",
        "english":"🌐 English", "french":"🇫🇷 فرنسية",
        "islamic":"☪️ إسلامية", "philosophy":"💭 فلسفة",
        "science":"🔬 علوم طبيعية", "amazigh":"ⴰ أمازيغية",
        "economics":"📊 اقتصاد", "accounting":"🧾 محاسبة"
    }
    buttons = []
    items = list(subjects.items())
    for i in range(0, len(items), 2):
        row = [InlineKeyboardButton(items[i][1], callback_data=f"subj_{items[i][0]}")]
        if i+1 < len(items):
            row.append(InlineKeyboardButton(items[i+1][1], callback_data=f"subj_{items[i+1][0]}"))
        buttons.append(row)
    buttons.append([InlineKeyboardButton("🔙 رجوع", callback_data="main")])
    return InlineKeyboardMarkup(buttons)

def kb_difficulty():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🟢 سهل",    callback_data="diff_easy")],
        [InlineKeyboardButton("🟡 متوسط",  callback_data="diff_medium")],
        [InlineKeyboardButton("🔴 صعب",    callback_data="diff_hard")],
        [InlineKeyboardButton("🔙 رجوع",   callback_data="quiz_mgr")],
    ])

def kb_cancel():
    return InlineKeyboardMarkup([[InlineKeyboardButton("❌ إلغاء", callback_data="main")]])

def kb_back(target):
    return InlineKeyboardMarkup([[InlineKeyboardButton("🔙 رجوع", callback_data=target)]])

# ══ HANDLERS ══

async def start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not is_admin(user.id):
        await update.message.reply_text("⛔ غير مصرح لك باستخدام هذا البوت.")
        return
    text = (
        f"مرحباً {user.first_name}! 👋\n\n"
        f"⚙️ *لوحة تحكم GRIT Learn*\n"
        f"اختر ما تريد إدارته:"
    )
    await update.message.reply_text(text, parse_mode='Markdown', reply_markup=kb_main())

async def button_handler(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    user_id = query.from_user.id

    if not is_admin(user_id):
        await query.edit_message_text("⛔ غير مصرح.")
        return

    data = query.data

    # ── MAIN MENU ──
    if data == "main":
        await query.edit_message_text(
            "⚙️ *لوحة تحكم GRIT Learn*\nاختر ما تريد إدارته:",
            parse_mode='Markdown', reply_markup=kb_main()
        )

    # ── SECTIONS ──
    elif data == "sections":
        sec_data, _ = gh_get("sections.json")
        if not sec_data:
            await query.edit_message_text("❌ تعذر جلب الأقسام.", reply_markup=kb_back("main"))
            return
        await query.edit_message_text(
            "⚙️ *إدارة الأقسام*\nاضغط على قسم لإدارته:",
            parse_mode='Markdown', reply_markup=kb_sections(sec_data)
        )

    elif data.startswith("sec_toggle_"):
        key = data.replace("sec_toggle_", "")
        sec_data, sha = gh_get("sections.json")
        if sec_data and sha:
            sec_data['sections'][key]['visible'] = not sec_data['sections'][key]['visible']
            status = "ظاهر" if sec_data['sections'][key]['visible'] else "مخفي"
            ok = gh_put("sections.json", sec_data, sha, f"تغيير حالة قسم {key}")
            msg = f"✅ تم! القسم الآن {status}." if ok else "❌ فشل التحديث."
            await query.edit_message_text(msg, reply_markup=kb_back("sections"))

    elif data.startswith("sec_") and not data.startswith("sec_toggle_"):
        key = data.replace("sec_", "")
        sec_data, _ = gh_get("sections.json")
        if sec_data and key in sec_data['sections']:
            sec = sec_data['sections'][key]
            visible = sec['visible']
            status = "✅ ظاهر" if visible else "❌ مخفي"
            text = f"{sec['icon']} *{sec['name']}*\nالحالة: {status}"
            await query.edit_message_text(text, parse_mode='Markdown',
                reply_markup=kb_section_actions(key, visible))

    # ── ANNOUNCE ──
    elif data == "announce":
        ctx.user_data['state'] = 'announce'
        ann_data, _ = gh_get("announcements.json")
        current = ann_data.get('text','—') if ann_data else '—'
        await query.edit_message_text(
            f"📢 *إرسال إعلان*\n\n"
            f"الإعلان الحالي:\n`{current}`\n\n"
            f"أرسل نص الإعلان الجديد:",
            parse_mode='Markdown', reply_markup=kb_cancel()
        )
        return WAIT_ANNOUNCE_TEXT

    # ── SUMMARIES ──
    elif data == "summaries":
        await query.edit_message_text(
            "📖 *إدارة الملخصات*", parse_mode='Markdown',
            reply_markup=kb_summaries()
        )

    elif data == "sum_add":
        await query.edit_message_text(
            "📖 إضافة ملخص\nاختر المادة:", reply_markup=kb_subjects()
        )
        return WAIT_SUMMARY_SUBJECT

    elif data == "sum_view":
        sum_data, _ = gh_get("summaries.json")
        if not sum_data:
            await query.edit_message_text("❌ تعذر الجلب.", reply_markup=kb_back("summaries"))
            return
        lines = ["📖 *الملخصات الحالية:*\n"]
        for subj, info in sum_data['subjects'].items():
            count = len(info['items'])
            lines.append(f"{info['icon']} {info['name']}: *{count}* ملخص")
        await query.edit_message_text(
            "\n".join(lines), parse_mode='Markdown',
            reply_markup=kb_back("summaries")
        )

    elif data == "sum_del":
        sum_data, _ = gh_get("summaries.json")
        if not sum_data:
            await query.edit_message_text("❌ تعذر الجلب.", reply_markup=kb_back("summaries"))
            return
        buttons = []
        for subj, info in sum_data['subjects'].items():
            for i, item in enumerate(info['items']):
                buttons.append([InlineKeyboardButton(
                    f"❌ {info['icon']} {item['title'][:30]}",
                    callback_data=f"sum_del_{subj}_{i}"
                )])
        if not buttons:
            await query.edit_message_text("لا توجد ملخصات.", reply_markup=kb_back("summaries"))
            return
        buttons.append([InlineKeyboardButton("🔙 رجوع", callback_data="summaries")])
        await query.edit_message_text(
            "اختر الملخص للحذف:", reply_markup=InlineKeyboardMarkup(buttons)
        )

    elif data.startswith("sum_del_") and data.count("_") >= 3:
        parts = data.split("_")
        subj = parts[2]
        idx  = int(parts[3])
        sum_data, sha = gh_get("summaries.json")
        if sum_data and sha:
            title = sum_data['subjects'][subj]['items'][idx]['title']
            sum_data['subjects'][subj]['items'].pop(idx)
            ok = gh_put("summaries.json", sum_data, sha, f"حذف ملخص: {title}")
            msg = f"✅ تم حذف: {title}" if ok else "❌ فشل الحذف."
            await query.edit_message_text(msg, reply_markup=kb_back("summaries"))

    # ── EXAMS ──
    elif data == "exams":
        await query.edit_message_text(
            "📋 *إدارة الامتحانات*", parse_mode='Markdown',
            reply_markup=kb_exams()
        )

    elif data in ("exam_prev","exam_trial","exam_foreign"):
        type_names = {
            "exam_prev":"بكالوريات سابقة",
            "exam_trial":"امتحانات تجريبية",
            "exam_foreign":"بكالوريات أجنبية"
        }
        await query.edit_message_text(
            f"📋 *{type_names[data]}*", parse_mode='Markdown',
            reply_markup=kb_exam_actions(data.replace("exam_",""))
        )

    elif data.startswith("exam_view_"):
        etype = data.replace("exam_view_","")
        key_map = {"prev":"bac_previous","trial":"bac_trial","foreign":"bac_foreign"}
        exam_data, _ = gh_get("exams.json")
        if not exam_data:
            await query.edit_message_text("❌ تعذر الجلب.", reply_markup=kb_back("exams"))
            return
        items = exam_data[key_map[etype]]['items']
        if not items:
            await query.edit_message_text("لا توجد امتحانات.", reply_markup=kb_back("exams"))
            return
        lines = [f"📋 *القائمة ({len(items)}):\n*"]
        for i, item in enumerate(items):
            lines.append(f"{i+1}. {item['title']} — {item.get('year','')}")
        await query.edit_message_text(
            "\n".join(lines), parse_mode='Markdown',
            reply_markup=kb_back("exams")
        )

    elif data.startswith("exam_add_"):
        etype = data.replace("exam_add_","")
        ctx.user_data['exam_type'] = etype
        await query.edit_message_text(
            "📋 أرسل *عنوان الامتحان*:", parse_mode='Markdown',
            reply_markup=kb_cancel()
        )
        return WAIT_EXAM_TITLE

    elif data.startswith("exam_del_"):
        etype = data.replace("exam_del_","")
        key_map = {"prev":"bac_previous","trial":"bac_trial","foreign":"bac_foreign"}
        exam_data, _ = gh_get("exams.json")
        items = exam_data[key_map[etype]]['items'] if exam_data else []
        if not items:
            await query.edit_message_text("لا توجد امتحانات.", reply_markup=kb_back("exams"))
            return
        buttons = []
        for i, item in enumerate(items):
            buttons.append([InlineKeyboardButton(
                f"❌ {item['title'][:35]}", callback_data=f"examd_{etype}_{i}"
            )])
        buttons.append([InlineKeyboardButton("🔙 رجوع", callback_data="exams")])
        await query.edit_message_text(
            "اختر الامتحان للحذف:", reply_markup=InlineKeyboardMarkup(buttons)
        )

    elif data.startswith("examd_"):
        parts = data.split("_")
        etype = parts[1]
        idx   = int(parts[2])
        key_map = {"prev":"bac_previous","trial":"bac_trial","foreign":"bac_foreign"}
        exam_data, sha = gh_get("exams.json")
        if exam_data and sha:
            title = exam_data[key_map[etype]]['items'][idx]['title']
            exam_data[key_map[etype]]['items'].pop(idx)
            ok = gh_put("exams.json", exam_data, sha, f"حذف امتحان: {title}")
            msg = f"✅ تم حذف: {title}" if ok else "❌ فشل الحذف."
            await query.edit_message_text(msg, reply_markup=kb_back("exams"))

    # ── QUIZ ──
    elif data == "quiz_mgr":
        await query.edit_message_text(
            "📝 *إدارة الكويز*", parse_mode='Markdown',
            reply_markup=kb_quiz()
        )

    elif data == "quiz_add":
        await query.edit_message_text(
            "📝 إضافة سؤال\nاختر المادة:", reply_markup=kb_subjects()
        )
        ctx.user_data['action'] = 'quiz_add'
        return WAIT_QUIZ_SUBJECT

    elif data == "quiz_view":
        qdata, _ = gh_get("quiz.json")
        if not qdata:
            await query.edit_message_text("❌ تعذر الجلب.", reply_markup=kb_back("quiz_mgr"))
            return
        subjects_ar = {
            "math":"📐 رياضيات", "physics":"⚡ فيزياء",
            "arabic":"📝 عربية", "history":"🏛 تاريخ",
            "english":"🌐 English", "french":"🇫🇷 فرنسية",
            "islamic":"☪️ إسلامية", "philosophy":"💭 فلسفة",
            "science":"🔬 علوم طبيعية", "amazigh":"ⴰ أمازيغية",
            "economics":"📊 اقتصاد", "accounting":"🧾 محاسبة"
        }
        lines = ["📝 *إحصائيات الكويز:*\n"]
        total = 0
        for subj, diffs in qdata.items():
            count = sum(len(v) for v in diffs.values() if isinstance(v, list))
            total += count
            lines.append(f"{subjects_ar.get(subj,subj)}: *{count}* سؤال")
        lines.append(f"\n📊 المجموع: *{total}* سؤال")
        await query.edit_message_text(
            "\n".join(lines), parse_mode='Markdown',
            reply_markup=kb_back("quiz_mgr")
        )

    # ── STATS ──
    elif data == "stats":
        lines = ["📊 *إحصائيات GRIT Learn*\n"]
        qdata, _ = gh_get("quiz.json")
        if qdata:
            total = sum(
                len(v) for subj in qdata.values()
                for v in (subj.values() if isinstance(subj, dict) else [])
                if isinstance(v, list)
            )
            lines.append(f"📝 الأسئلة: *{total}* سؤال")
        sum_data, _ = gh_get("summaries.json")
        if sum_data:
            total_s = sum(len(info['items']) for info in sum_data['subjects'].values())
            lines.append(f"📖 الملخصات: *{total_s}* ملخص")
        exam_data, _ = gh_get("exams.json")
        if exam_data:
            total_e = sum(len(v['items']) for v in exam_data.values())
            lines.append(f"📋 الامتحانات: *{total_e}* امتحان")
        lines.append(f"\n🕐 آخر تحديث: {datetime.now().strftime('%H:%M %d/%m/%Y')}")
        await query.edit_message_text(
            "\n".join(lines), parse_mode='Markdown',
            reply_markup=kb_back("main")
        )

    return ConversationHandler.END

# ══ CONVERSATION: ANNOUNCE ══
async def announce_text(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    text = update.message.text.strip()
    ann_data, sha = gh_get("announcements.json")
    if not ann_data:
        ann_data = {"active": True, "text": "", "emoji": "📢", "updated_at": ""}
        sha = None
    ann_data['text'] = text
    ann_data['active'] = True
    ann_data['updated_at'] = datetime.now().isoformat()
    if sha:
        ok = gh_put("announcements.json", ann_data, sha, "تحديث الإعلان")
    else:
        ok = gh_create("announcements.json", ann_data, "إنشاء إعلان")
    msg = f"✅ تم نشر الإعلان!\n\n`{text}`" if ok else "❌ فشل النشر."
    await update.message.reply_text(msg, parse_mode='Markdown', reply_markup=kb_main())
    return ConversationHandler.END

# ══ CONVERSATION: SUMMARY ══
async def sum_subject(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    subj = query.data.replace("subj_", "")
    ctx.user_data['sum_subj'] = subj
    await query.edit_message_text(
        "📖 أرسل *عنوان الملخص*:", parse_mode='Markdown',
        reply_markup=kb_cancel()
    )
    return WAIT_SUMMARY_TITLE

async def sum_title(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    ctx.user_data['sum_title'] = update.message.text.strip()
    await update.message.reply_text(
        "🔗 أرسل *رابط الملخص* (PDF أو رابط):", parse_mode='Markdown',
        reply_markup=kb_cancel()
    )
    return WAIT_SUMMARY_URL

async def sum_url(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    url   = update.message.text.strip()
    subj  = ctx.user_data.get('sum_subj')
    title = ctx.user_data.get('sum_title')
    sum_data, sha = gh_get("summaries.json")
    if not sum_data:
        await update.message.reply_text("❌ تعذر الجلب.", reply_markup=kb_main())
        return ConversationHandler.END
    new_item = {
        "id": int(datetime.now().timestamp()),
        "title": title,
        "url": url,
        "added_at": datetime.now().isoformat()
    }
    sum_data['subjects'][subj]['items'].append(new_item)
    ok = gh_put("summaries.json", sum_data, sha, f"إضافة ملخص: {title}")
    msg = f"✅ تم إضافة الملخص!\n📖 {title}\n🔗 {url}" if ok else "❌ فشل الإضافة."
    await update.message.reply_text(msg, reply_markup=kb_main())
    return ConversationHandler.END

# ══ CONVERSATION: EXAM ══
async def exam_title(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    ctx.user_data['exam_title'] = update.message.text.strip()
    await update.message.reply_text("📅 أرسل *سنة الامتحان*:", parse_mode='Markdown')
    return WAIT_EXAM_YEAR

async def exam_year(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    ctx.user_data['exam_year'] = update.message.text.strip()
    await update.message.reply_text("🔗 أرسل *رابط الامتحان* (PDF):", parse_mode='Markdown')
    return WAIT_EXAM_URL

async def exam_url(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    url   = update.message.text.strip()
    etype = ctx.user_data.get('exam_type')
    title = ctx.user_data.get('exam_title')
    year  = ctx.user_data.get('exam_year')
    key_map = {"prev":"bac_previous","trial":"bac_trial","foreign":"bac_foreign"}
    exam_data, sha = gh_get("exams.json")
    if not exam_data:
        await update.message.reply_text("❌ تعذر الجلب.")
        return ConversationHandler.END
    new_item = {
        "id": int(datetime.now().timestamp()),
        "title": title,
        "year": year,
        "url": url,
        "added_at": datetime.now().isoformat()
    }
    exam_data[key_map[etype]]['items'].append(new_item)
    ok = gh_put("exams.json", exam_data, sha, f"إضافة امتحان: {title}")
    msg = f"✅ تم إضافة الامتحان!\n📋 {title} ({year})" if ok else "❌ فشل الإضافة."
    await update.message.reply_text(msg, reply_markup=kb_main())
    return ConversationHandler.END

# ══ CONVERSATION: QUIZ ══
async def quiz_subject(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    subj = query.data.replace("subj_", "")
    ctx.user_data['quiz_subj'] = subj
    await query.edit_message_text("📝 اختر مستوى الصعوبة:", reply_markup=kb_difficulty())
    return WAIT_QUIZ_DIFF

async def quiz_diff(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    diff = query.data.replace("diff_", "")
    ctx.user_data['quiz_diff'] = diff
    diff_ar = {"easy":"سهل","medium":"متوسط","hard":"صعب"}
    await query.edit_message_text(
        f"📝 مادة: `{ctx.user_data['quiz_subj']}` | مستوى: `{diff_ar[diff]}`\n\n"
        f"أرسل *نص السؤال*:", parse_mode='Markdown', reply_markup=kb_cancel()
    )
    return WAIT_QUIZ_Q

async def quiz_q(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    ctx.user_data['quiz_q'] = update.message.text.strip()
    await update.message.reply_text("أرسل *الخيار أ*:", parse_mode='Markdown')
    return WAIT_QUIZ_OA

async def quiz_oa(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    ctx.user_data['quiz_oa'] = update.message.text.strip()
    await update.message.reply_text("أرسل *الخيار ب*:", parse_mode='Markdown')
    return WAIT_QUIZ_OB

async def quiz_ob(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    ctx.user_data['quiz_ob'] = update.message.text.strip()
    await update.message.reply_text("أرسل *الخيار ج*:", parse_mode='Markdown')
    return WAIT_QUIZ_OC

async def quiz_oc(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    ctx.user_data['quiz_oc'] = update.message.text.strip()
    await update.message.reply_text("أرسل *الخيار د*:", parse_mode='Markdown')
    return WAIT_QUIZ_OD

async def quiz_od(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    ctx.user_data['quiz_od'] = update.message.text.strip()
    opts = ['أ','ب','ج','د']
    vals = [ctx.user_data[f'quiz_o{x}'] for x in ['a','b','c','d']]
    lines = "\n".join([f"{opts[i]}) {v}" for i,v in enumerate(vals)])
    await update.message.reply_text(
        f"السؤال: {ctx.user_data['quiz_q']}\n\n{lines}\n\n"
        f"أرسل *رقم الإجابة الصحيحة* (0=أ, 1=ب, 2=ج, 3=د):",
        parse_mode='Markdown'
    )
    return WAIT_QUIZ_ANS

async def quiz_ans(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    try:
        ans = int(update.message.text.strip())
        if ans not in range(4):
            raise ValueError
    except ValueError:
        await update.message.reply_text("❌ أرسل رقماً من 0 إلى 3.")
        return WAIT_QUIZ_ANS
    ctx.user_data['quiz_ans'] = ans
    await update.message.reply_text("أرسل *الشرح/التوضيح* للإجابة:", parse_mode='Markdown')
    return WAIT_QUIZ_EXP

async def quiz_exp(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    exp   = update.message.text.strip()
    subj  = ctx.user_data.get('quiz_subj')
    diff  = ctx.user_data.get('quiz_diff')
    new_q = {
        "q": ctx.user_data['quiz_q'],
        "o": [ctx.user_data[f'quiz_o{x}'] for x in ['a','b','c','d']],
        "a": ctx.user_data['quiz_ans'],
        "e": exp
    }
    qdata, sha = gh_get("quiz.json")
    if not qdata:
        qdata = {}
    if subj not in qdata:
        qdata[subj] = {"easy":[],"medium":[],"hard":[]}
    qdata[subj][diff].append(new_q)
    ok = gh_put("quiz.json", qdata, sha, f"إضافة سؤال: {subj}/{diff}")
    msg = f"✅ تم إضافة السؤال!\n📝 {new_q['q']}" if ok else "❌ فشل الإضافة."
    await update.message.reply_text(msg, reply_markup=kb_main())
    return ConversationHandler.END

# ══ CANCEL ══
async def cancel(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.edit_message_text(
            "⚙️ *لوحة تحكم GRIT Learn*", parse_mode='Markdown',
            reply_markup=kb_main()
        )
    else:
        await update.message.reply_text("تم الإلغاء.", reply_markup=kb_main())
    return ConversationHandler.END

# ══ MAIN ══
def main():
    app = Application.builder().token(BOT_TOKEN).build()

    conv = ConversationHandler(
        entry_points=[CallbackQueryHandler(button_handler)],
        states={
            WAIT_ANNOUNCE_TEXT:  [MessageHandler(filters.TEXT & ~filters.COMMAND, announce_text)],
            WAIT_SUMMARY_SUBJECT:[CallbackQueryHandler(sum_subject, pattern="^subj_")],
            WAIT_SUMMARY_TITLE:  [MessageHandler(filters.TEXT & ~filters.COMMAND, sum_title)],
            WAIT_SUMMARY_URL:    [MessageHandler(filters.TEXT & ~filters.COMMAND, sum_url)],
            WAIT_EXAM_TITLE:     [MessageHandler(filters.TEXT & ~filters.COMMAND, exam_title)],
            WAIT_EXAM_YEAR:      [MessageHandler(filters.TEXT & ~filters.COMMAND, exam_year)],
            WAIT_EXAM_URL:       [MessageHandler(filters.TEXT & ~filters.COMMAND, exam_url)],
            WAIT_QUIZ_SUBJECT:   [CallbackQueryHandler(quiz_subject, pattern="^subj_")],
            WAIT_QUIZ_DIFF:      [CallbackQueryHandler(quiz_diff, pattern="^diff_")],
            WAIT_QUIZ_Q:         [MessageHandler(filters.TEXT & ~filters.COMMAND, quiz_q)],
            WAIT_QUIZ_OA:        [MessageHandler(filters.TEXT & ~filters.COMMAND, quiz_oa)],
            WAIT_QUIZ_OB:        [MessageHandler(filters.TEXT & ~filters.COMMAND, quiz_ob)],
            WAIT_QUIZ_OC:        [MessageHandler(filters.TEXT & ~filters.COMMAND, quiz_oc)],
            WAIT_QUIZ_OD:        [MessageHandler(filters.TEXT & ~filters.COMMAND, quiz_od)],
            WAIT_QUIZ_ANS:       [MessageHandler(filters.TEXT & ~filters.COMMAND, quiz_ans)],
            WAIT_QUIZ_EXP:       [MessageHandler(filters.TEXT & ~filters.COMMAND, quiz_exp)],
        },
        fallbacks=[
            CallbackQueryHandler(cancel, pattern="^main$"),
            CommandHandler("cancel", cancel),
        ],
        per_message=False,
    )

    app.add_handler(CommandHandler("start", start))
    app.add_handler(conv)
    app.add_handler(CallbackQueryHandler(button_handler))

    logger.info("🤖 GRIT Bot يعمل...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
