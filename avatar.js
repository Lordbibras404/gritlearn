/* ============================================================
   GRIT Learn v5.0 — رفع صورة الحساب من الهاتف
   ============================================================ */
'use strict';

/* ══ فتح File Picker ══ */
function openAvatarPicker() {
  const input = document.getElementById('avatarFileInput');
  if (input) input.click();
}

/* ══ معالجة الصورة المختارة ══ */
function handleAvatarFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  // Check file type
  if (!file.type.startsWith('image/')) {
    showToast('⚠️', 'يرجى اختيار صورة صالحة');
    return;
  }

  // Check file size (max 3MB)
  if (file.size > 3 * 1024 * 1024) {
    showToast('⚠️', 'الصورة كبيرة جداً (الحد 3MB)');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataURL = e.target.result;
    // Compress the image
    compressImage(dataURL, 200, 200, 0.8, (compressed) => {
      applyAvatar(compressed);
    });
  };
  reader.onerror = () => showToast('❌', 'فشل قراءة الصورة');
  reader.readAsDataURL(file);

  // Reset input so same file can be picked again
  event.target.value = '';
}

/* ══ ضغط الصورة ══ */
function compressImage(dataURL, maxW, maxH, quality, callback) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    let { width, height } = img;

    // Calculate aspect ratio
    const ratio = Math.min(maxW / width, maxH / height);
    width  = Math.round(width  * ratio);
    height = Math.round(height * ratio);

    canvas.width  = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    // Circular clip
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, 0, 0, width, height);

    callback(canvas.toDataURL('image/jpeg', quality));
  };
  img.onerror = () => callback(dataURL); // fallback original
  img.src = dataURL;
}

/* ══ تطبيق الصورة ══ */
function applyAvatar(dataURL) {
  state.avatar = dataURL;
  state.hasCustomAvatar = true;
  saveState();

  // Update all avatar elements in page
  refreshAllAvatars(dataURL);

  checkBadges();
  showToast('📸', 'تم تحديث صورة حسابك!');
}

/* ══ تحديث جميع عناصر Avatar في الصفحة ══ */
function refreshAllAvatars(src) {
  const ids = ['profileAvatar', 'homeAvatar', 'lbMyAvatar'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (src) {
      el.innerHTML = `<img src="${src}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    } else {
      el.innerHTML = (state.name?.[0] || 'ط').toUpperCase();
    }
  });
}

/* ══ حذف الصورة ══ */
function removeAvatar() {
  state.avatar = null;
  state.hasCustomAvatar = false;
  saveState();
  refreshAllAvatars(null);
  showToast('🗑', 'تم حذف الصورة');
}

/* ══ تهيئة عند تحميل ══ */
function initAvatars() {
  if (state.avatar) {
    refreshAllAvatars(state.avatar);
  }
}
