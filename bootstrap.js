/* GSH Virtual Teacher — PT-BR bootstrap (self-mounting, with logs) */
(function(){
  if (window.__GSH_BOOTSTRAP_LOADED__) {
    console.log("[GSH bootstrap] já carregado — ignorando");
    return;
  }
  window.__GSH_BOOTSTRAP_LOADED__ = true;
  window.__GSH_BOOTSTRAP_STAGE__ = "start";

  const CONFIG = {
    // 🔧 Troque para a URL do NOVO Worker PT quando ele estiver publicado:
    // Ex.: "https://conexao-brasil-app.seu-subdominio.workers.dev"
    BACKEND_BASE_URL: "https://misty-tree-121b.rgermano-wup.workers.dev",
    CHAT_MODEL: "gpt-4o-mini",
    TTS_VOICE: "alloy",
    TTS_FORMAT: "mp3",
    STT_MODEL: "whisper-1",
    MAX_IX: 15,
    MAX_MS: 10 * 60 * 1000
  };

  function log(...a){ try{ console.log("[GSH bootstrap]", ...a); }catch{} }

  function onReady(fn){
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  // Tenta achar/criar #gsh-gpt-widget por até ~8s
  function waitForMount(maxMs=8000){
    return new Promise(resolve=>{
      let mount = document.getElementById("gsh-gpt-widget");
      if (mount) return resolve(mount);

      const start = Date.now();
      const tryMake = ()=>{
        let m = document.getElementById("gsh-gpt-widget");
        if (!m) {
          m = document.createElement("div");
          m.id = "gsh-gpt-widget";
          const footer = document.querySelector('footer, #footer, .footer, .site-footer, [class*="footer"], [id*="footer"]');
          if (footer && footer.parentNode) footer.parentNode.insertBefore(m, footer);
          else (document.querySelector('main, #main, .site-content, .content, [role="main"]') || document.body).appendChild(m);
          log("mount created");
        }
        if (document.body.contains(m)) return resolve(m);
        if (Date.now() - start < maxMs) return setTimeout(tryMake, 40);
        resolve(m);
      };
      tryMake();
    });
  }

  function injectStyles(){
    if (document.getElementById("gsh-widget-style")) return;
    const css = `
:root{--bg:#0b1020;--ink:#e8ecff;--muted:#a6b0d6}
.gsh-wrap{max-width:760px;margin:24px auto;padding:16px;color:var(--ink);font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Helvetica Neue,Arial}
.gsh-card{background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:18px;box-shadow:0 10px 30px rgba(0,0,0,.25);overflow:hidden;background:#0b1020}
.gsh-header{padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;justify-content:space-between;gap:10px}
.gsh-left{display:flex;align-items:center;gap:10px}
.gsh-dot{width:10px;height:10px;background:linear-gradient(45deg,#82ffd2,#5da0ff);border-radius:50%}
.gsh-title{font-weight:700;letter-spacing:.2px}
.gsh-pill{font-size:12px;padding:6px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:#121a3f}
.gsh-usage{display:flex;gap:8px;align-items:center;font-size:12px;color:var(--muted)}
.gsh-row{display:flex;gap:8px;align-items:center}
.gsh-bar{width:140px;height:8px;background:#0f1530;border:1px solid rgba(255,255,255,.12);border-radius:999px;overflow:hidden}
.gsh-fill{height:100%;background:#5da0ff;width:0%}
.gsh-messages{height:420px;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;scroll-behavior:smooth}
.gsh-msg{padding:10px 12px;border-radius:14px;line-height:1.45;white-space:pre-wrap}
.gsh-msg.user{align-self:flex-end;background:rgba(93,160,255,.15);border:1px solid rgba(93,160,255,.35)}
.gsh-msg.bot{align-self:flex-start;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15)}
.gsh-controls{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(255,255,255,.07)}
.gsh-input{flex:1;background:#0f1530;color:var(--ink);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px}
.gsh-btn{background:#1a2453;color:var(--ink);border:1px solid rgba(255,255,255,.15);border-radius:12px;padding:10px 14px;cursor:pointer}
.gsh-btn:hover{background:#21306c}
.gsh-tiny{font-size:12px;color:var(--muted);padding:0 12px 10px}
.gsh-audio{display:flex;gap:6px;align-items:center}`;
    const style = document.createElement("style");
    style.id = "gsh-widget-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function widgetHTML(){
    return `
<div class="gsh-wrap">
  <div class="gsh-card">
    <div class="gsh-header">
      <div class="gsh-left">
        <div class="gsh-dot"></div>
        <div class="gsh-title">Conexão Brasil – Globy</div>
        <span class="gsh-pill" id="gsh-status">Pronto</span>
      </div>
      <div class="gsh-usage" id="gsh-usageBox" style="display:none;">
        <div>Hoje resta:</div>
        <div class="gsh-row" style="gap:12px">
          <div title="interações restantes"><div class="gsh-bar"><div id="gsh-barIx" class="gsh-fill"></div></div></div>
          <div id="gsh-ixText">15 interações</div>
          <div title="minutos restantes"><div class="gsh-bar"><div id="gsh-barMin" class="gsh-fill"></div></div></div>
          <div id="gsh-minText">10 min</div>
          <div id="gsh-resetText" class="gsh-pill" title="Reinicia exatamente 24h após o primeiro uso">reinicia em 24h</div>
        </div>
      </div>
    </div>

    <div id="gsh-auth" style="padding:16px;display:none;gap:12px;flex-direction:column;">
      <div class="gsh-tiny">Entre com seu e-mail institucional para usar a professora virtual.</div>
      <div class="gsh-row" style="flex-wrap:wrap;gap:12px;align-items:flex-end;">
        <div style="display:flex;flex-direction:column;gap:6px;min-width:260px;">
          <label for="gsh-email">E-mail</label>
          <input id="gsh-email" type="text" placeholder="estudante@globalspeak.email ou admin@globalspeak.online" class="gsh-input"/>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;min-width:200px;">
          <label for="gsh-pass">Senha</label>
          <input id="gsh-pass" type="password" placeholder="sua senha" class="gsh-input"/>
        </div>
        <button id="gsh-login" class="gsh-btn">Entrar</button>
      </div>
      <div class="gsh-tiny">Administradores: <code>@globalspeak.online</code>. Estudantes: <code>@globalspeak.email</code>.</div>
    </div>

    <div id="gsh-admin" style="display:none;padding:16px;border-bottom:1px solid rgba(255,255,255,.07);">
      <div class="gsh-row" style="justify-content:space-between;align-items:center;">
        <div class="gsh-title" style="font-size:14px;">Painel do Administrador</div>
        <button id="gsh-logoutA" class="gsh-btn">Sair</button>
      </div>
      <div class="gsh-tiny">Adicionar/Remover estudantes (domínio <code>@globalspeak.email</code>).</div>
      <div class="gsh-row" style="flex-wrap:wrap;gap:8px;margin-top:8px;">
        <input id="gsh-newEmail" type="text" placeholder="novo estudante@globalspeak.email" class="gsh-input"/>
        <input id="gsh-newPass" type="text" placeholder="senha" class="gsh-input"/>
        <button id="gsh-add" class="gsh-btn">+ Adicionar estudante</button>
      </div>
      <div class="gsh-row" style="flex-wrap:wrap;gap:8px;margin-top:8px;">
        <input id="gsh-delEmail" type="text" placeholder="estudante@globalspeak.email" class="gsh-input"/>
        <button id="gsh-del" class="gsh-btn">– Remover estudante</button>
      </div>
      <div id="gsh-adminMsg" class="gsh-tiny" style="margin-top:8px;"></div>
    </div>

    <div id="gsh-chat" style="display:none;">
      <div id="gsh-messages" class="gsh-messages"></div>
      <div class="gsh-tiny">Dica: você pode digitar ou gravar áudio em espanhol/português; a professora <strong>sempre</strong> responderá em português, com correções gramaticais e dicas de pronúncia.</div>
      <div class="gsh-controls">
        <input id="gsh-text" type="text" placeholder="Digite sua pergunta..." class="gsh-input"/>
        <div class="gsh-row">
          <button id="gsh-mic" class="gsh-btn">🎙️ Gravar</button>
          <button id="gsh-send" class="gsh-btn">Enviar</button>
        </div>
      </div>
      <div class="gsh-controls" style="justify-content:space-between;">
        <label class="gsh-audio"><input type="checkbox" id="gsh-playAudio" checked> Reproduzir resposta em áudio</label>
        <div class="gsh-row">
          <button id="gsh-stop" class="gsh-btn">⏹️ Parar áudio</button>
          <button id="gsh-clear" class="gsh-btn">🧹 Limpar</button>
          <button id="gsh-logoutU" class="gsh-btn">Sair</button>
        </div>
      </div>
    </div>
  </div>
</div>
<audio id="gsh-tts" preload="auto"></audio>`;
  }

  async function init(){
    window.__GSH_BOOTSTRAP_STAGE__ = "init";
    const mount = await waitForMount();
    if (!mount) { log("sem mount — abortando"); return; }

    if (mount.dataset.initialized === "1") {
      log("já inicializado");
      return;
    }
    injectStyles();
    mount.innerHTML = widgetHTML();
    mount.dataset.initialized = "1";
    log("UI injetada");
    try { wireUp(mount); } catch(e){ console.error("[GSH bootstrap] erro no wireUp:", e); }
  }

  // Helpers locais (sem conflito de nomes)
  function $in(root, sel){ return root.querySelector(sel); }

  function wireUp(root){
    window.__GSH_BOOTSTRAP_STAGE__ = "wireUp";
    const $status = $in(root,'#gsh-status'),
          $usageBox = $in(root,'#gsh-usageBox'),
          $barIx = $in(root,'#gsh-barIx'),
          $barMin = $in(root,'#gsh-barMin'),
          $ixText = $in(root,'#gsh-ixText'),
          $minText = $in(root,'#gsh-minText'),
          $resetText = $in(root,'#gsh-resetText');

    const $auth = $in(root,'#gsh-auth'),
          $admin = $in(root,'#gsh-admin'),
          $chat = $in(root,'#gsh-chat');

    const $email = $in(root,'#gsh-email'),
          $pass = $in(root,'#gsh-pass'),
          $login = $in(root,'#gsh-login'),
          $logoutA = $in(root,'#gsh-logoutA'),
          $logoutU = $in(root,'#gsh-logoutU');

    const $newEmail = $in(root,'#gsh-newEmail'),
          $newPass  = $in(root,'#gsh-newPass'),
          $add = $in(root,'#gsh-add'),
          $delEmail = $in(root,'#gsh-delEmail'),
          $del = $in(root,'#gsh-del'),
          $adminMsg = $in(root,'#gsh-adminMsg');

    const $messages = $in(root,'#gsh-messages'),
          $text = $in(root,'#gsh-text'),
          $send = $in(root,'#gsh-send'),
          $mic = $in(root,'#gsh-mic'),
          $clear = $in(root,'#gsh-clear'),
          $playAudio = $in(root,'#gsh-playAudio'),
          $stop = $in(root,'#gsh-stop'),
          $tts = $in(root,'#gsh-tts');

    let session = null;

    function setStatus(s){ $status.textContent = s; }
    function addMessage(t, who){
      const d=document.createElement('div');
      d.className=`gsh-msg ${who}`;
      d.textContent=t;
      $messages.appendChild(d);
      $messages.scrollTop=$messages.scrollHeight;
    }
    function show(view){
      $auth.style.display='none';
      $admin.style.display='none';
      $chat.style.display='none';
      if(view==='auth') $auth.style.display='flex';
      if(view==='admin'){ $admin.style.display='block'; $usageBox.style.display='none'; }
      if(view==='chat'){ $chat.style.display='block'; $usageBox.style.display='flex'; fetchUsage(); }
    }
    function authHeader(){ return session? { 'Authorization': `Bearer ${session.token}` } : {}; }

    async function fetchUsage(){
      try{
        const r = await fetch(`${CONFIG.BACKEND_BASE_URL}/usage`, { headers: { ...authHeader() } });
        const data = await r.json();
        if(!r.ok) throw new Error(data.error || 'erro de uso');
        const ixLeft = Math.max(0, CONFIG.MAX_IX - (data.interactions || 0));
        const msLeft = Math.max(0, CONFIG.MAX_MS - (data.used_ms || 0));
        const minLeft = Math.floor(msLeft / 60000);
        const pctIx = (ixLeft / CONFIG.MAX_IX) * 100;
        const pctMin = (msLeft / CONFIG.MAX_MS) * 100;
        $barIx.style.width = `${pctIx}%`;
        $barMin.style.width = `${pctMin}%`;
        $ixText.textContent = `${ixLeft} interações`;
        $minText.textContent = `${minLeft} min`;
        if(data.resetAt){
          const t = new Date(data.resetAt);
          const diff = Math.max(0, t.getTime() - Date.now());
          const h = Math.floor(diff/3600000), m = Math.floor((diff%3600000)/60000);
          $resetText.textContent = `reinicia em ${h}h ${m}m`;
        }
      }catch(e){ console.warn('usage', e); }
    }

    async function login(){
      const email = $email.value.trim(); const password = $pass.value;
      if(!email || !password) return alert('Digite e-mail e senha.');
      setStatus('Autenticando...');
      const r = await fetch(`${CONFIG.BACKEND_BASE_URL}/auth/login`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email, password })
      });
      const data = await r.json();
      if(!r.ok){
        setStatus('Erro');
        return alert(data.error || 'Falha no login');
      }
      session = { token: data.token, role: data.role, email: data.email };
      localStorage.setItem('gsh_session', JSON.stringify(session));
      setStatus('Pronto');
      show(session.role === 'admin' ? 'admin' : 'chat');
    }

    async function logout(){
      if(session){
        try{ await fetch(`${CONFIG.BACKEND_BASE_URL}/auth/logout`, { method:'POST', headers:{...authHeader()} }); }catch{}
      }
      session = null;
      localStorage.removeItem('gsh_session');
      show('auth');
    }

    $login.addEventListener('click', login);
    $logoutA.addEventListener('click', logout);
    $logoutU.addEventListener('click', logout);

    try{
      const s = JSON.parse(localStorage.getItem('gsh_session'));
      if(s){ session = s; show(s.role === 'admin' ? 'admin' : 'chat'); } else { show('auth'); }
    }catch{ show('auth'); }

    $add.addEventListener('click', async ()=>{
      const email = $newEmail.value.trim(), password = $newPass.value;
      if(!email || !password) return alert("Digite o e-mail do estudante e a senha.");
      const r = await fetch(`${CONFIG.BACKEND_BASE_URL}/admin/addUser`, {
        method:'POST',
        headers:{ ...authHeader(), 'Content-Type':'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await r.json();
      $adminMsg.textContent = data.ok ? `Estudante ${email} adicionado.` : (data.error || 'Erro');
    });

    $del.addEventListener('click', async ()=>{
      const email = $delEmail.value.trim();
      if(!email) return alert("Digite o e-mail do estudante.");
      const r = await fetch(`${CONFIG.BACKEND_BASE_URL}/admin/deleteUser`, {
        method:'POST',
        headers:{ ...authHeader(), 'Content-Type':'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await r.json();
      $adminMsg.textContent = data.ok ? `Estudante ${email} removido.` : (data.error || 'Erro');
    });

    async function transcribe(blob){
      setStatus('Transcrevendo...');
      const form = new FormData();
      form.append('file', blob, 'audio.webm');
      form.append('model', CONFIG.STT_MODEL);
      const r = await fetch(`${CONFIG.BACKEND_BASE_URL}/stt`, { method:'POST', headers:{ ...authHeader() }, body: form });
      if(!r.ok){
        const e = await r.json().catch(()=>({}));
        throw new Error(e.error || 'Falha na transcrição');
      }
      const data = await r.json();
      setStatus('Pronto');
      await fetchUsage();
      return data.text;
    }

    async function chat(prompt){
      setStatus('Pensando...');
      const r = await fetch(`${CONFIG.BACKEND_BASE_URL}/chat`, {
        method:'POST',
        headers:{ ...authHeader(), 'Content-Type':'application/json' },
        body: JSON.stringify({
          model: CONFIG.CHAT_MODEL,
          messages: [
            { role:'system', content: `Você é um professor de português do Brasil para falantes de espanhol. Responda SEMPRE e SOMENTE em português do Brasil, de forma clara e prática (texto e áudio). Se o aluno escrever em espanhol, responda em português. Sua tarefa é sempre: (1) responder a pergunta de forma clara e natural em português; (2) corrigir a gramática do estudante e sua ortografia com 1-2 exemplos curtos em português; (3) dar uma dica rápida de pronúncia em português; (4) se o aluno usar espanhol/português, repita brevemente o que foi perguntado em português antes de responder.` },
            { role:'user', content: prompt }
          ]
        })
      });
      const data = await r.json();
      if(!r.ok) throw new Error(data.error || 'Falha no chat');
      setStatus('Pronto');
      await fetchUsage();
      return data.reply;
    }

    async function tts(text){
      setStatus('Gerando áudio...');
      const r = await fetch(`${CONFIG.BACKEND_BASE_URL}/tts`, {
        method:'POST',
        headers:{ ...authHeader(), 'Content-Type':'application/json' },
        body: JSON.stringify({ voice: CONFIG.TTS_VOICE, format: CONFIG.TTS_FORMAT, input: text })
      });
      if(!r.ok){
        const e=await r.text();
        throw new Error(e || 'Falha no TTS');
      }
      const buf = await r.arrayBuffer();
      setStatus('Pronto');
      await fetchUsage();
      return new Blob([buf], { type: `audio/${CONFIG.TTS_FORMAT}` });
    }

    async function handleSend(text){
      if(!text) return;
      addMessage(text, 'user'); $text.value='';
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
        setStatus('Erro');
        addMessage('⚠️ ' + err.message, 'bot');
      }
    }

    $send.addEventListener('click', ()=> handleSend($text.value.trim()));
    $text.addEventListener('keydown', e=>{ if(e.key==='Enter') handleSend($text.value.trim()); });

    $stop.addEventListener('click', ()=>{ try{ $tts.pause(); $tts.currentTime=0; }catch{} });
    $clear.addEventListener('click', ()=>{ $messages.innerHTML=''; });

    let recording=false, mediaRecorder, chunks=[];
    $mic.addEventListener('click', async ()=>{
      if(!recording){
        try{
          const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
          chunks=[]; mediaRecorder=new MediaRecorder(stream);
          mediaRecorder.ondataavailable = e => chunks.push(e.data);
          mediaRecorder.onstop = async ()=>{
            const blob = new Blob(chunks, { type:'audio/webm' });
            try{
              const text = await transcribe(blob);
              addMessage(`(voz) ${text}`, 'user');
              await handleSend(text);
            } catch(err){
              addMessage('⚠️ ' + err.message, 'bot');
            }
          };
          mediaRecorder.start();
          recording=true;
          $mic.textContent='⏹️ Parar';
          setStatus('Gravando...');
        }catch{
          alert('Por favor, permita acesso ao microfone.');
        }
      } else {
        mediaRecorder.stop();
        recording=false;
        $mic.textContent='🎙️ Gravar';
        setStatus('Processando...');
      }
    });

    window.__GSH_BOOTSTRAP_STAGE__ = "ready";
    log("widget conectado");
  }

  onReady(()=>{ log("init solicitado"); init(); });
})();
