"use strict";
/* BDSクロバス v2 - 機能ごとにページ分岐（ハッシュルーティング） */
const COURSES = (window.BDS_COURSES || []).concat(window.BDS_EXTRA_COURSES || []);
const ZEMI = window.BDS_ZEMI || [];
const $app = document.getElementById("app");
const $modal = document.getElementById("modal-root");

function load(key, def){ try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }catch(e){ return def; } }
function save(key, v){ localStorage.setItem(key, JSON.stringify(v)); }
function esc(s){ return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function todayStr(){ const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function toast(msg){ const t=document.createElement("div"); t.className="toast"; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),2600); }
function navTo(hash){ if(location.hash === hash){ route(); } else location.hash = hash; }

let user = load("bds_user", null);
let clicks = load("bds_clicks", []);
function trackClick(kind, label, url){
  clicks.push({ t: new Date().toISOString(), u: user ? { n:user.name, g:user.grade, e:user.enrollYear||"", gy:user.gradYear||"", f:user.fac||"" } : null, kind: kind, label: label, url: url });
  if(clicks.length > 500) clicks = clicks.slice(-500);
  save("bds_clicks", clicks);
}
document.addEventListener("click", function(e){
  const a = e.target && e.target.closest ? e.target.closest("a[data-track]") : null;
  if(a) trackClick(a.dataset.track, a.dataset.label || a.textContent.trim(), a.href);
});
let reviews = load("bds_reviews", {});
let exams = load("bds_exams", {});
let zemiPosts = load("bds_zemi_posts", {});
let zemiInfo = load("bds_zemi_info", {});
let events = load("bds_events", []);
const SEED_EVENTS = [{"id":"seed-g1","date":"2026-10-19","title":"【専門演習】全体説明会（参加必須）","type":"ゼミ説明会","memo":"12:20〜13:20 S201(大ホール)","short":"全体説明会"},{"id":"seed-g2","date":"2026-10-19","title":"【専門演習】履修要項(PDF)公開","type":"その他","memo":"関大LMSで配信","short":"要項公開"},{"id":"seed-g3","date":"2026-10-20","title":"【専門演習】個別説明会 期間（〜11/9）","type":"ゼミ説明会","memo":"各ゼミの説明会はこの期間に実施","short":"個別説明会期間"},{"id":"seed-g4","date":"2026-11-10","title":"【専門演習】申込開始 9:00","type":"その他","memo":"申込フォームは関大LMSに掲載。関大アカウントで回答","short":"申込開始"},{"id":"seed-g5","date":"2026-11-12","title":"【専門演習】申込締切 17:00","type":"その他","memo":"締切厳守","short":"申込締切"},{"id":"seed-z-0","date":"2026-11-05","title":"ゼミ説明会: 鷲尾 隆","type":"ゼミ説明会","memo":"11/5(木) 昼休み S002","short":"説明会: 鷲尾"},{"id":"seed-z-1","date":"2026-10-27","title":"ゼミ説明会: 鎌田 真由美","type":"ゼミ説明会","memo":"10/27(火) 14:00〜16:00 S002","short":"説明会: 鎌田"},{"id":"seed-z-2","date":"2026-10-28","title":"ゼミ説明会: 鎌田 真由美","type":"ゼミ説明会","memo":"10/28(水) 2限 S204","short":"説明会: 鎌田"},{"id":"seed-z-3","date":"2026-10-23","title":"ゼミ説明会: 福井 健一","type":"ゼミ説明会","memo":"10/23(金) 昼休み S205","short":"説明会: 福井"},{"id":"seed-z-4","date":"2026-10-27","title":"ゼミ説明会: 三崎 秀央","type":"ゼミ説明会","memo":"10/27(火) 3限 S206","short":"説明会: 三崎"},{"id":"seed-z-5","date":"2026-11-06","title":"ゼミ説明会: 三崎 秀央","type":"ゼミ説明会","memo":"11/6(金) 3限 S002","short":"説明会: 三崎"},{"id":"seed-z-6","date":"2026-10-26","title":"ゼミ説明会: 砂山 渡","type":"ゼミ説明会","memo":"10/26(月) 5限 S203","short":"説明会: 砂山"},{"id":"seed-z-7","date":"2026-10-28","title":"ゼミ説明会: 砂山 渡","type":"ゼミ説明会","memo":"10/28(水) 5限 S203","short":"説明会: 砂山"},{"id":"seed-z-8","date":"2026-11-05","title":"ゼミ説明会: 砂山 渡","type":"ゼミ説明会","memo":"11/5(木) 5限 S104（質問はメール sunayama@kansai-u.ac.jp）","short":"説明会: 砂山"},{"id":"seed-z-9","date":"2026-10-27","title":"ゼミ説明会: 高井 啓二","type":"ゼミ説明会","memo":"10/27(火) 2限 S204","short":"説明会: 高井"},{"id":"seed-z-10","date":"2026-11-05","title":"ゼミ説明会: 高井 啓二","type":"ゼミ説明会","memo":"11/5(木) 2限 S205","short":"説明会: 高井"},{"id":"seed-z-11","date":"2026-10-26","title":"ゼミ説明会: 森貞 誠","type":"ゼミ説明会","memo":"10/26(月) 昼休み S204","short":"説明会: 森貞"},{"id":"seed-z-12","date":"2026-10-28","title":"ゼミ説明会: 森貞 誠","type":"ゼミ説明会","memo":"10/28(水) 12:45〜 S206","short":"説明会: 森貞"},{"id":"seed-z-13","date":"2026-11-09","title":"ゼミ説明会: 森貞 誠","type":"ゼミ説明会","memo":"11/9(月) 5限 S103","short":"説明会: 森貞"},{"id":"seed-z-14","date":"2026-10-26","title":"ゼミ説明会: 向 真央","type":"ゼミ説明会","memo":"10/26(月) 昼休み S203","short":"説明会: 向"},{"id":"seed-z-15","date":"2026-10-27","title":"ゼミ説明会: 向 真央","type":"ゼミ説明会","memo":"10/27(火) 4限 S203","short":"説明会: 向"},{"id":"seed-z-16","date":"2026-11-05","title":"ゼミ説明会: 向 真央","type":"ゼミ説明会","memo":"11/5(木) 5限 S203","short":"説明会: 向"},{"id":"seed-z-17","date":"2026-11-09","title":"ゼミ説明会: 向 真央","type":"ゼミ説明会","memo":"11/9(月) 昼休み S203","short":"説明会: 向"},{"id":"seed-z-18","date":"2026-10-27","title":"ゼミ説明会: 丸野 由希","type":"ゼミ説明会","memo":"10/27(火) 昼休み S105","short":"説明会: 丸野"},{"id":"seed-z-19","date":"2026-11-05","title":"ゼミ説明会: 丸野 由希","type":"ゼミ説明会","memo":"11/5(木) 昼休み N107","short":"説明会: 丸野"},{"id":"seed-z-20","date":"2026-10-29","title":"ゼミ説明会: 中原 孝信","type":"ゼミ説明会","memo":"10/29(木) 18:00〜18:30 S201","short":"説明会: 中原"},{"id":"seed-z-21","date":"2026-10-30","title":"ゼミ説明会: 佐野 夏樹","type":"ゼミ説明会","memo":"10/30(金) 3限 S101","short":"説明会: 佐野"},{"id":"seed-z-22","date":"2026-11-09","title":"ゼミ説明会: 佐野 夏樹","type":"ゼミ説明会","memo":"11/9(月) 昼休み S204","short":"説明会: 佐野"},{"id":"seed-z-23","date":"2026-10-26","title":"ゼミ説明会: 安藤 雅行","type":"ゼミ説明会","memo":"10/26(月) 4限 S205","short":"説明会: 安藤"},{"id":"seed-z-24","date":"2026-10-27","title":"ゼミ説明会: 安藤 雅行","type":"ゼミ説明会","memo":"10/27(火) 3限 S103","short":"説明会: 安藤"},{"id":"seed-z-25","date":"2026-10-28","title":"ゼミ説明会: 安藤 雅行","type":"ゼミ説明会","memo":"10/28(水) 昼休み・5限 S204","short":"説明会: 安藤"},{"id":"seed-z-26","date":"2026-11-05","title":"ゼミ説明会: 安藤 雅行","type":"ゼミ説明会","memo":"11/5(木) 2限 S204","short":"説明会: 安藤"},{"id":"seed-z-27","date":"2026-11-09","title":"ゼミ説明会: 安藤 雅行","type":"ゼミ説明会","memo":"11/9(月) 4限 S205（10/29の回は中止）","short":"説明会: 安藤"},{"id":"seed-z-28","date":"2026-10-22","title":"ゼミ説明会: 川崎 正隆","type":"ゼミ説明会","memo":"2限（対面・終了）","short":"説明会: 川崎"},{"id":"seed-z-29","date":"2026-10-28","title":"ゼミ説明会: 池田 圭佑","type":"ゼミ説明会","memo":"リアルタイム配信（Teams/Zoom）: 10/28(水) 18:00","short":"説明会: 池田"},{"id":"seed-z-30","date":"2026-11-06","title":"ゼミ説明会: 池田 圭佑","type":"ゼミ説明会","memo":"11/6(金) 18:00","short":"説明会: 池田"},{"id":"seed-z-31","date":"2026-11-09","title":"ゼミ説明会: 池田 圭佑","type":"ゼミ説明会","memo":"11/9(月) 昼","short":"説明会: 池田"},{"id":"seed-z-32","date":"2026-10-26","title":"ゼミ説明会: 新田 直子","type":"ゼミ説明会","memo":"10/26(月) 昼休み N103","short":"説明会: 新田"},{"id":"seed-z-33","date":"2026-10-27","title":"ゼミ説明会: 新田 直子","type":"ゼミ説明会","memo":"10/27(火) 4限 S204","short":"説明会: 新田"},{"id":"seed-z-34","date":"2026-11-05","title":"ゼミ説明会: 新田 直子","type":"ゼミ説明会","memo":"11/5(木) 11:00〜12:00 N103","short":"説明会: 新田"},{"id":"seed-z-35","date":"2026-11-09","title":"ゼミ説明会: 新田 直子","type":"ゼミ説明会","memo":"11/9(月) 昼休み N103","short":"説明会: 新田"},{"id":"seed-z-36","date":"2026-10-26","title":"ゼミ説明会: 西出 亮","type":"ゼミ説明会","memo":"10/26(月) 4限 S002","short":"説明会: 西出"},{"id":"seed-z-37","date":"2026-10-28","title":"ゼミ説明会: 西出 亮","type":"ゼミ説明会","memo":"10/28(水) 5限 S206","short":"説明会: 西出"},{"id":"seed-z-38","date":"2026-11-05","title":"ゼミ説明会: 西出 亮","type":"ゼミ説明会","memo":"11/5(木) 5限 S102","short":"説明会: 西出"},{"id":"seed-z-39","date":"2026-10-26","title":"ゼミ説明会: 中園 宏幸","type":"ゼミ説明会","memo":"10/26(月) 4限 S204","short":"説明会: 中園"},{"id":"seed-z-40","date":"2026-10-29","title":"ゼミ説明会: 中園 宏幸","type":"ゼミ説明会","memo":"10/29(木) 11:00〜12:10・3限 S206","short":"説明会: 中園"},{"id":"seed-z-41","date":"2026-10-30","title":"ゼミ説明会: 中園 宏幸","type":"ゼミ説明会","memo":"10/30(金) 3限 S205","short":"説明会: 中園"},{"id":"seed-z-42","date":"2026-11-09","title":"ゼミ説明会: 中園 宏幸","type":"ゼミ説明会","memo":"11/9(月) 4限 S204","short":"説明会: 中園"},{"id":"seed-z-43","date":"2026-11-05","title":"ゼミ説明会: 伝住 周平","type":"ゼミ説明会","memo":"11/5(木) 昼休み N108 のみ（1回だけ）","short":"説明会: 伝住"},{"id":"seed-z-44","date":"2026-10-28","title":"ゼミ説明会: 岡部 格明","type":"ゼミ説明会","memo":"10/28(水) 2限 S203","short":"説明会: 岡部"},{"id":"seed-z-45","date":"2026-10-29","title":"ゼミ説明会: 岡部 格明","type":"ゼミ説明会","memo":"10/29(木) 3・4限 S204","short":"説明会: 岡部"},{"id":"seed-z-46","date":"2026-11-06","title":"ゼミ説明会: 岡部 格明","type":"ゼミ説明会","memo":"11/6(金) 4限 S206","short":"説明会: 岡部"},{"id":"seed-z-47","date":"2026-11-09","title":"ゼミ説明会: 岡部 格明","type":"ゼミ説明会","memo":"11/9(月) 4限 S205","short":"説明会: 岡部"},{"id":"seed-z-48","date":"2026-10-26","title":"ゼミ説明会: 周 暁康","type":"ゼミ説明会","memo":"10/26(月) 昼休み S206","short":"説明会: 周"},{"id":"seed-z-49","date":"2026-10-27","title":"ゼミ説明会: 周 暁康","type":"ゼミ説明会","memo":"10/27(火) 昼休み S104","short":"説明会: 周"},{"id":"seed-z-50","date":"2026-10-26","title":"ゼミ説明会: 石橋 健","type":"ゼミ説明会","memo":"10/26(月) 5限 S102","short":"説明会: 石橋"},{"id":"seed-z-51","date":"2026-10-27","title":"ゼミ説明会: 石橋 健","type":"ゼミ説明会","memo":"10/27(火) 昼休み S103","short":"説明会: 石橋"},{"id":"seed-z-52","date":"2026-11-09","title":"ゼミ説明会: 石橋 健","type":"ゼミ説明会","memo":"11/9(月) 5限 S101","short":"説明会: 石橋"},{"id":"seed-z-53","date":"2026-11-02","title":"ゼミ説明会: 河合 由起子","type":"ゼミ説明会","memo":"リアルタイム配信: 11/2(月) 昼","short":"説明会: 河合"},{"id":"seed-z-54","date":"2026-11-06","title":"ゼミ説明会: 河合 由起子","type":"ゼミ説明会","memo":"11/6(金) 昼","short":"説明会: 河合"},{"id":"seed-z-55","date":"2026-10-26","title":"ゼミ説明会: 叢（ソウ ズイシン）","type":"ゼミ説明会","memo":"昼 リアルタイム配信 ＋ オンデマンド資料あり","short":"説明会: 叢（ソウ"},{"id":"seed-z-56","date":"2026-10-30","title":"ゼミ説明会: 叢（ソウ ズイシン）","type":"ゼミ説明会","memo":"昼 リアルタイム配信 ＋ オンデマンド資料あり","short":"説明会: 叢（ソウ"},{"id":"seed-z-57","date":"2026-11-06","title":"ゼミ説明会: 叢（ソウ ズイシン）","type":"ゼミ説明会","memo":"昼 リアルタイム配信 ＋ オンデマンド資料あり","short":"説明会: 叢（ソウ"},{"id":"seed-z-58","date":"2026-10-29","title":"ゼミ説明会: 村上 始","type":"ゼミ説明会","memo":"16:50〜・17:20〜 S103","short":"説明会: 村上"},{"id":"seed-z-59","date":"2026-11-05","title":"ゼミ説明会: 村上 始","type":"ゼミ説明会","memo":"16:50〜・17:20〜 S103","short":"説明会: 村上"}];
function allEvents(){ return SEED_EVENTS.concat(events.filter(e=>!SEED_EVENTS.some(s=>s.date===e.date && s.title===e.title))); }
let books = load("bds_books", []);
let board = load("bds_board", null);
let candidates = load("bds_candidates", []);
let absences = load("bds_absences", {});
books.forEach(b=>{ b.type = b.type || "sell"; b.status = b.status || "open"; b.msgs = b.msgs || []; b.place = b.place || ""; b.when = b.when || ""; });
if(!board){ board = [
  {id:"seed-b1", title:"BDSクロバスが始まりました", body:"1期生には先輩の口コミも過去問もない。だから自分たちで作ります。受けた授業の口コミ、ゼミの雰囲気、テスト日程、使い終わった教科書。次の学年のためにも、知っていることを少しずつ残していってください。", cat:"お知らせ", by:"運営", grade:"-", date:"2026-10-28"}
]; save("bds_board", board); }

/* ---------- student gate ---------- */
function renderUserbox(){
  const box = document.getElementById("userbox");
  if(user){
    box.innerHTML = '<span class="chip">'+esc(user.grade)+'回生 '+esc(user.name)+(user.gradYear ? '（'+(+user.gradYear-2000)+'卒）' : '')+'</span><button id="logoutBtn" class="ubtn">登録を変更</button>';
    document.getElementById("logoutBtn").onclick = () => { showGate(); };
  } else {
    box.innerHTML = '<button id="loginBtn" class="ubtn solid">学生登録</button>';
    document.getElementById("loginBtn").onclick = showGate;
  }
}
function showGate(){
  $modal.innerHTML = '<div class="modal-bg"><div class="modal">'
  + '<h2>学生登録</h2>'
  + '<p class="note">BDSクロバスは<strong>関西大学の学生だけ</strong>が使える場所です。先生や学外の人は登録できません。<br>登録には、大学のログインで使う<strong>学籍番号（kから始まるID）</strong>が必要です。</p>'
  + '<div class="err" id="gateErr"></div>'
  + '<div class="formgrid">'
  + '<div class="field"><label>名前（フルネーム）</label><input id="gName" type="text" placeholder="例: 山下 翼" autocomplete="off"></div>'
  + '<div class="field"><label>学籍番号（k + 数字6桁。例: k924030）</label><input id="gSid" type="text" placeholder="ここに学籍番号を入力" autocomplete="off"></div>'
  + '<div class="field"><label>学年</label><select id="gGrade"><option value="">選んでください</option><option>1</option><option>2</option><option>3</option><option>4</option></select></div>'
  + '<div class="field"><label>学部</label><select id="gFac"><option>ビジネスデータサイエンス学部</option><option>その他の学部（関大生）</option></select></div>'
  + '<div class="field"><label>入学年度</label><select id="gEnroll"><option value="">選んでください</option>'+[2022,2023,2024,2025,2026,2027].map(function(y){return '<option value="'+y+'">'+y+'年</option>';}).join("")+'</select></div>'
  + '<div class="field"><label>卒業年度</label><select id="gGrad"><option value="">選んでください</option>'+[2026,2027,2028,2029,2030,2031].map(function(y){return '<option value="'+y+'">'+y+'年</option>';}).join("")+'</select></div>'
  + '</div>'
  + '<p class="note">※ 学籍番号は形式チェックだけに使い、保存も送信もしません。<br>※ 名前・年度は、サイト内のリンク（イベント情報など）をクリックした記録と一緒にこの端末へ保存され、後から「誰がどのリンクを使ったか」を確認するために使います。</p>'
  + '<button class="btn" id="gateSubmit" style="width:100%">'+(user ? '登録を変更する' : '登録してはじめる')+'</button>'
  + (user ? '<button class="btn ghost" id="gateCancel" style="width:100%;margin-top:8px">キャンセル</button><button id="gateDelete" style="width:100%;margin-top:10px;background:none;border:0;color:#9B2226;font-size:13px">登録情報を消す（投稿はこの端末に残ります）</button>' : '')
  + '</div></div>';
  const err = document.getElementById("gateErr");
  if(user){
    document.getElementById("gName").value = user.name || "";
    document.getElementById("gGrade").value = user.grade || "";
    document.getElementById("gFac").value = user.fac || "ビジネスデータサイエンス学部";
    document.getElementById("gEnroll").value = user.enrollYear || "";
    document.getElementById("gGrad").value = user.gradYear || "";
  }
  document.getElementById("gEnroll").onchange = function(e){ const y = +e.target.value; if(y) document.getElementById("gGrad").value = String(y + 4); };
  document.getElementById("gateSubmit").onclick = () => {
    const name = document.getElementById("gName").value.trim();
    const sid = document.getElementById("gSid").value.trim().toLowerCase();
    const grade = document.getElementById("gGrade").value;
    const fac = document.getElementById("gFac").value;
    const enrollYear = document.getElementById("gEnroll").value;
    const gradYear = document.getElementById("gGrad").value;
    if(!name){ err.style.display="block"; err.textContent="名前（フルネーム）を入力してください"; return; }
    if(!/^k\d{6}$/.test(sid)){ err.style.display="block"; err.textContent="学籍番号の形式が違います。「k + 数字6桁」で入力してください。例: k924030"; return; }
    if(!grade){ err.style.display="block"; err.textContent="学年を選んでください"; return; }
    if(!enrollYear){ err.style.display="block"; err.textContent="入学年度を選んでください"; return; }
    if(!gradYear){ err.style.display="block"; err.textContent="卒業年度を選んでください"; return; }
    user = { name: name, grade: grade, fac: fac, enrollYear: enrollYear, gradYear: gradYear };
    save("bds_user", user);
    $modal.innerHTML = "";
    renderUserbox();
    toast("登録しました。ようこそ、BDSクロバスへ");
    route();
  };
  const cancel = document.getElementById("gateCancel");
  if(cancel) cancel.onclick = () => { $modal.innerHTML=""; };
  const del = document.getElementById("gateDelete");
  if(del) del.onclick = () => { localStorage.removeItem("bds_user"); user=null; $modal.innerHTML=""; renderUserbox(); toast("登録情報を消しました"); route(); };
}
function requireUser(){
  if(user && user.enrollYear && user.gradYear) return true;
  if(user){ showGate(); toast("入学年度・卒業年度の登録をお願いします"); return false; }
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
  return (rs.reduce((s,r)=>s+(+(r.overall || r.easy)||0),0)/rs.length);
}
function stars(n){ const f = Math.round(n); return "★★★★★".slice(0,f) + "☆☆☆☆☆".slice(0,5-f); }

/* ---------- router ---------- */
let courseFilter = { q:"", preset:"", term:"", day:"", tag:"", minTest:"", sort:"name" };
let coursePage = 1;
let selectedTeacherIdx = 0;
let courseTab = "syllabus";
let zemiTab = "about";
let zemiFilter = { q:"", tag:"", fmt:"" };
let calZemiFmt = "";
let bookFilter = "all";
let openThreadId = null;
let calCursor = (()=>{ const d=new Date(); return {y:d.getFullYear(), m:d.getMonth()}; })();
let calSel = null;
function gcalUrl(ev){
  const d = ev.date.replace(/-/g, "");
  const nx = new Date(ev.date + "T00:00:00"); nx.setDate(nx.getDate() + 1);
  const d2 = nx.getFullYear() + String(nx.getMonth() + 1).padStart(2, "0") + String(nx.getDate()).padStart(2, "0");
  return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(ev.title) + "&dates=" + d + "/" + d2 + "&details=" + encodeURIComponent((ev.memo || "") + " (BDSクロバス)");
}
function evIsInperson(ev){
  if(ev.title.indexOf("ゼミ説明会: ") !== 0) return false;
  const z = ZEMI.find(x=>x.teacher === ev.title.slice(6));
  return !!(z && zemiFormats(z).includes("inperson"));
}
function evInpersonTag(ev){
  if(ev.title.indexOf("ゼミ説明会: ") !== 0) return "";
  const z = ZEMI.find(x=>x.teacher === ev.title.slice(6));
  return (z && zemiFormats(z).includes("inperson")) ? ' <span class="tag inperson">対面のみ</span>' : "";
}
function evActions(ev){
  let zid = "";
  if(ev.title.indexOf("ゼミ説明会: ") === 0){ const t = ev.title.slice(6); const z = ZEMI.find(x=>x.teacher === t); if(z) zid = z.id; }
  return (zid ? '<a class="btn small ghost" href="#/zemi/' + zid + '">ゼミの情報を見る</a> ' : '')
    + '<a class="btn small ghost" href="' + gcalUrl(ev) + '" target="_blank" rel="noopener">Googleカレンダーに追加</a>';
}
let calPresetTitle = "";

function parseHash(){
  const raw = location.hash.replace(/^#\/?/, "");
  if(!raw) return ["home"];
  return raw.split("/").map(s=>{ try{ return decodeURIComponent(s); }catch(e){ return s; } });
}
function setNav(key){
  document.querySelectorAll("[data-nav]").forEach(x=>x.classList.toggle("active", x.dataset.nav===key));
}
function route(){
  const p = parseHash();
  window.scrollTo(0,0);
  if(p[0]==="courses"){ setNav("courses"); renderCourses(); }
  else if(p[0]==="course" && p[1]){ setNav("courses"); renderCourseDetail(p[1], p[2]||"syllabus"); }
  else if(p[0]==="zemi" && p[1]){ setNav("zemi"); renderZemiDetail(p[1], p[2]||"about"); }
  else if(p[0]==="zemi"){ setNav("zemi"); renderZemi(); }
  else if(p[0]==="calendar"){ setNav("calendar"); renderCalendar(); }
  else if(p[0]==="books"){ setNav("books"); renderBooks(); }
  else if(p[0]==="board"){ setNav("board"); renderBoard(); }
  else if(p[0]==="reviews"){ setNav("reviews"); renderReviews(); }
  else if(p[0]==="mypage"){ setNav("mypage"); renderMypage(); }
  else { setNav("home"); renderHome(); }
}
window.addEventListener("hashchange", route);
document.querySelector(".brand").addEventListener("click", e => { e.preventDefault(); navTo("#/"); });

/* ---------- home ---------- */
function renderHome(){
  const totalReviews = Object.values(reviews).reduce((s,a)=>s+a.length,0);
  const totalExams = Object.values(exams).reduce((s,a)=>s+a.length,0);
  const menu = [
    ["#/courses","COURSES","授業を探す","テスト何割かで探せる。全授業の評価配分・口コミ・過去問。","wine"],
    ["#/zemi","SEMINAR","ゼミ一覧","全16ゼミの研究分野・タグ・みんなの書き込み。説明会の日程も。","blue"],
    ["#/calendar","CALENDAR","みんなのカレンダー","テスト日・ゼミ説明会・締切をみんなで追加。","green"],
    ["#/books","TEXTBOOKS","教科書売買","売ります／買います、手渡し場所つき。連絡もここで。","wine"],
    ["#/board","BOARD","掲示板","質問・情報共有。先輩のいない学部の、先輩代わり。","blue"],
    ["#/mypage","MY LIST","履修候補リスト","気になる授業をためて、単位とテスト傾向を集計。","green"]
  ];
  $app.innerHTML =
  '<section class="hero"><div class="hero-in">'
  + '<p class="hero-en">KANSAI UNIVERSITY — BUSINESS DATA SCIENCE</p>'
  + '<h1>先輩のいない学部の、<br>みんなの情報庫。</h1>'
  + '<p class="hero-sub">どの授業がテスト何割か、どのゼミが自分に合いそうか、教科書は誰か譲ってくれないか。BDS学部の学生同士で、情報を分け合う場所です。</p>'
  + '<div class="hero-search"><input type="text" id="homeQ" placeholder="授業名・先生・内容で検索（例: Python、経営戦略論、福井）"><button class="btn" id="homeSearch">授業を探す</button></div>'
  + '<p class="hero-credit">トップ画像: 関西大学公式サイト（ビジネスデータサイエンス学部）／ 授業データは公式シラバス（2026年度）から</p>'
  + '</div></section>'
  + '<section class="stats"><div><strong>'+COURSES.length+'</strong><span>授業クラス</span></div><div><strong>'+ZEMI.length+'</strong><span>ゼミ</span></div><div><strong>'+totalReviews+'</strong><span>口コミ</span></div><div><strong>'+totalExams+'</strong><span>過去問情報</span></div></section>'
  + '<h2 class="sec"><span class="sec-en">MENU</span>何をしますか</h2>'
  + '<div class="menugrid">'+ menu.map(([h,en,ja,d,cls])=>'<a class="menucard '+cls+'" href="'+h+'"><span class="mc-en">'+en+'</span><span class="mc-ja">'+ja+'</span><span class="mc-d">'+d+'</span><span class="mc-arrow">→</span></a>').join("") +'</div>'
  + '<h2 class="sec"><span class="sec-en">HOW TO</span>はじめての方へ</h2>'
  + '<div class="steps"><div class="step"><strong>1. 学生登録</strong><p>学籍番号（k+数字6桁）の形式チェック＋フルネーム・入学/卒業年度の登録で、関大生だけが投稿できます。閲覧は登録なしでもOK。</p></div>'
  + '<div class="step"><strong>2. 授業を探す</strong><p>「定期テスト100%」「定期テストなし」のような条件で絞り込めます。割合はシラバス原文の自動解析です。</p></div>'
  + '<div class="step"><strong>3. 知っていることを残す</strong><p>受けた授業の口コミ、過去問の傾向、ゼミの雰囲気。あなたの1件が、次の学年の「先輩」になります。</p></div></div>';
  document.getElementById("homeSearch").onclick = () => { courseFilter = {q:document.getElementById("homeQ").value.trim(), preset:"", term:"", day:"", tag:"", minTest:"", sort:"name"}; coursePage=1; navTo("#/courses"); };
  document.getElementById("homeQ").addEventListener("keydown", e=>{ if(e.key==="Enter") document.getElementById("homeSearch").click(); });
}

/* ---------- courses list ---------- */
function courseCard(c, pos, total){
  const rs = courseReviews(c);
  const avg = avgStars(c);
  const ex = (exams[c.id]||[]).length;
  const inCand = candidates.includes(c.id);
  return '<article class="card">'
  + (pos != null ? '<span class="posbadge">'+(pos+1)+'件目 / 全'+total+'件</span>' : '')
  + '<a class="card-main" href="#/course/'+encodeURIComponent(c.name)+'"><h3>'+esc(c.name)+'</h3></a>'
  + '<p class="card-meta">'+esc(c.instructor)+' ／ '+esc(c.term||"")+' '+esc(c.schedule||"")+' ／ '+esc(c.credits||"")+'単位'+(rs.length? ' ／ 口コミ'+rs.length+'件':'')+(ex? ' ／ 過去問'+ex+'件':'')+'</p>'
  + (avg!==null && rs.length>=3 ? '<p class="card-stars">'+stars(avg)+' 総合 '+avg.toFixed(1)+'（'+rs.length+'件）</p>' : (rs.length? '<p class="card-stars dim">口コミ'+rs.length+'件（平均は3件から表示）</p>':''))
  + gbar(c)
  + '<p class="card-tags">'+(c.tags||[]).map(t=>'<span class="tag">'+esc(t)+'</span>').join("")+((c.noExam && (c.cats.test||0)===0)?'<span class="tag ok">定期テストなし</span>':'')+'</p>'
  + '<button class="btn small '+(inCand?'ghost':'')+'" data-cand="'+esc(c.id)+'">'+(inCand?'履修候補から外す':'履修候補に入れる')+'</button>'
  + '</article>';
}
function bindCourseCards(){
  $app.querySelectorAll("[data-cand]").forEach(b=>b.onclick=e=>{
    e.preventDefault();
    const id = b.dataset.cand;
    if(candidates.includes(id)){ candidates = candidates.filter(x=>x!==id); toast("履修候補から外しました"); }
    else { if(!requireUser()) return; candidates.push(id); toast("履修候補に入れました（マイページで確認できます）"); }
    save("bds_candidates", candidates);
    route();
  });
}
function applyFilter(list){
  const f = courseFilter;
  let out = list.filter(c=>{
    if(f.q){ const q=f.q.toLowerCase(); const hay=(c.name+" "+(c.instructor||"")+" "+(c.desc||"")+" "+(c.textbook||"")+" "+(c.tags||[]).join(" ")).toLowerCase(); if(!hay.includes(q)) return false; }
    if(f.term && !(c.term||"").includes(f.term)) return false;
    if(f.day && !(c.schedule||"").includes(f.day)) return false;
    if(f.tag && !(c.tags||[]).includes(f.tag)) return false;
    if(f.minTest!=="" && (c.cats.test||0) < +f.minTest) return false;
    if(f.preset==="test100" && (c.cats.test||0) < 100) return false;
    if(f.preset==="noexam" && !((c.cats.test||0)===0)) return false;
    if(f.preset==="attend" && (c.cats.attend||0) < 50) return false;
    if(f.preset==="report" && (c.cats.report||0) < 40) return false;
    if(f.preset==="ondemand" && !/集中|オンデマンド|その他/.test((c.schedule||"")+" "+(c.term||""))) return false;
    return true;
  });
  out.sort((a,b)=>{
    switch(f.sort){
      case "testDesc": return (b.cats.test||0)-(a.cats.test||0);
      case "testAsc": return (a.cats.test||0)-(b.cats.test||0);
      case "attendDesc": return (b.cats.attend||0)-(a.cats.attend||0);
      case "easy": { const x=avgStars(b), y=avgStars(a); return (x===null?-1:x)-(y===null?-1:y); }
      case "reviews": return courseReviews(b).length-courseReviews(a).length;
      default: return a.name.localeCompare(b.name,"ja");
    }
  });
  return out;
}
function renderCourses(){
  const tags = [...new Set(COURSES.flatMap(c=>c.tags||[]))];
  const filtered = applyFilter(COURSES);
  const perPage = 24, pages = Math.max(1, Math.ceil(filtered.length/perPage));
  if(coursePage>pages) coursePage=pages;
  const slice = filtered.slice((coursePage-1)*perPage, coursePage*perPage);
  $app.innerHTML =
  '<h2 class="sec"><span class="sec-en">COURSES</span>授業を探す</h2>'
  + '<p class="sec-note">公式シラバス（2026年度・BDS学部専門教育科目 全'+COURSES.length+'クラス）から、評価の割合で探せます。割合はシラバス原文からの自動解析のため誤差がある場合があります。必ず各授業の公式シラバス原文で確認してください。</p>'
  + '<div class="filters"><div class="row">'
  + '<div class="field" style="flex:1;min-width:200px"><label>キーワード（授業名・先生・内容）</label><input type="text" id="fQ" value="'+esc(courseFilter.q)+'" placeholder="例: Python、マーケティング、福井"></div>'
  + '<div class="field"><label>学期</label><select id="fTerm"><option value="">すべて</option>'+["春","秋"].map(t=>'<option '+(courseFilter.term===t?"selected":"")+'>'+t+'</option>').join("")+'</select></div>'
  + '<div class="field"><label>曜日</label><select id="fDay"><option value="">すべて</option>'+["月","火","水","木","金","土"].map(t=>'<option '+(courseFilter.day===t?"selected":"")+'>'+t+'</option>').join("")+'</select></div>'
  + '<div class="field"><label>分野</label><select id="fTag"><option value="">すべて</option>'+tags.map(t=>'<option '+(courseFilter.tag===t?"selected":"")+'>'+esc(t)+'</option>').join("")+'</select></div>'
  + '<div class="field"><label>定期テスト割合が何%以上</label><input type="number" id="fMinTest" min="0" max="100" step="10" value="'+esc(courseFilter.minTest)+'" placeholder="例: 80"></div>'
  + '</div><div class="quickchips">'
  + [["","すべて"],["test100","テスト100%"],["noexam","定期テストなし"],["attend","出席・平常50%以上"],["report","レポート40%以上"],["ondemand","集中・その他曜限"]].map(([k,l])=>'<button class="qchip '+(courseFilter.preset===k?"on":"")+'" data-p="'+k+'">'+l+'</button>').join("")
  + '</div></div>'
  + '<div class="sortbar">並び替え: <select id="fSort">'
  + [["name","授業名順"],["testDesc","テスト割合が高い順"],["testAsc","テスト割合が低い順"],["attendDesc","出席・平常が高い順"],["easy","口コミの総合評価順"],["reviews","口コミが多い順"]].map(([k,l])=>'<option value="'+k+'" '+(courseFilter.sort===k?"selected":"")+'>'+l+'</option>').join("")
  + '</select>　<strong>'+filtered.length+'件</strong>見つかりました</div>'
  + (slice.length? '<div class="grid">'+slice.map(function(c,i){ return courseCard(c, (coursePage-1)*perPage+i, filtered.length); }).join("")+'</div>' : '<div class="empty">条件に合う授業が見つかりませんでした。条件をゆるめてみてください。</div>')
  + (pages>1 ? '<div class="pager">'+Array.from({length:pages},(_,i)=>'<button data-page="'+(i+1)+'" class="'+(coursePage===i+1?"on":"")+'">'+(i+1)+'</button>').join("")+'</div>' : '');
  const upd = () => { courseFilter.q=document.getElementById("fQ").value; courseFilter.term=document.getElementById("fTerm").value; courseFilter.day=document.getElementById("fDay").value; courseFilter.tag=document.getElementById("fTag").value; courseFilter.minTest=document.getElementById("fMinTest").value; courseFilter.sort=document.getElementById("fSort").value; coursePage=1; renderCourses(); };
  ["fTerm","fDay","fTag","fSort"].forEach(id=>document.getElementById(id).onchange=upd);
  document.getElementById("fMinTest").onchange=upd;
  document.getElementById("fQ").addEventListener("keydown",e=>{ if(e.key==="Enter") upd(); });
  $app.querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{ courseFilter.preset=b.dataset.p; coursePage=1; renderCourses(); });
  $app.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{ coursePage=+b.dataset.page; renderCourses(); window.scrollTo(0,0); });
  bindCourseCards();
}

/* ---------- course detail (tabs) ---------- */
let lastCourseName = null;
function renderCourseDetail(name, tab){
  courseTab = ["syllabus","reviews","exams"].includes(tab) ? tab : "syllabus";
  if(lastCourseName !== name){ selectedTeacherIdx = 0; lastCourseName = name; }
  const entries = COURSES.filter(c=>c.name===name);
  if(!entries.length){ $app.innerHTML = '<div class="empty">授業が見つかりませんでした。<a href="#/courses">授業一覧へ</a></div>'; return; }
  const teachers = [...new Set(entries.map(e=>e.instructor))];
  if(selectedTeacherIdx >= teachers.length) selectedTeacherIdx = 0;
  const tEntries = entries.filter(e=>e.instructor===teachers[selectedTeacherIdx]);
  const c = tEntries[0];
  const rs = tEntries.flatMap(e=>courseReviews(e));
  const ex = tEntries.flatMap(e=>exams[e.id]||[]);
  const avg = rs.length ? rs.reduce((s,r)=>s+(+(r.overall || r.easy)||0),0)/rs.length : null;
  const tabBtn = (k,label)=>'<button class="tabbtn '+(courseTab===k?"on":"")+'" data-ctab="'+k+'">'+label+'</button>';
  let body = "";
  if(courseTab==="syllabus"){
    body = '<section class="panel"><h3>シラバス情報</h3>'
    + '<div class="kv"><span>担当</span><p>'+esc(c.instructor)+'</p></div>'
    + '<div class="kv"><span>学期・曜限</span><p>'+esc(c.term||"")+' '+esc(c.schedule||"")+' ／ '+esc(c.credits||"")+'単位'+(c.cls? ' ／ クラス: '+esc(c.cls):'')+'</p></div>'
    + '<div class="kv"><span>評価配分</span><div>'+gbar(c)+'</div></div>'
    + (c.grading? '<div class="kv"><span>評価方法（原文）</span><p class="pre">'+esc(c.grading)+'</p></div>':'')
    + (c.desc? '<div class="kv"><span>授業概要</span><p class="pre">'+esc(c.desc)+'</p></div>':'')
    + (c.textbook? '<div class="kv"><span>教科書</span><p class="pre">'+esc(c.textbook)+'</p></div>':'')
    + '<div class="kv"><span>公式シラバス</span><p>'+(c.url? '<a href="'+esc(c.url)+'" target="_blank" rel="noopener">公式シラバスで原文を見る</a>' : '未取得')+'</p></div>'
    + '<p class="note">割合はシラバス原文からの自動解析です。原文と違う場合は原文が正です。</p>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn small ghost" id="addCal">この授業のテスト日をカレンダーに登録</button>'
    + '<button class="btn small '+(candidates.includes(c.id)?'ghost':'')+'" id="candBtn">'+(candidates.includes(c.id)?'履修候補から外す':'履修候補に入れる')+'</button></div>'
    + '</section>'
    + '<section class="panel"><h3>欠席カウンター（自分用・この端末のみ）</h3>'
    + ((c.id in absences)
      ? '<p class="absrow"><span class="abscount">'+absences[c.id]+'回</span>休みました'
        + (absences[c.id]>=3 ? ' <span class="tag warn">目安: あと'+Math.max(0,5-absences[c.id])+'回で危険圏</span>' : '')
        + '</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="absPlus">今日休んだ（+1）</button><button class="btn small ghost" id="absMinus">-1 戻す</button><button class="btn small ghost" id="absReset">リセット</button></div>'
      : '<p class="note">この授業を履修していたら、休んだ回数をここで数えられます。</p><button class="btn small" id="absTrack">履修中として登録</button>')
    + '<p class="note">目安: 全15回の授業では5回休むと単位が危ないことが多いです（正確な基準は科目・先生によります）。</p></section>';
  }
  if(courseTab==="reviews"){
    body = '<section class="panel"><h3>口コミ（'+esc(c.instructor)+'先生）</h3>'
    + (avg!==null && rs.length>=3 ? '<p class="card-stars">'+stars(avg)+' 総合評価 '+avg.toFixed(1)+'（'+rs.length+'件）</p>' : (rs.length? '<p class="note">口コミは'+rs.length+'件。平均点は3件たまると表示されます。</p>':''))
    + (rs.length ? rs.map(r=>{ const o=+(r.overall || r.easy)||0; const dims=[["取りやすさ",r.easy],["充実度",r.rich],["課題の重さ",r.heavy]].filter(d=>+d[1]>0).map(d=>d[0]+" "+stars(+d[1])).join(" ／ "); return '<div class="post"><p class="post-head"><span class="revstars">'+stars(o)+'</span> 総合'+(o||"-")+(dims? ' ／ '+dims : '')+' <span>'+esc(r.by||"")+' ・ '+esc(r.date||"")+'</span></p><p>'+esc(r.body||"")+'</p></div>'; }).join("") : '<div class="empty">まだ口コミがありません。受けたことがある人は、最初の1件を書いてください。</div>')
    + '<h4>口コミを書く</h4>'
    + '<div class="formgrid">'
    + '<div class="field" style="grid-column:1/-1"><label>総合評価（星をタップ）</label><div class="starinput" data-row="overall"></div></div>'
    + '<div class="field"><label>取りやすさ</label><div class="starinput" data-row="easy"></div></div>'
    + '<div class="field"><label>充実度</label><div class="starinput" data-row="rich"></div></div>'
    + '<div class="field"><label>課題の重さ（星が多いほど重い）</label><div class="starinput" data-row="heavy"></div></div>'
    + '<div class="field" style="grid-column:1/-1"><label>本文（任意）</label><textarea id="rBody" rows="3" placeholder="テストの傾向、出席の厳しさ、課題の量など、後輩が知りたいことを"></textarea></div>'
    + '</div>'
    + '<p class="note">先生個人への誹謗中傷ではなく、授業の事実を書いてください。不適切な投稿は運営が削除します。</p>'
    + '<button class="btn" id="rSubmit">口コミを投稿</button></section>';
  }
  if(courseTab==="exams"){
    body = '<section class="panel"><h3>過去問・出題傾向（'+esc(c.instructor)+'先生）</h3>'
    + (ex.length ? ex.map(x=>'<div class="post"><p class="post-head">'+esc(x.year||"")+'年度 ／ '+esc(x.kind||"")+' <span>'+esc(x.by||"")+' ・ '+esc(x.date||"")+'</span></p><p>'+esc(x.memo||"")+'</p>'+(x.link? '<p><a href="'+esc(x.link)+'" target="_blank" rel="noopener">参考リンク</a></p>':'')+'</div>').join("") : '<div class="empty">まだ情報がありません。受けた人は出題の傾向だけでも残してください。</div>')
    + '<h4>情報を追加</h4>'
    + '<div class="formgrid">'
    + '<div class="field"><label>年度</label><input id="eYear" type="text" placeholder="例: 2025"></div>'
    + '<div class="field"><label>種類</label><select id="eKind"><option>定期試験</option><option>中間・小テスト</option><option>レポート課題</option><option>その他</option></select></div>'
    + '<div class="field" style="grid-column:1/-1"><label>傾向メモ</label><textarea id="eMemo" rows="3" placeholder="例: 持ち込み可。授業スライドの図表から多く出題。計算問題中心で過去問と似た形式。"></textarea></div>'
    + '<div class="field" style="grid-column:1/-1"><label>リンク（任意。公開リンクでないことを確認）</label><input id="eLink" type="url" placeholder="https://"></div>'
    + '</div>'
    + '<p class="note">試験問題そのものの転載は著作権に触れることがあります。まずは「出題傾向メモ」中心でお願いします。</p>'
    + '<button class="btn" id="eSubmit">追加する</button></section>';
  }
  $app.innerHTML =
  '<p class="crumb"><a href="#/courses">← 授業一覧に戻る</a></p>'
  + '<h2 class="detail-title">'+esc(name)+'</h2>'
  + (teachers.length>1 ? '<div class="teachertabs">'+teachers.map((t,i)=>'<button class="'+(i===selectedTeacherIdx?"on":"")+'" data-t="'+i+'">'+esc(t)+'先生</button>').join("")+'</div>' : '<p class="sec-note">担当: '+esc(c.instructor)+'先生 ／ '+esc(c.term||"")+' '+esc(c.schedule||"")+' ／ '+esc(c.credits||"")+'単位'+(tEntries.length>1 ? ' ／ 全'+tEntries.length+'クラス（口コミ・過去問は合算表示）' : '')+'</p>')
  + '<div class="tabbar">'+tabBtn("syllabus","概要・成績") + tabBtn("reviews","口コミ（"+rs.length+"）") + tabBtn("exams","過去問（"+ex.length+"）")+'</div>'
  + body;
  $app.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{ selectedTeacherIdx=+b.dataset.t; renderCourseDetail(name, courseTab); });
  $app.querySelectorAll("[data-ctab]").forEach(b=>b.onclick=()=>{ navTo("#/course/"+encodeURIComponent(name)+"/"+b.dataset.ctab); });
  if(courseTab==="syllabus"){
    document.getElementById("addCal").onclick=()=>{ calPresetTitle = name; navTo("#/calendar"); };
    const absPlus = document.getElementById("absPlus");
    if(absPlus){
      absPlus.onclick=()=>{ absences[c.id]=(absences[c.id]||0)+1; save("bds_absences", absences); renderCourseDetail(name, courseTab); };
      document.getElementById("absMinus").onclick=()=>{ absences[c.id]=Math.max(0,(absences[c.id]||0)-1); save("bds_absences", absences); renderCourseDetail(name, courseTab); };
      document.getElementById("absReset").onclick=()=>{ absences[c.id]=0; save("bds_absences", absences); renderCourseDetail(name, courseTab); };
    }
    const absTrack = document.getElementById("absTrack");
    if(absTrack) absTrack.onclick=()=>{ if(!requireUser()) return; absences[c.id]=0; save("bds_absences", absences); toast("履修中として登録しました"); renderCourseDetail(name, courseTab); };
    document.getElementById("candBtn").onclick=()=>{
      if(candidates.includes(c.id)){ candidates = candidates.filter(x=>x!==c.id); toast("履修候補から外しました"); }
      else { if(!requireUser()) return; candidates.push(c.id); toast("履修候補に入れました"); }
      save("bds_candidates", candidates); renderCourseDetail(name, courseTab);
    };
  }
  if(courseTab==="reviews"){
    const rv = { overall:0, easy:0, rich:0, heavy:0 };
    $app.querySelectorAll(".starinput").forEach(box=>{
      const row = box.dataset.row;
      const draw = ()=>{ box.innerHTML = [1,2,3,4,5].map(v=>'<button type="button" class="starbtn '+(v<=rv[row]?"on":"")+'" data-v="'+v+'">★</button>').join("") + '<span class="starval">'+(rv[row] ? rv[row] : "未選択")+'</span>';
        box.querySelectorAll(".starbtn").forEach(b=>b.onclick=()=>{ rv[row]=+b.dataset.v; draw(); }); };
      draw();
    });
    document.getElementById("rSubmit").onclick=()=>{
      if(!requireUser()) return;
      if(!rv.overall){ toast("総合評価の星を選んでください"); return; }
      (reviews[c.id] = reviews[c.id] || []).unshift({ overall:rv.overall, easy:rv.easy||"", rich:rv.rich||"", heavy:rv.heavy||"", body:document.getElementById("rBody").value.trim(), by:user.name+"（"+user.grade+"回生）", date:todayStr() });
      save("bds_reviews", reviews); toast("口コミを投稿しました"); renderCourseDetail(name, "reviews");
    };
  }
  if(courseTab==="exams"){
    document.getElementById("eSubmit").onclick=()=>{
      if(!requireUser()) return;
      const memo = document.getElementById("eMemo").value.trim();
      if(!memo){ toast("傾向メモを書いてください"); return; }
      (exams[c.id] = exams[c.id] || []).unshift({ year:document.getElementById("eYear").value.trim(), kind:document.getElementById("eKind").value, memo, link:document.getElementById("eLink").value.trim(), by:user.name+"（"+user.grade+"回生）", date:todayStr() });
      save("bds_exams", exams); toast("過去問情報を追加しました"); renderCourseDetail(name, "exams");
    };
  }
}

/* ---------- zemi ---------- */
const ZFORMATS = [["","すべて"],["ondemand","オンデマンド資料あり"],["live","リアルタイム配信"],["inperson","対面のみ"],["none","説明会なし"]];
function zemiFormats(z){
  const info = zemiInfo[z.id] || {};
  const ond = info.ondemand ?? z.ondemand ?? "";
  const brief = info.briefing ?? z.briefing ?? "";
  const f = [];
  if(ond.startsWith("http")) f.push("ondemand");
  if((ond + brief).includes("リアルタイム")) f.push("live");
  if(ond.includes("対面のみ")) f.push("inperson");
  if(brief === "説明会なし" || ond.includes("メッセージのみ")) f.push("none");
  return f;
}
function fmtBadges(z){
  const f = zemiFormats(z); const out = [];
  if(f.includes("ondemand")) out.push('<span class="tag ok">オンデマンド資料あり</span>');
  if(f.includes("live")) out.push('<span class="tag">リアルタイム配信</span>');
  if(f.includes("inperson")) out.push('<span class="tag inperson">対面のみ（オンラインなし）</span>');
  if(f.includes("none")) out.push('<span class="tag">説明会なし</span>');
  return out.length ? '<p class="card-tags">' + out.join("") + '</p>' : '';
}
function linkifyBrief(t){
  return esc(t).replace(/https?:\/\/[^\s<]+/g, function(u){ return '<a href="' + u + '" target="_blank" rel="noopener">リンク</a>'; });
}
function renderZemi(){
  const tags = [...new Set(ZEMI.flatMap(z=>z.tags||[]))];
  const list = ZEMI.filter(z=>{
    if(zemiFilter.q){ const q=zemiFilter.q.toLowerCase(); if(!(z.teacher.toLowerCase().includes(q)||(z.field||"").toLowerCase().includes(q)||(z.intro||"").toLowerCase().includes(q))) return false; }
    if(zemiFilter.tag && !(z.tags||[]).includes(zemiFilter.tag)) return false;
    if(zemiFilter.fmt && !zemiFormats(z).includes(zemiFilter.fmt)) return false;
    return true;
  });
  $app.innerHTML =
  '<h2 class="sec"><span class="sec-en">SEMINAR</span>ゼミ一覧</h2>'
  + '<p class="sec-note">BDS学部のゼミ（専門演習）'+ZEMI.length+'件。研究分野は学部パンフレット2026から。説明会の日程・オンデマンド動画は分かった人が各ゼミのページで追加できます。</p>'
  + '<div class="filters"><div class="row">'
  + '<div class="field" style="flex:1;min-width:200px"><label>キーワード（先生・研究分野）</label><input type="text" id="zQ" value="'+esc(zemiFilter.q)+'" placeholder="例: 機械学習、マーケティング"></div>'
  + '</div>'
  + '<div class="quickchips" style="margin-top:10px">'+ZFORMATS.map(function(pr){ return '<button class="qchip '+(zemiFilter.fmt===pr[0]?"on":"")+'" data-zfmt="'+pr[0]+'">'+pr[1]+'</button>'; }).join("")+'</div>'
  + '<div class="quickchips">'+[""].concat(tags).map(function(t){ return '<button class="qchip '+(zemiFilter.tag===t?"on":"")+'" data-ztag="'+esc(t)+'">'+(t || "ジャンル: すべて")+'</button>'; }).join("")+'</div>'
  + '</div>'
  + '<p class="sec-note">'+list.length+'件のゼミが見つかりました</p>'
  + '<div class="grid">'+ list.map(z=>{
      const info = zemiInfo[z.id] || {};
      const brief = info.briefing || z.briefing || "";
      const posts = (zemiPosts[z.id]||[]).length;
      return '<article class="card"><a class="card-main" href="#/zemi/'+esc(z.id)+'"><h3>'+esc(z.teacher)+' ゼミ</h3></a>'
      + '<p class="card-meta">'+esc(z.title||"")+' ／ '+esc(z.field||"")+(posts? ' ／ 書き込み'+posts+'件':'')+'</p>'
      + '<p class="card-d">'+esc(z.intro||"")+'</p>'
      + '<p class="card-tags">'+(z.tags||[]).map(t=>'<span class="tag">'+esc(t)+'</span>').join("")+'</p>'
      + fmtBadges(z)
      + '<p class="card-meta">'+(brief? '説明会: '+linkifyBrief(brief) : '説明会: <span class="dim">情報募集中</span>')+'</p></article>';
    }).join("") +'</div>';
  $app.querySelectorAll("[data-zfmt]").forEach(b=>b.onclick=()=>{ zemiFilter.fmt=b.dataset.zfmt; renderZemi(); });
  $app.querySelectorAll("[data-ztag]").forEach(b=>b.onclick=()=>{ zemiFilter.tag=b.dataset.ztag; renderZemi(); });
  document.getElementById("zQ").addEventListener("keydown",e=>{ if(e.key==="Enter"){ zemiFilter.q=e.target.value; renderZemi(); } });
}
function lmsLinkHtml(url, label, compact){
  if(url.includes("kulms")){
    if(compact) return '<span class="lmsline"><a class="btn small" data-track="lms" data-label="'+esc(label || "LMS資料")+'" href="'+esc(url)+'" target="_blank" rel="noopener">LMS資料を開く</a> <span class="dim">(要LMSログイン)</span></span>';
    return '<span class="lmsbox"><a class="btn ghost" href="https://kulms.tl.kansai-u.ac.jp/webclass/" target="_blank" rel="noopener">1. LMSにログイン</a> <a class="btn" data-track="lms" data-label="'+esc(label || "LMS資料")+'" href="'+esc(url)+'" target="_blank" rel="noopener">2. 資料を開く</a><br><span class="dim">LMSは未ログインで開くと、ログイン後にトップへ戻ってしまいます。先にログインしてから「2. 資料を開く」を押してください（ログイン済みなら2だけでOK）</span></span>';
  }
  return '<a href="'+esc(url)+'" target="_blank" rel="noopener">'+esc(url)+'</a>';
}
function renderZemiDetail(id, tab){
  zemiTab = ["about","posts","info"].includes(tab) ? tab : "about";
  const z = ZEMI.find(x=>x.id===id);
  if(!z){ $app.innerHTML = '<div class="empty">ゼミが見つかりませんでした。<a href="#/zemi">ゼミ一覧へ</a></div>'; return; }
  const info = zemiInfo[id] || {};
  const brief = info.briefing ?? z.briefing ?? "";
  const ond = info.ondemand ?? z.ondemand ?? "";
  const posts = zemiPosts[id] || [];
  const tabBtn = (k,label)=>'<button class="tabbtn '+(zemiTab===k?"on":"")+'" data-ztab="'+k+'">'+label+'</button>';
  let body = "";
  if(zemiTab==="about"){
    body = '<section class="panel"><h3>ゼミ情報</h3>'
    + '<div class="kv"><span>担当</span><p>'+esc(z.teacher)+'（'+esc(z.title||"")+'）</p></div>'
    + '<div class="kv"><span>研究分野</span><p>'+esc(z.field||"")+'</p></div>'
    + '<div class="kv"><span>タグ</span><p>'+(z.tags||[]).map(t=>'<span class="tag">'+esc(t)+'</span>').join(" ")+'</p></div>'
    + '<div class="kv"><span>紹介</span><p class="pre">'+esc(z.intro||"")+'</p></div>'
    + '<div class="kv"><span>説明会</span><p>'+(brief? linkifyBrief(brief) : '<span class="dim">情報募集中（「説明会・動画」タブから追加できます）</span>')+'</p></div>'
    + '<div class="kv"><span>オンデマンド</span><p>'+(ond? (ond.startsWith("http")? lmsLinkHtml(ond, "ゼミ資料: " + z.teacher) : esc(ond)) : '<span class="dim">情報募集中</span>')+'</p></div>'
    + '</section>';
  }
  if(zemiTab==="posts"){
    body = '<section class="panel"><h3>みんなの書き込み（'+posts.length+'件）</h3>'
    + (posts.length ? posts.map(p=>'<div class="post"><p class="post-head">'+esc(p.cat||"情報")+' <span>'+esc(p.by||"")+' ・ '+esc(p.date||"")+'</span></p><p>'+esc(p.body||"")+'</p></div>').join("") : '<div class="empty">まだ書き込みがありません。ゼミの雰囲気・選考・活動頻度など、知っていることを書いてください。</div>')
    + '<h4>書き込む</h4><div class="formgrid">'
    + '<div class="field"><label>種類</label><select id="zpCat"><option>ゼミの雰囲気</option><option>選考・応募</option><option>活動内容</option><option>その他</option></select></div>'
    + '<div class="field" style="grid-column:1/-1"><label>本文</label><textarea id="zpBody" rows="3" placeholder="例: 週1回、発表とディスカッション中心。先生は現場経験の話が多め。"></textarea></div></div>'
    + '<button class="btn" id="zpSubmit">投稿する</button></section>';
  }
  if(zemiTab==="info"){
    body = '<section class="panel"><h3>説明会・オンデマンド情報</h3>'
    + '<p class="note">正式な日程は学内LMS限定のため、ここは学生が知っている情報を出し合う場所です。分かった人が上書きしてください。</p>'
    + '<div class="formgrid">'
    + '<div class="field" style="grid-column:1/-1"><label>説明会の日程・場所</label><input id="ziBrief" type="text" value="'+esc(brief)+'" placeholder="例: 11/12(水) 5限、教室棟301（対面）"></div>'
    + '<div class="field" style="grid-column:1/-1"><label>オンデマンド動画のURL</label><input id="ziOnd" type="url" value="'+esc(ond)+'" placeholder="https://"></div>'
    + '</div><button class="btn" id="ziSubmit">保存する</button></section>';
  }
  $app.innerHTML =
  '<p class="crumb"><a href="#/zemi">← ゼミ一覧に戻る</a></p>'
  + '<h2 class="detail-title">'+esc(z.teacher)+' ゼミ</h2>'
  + '<p class="sec-note">'+esc(z.title||"")+' ／ '+esc(z.field||"")+'</p>'
  + (zemiFormats(z).includes("inperson") ? '<div class="inperson-banner">対面のみ：オンデマンド動画もオンライン配信もありません。行ける日程は逃さないようにしてください。</div>' : '')
  + '<div class="tabbar">'+tabBtn("about","ゼミ情報")+tabBtn("posts","書き込み（"+posts.length+"）")+tabBtn("info","説明会・動画")+'</div>'
  + body;
  $app.querySelectorAll("[data-ztab]").forEach(b=>b.onclick=()=>{ navTo("#/zemi/"+id+"/"+b.dataset.ztab); });
  if(zemiTab==="posts"){
    document.getElementById("zpSubmit").onclick=()=>{
      if(!requireUser()) return;
      const body = document.getElementById("zpBody").value.trim();
      if(!body){ toast("本文を書いてください"); return; }
      (zemiPosts[id] = zemiPosts[id] || []).unshift({ cat:document.getElementById("zpCat").value, body, by:user.name+"（"+user.grade+"回生）", date:todayStr() });
      save("bds_zemi_posts", zemiPosts); toast("投稿しました"); renderZemiDetail(id, "posts");
    };
  }
  if(zemiTab==="info"){
    document.getElementById("ziSubmit").onclick=()=>{
      if(!requireUser()) return;
      zemiInfo[id] = { briefing:document.getElementById("ziBrief").value.trim(), ondemand:document.getElementById("ziOnd").value.trim(), by:user.name, date:todayStr() };
      save("bds_zemi_info", zemiInfo); toast("保存しました"); renderZemiDetail(id, "about");
    };
  }
}

/* ---------- calendar ---------- */
function renderCalendar(){
  if(!calSel) calSel = todayStr();
  const {y, m} = calCursor;
  const first = new Date(y, m, 1);
  const startDay = first.getDay();
  const days = new Date(y, m+1, 0).getDate();
  const today = todayStr();
  const byDay = {};
  allEvents().forEach(ev=>{ (byDay[ev.date] = byDay[ev.date] || []).push(ev); });
  let cells = "";
  for(let i=0;i<startDay;i++) cells += '<div class="cal-cell blank"></div>';
  for(let d=1; d<=days; d++){
    const ds = y+"-"+String(m+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");
    const evs = byDay[ds] || [];
    cells += '<div class="cal-cell'+(ds===today?" today":"")+(ds===calSel?" sel":"")+'" data-day="'+ds+'"><span class="cal-d">'+d+'</span>'+evs.slice(0,3).map(ev=>'<span class="cal-ev '+esc(ev.type||"その他")+(evIsInperson(ev)?" inp":"")+'">'+esc(ev.short || ev.title)+'</span>').join("")+(evs.length>3? '<span class="cal-ev more'+(evs.slice(3).some(evIsInperson)?" inp":"")+'">他'+(evs.length-3)+'件</span>':'')+'</div>';
  }
  const upcoming = allEvents().filter(ev=>ev.date>=today).sort((a,b)=>a.date<b.date?-1:1).slice(0,14);
  const todayEvs = byDay[today] || [];
  const todayStrip = '<div class="todaystrip"><span class="ts-label">今日の予定</span>'
    + (todayEvs.length ? todayEvs.map(ev=>{
        const tm = (ev.memo || "").match(/\d{1,2}:\d{2}[^\s／]*/);
        let label = (ev.short || ev.title) + (tm ? " " + tm[0] : "");
        const zz = ev.title.indexOf("ゼミ説明会: ") === 0 ? ZEMI.find(x=>x.teacher === ev.title.slice(6)) : null;
        if(zz && zemiFormats(zz).includes("inperson")) label += "・対面のみ";
        if(zz) return '<a class="ts-chip' + (zemiFormats(zz).includes("inperson") ? " inp" : "") + '" href="#/zemi/' + zz.id + '">' + esc(label) + '</a>';
        return '<button class="ts-chip" data-selday="' + today + '">' + esc(label) + '</button>';
      }).join("") : '<span class="dim">今日の予定はありません</span>')
    + '</div>';
  const selLabel = calSel === today ? "今日の予定" : calSel + " の予定";
  const dayPanel = '<section class="panel" id="dayPanel"><h3>' + esc(selLabel) + '</h3>'
    + ((byDay[calSel] || []).length ? (byDay[calSel] || []).map(ev=>'<div class="listrow"><div><strong>'+esc(ev.title)+'</strong>'+evInpersonTag(ev)+'<div class="card-meta">'+esc(ev.type||"")+(ev.memo? ' / '+esc(ev.memo):'')+'</div><div style="margin-top:6px">'+evActions(ev)+'</div></div></div>').join("") : '<div class="empty">この日の予定はありません。日付をタップするとその日の予定が見られます。</div>')
    + '</section>';
  const zemiSchedule = '<section class="panel"><h3>ゼミ説明会・オンデマンド一覧</h3>'
  + '<p class="note">全ゼミの説明会日程とオンデマンド動画URLの一覧です。ボタンで形式ごとに絞り込めます。</p>'
  + '<div class="quickchips" style="margin:6px 0 4px">'+ZFORMATS.map(function(pr){ return '<button class="qchip '+(calZemiFmt===pr[0]?"on":"")+'" data-cfmt="'+pr[0]+'">'+pr[1]+'</button>'; }).join("")+'</div>'
  + ZEMI.filter(z=>!calZemiFmt || zemiFormats(z).includes(calZemiFmt)).map(z=>{
      const info = zemiInfo[z.id] || {};
      const brief = info.briefing ?? z.briefing ?? "";
      const ond = info.ondemand ?? z.ondemand ?? "";
      return '<div class="listrow"><div><a href="#/zemi/'+esc(z.id)+'"><strong>'+esc(z.teacher)+' ゼミ</strong></a>'+(zemiFormats(z).includes("inperson") ? ' <span class="tag inperson">対面のみ</span>' : '')
      + '<div class="card-meta">説明会: '+(brief? linkifyBrief(brief) : '<span class="dim">情報募集中</span>')
      + '<br>オンデマンド: '+(ond? (ond.startsWith("http")? lmsLinkHtml(ond, "ゼミ資料: " + z.teacher, true) : esc(ond)) : '<span class="dim">情報募集中</span>')+'</div></div>'
      + '<a class="btn small ghost" href="#/zemi/'+esc(z.id)+'/info">追加・編集</a></div>';
    }).join("")
  + '</section>';
  $app.innerHTML =
  '<h2 class="sec"><span class="sec-en">CALENDAR</span>みんなのカレンダー</h2>'
  + '<p class="sec-note">テスト日、ゼミ説明会、レポート締切など、みんなで追加していくカレンダーです。</p>'
  + todayStrip
  + '<div class="cal-head"><button class="btn small ghost" id="calPrev">← 前の月</button><h3>'+y+'年'+(m+1)+'月</h3><button class="btn small ghost" id="calNext">次の月 →</button></div>'
  + '<div class="cal-grid"><div class="cal-w">日</div><div class="cal-w">月</div><div class="cal-w">火</div><div class="cal-w">水</div><div class="cal-w">木</div><div class="cal-w">金</div><div class="cal-w">土</div>'+cells+'</div>'
  + dayPanel
  + zemiSchedule
  + '<section class="panel"><h3>これからの予定</h3>'
   + (upcoming.length ? upcoming.map(ev=>'<div class="listrow"><div><strong>'+esc(ev.title)+'</strong>'+evInpersonTag(ev)+'<div class="card-meta">'+esc(ev.date)+' ／ '+esc(ev.type||"")+(ev.memo? ' ／ '+esc(ev.memo):'')+'</div><div style="margin-top:6px">'+evActions(ev)+'</div></div><span class="tag">'+esc(ev.type||"その他")+'</span></div>').join("") : '<div class="empty">登録されている予定はありません。</div>')
  + '</section>'
  + '<section class="panel"><h3>予定を追加</h3><div class="formgrid">'
  + '<div class="field"><label>日付</label><input id="evDate" type="date" value="'+today+'"></div>'
  + '<div class="field"><label>種類</label><select id="evType"><option>テスト</option><option>レポート締切</option><option>ゼミ説明会</option><option>授業</option><option>イベント</option><option>その他</option></select></div>'
  + '<div class="field" style="grid-column:1/-1"><label>タイトル</label><input id="evTitle" type="text" value="'+esc(calPresetTitle)+'" placeholder="例: 経営戦略論 中間テスト"></div>'
  + '<div class="field" style="grid-column:1/-1"><label>メモ（任意）</label><input id="evMemo" type="text" placeholder="例: 持ち込み可、教室棟201"></div>'
  + '</div><button class="btn" id="evSubmit">カレンダーに追加</button></section>';
  calPresetTitle = "";
  document.getElementById("calPrev").onclick=()=>{ calCursor = m===0? {y:y-1,m:11}:{y,m:m-1}; renderCalendar(); };
  document.getElementById("calNext").onclick=()=>{ calCursor = m===11? {y:y+1,m:0}:{y,m:m+1}; renderCalendar(); };
  $app.querySelectorAll("[data-cfmt]").forEach(b=>b.onclick=()=>{ calZemiFmt=b.dataset.cfmt; renderCalendar(); });
  $app.querySelectorAll("[data-day]").forEach(c=>c.onclick=()=>{ calSel=c.dataset.day; renderCalendar(); const p=document.getElementById("dayPanel"); if(p) p.scrollIntoView({behavior:"smooth", block:"start"}); });
  $app.querySelectorAll("[data-selday]").forEach(c=>c.onclick=()=>{ calSel=c.dataset.selday; renderCalendar(); const p=document.getElementById("dayPanel"); if(p) p.scrollIntoView({behavior:"smooth", block:"start"}); });
  document.getElementById("evSubmit").onclick=()=>{
    if(!requireUser()) return;
    const title = document.getElementById("evTitle").value.trim();
    const date = document.getElementById("evDate").value;
    if(!title || !date){ toast("日付とタイトルを入れてください"); return; }
    events.push({ id:"ev"+Date.now(), title, date, type:document.getElementById("evType").value, memo:document.getElementById("evMemo").value.trim(), by:user.name });
    save("bds_events", events); toast("カレンダーに追加しました"); renderCalendar();
  };
}

/* ---------- books ---------- */
const PLACES = ["吹田みらいキャンパス 正門前","吹田みらいキャンパス 学食・カフェ前","吹田みらいキャンパス 図書館前","吹田みらいキャンパス 教室棟前","JR岸辺駅","阪急正雀駅","応相談"];
function bookStatusLabel(s){ return s==="talk" ? "交渉中" : s==="done" ? "取引完了" : "募集中"; }
function renderBooks(){
  const list = books.filter(b=> bookFilter==="all" || b.type===bookFilter).slice().sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  $app.innerHTML =
  '<h2 class="sec"><span class="sec-en">TEXTBOOKS</span>教科書売買</h2>'
  + '<p class="sec-note">使い終わった教科書を売る／ほしい教科書を探す場所です。手渡しは学内が基本。連絡は各投稿の「連絡する」から（この端末内デモでは投稿に紐づくスレッドに残ります）。個人情報の公開には注意してください。</p>'
  + '<div class="quickchips" style="margin-bottom:14px">'+[["all","すべて"],["sell","売ります"],["buy","買います"]].map(([k,l])=>'<button class="qchip '+(bookFilter===k?"on":"")+'" data-bf="'+k+'">'+l+'</button>').join("")+'</div>'
  + '<section class="panel"><h3>投稿する</h3><div class="formgrid">'
  + '<div class="field"><label>種類</label><select id="bkType"><option value="sell">売ります（出品）</option><option value="buy">買います（募集）</option></select></div>'
  + '<div class="field"><label>価格（買いますの場合は希望価格）</label><input id="bkPrice" type="number" min="0" placeholder="例: 1500"></div>'
  + '<div class="field" style="grid-column:1/-1"><label>教科書名</label><input id="bkTitle" type="text" placeholder="例: ミクロ経済学入門 第3版"></div>'
  + '<div class="field"><label>関連する授業（任意）</label><input id="bkCourse" type="text" placeholder="例: ミクロ経済学"></div>'
  + '<div class="field"><label>状態（売りますの場合）</label><select id="bkCond"><option>新品同様</option><option>書き込みなし</option><option>書き込みあり</option><option>傷みあり</option><option>指定なし（買います）</option></select></div>'
  + '<div class="field"><label>手渡し場所</label><select id="bkPlace">'+PLACES.map(p=>'<option>'+p+'</option>').join("")+'</select></div>'
  + '<div class="field"><label>希望日時</label><input id="bkWhen" type="text" placeholder="例: 平日昼休み、来週中など"></div>'
  + '<div class="field" style="grid-column:1/-1"><label>メモ（任意）</label><input id="bkNote" type="text" placeholder="例: 第2版でも可、急ぎません"></div>'
  + '<div class="field" style="grid-column:1/-1"><label>連絡先（任意。LINE IDなど。公開されるので注意）</label><input id="bkContact" type="text" placeholder="空欄なら下の連絡スレッドでやり取り"></div>'
  + '</div><button class="btn" id="bkSubmit">投稿する</button></section>'
  + '<div id="bookList">'
  + (list.length ? list.map(bk=>{
      const mine = user && bk.by === user.name;
      const msgs = bk.msgs || [];
      return '<article class="bookcard">'
      + '<div class="book-main"><div><span class="tag '+(bk.type==="buy"?"buy":"sell")+'">'+(bk.type==="buy"?"買います":"売ります")+'</span> <strong>'+esc(bk.title)+'</strong> <span class="tag st-'+esc(bk.status||"open")+'">'+bookStatusLabel(bk.status||"open")+'</span>'
      + '<div class="card-meta">'+(bk.course? '授業: '+esc(bk.course)+' ／ ':'')+(bk.type==="buy" ? '希望の状態: '+esc(bk.cond==="新品同様" ? "指定なし" : (bk.cond||"指定なし")) : '状態: '+esc(bk.cond||"-"))+'<br>手渡し: '+esc(bk.place||"応相談")+(bk.when? ' ／ 希望: '+esc(bk.when):'')+(bk.note? '<br>'+esc(bk.note):'')+(bk.contact? '<br>連絡先: '+esc(bk.contact):'')+'<br><span class="dim">'+esc(bk.by||"")+'（'+esc(bk.grade||"")+'回生） ・ '+esc(bk.date||"")+'</span></div></div>'
      + '<div class="price">¥'+Number(bk.price||0).toLocaleString()+'</div></div>'
      + '<div class="book-actions"><button class="btn small ghost" data-thread="'+esc(bk.id)+'">連絡する（'+msgs.length+'）</button>'
      + (mine && bk.status!=="done" ? '<button class="btn small ghost" data-st="'+esc(bk.id)+'">状態を変更（'+(bk.status==="open"?"交渉中にする":"取引完了にする")+'）</button>' : '')
      + '</div>'
      + (openThreadId===bk.id ? '<div class="thread">'
        + (msgs.length ? msgs.map(mm=>'<div class="post"><p class="post-head">'+esc(mm.name)+' <span>'+esc(mm.at||"")+'</span></p><p>'+esc(mm.text)+'</p></div>').join("") : '<p class="note">まだ連絡はありません。手渡しの日時・場所の相談をここに書いてください。</p>')
        + '<div class="thread-form"><input id="thText" type="text" placeholder="例: はじめまして。購入したいです。明日昼休みに正門前でどうですか？"><button class="btn small" id="thSend">送信</button></div>'
        + '<p class="note">※ 現在はこの端末内だけのデモ表示です。全員で共有できる連絡機能はバックエンド化後の提供です。</p></div>' : '')
      + '</article>';
    }).join("") : '<div class="empty">まだ投稿がありません。最初の1件をどうぞ。</div>')
  + '</div>';
  $app.querySelectorAll("[data-bf]").forEach(b=>b.onclick=()=>{ bookFilter=b.dataset.bf; renderBooks(); });
  $app.querySelectorAll("[data-thread]").forEach(b=>b.onclick=()=>{ openThreadId = openThreadId===b.dataset.thread ? null : b.dataset.thread; renderBooks(); });
  $app.querySelectorAll("[data-st]").forEach(b=>b.onclick=()=>{
    const bk = books.find(x=>x.id===b.dataset.st); if(!bk) return;
    bk.status = bk.status==="open" ? "talk" : "done";
    save("bds_books", books); toast("状態を「"+bookStatusLabel(bk.status)+"」にしました"); renderBooks();
  });
  const thSend = document.getElementById("thSend");
  if(thSend) thSend.onclick=()=>{
    if(!requireUser()) return;
    const text = document.getElementById("thText").value.trim();
    if(!text){ toast("メッセージを書いてください"); return; }
    const bk = books.find(x=>x.id===openThreadId); if(!bk) return;
    bk.msgs = bk.msgs || [];
    bk.msgs.push({ name:user.name+"（"+user.grade+"回生）", text, at:todayStr() });
    save("bds_books", books); toast("連絡を書きました"); renderBooks();
  };
  document.getElementById("bkSubmit").onclick=()=>{
    if(!requireUser()) return;
    const title = document.getElementById("bkTitle").value.trim();
    if(!title){ toast("教科書名を入れてください"); return; }
    books.unshift({ id:"bk"+Date.now(), type:document.getElementById("bkType").value, title,
      price:+document.getElementById("bkPrice").value || 0,
      course:document.getElementById("bkCourse").value.trim(),
      cond:document.getElementById("bkCond").value,
      place:document.getElementById("bkPlace").value,
      when:document.getElementById("bkWhen").value.trim(),
      note:document.getElementById("bkNote").value.trim(),
      contact:document.getElementById("bkContact").value.trim(),
      by:user.name, grade:user.grade, date:todayStr(), status:"open", msgs:[], createdAt:Date.now() });
    save("bds_books", books); toast("投稿しました"); bookFilter="all"; renderBooks();
  };
}

/* ---------- board ---------- */
function renderBoard(){
  $app.innerHTML =
  '<h2 class="sec"><span class="sec-en">BOARD</span>掲示板</h2>'
  + '<p class="sec-note">質問・情報共有の場所です。「この先生の課題どう？」「ゼミ迷ってる」など、先輩のいない学部で先輩代わりになる場所を目指します。</p>'
  + '<section class="panel"><h3>投稿する</h3><div class="formgrid">'
  + '<div class="field"><label>カテゴリ</label><select id="bdCat"><option>質問</option><option>情報共有</option><option>雑談</option><option>お知らせ</option></select></div>'
  + '<div class="field"><label>タイトル</label><input id="bdTitle" type="text" placeholder="例: 統計学の課題、どこまでやりましたか"></div>'
  + '<div class="field" style="grid-column:1/-1"><label>本文</label><textarea id="bdBody" rows="3"></textarea></div>'
  + '</div><button class="btn" id="bdSubmit">投稿する</button></section>'
  + board.map(p=>'<article class="panel post-card"><p class="post-head"><span class="tag">'+esc(p.cat||"")+'</span> <strong>'+esc(p.title)+'</strong> <span>'+esc(p.by||"")+' ・ '+esc(p.date||"")+'</span></p><p class="pre">'+esc(p.body||"")+'</p></article>').join("");
  document.getElementById("bdSubmit").onclick=()=>{
    if(!requireUser()) return;
    const title = document.getElementById("bdTitle").value.trim();
    const body = document.getElementById("bdBody").value.trim();
    if(!title || !body){ toast("タイトルと本文を書いてください"); return; }
    board.unshift({ id:"bd"+Date.now(), cat:document.getElementById("bdCat").value, title, body, by:user.name+"（"+user.grade+"回生）", date:todayStr() });
    save("bds_board", board); toast("投稿しました"); renderBoard();
  };
}

/* ---------- reviews feed ---------- */
function renderReviews(){
  const all = [];
  COURSES.forEach(c=>{ (reviews[c.id]||[]).forEach(r=>all.push({c, r})); });
  all.sort((a,b)=>((b.r.date||"").localeCompare(a.r.date||"")));
  const ranked = COURSES.map(c=>({c, avg:avgStars(c), n:courseReviews(c).length})).filter(x=>x.n>=3 && x.avg!==null).sort((a,b)=>b.avg-a.avg).slice(0,5);
  $app.innerHTML =
  '<h2 class="sec"><span class="sec-en">REVIEWS</span>みんなの口コミ</h2>'
  + '<p class="sec-note">全授業の口コミの新着と、評価の高い授業です。受けた授業の口コミは、各授業のページから書けます。</p>'
  + (ranked.length ? '<section class="panel"><h3>評価の高い授業（口コミ3件以上）</h3>' + ranked.map(x=>'<div class="listrow"><div><a href="#/course/'+encodeURIComponent(x.c.name)+'/reviews"><strong>'+esc(x.c.name)+'</strong></a><div class="card-meta">'+esc(x.c.instructor)+' ／ 口コミ'+x.n+'件</div></div><span class="card-stars">'+stars(x.avg)+' '+x.avg.toFixed(1)+'</span></div>').join("") + '</section>' : '')
  + '<section class="panel"><h3>新着の口コミ</h3>'
  + (all.length ? all.slice(0,30).map(function(it){ const r=it.r, c=it.c; const o=+(r.overall || r.easy)||0; const dims=[["取りやすさ",r.easy],["充実度",r.rich],["課題の重さ",r.heavy]].filter(d=>+d[1]>0).map(d=>d[0]+" "+stars(+d[1])).join(" ／ "); return '<div class="post"><p class="post-head"><a href="#/course/'+encodeURIComponent(c.name)+'/reviews"><strong>'+esc(c.name)+'</strong></a>（'+esc(c.instructor)+'） <span class="revstars">'+stars(o)+'</span> 総合'+(o||"-")+(dims? ' ／ '+dims : '')+' <span>'+esc(r.by||"")+' ・ '+esc(r.date||"")+'</span></p><p>'+esc(r.body||"")+'</p></div>'; }).join("") : '<div class="empty">まだ口コミがありません。授業ページから最初の1件を書いてください。</div>')
  + '</section>';
}

/* ---------- mypage (candidates) ---------- */
function mypageTop(){
  const prof = user
    ? '<section class="panel"><h3>登録情報</h3><p><strong>'+esc(user.name)+'</strong> ／ '+esc(user.grade)+'回生 ／ '+esc(user.fac || "")+'<br>入学年度: '+(user.enrollYear ? user.enrollYear+"年" : "未登録")+' ／ 卒業年度: '+(user.gradYear ? user.gradYear+"年（"+(+user.gradYear-2000)+"卒）" : "未登録")+'</p><button class="btn small ghost" id="editProf">登録を変更</button></section>'
    : '<section class="panel"><h3>登録情報</h3><p>まだ登録していません。</p><button class="btn small" id="editProf">学生登録</button></section>';
  const rows = clicks.slice(-50).reverse().map(function(c){
    return '<div class="listrow"><div><strong>'+esc(c.label || c.url || "")+'</strong><div class="card-meta">'+esc((c.t || "").replace("T", " ").slice(0, 16))+' ／ '+(c.u ? esc(c.u.n)+"（"+(c.u.gy ? (+c.u.gy-2000)+"卒" : "?")+"）" : "未登録")+'</div></div></div>';
  }).join("");
  const clickHtml = '<section class="panel"><h3>リンククリック履歴（送客の成果確認用）</h3>'
  + '<p class="note">このサイト内のリンク（ゼミ資料など）をクリックした記録です。将来ここに就活イベント情報を載せたとき、「誰がどのリンクから行ったか」を後から確認するための土台です。<strong>今はこの端末の中だけに保存</strong>されていて、みんなの記録を1か所に集めるには共有の仕組み（バックエンド）が必要です。</p>'
  + (clicks.length ? rows + '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn small" id="copyClicks">履歴をコピー（表計算に貼れます）</button><button class="btn small ghost" id="clearClicks">履歴を消す</button></div>' : '<div class="empty">まだ記録がありません。</div>')
  + '</section>';
  return prof + clickHtml;
}
function renderMypage(){
  const list = candidates.map(id=>COURSES.find(c=>c.id===id)).filter(Boolean);
  const absList = Object.keys(absences).map(id=>COURSES.find(c=>c.id===id)).filter(Boolean);
  const absHtml = '<h2 class="sec"><span class="sec-en">ATTENDANCE</span>欠席カウンター</h2>'
  + (absList.length ? '<section class="panel">' + absList.map(c=>'<div class="listrow"><div><a href="#/course/'+encodeURIComponent(c.name)+'"><strong>'+esc(c.name)+'</strong></a><div class="card-meta">'+esc(c.instructor)+' ／ '+esc(c.term||"")+' '+esc(c.schedule||"")+'</div></div><span class="abscount small">'+absences[c.id]+'回</span>'+(absences[c.id]>=3 ? '<span class="tag warn">注意</span>' : '')+'</div>').join("") + '<p class="note">目安: 5回休むと単位が危ないことが多いです。カウントは各授業ページでできます。</p></section>' : '<div class="empty">まだ登録がありません。授業ページの「欠席カウンター」から履修中の授業を登録してください。</div>');
  $app.innerHTML = mypageTop() + absHtml +
  '<h2 class="sec"><span class="sec-en">MY LIST</span>履修候補リスト</h2>'
  + '<p class="sec-note">授業ページで「履修候補に入れる」を押した授業がここにたまります。単位とテスト傾向の目安にどうぞ。</p>'
  + (list.length ? '<section class="panel">'
    + list.map(c=>'<div class="listrow"><div><a href="#/course/'+encodeURIComponent(c.name)+'"><strong>'+esc(c.name)+'</strong></a><div class="card-meta">'+esc(c.instructor)+' ／ '+esc(c.term||"")+' '+esc(c.schedule||"")+' ／ '+esc(c.credits||"")+'単位 ／ テスト'+(c.cats.test||0)+'%</div></div><button class="btn small ghost" data-rm="'+esc(c.id)+'">外す</button></div>').join("")
    + '<p style="margin-top:10px">合計 <strong>'+list.reduce((s,c)=>s+(+c.credits||0),0)+'単位</strong> ／ テスト100%の授業 '+list.filter(c=>(c.cats.test||0)>=100).length+'件 ／ 定期テストなし '+list.filter(c=>(c.cats.test||0)===0).length+'件</p>'
    + '<p class="note">時間割としての重なりチェックは今後の課題です。</p></section>'
    : '<div class="empty">まだ候補がありません。<a href="#/courses">授業を探す</a>から気になる授業を入れてください。</div>');
  $app.querySelectorAll("[data-rm]").forEach(b=>b.onclick=()=>{ candidates = candidates.filter(x=>x!==b.dataset.rm); save("bds_candidates", candidates); renderMypage(); });
  const ep = document.getElementById("editProf"); if(ep) ep.onclick = function(){ showGate(); };
  const cc = document.getElementById("copyClicks"); if(cc) cc.onclick = function(){ const tsv = clicks.map(function(c){ return [(c.t || "").slice(0, 10), c.u ? c.u.n : "", c.u ? c.u.gy : "", c.label || "", c.url || ""].join("\t"); }).join("\n"); if(navigator.clipboard) navigator.clipboard.writeText(tsv).then(function(){ toast("コピーしました"); }); };
  const cl = document.getElementById("clearClicks"); if(cl) cl.onclick = function(){ clicks = []; save("bds_clicks", clicks); renderMypage(); };
}

/* ---------- init ---------- */
document.querySelectorAll("[data-nav]").forEach(b=>{
  if(b.classList.contains("brand")) return;
  b.addEventListener("click", ()=>{ navTo(b.dataset.nav==="home" ? "#/" : "#/"+b.dataset.nav); });
});
renderUserbox();
route();
