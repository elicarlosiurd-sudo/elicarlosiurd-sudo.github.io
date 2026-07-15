/* ═══════════════════════════════════════
   V230-E1 — COACH IA (js/modules/coach.js)
   Ex-bloco <script> completo L5973–7347 do index.html (extração literal).
   Inclui UI do coach, contexto, multimodal e registro do Service Worker.
═══════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   COACH IA — módulo único final v9.0
   DOM: #coach-wrap #coach-msgs #coach-input-bar
        #coach-input #coach-send-btn #coach-mic-btn #rec-indicator
   ═══════════════════════════════════════════════════════════════ */

// ── CSS final do CoachIA ────────────────────────────────────────
(function injectCoachCSS() {
  var st = document.createElement('style');
  st.id = 'coach-css-final';
  st.textContent = [
    /* Esconde bottom nav quando coach aberto */
    '.coach-open #bottom-nav { display: flex !important; }',
    /* Screen do coach ocupa toda a viewport disponível */
    '.screen.active.coach-open-screen { display:flex; flex-direction:column; overflow:hidden; background:radial-gradient(circle at 80% 0%,rgba(46,224,122,.10),transparent 34%),var(--bg); position:absolute; top:0; left:0; right:0; bottom:0; z-index:10; }',
    '#coach-wrap { display:flex; flex-direction:column; flex:1; min-height:0; height:100%; }',
    /* Header */
    '.coach-header { flex-shrink:0; display:flex; align-items:center; gap:12px; padding:10px 16px; border-bottom:1px solid rgba(46,224,122,.14); background:rgba(5,8,7,.86); backdrop-filter:blur(22px); }',
    '.coach-back-btn { width:40px; min-width:40px; height:40px; border-radius:14px; background:rgba(255,255,255,.045); border:1px solid rgba(255,255,255,.10); cursor:pointer; font-size:26px; font-weight:700; color:#fff; display:flex; align-items:center; justify-content:center; line-height:1; -webkit-tap-highlight-color:transparent; transition:transform .18s,border-color .18s; }',
    '.coach-back-btn:active { transform:scale(.97); border-color:rgba(46,224,122,.28); }',
    '.coach-avatar.ai-orb { width:44px; height:44px; border-radius:999px; background:radial-gradient(circle at 38% 28%,rgba(90,255,170,.90),rgba(0,230,118,.62) 28%,rgba(0,92,46,.72) 58%,rgba(0,22,12,.96) 100%); border:1px solid rgba(0,230,118,.38); box-shadow:0 0 24px rgba(0,230,118,.26),0 0 64px rgba(0,230,118,.13),inset 0 0 22px rgba(0,255,135,.18),inset 0 -18px 28px rgba(0,20,10,.55); display:flex; align-items:center; justify-content:center; flex-shrink:0; position:relative; overflow:hidden; font-size:0; }',
    '.coach-avatar.ai-orb::before { content:""; position:absolute; inset:-35%; background:conic-gradient(from 120deg,transparent 0deg,rgba(0,230,118,0) 80deg,rgba(130,255,190,.28) 140deg,rgba(0,230,118,.16) 190deg,transparent 260deg); opacity:.85; animation:vitaliaOrbFlow 7s linear infinite; }',
    '.coach-avatar.ai-orb::after { content:""; position:absolute; inset:6px; border-radius:inherit; background:radial-gradient(circle at 45% 35%,rgba(0,230,118,.42),rgba(0,110,55,.26) 45%,rgba(0,20,10,.18) 100%); filter:blur(.6px); opacity:.9; }',
    '.coach-avatar.ai-orb.idle { animation:vitaliaOrbPulse 4s ease-in-out infinite; }',
    '.coach-avatar.ai-orb.thinking,.coach-avatar.ai-orb.responding { animation:vitaliaOrbPulse 1.35s ease-in-out infinite; box-shadow:0 0 32px rgba(0,230,118,.36),0 0 86px rgba(0,230,118,.18),inset 0 0 26px rgba(0,255,135,.22),inset 0 -18px 30px rgba(0,20,10,.58); }',
    '@keyframes vitaliaOrbPulse { 0%,100%{transform:scale(1);filter:brightness(1)} 50%{transform:scale(1.045);filter:brightness(1.16)} }',
    '@keyframes vitaliaOrbFlow { to{transform:rotate(360deg)} }',
    '@media (prefers-reduced-motion:reduce){.coach-avatar.ai-orb,.coach-avatar.ai-orb::before{animation:none!important}}',
    '.coach-avatar .online-dot { display:none !important; }',
    '.coach-tts-btn { min-width:54px; height:36px; border-radius:13px; background:rgba(46,224,122,.08); border:1px solid rgba(46,224,122,.22); cursor:pointer; font-size:12px; font-weight:700; color:#fff; padding:0 10px; -webkit-tap-highlight-color:transparent; }',
    '.coach-clear-btn { min-width:70px; height:36px; border-radius:13px; background:rgba(255,255,255,.055); border:1px solid rgba(255,255,255,.14); cursor:pointer; font-size:14px; font-weight:700; color:#fff; padding:0 12px; letter-spacing:.1px; -webkit-tap-highlight-color:transparent; }',
    /* Sugestões */
    '.coach-sugg-bar { flex-shrink:0; display:flex; gap:8px; overflow-x:auto; padding:10px 12px; border-bottom:1px solid rgba(255,255,255,.07); scrollbar-width:none; -webkit-overflow-scrolling:touch; }',
    '.coach-sugg-bar::-webkit-scrollbar { display:none; }',
    '.coach-sugg-chip { padding:8px 14px; border-radius:99px; border:1px solid rgba(46,224,122,.16); background:rgba(46,224,122,.055); font-size:11.5px; font-weight:700; white-space:nowrap; cursor:pointer; color:rgba(255,255,255,.82); font-family:var(--font-body); flex-shrink:0; -webkit-tap-highlight-color:transparent; touch-action:manipulation; transition:transform .18s,border-color .18s; }',
    '.coach-sugg-chip:active { transform:scale(.97); border-color:var(--firefly); color:var(--firefly); }',
    /* Mensagens */
    '#coach-msgs { flex:1; min-height:0; overflow-y:auto; padding:14px 12px; display:flex; flex-direction:column; gap:10px; -webkit-overflow-scrolling:touch; }',
    '.msg-wrap { display:flex; flex-direction:column; gap:3px; max-width:85%; }',
    '.msg-wrap.user { align-self:flex-end; align-items:flex-end; }',
    '.msg-wrap.ai { align-self:flex-start; align-items:flex-start; }',
    '.msg-bubble { padding:10px 14px; border-radius:16px; font-size:13.5px; line-height:1.6; word-break:break-word; }',
    '.msg-wrap.user .msg-bubble { background:var(--green); color:#000; border-bottom-right-radius:4px; font-weight:500; }',
    '.msg-wrap.ai .msg-bubble { background:linear-gradient(180deg,rgba(16,26,23,.96),rgba(8,13,12,.98)); border:1px solid rgba(46,224,122,.14); border-bottom-left-radius:4px; color:var(--text); }',
    '.msg-time { font-size:10px; color:var(--text3); padding:0 4px; }',
    /* Typing dots */
    '.typing-dots { display:flex; gap:5px; padding:4px 2px; }',
    '.typing-dot { width:7px; height:7px; border-radius:50%; background:var(--text3); animation:tdBounce .9s infinite; }',
    '.typing-dot:nth-child(2) { animation-delay:.15s; }',
    '.typing-dot:nth-child(3) { animation-delay:.3s; }',
    '@keyframes tdBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }',
    /* Indicador de gravação */
    '#rec-indicator { display:none; flex-shrink:0; align-items:center; justify-content:center; gap:8px; padding:7px 16px; background:rgba(239,68,68,.1); border-top:1px solid rgba(239,68,68,.2); font-size:12px; color:#ef4444; }',
    '#rec-indicator.active { display:flex; }',
    '@keyframes recPulse { 0%,100%{opacity:1} 50%{opacity:.3} }',
    '.rec-dot { width:8px; height:8px; border-radius:50%; background:#ef4444; animation:recPulse 1s infinite; }',
    /* Barra de input */
    '#coach-input-bar { flex-shrink:0; display:flex; align-items:center; gap:8px; padding:10px 12px calc(10px + env(safe-area-inset-bottom,0)); border-top:1px solid rgba(46,224,122,.12); background:rgba(5,8,7,.90); backdrop-filter:blur(20px); }',
    '#coach-mic-btn { flex-shrink:0; width:46px; height:46px; min-width:46px; border-radius:16px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.12); cursor:pointer; font-size:21px; display:flex; align-items:center; justify-content:center; -webkit-tap-highlight-color:transparent; touch-action:manipulation; transition:background .2s,border-color .2s,transform .18s; }',
    '#coach-mic-btn.recording { background:rgba(239,68,68,.15); border-color:#ef4444; animation:micPulse 1s infinite; }',
    '@keyframes micPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)} 50%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }',
    /* INPUT — font-size:16px obrigatório para Android não dar zoom e abrir teclado */
    '#coach-input { flex:1; background:rgba(16,26,23,.96); border:1.5px solid rgba(255,255,255,.10); border-radius:16px; padding:11px 14px; font-size:16px; color:var(--text); font-family:var(--font-body); outline:none; -webkit-appearance:none; appearance:none; box-sizing:border-box; min-height:46px; touch-action:manipulation; -webkit-tap-highlight-color:transparent; pointer-events:auto !important; -webkit-user-select:text !important; user-select:text !important; resize:none; overflow:hidden; }',
    '#coach-input:focus { border-color:rgba(46,224,122,.42); background:rgba(16,26,23,1); box-shadow:0 0 0 4px rgba(46,224,122,.09); }',
    '#coach-input::placeholder{ font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; opacity:.85; line-height:24px; }',
    '#coach-input::-webkit-input-placeholder{ font-size:13px; white-space:nowrap; }',
    '#coach-send-btn { flex-shrink:0; width:46px; height:46px; min-width:46px; border-radius:16px; background:linear-gradient(135deg,var(--firefly),var(--firefly-strong)); border:none; cursor:pointer; font-size:20px; color:#021108; font-weight:700; display:flex; align-items:center; justify-content:center; -webkit-tap-highlight-color:transparent; touch-action:manipulation; box-shadow:0 12px 28px rgba(46,224,122,.20); }'
  ].join('\n');
  document.head.appendChild(st);
})();

// ── Estado do módulo ────────────────────────────────────────────
var _coachRec = { recording:false, recorder:null, chunks:[], stream:null, timer:null };
var _coachTTSEnabled = true; // Resposta em áudio ativada por padrão

function coachIcon(name) {
  var icons = {
    camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h2l1.2-1.6h4.6L15.5 6h2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z"/><circle cx="12" cy="12.5" r="3.2"/></svg>',
    image: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.5"/><path d="m7 17 3.2-3.4 2.4 2.4 2.1-2.2L18 17"/></svg>',
    file: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 12.5 13.8 7a3 3 0 0 1 4.3 4.2l-6.8 7a4.5 4.5 0 0 1-6.4-6.4l6.4-6.6"/><path d="M9.2 15.8 15.5 9"/></svg>',
    mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="4" width="6" height="10" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6"/></svg>',
    live: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 16 0"/><path d="M7 12a5 5 0 0 1 10 0"/><path d="M10 12a2 2 0 0 1 4 0"/><circle cx="12" cy="16.5" r="1.4"/></svg>',
    speaker: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10v4h3l5 4V6l-5 4H5Z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
    muted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10v4h3l5 4V6l-5 4H5Z"/><path d="m17 9 4 4M21 9l-4 4"/></svg>',
    send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12 20 5l-7 16-2-7-7-2Z"/><path d="m11 14 4-5"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>'
  };
  return icons[name] || '';
}

// ── renderCoach ─────────────────────────────────────────────────
function renderCoach() {
  var p = APP.profile || { name: t('gen_user') };
  if (!APP.coachMsgs || !APP.coachMsgs.length) {
    APP.coachMsgs = [{
      role: 'ai',
      text: t('coach_initial'),
      time: new Date().toLocaleTimeString(localeForLang(), { hour:'2-digit', minute:'2-digit' })
    }];
  }
  var suggs = [
    t('coach_s1'),
    t('coach_s2'),
    t('coach_s3'),
    t('coach_s4')
  ];
  var msgsHtml = APP.coachMsgs.map(function(m) {
    var isUser = m.role === 'user';
    var audioHtml = m.audio ? '<div style="margin-top:6px"><audio controls src="'+escapeAttr(m.audio)+'" style="max-width:220px;height:36px;border-radius:8px"></audio></div>' : '';
    var imageHtml = m.image ? '<img src="'+escapeAttr(m.image)+'" class="chat-image" alt="Refeição do usuário">' : '';
    var textHtml = isUser ? escapeHtml(m.text || '').replace(/\n/g,'<br>') : formatCoachMsg(m.text || '');
    return '<div class="msg-wrap '+(isUser?'user':'ai')+'">' +
      '<div class="msg-bubble">'+imageHtml+textHtml+audioHtml+'</div>' +
      '<div class="msg-time">'+escapeHtml(m.time||'')+'</div></div>';
  }).join('');

  return '<div id="coach-wrap">' +
    // HEADER com botão VOLTAR + toggle TTS
    '<div class="coach-header">' +
      '<button class="coach-back-btn" onclick="navigate(\'home\')" title="'+t('coach_back_title')+'">←</button>' +
      '<div id="coach-ai-orb" class="coach-avatar ai-orb idle"><span class="online-dot"></span></div>' +
      '<div style="flex:1;margin-left:10px">' +
        '<div style="font-weight:720;font-size:15px;color:var(--text)">'+t('coach_title')+'</div>' +
        '<div style="font-size:11px;color:var(--firefly);font-weight:700">● '+t('coach_status')+'</div>' +
      '</div>' +
      '<button id="tts-toggle-btn" class="coach-tts-btn" onclick="toggleCoachTTS()" title="'+t('coach_audio_title')+'">'+t('coach_sound')+'</button>' +
      '<button class="coach-clear-btn" onclick="clearCoachHistory()">' + t('coach_clear') + '</button>' +
    '</div>' +
    // Sugestões
    '<div class="coach-sugg-bar">' +
      suggs.map(function(s){ return '<button class="coach-sugg-chip" onclick="sendCoachMsg(\''+s.replace(/'/g,"\\'")+'\')">' +s+'</button>'; }).join('') +
    '</div>' +
    '<div id="coach-msgs">'+msgsHtml+'</div>' +
    '<div id="rec-indicator"><span class="rec-dot"></span> '+t('coach_recording_now')+'</div>' +
    '<div id="coach-attachment-chip" class="coach-attachment-chip"><span id="coach-attachment-label"></span><button type="button" onclick="coachClearAttachment()" title="Remover anexo" aria-label="Remover anexo" style="background:transparent;border:0;color:var(--text);font-size:18px">' + coachIcon('close') + '</button></div>' +
    '<div id="coach-multimodal-menu" class="coach-multimodal-menu" role="menu" aria-hidden="true" aria-label="A&ccedil;&otilde;es multimodais">' +
      '<button type="button" role="menuitem" class="coach-multimodal-action" onclick="coachOpenPicker(\'camera\')" title="C&acirc;mera" aria-label="C&acirc;mera"><span class="coach-action-icon">' + coachIcon('camera') + '</span><span>C&acirc;mera</span></button>' +
      '<button type="button" role="menuitem" class="coach-multimodal-action" onclick="coachOpenPicker(\'image\')" title="Fotos" aria-label="Fotos"><span class="coach-action-icon">' + coachIcon('image') + '</span><span>Fotos</span></button>' +
      '<button type="button" role="menuitem" class="coach-multimodal-action" onclick="coachOpenPicker(\'file\')" title="Arquivos" aria-label="Arquivos"><span class="coach-action-icon">' + coachIcon('file') + '</span><span>Arquivos</span></button>' +
      '<button type="button" role="menuitem" class="coach-multimodal-action" onclick="coachStartQuickAudioCapture()" title="&Aacute;udio" aria-label="&Aacute;udio"><span class="coach-action-icon">' + coachIcon('mic') + '</span><span>&Aacute;udio</span></button>' +
      '<button type="button" role="menuitem" class="coach-multimodal-action" onclick="coachStartLiveVoice()" title="Falar ao Vivo" aria-label="Falar ao Vivo"><span class="coach-action-icon">' + coachIcon('live') + '</span><span>Falar ao Vivo</span></button>' +
    '</div>' +
    '<input id="coach-camera-input" class="coach-hidden-file" type="file" accept="image/*" capture="environment" onchange="coachHandleFileInput(event, \'camera\')">' +
    '<input id="coach-gallery-input" class="coach-hidden-file" type="file" accept="image/jpeg,image/png,image/webp" onchange="coachHandleFileInput(event, \'image\')">' +
    '<input id="coach-file-input" class="coach-hidden-file" type="file" accept="application/pdf,text/plain" onchange="coachHandleFileInput(event, \'file\')">' +
    '<div id="coach-input-bar">' +
      '<button id="coach-plus-btn" class="coach-plus-btn" type="button" onclick="toggleCoachMultimodalMenu()" title="Abrir anexos" aria-label="Abrir anexos">+</button>' +
      '<textarea id="coach-input" rows="1" placeholder="' + t('coach_placeholder') + '"></textarea>' +
      '<button id="coach-mic-btn" onclick="toggleCoachRec()" title="'+t('coach_mic_title')+'" aria-label="'+t('coach_mic_title')+'">' + coachIcon('mic') + '</button>' +
      '<button id="coach-sound-btn" class="coach-sound-btn" type="button" onclick="toggleCoachTTS()" title="Som" aria-label="Som">' + coachIcon('speaker') + '</button>' +
      '<button id="coach-send-btn" onclick="sendCoachMsg()" title="Enviar" aria-label="Enviar">' + coachIcon('send') + '</button>' +
    '</div>' +
  '</div>';
}

// ── toggleCoachTTS ──────────────────────────────────────────────
function toggleCoachTTS() {
  _coachTTSEnabled = !_coachTTSEnabled;
  var btn = document.getElementById('tts-toggle-btn');
  if (btn) {
    btn.textContent = _coachTTSEnabled ? t('coach_sound') : t('coach_mute');
    btn.style.opacity = _coachTTSEnabled ? '1' : '0.4';
  }
  var inlineBtn = document.getElementById('coach-sound-btn');
  if (inlineBtn) {
    inlineBtn.innerHTML = coachIcon(_coachTTSEnabled ? 'speaker' : 'muted');
    inlineBtn.title = _coachTTSEnabled ? t('coach_sound') : t('coach_mute');
    inlineBtn.setAttribute('aria-label', _coachTTSEnabled ? t('coach_sound') : t('coach_mute'));
    inlineBtn.classList.toggle('muted', !_coachTTSEnabled);
  }
  if (typeof toast === 'function') toast(_coachTTSEnabled ? t('coach_audio_on') : t('coach_audio_off'),'info',2000);
}

// ── attachCoach ─────────────────────────────────────────────────
function attachCoach(screen) {
  if (screen) screen.classList.add('coach-open-screen');
  setTimeout(function() {
    var inp = document.getElementById('coach-input');
    var msgs = document.getElementById('coach-msgs');
    if (inp) {
      inp.addEventListener('input', function() { this.style.height='auto'; this.style.height=Math.min(this.scrollHeight,120)+'px'; });
      inp.addEventListener('keydown', function(e) { if (e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendCoachMsg();} });
      try {
        var prefill = localStorage.getItem('vitalia_coach_prefill_message') || '';
        if (prefill && !inp.value) {
          inp.value = prefill;
          inp.style.height = 'auto';
          inp.style.height = Math.min(inp.scrollHeight, 120) + 'px';
          localStorage.removeItem('vitalia_coach_prefill_message');
        }
      } catch(e) {}
    }
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
    // Atualizar ícone TTS
    var btn = document.getElementById('tts-toggle-btn');
    if (btn) { btn.textContent = _coachTTSEnabled ? t('coach_sound') : t('coach_mute'); btn.style.opacity = _coachTTSEnabled ? '1' : '0.55'; }
    var inlineBtn = document.getElementById('coach-sound-btn');
    if (inlineBtn) {
      inlineBtn.innerHTML = coachIcon(_coachTTSEnabled ? 'speaker' : 'muted');
      inlineBtn.title = _coachTTSEnabled ? t('coach_sound') : t('coach_mute');
      inlineBtn.setAttribute('aria-label', _coachTTSEnabled ? t('coach_sound') : t('coach_mute'));
      inlineBtn.classList.toggle('muted', !_coachTTSEnabled);
    }
    if (!window._coachMultimodalOutsideCloseBound) {
      window._coachMultimodalOutsideCloseBound = true;
      document.addEventListener('click', function(ev) {
        var menu = document.getElementById('coach-multimodal-menu');
        var bar = document.getElementById('coach-input-bar');
        if (!menu || !menu.classList.contains('open')) return;
        if (menu.contains(ev.target) || (bar && bar.contains(ev.target))) return;
        toggleCoachMultimodalMenu(false);
      }, true);
    }
    setCoachOrbState(APP.coachLoading ? 'thinking' : 'idle');
  }, 80);
}

function setCoachOrbState(state) {
  var orb = document.getElementById('coach-ai-orb') || document.querySelector('.coach-avatar.ai-orb');
  if (!orb) return;
  var next = ['idle','thinking','responding'].indexOf(state) >= 0 ? state : 'idle';
  orb.classList.remove('idle','thinking','responding');
  orb.classList.add(next);
}

// ── clearCoachHistory ───────────────────────────────────────────
function clearCoachHistory() { APP.coachMsgs = []; clearCoachContext(); navigate('coach'); }

function coachContextUserId() {
  try { return currentUserId() || (APP.user && APP.user.id) || 'guest'; } catch(_) { return 'guest'; }
}

function coachContextKey() {
  return 'vitalia_coach_context_' + coachContextUserId();
}

function coachRandomSessionId() {
  try {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  } catch(_) {}
  return 'coach-' + Date.now() + '-' + Math.random().toString(36).slice(2);
}

function defaultCoachContext() {
  var p = APP.profile || {};
  var lang = getUserLanguage() || APP.lang || 'pt';
  return {
    last_intent: '',
    last_recipe_name: '',
    last_recipe_ingredients: [],
    recipe_category: '',
    goal: p.goal || p.objetivo || 'health',
    recent_recipe_names: [],
    recent_recipe_ingredients: [],
    recent_responses: [],
    recent_ingredient_keys: [],
    recent_categories: [],
    recent_recipe_categories: [],
    user_language: lang,
    session_id: coachRandomSessionId()
  };
}

function loadCoachContext() {
  var base = defaultCoachContext();
  try {
    var raw = sessionStorage.getItem(coachContextKey());
    if (!raw) return base;
    var stored = JSON.parse(raw);
    return Object.assign(base, stored || {}, {
      session_id: (stored && stored.session_id) || base.session_id
    });
  } catch(_) {
    return base;
  }
}

function saveCoachContext(context) {
  try {
    var base = loadCoachContext();
    var next = Object.assign(base, context || {});
    if (!next.session_id) next.session_id = base.session_id || coachRandomSessionId();
    sessionStorage.setItem(coachContextKey(), JSON.stringify(next));
    return next;
  } catch(_) {
    return context || {};
  }
}

function clearCoachContext() {
  try { sessionStorage.removeItem(coachContextKey()); } catch(_) {}
}

function attachCoachContext(payload) {
  var ctx = loadCoachContext();
  var visibleRecipe = getLastVisibleCoachRecipeResponse();
  return Object.assign({}, payload || {}, {
    session_id: ctx.session_id,
    conversation_context: ctx,
    last_visible_recipe_response: visibleRecipe || '',
    last_visible_recipe_at: visibleRecipe ? new Date().toISOString() : ''
  });
}

function getLastVisibleCoachRecipeResponse() {
  try {
    var history = Array.isArray(APP.chatHistory) ? APP.chatHistory : [];
    for (var i = history.length - 1; i >= 0; i--) {
      var item = history[i] || {};
      if (item.role !== 'model') continue;
      var text = item.parts && item.parts[0] && item.parts[0].text ? String(item.parts[0].text) : '';
      var normalized = normalizeCoachText(text);
      if (/\b(nome da receita|nome do suco|suco detox)\b/.test(normalized)) {
        return text.slice(0, 5000);
      }
    }
  } catch(_) {}
  return '';
}

function persistCoachContextFromResponse(data) {
  var updated = data && (
    (data.meta && data.meta.updated_context) ||
    (data.metadata && data.metadata.updated_context) ||
    data.conversation_context ||
    data.updated_context
  );
  if (updated) {
    var saved = saveCoachContext(updated);
    try {
      console.log('[vitalia] context_saved', {
        last_recipe_name: saved && saved.last_recipe_name,
        recent_count: saved && saved.recent_recipe_names ? saved.recent_recipe_names.length : 0,
        recent_ingredients_count: saved && saved.recent_recipe_ingredients ? saved.recent_recipe_ingredients.length : 0,
        session_id: saved && saved.session_id
      });
    } catch(_) {}
  } else {
    try { console.warn('[vitalia] context_not_returned'); } catch(_) {}
  }
}

// ── Coach Multimodal Input v1 ───────────────────────────────────
var COACH_MULTIMODAL_MAX_BYTES = 100 * 1024 * 1024;
var COACH_MULTIMODAL_ALLOWED = {
  'image/jpeg': true,
  'image/jpg': true,
  'image/png': true,
  'image/webp': true,
  'application/pdf': true,
  'text/plain': true,
  'audio/mpeg': true,
  'audio/wav': true,
  'audio/ogg': true,
  'audio/m4a': true,
  'audio/mp4': true,
  'audio/x-m4a': true
};
var COACH_MULTIMODAL_BUCKET = {
  camera: 'coach-images',
  image: 'coach-images',
  file: 'coach-files',
  audio: 'coach-audio',
  live_voice: 'coach-audio'
};
var COACH_MULTIMODAL_TYPE = {
  camera: 'image',
  image: 'image',
  file: 'file',
  audio: 'audio',
  live_voice: 'live_voice',
  text: 'text'
};
var _coachQuickAudio = { recorder:null, stream:null, chunks:[] };

function coachStorageSegment(kind) {
  if (kind === 'camera' || kind === 'image') return 'images';
  if (kind === 'file') return 'files';
  if (kind === 'audio' || kind === 'live_voice') return 'audio';
  return COACH_MULTIMODAL_TYPE[kind] || kind;
}

function toggleCoachMultimodalMenu(force) {
  var menu = document.getElementById('coach-multimodal-menu');
  if (!menu) return;
  var open = typeof force === 'boolean' ? force : !menu.classList.contains('open');
  menu.classList.toggle('open', open);
  menu.setAttribute('aria-hidden', open ? 'false' : 'true');
}

function coachOpenPicker(kind) {
  toggleCoachMultimodalMenu(false);
  var id = kind === 'camera' ? 'coach-camera-input' : kind === 'image' ? 'coach-gallery-input' : 'coach-file-input';
  var input = document.getElementById(id);
  if (input) {
    input.value = '';
    input.click();
  }
}

function coachSafeFileName(name) {
  var base = String(name || 'upload')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);
  return base || 'upload';
}

function coachValidateFile(file) {
  if (!file) throw new Error('Arquivo vazio.');
  if (file.size > COACH_MULTIMODAL_MAX_BYTES) throw new Error('Arquivo acima de 100MB bloqueado por segurança.');
  var type = String(file.type || '').toLowerCase();
  var name = String(file.name || '').toLowerCase();
  if (/\.(exe|sh|bat|cmd|msi|apk|jar|js|vbs|ps1|php|py|rb|pl)$/i.test(name)) throw new Error('Tipo executável bloqueado por segurança.');
  if (!COACH_MULTIMODAL_ALLOWED[type]) throw new Error('Formato não permitido: ' + (type || 'desconhecido') + '.');
  return type;
}

function coachAttachmentLabel(kind, file) {
  var map = { camera:'Foto da câmera', image:'Imagem da galeria', file:'Arquivo', audio:'Áudio', live_voice:'Voz ao vivo', text:'Mensagem' };
  return (map[kind] || 'Anexo') + (file && file.name ? ': ' + coachSafeFileName(file.name) : '');
}

function coachShowAttachment(label) {
  var chip = document.getElementById('coach-attachment-chip');
  var text = document.getElementById('coach-attachment-label');
  if (text) text.textContent = label || '';
  if (chip) chip.classList.toggle('active', !!label);
}

function coachClearAttachment() {
  APP.coachPendingAttachment = null;
  coachShowAttachment('');
}

function coachBuildMultimodalContext() {
  var lang = getUserLanguage() || APP.lang || 'pt';
  var c = APP.calc || {};
  var p = APP.profile || {};
  return {
    language: lang,
    objective: p.goal || p.objetivo || 'health',
    daily_calorie_goal: Number(c.cal || c.meta || c.kcal || 0),
    daily_protein_goal: Number(c.prot || c.protein || c.proteina || 0)
  };
}

function coachBuildNutritionContext() {
  return {
    meals_logged_today: APP.meals || [],
    water_intake_ml: Number(APP.water || 0) * 250
  };
}

function coachResolvedTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch(_) {
    return undefined;
  }
}

async function coachUploadMultimodalFile(file, kind) {
  var mime = coachValidateFile(file);
  var bucket = COACH_MULTIMODAL_BUCKET[kind] || 'coach-files';
  var session = null;
  try { session = (await sb.auth.getSession())?.data?.session || null; } catch(_) {}
  if (!session?.user?.id) throw new Error('Faça login para enviar arquivos ao Coach IA.');
  var safe = coachSafeFileName(file.name || ('audio-' + Date.now()));
  var path = 'users/' + session.user.id + '/coach/' + coachStorageSegment(kind) + '/' + Date.now() + '-' + safe;
  var up = await sb.storage.from(bucket).upload(path, file, { contentType: mime, upsert: false });
  if (up.error) throw up.error;
  var signed = await sb.storage.from(bucket).createSignedUrl(path, 600);
  if (signed.error) throw signed.error;
  console.log('[coach-ui] upload_success', {
    bucket: bucket,
    storage_path: path,
    mime_type: mime,
    size: file.size,
    file_name: safe
  });
  return { bucket: bucket, path: path, signedUrl: signed.data && signed.data.signedUrl, mime: mime, size: file.size, filename: safe };
}

function coachRealAiErrorMessage(err, mode) {
  if (mode === 'text' || String(err || '').indexOf('coach_text_request_failed') >= 0) {
    return 'Não consegui processar essa mensagem agora. Vou registrar o erro técnico para correção. Tente enviar novamente em instantes.';
  }
  return 'N\u00e3o consegui processar esta imagem agora. Vou registrar o erro t\u00e9cnico para corre\u00e7\u00e3o. Tente enviar novamente com boa ilumina\u00e7\u00e3o e o prato mais centralizado.';
}

async function coachInvokeMultimodal(inputType, message, asset) {
  var session = null;
  try { session = (await sb.auth.getSession())?.data?.session || null; } catch(_) {}
  if (!session?.access_token) throw new Error('login_required');
  var payload = {
    user_id: session.user && session.user.id,
    input_type: inputType,
    message: message || '',
    text: message || '',
    message_text: message || '',
    image_url: asset && (inputType === 'image' || inputType === 'camera') ? asset.signedUrl : undefined,
    file_url: asset && inputType === 'file' ? asset.signedUrl : undefined,
    audio_url: asset && (inputType === 'audio' || inputType === 'live_voice') ? asset.signedUrl : undefined,
    asset_url: asset ? asset.signedUrl : undefined,
    signed_url: asset ? asset.signedUrl : undefined,
    bucket: asset ? asset.bucket : undefined,
    storage_path: asset ? asset.path : undefined,
    mime_type: asset ? asset.mime : undefined,
    file_name: asset ? asset.filename : undefined,
    user_context: coachBuildMultimodalContext(),
    nutrition_context: coachBuildNutritionContext(),
    timezone: coachResolvedTimezone(),
    asset_meta: asset || null,
    sound_enabled: !!_coachTTSEnabled
  };
  payload = attachCoachContext(payload);
  var res = await sb.functions.invoke('coach-multimodal-v1', { body: payload });
  if (res.error) throw res.error;
  var data = res.data || {};
  persistCoachContextFromResponse(data);
  if (data.success === false) {
    console.error('[coach-ui] multimodal_failed', data);
    return { reply: data.resposta || data.message || coachRealAiErrorMessage(data), audioUrl: data.audio_url, source: data.source || data.code || 'coach-multimodal-v1-controlled-error' };
  }
  if (data.error && data.resposta) return { reply: data.resposta, audioUrl: data.audio_url, source: data.source || 'coach-multimodal-v1-controlled-error' };
  if (data.error) throw new Error(data.message || data.error);
  var reply = data.resposta || data.text || data.reply || data.response;
  if (!reply) throw new Error('empty_ai_response');
  return { reply: reply, audioUrl: data.audio_url, source: data.source || 'coach-multimodal-v1' };
}

async function coachProcessMultimodal(kind, file, message) {
  if (APP.coachLoading) return;
  var inputType = COACH_MULTIMODAL_TYPE[kind] || kind;
  var label = coachAttachmentLabel(kind, file);
  coachShowAttachment(label);
  APP.coachLoading = true;
  setCoachOrbState('thinking');
  var tid = appendTyping();
  try {
    var asset = file ? await coachUploadMultimodalFile(file, kind) : null;
    appendUserMsg(message || label, {
      imageUrl: asset && (inputType === 'image' || inputType === 'camera') ? asset.signedUrl : null,
      attachmentLabel: label
    });
    var out = await coachInvokeMultimodal(inputType, message || '', asset);
    removeTyping(tid);
    appendBotMsg(out.reply, { audioUrl: out.audioUrl });
    if (_coachTTSEnabled) coachSpeakResponse(out.reply);
  } catch (err) {
    removeTyping(tid);
    var msg = String(err && err.message || err || 'Falha multimodal.');
    toast(msg, 'error', 3600);
    appendBotMsg(coachRealAiErrorMessage(err));
  } finally {
    APP.coachLoading = false;
    coachClearAttachment();
    setCoachOrbState('idle');
    scrollCoachToBottom();
  }
}

function coachHandleFileInput(ev, kind) {
  var file = ev && ev.target && ev.target.files && ev.target.files[0];
  if (!file) return;
  try { coachValidateFile(file); } catch(err) { toast(String(err.message || err), 'error', 3600); return; }
  var inp = document.getElementById('coach-input');
  var msg = inp ? inp.value.trim() : '';
  if (inp) { inp.value = ''; inp.style.height = 'auto'; }
  coachProcessMultimodal(kind, file, msg);
}

async function coachStartQuickAudioCapture() {
  toggleCoachMultimodalMenu(false);
  if (_coachQuickAudio.recorder && _coachQuickAudio.recorder.state === 'recording') {
    _coachQuickAudio.recorder.stop();
    return;
  }
  if (!navigator.mediaDevices || !window.MediaRecorder) {
    toggleCoachRec();
    return;
  }
  try {
    var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    _coachQuickAudio.stream = stream;
    _coachQuickAudio.chunks = [];
    var recorderOptions = {};
    if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/ogg')) recorderOptions.mimeType = 'audio/ogg';
    else if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/mp4')) recorderOptions.mimeType = 'audio/mp4';
    else {
      try { stream.getTracks().forEach(function(t){ t.stop(); }); } catch(_) {}
      toggleCoachRec();
      return;
    }
    var rec = new MediaRecorder(stream, recorderOptions);
    _coachQuickAudio.recorder = rec;
    rec.ondataavailable = function(e) { if (e.data && e.data.size) _coachQuickAudio.chunks.push(e.data); };
    rec.onstop = function() {
      try { stream.getTracks().forEach(function(t){ t.stop(); }); } catch(_) {}
      var blob = new Blob(_coachQuickAudio.chunks, { type: rec.mimeType || 'audio/ogg' });
      var ext = blob.type === 'audio/mp4' ? '.m4a' : '.ogg';
      var file = new File([blob], 'coach-audio-' + Date.now() + ext, { type: blob.type || 'audio/ogg' });
      coachProcessMultimodal('audio', file, '');
    };
    rec.start();
    toast('Gravando áudio. Toque em Áudio novamente para enviar.', 'info', 3000);
  } catch(err) {
    toast('Microfone indisponível. Use o botão de voz.', 'error', 3000);
  }
}

function coachStartLiveVoice() {
  toggleCoachMultimodalMenu(false);
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast(t('toast_no_mic'), 'error', 3000); return; }
  var rec = new SR();
  rec.lang = {pt:'pt-BR',en:'en-US',es:'es-ES',ru:'ru-RU'}[APP.lang] || 'pt-BR';
  rec.interimResults = false;
  rec.continuous = false;
  rec.onresult = function(ev) {
    var txt = ev.results && ev.results[0] && ev.results[0][0] ? ev.results[0][0].transcript : '';
    if (txt.trim()) coachProcessMultimodal('live_voice', null, txt.trim());
  };
  rec.onerror = function() { toast(t('toast_mic_denied'), 'error', 3000); };
  rec.start();
  toast('Falar ao Vivo iniciado.', 'info', 2200);
}

// ── sendCoachMsg ────────────────────────────────────────────────
function sendCoachMsg(txt) {
  var inp = document.getElementById('coach-input');
  var msg = (txt || (inp ? inp.value : '') || '').trim();
  if (!msg || APP.coachLoading) return;
  if (inp) { inp.value = ''; inp.style.height = 'auto'; }
  try { capturePreferenceFromText(msg); coachMemoryService().saveMemory(currentUserId(), 'coach_user_message', { text:msg, intent:coachIntentService().classify(msg) }, { silent:true }); } catch(_) {}
  appendUserMsg(msg);
  APP.coachLoading = true;
  setCoachOrbState('thinking');
  var tid = appendTyping();
  coachGetAIResp(msg).then(function(resp) {
    removeTyping(tid);
    setCoachOrbState('responding');
    appendBotMsg(resp);
    APP.coachLoading = false;
    setTimeout(function(){ setCoachOrbState('idle'); }, 450);
    if (typeof addXP === 'function') addXP(5);
    // Resposta em áudio via TTS se ativado
    if (_coachTTSEnabled) coachSpeakResponse(resp);
  }).catch(function() {
    removeTyping(tid);
    var fallback = coachLocalFallback(msg) || coachRealAiErrorMessage('coach_text_request_failed', 'text');
    setCoachOrbState('responding');
    appendBotMsg(fallback);
    APP.coachLoading = false;
    setTimeout(function(){ setCoachOrbState('idle'); }, 450);
    if (_coachTTSEnabled) coachSpeakResponse(fallback);
  });
}
window.sendCoach = sendCoachMsg;

// ── coachSpeakResponse — TTS da resposta ────────────────────────
function coachSpeakResponse(text) {
  if (!text || !window.speechSynthesis) return;
  // Remove emojis e markdown para TTS mais limpo
  var clean = text
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u2600-\u27BF]/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ', ')
    .trim();
  if (!clean || clean.length < 5) return;
  window.speechSynthesis.cancel();
  var utt = new SpeechSynthesisUtterance(clean);
  utt.lang = localeForLang();
  utt.rate = 1.0;
  utt.pitch = 1.0;
  // Escolhe voz no idioma atual se disponível
  var voices = window.speechSynthesis.getVoices();
  var langPrefix = localeForLang().slice(0,2);
  var chosenVoice = voices.find(function(v){ return v.lang && v.lang.toLowerCase().startsWith(langPrefix); });
  if (chosenVoice) utt.voice = chosenVoice;
  window.speechSynthesis.speak(utt);
}

// ── appendUserMsg ───────────────────────────────────────────────
function appendUserMsg(text, opts) {
  opts = opts || {};
  var time = new Date().toLocaleTimeString(localeForLang(),{hour:'2-digit',minute:'2-digit'});
  var entry = { role:'user', text:text, time:time };
  if (opts.imageUrl) entry.image = opts.imageUrl;
  if (opts.attachmentLabel) entry.attachmentLabel = opts.attachmentLabel;
  APP.coachMsgs.push(entry);
  var msgs = document.getElementById('coach-msgs');
  if (!msgs) return;
  var div = document.createElement('div');
  div.className = 'msg-wrap user';
  var imageHtml = opts.imageUrl ? '<img src="'+escapeAttr(opts.imageUrl)+'" class="chat-image" alt="Refeição do usuário">' : '';
  div.innerHTML = '<div class="msg-bubble">'+imageHtml+escapeHtml(text).replace(/\n/g,'<br>')+'</div><div class="msg-time">'+escapeHtml(time)+'</div>';
  msgs.appendChild(div);
  scrollCoachToBottom();
}

// ── appendBotMsg ────────────────────────────────────────────────
function appendBotMsg(text, opts) {
  opts = opts || {};
  text = repairI18n(text);
  var time = new Date().toLocaleTimeString(localeForLang(),{hour:'2-digit',minute:'2-digit'});
  var entry = { role:'ai', text:text, time:time };
  if (opts.audioUrl) entry.audio = opts.audioUrl;
  APP.coachMsgs.push(entry);
  var msgs = document.getElementById('coach-msgs');
  if (!msgs) return;
  var div = document.createElement('div');
  div.className = 'msg-wrap ai';
  var parsed = formatCoachMsg(text);
  var audioHtml = opts.audioUrl ? '<div style="margin-top:6px"><audio controls src="'+escapeAttr(opts.audioUrl)+'" style="max-width:220px;height:36px;border-radius:8px"></audio></div>' : '';
  div.innerHTML = '<div class="msg-bubble ai-bubble">'+parsed+audioHtml+'</div><div class="msg-time">'+escapeHtml(time)+'</div>';
  msgs.appendChild(div);
  scrollCoachToBottom();
}

function formatCoachMsg(text) {
  var s = escapeHtml(text || '');
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
  s = s.replace(/^### (.+)$/gm, '<div style="font-size:15px;font-weight:700;color:var(--green);margin:10px 0 4px">$1</div>');
  s = s.replace(/^## (.+)$/gm, '<div style="font-size:16px;font-weight:700;color:var(--green);margin:12px 0 6px">$1</div>');
  s = s.replace(/^[-\u2022] (.+)$/gm, '<div style="padding-left:12px;text-indent:-12px;margin:4px 0">\u2022 $1</div>');
  s = s.replace(/^(\d+)\. (.+)$/gm, '<div style="padding-left:18px;text-indent:-18px;margin:4px 0"><strong style="color:var(--green)">$1.</strong> $2</div>');
  s = s.replace(/\n/g, '<br>');
  return s;
}

// ── appendTyping / removeTyping ─────────────────────────────────
function appendTyping() {
  var msgs = document.getElementById('coach-msgs');
  if (!msgs) return null;
  var id = 'typing-'+Date.now();
  var div = document.createElement('div');
  div.className = 'msg-wrap ai'; div.id = id;
  div.innerHTML = '<div class="msg-bubble"><div class="typing-dots"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div></div>';
  msgs.appendChild(div);
  scrollCoachToBottom();
  return id;
}
function removeTyping(id) { if (id) { var el=document.getElementById(id); if(el) el.remove(); } }
function scrollCoachToBottom() {
  var msgs = document.getElementById('coach-msgs');
  if (msgs) setTimeout(function(){ msgs.scrollTop=msgs.scrollHeight; }, 30);
}
function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g,'&#39;');
}

// ── coachTTS (alias) ────────────────────────────────────────────
function coachTTS(t) { coachSpeakResponse(typeof t==='string'?t:''); }
function playAudioMsg(url) { if(url) new Audio(url).play().catch(function(){}); }

// ── Coach Voice — SpeechRecognition ────────────────────────────
function toggleCoachRec() {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast(t('toast_no_mic'), 'error', 3000); return; }
  if (window._vitActive) {
    if (window._vitRec) try { window._vitRec.abort(); } catch(x){}
    window._vitActive = false;
    var b1 = document.getElementById('coach-mic-btn');
    if (b1) { b1.classList.remove('recording'); b1.innerHTML = coachIcon('mic'); }
    var r1 = document.getElementById('rec-indicator');
    if (r1) r1.classList.remove('active');
    return;
  }
  var rec = new SR();
  rec.lang = {pt:'pt-BR',en:'en-US',es:'es-ES',ru:'ru-RU'}[APP.lang] || 'pt-BR';
  rec.interimResults = false;
  window._vitRec = rec;
  rec.onstart = function() {
    window._vitActive = true;
    var b2 = document.getElementById('coach-mic-btn');
    if (b2) { b2.classList.add('recording'); b2.textContent = '\u23F9'; }
    var r2 = document.getElementById('rec-indicator');
    if (r2) r2.classList.add('active');
  };
  rec.onresult = function(ev) {
    var txt = ev.results[0][0].transcript;
    if (txt && txt.trim()) sendCoachMsg(txt.trim());
  };
  rec.onerror = function(ev) {
    if (ev.error === 'not-allowed') toast(t('toast_mic_denied'), 'error');
    window._vitActive = false;
    var b3 = document.getElementById('coach-mic-btn');
    if (b3) { b3.classList.remove('recording'); b3.innerHTML = coachIcon('mic'); }
  };
  rec.onend = function() {
    window._vitActive = false;
    var b4 = document.getElementById('coach-mic-btn');
    if (b4) { b4.classList.remove('recording'); b4.innerHTML = coachIcon('mic'); }
    var r4 = document.getElementById('rec-indicator');
    if (r4) r4.classList.remove('active');
  };
  try { rec.start(); } catch(ex) { toast('Erro: ' + ex.message, 'error'); }
}
function startCoachRecording() { toggleCoachRec(); }
function stopCoachRecording() { if (window._vitActive) toggleCoachRec(); }
// ── sendAudioToBackend — Groq Whisper + resposta em áudio ───────
async function sendAudioToBackend(blob) {
  try {
    if (!blob) throw new Error('empty_audio');
    toast(t('coach_audio_unavailable'), 'info', 3500);
    return { ok:false, fallback:'text' };
  } catch(e) {
    toast(t('coach_audio_unavailable'), 'info', 3500);
    return { ok:false, fallback:'text' };
  }
}

// ── API Keys ────────────────────────────────────────────────────

var COACH_URL = SUPABASE_URL + '/functions/v1/coach-multimodal-v1';
function normalizeCoachText(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function classifyNutritionIntent(msg) {
  var m = normalizeCoachText(msg);
  var has = function(re) { return re.test(m); };
  if (has(/\b(detox|suco|bebida|shake|smoothie|desinchar|liquido|liquida|cha|limao|gengibre|couve|hortela|suco verde)\b/)) {
    if (has(/\b(proteico|proteina|whey|massa|hipertrofia)\b/)) return 'protein_drink';
    if (has(/\b(agua|hidrat|sede|eletrolito|isotonico)\b/)) return 'hydration_help';
    return has(/\b(detox|desinchar|suco verde|couve|gengibre|hortela|limao)\b/) ? 'drink_detox' : 'juice';
  }
  if (has(/\b(agua|hidrat|sede|beber)\b/)) return 'hydration';
  if (has(/\b(jejum|fasting|janela alimentar)\b/)) return 'fasting';
  if (has(/\b(whey|creatina|suplement|aminoacido|bcaa)\b/)) return 'supplement';
  if (has(/\b(proteina|hipertrofia|massa|musculo)\b/)) return 'protein_meal';
  if (has(/\b(lanche|snack)\b/)) return 'snack';
  if (has(/\b(receita|cardapio|almoco|jantar|cafe|refeicao|comer)\b/)) return 'recipe_food';
  if (has(/\b(motiv|foco|disciplina|desanim)\b/)) return 'motivation';
  if (has(/\b(analise|macros|calorias|nutrientes)\b/)) return 'nutrition_analysis';
  return 'meal';
}

function isDrinkCoachIntent(intent) {
  return ['drink_detox','detox','juice','protein_drink','hydration_help'].indexOf(intent) >= 0;
}

function coachLastResponseWasLiquid() {
  if (APP.lastCoachIntent && isDrinkCoachIntent(APP.lastCoachIntent)) return true;
  var last = '';
  for (var i = (APP.coachMsgs || []).length - 1; i >= 0; i--) {
    if (APP.coachMsgs[i] && APP.coachMsgs[i].role !== 'user') {
      last = normalizeCoachText(APP.coachMsgs[i].text || '');
      break;
    }
  }
  // padrão ampliado: títulos e corpos de receitas líquidas sem as frases antigas
  return /(\b(nome do suco|suco|sucos|detox|receita liquida|liquidificador|bata tudo|smoothie|shake|juice|blender|blend everything|liquid recipe|jugo|licuado|licuadora|bate todo)\b|сок|смузи|блендер|взбейте)/.test(last);
}

function isLiquidCoachMessage(msg, intent) {
  var m = normalizeCoachText(msg);
  if (isDrinkCoachIntent(intent)) return true;
  if (/\b(suco|sucos|detox|bebida|bebidas|smoothie|smoothies|shake|shakes|cha|limao|salsao|gengibre|hortela|couve|juice|juices|drink|drinks|jugo|jugos|licuado|licuados|water|lemon|ginger|mint|celery|carrot|apple|cucumber|limon|apio|zanahoria|manzana|pepino|menta|jengibre)\b|сок|сока|напиток|смузи|лимон|имбир|мят|сельдере|морков|яблок|огурец|огурц|свекл/.test(m)) return true;
  if (coachLastResponseWasLiquid() && /(\b(outra|outras|outro|mais uma|mais um|outra opcao|nova opcao|com limao|com salsao|com gengibre|com hortela|another|another option|give me another|one more|other option|a different one|with lemon|with celery|with ginger|with mint|otra|otra opcion|una mas|una opcion diferente|con limon|con apio|con jengibre|con menta)\b|\u0434\u0440\u0443\u0433\u043e\u0439|\u0435\u0449\u0451 \u043e\u0434\u0438\u043d|\u0435\u0449\u0451 \u043e\u0434\u043d\u0443|\u0434\u0440\u0443\u0433\u043e\u0439 \u0432\u0430\u0440\u0438\u0430\u043d\u0442|\u0434\u0430\u0439 \u0434\u0440\u0443\u0433\u043e\u0439|\u043f\u043e\u043a\u0430\u0436\u0438 \u0434\u0440\u0443\u0433\u043e\u0439|с лимон|с сельдере|с имбир|с мят)/.test(m)) return true;
  return false;
}

function requestedLiquidIngredientFromCoachText(msg) {
  var m = normalizeCoachText(msg);
  // PT
  if (/\bsalsao\b/.test(m)) return 'salsão';
  if (/\blimao\b/.test(m)) return 'limão';
  if (/\bgengibre\b/.test(m)) return 'gengibre';
  if (/\bhortela\b/.test(m)) return 'hortelã';
  if (/\bchia\b/.test(m)) return 'chia';
  if (/\blinhaca\b/.test(m)) return 'linhaça';
  if (/\bbeterraba\b/.test(m)) return 'beterraba';
  if (/\bcenoura\b/.test(m)) return 'cenoura';
  if (/\bpepino\b/.test(m)) return 'pepino';
  if (/\bmaca\b/.test(m)) return 'maçã';
  if (/\blaranja\b/.test(m)) return 'laranja';
  if (/\bapio\b/.test(m)) return 'salsão';
  // EN
  if (/\blemon\b/.test(m)) return 'lemon';
  if (/\bginger\b/.test(m)) return 'ginger';
  if (/\bmint\b/.test(m)) return 'mint';
  if (/\bcelery\b/.test(m)) return 'celery';
  if (/\bcarrot\b/.test(m)) return 'carrot';
  if (/\bapple\b/.test(m)) return 'apple';
  if (/\bcucumber\b/.test(m)) return 'cucumber';
  if (/\bbeetroot\b|beet\b/.test(m)) return 'beetroot';
  if (/\borange\b/.test(m)) return 'orange';
  if (/\bkale\b/.test(m)) return 'kale';
  if (/\bspinach\b/.test(m)) return 'spinach';
  // ES
  if (/\blimon\b/.test(m)) return 'limón';
  if (/\bjengibre\b/.test(m)) return 'jengibre';
  if (/\bmenta\b/.test(m)) return 'menta';
  if (/\bapio\b/.test(m)) return 'apio';
  if (/\bzanahoria\b/.test(m)) return 'zanahoria';
  if (/\bmanzana\b/.test(m)) return 'manzana';
  if (/\bpepino\b/.test(m)) return 'pepino';
  if (/\bremolacha\b/.test(m)) return 'remolacha';
  if (/\bnaranja\b/.test(m)) return 'naranja';
  if (/\bespinaca\b/.test(m)) return 'espinaca';
  // RU — Cyrillic preserved by normalizeCoachText (NFD + diacritics only)
  if (/лимон/.test(msg)) return 'lemon';
  if (/имбир/.test(msg)) return 'ginger';
  if (/мят/.test(msg)) return 'mint';
  if (/сельдере/.test(msg)) return 'celery';
  if (/морков/.test(msg)) return 'carrot';
  if (/яблок/.test(msg)) return 'apple';
  if (/огурец|огурц/.test(msg)) return 'cucumber';
  if (/свекл/.test(msg)) return 'beetroot';
  if (/апельсин/.test(msg)) return 'orange';
  if (/шпинат/.test(msg)) return 'spinach';
  return '';
}

function requestedCoachRecipeCount(msg) {
  var m = normalizeCoachText(msg);
  var words = { uma:1, um:1, duas:2, dois:2, tres:3, quatro:4, cinco:5 };
  for (var k in words) if (new RegExp('\\b' + k + '\\b').test(m)) return words[k];
  var n = m.match(/\b([1-5])\b/);
  return n ? Number(n[1]) : 1;
}

function recentCoachAssistantText() {
  return (APP.coachMsgs || [])
    .filter(function(m) { return m.role !== 'user'; })
    .map(function(m) { return normalizeCoachText(m.text || ''); })
    .join('\n');
}

function coachIntentRules(intent) {
  if (isDrinkCoachIntent(intent)) {
    return [
      '',
      'INTENCAO DETECTADA: ' + intent + '.',
      'REGRA CRITICA: se o usuario pedir suco, detox, bebida, smoothie, shake, cha ou algo para desinchar, responda exclusivamente com receita liquida/bebida relacionada ao pedido.',
      'Nunca substitua esse pedido por refeicao solida. Proibido sugerir arroz, frango, bowl, almoco, jantar, batata doce ou prato montado quando a intencao for bebida.',
      'Para bebida, entregue primeiro: nome da bebida, ingredientes em ml/copos/folhas/fatias, preparo no liquidificador/infusao, melhor horario e beneficio simples.',
      'Se o usuario mudar de assunto para bebida, nao puxe refeicoes antigas como centro da resposta; use o historico apenas se for realmente util.'
    ].join('\n');
  }
  return '\nINTENCAO DETECTADA: ' + intent + '. Responda exatamente ao pedido atual antes de usar contexto anterior.';
}

function detoxDrinkFallback(msg, intent) {
  var p = APP.profile || {};
  var rawName = p.name || p.nome || APP.user?.name || APP.user?.email?.split('@')[0] || 'Usuário';
  var nome = String(rawName).split(' ')[0] || 'Usuário';
  var count = Math.max(1, Math.min(requestedCoachRecipeCount(msg), 5));
  var lang = (typeof getUserLanguage === 'function' ? getUserLanguage() : null) || APP.lang || 'pt';
  var lbl = {
    pt: { intro1: 'Claro, ', intro2: '! Aqui vai ', single: 'uma receita líquida', multi: 'uma seleção líquida', suffix: ' do jeito que você pediu, sem trocar por prato sólido.', ingredients: '**Ingredientes**', prep: '**Preparo**', why: '**Por que funciona**', option: 'Opção', mission: '\n\n**Sua única missão agora:** escolha uma opção e tome com calma.' },
    en: { intro1: 'Here ', intro2: ', ', single: 'is a liquid recipe for you', multi: 'are some liquid options for you', suffix: ', no solid food substitution.', ingredients: '**Ingredients**', prep: '**Preparation**', why: '**Why it works**', option: 'Option', mission: '\n\n**Your only mission now:** pick one option and enjoy it calmly.' },
    es: { intro1: 'Aquí ', intro2: ', ', single: 'hay una receta líquida para ti', multi: 'hay opciones líquidas para ti', suffix: ', sin reemplazar por comida sólida.', ingredients: '**Ingredientes**', prep: '**Preparación**', why: '**Por qué funciona**', option: 'Opción', mission: '\n\n**Tu única misión ahora:** elige una opción y tómala con calma.' },
    ru: { intro1: 'Вот ', intro2: ', ', single: 'жидкий рецепт для вас', multi: 'варианты жидких рецептов для вас', suffix: ', без замены на твёрдую пищу.', ingredients: '**Ингредиенты**', prep: '**Приготовление**', why: '**Почему это работает**', option: 'Вариант', mission: '\n\n**Ваше единственное задание сейчас:** выберите один вариант и выпейте не торопясь.' }
  }[lang] || {
    intro1: 'Here ', intro2: ', ', single: 'is a liquid recipe for you', multi: 'are some liquid options for you', suffix: '.', ingredients: '**Ingredients**', prep: '**Preparation**', why: '**Why it works**', option: 'Option', mission: '\n\n**Your only mission now:** pick one and enjoy.'
  };
  var history = recentCoachAssistantText();
  var options = [
    {title:'Suco Detox Verde', kcal:'42 kcal', items:['250ml de água gelada','1 folha de couve','suco de 1 limão','1 fatia pequena de gengibre','4 folhas de hortelã','gelo'], prep:'Bata tudo no liquidificador por 40 segundos e tome sem coar.', why:'Ajuda hidratação, digestão e sensação de leveza sem virar refeição sólida.'},
    {title:'Detox Abacaxi com Pepino', kcal:'68 kcal', items:['250ml de água de coco natural','2 rodelas de abacaxi','1/3 de pepino','hortelã','gelo'], prep:'Bata tudo até ficar uniforme e não adicione açúcar.', why:'É refrescante e ajuda a reduzir sensação de inchaço pelo reforço de líquidos.'},
    {title:'Chá Gelado de Hibisco com Limão', kcal:'18 kcal', items:['250ml de chá de hibisco frio','suco de 1/2 limão','3 folhas de hortelã','gelo'], prep:'Prepare o chá, espere esfriar e misture limão, hortelã e gelo.', why:'É uma bebida leve para o fim do dia, com sabor marcante e quase nenhuma caloria.'},
    {title:'Smoothie Verde Cremoso', kcal:'145 kcal', items:['180ml de água gelada','1/2 maçã verde','1/2 banana pequena','1 punhado de espinafre','gengibre pequeno','gelo'], prep:'Bata tudo até ficar cremoso e tome na hora.', why:'Boa opção líquida quando você quer mais saciedade que um suco simples.'},
    {title:'Shake Proteico Leve', kcal:'260 kcal | 28g proteína', items:['250ml de água gelada ou leite sem lactose','1 scoop de whey ou 170g de iogurte grego','1/2 banana','1 colher de sopa de aveia','canela e gelo'], prep:'Bata tudo por 30 a 45 segundos.', why:'Ajuda saciedade e recuperação muscular sem virar prato pesado.'}
  ];
  var m = normalizeCoachText(msg);
  if (intent === 'protein_drink') options = options.filter(function(o){ return /shake/i.test(o.title); });
  else if (/cha|dormir/.test(m)) options = options.filter(function(o){ return /cha/i.test(o.title); });
  else if (/smoothie/.test(m)) options = options.filter(function(o){ return /smoothie/i.test(o.title); });
  else if (intent === 'hydration_help') options = options.filter(function(o){ return /abacaxi|verde/i.test(o.title); });
  var fresh = options.filter(function(o){ return history.indexOf(normalizeCoachText(o.title)) < 0; });
  var list = (fresh.length ? fresh : options).slice(0, count);
  var blocks = list.map(function(o, idx) {
    return (count > 1 ? '\n\n**' + lbl.option + ' ' + (idx + 1) + ' - ' + o.title + '**' : '\n\n**' + o.title + '**') +
      '\n' + o.kcal +
      '\n\n' + lbl.ingredients + '\n' + o.items.map(function(x){ return '- ' + x; }).join('\n') +
      '\n\n' + lbl.prep + '\n' + o.prep +
      '\n\n' + lbl.why + '\n' + o.why;
  }).join('\n');
  var introText = lang === 'pt'
    ? lbl.intro1 + nome + lbl.intro2 + (count > 1 ? lbl.multi : lbl.single) + lbl.suffix
    : lbl.intro1 + (count > 1 ? lbl.multi : lbl.single) + (nome ? ' (' + nome + ')' : '') + lbl.suffix;
  return introText + blocks + lbl.mission;
}

function asksLastRecipeExplanation(msg) {
  var m = normalizeCoachText(msg);
  // PT
  if (/por que (esse|este|aquele|o|esse suco|esta receita|o suco|a receita)|por que serve|explica|me explique|beneficio|beneficios|para que serve|o que faz/.test(m)) return true;
  // EN
  if (/why (is|does|this|that|the|it)|explain why|what does it do|benefits of|good for (my |health|me)|how does it help|what are the benefits/.test(m)) return true;
  // ES
  if (/por que (es|sirve|ayuda|este|esta)|explica|explicame|cuales son los beneficios|para que sirve|que hace/.test(m)) return true;
  // RU — test on raw msg (Cyrillic preserved)
  if (/почему|объясни|объяснит|польза|для чего|что дает|как помогает|зачем/.test(msg)) return true;
  return false;
}

function validateCoachIntentResponse(intent, reply) {
  var r = normalizeCoachText(reply);
  if (!isDrinkCoachIntent(intent)) {
    return true;
  }
  var forbidden = /\b(almoco|jantar|bowl|arroz|frango|tilapia|sardinha|carne|peru|atum|cuscuz|feijao|batata doce|prato montado|grelhado|assado)\b/;
  if (!(/(\b(nome do suco|suco detox|juice name|juice|drink name|nombre del jugo|nombre del suco|bebida)\b|\u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0441\u043e\u043a\u0430|\u043d\u0430\u043f\u0438\u0442\u043e\u043a)/.test(r))) return false;
  var liquidTerms = [
    // PT
    'agua','limao','gengibre','hortela','couve','liquidificador','ml','copo','bebida','cha','suco','shake','smoothie','gelo',
    // EN
    'water','lemon','ginger','mint','kale','blender','cup','drink','tea','juice','celery','carrot','apple','cucumber',
    // ES
    'limon','apio','zanahoria','manzana','pepino','menta','jengibre','vaso','licuadora','jugo','licuado',
    // RU
    'вода','лимон','имбирь','мята','сок','блендер','стакан','напиток','сельдерей','морковь','яблоко','огурец','свекла'
  ];
  var hits = liquidTerms.reduce(function(n, term) { return n + (r.indexOf(term) >= 0 ? 1 : 0); }, 0);
  return !forbidden.test(r) && hits >= 2;
}
// ── buildSystemPrompt — personalizado por perfil ─────────────────
function buildSystemPrompt(intent) {
  var p = APP.profile || {};
  var lang = getUserLanguage() || APP.lang || 'pt';
  var unitCtx = unitContext(lang);
  var units = unitCtx.system === 'imperial' ? 'kcal, g, fl oz, lb, ft/in, miles' : ({pt:'kcal, g, ml, kg, cm, km, copos', es:'kcal, g, ml, kg, cm, km, vasos', ru:'ккал, г, мл, кг, см, км, стаканов'}[lang] || 'kcal, g, ml, kg, cm, km');
  var nome = p.name || t('gen_user');
  var peso = p.weight || p.peso || 'n/a';
  var altura = p.height || p.altura || 'n/a';
  var idade = p.age || p.idade || 'n/a';
  var goalDict = {
    pt:{lose:'Emagrecimento',gain:'Ganho de Massa',maintain:'Manutenção',health:'Saúde geral'},
    en:{lose:'Weight loss',gain:'Muscle gain',maintain:'Maintenance',health:'General health'},
    es:{lose:'Pérdida de peso',gain:'Ganar masa',maintain:'Mantenimiento',health:'Salud general'},
    ru:{lose:'Снижение веса',gain:'Набор массы',maintain:'Поддержание',health:'Общее здоровье'}
  };
  var objetivo = (goalDict[lang] && goalDict[lang][p.goal]) || 'n/a';
  normalizeMeals();
  var totalCal = sumKcal(APP.meals || []);
  var metaCal = (APP.calc && APP.calc.cal) ? APP.calc.cal : 2000;
  var noneMeal = {pt:'Nenhuma.', en:'None.', es:'Ninguna.', ru:'Нет.'}[lang] || 'None.';
  var mealsStr = APP.meals && APP.meals.length > 0 ? APP.meals.map(function(m){return m.time+' - '+m.name+' ('+getKcal(m)+'kcal)'}).join('; ') : noneMeal;
  var globalCtx = {};
  try { globalCtx = coachContextService().build(); } catch(_) {}
  return [
    'Voc\u00ea \u00e9 o COACH IA, Nutricionista Chefe do VitalIA.',
    'IDIOMA_OBRIGATORIO=' + lang + '. Responda 100% neste idioma, sem misturar portugu\u00eas quando o idioma for en/es/ru.',
    'UNIDADES_DO_IDIOMA=' + units + '.',
    'Seja emp\u00e1tico, acolhedor e cient\u00edfico.',
    '',
    'REGRAS: 1) Empatia extrema 2) Autoridade did\u00e1tica 3) Limite escopo a sa\u00fade/nutri\u00e7\u00e3o',
    '4) Receitas no formato: \ud83c\udf73 Nome / \u23f1 Tempo / \ud83d\udccb Ingredientes / \ud83d\udc68\u200d\ud83c\udf73 Preparo / \ud83d\udcca Nutri\u00e7\u00e3o',
    '5) Responda perguntas diretas logo na primeira frase e termine com uma ação prática, não com pergunta.',
    '6) Se o usuario pedir suco, detox, bebida, smoothie ou shake, responda exclusivamente com receitas liquidas relacionadas ao pedido. Nunca substitua por refeicoes solidas.',
    '7) Saudacao dinamica: use apenas o nome de PERFIL. Se nao houver nome, use amigo/usuario. Nunca invente nome proprio fixo.',
    '8) Se o usuario pedir uma, duas, tres ou mais receitas, entregue exatamente a quantidade solicitada antes da explicacao.',
    '',
    'PERFIL: ' + nome + ' | ' + formatWeight(peso, lang) + ' | ' + formatHeight(altura, lang) + ' | ' + idade + ' anos | ' + objetivo,
    'HOJE: ' + totalCal + '/' + metaCal + ' kcal | Refei\u00e7\u00f5es: ' + mealsStr,
    '\u00c1gua: ' + formatVolumeMl((APP.water||0) * 250, lang),
    'CONTEXTO_VITALIA=' + JSON.stringify(globalCtx),
    '',
    'Use **negrito**, quebras de linha, m\u00e1x 300 palavras. JAMAIS diga "consulte um nutricionista".',
    coachIntentRules(intent || 'meal')
  ].join('\n');
}

// ── coachGetAIResp ───────────────────────────────────────────────
async function coachGetAIResp(msg) {
  var intent = (coachIntentService && coachIntentService().classify(msg)) || classifyNutritionIntent(msg);
  var strictLiquidOnly = isLiquidCoachMessage(msg, intent);
  var explainLastRecipe = asksLastRecipeExplanation(msg) && (APP.coachMsgs || []).some(function(m) { return m && m.role !== 'user' && /\b(nome da receita|nome do suco|recipe name|juice name|nombre de la receta|nombre del jugo)\b|\u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435/.test(normalizeCoachText(m.text || '')); });
  if (strictLiquidOnly && !isDrinkCoachIntent(intent)) intent = 'drink_detox';
  var sp = buildSystemPrompt(intent);
  if (!APP.chatHistory) APP.chatHistory = [];
  if (isDrinkCoachIntent(intent)) {
    APP.chatHistory = APP.chatHistory.filter(function(h) {
      var txt = h && h.parts && h.parts[0] && h.parts[0].text ? normalizeCoachText(h.parts[0].text) : '';
      return !/\b(arroz|frango|bowl|almoco|jantar|batata doce|prato montado)\b/.test(txt);
    }).slice(-4);
  }
  APP.chatHistory.push({ role: 'user', parts: [{ text: msg }] });
  if (APP.chatHistory.length > 10) APP.chatHistory = APP.chatHistory.slice(-10);
  var coachLang = getUserLanguage() || APP.lang || 'pt';
  var coachUnits = unitContext(coachLang);
  var payload = { prompt: sp, intent: intent, context: (coachContextService ? coachContextService().build() : {}), history: APP.chatHistory, mensagem: msg, lang: coachLang, timezone: coachResolvedTimezone(), units: coachUnits, explain_last_recipe: explainLastRecipe, meta: { client_ts:new Date().toISOString(), app_version:CONFIG.APP_VERSION, unit_system:coachUnits.system, intent:intent, explain_last_recipe: explainLastRecipe }, profile: APP.profile || {}, calc: APP.calc || {}, meals: APP.meals || [], water: APP.water || 0 };
  try {
    var startedAt = performance.now();
    var session = null;
    try { session = (await sb.auth.getSession())?.data?.session || null; } catch(_) {}
    if (!session?.access_token) throw new Error('login_required');
    var headers = { 'Content-Type': 'application/json' };
    if (session?.access_token) headers.Authorization = 'Bearer ' + session.access_token;
    try {
      var elitePayload = {
        mensagem: msg,
        lang: coachLang,
        timezone: coachResolvedTimezone(),
        units: coachUnits,
        profile: APP.profile || {},
        calc: APP.calc || {},
        meals: APP.meals || [],
        water: APP.water || 0,
        appContext: (coachContextService ? coachContextService().build() : {}),
        meta: {
          client_ts: new Date().toISOString(),
          app_version: CONFIG.APP_VERSION,
          unit_system: coachUnits.system,
          intent: intent
        }
      };
      var elite = await sb.functions.invoke('coach-elite-v11', { body: elitePayload });
      var eliteData = elite && elite.data ? elite.data : {};
      var eliteReply = eliteData.resposta || eliteData.reply || eliteData.response;
      if (!elite.error && eliteReply) {
        eliteReply = repairI18n(eliteReply);
        if (strictLiquidOnly && !validateCoachIntentResponse(intent, eliteReply)) {
          eliteReply = detoxDrinkFallback(msg, intent);
        }
        APP.lastCoachIntent = intent;
        vitaliaLogEvent('info', 'coach_elite_call', 'coach_elite_success', { intent: intent, response_ms: Math.round(performance.now() - startedAt), source: eliteData.source || 'coach-elite-v11', success: true, units: coachUnits.system });
        APP.chatHistory.push({ role: 'model', parts: [{ text: eliteReply }] });
        if (APP.chatHistory.length > 10) APP.chatHistory = APP.chatHistory.slice(-10);
        return eliteReply;
      }
    } catch(eliteErr) {
      console.warn('[Coach Elite text error]', eliteErr);
    }
    var response = await fetch(COACH_URL, { method: 'POST', headers: headers, body: JSON.stringify(payload) });
    var raw = '';
    try { raw = await response.text(); } catch(_) {}
    var d = {};
    try { d = raw ? JSON.parse(raw) : {}; } catch(_) { d = {}; }
    var reply = d.resposta || d.response || d.reply;
    if (reply) {
      vitaliaLogEvent('info', 'coach_call', 'coach_success', { intent:intent, response_ms:Math.round(performance.now() - startedAt), status:response.status, source:d.source || d.model || 'unknown', success:true, units:coachUnits.system });
      reply = repairI18n(reply);
      if ((strictLiquidOnly || isDrinkCoachIntent(intent)) && !validateCoachIntentResponse(intent, reply)) reply = detoxDrinkFallback(msg, intent);
      APP.lastCoachIntent = intent;
      APP.chatHistory.push({ role: 'model', parts: [{ text: reply }] });
      try { coachMemoryService().saveMemory(currentUserId(), 'coach_answer', { intent:intent, text:String(reply).slice(0, 1200) }, { silent:true }); } catch(_) {}
      if (APP.chatHistory.length > 10) APP.chatHistory = APP.chatHistory.slice(-10);
      return reply;
    }
    if (!response.ok) { console.error('API:', response.status, raw); throw new Error((d && (d.message || d.error)) || ('HTTP ' + response.status)); }
    throw new Error('Empty');
  } catch(err) {
    console.error(err);
    vitaliaLogEvent('error', 'coach_call', 'coach_failure', { intent:intent, response_ms:typeof startedAt !== 'undefined' ? Math.round(performance.now() - startedAt) : null, error:String(err?.message || err).slice(0, 500), success:false, units:coachUnits.system });
    if (APP.chatHistory.length > 0 && APP.chatHistory[APP.chatHistory.length-1].role === 'user') APP.chatHistory.pop();
    APP.lastCoachIntent = intent;
    return coachLocalFallback(msg) || coachRealAiErrorMessage(err, 'text');
  }
}

function coachLocalFallback(msg) {
  var p = APP.profile || {};
  var rawName = p.name || p.nome || APP.user?.name || APP.user?.email?.split('@')[0] || 'Usuário';
  var nome = String(rawName).split(' ')[0] || 'Usuário';
  var peso = Number(p.peso || p.weight || 78);
  var gender = String(p.gender || p.genero || '').toLowerCase();
  var m = String(msg || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  var tone = gender.indexOf('f') === 0 || gender.indexOf('mulher') >= 0
    ? 'Vou cuidar disso com equilibrio, energia e respeito ao seu corpo.'
    : 'Vamos resolver isso com disciplina simples, sem complicar sua rotina.';
  var mission = '\n\n**Sua unica missao agora:** beba um copo de agua e escolha a proteina da proxima refeicao. Vamos juntos.';
  var intent = classifyNutritionIntent(msg);
  var lang = (typeof getUserLanguage === 'function' ? getUserLanguage() : null) || APP.lang || 'pt';

  // Non-PT users: return multilingual structured fallback instead of PT hardcoded branches
  if (lang !== 'pt') {
    if (isDrinkCoachIntent(intent)) return detoxDrinkFallback(msg, intent);
    var fallbackMsg = {
      en: nome + ', I\'m processing your request. For best results with your nutrition goal, focus on lean protein (chicken, eggs, fish, Greek yogurt) in your next meal, keep water intake steady throughout the day, and let me know if you\'d like a specific recipe or guidance.\n\n**Your only mission now:** have a protein-rich meal and stay hydrated.',
      es: nome + ', estoy procesando tu solicitud. Para mejores resultados con tu objetivo nutricional, enfócate en proteína magra (pollo, huevos, pescado, yogur griego) en tu próxima comida, mantén la hidratación durante el día y avísame si quieres una receta específica.\n\n**Tu única misión ahora:** come una comida rica en proteína y mantente hidratado.',
      ru: nome + ', обрабатываю ваш запрос. Для лучших результатов с вашей целью по питанию сосредоточьтесь на нежирном белке (курица, яйца, рыба, греческий йогурт) в следующем приёме пищи, пейте воду в течение дня и скажите мне, если хотите конкретный рецепт.\n\n**Ваше единственное задание сейчас:** поешьте белковую пищу и не забывайте про воду.'
    }[lang] || (nome + ', I\'m here to help with your nutrition. Tell me what you need: recipe, juice, weight loss, muscle gain, hydration or energy. Let\'s keep it simple.\n\n**Your only mission now:** drink water and choose your next protein source.');
    return fallbackMsg;
  }

  if (isDrinkCoachIntent(intent)) {
    return detoxDrinkFallback(msg, intent);
  }

  if (m.match(/receita|jantar|almoco|cafe|lanche|cardapio|refeicao|coxinha/)) {
    return 'Claro, ' + nome + '. Vou te passar uma receita de jantar simples, gostosa e alinhada com sua meta. ' + tone + '\n\n**Frango Cremoso com Legumes e Arroz Medido**\n520 kcal | 48g de proteina | 46g de carboidratos | 15g de gorduras\n\n**Ingredientes**\n- 160g de peito de frango em cubos\n- 110g de arroz integral cozido\n- 180g de legumes verdes\n- 1 colher de cha de azeite\n- Limao, alho, cheiro-verde e sal leve\n\n**Como preparar**\n1. Tempere o frango com limao, alho e pouco sal.\n2. Grelhe ate dourar e ficar suculento.\n3. Aqueca o arroz e salteie os legumes rapidamente no azeite.\n4. Monte o prato com bastante legume, frango no centro e arroz medido.\n\n**Por que funciona para voce**\nCom cerca de ' + peso + 'kg, essa refeicao ajuda a proteger sua massa muscular, da saciedade e evita aquela fome forte a noite. Ela nao e uma dieta chata; e uma escolha inteligente para queimar gordura mantendo energia.' + mission;
  }

  if (m.match(/feijao/) && m.match(/madrugada|noite|dormir|faz mal|saude/)) {
    return nome + ', resposta direta: comer feijao de madrugada nao faz mal para a saude por si so.\n\nO que muda e a quantidade e como seu corpo reage. Uma concha pequena pode ate ajudar na saciedade, porque tem fibras, minerais e carboidrato de liberacao mais lenta. O problema aparece quando a porcao e grande, muito gordurosa ou muito tarde, porque pode pesar na digestao, dar gases, piorar refluxo e atrapalhar o sono.\n\nPara sua meta, faca simples: se for fome real, coma pouco feijao com uma proteina leve, como ovo ou frango. Se for vontade de beliscar, beba agua e espere 10 minutos.\n\n**Sua unica missao agora:** escolha porcao pequena e pare antes de sentir o estomago pesado.';
  }

  if (m.match(/emagrec|perder.*kilo|kilo.*perder|queimar.*gordu|gordu.*queimar|barriga|secar|cutting/)) {
    return nome + ', entendo sua meta e vou facilitar o caminho. Para perder gordura sem ficar fraco, o segredo hoje e manter as refeicoes simples: uma boa proteina, vegetais e uma porcao medida de carboidrato. Isso ajuda seu corpo a usar gordura como energia sem derrubar seu pique.\n\nComo proximo passo, coloque frango, ovos, peixe, iogurte grego ou tofu na sua proxima refeicao. Se fizer isso, voce protege seus musculos e chega na noite com menos fome.' + mission;
  }

  if (m.match(/proteina|whey|aminoacido|massa|hipertrofia|musculacao|musculo/)) {
    return nome + ', seu corpo precisa de proteina como material de construcao. Pense assim: cada refeicao com ovos, frango, peixe, iogurte grego ou tofu ajuda voce a preservar musculo, recuperar melhor e manter energia. Para seu peso aproximado de ' + peso + 'kg, vale espalhar proteina ao longo do dia em vez de tentar resolver tudo numa refeicao so.' + mission;
  }

  if (m.match(/agua|hidrat|beber|sede/)) {
    return nome + ', hidratacao e uma das formas mais simples de melhorar fome, energia e treino. Quando voce bebe pouca agua, o corpo pode confundir sede com vontade de comer e sua disposicao cai. Comece com um copo agora e mantenha pequenas doses ao longo do dia.' + mission;
  }

  if (m.match(/treino|academia|exerc|pre.*treino|pos.*treino|workout|energia|cansad|sono/)) {
    return nome + ', para render melhor, seu corpo precisa chegar no treino com energia e sair dele com recuperacao. Antes do treino, algo leve com carboidrato e proteina ajuda no pique. Depois, uma refeicao com proteina ajuda seus musculos a se recuperar. Simples, direto e sem inventar moda.' + mission;
  }

  return 'Estou com voce, ' + nome + '. Me diga o que voce quer resolver agora e eu vou traduzir em uma acao simples: receita, jantar, emagrecimento, proteina, agua ou treino. Nada de complicar sua saude alimentar.' + mission;
}

// aliases
window.sendCoach = sendCoachMsg;
window.getNutriCoachResponse = coachGetAIResp;


// ── updateLoginLang ─────────────────────────────────────────────
function updateLoginLang() {
  // lang-pill (login) + lang-option (settings)
  document.querySelectorAll('.lang-pill').forEach(function(el) {
    el.classList.toggle('active', el.dataset.lang === APP.lang);
  });
  document.querySelectorAll('.lang-option').forEach(function(el) {
    el.classList.toggle('active', el.dataset.lang === APP.lang);
  });
  document.querySelectorAll('#login-lang-grid .lang-option').forEach(function(el) {
    el.classList.toggle('active', el.dataset.lang === APP.lang);
  });
  var authEl = document.getElementById('auth-screen');
  if (authEl && authEl.classList.contains('active')) { renderAuth(); return; }
  if (APP.tab) { renderNav(); navigate(APP.tab); }
}

// ── initFireflies — Vagalumes verdes animados ───────────────────
function initFireflies() {
  try {
  var canvas = document.getElementById('fireflies-canvas');
  if (!canvas || canvas.dataset.ready === '1') return;
  canvas.dataset.ready = '1';
  var ctx = canvas.getContext && canvas.getContext('2d');
  if (!ctx) return;
  var W = canvas.width  = canvas.offsetWidth  || window.innerWidth;
  var H = canvas.height = canvas.offsetHeight || window.innerHeight;

  var flies = Array.from({length: 28}, function() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: 1.2 + Math.random() * 1.8,
      dx: (Math.random() - .5) * .45,
      dy: (Math.random() - .5) * .45,
      alpha: Math.random(),
      dAlpha: .008 + Math.random() * .012,
      pulse: Math.random() * Math.PI * 2
    };
  });

  var raf = null;
  function draw() {
    if (!document.getElementById('fireflies-canvas')) {
      cancelAnimationFrame(raf);
      return;
    }
    ctx.clearRect(0, 0, W, H);
    var now = Date.now() / 1000;
    flies.forEach(function(f) {
      f.pulse += .025;
      f.x += f.dx;
      f.y += f.dy;
      if (f.x < 0) f.x = W;
      if (f.x > W) f.x = 0;
      if (f.y < 0) f.y = H;
      if (f.y > H) f.y = 0;
      var alpha = (.35 + .65 * Math.abs(Math.sin(f.pulse)));
      var glow = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 5);
      glow.addColorStop(0, 'rgba(34,197,94,' + alpha + ')');
      glow.addColorStop(.4, 'rgba(34,197,94,' + (alpha * .3) + ')');
      glow.addColorStop(1, 'rgba(34,197,94,0)');
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r * 5, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(100,255,150,' + alpha + ')';
      ctx.fill();
    });
    raf = requestAnimationFrame(draw);
  }

  // Resize
  if (window.ResizeObserver) {
    var resizeObs = new ResizeObserver(function() {
      W = canvas.width  = canvas.offsetWidth  || window.innerWidth;
      H = canvas.height = canvas.offsetHeight || window.innerHeight;
    });
    resizeObs.observe(canvas);
  } else {
    window.addEventListener('resize', function() {
      W = canvas.width  = canvas.offsetWidth  || window.innerWidth;
      H = canvas.height = canvas.offsetHeight || window.innerHeight;
    }, {passive:true});
  }

  cancelAnimationFrame(raf);
  draw();
  } catch (e) {
    console.warn('[VitalIA] Fireflies desativado com segurança:', e);
  }
}

(function(){
  function keepBottomNavVisible(){
    var n=document.getElementById('bottom-nav');
    if(!n)return;
    n.style.display='flex';
    n.style.visibility='visible';
    n.style.opacity='1';
  }
  document.addEventListener('focusin',function(e){
    if(e.target&&(e.target.id==='food-cam-capture'||e.target.id==='food-gallery'||e.target.type==='file')) keepBottomNavVisible();
  });
  document.addEventListener('focusout',function(){setTimeout(keepBottomNavVisible,120)});
  if(window.visualViewport){window.visualViewport.addEventListener('resize',keepBottomNavVisible)}
  keepBottomNavVisible();
})();
if ('serviceWorker' in navigator) {
  var swHost = location.hostname;
  var isLocalPreview = swHost === 'localhost' || swHost === '127.0.0.1' || swHost.includes('claudeusercontent') || location.protocol === 'file:';
  if (!isLocalPreview) {
    var refreshingForUpdate = false;
    navigator.serviceWorker.addEventListener('controllerchange', function() {
      if (refreshingForUpdate) return;
      refreshingForUpdate = true;
      location.reload();
    });
    function showAppUpdateAvailable(reg) {
      if (document.getElementById('vitalia-update-toast')) return;
      var wrap = document.createElement('div');
      wrap.id = 'vitalia-update-toast';
      wrap.className = 'toast toast-info';
      wrap.style.cssText = 'position:fixed;left:14px;right:14px;bottom:calc(86px + env(safe-area-inset-bottom,0));z-index:10050;display:flex;align-items:center;gap:10px;justify-content:space-between';
      wrap.innerHTML = '<span>' + t('update_available') + '</span><button class="btn btn-primary" style="padding:8px 12px;border-radius:12px" id="vitalia-update-btn">' + t('update_reload') + '</button><button class="btn btn-outline" style="padding:8px 10px;border-radius:12px" id="vitalia-update-later">' + t('update_later') + '</button>';
      document.body.appendChild(wrap);
      document.getElementById('vitalia-update-btn').onclick = function() {
        if (reg && reg.waiting) reg.waiting.postMessage({ type:'VITALIA_SKIP_WAITING' });
        else location.reload();
      };
      document.getElementById('vitalia-update-later').onclick = function() { wrap.remove(); };
    }
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('./sw.js?v=' + CONFIG.APP_VERSION, {scope:'./'})
        .then(function(reg) {
          console.log('[VitalIA] Service Worker registrado:', reg.scope);
          try { reg.update(); } catch(_) {}
          if (reg.waiting && navigator.serviceWorker.controller) showAppUpdateAvailable(reg);
          reg.addEventListener('updatefound', function() {
            var worker = reg.installing;
            if (!worker) return;
            worker.addEventListener('statechange', function() {
              if (worker.state === 'installed' && navigator.serviceWorker.controller) showAppUpdateAvailable(reg);
            });
          });
        })
        .catch(function(err) {
          console.warn('[VitalIA] Service Worker indisponível:', err && err.message ? err.message : err);
        });
    });
  }
}
console.log('[VitalIA] Coach IA v12.0 — AI Health Core + Memória Contextual ✅');
