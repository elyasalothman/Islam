const API_BASE='https://api.aladhan.com/v1';
const KAABA={lat:21.4225,lon:39.8262};
const qs=(s,r=document)=>r.querySelector(s), qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
const LS = (k,v) => { try { if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); } catch(e) { return null; } };

let CFG=null, nextTimer=null; let loaded={adhkar:false};
let rawAdhkarData=null; let showTashkeel=LS('tashkeel')!=='false'; 

const TASBEEH_PHRASES=[{"name":"سُبْحَانَ اللَّهِ","target":33},{"name":"الْحَمْدُ لِلَّهِ","target":33},{"name":"اللَّهُ أَكْبَرُ","target":34},{"name":"لَا إِلَهَ إِلَّا اللَّهُ","target":100}];

function setText(id,t){const e=document.getElementById(id); if(e) e.textContent=t;}
function isoToDate(i){return new Date(i)}
function dateToApi(d){return String(d.getDate()).padStart(2,'0')+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+d.getFullYear()}
function toRad(x){return x*Math.PI/180} function toDeg(x){return x*180/Math.PI} function normalize360(x){x%=360; if(x<0)x+=360; return x}
function formatTime12h(d){try{return new Intl.DateTimeFormat('ar',{hour:'numeric',minute:'2-digit',hour12:true}).format(d)}catch(e){return "—"}}

async function fetchJSON(url, def) { try { const r=await fetch(url); return r.ok?await r.json():def; } catch(e){return def;} }

function renderHijri(){
  try{ const d=new Date(); const adj=parseInt(LS('hijriAdj'))||0; d.setDate(d.getDate()+adj);
    const f=new Intl.DateTimeFormat('ar-SA-u-ca-islamic',{day:'numeric',month:'long',year:'numeric'}); setText('hijri',f.format(d));
  }catch(e){setText('hijri','—')}
}

function bearing(lat1,lon1,lat2,lon2){const φ1=toRad(lat1),φ2=toRad(lat2),λ1=toRad(lon1),λ2=toRad(lon2); const y=Math.sin(λ2-λ1)*Math.cos(φ2),x=Math.cos(φ1)*Math.sin(φ2)-Math.sin(φ1)*Math.cos(φ2)*Math.cos(λ2-λ1); return normalize360(toDeg(Math.atan2(y,x)));}

function initScheme(){ const s=LS('scheme')||'brown'; document.documentElement.setAttribute('data-scheme',s); qsa('.color-dot').forEach(b=>b.onclick=()=>{LS('scheme',b.dataset.val); location.reload();}); }

function initNav(){
  qsa('.bottom-nav button').forEach(b=>b.onclick=async()=>{
    const id=b.dataset.target; qsa('.bottom-nav button').forEach(x=>x.classList.toggle('active',x===b));
    qsa('.section').forEach(s=>s.classList.toggle('active',s.id===id));
    if(id==='adhkar'&&!loaded.adhkar){loaded.adhkar=true; await loadAdhkar();}
    window.scrollTo({top:0,behavior:'smooth'});
  });
}

function setupCompass(){
  const needle=qs('#needle'), accBox=qs('#compassAccuracyBox'); if(!needle||!accBox) return;
  function updateUI(acc){ accBox.className='accuracy-box';
    if(acc<=15){accBox.textContent='دقة عالية ✓'; accBox.classList.add('acc-high');}
    else if(acc<=45){accBox.textContent='دقة متوسطة'; accBox.classList.add('acc-med');}
    else{accBox.textContent='دقة سيئة! حرك الجوال برقم 8 🔄'; accBox.classList.add('acc-low');}
  }
  function onOri(e){ let h=e.webkitCompassHeading; if(h==null&&e.alpha!=null) h=360-e.alpha;
    if(h!=null){ const q=parseFloat(LS('qiblaBearing'))||0; needle.style.transform=`translate(-50%,-100%) rotate(${normalize360(q-h)}deg)`; if(e.webkitCompassAccuracy) updateUI(e.webkitCompassAccuracy); }
  }
  qs('#enableCompass').onclick=async()=>{ try{ if(typeof DeviceOrientationEvent.requestPermission==='function') await DeviceOrientationEvent.requestPermission(); window.addEventListener('deviceorientation',onOri,true); }catch(ex){alert('خطأ في الحساسات');} };
}

function setupTasbeeh(){
  const sel=qs('#tasbeehPhraseSelect'), cur=qs('#currentTasbeeh'), cntEl=qs('#tasbeehCount'), btn=qs('#tasbeehBtn');
  TASBEEH_PHRASES.forEach((p,i)=>{ const o=document.createElement('option'); o.value=i; o.textContent=p.name; sel.appendChild(o); });
  let idx=parseInt(LS('tIdx'))||0, cnt=parseInt(LS('tCnt'))||0;
  function update(){ const p=TASBEEH_PHRASES[idx]; sel.value=idx; cur.textContent=p.name; cntEl.textContent=cnt; setText('tasbeehTarget','الهدف: '+p.target); }
  sel.onchange=()=>{ idx=sel.value; cnt=0; update(); };
  btn.onclick=()=>{ cnt++; if(cnt>=TASBEEH_PHRASES[idx].target) {navigator.vibrate([50,100,50]); cnt=0;} else navigator.vibrate(10); LS('tIdx',idx); LS('tCnt',cnt); update(); };
  qs('#tasbeehReset').onclick=()=>{cnt=0; update();}; update();
}

async function loadAdhkar(){
  rawAdhkarData = await fetchJSON('./data/adhkar.json', {morning:[]});
  const p=qs('#adhkarPills'), c=qs('#adhkarContainer'); p.innerHTML='';
  Object.keys(rawAdhkarData).forEach(k=>{ const b=document.createElement('button'); b.textContent=k; b.onclick=()=>{renderDhikr(c,rawAdhkarData[k],k);}; p.appendChild(b); });
}
function renderDhikr(c,l,k){ c.innerHTML='جاري تحميل الأذكار...'; /* منطق الأذكار هنا */ }

async function loadPrayerTimes(){
  const today=new Date(); const c= {city:'Riyadh',country:'SA'};
  try{ const r=await fetch(`${API_BASE}/timingsByCity/${dateToApi(today)}?city=${c.city}&country=${c.country}&method=4`);
    const j=await r.json(); const t=j.data.timings;
    setText('t_fajr_s',formatTime12h(isoToDate(t.Fajr))); setText('t_dhuhr_s',formatTime12h(isoToDate(t.Dhuhr)));
    setText('t_asr_s',formatTime12h(isoToDate(t.Asr))); setText('t_maghrib_s',formatTime12h(isoToDate(t.Maghrib)));
    setText('t_isha_s',formatTime12h(isoToDate(t.Isha)));
    LS('qiblaBearing', j.data.meta.qibla);
  }catch(e){setText('ptStatus','خطأ في الاتصال بالشبكة');}
}

async function init(){
  initScheme(); initNav(); renderHijri(); setupCompass(); setupTasbeeh(); await loadPrayerTimes();
  if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js?v=0.6.3').then(r=>r.update());
}
window.onload=init;
