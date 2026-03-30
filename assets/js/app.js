// رفيق المسلم - الإصدار الذهبي v1.2.0
const API_BASE = 'https://api.aladhan.com/v1';

const ui = (id, text) => { 
    const el = document.getElementById(id); 
    if (el) el.innerHTML = text; 
};

// 1. تحميل كافة البيانات المحلية
async function fetchAppData() {
    try {
        // الفوائد
        const b = await fetch('./assets/data/benefits.json').then(r => r.json());
        ui('dailyBenefitContent', b[Math.floor(Math.random() * b.length)]);

        // التعلم والخطط
        const l = await fetch('./assets/data/learning.json').then(r => r.json());
        ui('learnPlanContainer', l.plan.map(p => `
            <div class="card inner-card" style="margin-bottom:10px">
                <div style="font-weight:bold; color:var(--accent)">${p.title}</div>
                <div class="small">${p.tip}</div>
            </div>`).join(''));
        ui('learnCollectionsList', l.collections.map(c => `<li><a href="${c.url}" target="_blank">${c.title}</a></li>`).join(''));

        // الروابط
        const r = await fetch('./assets/data/resources.json').then(r => r.json());
        ui('usefulLinksContainer', r.useful.map(g => `
            <h4 style="color:var(--muted); margin-top:15px">${g.group}</h4>
            <ul class="custom-list">${g.items.map(i => `<li><a href="${i.url}" target="_blank">${i.title}</a> - ${i.desc}</li>`).join('')}</ul>
        `).join(''));

        loadAdhkarSystem();
    } catch (e) { console.error("Data fetch error:", e); }
}

// 2. نظام الأذكار
async function loadAdhkarSystem() {
    const data = await fetch('./assets/data/adhkar.json').then(r => r.json());
    const pills = document.getElementById('adhkarPills');
    const cats = { morning: "الصباح", evening: "المساء", sleep: "النوم", afterPrayer: "بعد الصلاة", daily: "عامة" };

    pills.innerHTML = Object.keys(cats).map(key => `<button onclick="showAdhkar('${key}')">${cats[key]}</button>`).join('');

    window.showAdhkar = (key) => {
        document.getElementById('adhkarContainer').innerHTML = data[key].map((item, i) => `
            <div class="card inner-card" style="margin-bottom:15px">
                <p style="font-size:1.4rem; line-height:1.6">${item.text}</p>
                <button class="repeat-square" id="dkr-${key}-${i}" onclick="handleCount('${key}-${i}')">${item.repeat}</button>
            </div>`).join('');
        Array.from(pills.children).forEach(b => b.classList.toggle('active', b.textContent === cats[key]));
    };
    showAdhkar('morning');
}

window.handleCount = (id) => {
    const btn = document.getElementById(`dkr-${id}`);
    let c = parseInt(btn.textContent);
    if (c > 0) {
        btn.textContent = c - 1;
        if (c - 1 === 0) { btn.classList.add('done'); btn.textContent = "✓"; }
    }
};

// 3. أوقات الصلاة والعد التنازلي
async function startApp() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const res = await fetch(`${API_BASE}/timings?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&method=4`).then(r => r.json());
            if (res.code === 200) fillPrayerTable(res.data);
        }, () => ui('cityDisplay', "الرياض (افتراضي)"));
    }
}

function fillPrayerTable(data) {
    const t = data.timings;
    ui('t_fajr_s', t.Fajr); ui('t_fajr_e', t.Sunrise);
    ui('t_dhuhr_s', t.Dhuhr); ui('t_dhuhr_e', t.Asr);
    ui('t_asr_s', t.Asr); ui('t_asr_e', t.Maghrib);
    ui('t_maghrib_s', t.Maghrib); ui('t_maghrib_e', t.Isha);
    ui('t_isha_s', t.Isha); ui('t_isha_e', t.Fajr);
    ui('hijriDisplay', `${data.date.hijri.day} ${data.date.hijri.month.ar} ${data.date.hijri.year}`);
    ui('cityDisplay', "الرياض");

    // العد التنازلي
    const list = [{n:"الفجر",t:t.Fajr}, {n:"الظهر",t:t.Dhuhr}, {n:"العصر",t:t.Asr}, {n:"المغرب",t:t.Maghrib}, {n:"العشاء",t:t.Isha}];
    setInterval(() => {
        const now = new Date();
        let next = null;
        for (let p of list) {
            const [h,m] = p.t.split(':');
            const d = new Date(); d.setHours(h,m,0);
            if (d > now) { next = {...p, obj:d}; break; }
        }
        if (!next) {
            const [h,m] = list[0].t.split(':');
            const d = new Date(); d.setDate(d.getDate()+1); d.setHours(h,m,0);
            next = {...list[0], obj:d};
        }
        ui('nextPrayerName', next.n); ui('nextPrayerTime', next.t);
        const diff = next.obj - now;
        const h = Math.floor(diff/3600000), m = Math.floor((diff%3600000)/60000), s = Math.floor((diff%60000)/1000);
        ui('nextCountdown', `${h}:${m<10?'0'+m:m}:${s<10?'0'+s:s}`);
    }, 1000);
}

// تبديل الأقسام
document.querySelectorAll('.bottom-nav button').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(btn.dataset.target).classList.add('active');
        document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    };
});

window.onload = () => { fetchAppData(); startApp(); };
