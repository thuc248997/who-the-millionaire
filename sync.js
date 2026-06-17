/* ──────────────────────────────────────────────────────────────────────
   Sync — đồng bộ trạng thái real-time giữa các màn hình (game / score / admin).
   Dùng chung cho cả hai chế độ triển khai:

   • Ghi  : luôn qua HTTP POST /api/state (hoạt động cả LAN lẫn serverless).
            Server là nguồn sự thật — mọi thay đổi được áp tuần tự trên
            event loop, điểm số cập nhật theo DELTA nên hai người ghi đồng
            thời không bao giờ mất dữ liệu của nhau (không race condition).
   • Nhận : WebSocket push (server.js trên LAN — tức thì) → tự fallback
            sang polling ngắn (Vercel serverless, không có WS server).
   ────────────────────────────────────────────────────────────────────── */
const Sync = (() => {
  let cfg = {};
  let ws = null, wsEverOpened = false, wsFail = 0;
  let statePoll = null, qPoll = null;
  let lastV = null, lastQJson = null;
  let mode = 'connecting';            // 'ws' | 'poll' | 'connecting'

  function init(options){
    cfg = options;                    // {role, onState, onQuestions?, onPresence?, onMode?}
    refresh();
    connectWS();
  }

  function setMode(m){ if(mode !== m){ mode = m; cfg.onMode && cfg.onMode(m); } }

  /* chỉ áp bản MỚI HƠN — WS broadcast và phản hồi POST có thể về đan xen */
  function accept(st){
    if(!st || typeof st.v !== 'number') return;
    if(lastV !== null && st.v <= lastV) return;
    lastV = st.v;
    cfg.onState && cfg.onState(st);
  }

  async function refresh(){
    try{
      const res = await fetch('/api/state', {cache:'no-store'});
      if(res.ok) accept(await res.json());
    }catch{}
  }

  /* tải câu hỏi lần đầu (mồi lastQJson để về sau chỉ báo khi THAY ĐỔI) */
  async function loadQuestions(){
    try{
      const res = await fetch('/api/questions', {cache:'no-store'});
      if(!res.ok) return null;
      const txt = await res.text();
      lastQJson = txt;
      return JSON.parse(txt);
    }catch{ return null; }
  }

  async function checkQuestions(){
    try{
      const res = await fetch('/api/questions', {cache:'no-store'});
      if(!res.ok) return;
      const txt = await res.text();
      if(txt === lastQJson) return;
      const changed = lastQJson !== null;
      lastQJson = txt;
      if(changed && cfg.onQuestions) cfg.onQuestions(JSON.parse(txt));
    }catch{}
  }

  /* ── WebSocket (LAN qua server.js) ─────────────────────── */
  function connectWS(){
    // Vercel serverless không có WS server — bỏ qua, dùng polling ngay
    if(typeof location !== 'undefined' &&
       (location.hostname.endsWith('.vercel.app') || location.hostname.endsWith('.vercel.sh'))){
      startPolling(); return;
    }
    let opened = false, s;
    try{
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      s = ws = new WebSocket(`${proto}//${location.host}`);
    }catch{ startPolling(); return; }
    s.onopen = () => {
      opened = true; wsEverOpened = true; wsFail = 0;
      stopPolling(); setMode('ws');
      s.send(JSON.stringify({type:'identify', role: cfg.role}));
      refresh();                       // bắt kịp thay đổi lỡ mất lúc đứt kết nối
    };
    s.onmessage = e => {
      try{
        const msg = JSON.parse(e.data);
        if(msg.type === 'state') accept(msg);
        else if(msg.type === 'questions_updated') checkQuestions();
        else if(msg.type === 'presence'){ cfg.onPresence && cfg.onPresence(msg.counts || {}); }
      }catch{}
    };
    s.onclose = () => {
      if(!opened) wsFail++;
      if(!wsEverOpened && wsFail >= 2){ startPolling(); return; }  // serverless: không có WS server
      setMode('connecting');
      setTimeout(connectWS, 3000);
    };
    s.onerror = () => { try{ s.close(); }catch{} };
  }

  /* ── Polling (fallback cho serverless) ─────────────────── */
  function startPolling(){
    if(statePoll) return;
    setMode('poll');
    statePoll = setInterval(refresh, 2000);
    if(cfg.onQuestions && !qPoll) qPoll = setInterval(checkQuestions, 8000);
  }
  function stopPolling(){
    if(statePoll){ clearInterval(statePoll); statePoll = null; }
    if(qPoll){ clearInterval(qPoll); qPoll = null; }
  }

  /* ── Ghi trạng thái — kind: 'flow' | 'scores:set' | 'adjust' ──
     POST trả về trạng thái mới → người ghi nhận phản hồi tức thì
     kể cả trên serverless (nơi không có kênh push). */
  async function push(kind, payload){
    try{
      const res = await fetch('/api/state', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({kind, ...payload}),
      });
      if(!res.ok) throw new Error('HTTP '+res.status);
      accept(await res.json().catch(()=>null));
      return true;
    }catch{ return false; }
  }

  return { init, push, refresh, loadQuestions, get mode(){ return mode; } };
})();

/* ──────────────────────────────────────────────────────────────────────
   Quy tắc chấm điểm dùng chung (game.html + score.html).
   marks: mảng 'ok'|'ng'|'no'|null theo chỉ số đội. Trả về deltas thô —
   server cộng delta và tự kẹp điểm về >= 0 (nguồn sự thật duy nhất).
   ────────────────────────────────────────────────────────────────────── */
function computeScoreDeltas(flow, marks){
  const deltas = [0,0,0,0,0];
  if(!flow || !flow.round) return deltas;
  marks.forEach((r,i)=>{
    if(!r) return;
    if(flow.round === 1){
      if(r==='ok') deltas[i] += 10;
    } else if(flow.round === 2){
      const pts = (flow.q && flow.q.pts) || 0;
      if(r==='ok') deltas[i] += pts;
      else deltas[i] -= Math.floor(pts*0.5);          // sai HOẶC bỏ: −50% điểm câu
    } else if(flow.round === 3){
      const r3 = flow.r3 || {};
      if(!r3.diff || !Array.isArray(r3.order)) return;
      const ti  = r3.order[r3.teamIdx];
      const tgt = (r3.transfer === undefined) ? null : r3.transfer;
      if(tgt === null){
        if(i !== ti) return;
        if(r==='ok') deltas[i] += r3.nhanBan ? r3.diff*2 : r3.diff;
        else if(r==='ng') deltas[i] -= r3.diff;
      } else {
        if(i !== tgt) return;
        if(r==='ok'){ deltas[tgt] += r3.diff*2; deltas[ti] -= r3.diff; }
        else if(r==='ng'){ deltas[tgt] -= r3.diff; }
      }
    }
  });
  return deltas;
}

/* Đội nào đang được chấm ở câu hiện tại */
function scorableTeams(flow){
  if(!flow || !flow.round || !Array.isArray(flow.teams)) return [];
  if(flow.round !== 3) return flow.teams.map((_,i)=>i);
  const r3 = flow.r3 || {};
  if(!r3.diff || !Array.isArray(r3.order)) return [];
  const tgt = (r3.transfer === undefined) ? null : r3.transfer;
  return [tgt !== null ? tgt : r3.order[r3.teamIdx]];
}
