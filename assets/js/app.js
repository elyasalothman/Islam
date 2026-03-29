const API_BASE = 'https://api.aladhan.com/v1';
const qs = (s) => document.querySelector(s);
const setText = (id, t) => { const e = document.getElementById(id); if (e) e.textContent = t; };

async function loadPrayerTimes() {
    try {
        const res = await fetch(`${API_BASE}/timingsByCity?city=Riyadh&country=SA&method=4`);
        const json = await res.json();
        if (json.code === 200) {
            const t = json.data.timings;
            const table = qs('#prayerTableBody');
            table.innerHTML = `
                <tr><td>الفجر</td><td>${t.Fajr}</td></tr>
                <tr><td>الظهر</td><td>${t.Dhuhr}</td></tr>
                <tr><td>العصر</td><td>${t.Asr}</td></tr>
                <tr><td>المغرب</td><td>${t.Maghrib}</td></tr>
                <tr><td>العشاء</td><td>${t.Isha}</td></tr>
            `;
            setText('nextPrayerName', 'الفجر'); // تجريبي
            setText('nextPrayerTime', t.Fajr);
            localStorage.setItem('qibla', json.data.meta.qibla);
        }
    } catch (err) {
        console.error("خطأ في جلب الأوقات", err);
        qs('#prayerTableBody').innerHTML = "<tr><td>تعذر الاتصال بالشبكة</td></tr>";
    }
}

function initNav() {
    document.querySelectorAll('.bottom-nav button').forEach(btn => {
        btn.onclick = () => {
            const target = btn.dataset.target;
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
            document.getElementById(target).classList.add('active');
            btn.classList.add('active');
        };
    });
}

// تشغيل التطبيق
async function startApp() {
    initNav();
    await loadPrayerTimes();
    
    // إخفاء شاشة التحميل وإظهار الموقع
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('appBody').style.display = 'grid';
}

window.onload = startApp;
