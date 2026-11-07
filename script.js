// KMUTNB Open House - Student Editor Script

const STORAGE_KEY = 'kmutnb_openhouse_report_data_v2';
const BANNER_SRC = 'openhouse_banner.png';

// Default template data (Only duty / หน้าที่)
const defaultData = {
    student: {
        name: "ศุกลภัทร สุเมธรัตน์",
        studentId: "6x-xxxx-xxxx-x",
        faculty: "คณะครุศาสตร์อุตสาหกรรม",
        department: "ภาควิชาคอมพิวเตอร์ศึกษา (TCT)",
        subject: "รายงานผลการปฏิบัติงาน KMUTNB Open House 2027",
        teacher: "อาจารย์ประจำวิชา / ผู้ประเมินผล",
        eventDate: "6 - 7 พฤศจิกายน 2569",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
        summary: "รายงานผลการเข้าร่วมปฏิบัติหน้าที่และการจัดแสดงผลงานนวัตกรรม ในงานเปิดบ้านวิชาการมหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (KMUTNB Open House 2027) ภายใต้แนวคิด AI Plus EDUCATION โดยภาควิชาคอมพิวเตอร์ศึกษา (TCT)"
    },
    days: [
        {
            id: 'day-1',
            dayNum: 'DAY 1',
            date: '6 พฤศจิกายน 2569',
            title: 'เตรียมความพร้อม & จัดระบบบูธนิทรรศการ',
            duty: 'จัดเตรียมสถานที่ ติดตั้งเครื่องคอมพิวเตอร์ โครงงานสื่อการสอน AI และระบบเครือข่ายสำหรับบูธภาควิชาคอมพิวเตอร์ศึกษา (TCT) เพื่อให้พร้อมรับนักเรียนและผู้ปกครอง',
            photos: []
        },
        {
            id: 'day-2',
            dayNum: 'DAY 2',
            date: '7 พฤศจิกายน 2569',
            title: 'นำเสนอผลงาน & ประชาสัมพันธ์หลักสูตร',
            duty: 'สาธิตนวัตกรรม AI Plus EDUCATION และโครงงานของภาควิชา แนะนำแนวทางการศึกษาต่อในหลักสูตรครุศาสตร์อุตสาหกรรม และตอบข้อซักถามแก่นักเรียนระดับมัธยมศึกษาและอาชีวศึกษา',
            photos: []
        },
        {
            id: 'day-3',
            dayNum: 'DAY 3 / สรุปผล',
            date: '7 พฤศจิกายน 2569 (ช่วงปิดงาน)',
            title: 'สรุปผลการจัดงาน & รื้อถอนพื้นที่',
            duty: 'รวบรวมแบบประเมินความพึงพอใจของผู้เข้าร่วมชมงาน ตรวจนับและรื้อถอนอุปกรณ์คอมพิวเตอร์ สื่อการแสดง พร้อมทำความสะอาดส่งมอบพื้นที่ให้เรียบร้อย',
            photos: []
        }
    ]
};

let appData = null;
let currentFilter = 'all';

// Load Data from Cloud Database
async function loadData() {
    try {
        flashSaveNotice('กำลังโหลดข้อมูลล่าสุดจาก Cloud ☁️...');
        let res = null;
        try {
            res = await fetch('/api/sync?t=' + Date.now(), { cache: 'no-store' });
        } catch (e) {}

        if (res && res.ok) {
            appData = await res.json();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
            flashSaveNotice('โหลดข้อมูลล่าสุดจาก Cloud สำเร็จ ✓');
        } else {
            const res2 = await fetch('data.json?t=' + Date.now(), { cache: 'no-store' });
            if (res2.ok) {
                appData = await res2.json();
            } else {
                const saved = localStorage.getItem(STORAGE_KEY);
                appData = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(defaultData));
            }
        }
    } catch (e) {
        console.error("Failed to load data:", e);
        appData = JSON.parse(JSON.stringify(defaultData));
    }
    renderProfile();
    renderDayTabs();
    renderDays();
}

const syncChannel = ('BroadcastChannel' in window) ? new BroadcastChannel('kmutnb_openhouse_sync') : null;
let syncTimeout = null;

function saveToCloud() {
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
        try {
            flashSaveNotice('กำลังซิงก์ข้อมูลขึ้น Cloud ☁️...');
            const res = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appData)
            });
            if (res.ok) {
                flashSaveNotice('✅ บันทึกขึ้น Cloud สำเร็จ! iPad และทุกเครื่องจะเห็นทันที');
            } else {
                flashSaveNotice('บันทึกในเครื่องแล้ว ✓');
            }
        } catch (e) {
            flashSaveNotice('บันทึกในเครื่องแล้ว ✓');
        }
    }, 600);
}

// Save Data
function saveData(showNotice = true) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
        if (showNotice) {
            flashSaveNotice('บันทึกข้อมูลเรียบร้อยแล้ว ✓');
        }
        if (syncChannel) {
            syncChannel.postMessage({ type: 'DATA_UPDATED', data: appData });
        }
        saveToCloud();
    } catch (e) {
        console.warn("Storage quota may be reached:", e);
        saveToCloud();
    }
}

// Flash Notification
function flashSaveNotice(msg, isError = false) {
    const el = document.getElementById('save-status');
    if (!el) return;
    el.innerHTML = `<span class="save-dot" style="background:${isError ? '#ef4444' : '#10b981'}"></span> <span>${msg}</span>`;
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
    setTimeout(() => {
        el.style.opacity = '0.7';
    }, 2500);
}

// Compress uploaded images
function compressImage(file, maxDimension = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

// Render Profile Card
function renderProfile() {
    const p = appData.student;
    const container = document.getElementById('profile-container');
    if (!container) return;

    container.innerHTML = `
        <div class="glass-panel profile-card">
            <div class="profile-header-wrap">
                <div class="profile-avatar-box">
                    <img src="${p.avatar || 'https://via.placeholder.com/150'}" alt="${p.name}" class="profile-avatar-img" id="student-avatar-img">
                    <label class="profile-avatar-upload-btn" title="เปลี่ยนรูปโปรไฟล์">
                        📷
                        <input type="file" accept="image/*" id="avatar-input" style="display:none;" onchange="handleAvatarUpload(event)">
                    </label>
                </div>
                <div class="profile-info">
                    <span class="academic-badge">แบบฟอร์มแก้ไขข้อมูลนักศึกษา</span>
                    <input type="text" class="editable-input profile-name" value="${p.name}" placeholder="ชื่อ - นามสกุล" onchange="updateProfileField('name', this.value)">
                    <div style="margin-top: 4px;">
                        <input type="text" class="editable-input" style="color:var(--text-secondary); font-size:1.05rem;" value="${p.department}" placeholder="ภาควิชา / สาขา" onchange="updateProfileField('department', this.value)">
                    </div>
                </div>
            </div>

            <div class="profile-meta-grid">
                <div class="meta-item">
                    <div class="meta-label">🎓 รหัสนักศึกษา:</div>
                    <input type="text" class="editable-input" value="${p.studentId}" placeholder="รหัสนักศึกษา" onchange="updateProfileField('studentId', this.value)">
                </div>
                <div class="meta-item">
                    <div class="meta-label">🏛️ คณะ / มหาวิทยาลัย:</div>
                    <input type="text" class="editable-input" value="${p.faculty}" placeholder="คณะ / สถาบัน" onchange="updateProfileField('faculty', this.value)">
                </div>
                <div class="meta-item">
                    <div class="meta-label">📚 รายวิชาที่นำส่ง:</div>
                    <input type="text" class="editable-input" value="${p.subject}" placeholder="ชื่อวิชา / โครงงาน" onchange="updateProfileField('subject', this.value)">
                </div>
                <div class="meta-item">
                    <div class="meta-label">👨‍🏫 อาจารย์ผู้สอน / ที่ปรึกษา:</div>
                    <input type="text" class="editable-input" value="${p.teacher}" placeholder="ชื่ออาจารย์" onchange="updateProfileField('teacher', this.value)">
                </div>
            </div>

            <div style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.08);">
                <div class="meta-label" style="margin-bottom:0.4rem;">📝 วัตถุประสงค์ / สรุปภาพรวมการปฏิบัติหน้าที่:</div>
                <textarea class="editable-textarea" rows="2" placeholder="อธิบายภาพรวมกิจกรรม..." onchange="updateProfileField('summary', this.value)">${p.summary}</textarea>
            </div>
        </div>
    `;
}

window.updateProfileField = function(key, val) {
    appData.student[key] = val;
    saveData();
};

window.handleAvatarUpload = async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
        const compressed = await compressImage(file, 400, 0.85);
        appData.student.avatar = compressed;
        saveData();
        renderProfile();
    } catch (err) {
        alert('เกิดข้อผิดพลาดในการโหลดรูปภาพ');
    }
};

// Render Filter Tabs
function renderDayTabs() {
    const nav = document.getElementById('day-nav-tabs');
    if (!nav) return;

    let html = `
        <button class="day-tab-btn ${currentFilter === 'all' ? 'active' : ''}" onclick="filterDay('all')">
            📑 จัดการทุกวัน (${appData.days.length} วัน)
        </button>
    `;

    appData.days.forEach(d => {
        html += `
            <button class="day-tab-btn ${currentFilter === d.id ? 'active' : ''}" onclick="filterDay('${d.id}')">
                🗓️ ${d.dayNum}
            </button>
        `;
    });

    html += `
        <button class="day-tab-btn" style="background: rgba(243,112,33,0.15); border-color: var(--km-orange); color:var(--km-orange-light);" onclick="addNewDay()">
            ➕ เพิ่มวันถัดไป
        </button>
    `;

    nav.innerHTML = html;
}

window.filterDay = function(dayId) {
    currentFilter = dayId;
    renderDayTabs();
    renderDays();
};

// Render Days (เน้นเฉพาะ "หน้าที่และความรับผิดชอบ")
function renderDays() {
    const container = document.getElementById('days-container');
    if (!container) return;

    const filtered = currentFilter === 'all' 
        ? appData.days 
        : appData.days.filter(d => d.id === currentFilter);

    if (filtered.length === 0) {
        container.innerHTML = `<div class="glass-panel" style="padding:2rem; text-align:center;">ไม่พบข้อมูลของวันที่เลือก</div>`;
        return;
    }

    container.innerHTML = filtered.map(d => {
        const photosHtml = (d.photos || []).map((photo, pIdx) => `
            <div class="photo-item-card">
                <div class="photo-img-wrapper" onclick="openLightbox('${photo.src}', '${encodeURIComponent(photo.caption || '')}')">
                    <img src="${photo.src}" alt="ภาพกิจกรรม" class="photo-img" loading="lazy">
                    <div class="photo-zoom-hint">🔍</div>
                </div>
                <div class="photo-caption-box">
                    <input type="text" class="photo-caption-input" value="${photo.caption || ''}" placeholder="ใส่คำอธิบายภาพนี้..." onchange="updatePhotoCaption('${d.id}', ${pIdx}, this.value)">
                </div>
                <button class="photo-delete-btn" title="ลบภาพนี้" onclick="deletePhoto('${d.id}', ${pIdx})">
                    ✕
                </button>
            </div>
        `).join('');

        return `
            <article class="glass-panel day-card" id="${d.id}">
                <div class="day-card-header">
                    <div>
                        <div class="day-badge-pill">
                            <span>📅</span> ${d.dayNum}
                        </div>
                        <input type="text" class="editable-input day-card-title-input" value="${d.title}" placeholder="หัวข้อกิจกรรมประจำวัน" onchange="updateDayField('${d.id}', 'title', this.value)">
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.5rem;">
                        <input type="text" class="editable-input day-card-date-input" value="${d.date}" placeholder="ระบุวันที่" onchange="updateDayField('${d.id}', 'date', this.value)">
                        ${appData.days.length > 1 ? `
                            <button class="btn btn-danger" style="padding:0.25rem 0.65rem; font-size:0.75rem;" onclick="removeDay('${d.id}')">
                                🗑️ ลบวันนี้
                            </button>
                        ` : ''}
                    </div>
                </div>

                <!-- รูปภาพกิจกรรม -->
                <div>
                    <div class="gallery-section-title">
                        <span>📸 ภาพถ่ายการปฏิบัติกิจกรรม (${(d.photos || []).length} รูป)</span>
                    </div>

                    <div class="photo-grid">
                        ${photosHtml}

                        <!-- กล่องกดเพิ่มรูปภาพ -->
                        <div class="upload-dropzone" onclick="document.getElementById('photo-input-${d.id}').click()">
                            <span class="upload-icon">📷</span>
                            <div class="upload-title">+ เพิ่มรูปภาพของวันนี้</div>
                            <div class="upload-hint">คลิกหรือแตะเพื่อเลือกรูปจากมือถือหรือคอมพิวเตอร์</div>
                            <input type="file" id="photo-input-${d.id}" accept="image/*" multiple style="display:none;" onchange="handleDayPhotosUpload('${d.id}', event)">
                        </div>
                    </div>
                </div>

                <!-- แสดงเฉพาะหน้าที่และความรับผิดชอบเท่านั้น -->
                <div style="margin-top: 1.25rem;">
                    <div style="font-size: 0.95rem; font-weight: 700; color: var(--km-orange-light); margin-bottom: 0.5rem; display:flex; align-items:center; gap: 0.4rem;">
                        📌 หน้าที่และความรับผิดชอบที่ปฏิบัติในวันนี้:
                    </div>
                    <textarea class="editable-textarea" rows="4" placeholder="พิมพ์อธิบายหน้าที่และกิจกรรมที่คุณทำในวันนี้ เช่น จัดเตรียมบูธ นำเสนอโครงงาน แนะนำหลักสูตร ดูแลระบบ..." onchange="updateDayField('${d.id}', 'duty', this.value)">${d.duty || ''}</textarea>
                </div>
            </article>
        `;
    }).join('');
}

window.updateDayField = function(dayId, field, val) {
    const day = appData.days.find(d => d.id === dayId);
    if (day) {
        day[field] = val;
        saveData();
    }
};

window.handleDayPhotosUpload = async function(dayId, event) {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    const day = appData.days.find(d => d.id === dayId);
    if (!day) return;
    if (!day.photos) day.photos = [];

    flashSaveNotice('กำลังโหลดรูปภาพ...');

    for (const file of files) {
        try {
            const compressed = await compressImage(file, 1280, 0.82);
            day.photos.push({
                id: Date.now() + Math.random().toString(),
                src: compressed,
                caption: file.name.replace(/\.[^/.]+$/, "")
            });
        } catch (e) {
            console.error('Error processing photo:', e);
        }
    }

    saveData();
    renderDays();
    event.target.value = '';
};

window.deletePhoto = function(dayId, photoIndex) {
    if (!confirm('ต้องการลบรูปภาพนี้ใช่หรือไม่?')) return;
    const day = appData.days.find(d => d.id === dayId);
    if (day && day.photos) {
        day.photos.splice(photoIndex, 1);
        saveData();
        renderDays();
    }
};

window.updatePhotoCaption = function(dayId, photoIndex, caption) {
    const day = appData.days.find(d => d.id === dayId);
    if (day && day.photos && day.photos[photoIndex]) {
        day.photos[photoIndex].caption = caption;
        saveData();
    }
};

window.addNewDay = function() {
    const nextNum = appData.days.length + 1;
    const newDay = {
        id: 'day-' + Date.now(),
        dayNum: `DAY ${nextNum}`,
        date: `วันที่จัดกิจกรรมวันที่ ${nextNum}`,
        title: `กิจกรรมและการปฏิบัติงานวันที่ ${nextNum}`,
        duty: 'ระบุหน้าที่และความรับผิดชอบในวันนี้',
        photos: []
    };
    appData.days.push(newDay);
    saveData();
    currentFilter = newDay.id;
    renderDayTabs();
    renderDays();
};

window.removeDay = function(dayId) {
    if (!confirm('ต้องการลบข้อมูลของวันนี้ทั้งหมดใช่หรือไม่?')) return;
    appData.days = appData.days.filter(d => d.id !== dayId);
    saveData();
    currentFilter = 'all';
    renderDayTabs();
    renderDays();
};

// Lightbox
window.openLightbox = function(src, captionEnc) {
    const modal = document.getElementById('lightbox-modal');
    const img = document.getElementById('lightbox-img');
    const cap = document.getElementById('lightbox-caption');
    if (!modal || !img) return;

    img.src = src;
    cap.innerText = decodeURIComponent(captionEnc || '');
    modal.classList.add('active');
};

window.closeLightbox = function() {
    const modal = document.getElementById('lightbox-modal');
    if (modal) modal.classList.remove('active');
};

// Export Backup JSON
window.exportData = function() {
    const jsonStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KMUTNB_OpenHouse_Report_${(appData.student.name || 'data').replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

// Import Backup JSON
window.importData = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (imported.student && imported.days) {
                appData = imported;
                saveData();
                renderProfile();
                renderDayTabs();
                renderDays();
                alert('นำเข้าข้อมูลสำเร็จแล้ว!');
            } else {
                alert('รูปแบบไฟล์ข้อมูลไม่ถูกต้อง');
            }
        } catch (err) {
            alert('ไม่สามารถอ่านไฟล์ได้');
        }
    };
    reader.readAsText(file);
};

// Reset
window.resetToDefault = function() {
    if (confirm('ต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?')) {
        appData = JSON.parse(JSON.stringify(defaultData));
        saveData();
        renderProfile();
        renderDayTabs();
        renderDays();
    }
};

// Particles
function setupCanvasParticles() {
    const canvas = document.getElementById('antigravity-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let particles = [];
    let mouse = { x: null, y: null, radius: 120 };

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', (e) => { mouse.x = e.x; mouse.y = e.y; });
    window.addEventListener('mouseout', () => { mouse.x = null; mouse.y = null; });

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.8;
            this.vx = (Math.random() - 0.5) * 0.7;
            this.vy = (Math.random() - 0.5) * 0.7;
            this.color = Math.random() > 0.5 ? '#f37021' : '#00d2ff';
            this.alpha = Math.random() * 0.4 + 0.2;
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.restore();
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height;
            if (this.y > canvas.height) this.y = 0;

            if (mouse.x !== null) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < mouse.radius) {
                    const angle = Math.atan2(dy, dx);
                    this.x -= Math.cos(angle) * 2;
                    this.y -= Math.sin(angle) * 2;
                }
            }
            this.draw();
        }
    }

    const count = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 18000), 50);
    particles = Array.from({ length: count }, () => new Particle());

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => p.update());
        requestAnimationFrame(animate);
    }
    animate();
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderProfile();
    renderDayTabs();
    renderDays();
    setupCanvasParticles();
});
