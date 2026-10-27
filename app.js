"use strict";
/* BDSクロバス - 関西大学BDS学部 学生専用情報共有アプリ */
const COURSES = (window.BDS_COURSES || []).concat(window.BDS_EXTRA_COURSES || []);
const ZEMI = window.BDS_ZEMI || [];
const $app = document.getElementById("app");
const $modal = document.getElementById("modal-root");

function load(key, def){ try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }catch(e){ return def; } }
function save(key, v){ localStorage.setItem(key, JSON.stringify(v)); }
function esc(s){ return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function todayStr(){ const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function toast(msg){ const t=document.createElement("div"); t.className="toast"; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),2600); }

let user = load("bds_user", null);
let reviews = load("bds_reviews", {});
let exams = load("bds_exams", {});
let zemiPosts = load("bds_zemi_posts", {});
let zemiInfo = load("bds_zemi_info", {});
let events = load("bds_events", null);
let books = load("bds_books", null);
let board = load("bds_board", null);
let candidates = load("bds_candidates", []);
if(!events){ events = []; save("bds_events", events); }
if(!books){ books = []; save("bds_books", books); }
if(!board){ board = [
  {id:"seed-b1", title:"BDSクロバスが始まりました", body:"1期生には先輩の口コミも過去問もない。だから自分たちで作ります。受けた授業の口コミ、ゼミの雰囲気、テスト日程、使い終わった教科書。次の学年のためにも、知っていることを少しずつ残していってください。", cat:"お知らせ", by:"運営", grade:"-", date:"2026-10-28"}
]; save("bds_board", board); }

/* ---------- student gate ---------- */
function renderUserbox(){
  const box = document.getElementById("userbox");
  if(user){
    box.innerHTML = '<span class="chip">'+esc(user.grade)+'回生 '+esc(user.name)+'</span><button id="logoutBtn">登録を変更</button>';
    document.getElementById("logoutBtn").onclick = () => { if(confirm("登録情報を消して、最初の登録画面に戻りますか？（投稿した内容はこの端末に残ります）")){ localStorage.removeItem("bds_user"); user=null; renderUserbox(); showGate(); } };
  } else {
    box.innerHTML = '<button id="loginBtn" style="background:#fff;color:var(--navy);border:0;border-radius:6px;padding:6px 14px;font-weight:700">学生登録</button>';
    document.getElementById("loginBtn").onclick = showGate;
  }
}
function showGate(){
  $modal.innerHTML = '<div class="modal-bg"><div class="modal">'
  + '<h2>学生登録</h2>'
  + '<p class="note">BDSクロバスは<strong>関西大学の学生だけ</strong>が使える場所です。先生や学外の人は登録できません。<br>登録には、大学のログインで使う<strong>学籍番号（kから始まるID）</strong>が必要です。</p>'
  + '<div class="err" id="gateErr"></div>'
  + '<div class="formgrid">'
  + '<div class="field"><label>名前（ニックネームでもOK。本名でなくて大丈夫です）</label><input id="gName" type="text" placeholder="例: つばさ" autocomplete="off"></div>'
  + '<div class="field"><label>学籍番号（k + 数字6桁。例: k924030）</label><input id="gSid" type="text" placeholder="ここに学籍番号を入力" autocomplete="off"></div>'
  + '<div class="field"><label>学年</label><select id="gGrade"><option value="">選んでください</option><option>1</option><option>2</option><option>3</option><option>4</option></select></div>'
  + '<div class="field"><label>学部</label><select id="gFac"><option>ビジネスデータサイエンス学部</option><option>その他の学部（関大生）</option></select></div>'
  + '</div>'
  + '<p class="note">※ 学籍番号はこの端末の中にだけ保存され、外部に送信されません。なりすまし防止のため、形式が合わない場合は登録できません。</p>'
  + '<button class="btn" id="gateSubmit" style="width:100%">登録してはじめる</button>'
  + (user ? '<button class="btn ghost" id="gateCancel" style="width:100%;margin-top:8px">キャンセル</button>' : '')
  + '</div></div>';
  const err = document.getElementById("gateErr");
  document.getElementById("gateSubmit").onclick = () => {
    const name = document.getElementById("gName").value.trim();
    const sid = document.getElementById("gSid").value.trim().toLowerCase();
    const grade = document.getElementById("gGrade").value;
    const fac = document.getElementById("gFac").value;
    if(!name){ err.style.display="block"; err.textContent="名前を入力してください（ニックネームでOKです）"; return; }
    if(!/^k\d{6}$/.test(sid)){ err.style.display="block"; err.textContent="学籍番号の形式が違います。「k + 数字6桁」で入力してください。例: k924030"; return; }
    if(!grade){ err.style.display="block"; err.textContent="学年を選んでください"; return; }
    user = { name, grade, fac }; /* 学籍番号は形式チェックだけに使い、保存しない */
    save("bds_user", user);
    $modal.innerHTML = "";
    renderUserbox();
    toast("登録しました。ようこそ、BDSクロバスへ");
    render();
  };
  const cancel = document.getElementById("gateCancel");
  if(cancel) cancel.onclick = () => { $modal.innerHTML=""; };
}
function requireUser(){
  if(user) return true;
  showGate();
  toast("投稿するには学生登録が必要です");
  return false;
}

/* ---------- grading helpers ---------- */
const GCATS = [
  ["test","定期試験","g-test"],["report","レポート","g-report"],["attend","出席・平常","g-attend"],
  ["assign","課題・演習","g-assign"],["present","発表","g-present"],["other","小テスト・その他","g-other"]
];
function gbar(c){
  const total = GCATS.reduce((s,[k])=>s+(c.cats[k]||0),0);
  if(!total) return '<div class="glegend">評価配分: シラバス未掲載（口コミで補完してください）</div>';
  let bar = '<div class="gbar">', leg = '<div class="glegend">';
  for(const [k,label,cls] of GCATS){
    const v = c.cats[k]||0; if(!v) continue;
    bar += '<i class="'+cls+'" style="width:'+(v/total*100)+'%"></i>';
    leg += '<span><i class="'+cls+'"></i>'+label+' '+v+'%</span>';
  }
  return bar+'</div>'+leg+'</div>';
}
function courseReviews(entry){ return reviews[entry.id] || []; }
function avgStars(entry){
  const rs = courseReviews(entry); if(!rs.length) return null;
  return (rs.reduce((s,r)=>s+(+r.easy||0),0)/rs.length);
}
function stars(n){ const f = Math.round(n); return "★★★★★".slice(0,f) + "☆☆☆☆☆".slice(0,5-f); }

/* ---------- navigation ---------- */
let view = "home";
let courseFilter = { q:"", preset:"", term:"", day:"", tag:"", minTest:"", sort:"name" };
let selectedCourseName = null, selectedTeacherIdx = 0;
let calCursor = (()=>{ const d=new Date(); return {y:d.getFullYear(), m:d.getMonth()}; })();

document.getElementById("mainnav").addEventListener("click", e => {
  const b = e.target.closest("button[data-nav]"); if(!b) return;
  view = b.dataset.nav; selectedCourseName = null;
  document.querySelectorAll("#mainnav button").forEach(x=>x.classList.toggle("active", x===b));
  render(); window.scrollTo(0,0);
});
document.querySelector(".brand").addEventListener("click", e => { e.preventDefault(); view="home"; selectedCourseName=null; render(); window.scrollTo(0,0); });

function render(){
  if(selectedCourseName){ renderCourseDetail(); return; }
  if(view==="home") renderHome();
  else if(view==="courses") renderCourses();
  else if(view==="zemi") renderZemi();
  else if(view==="calendar") renderCalendar();
  else if(view==="books") renderBooks();
  else if(view==="board") renderBoard();
}

/* ---------- home ---------- */
function renderHome(){
  const totalReviews = Object.values(reviews).reduce((s,a)=>s+a.length,0);
  const totalExams = Object.values(exams).reduce((s,a)=>s+a.length,0);
  const uniqNames = new Set(COURSES.map(c=>c.name)).size;
  const test100 = COURSES.filter(c=>(c.cats.test||0)>=100);
  const noExam = COURSES.filter(c=>c.noExam);
  const upcoming = [...events].filter(e=>e.date>=todayStr()).sort((a,b)=>a.date<b.date?-1:1).slice(0,5);
  $app.innerHTML =
  '<section class="hero"><h1>先輩のいない学部の、みんなの情報庫。</h1>'
  + '<p>BDS学部はまだ1期生・2期生だけの新しい学部。どの授業がテスト何割か、どのゼミが自分に合いそうか、教科書は誰か譲ってくれないか。そういう情報が、ここに集まります。授業データは公式シラバス（2026年度）から。口コミと過去問は、みんなの投稿で育ちます。</p>'
  + '<div class="searchbar"><input type="text" id="homeQ" placeholder="授業名・先生の名前で検索（例: 経営戦略論、因果推論、矢田）"><button class="btn" id="homeSearch">授業を探す</button></div>'
  + '<div class="quickchips">'
  + '<button class="qchip" data-preset="test100">定期テスト100%の授業</button>'
  + '<button class="qchip" data-preset="noexam">定期テストなし</button>'
  + '<button class="qchip" data-preset="attend">出席・平常だけで決まる</button>'
  + '<button class="qchip" data-preset="report">レポート中心</button>'
  + '<button class="qchip" data-preset="ondemand">集中・オンデマンド系</button>'
  + '<button class="qchip" data-navto="zemi">ゼミを見てみる</button>'
  + '</div></section>'
  + '<div class="stats">'
  + '<div class="stat"><b>'+uniqNames+'<small style="font-size:14px"> 科目</small></b><span>掲載中の授業（クラス違い含め'+COURSES.length+'件）</span></div>'
  + '<div class="stat"><b>'+ZEMI.length+'<small style="font-size:14px"> ゼミ</small></b><span>ゼミ（教員）一覧</span></div>'
  + '<div class="stat"><b>'+totalReviews+'<small style="font-size:14px"> 件</small></b><span>学生の口コミ投稿</span></div>'
  + '<div class="stat"><b>'+totalExams+'<small style="font-size:14px"> 件</small></b><span>過去問・過去レポート情報</span></div>'
  + '<div class="stat"><b>'+books.length+'<small style="font-size:14px"> 件</small></b><span>教科書の出品</span></div>'
  + '</div>'
  + '<h2 class="sec">近づいている予定</h2>'
  + (upcoming.length ? upcoming.map(e=>'<div class="listrow"><div><strong>'+esc(e.date)+'</strong>　'+esc(e.title)+' <span class="tag">'+esc(e.type)+'</span><div class="meta" style="font-size:12.5px;color:var(--mut)">'+esc(e.detail||"")+'</div></div><button class="btn ghost small" data-navto="calendar">カレンダーで見る</button></div>').join("") : '<div class="empty">まだ予定が登録されていません。テストの日やゼミ説明会の日程を知っていたら、カレンダーから追加してください。</div>')
  + '<h2 class="sec">定期テスト100%の授業</h2><p class="sec-note">シラバスの成績評価が定期試験100%の授業です。一発勝負になるので、過去問の有無が効いてきます。</p>'
  + '<div class="grid">'+ test100.map(courseCard).join("") +'</div>'
  + '<h2 class="sec">まずはここから</h2>'
  + '<div class="grid">'
  + '<div class="card"><h3>受けた授業の口コミを残す</h3><p class="desc">「テストは持ち込み可だった」「課題は毎週出る」みたいな一言が、次の学年の履修登録を救います。授業ページから、先生ごとに書き込めます。</p><button class="btn small" data-navto="courses">授業一覧へ</button></div>'
  + '<div class="card"><h3>ゼミ選びで迷っている人へ</h3><p class="desc">ゼミ一覧では、先生の研究分野・タグ・先輩の書き込みをまとめています。説明会の日程やオンデマンドのリンクを知っていたら、ゼミページから追加してください。</p><button class="btn small" data-navto="zemi">ゼミ一覧へ</button></div>'
  + '<div class="card"><h3>教科書、譲り合おう</h3><p class="desc">使い終わった教科書は、後輩が探しています。出品は無料。受け渡しは吹田みらいキャンパス内で。</p><button class="btn small" data-navto="books">教科書売買へ</button></div>'
  + '</div>';
  document.getElementById("homeSearch").onclick = () => { courseFilter = {q:document.getElementById("homeQ").value.trim(), preset:"", term:"", day:"", tag:"", minTest:"", sort:"name"}; view="courses"; setNav("courses"); render(); };
  document.getElementById("homeQ").addEventListener("keydown", e=>{ if(e.key==="Enter") document.getElementById("homeSearch").click(); });
  $app.querySelectorAll("[data-preset]").forEach(b=>b.onclick=()=>{ courseFilter={q:"",preset:b.dataset.preset,term:"",day:"",tag:"",minTest:"",sort:"name"}; view="courses"; setNav("courses"); render(); });
  $app.querySelectorAll("[data-navto]").forEach(b=>b.onclick=()=>{ view=b.dataset.navto; setNav(view); render(); window.scrollTo(0,0); });
  bindCourseCards();
}
function setNav(v){ document.querySelectorAll("#mainnav button").forEach(x=>x.classList.toggle("active", x.dataset.nav===v)); }

function courseCard(c){
  const a = avgStars(c);
  const rc = courseReviews(c).length;
  const ec = (exams[c.id]||[]).length;
  return '<article class="card"><h3><a href="#" data-course="'+esc(c.name)+'">'+esc(c.name)+'</a></h3>'
  + '<div class="meta">'+esc(c.instructor)+' ／ '+esc(c.term)+'学期 '+esc(c.schedule)+' ／ '+esc(c.credits)+'単位'+(c.cls?' ／ クラス'+esc(c.cls):'')+'</div>'
  + gbar(c)
  + '<div class="tagrow">'+ c.tags.map(t=>'<span class="tag">'+esc(t)+'</span>').join("") + ((c.noExam && (c.cats.test||0)===0)?'<span class="tag ok">定期テストなし</span>':'') + (GCATS.reduce((s,[k])=>s+(c.cats[k]||0),0)===0?'<span class="tag warn">評価配分は要確認</span>':'') + (ec?'<span class="tag warn">過去問 '+ec+'件</span>':'') +'</div>'
  + '<div class="meta">'+(rc>=3&&a?('<span class="stars">'+stars(a)+'</span> 取りやすさ '+a.toFixed(1)+'（口コミ'+rc+'件）'):rc>0?('口コミ '+rc+'件（3件たまったら平均を表示します）'):'口コミはまだありません')+'</div>'
  + '<button class="btn ghost small" data-cand="'+esc(c.id)+'">'+(candidates.includes(c.id)?'候補から外す':'履修候補に入れる')+'</button>'
  + '</article>';
}
function bindCourseCards(){
  $app.querySelectorAll("[data-course]").forEach(a=>a.onclick=e=>{ e.preventDefault(); selectedCourseName=a.dataset.course; selectedTeacherIdx=0; render(); window.scrollTo(0,0); });
  $app.querySelectorAll("[data-cand]").forEach(b=>b.onclick=e=>{
    e.preventDefault();
    const id=b.dataset.cand;
    if(candidates.includes(id)){ candidates=candidates.filter(x=>x!==id); toast("履修候補から外しました"); }
    else { candidates.push(id); toast("履修候補に入れました（授業を探すページの上部で並べて見られます）"); }
    save("bds_candidates", candidates);
    b.textContent = candidates.includes(id) ? '候補から外す' : '履修候補に入れる';
  });
}

/* ---------- courses list ---------- */
function applyFilter(list){
  const f = courseFilter;
  let out = list.filter(c=>{
    if(f.q){ const q=f.q.toLowerCase(); if(!((c.name+" "+c.instructor+" "+(c.tags||[]).join(" ")).toLowerCase().includes(q))) return false; }
    if(f.term && c.term!==f.term) return false;
    if(f.day && !c.schedule.includes(f.day)) return false;
    if(f.tag && !(c.tags||[]).includes(f.tag)) return false;
    if(f.minTest!=="" && (c.cats.test||0) < +f.minTest) return false;
    if(f.preset==="test100" && (c.cats.test||0)<100) return false;
    if(f.preset==="noexam" && !c.noExam) return false;
    if(f.preset==="attend" && !((c.cats.attend||0)>=50)) return false;
    if(f.preset==="report" && !((c.cats.report||0)>=40)) return false;
    if(f.preset==="ondemand" && !(c.schedule.includes("集中")||c.schedule.includes("他"))) return false;
    return true;
  });
  const s=f.sort;
  out.sort((a,b)=>{
    if(s==="testDesc") return (b.cats.test||0)-(a.cats.test||0);
    if(s==="testAsc") return (a.cats.test||0)-(b.cats.test||0);
    if(s==="attendDesc") return (b.cats.attend||0)-(a.cats.attend||0);
    if(s==="easy"){ const x=avgStars(a), y=avgStars(b); return (y??-1)-(x??-1); }
    if(s==="reviews") return courseReviews(b).length-courseReviews(a).length;
    return a.name.localeCompare(b.name,"ja");
  });
  return out;
}
let coursePage = 1;
function renderCourses(){
  const tags = [...new Set(COURSES.flatMap(c=>c.tags||[]))];
  const filtered = applyFilter(COURSES);
  const perPage = 24, pages = Math.max(1, Math.ceil(filtered.length/perPage));
  if(coursePage>pages) coursePage=pages;
  const slice = filtered.slice((coursePage-1)*perPage, coursePage*perPage);
  const candList = candidates.map(id=>COURSES.find(c=>c.id===id)).filter(Boolean);
  const candHtml = candList.length ? '<section class="panel" style="border-top:4px solid var(--gold)"><h3>あなたの履修候補（'+candList.length+'件）</h3>'
    + candList.map(c=>'<div style="font-size:14px;padding:3px 0"><a href="#" data-course="'+esc(c.name)+'">'+esc(c.name)+'</a> <span style="color:var(--mut);font-size:12.5px">'+esc(c.instructor)+' ／ '+esc(c.term)+' '+esc(c.schedule)+' ／ '+esc(c.credits)+'単位 ／ テスト'+(c.cats.test||0)+'%</span></div>').join("")
    + '<p style="font-size:13.5px;margin:8px 0 0">合計 <strong>'+candList.reduce((s,c)=>s+(+c.credits||0),0)+'単位</strong> ／ テスト100%の授業 '+candList.filter(c=>(c.cats.test||0)>=100).length+'件 ／ 定期テストなし '+candList.filter(c=>c.noExam).length+'件</p>'
    + '<p style="font-size:12px;color:var(--mut);margin:4px 0 0">候補は各授業カードの「履修候補に入れる」から追加・削除できます。時間割としての重なりチェックは今後の課題です。</p></section>' : '';
  $app.innerHTML = candHtml +
  '<h2 class="sec" style="margin-top:2px">授業を探す</h2>'
  + '<p class="sec-note">公式シラバス（2026年度・BDS学部専門教育科目 全'+COURSES.length+'クラス）から、評価の割合で探せます。「定期テスト100%だけ」「出席だけで決まる授業だけ」のような絞り込みができます。割合はシラバス原文からの自動解析のため誤差がある場合があります。必ず各授業の公式シラバス原文で確認してください。</p>'
  + '<div class="filters"><div class="row">'
  + '<div class="field" style="flex:1;min-width:220px"><label>キーワード（授業名・先生）</label><input type="text" id="fQ" value="'+esc(courseFilter.q)+'" placeholder="例: マーケティング、福井"></div>'
  + '<div class="field"><label>学期</label><select id="fTerm"><option value="">すべて</option>'+["春","秋"].map(t=>'<option '+(courseFilter.term===t?"selected":"")+'>'+t+'</option>').join("")+'</select></div>'
  + '<div class="field"><label>曜日</label><select id="fDay"><option value="">すべて</option>'+["月","火","水","木","金","土"].map(t=>'<option '+(courseFilter.day===t?"selected":"")+'>'+t+'</option>').join("")+'</select></div>'
  + '<div class="field"><label>分野</label><select id="fTag"><option value="">すべて</option>'+tags.map(t=>'<option '+(courseFilter.tag===t?"selected":"")+'>'+esc(t)+'</option>').join("")+'</select></div>'
  + '<div class="field"><label>定期テスト割合が何%以上</label><input type="number" id="fMinTest" min="0" max="100" step="10" value="'+esc(courseFilter.minTest)+'" placeholder="例: 80"></div>'
  + '</div><div class="quickchips">'
  + [["","すべて"],["test100","テスト100%"],["noexam","定期テストなし"],["attend","出席・平常50%以上"],["report","レポート40%以上"],["ondemand","集中・その他曜限"]].map(([k,l])=>'<button class="qchip '+(courseFilter.preset===k?"on":"")+'" data-p="'+k+'">'+l+'</button>').join("")
  + '</div></div>'
  + '<div class="sortbar">並び替え: <select id="fSort">'
  + [["name","授業名順"],["testDesc","テスト割合が高い順"],["testAsc","テスト割合が低い順"],["attendDesc","出席・平常が高い順"],["easy","口コミの取りやすさ順"],["reviews","口コミが多い順"]].map(([k,l])=>'<option value="'+k+'" '+(courseFilter.sort===k?"selected":"")+'>'+l+'</option>').join("")
  + '</select>　<strong>'+filtered.length+'件</strong>見つかりました</div>'
  + (slice.length? '<div class="grid">'+slice.map(courseCard).join("")+'</div>' : '<div class="empty">条件に合う授業が見つかりませんでした。条件をゆるめてみてください。</div>')
  + (pages>1 ? '<div class="pager">'+Array.from({length:pages},(_,i)=>'<button data-page="'+(i+1)+'" class="'+(coursePage===i+1?"on":"")+'">'+(i+1)+'</button>').join("")+'</div>' : '');
  const upd = () => { courseFilter.q=document.getElementById("fQ").value; courseFilter.term=document.getElementById("fTerm").value; courseFilter.day=document.getElementById("fDay").value; courseFilter.tag=document.getElementById("fTag").value; courseFilter.minTest=document.getElementById("fMinTest").value; courseFilter.sort=document.getElementById("fSort").value; coursePage=1; renderCourses(); bindCourseCards(); window.scrollTo(0,0); };
  ["fTerm","fDay","fTag","fSort"].forEach(id=>document.getElementById(id).onchange=upd);
  document.getElementById("fMinTest").onchange=upd;
  document.getElementById("fQ").addEventListener("keydown",e=>{ if(e.key==="Enter") upd(); });
  $app.querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{ courseFilter.preset=b.dataset.p; coursePage=1; renderCourses(); bindCourseCards(); });
  $app.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{ coursePage=+b.dataset.page; renderCourses(); bindCourseCards(); window.scrollTo(0,0); });
  bindCourseCards();
}

/* ---------- course detail ---------- */
function renderCourseDetail(){
  const entries = COURSES.filter(c=>c.name===selectedCourseName);
  if(!entries.length){ selectedCourseName=null; render(); return; }
  if(selectedTeacherIdx>=entries.length) selectedTeacherIdx=0;
  const c = entries[selectedTeacherIdx];
  const rs = courseReviews(c);
  const es = exams[c.id]||[];
  const avg = rs.length ? {
    easy:(rs.reduce((s,r)=>s+ +r.easy,0)/rs.length),
    rich:(rs.reduce((s,r)=>s+ +r.rich,0)/rs.length),
    work:(rs.reduce((s,r)=>s+ +r.work,0)/rs.length)
  } : null;
  $app.innerHTML =
  '<button class="btn ghost small" id="backBtn">← 授業一覧に戻る</button>'
  + '<section class="detail-head"><h1>'+esc(c.name)+'</h1>'
  + '<div class="meta" style="color:var(--mut);font-size:13px">'+esc(c.term)+'学期 '+esc(c.schedule)+' ／ '+esc(c.credits)+'単位 ／ 時間割コード '+esc(c.id)+'</div>'
  + (entries.length>1 ? '<p style="font-size:13px;margin:10px 0 2px"><strong>先生を選ぶ</strong>（同じ授業でも先生で中身と評価が変わります）</p><div class="teachertabs">'+entries.map((e,i)=>'<button data-t="'+i+'" class="'+(i===selectedTeacherIdx?"on":"")+'">'+esc(e.instructor)+(e.cls?'（クラス'+esc(e.cls)+'）':'')+'</button>').join("")+'</div>' : '<p style="font-size:14px;margin-top:8px">担当: <strong>'+esc(c.instructor)+'</strong></p>')
  + gbar(c)
  + '<div class="tagrow">'+c.tags.map(t=>'<span class="tag">'+esc(t)+'</span>').join("")+((c.noExam && (c.cats.test||0)===0)?'<span class="tag ok">定期テストなし</span>':'')+'</div>'
  + (avg && rs.length>=3 ? '<div style="font-size:14px">みんなの評価: 取りやすさ <span class="stars">'+stars(avg.easy)+'</span> '+avg.easy.toFixed(1)+' ／ 充実度 <span class="stars">'+stars(avg.rich)+'</span> '+avg.rich.toFixed(1)+' ／ 課題の重さ <span class="stars">'+stars(avg.work)+'</span> '+avg.work.toFixed(1)+'（口コミ'+rs.length+'件）</div>' : (rs.length? '<div style="font-size:13px;color:var(--mut)">口コミ '+rs.length+'件（少人数の学部のため、3件たまるまでは平均点を表示しません）</div>' : ''))
  + '<p style="font-size:12px;color:var(--mut);margin:6px 0 0">※成績評価の割合はシラバス原文からの自動解析です。誤差がある場合があるので、必ず公式シラバス原文で確認してください。</p>'
  + '</section>'
  + '<div class="cols"><div>'
  + '<section class="panel"><h3>シラバスの内容</h3><p style="font-size:14px;margin:0">'+esc(c.desc||"概要は公式シラバスで確認してください")+'</p>'
  + '<dl class="kv"><dt>成績評価（公式シラバス原文）</dt><dd>'+esc(c.grading)+'</dd>'
  + (c.textbook ? '<dt>教科書</dt><dd>'+esc(c.textbook)+'</dd>' : '')
  + '<dt>公式シラバス</dt><dd><a href="'+esc(c.url)+'" target="_blank" rel="noopener">関西大学シラバスでこの授業を見る</a></dd></dl></section>'
  + '<section class="panel"><h3>口コミ（'+esc(c.instructor)+'先生）</h3>'
  + (rs.length ? rs.map(r=>'<div class="review"><div class="rhead"><span>'+esc(r.grade)+'回生</span><span>'+esc(r.year)+'年度受講</span><span>取りやすさ <span class="stars">'+stars(+r.easy)+'</span></span><span>充実度 <span class="stars">'+stars(+r.rich)+'</span></span><span>課題 <span class="stars">'+stars(+r.work)+'</span></span></div><p>'+esc(r.body)+'</p></div>').join("") : '<div class="empty">この先生の口コミはまだありません。受けたことがある人は、最初の一件を残してください。</div>')
  + '<h3 style="margin-top:20px">口コミを書く</h3><div class="formgrid">'
  + '<div class="ratepick"><label>取りやすさ <select id="rEasy">'+[5,4,3,2,1].map(n=>'<option>'+n+'</option>').join("")+'</select></label><label>充実度 <select id="rRich">'+[5,4,3,2,1].map(n=>'<option>'+n+'</option>').join("")+'</select></label><label>課題の重さ <select id="rWork">'+[3,1,2,4,5].map(n=>'<option>'+n+'</option>').join("")+'</select></label><label>受講年度 <select id="rYear"><option>2026</option><option>2025</option></select></label></div>'
  + '<div class="field"><textarea id="rBody" rows="3" placeholder="例: テストは講義スライドから出る。出席は毎回取る。課題は重くないけど最終レポートが本気。"></textarea></div>'
  + '<p class="note" style="font-size:12px;color:var(--mut);margin:0">投稿ルール: 授業の内容・進め方についての感想を書いてください。先生個人への批判、個人が特定される情報、事実でない内容は書かないでください。</p>'
  + '<button class="btn small" id="rSubmit">口コミを投稿する</button></div></section>'
  + '</div><div>'
  + '<section class="panel"><h3>過去問・過去課題</h3>'
  + (es.length ? es.map(x=>'<div class="review"><div class="rhead"><span>'+esc(x.year)+'年度</span><span class="tag">'+esc(x.kind)+'</span></div><p><strong>'+esc(x.title)+'</strong><br>'+esc(x.note||"")+(x.link?' <br><a href="'+esc(x.link)+'" target="_blank" rel="noopener">ファイル・リンクを開く</a>':'')+'</p></div>').join("") : '<div class="empty">過去問情報はまだありません。持っている人は年度と形式だけでも共有してください（問題文そのものの転載ではなく、出題傾向の共有がおすすめです）。</div>')
  + '<h3 style="margin-top:18px">追加する</h3><div class="formgrid">'
  + '<div class="field"><label>タイトル</label><input id="eTitle" type="text" placeholder="例: 2025年度 期末テスト（出題傾向メモ）"></div>'
  + '<div class="field"><label>年度</label><select id="eYear"><option>2026</option><option>2025</option></select></div>'
  + '<div class="field"><label>形式</label><select id="eKind"><option>期末テスト</option><option>中間テスト</option><option>小テスト</option><option>最終レポート</option><option>課題</option></select></div>'
  + '<div class="field"><label>内容・傾向メモ</label><textarea id="eNote" rows="2" placeholder="例: 計算問題3割、論述7割。スライドの図がそのまま出た。"></textarea></div>'
  + '<div class="field"><label>参考リンク（任意）</label><input id="eLink" type="url" placeholder="https://..."></div>'
  + '<p class="note" style="font-size:12px;color:var(--mut);margin:0">試験問題そのものの転載は大学の規則・著作権に触れる場合があります。出題傾向や対策メモの共有を中心にしてください。</p>'
  + '<button class="btn small" id="eSubmit">過去問情報を追加</button></div></section>'
  + '<section class="panel"><h3>この授業のテスト・締切をカレンダーに</h3><p style="font-size:13px;color:var(--mut)">テスト日や課題締切が分かったら、みんなのカレンダーに追加できます。</p><button class="btn sub small" id="addCal">カレンダーに予定を追加</button></section>'
  + '</div></div>';
  document.getElementById("backBtn").onclick=()=>{ selectedCourseName=null; view="courses"; render(); };
  $app.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{ selectedTeacherIdx=+b.dataset.t; renderCourseDetail(); window.scrollTo(0,0); });
  document.getElementById("rSubmit").onclick=()=>{
    if(!requireUser()) return;
    const body=document.getElementById("rBody").value.trim();
    if(!body){ toast("口コミの本文を書いてください"); return; }
    (reviews[c.id] = reviews[c.id]||[]).unshift({ grade:user.grade, year:document.getElementById("rYear").value, easy:document.getElementById("rEasy").value, rich:document.getElementById("rRich").value, work:document.getElementById("rWork").value, body, date:todayStr() });
    save("bds_reviews", reviews); toast("口コミを投稿しました"); renderCourseDetail();
  };
  document.getElementById("eSubmit").onclick=()=>{
    if(!requireUser()) return;
    const title=document.getElementById("eTitle").value.trim();
    if(!title){ toast("タイトルを入力してください"); return; }
    (exams[c.id] = exams[c.id]||[]).unshift({ year:document.getElementById("eYear").value, kind:document.getElementById("eKind").value, title, note:document.getElementById("eNote").value.trim(), link:document.getElementById("eLink").value.trim(), date:todayStr() });
    save("bds_exams", exams); toast("過去問情報を追加しました"); renderCourseDetail();
  };
  document.getElementById("addCal").onclick=()=>{ view="calendar"; setNav("calendar"); renderCalendar(true, c.name); window.scrollTo(0,0); };
}

/* ---------- zemi ---------- */
let zemiFilter = { q:"", tag:"" };
function renderZemi(){
  const allTags = [...new Set(ZEMI.flatMap(z=>z.tags))];
  const list = ZEMI.filter(z=>{
    if(zemiFilter.q && !((z.teacher+z.field+z.intro+z.tags.join(" ")).includes(zemiFilter.q))) return false;
    if(zemiFilter.tag && !z.tags.includes(zemiFilter.tag)) return false;
    return true;
  });
  $app.innerHTML =
  '<h2 class="sec" style="margin-top:2px">ゼミ一覧</h2>'
  + '<p class="sec-note">BDS学部のゼミ（専門演習）担当教員の一覧です。研究分野は学部パンフレット・公式シラバスをもとにしています。<strong>説明会の日程とオンデマンド動画は学内限定で公開されるため、確認した人が各ゼミのページから追加できるようにしています。</strong>分かったらぜひ書き込んでください。</p>'
  + '<div class="filters"><div class="row"><div class="field" style="flex:1;min-width:220px"><label>キーワード（先生・分野）</label><input type="text" id="zQ" value="'+esc(zemiFilter.q)+'" placeholder="例: マーケティング、機械学習、会計"></div>'
  + '<div class="field"><label>タグ</label><select id="zTag"><option value="">すべて</option>'+allTags.map(t=>'<option '+(zemiFilter.tag===t?"selected":"")+'>'+esc(t)+'</option>').join("")+'</select></div></div></div>'
  + '<div class="grid">'+ list.map(z=>{
      const info = zemiInfo[z.id]||{};
      const briefing = info.briefing ?? z.briefing, ondemand = info.ondemand ?? z.ondemand;
      const ps = zemiPosts[z.id]||[];
      return '<article class="card"><h3>'+esc(z.teacher)+' ゼミ</h3><div class="meta">'+esc(z.title)+' ／ '+esc(z.field)+'</div>'
      + '<p class="desc">'+esc(z.intro)+'</p>'
      + '<div class="tagrow">'+z.tags.map(t=>'<span class="tag">'+esc(t)+'</span>').join("")+'</div>'
      + '<div class="meta">説明会: '+(briefing? '<strong>'+esc(briefing)+'</strong>' : '<span style="color:var(--red)">情報募集中</span>')+'<br>オンデマンド: '+(ondemand? '<a href="'+esc(ondemand)+'" target="_blank" rel="noopener">動画を見る</a>' : '<span style="color:var(--red)">情報募集中</span>')+'<br>先輩・同期の書き込み: '+ps.length+'件</div>'
      + '<button class="btn small" data-zemi="'+z.id+'">ゼミの詳細・書き込み</button></article>';
    }).join("") +'</div>';
  document.getElementById("zTag").onchange=e=>{ zemiFilter.tag=e.target.value; renderZemi(); };
  document.getElementById("zQ").addEventListener("keydown",e=>{ if(e.key==="Enter"){ zemiFilter.q=e.target.value; renderZemi(); } });
  $app.querySelectorAll("[data-zemi]").forEach(b=>b.onclick=()=>renderZemiDetail(b.dataset.zemi));
}
function renderZemiDetail(id){
  const z = ZEMI.find(x=>x.id===id); if(!z) return;
  const info = zemiInfo[id]||{};
  const briefing = info.briefing ?? z.briefing, ondemand = info.ondemand ?? z.ondemand;
  const ps = zemiPosts[id]||[];
  $app.innerHTML =
  '<button class="btn ghost small" id="zBack">← ゼミ一覧に戻る</button>'
  + '<section class="detail-head"><h1>'+esc(z.teacher)+' ゼミ</h1><div style="color:var(--mut);font-size:13px">'+esc(z.title)+' ／ 研究分野: '+esc(z.field)+'</div>'
  + '<div class="tagrow">'+z.tags.map(t=>'<span class="tag">'+esc(t)+'</span>').join("")+'</div>'
  + '<p style="font-size:14.5px">'+esc(z.intro)+'</p></section>'
  + '<div class="cols"><div><section class="panel"><h3>みんなの書き込み・口コミ</h3>'
  + (ps.length ? ps.map(p=>'<div class="review"><div class="rhead"><span>'+esc(p.grade)+'回生</span><span class="tag">'+esc(p.kind)+'</span><span>'+esc(p.date)+'</span></div><p>'+esc(p.body)+'</p></div>').join("") : '<div class="empty">まだ書き込みがありません。説明会に行った感想、面談の雰囲気、活動頻度、大会・企業連携の有無など、知っていることを残してください。</div>')
  + '<h3 style="margin-top:20px">書き込む</h3><div class="formgrid">'
  + '<div class="field"><label>種類</label><select id="zpKind"><option>説明会の感想</option><option>ゼミの雰囲気</option><option>活動内容</option><option>選考・面談</option><option>その他情報</option></select></div>'
  + '<div class="field"><textarea id="zpBody" rows="3" placeholder="例: 説明会では先輩の発表が中心。週1コマ＋隔週で企業訪問。雰囲気は和やかだけど発表準備はしっかりめ。"></textarea></div>'
  + '<button class="btn small" id="zpSubmit">書き込む</button></div></section></div>'
  + '<div><section class="panel"><h3>説明会・オンデマンド</h3><dl class="kv">'
  + '<dt>説明会の日程</dt><dd>'+(briefing? esc(briefing) : '<span style="color:var(--red)">情報募集中</span>')+'</dd>'
  + '<dt>オンデマンド動画</dt><dd>'+(ondemand? '<a href="'+esc(ondemand)+'" target="_blank" rel="noopener">'+esc(ondemand)+'</a>' : '<span style="color:var(--red)">情報募集中</span>')+'</dd></dl>'
  + '<h3 style="margin-top:16px">情報を追加・更新する</h3><div class="formgrid">'
  + '<div class="field"><label>説明会の日程</label><input id="ziBriefing" type="text" value="'+esc(briefing)+'" placeholder="例: 11月12日(木) 4限・吹田みらいキャンパス"></div>'
  + '<div class="field"><label>オンデマンド動画のURL</label><input id="ziOndemand" type="url" value="'+esc(ondemand)+'" placeholder="https://... (LMS/Panopto等)"></div>'
  + '<button class="btn small" id="ziSubmit">保存する</button></div>'
  + '<p style="font-size:12px;color:var(--mut)">保存すると、このゼミを見た全員（この端末では自分の表示）に反映されます。正式な全体公開データへの反映は運営が確認後に行います。</p></section>'
  + '<section class="panel"><h3>この先生の授業</h3>'
  + COURSES.filter(c=>c.instructor.includes(z.teacher.replace(/\s/g,""))||c.instructor.includes(z.teacher.split(" ")[0])).slice(0,6).map(c=>'<div style="font-size:14px;padding:4px 0"><a href="#" data-course="'+esc(c.name)+'">'+esc(c.name)+'</a> <span style="color:var(--mut);font-size:12px">'+esc(c.term)+' '+esc(c.schedule)+'</span></div>').join("")
  + '</section></div></div>';
  document.getElementById("zBack").onclick=()=>renderZemi();
  bindCourseCards();
  document.getElementById("zpSubmit").onclick=()=>{
    if(!requireUser()) return;
    const body=document.getElementById("zpBody").value.trim(); if(!body){ toast("本文を書いてください"); return; }
    (zemiPosts[id]=zemiPosts[id]||[]).unshift({ grade:user.grade, kind:document.getElementById("zpKind").value, body, date:todayStr() });
    save("bds_zemi_posts", zemiPosts); toast("書き込みました"); renderZemiDetail(id);
  };
  document.getElementById("ziSubmit").onclick=()=>{
    if(!requireUser()) return;
    zemiInfo[id]={ briefing:document.getElementById("ziBriefing").value.trim(), ondemand:document.getElementById("ziOndemand").value.trim() };
    save("bds_zemi_info", zemiInfo); toast("ゼミ情報を保存しました"); renderZemiDetail(id);
  };
}

/* ---------- calendar ---------- */
function renderCalendar(focusAdd, presetTitle){
  const {y, m} = calCursor;
  const first = new Date(y, m, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(y, m+1, 0).getDate();
  const daysInPrev = new Date(y, m, 0).getDate();
  const monthStr = y+"-"+String(m+1).padStart(2,"0");
  const evByDay = {};
  for(const e of events){ if(e.date.startsWith(monthStr)){ const d=+e.date.slice(8,10); (evByDay[d]=evByDay[d]||[]).push(e); } }
  let cells = ["日","月","火","水","木","金","土"].map(d=>'<div class="dow">'+d+'</div>').join("");
  for(let i=0;i<42;i++){
    const dayNum = i - startDay + 1;
    let disp, dim=false, key=null;
    if(dayNum<1){ disp=daysInPrev+dayNum; dim=true; }
    else if(dayNum>daysInMonth){ disp=dayNum-daysInMonth; dim=true; }
    else { disp=dayNum; key=dayNum; }
    const isToday = !dim && (monthStr+"-"+String(disp).padStart(2,"0"))===todayStr();
    cells += '<div class="calcell'+(dim?" dim":"")+(isToday?" today":"")+'"><strong>'+disp+'</strong>'
      + (key && evByDay[key] ? evByDay[key].map(e=>'<span class="ev '+(e.type==="テスト"?"test":e.type.includes("ゼミ")?"zemi":e.type==="締切"?"deadline":"")+'" data-ev="'+e.id+'">'+esc(e.title)+'</span>').join("") : '')
      + '</div>';
    if(i>=34 && dayNum>=daysInMonth) break;
  }
  const monthEvents = [...events].filter(e=>e.date.startsWith(monthStr)).sort((a,b)=>a.date<b.date?-1:1);
  $app.innerHTML =
  '<h2 class="sec" style="margin-top:2px">みんなのカレンダー</h2>'
  + '<p class="sec-note">テスト日・課題締切・ゼミ説明会など、知った人が追加していくカレンダーです。自分の予定ではなく、みんなに関係する日程を入れてください。</p>'
  + '<div class="cols"><div class="calwrap"><div class="calhead"><button class="btn ghost small" id="calPrev">← 前の月</button><b>'+y+'年 '+(m+1)+'月</b><button class="btn ghost small" id="calNext">次の月 →</button></div>'
  + '<div class="calgrid">'+cells+'</div></div>'
  + '<div><section class="panel"><h3>この月の予定</h3>'
  + (monthEvents.length ? monthEvents.map(e=>'<div class="review"><div class="rhead"><span>'+esc(e.date)+'</span><span class="tag">'+esc(e.type)+'</span><span>投稿: '+esc(e.by||"")+'</span></div><p><strong>'+esc(e.title)+'</strong>'+(e.detail?'<br>'+esc(e.detail):'')+'</p></div>').join("") : '<div class="empty">この月の予定はまだありません。</div>')
  + '</section>'
  + '<section class="panel" id="addPanel"><h3>予定を追加する</h3><div class="formgrid">'
  + '<div class="field"><label>日付</label><input id="evDate" type="date" value="'+todayStr()+'"></div>'
  + '<div class="field"><label>種類</label><select id="evType"><option>テスト</option><option>ゼミ説明会</option><option>締切</option><option>授業・行事</option><option>その他</option></select></div>'
  + '<div class="field"><label>タイトル</label><input id="evTitle" type="text" value="'+esc(presetTitle? presetTitle+" テスト":"")+'" placeholder="例: 経営戦略論 期末テスト"></div>'
  + '<div class="field"><label>詳細（任意）</label><textarea id="evDetail" rows="2" placeholder="例: 持ち込み不可。教室は通常と異なるので注意。"></textarea></div>'
  + '<button class="btn small" id="evSubmit">カレンダーに追加</button></div></section></div></div>';
  document.getElementById("calPrev").onclick=()=>{ calCursor = m===0? {y:y-1,m:11}:{y,m:m-1}; renderCalendar(); };
  document.getElementById("calNext").onclick=()=>{ calCursor = m===11? {y:y+1,m:0}:{y,m:m+1}; renderCalendar(); };
  document.getElementById("evSubmit").onclick=()=>{
    if(!requireUser()) return;
    const date=document.getElementById("evDate").value, title=document.getElementById("evTitle").value.trim();
    if(!date||!title){ toast("日付とタイトルを入力してください"); return; }
    events.push({ id:"ev"+Date.now(), date, title, type:document.getElementById("evType").value, detail:document.getElementById("evDetail").value.trim(), by:user.name });
    save("bds_events", events);
    calCursor = { y:+date.slice(0,4), m:+date.slice(5,7)-1 };
    toast("予定を追加しました"); renderCalendar();
  };
  if(focusAdd){ const p=document.getElementById("addPanel"); if(p) p.scrollIntoView({behavior:"smooth"}); }
}

/* ---------- textbooks ---------- */
function renderBooks(){
  $app.innerHTML =
  '<h2 class="sec" style="margin-top:2px">教科書売買</h2>'
  + '<p class="sec-note">使い終わった教科書を、必要としている後輩へ。受け渡しは吹田みらいキャンパス内で行うのがおすすめです。連絡先は、学内のTeamsやLINEなど、相手が学生だと分かる方法にしてください。</p>'
  + '<div class="filters"><div class="row"><div class="field" style="flex:1;min-width:220px"><label>教科書名・授業名で探す</label><input type="text" id="bQ" placeholder="例: 統計、マーケティング"></div><button class="btn" id="bSearch">探す</button></div></div>'
  + '<div id="bookList">'
  + (books.length ? books.map(bk=>'<div class="listrow"><div><strong>'+esc(bk.title)+'</strong> <span class="tag">'+esc(bk.course||"授業名なし")+'</span><div style="font-size:13px;color:var(--mut)">状態: '+esc(bk.cond)+' ／ 出品: '+esc(bk.grade)+'回生 '+esc(bk.by)+' ／ '+esc(bk.date)+'<br>'+esc(bk.note||"")+'<br>連絡先: '+esc(bk.contact)+'</div></div><div class="price">¥'+Number(bk.price||0).toLocaleString()+'</div></div>').join("") : '<div class="empty">まだ出品がありません。最初の出品者になってください。</div>')
  + '</div>'
  + '<section class="panel" style="margin-top:18px"><h3>教科書を出品する</h3><div class="formgrid">'
  + '<div class="field"><label>教科書名</label><input id="bkTitle" type="text" placeholder="例: 基礎から学ぶ統計学"></div>'
  + '<div class="field"><label>使う授業</label><input id="bkCourse" type="text" placeholder="例: 統計基礎" list="courseNames"><datalist id="courseNames">'+[...new Set(COURSES.map(c=>c.name))].map(n=>'<option value="'+esc(n)+'">').join("")+'</datalist></div>'
  + '<div class="field"><label>価格（円）</label><input id="bkPrice" type="number" min="0" step="100" placeholder="1500"></div>'
  + '<div class="field"><label>状態</label><select id="bkCond"><option>新品同様</option><option>きれい（書き込みなし）</option><option>書き込みあり</option><option>使用感あり</option></select></div>'
  + '<div class="field"><label>連絡先</label><input id="bkContact" type="text" placeholder="例: Teamsで「山下」まで / LINE知ってる人はLINEで"></div>'
  + '<div class="field"><label>ひとこと</label><textarea id="bkNote" rows="2" placeholder="例: 昨年度使用。テスト対策のメモ付きです。"></textarea></div>'
  + '<button class="btn small" id="bkSubmit">出品する</button></div></section>';
  const doSearch=()=>{
    const q=document.getElementById("bQ").value.trim();
    const list = q? books.filter(bk=>(bk.title+bk.course).includes(q)) : books;
    document.getElementById("bookList").innerHTML = list.length? "" : '<div class="empty">見つかりませんでした。</div>';
    if(list.length) renderBooksFiltered(list);
  };
  function renderBooksFiltered(list){ document.getElementById("bookList").innerHTML = list.map(bk=>'<div class="listrow"><div><strong>'+esc(bk.title)+'</strong> <span class="tag">'+esc(bk.course||"")+'</span><div style="font-size:13px;color:var(--mut)">状態: '+esc(bk.cond)+' ／ '+esc(bk.date)+'<br>'+esc(bk.note||"")+'<br>連絡先: '+esc(bk.contact)+'</div></div><div class="price">¥'+Number(bk.price||0).toLocaleString()+'</div></div>').join(""); }
  document.getElementById("bSearch").onclick=doSearch;
  document.getElementById("bkSubmit").onclick=()=>{
    if(!requireUser()) return;
    const title=document.getElementById("bkTitle").value.trim();
    const price=document.getElementById("bkPrice").value;
    const contact=document.getElementById("bkContact").value.trim();
    if(!title||price===""||!contact){ toast("教科書名・価格・連絡先を入力してください"); return; }
    books.unshift({ id:"bk"+Date.now(), title, course:document.getElementById("bkCourse").value.trim(), price:+price, cond:document.getElementById("bkCond").value, contact, note:document.getElementById("bkNote").value.trim(), by:user.name, grade:user.grade, date:todayStr() });
    save("bds_books", books); toast("出品しました"); renderBooks();
  };
}

/* ---------- board ---------- */
function renderBoard(){
  $app.innerHTML =
  '<h2 class="sec" style="margin-top:2px">掲示板・情報共有</h2>'
  + '<p class="sec-note">授業・ゼミ・学部生活の情報共有に使ってください。個人名や連絡先など、個人が特定される情報は書かないでください。</p>'
  + board.map(p=>'<article class="card" style="margin-bottom:12px"><div class="meta"><span class="tag">'+esc(p.cat)+'</span> '+esc(p.date)+' ／ '+esc(p.grade==='-'?"":p.grade+"回生 ")+esc(p.by)+'</div><h3>'+esc(p.title)+'</h3><p style="margin:0;font-size:14.5px">'+esc(p.body)+'</p></article>').join("")
  + '<section class="panel"><h3>投稿する</h3><div class="formgrid">'
  + '<div class="field"><label>種類</label><select id="bdCat"><option>情報共有</option><option>質問</option><option>お知らせ</option><option>雑談</option></select></div>'
  + '<div class="field"><label>タイトル</label><input id="bdTitle" type="text" placeholder="例: ゼミ説明会の日程まとめ"></div>'
  + '<div class="field"><label>本文</label><textarea id="bdBody" rows="4"></textarea></div>'
  + '<button class="btn small" id="bdSubmit">投稿する</button></div></section>';
  document.getElementById("bdSubmit").onclick=()=>{
    if(!requireUser()) return;
    const title=document.getElementById("bdTitle").value.trim(), body=document.getElementById("bdBody").value.trim();
    if(!title||!body){ toast("タイトルと本文を入力してください"); return; }
    board.unshift({ id:"bd"+Date.now(), title, body, cat:document.getElementById("bdCat").value, by:user.name, grade:user.grade, date:todayStr() });
    save("bds_board", board); toast("投稿しました"); renderBoard();
  };
}

/* init */
renderUserbox();
render();
/* 閲覧は登録なしで自由に。学生登録は投稿するときだけ求める（入口の壁を作らない） */
