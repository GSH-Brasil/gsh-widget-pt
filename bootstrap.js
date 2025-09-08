/* GSH Professor Virtual - bootstrap.js
   Carregue este arquivo via jsDelivr no “Body end” do Website Builder.
   O app aparece onde existir <div id="gsh-gpt-widget"></div> na página.
*/
(function(){
  // evita rodar duas vezes se o Builder injetar em mais páginas
  if (window.__GSH_BOOTSTRAP_LOADED__) return;
  window.__GSH_BOOTSTRAP_LOADED__ = true;

  const CONFIG = {
    BACKEND_BASE_URL: "https://misty-tree-121b.rgermano-wup.workers.dev", // sua URL do Worker
    CHAT_MODEL: "gpt-5-mini",
    TTS_VOICE: "alloy",
    TTS_FORMAT: "mp3",
    STT_MODEL: "whisper-1",
    MAX_IX: 15,
    MAX_MS: 10 * 60 * 1000 // 10 minutos
  };

  function onReady(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  onReady(init);

  function init(){
    const mount = document.getElementById('gsh-gpt-widget');
    if(!mount) return;                // página sem contêiner: não faz nada
    if(mount.dataset.initialized) return;
    mount.dataset.initialized = '1';

    injectStyles();
    mount.innerHTML = widgetHTML();
    wireUp(mount);
  }

  // ===== CSS inline (injetado no <head>) =====
  function injectStyles(){
    if(document.getElementById('gsh-widget-style')) return;
    const css = `
:root{--bg:#0b1020;--card:#121833;--ink:#e8ecff;--muted:#a6b0d6;--accent:#5da0ff}
.gsh-wrap{max-width:760px;margin:24px auto;padding:16px;color:var(--ink);font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Helvetica Neue,Arial}
.gsh-card{background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:18px;box-shadow:0 10px 30px rgba(0,0,0,.25);overflow:hidden;background:var(--bg)}
.gsh-header{padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;justify-content:space-between;gap:10px}
.gsh-left{display:flex;align-items:center;gap:10px}
.gsh-dot{width:10px;height:10px;background:linear-gradient(45deg,#82ffd2,#5da0ff);border-radius:50%;box-shadow:0 0 12px #5da0ff}
.gsh-title{font-weight:700;letter-spacing:.2px}
.gsh-pill{font-size:12px;padding:6px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:#121a3f}
.gsh-usage{display:flex;gap:8px;align-items:center;font-size:12px;color:var(--muted)}
.gsh-row{display:flex;gap:8px}
.gsh-bar{width:140px;height:8px;background:#0f1530;border:1px solid rgba(255,255,255,.12);border-radius:999px;overflow:hidden}
.gsh-fill{height:100%;background:#5da0ff;width:0%}
.gsh-messages{height:420px;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;scroll-behavior:smooth}
.gsh-msg{padding:10px 12px;border-radius:14px;line-height:1.45;white-space:pre-wrap}
.gsh-msg.user{align-self:flex-end;background:rgba(93,160,255,.15);border:1px solid rgba(93,160,255,.35)}
.gsh-msg.bot{align-self:flex-start;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15)}
.gsh-controls{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(255,255,255,.07)}
.gsh-input{flex:1;background:#0f1530;color:var(--ink);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px 12px;outline:none}
.gsh-btn{background:#1a2453;color:var(--ink);border:1px solid rgba(255,255,255,.15);border-radius:12px;padding:10px 14px;cursor:pointer}
.gsh-btn:hover{background:#21306c}
.gsh-tiny{font-size:12px;color:var(--muted);padding:0 12px 10px}
.gsh-audio{display:flex;gap:6px;align-items:center}
    `;
    const style = document.createElement('style');
    style.id = 'gsh-widget-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ===== HTML da UI =====
  function widgetHTML(){
    return `
<div class="gsh-wrap">
  <div class="gsh-card">
    <div class="gsh-header">
      <div class="gsh-left">
        <div class="gsh-dot"></div>
        <div class="gsh-title">GSH – Professor Virtual (Inglês)</div>
        <span class="gsh-pill" id="gsh-status">pronto</span>
      </div>
      <div class="gsh-usage" id="gsh-usageBox" style="display:none;">
        <div>Left today:</div>
        <div class="gsh-row" style="gap:12px;align-items:center;">
          <div title="interactions left"><div class="gsh-bar"><div id="gsh-barIx" class="gsh-fill"></div></div></div>
          <div id="gsh-ixText">15 interactions</div>
          <div title="minutes left"><div class="gsh-bar"><div id="gsh-barMin" class="gsh-fill"></div></div></div>
          <div id="gsh-minText">10 min</div>
          <div id="gsh-resetText" class="gsh-pill" title="Resets exactly 24h after first use">resets in 24h</div>
        </div>
      </div>
    </div>

    <div id="gsh-auth" style="padding:16px;display:none;gap:12px;flex-direction:column;">
      <div class="gsh-tiny">Faça login com seu e-mail da escola para usar o professor virtual.</div>
      <div class="gsh-row" style="flex-wrap:wrap;gap:12px;align-items:flex-end;">
        <div style="display:flex;flex-direction:column;gap:6px;min-width:260px;">
          <label for="gsh-email">Email</label>
          <input id="gsh-email" type="text" placeholder="aluno@globalspeak.email ou admin@globalspeak.online" class="gsh-input"/>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;min-width:200px;">
          <label for="gsh-pass">Senha</label>
          <input id="gsh-pass" type="password" placeholder="sua senha" class="gsh-input"/>
        </div>
        <button id="gsh-login" class="gsh-btn">Entrar</button>
      </div>
      <div class="gsh-tiny">Admins: <code>@globalspeak.online</code>. Alunos: <code>@globalspeak.email</code>.</div>
    </div>

    <div id="gsh-admin" style="display:none;padding:16px;border-bottom:1px solid rgba(255,255,255,.07);">
      <div class="gsh-row" style="justify-content:space-between;align-items:center;">
        <div class="gsh-title" style="font-size:14px;">Painel do Admin</div>
        <button id="gsh-logoutA" class="gsh-btn">Logout</button>
      </div>
      <div class="gsh-tiny">Adicionar/Remover alunos (domínio <code>@globalspeak.email</code>).</div>
      <div class="gsh-row" style="flex-wrap:wrap;gap:8px;margin-top:8px;">
        <input id="gsh-newEmail" type="text" placeholder="novoaluno@globalspeak.email" class="gsh-input"/>
        <input id="gsh-newPass" type="text" placeholder="senha do aluno" class="gsh-input"/>
        <button id="gsh-add" class="gsh-btn">+ Adicionar aluno</button>
      </div>
      <div class="gsh-row" style="flex-wrap:wrap;gap:8px;margin-top:8px;">
        <input id="gsh-delEmail" type="text" placeholder="aluno@globalspeak.email" class="gsh-input"/>
        <button id="gsh-del" class="gsh-btn">– Remover aluno</button>
      </div>
      <div id="gsh-adminMsg" class="gsh-tiny" style="margin-top:8px;"></div>
    </div>

    <div id="gsh-chat" style="display:none;">
      <div id="gsh-messages" class="gsh-messages"></div>
      <div class="gsh-tiny">Tip: You can type or record in Spanish/Portuguese; the teacher will ALWAYS reply in ENGLISH with grammar fixes and a pronunciation tip.</div>
      <div class="gsh-controls">
        <input id="gsh-text" type="text" placeholder="Type your question..." class="gsh-input"/>
        <div class="gsh-row">
          <button id="gsh-mic" class="gsh-btn">🎙️ Record</button>
          <button id="gsh-send" class="gsh-btn">Send</button>
        </div>
      </div>
      <div class="gsh-controls" style="justify-content:space-between;">
        <label class="gsh-audio"><input type="checkbox" id="gsh-playAudio" checked> Play audio reply</label>
        <div class="gsh-row">
          <button id="gsh-stop" class="gsh-btn">⏹️ Stop audio</button>
          <button id="gsh-clear" class="gsh-btn">🧹 Clear</button>
          <button id="gsh-logoutU" class="gsh-btn">Logout</button>
        </div>
      </div>
    </div>
  </div>
</div>
<audio id="gsh-tts" preload="auto"></audio>`;
  }

  // ===== Lógica / eventos =====
  function wireUp(root){
    const $ = sel => root.querySelector(sel);

    // refs UI
    const $status = $('#gsh-status');
    const $usageBox = $('#gsh-usageBox');
    const $barIx = $('#gsh-barIx');
    const $barMin = $('#gsh-barMin');
    const $ixText = $('#gsh-ixText');
    const $minText = $('#gsh-minText');
    const $resetText = $('#gsh-resetText');

    const $auth = $('#gsh-auth');
    const $admin = $('#gsh-admin');
    const $chat = $('#gsh-chat');

    const $email = $('#gsh-email');
    const $pass = $('#gsh-pass');
    const $login = $('#gsh-login');
    const $logoutA = $('#gsh-logoutA');
    const $logoutU = $('#gsh-logoutU');

    const $newEmail = $('#gsh-newEmail');
    const $newPass = $('#gsh-newPass');
    const $add = $('#gsh-add');
    const $delEmail = $('#gsh-delEmail');
    const $del = $('#gsh-del');
    const $adminMsg = $('#gsh-adminMsg');

    const $messages = $('#gsh-messages');
    const $text = $('#gsh-text');
    const $send = $('#gsh-send');
    const $mic = $('#gsh-mic');
    const $clear = $('#gsh-clear');
    const $playAudio = $('#gsh-playAudio');
    const $stop = $('#gsh-stop');
    const $tts = $('#gsh-tts');

    let session = null; // { token, role, email }

    // helpers
    function setStatus(s){ $status.textContent = s; }
    function addMessage(text, who){
      const div = document.createElement('div');
      div.className = `gsh-msg ${who}`;
      div.textContent = text;
      $messages.appendChild(div);
      $messages.scrollTop = $messages.scrollHeight;
    }
    function show(view){
      $auth.style.display = 'none';
      $admin.style.display = 'none';
      $chat.style.display = 'none';
      if(view==='auth') $auth.style.display = 'flex';
      if(view==='admin') { $admin.style.display = 'block'; $usageBox.style.display = 'none'; }
      if(view==='chat') { $chat.style.display = 'block'; $usageBox.style.display = 'flex'; fetchUsage(); }
    }
    function authHeader(){ return session? { 'Authorization': `Bearer ${session.token}` } : {}; }

    // ===== Uso/limites =====
    async function fetchUsage(){
      try{
        const r = await fetch(`${CONFIG.BACKEND_BASE_URL}/usage`, { headers: { ...authHeader() } });
        const data = await r.json();
        if(!r.ok) throw new Error(data.error || 'usage error');

        const ixLeft = Math.max(0, CONFIG.MAX_IX - (data.interactions || 0));
        const msLeft = Math.max(0, CONFIG.MAX_MS - (data.used_ms || 0));
        const minLeft = Math.floor(msLeft / 60000);
        const pctIx = (ixLeft / CONFIG.MAX_IX) * 100;
        const pctMin = (msLeft / CONFIG.MAX_MS) * 100;

        $barIx.style.width = `${pctIx}%`;
        $barMin.style.width = `${pctMin}%`;
        $ixText.textContent = `${ixLeft} interactions`;
        $minText.textContent = `${minLeft} min`;

        if(data.resetAt){
          const t = new Date(data.resetAt);
          const diff = Math.max(0, t.getTime() - Date.now());
          const h = Math.floor(diff/3600000), m = Math.floor((diff%3600000)/60000);
          const when = t.toLocaleString(undefined, { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' });
          $resetText.textContent = `resets in ${h}h ${m}m • at ${when}`;
        }
      }catch(e){ console.warn('usage', e); }
    }

    // ===== Auth =====
    async function login(){
      const email = $email.value.trim();
      const password = $pass.value;
      if(!email || !password) return alert('Preencha email e senha.');
      setStatus('autenticando...');
      const r = await fetch(`${CONFIG.BACKEND_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email, password })
      });
      const data = await r.json();
      if(!r.ok){ setStatus('erro'); return alert(data.error || 'Falha no login'); }
      session = { token: data.token, role: data.role, email: data.email };
      localStorage.setItem('gsh_session', JSON.stringify(session));
      setStatus('pronto');
      show(session.role === 'admin' ? 'admin' : 'chat');
    }

    async function logout(){
      if(session){
        try { await fetch(`${CONFIG.BACKEND_BASE_URL}/auth/logout`, { method:'POST', headers:{...authHeader()} }); } catch {}
      }
      session = null;
      localStorage.removeItem('gsh_session');
      show('auth');
    }

    $login.addEventListener('click', login);
    $logoutA.addEventListener('click', logout);
    $logoutU.addEventListener('click', logout);

    // restaurar sessão, se existir
    try{
      const s = JSON.parse(localStorage.getItem('gsh_session'));
      if(s){ session = s; show(s.role === 'admin' ? 'admin' : 'chat'); }
      else { show('auth'); }
    }catch{ show('auth'); }

    // ===== Ações do Admin =====
    $add.addEventListener('click', async ()=>{
      const email = $newEmail.value.trim();
      const password = $newPass.value;
      if(!email || !password) return alert('Informe email e senha do aluno.');
      const r = await fetch(`${CONFIG.BACKEND_BASE_URL}/admin/addUser`, {
        method:'POST',
        headers:{ ...authHeader(), 'Content-Type':'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await r.json();
      $adminMsg.textContent = data.ok ? `Aluno ${email} adicionado.` : (data.error || 'Erro');
    });

    $del.addEventListener('click', async ()=>{
      const email = $delEmail.value.trim();
      if(!email) return alert('Informe o email do aluno.');
      const r = await fetch(`${CONFIG.BACKEND_BASE_URL}/admin/deleteUser`, {
        method:'POST',
        headers:{ ...authHeader(), 'Content-Type':'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await r.json();
      $adminMsg.textContent = data.ok ? `Aluno ${email} removido.` : (data.error || 'Erro');
    });

    // ===== Chat / STT / TTS =====
    async function transcribe(blob){
      setStatus('transcrevendo...');
      const form = new FormData();
      form.append('file', blob, 'audio.webm');
      form.append('model', CONFIG.STT_MODEL);
      const r = await fetch(`${CONFIG.BACKEND_BASE_URL}/stt`, {
        method:'POST',
        headers:{ ...authHeader() },
        body: form
      });
      if(!r.ok){
        const e = await r.json().catch(()=>({}));
        throw new Error(e.error || 'Falha na transcrição');
      }
      const data = await r.json();
      setStatus('pronto');
      await fetchUsage();
      return data.text;
    }

    async function chat(prompt){
      setStatus('pensando...');
      const r = await fetch(`${CONFIG.BACKEND_BASE_URL}/chat`, {
        method:'POST',
        headers:{ ...authHeader(), 'Content-Type':'application/json' },
        body: JSON.stringify({
          model: CONFIG.CHAT_MODEL,
          messages: [
            { role:'system', content: `You are Global Speak Hub's virtual English teacher. Always reply 100% in ENGLISH only (text and audio), even if the student's input is in Spanish or Portuguese. Your job on every turn: (1) answer the question clearly and naturally in English; (2) correct the student's grammar and spelling with 1–2 short examples in English; (3) give a quick pronunciation tip in English (IPA optional); (4) if the student uses Spanish/Portuguese, you may briefly restate what they asked in English before answering. Keep replies concise and friendly for Latin American learners.` },
            { role:'user', content: prompt }
          ]
        })
      });
      const data = await r.json();
      if(!r.ok) throw new Error(data.error || 'Falha no chat');
      setStatus('pronto');
      await fetchUsage();
      return data.reply;
    }

    async function tts(text){
      setStatus('gerando áudio...');
      const r = await fetch(`${CONFIG.BACKEND_BASE_URL}/tts`, {
        method:'POST',
        headers:{ ...authHeader(), 'Content-Type':'application/json' },
        body: JSON.stringify({ voice: CONFIG.TTS_VOICE, format: CONFIG.TTS_FORMAT, input: text })
      });
      if(!r.ok){
        const e = await r.text();
        throw new Error(e || 'Falha no TTS');
      }
      const arrayBuf = await r.arrayBuffer();
      setStatus('pronto');
      await fetchUsage();
      return new Blob([arrayBuf], { type: `audio/${CONFIG.TTS_FORMAT}` });
    }

    async function handleSend(text){
      if(!text) return;
      addMessage(text, 'user');
      $text.value = '';
      try{
        const answer = await chat(text);
        addMessage(answer, 'bot');
        if($playAudio.checked){
          try{
            const audioBlob = await tts(answer);
            const url = URL.createObjectURL(audioBlob);
            $tts.src = url;
            await $tts.play();
          }catch(e){ console.error(e); }
        }
      }catch(err){
        setStatus('erro');
        addMessage('⚠️ ' + err.message, 'bot');
      }
    }

    $send.addEventListener('click', ()=> handleSend($text.value.trim()));
    $text.addEventListener('keydown', e=>{ if(e.key==='Enter') handleSend($text.value.trim()); });
    $stop.addEventListener('click', ()=>{ try{ $tts.pause(); $tts.currentTime=0; }catch{} });
    $clear.addEventListener('click', ()=>{ $messages.innerHTML=''; });

    // Gravação de áudio (MediaRecorder)
    let recording = false, mediaRecorder, chunks = [];
    $mic.addEventListener('click', async ()=>{
      if(!recording){
        try{
          const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
          chunks = [];
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.ondataavailable = e => chunks.push(e.data);
          mediaRecorder.onstop = async ()=>{
            const blob = new Blob(chunks, { type:'audio/webm' });
            try{
              const text = await transcribe(blob);
              addMessage(`(voice) ${text}`, 'user');
              await handleSend(text);
            }catch(err){
              addMessage('⚠️ ' + err.message, 'bot');
            }
          };
          mediaRecorder.start();
          recording = true;
          $mic.textContent = '⏹️ Stop';
          setStatus('gravando...');
        }catch(err){
          alert('Permita o microfone para gravar.');
        }
      } else {
        mediaRecorder.stop();
        recording = false;
        $mic.textContent = '🎙️ Record';
        setStatus('processando...');
      }
    });
  }
})();

