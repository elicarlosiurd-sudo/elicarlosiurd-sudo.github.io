/* ═══════════════════════════════════════
   V230-E2 — js/modules/auth.js
   Ex-bloco principal do index.html L1475–2115 (extração literal, ordem preservada).
   Conteúdo: INIT + AUTH FLOW completo
═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
function applyTheme() {
  document.body.className = APP.darkMode ? '' : 'light-mode';
}

// (init moved to bottom)

/* ═══════════════════════════════════════
   AUTH FLOW
═══════════════════════════════════════ */
function startAuth() {
  const auth = document.getElementById('auth-screen');
  auth.classList.add('active');
  renderAuth();
}

function showLegalModal(type) {
  const lang = APP.lang || 'pt';
  const terms = {
    pt: {
      title: 'Termos de Uso',
      body: 'O VitalIA é um app de bem-estar, nutrição e IA. Não é um serviço médico e não substitui consulta profissional. Uso permitido a partir de 13 anos (menores com consentimento dos responsáveis). Plano gratuito e Premium disponíveis. Regido pelas leis do Brasil. Para encerrar sua conta ou revogar consentimentos, acesse Configurações → Privacidade.'
    },
    en: {
      title: 'Terms of Use',
      body: 'VitalIA is a wellness, nutrition, and AI app. It is not a medical service and does not replace professional consultation. Available from age 13 (minors with parental consent). Free and Premium plans available. Governed by Brazilian law. To close your account or revoke consent, go to Settings → Privacy.'
    },
    es: {
      title: 'Términos de Uso',
      body: 'VitalIA es una app de bienestar, nutrición e IA. No es un servicio médico y no reemplaza la consulta profesional. Disponible desde los 13 años (menores con consentimiento de padres). Planes Gratuito y Premium disponibles. Regido por la legislación brasileña. Para cerrar tu cuenta o revocar consentimientos, ve a Configuración → Privacidad.'
    },
    ru: {
      title: 'Условия использования',
      body: 'VitalIA — приложение для здоровья, питания и ИИ. Это не медицинская служба и не замена консультации специалиста. Доступно с 13 лет (для несовершеннолетних — с согласия родителей). Доступны бесплатный и Premium планы. Регулируется законодательством Бразилии. Чтобы закрыть аккаунт или отозвать согласия, перейдите в Настройки → Конфиденциальность.'
    }
  };
  const privacy = {
    pt: {
      title: 'Política de Privacidade',
      body: 'Coletamos dados de perfil de saúde (peso, objetivo, atividade), histórico de conversas com o Coach IA e dados técnicos para personalização do serviço. Dados sensíveis são processados com base no seu consentimento (LGPD art. 11). Compartilhamos com Supabase (armazenamento) e Google Gemini (processamento de IA). Não vendemos seus dados. Você pode solicitar acesso, correção ou exclusão dos seus dados pelo e-mail de privacidade ou em Configurações → Privacidade.'
    },
    en: {
      title: 'Privacy Policy',
      body: 'We collect health profile data (weight, goal, activity), AI Coach conversation history, and technical data to personalize the service. Sensitive data is processed based on your consent (GDPR Art. 9). We share with Supabase (storage) and Google Gemini (AI processing). We do not sell your data. You may request access, correction, or deletion via our privacy email or at Settings → Privacy.'
    },
    es: {
      title: 'Política de Privacidad',
      body: 'Recopilamos datos de perfil de salud (peso, objetivo, actividad), historial de conversaciones con el Coach IA y datos técnicos para personalizar el servicio. Los datos sensibles se procesan con base en tu consentimiento (GDPR Art. 9). Compartimos con Supabase (almacenamiento) y Google Gemini (procesamiento IA). No vendemos tus datos. Puedes solicitar acceso, corrección o eliminación de tus datos por correo electrónico de privacidad o en Configuración → Privacidad.'
    },
    ru: {
      title: 'Политика конфиденциальности',
      body: 'Мы собираем данные профиля здоровья (вес, цель, активность), историю разговоров с Тренером ИИ и технические данные для персонализации сервиса. Чувствительные данные обрабатываются на основании вашего согласия (ФЗ-152 / GDPR ст. 9). Мы передаём данные Supabase (хранение) и Google Gemini (обработка ИИ). Мы не продаём ваши данные. Вы можете запросить доступ, исправление или удаление данных по email конфиденциальности или в Настройки → Конфиденциальность.'
    }
  };
  const content = type === 'terms' ? terms[lang] : privacy[lang];
  if (!content) return;
  openModal(content.title, '<p style="color:var(--text2);line-height:1.7;font-size:14px;margin:0">' + content.body + '</p>');
}

function renderAuth() {
  const auth = document.getElementById('auth-screen');
  const step = APP.authStep;
  auth.innerHTML = '';

  if (step === 'login') renderLogin();
  else if (step === 'register') renderRegister1();
  else if (step === 'register2') renderRegister2();
  else if (step === 'register3') renderRegister3();
  else if (step === 'register4') renderRegister4();
  else if (step === 'biometric') renderBiometricOffer();
  else if (step === 'pin') renderPinScreen();
  repairVisibleText(auth);
  translateVisibleStaticText(auth);
}

window.renderLogin=function(){
  var el=document.getElementById('auth-screen');
  var langs=t('languages');
  var curLang=langs.find(function(l){return l.code===APP.lang})||langs[0];
  var langItems='';
  for(var i=0;i<langs.length;i++){
    var l=langs[i];
    langItems+='<div class="lp-dd-item'+(l.code===APP.lang?' sel':'')+'" onclick="event.stopPropagation();saveUserLanguage(\''+l.code+'\');renderAuth()">'+l.flag+' '+l.name+'</div>';
  }
  var plantSvg='<svg viewBox="0 0 100 90" fill="none" style="width:80px;height:80px;filter:drop-shadow(0 0 24px rgba(52,211,153,.35))"><path d="M34 78 Q38 65 42 55 Q46 45 50 37 Q53 30 55 22" stroke="#5c7a50" stroke-width="2.5" stroke-linecap="round" fill="none"/><path d="M38 68 Q32 72 26 74" stroke="#5c7a50" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M28 74 Q21 78 17 81 Q20 75 26 72Z" fill="#4d8b3b"/><path d="M28 74 L21 78" stroke="#3d7530" stroke-width=".5" opacity=".5"/><path d="M30 72 Q24 67 20 64 Q24 63 29 70Z" fill="#5a9a44"/><path d="M30 72 L24 67" stroke="#4a8838" stroke-width=".5" opacity=".5"/><path d="M46 54 Q40 48 35 44 Q40 43 46 51Z" fill="#5a9a44"/><path d="M46 54 L39 47" stroke="#4a8838" stroke-width=".5" opacity=".45"/><path d="M44 56 Q52 50 58 46 Q54 53 46 57Z" fill="#4d8b3b"/><path d="M44 56 L53 49" stroke="#3d7530" stroke-width=".5" opacity=".45"/><path d="M50 42 Q44 36 39 32 Q44 31 50 40Z" fill="#62a64e"/><path d="M50 42 L44 35" stroke="#528e40" stroke-width=".5" opacity=".45"/><path d="M49 44 Q56 38 62 34 Q58 41 51 45Z" fill="#5a9a44"/><path d="M49 44 L57 37" stroke="#4a8838" stroke-width=".5" opacity=".45"/><path d="M53 32 Q48 26 44 22 Q49 22 53 30Z" fill="#6cb456"/><path d="M53 32 L48 25" stroke="#5a9a44" stroke-width=".5" opacity=".45"/><path d="M53 34 Q60 28 64 24 Q61 31 55 35Z" fill="#62a64e"/><path d="M53 34 L60 27" stroke="#528e40" stroke-width=".5" opacity=".45"/><path d="M55 22 Q58 14 62 9 Q59 17 56 23Z" fill="#74be5e"/><path d="M55 22 L59 14" stroke="#62a64e" stroke-width=".5" opacity=".4"/></svg>';
  var h='';
  h+='<div class="auth-bg-premium">';
  h+='<canvas id="fireflies-canvas"></canvas>';
  h+='<div class="auth-scroll">';
  h+='<div class="lp-header">';
  h+='<div class="lp-lang-trigger" onclick="this.querySelector(\'.lp-dd\').classList.toggle(\'show\')">';
  h+='<span>'+curLang.flag+'</span> <span>'+curLang.name+'</span> <span style="font-size:10px;opacity:.5">\u25bc</span>';
  h+='<div class="lp-dd">'+langItems+'</div>';
  h+='</div></div>';
  h+='<div style="text-align:center;padding:24px 0 20px">';
  h+='<div style="margin:0 auto 12px">'+plantSvg+'</div>';
  h+='<div style="font-family:var(--font-serif);font-size:32px;font-weight:700;color:var(--green);font-style:italic;text-shadow:0 0 30px rgba(52,211,153,.3)">VitalIA</div>';
  h+='<div style="font-size:14px;color:rgba(52,211,153,.6);margin-top:4px;letter-spacing:.5px">Sa\u00fade com Intelig\u00eancia</div>';
  h+='</div>';
  h+='<div class="auth-card-premium" style="padding:24px 20px;border-radius:20px">';
  h+='<h2 style="font-family:var(--font-serif);font-size:20px;font-weight:700;text-align:center;margin:0 0 20px;color:var(--text)">'+t('login_title')+'</h2>';
  h+='<div style="margin-bottom:16px">';
  h+='<label style="display:block;font-size:12px;font-weight:700;color:var(--green);margin-bottom:6px;letter-spacing:.5px;text-transform:uppercase">E-MAIL</label>';
  h+='<input id="a-email" class="input input-premium" type="email" placeholder="seu@email.com" autocomplete="email" style="padding:14px 16px;border-radius:12px;border:1.5px solid rgba(52,211,153,.25);font-size:15px">';
  h+='</div>';
  h+='<div style="margin-bottom:8px">';
  h+='<label style="display:block;font-size:12px;font-weight:700;color:var(--green);margin-bottom:6px;letter-spacing:.5px;text-transform:uppercase">SENHA</label>';
  h+='<div style="position:relative">';
  h+='<input id="a-pass" class="input input-premium" type="password" placeholder="'+t('login_min_chars')+'" style="padding:14px 16px;border-radius:12px;border:1.5px solid rgba(52,211,153,.25);font-size:15px;padding-right:48px" onkeydown="if(event.key===\'Enter\')doLogin()">';
  h+='<button onclick="var p=document.getElementById(\'a-pass\');p.type=p.type===\'password\'?\'text\':\'password\';this.textContent=p.type===\'password\'?\'\ud83d\udc41\':\'\ud83d\udc41\u200d\ud83d\udde8\'" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:18px;cursor:pointer;color:var(--text3);padding:4px">\ud83d\udc41</button>';
  h+='</div></div>';
  h+='<div style="text-align:right;margin-bottom:20px">';
  h+='<button onclick="forgotPassword()" style="background:none;border:none;color:rgba(52,211,153,.7);font-size:13px;cursor:pointer;font-family:var(--font-body);padding:0">'+t('forgot')+'</button>';
  h+='</div>';
  h+='<button id="login-btn" class="btn btn-primary btn-full" onclick="doLogin()" style="padding:16px;font-size:16px;font-weight:700;border-radius:14px;margin-bottom:16px;box-shadow:0 0 30px rgba(52,211,153,.3),0 4px 20px rgba(52,211,153,.2);letter-spacing:.3px">'+t('login_title')+'</button>';
  h+='<div class="divider" style="margin:0 0 16px"><div class="divider-line"></div><div class="divider-text" style="font-size:11px;color:rgba(52,211,153,.5);text-transform:uppercase;letter-spacing:1px;font-weight:600">OU</div><div class="divider-line"></div></div>';
  h+='<button class="biometric-btn" onclick="tryBiometric()" style="padding:14px 16px;border-radius:14px;border:1.5px solid rgba(52,211,153,.3);margin-bottom:0;font-size:14px">\ud83d\udce1 '+t('login_biometric')+'</button>';
  h+='<input type="checkbox" id="a-remember" checked style="display:none">';
  h+='</div>';
  h+='<div style="text-align:center;padding:20px 0 8px">';
  h+='<span style="font-size:13px;color:var(--text2)">Ainda n\u00e3o tem conta? </span>';
  h+='<span class="auth-link" style="font-weight:700;font-size:13px" onclick="APP.authStep=\'register\';renderAuth()">Comece agora \u2192</span>';
  h+='</div>';
  h+='<div style="text-align:center;padding:0 0 8px">';
  h+='<button onclick="openSocialMethodsModal()" style="background:none;border:none;color:var(--text3);font-size:12px;cursor:pointer;font-family:var(--font-body);padding:4px 8px">Outros m\u00e9todos de acesso</button>';
  h+='</div>';
  h+='<div style="text-align:center;padding:0 0 16px">';
  h+='<span style="font-size:10px;color:var(--text3);letter-spacing:.5px">VitalIA v2.0</span>';
  h+='</div></div></div>';
  el.innerHTML=h;
  initFireflies();
}

window.openSocialMethodsModal=function(){
  var h='<div style="text-align:center;margin-bottom:16px"><div style="font-size:13px;color:var(--text2);line-height:1.6">Conecte usando outro m\u00e9todo</div></div>';
  h+='<button onclick="telegramLogin();closeModal()" class="social-premium-btn" style="margin-bottom:8px"><svg class="sp-icon" viewBox="0 0 24 24" fill="none"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.267l-2.965-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.983.292z" fill="#229ED9"/></svg><span class="sp-label">'+t('login_telegram')+'</span><span class="sp-arrow">\u2192</span></button>';
  h+='<button onclick="socialLogin(\'Google\');closeModal()" class="social-premium-btn" style="margin-bottom:8px"><svg class="sp-icon" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg><span class="sp-label">'+t('login_google')+'</span><span class="sp-arrow">\u2192</span></button>';
  h+='<button onclick="socialLogin(\'Apple\');closeModal()" class="social-premium-btn" style="margin-bottom:8px"><svg class="sp-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg><span class="sp-label">'+t('login_apple')+'</span><span class="sp-arrow">\u2192</span></button>';
  h+='<button onclick="socialLogin(\'Facebook\');closeModal()" class="social-premium-btn" style="margin-bottom:8px"><svg class="sp-icon" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg><span class="sp-label">'+t('login_facebook')+'</span><span class="sp-arrow">\u2192</span></button>';
  openModal('Outros m\u00e9todos de acesso',h);
};


async function doLogin() {
  var email = document.getElementById('a-email').value.trim();
  var pass = document.getElementById('a-pass').value;
  if (!email || !pass) { toast(t('toast_fill_email'),'error'); return; }
  var btn = document.getElementById('login-btn');
  btn.classList.add('btn-loading'); btn.disabled = true;
  try {
    var result = await sbSignIn(email, pass);
    if (result.error) throw result.error;
    APP.user = { email: result.data.user.email, name: result.data.user.user_metadata?.nome || email.split('@')[0], id: result.data.user.id };
    APP.session = result.data.session?.access_token || 'sess_' + Date.now();
    resetSessionVisualState();
    clearSensitiveLocalCache();
    sessionStorage.setItem('v_tab_active','1');
    var remEl = document.getElementById('a-remember');
    if (remEl && remEl.checked) localStorage.setItem('v_remember','1');
    else localStorage.removeItem('v_remember');
    await syncFromSupabase(APP.user.id);
  } catch (err) {
    btn.classList.remove('btn-loading'); btn.disabled = false;
    var raw = String(err?.message || err || '');
    if (/email.*not.*confirm|confirm.*email|not confirmed/i.test(raw)) {
      toast(t('auth_email_unconfirmed'), 'info', 5000);
      renderEmailConfirmationNotice(email);
    } else {
      toast(t('auth_login_failed') + ': ' + raw, 'error', 5000);
    }
    return;
  }
  if (!APP.profile) {
    APP.profile = {name: APP.user.name, weight:78, height:175, age:30, gender:'m', goal:'lose', activity:'mod'};
  }
  APP.calc = calcProfile(APP.profile);
  if (!APP.meals) APP.meals = [];
  if (!APP.water) APP.water = 0;
  btn.classList.remove('btn-loading'); btn.disabled = false;
  APP.authStep = localStorage.getItem(userScopedKey('v_biometric')) ? 'app' : 'biometric';
  if (APP.authStep === 'biometric') { renderAuth(); }
  else { finishAuth(); }
}

function socialLogin(provider) {
  toast(`Login com ${provider} será ativado somente via Supabase Auth.`, 'info');
  return;
}

async function tryBiometric() {
  var liveSession = null;
  try { liveSession = (await sb.auth.getSession())?.data?.session || null; } catch(_) {}
  if (!liveSession?.user) {
    toast('Configure a biometria após acessar sua conta. Entre com email e senha para continuar.', 'info', 4200);
    APP.authStep = 'login'; renderAuth();
    return;
  }
  var uid = liveSession.user.id;
  if (window.PublicKeyCredential && localStorage.getItem(userScopedKey('v_webauthn_id', uid))) {
    try {
      var credId = localStorage.getItem(userScopedKey('v_webauthn_id', uid));
      var challenge = new Uint8Array(32); window.crypto.getRandomValues(challenge);
      var assertion = await navigator.credentials.get({ publicKey: { challenge: challenge, allowCredentials: [{ id: Uint8Array.from(atob(credId), function(ch){return ch.charCodeAt(0)}), type: 'public-key', transports: ['internal'] }], userVerification: 'required', timeout: 60000 } });
      if (assertion) {
        toast('\u2705 '+t('toast_bio_ok'),'success');
        APP.user = { email: liveSession.user.email, name: liveSession.user.user_metadata?.nome || liveSession.user.email.split('@')[0], id: liveSession.user.id };
        APP.session = liveSession.access_token;
        await syncFromSupabase(APP.user.id);
        finishAuth(); return;
      }
    } catch(e) {}
  }
  if (localStorage.getItem(userScopedKey('v_biometric', uid))) {
    toast('\u2705 '+t('toast_bio_ok'),'success');
    APP.user = { email: liveSession.user.email, name: liveSession.user.user_metadata?.nome || liveSession.user.email.split('@')[0], id: liveSession.user.id };
    APP.session = liveSession.access_token;
    await syncFromSupabase(APP.user.id);
    finishAuth(); return;
  }
  toast('Biometria ainda não configurada para esta conta. Configure após o login.', 'info', 3800);
  APP.authStep = 'login'; APP.pinInput = ''; renderAuth();
}

async function activateBiometric() {
  if (window.PublicKeyCredential && navigator.credentials) {
    try {
      var challenge = new Uint8Array(32); window.crypto.getRandomValues(challenge);
      var userId = new Uint8Array(16); window.crypto.getRandomValues(userId);
      var credential = await navigator.credentials.create({ publicKey: { challenge: challenge, rp: { name: 'VitalIA', id: location.hostname || 'localhost' }, user: { id: userId, name: APP.user?.email || 'user', displayName: APP.profile?.name || 'Usu\u00e1rio' }, pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }], authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'required', userVerification: 'required' }, timeout: 60000 } });
      if (credential) {
        var credId = btoa(String.fromCharCode.apply(null, new Uint8Array(credential.rawId)));
        localStorage.setItem(userScopedKey('v_webauthn_id'), credId); localStorage.setItem(userScopedKey('v_biometric'), '1');
        toast('\u2705 '+t('toast_bio_reg'),'success',2000); finishAuth(); return;
      }
    } catch(e) {}
  }
  toast('Biometria não disponível neste navegador. Você pode entrar com email e senha com segurança.', 'info', 4200);
  finishAuth();
}

function renderBiometricOffer() {
  const el = document.getElementById('auth-screen');
  const hasBio = window.PublicKeyCredential;
  el.innerHTML = `<div class="auth-bg" style="justify-content:center">
    <div class="auth-card" style="text-align:center;max-width:340px">
      <div style="font-size:64px;margin-bottom:16px">${hasBio?'🔐':'🔑'}</div>
      <h2 class="auth-title" style="margin-bottom:8px">${t('biometric_offer')}</h2>
      <p class="auth-sub">${hasBio ? t('biometric_desc') : 'Configure um PIN de 4 dígitos para acesso rápido.'}</p>
      ${hasBio ? `
      <button class="btn btn-primary btn-full" onclick="activateBiometric()" style="margin-bottom:12px;padding:14px;display:flex;align-items:center;justify-content:center;gap:10px">
        <span style="font-size:22px">👆</span> ${t('biometric_activate')}
      </button>
      <div style="font-size:11px;color:var(--text3);margin-bottom:12px">Impressão digital ou Face ID — sem senha necessária</div>` : ''}
      <button class="btn btn-outline btn-full" onclick="APP.authStep='pin';APP.pinInput='';renderAuth()" style="margin-bottom:12px;padding:13px">🔢 Configurar PIN</button>
      <button class="btn btn-ghost btn-full" onclick="finishAuth()">${t('biometric_skip')}</button>
      <p style="font-size:11px;color:var(--text3);margin-top:12px">Você pode ativar depois em Configurações → Segurança</p>
    </div>
  </div>`;
}

function renderPinScreen() {
  const el = document.getElementById('auth-screen');
  const pin = APP.pinInput;
  el.innerHTML = `<div class="auth-bg" style="justify-content:center">
    <div style="text-align:center;max-width:320px;margin:0 auto">
      <div style="font-size:48px;margin-bottom:16px">🔢</div>
      <h2 style="font-family:var(--font-serif);font-size:22px;margin-bottom:24px">${t('pin_title')}</h2>
      <div style="display:flex;justify-content:center;gap:12px;margin-bottom:32px">
        ${[0,1,2,3].map(i=>`<div style="width:16px;height:16px;border-radius:50%;border:2px solid ${i<pin.length?'var(--green)':'var(--border2)'};background:${i<pin.length?'var(--green)':'transparent'};transition:all .2s"></div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:280px;margin:0 auto">
        ${[1,2,3,4,5,6,7,8,9,'*',0,'⌫'].map(k=>`<button onclick="pinKey('${k}')" style="height:64px;border-radius:16px;border:1.5px solid var(--border2);background:var(--surface2);font-size:${k==='⌫'?'20px':'22px'};font-weight:600;cursor:pointer;font-family:var(--font-body);color:var(--text);transition:all .15s" onmousedown="this.style.background='rgba(34,197,94,.2)'" onmouseup="this.style.background='var(--surface2)'">${k}</button>`).join('')}
      </div>
      <button onclick="APP.authStep='login';renderAuth()" class="btn btn-ghost" style="margin-top:20px;font-size:13px">Usar email e senha</button>
    </div>
  </div>`;
}

function pinKey(k) {
  if (k === '⌫') { APP.pinInput = APP.pinInput.slice(0,-1); }
  else if (k === '*') { APP.pinInput = ''; }
  else if (APP.pinInput.length < 4) { APP.pinInput += k; }
  if (APP.pinInput.length === 4) {
    sb.auth.getSession().then(async function(res) {
      var session = res?.data?.session || null;
      if (!session?.user) {
        APP.pinInput = '';
        toast('PIN exige sessão Supabase ativa. Entre com email e senha.', 'info', 3500);
        APP.authStep = 'login';
        renderAuth();
        return;
      }
      APP.user = { email: session.user.email, name: session.user.user_metadata?.nome || session.user.email.split('@')[0], id: session.user.id };
      APP.session = session.access_token;
      resetSessionVisualState();
      await syncFromSupabase(session.user.id);
      toast('✅ '+t('toast_pin_ok'),'success');
      finishAuth();
    });
    return;
    // Any 4-digit pin works in demo
    // eslint-disable-next-line no-unreachable -- pré-existente no index.html; corrigir na V231
    setTimeout(() => {
      toast('✅ '+t('toast_pin_ok'),'success');
      APP.user = null;
      APP.profile = null;
      APP.calc = calcProfile(APP.profile); APP.water=0; APP.meals=[];
      APP.session=null;
      setTimeout(finishAuth,500);
    },300);
    // eslint-disable-next-line no-unreachable -- pré-existente no index.html; corrigir na V231
    return;
  }
  renderPinScreen();
}

function renderRegister1() {
  const goals=[['lose','🔥','Emagrecimento'],['gain','💪','Hipertrofia'],['maintain','⚡','Performance'],['health','🥗','Saude geral']];
  const el = document.getElementById('auth-screen');
  el.innerHTML = `<div class="auth-bg" style="padding-top:20px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
      <button onclick="APP.authStep='login';renderAuth()" class="btn btn-icon">←</button>
      <div style="flex:1"><div class="step-indicator">${[1,2,3,4].map((s,i)=>`<div class="step-dot ${i===0?'active':''}" style="flex:1"></div>`).join('')}</div></div>
    </div>
    <div class="auth-card">
      <h2 class="auth-title">${t('step')} 1 ${t('of')} 4 — Sua conta</h2>
      <p class="auth-sub">Escolha seu objetivo logo no inicio. Depois, crie suas credenciais.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
        ${goals.map(([v,e,n])=>`<button type="button" class="opt-card${APP.registerData.goal===v?' selected':''}" onclick="APP.registerData.goal='${v}';renderAuth()" style="padding:12px;border-radius:12px;border:2px solid ${APP.registerData.goal===v?'var(--green)':'var(--border2)'};cursor:pointer;text-align:left;background:${APP.registerData.goal===v?'rgba(34,197,94,.10)':'var(--surface2)'}"><div style="font-size:23px">${e}</div><div style="font-size:13px;font-weight:700;margin-top:5px">${n}</div></button>`).join('')}
      </div>
      <div class="input-wrap"><label class="input-label">${t('name')}</label><input id="r-name" class="input" placeholder="João Silva" value="${APP.registerData.name||''}"></div>
      <div class="input-wrap"><label class="input-label">${t('email')}</label><input id="r-email" class="input" type="email" placeholder="seu@email.com" value="${APP.registerData.email||''}"></div>
      <div class="input-wrap"><label class="input-label">${t('password')}</label><input id="r-pass" class="input" type="password" placeholder="Mínimo 8 caracteres"></div>
      <div class="input-wrap"><label class="input-label">Confirmar senha</label><input id="r-pass2" class="input" type="password" placeholder="Repita a senha"></div>
      <label class="terms-label" style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:var(--text2);cursor:pointer;margin-bottom:16px"><input type="checkbox" id="r-terms" style="accent-color:var(--green);margin-top:2px"> Concordo com os <span class="auth-link" style="font-size:12px" onclick="event.preventDefault();event.stopPropagation();showLegalModal('terms')">${t('Termos de Uso')||'Terms of Use'}</span> e <span class="auth-link" style="font-size:12px" onclick="event.preventDefault();event.stopPropagation();showLegalModal('privacy')">${t('Política de Privacidade')||'Privacy Policy'}</span></label>
      <label class="terms-label" style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:var(--text2);cursor:pointer;margin-bottom:16px"><input type="checkbox" id="r-health-consent" style="accent-color:var(--green);margin-top:2px"> Autorizo o tratamento de dados de saúde, nutrição, hidratação, peso e humor para personalização do VitalIA.</label>
      <button class="btn btn-primary btn-full" onclick="nextRegister1()" style="padding:14px">Continuar →</button>
    </div>
  </div>`;
}

function nextRegister1() {
  const name=sanitizeDbString(document.getElementById('r-name').value.trim(),120), email=sanitizeDbString(document.getElementById('r-email').value.trim(),180), pass=document.getElementById('r-pass').value, pass2=document.getElementById('r-pass2').value;
  if(!APP.registerData.goal){toast(t('toast_select_goal'),'error');return;}
  if(!name||!email||!pass){toast(t('toast_fill_all'),'error');return;}
  if(!/\S+@\S+\.\S+/.test(email)){toast(t('toast_invalid_email'),'error');return;}
  if(pass.length<8){toast(t('toast_pass_min'),'error');return;}
  if(pass!==pass2){toast(t('toast_pass_match'),'error');return;}
  if(!document.getElementById('r-terms').checked || !document.getElementById('r-health-consent').checked){toast(t('auth_confirm_terms_health'),'error');return;}
  APP.registerData={...APP.registerData,name,email,pass,password:pass};
  APP.authStep='register2';renderAuth();
}

function isoToBrDate(value) {
  if (!value) return '';
  var s = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.slice(8,10) + '/' + s.slice(5,7) + '/' + s.slice(0,4);
  return s;
}

function brDateToIso(value) {
  var s = String(value || '').replace(/\D/g, '');
  if (s.length !== 8) return '';
  var d = s.slice(0,2), m = s.slice(2,4), y = s.slice(4,8);
  var dt = new Date(Number(y), Number(m)-1, Number(d));
  if (dt.getFullYear() !== Number(y) || dt.getMonth() !== Number(m)-1 || dt.getDate() !== Number(d)) return '';
  return y + '-' + m + '-' + d;
}

function maskBirthDate(el) {
  var s = String(el.value || '').replace(/\D/g, '').slice(0, 8);
  if (s.length > 4) el.value = s.slice(0,2) + '/' + s.slice(2,4) + '/' + s.slice(4);
  else if (s.length > 2) el.value = s.slice(0,2) + '/' + s.slice(2);
  else el.value = s;
}

function renderEmailConfirmationNotice(email, reason) {
  const safeEmail = escapeHTML(email || APP.registerData?.email || localStorage.getItem('v_pending_signup_email') || '');
  const expired = reason === 'expired';
  const el = document.getElementById('auth-screen');
  el.classList.add('active');
  el.innerHTML = `<div class="auth-bg" style="justify-content:center;padding:20px">
    <div class="auth-card" style="text-align:center;max-width:340px">
      <div style="font-size:44px;margin-bottom:12px">??</div>
      <h2 class="auth-title" style="margin-bottom:8px">${expired ? 'Link expirado' : 'Confirme seu email'}</h2>
      <p class="auth-sub" style="line-height:1.6">${expired ? 'Esse link de confirmacao expirou ou foi substituido por outro envio.' : 'Enviamos o link de acesso para'} <strong style="color:var(--green)">${safeEmail || 'seu email'}</strong>. Verifique caixa de entrada, spam e promocoes.</p>
      <button id="resend-confirm-btn" class="btn btn-primary btn-full" onclick="resendSignupEmail('${safeEmail.replace(/'/g,"\\'")}')" style="padding:13px;margin-bottom:10px">Reenviar confirmacao</button>
      <button class="btn btn-outline btn-full" onclick="APP.authStep='login';renderAuth()" style="padding:13px">Voltar para login</button>
      <div style="font-size:11px;color:var(--text2);line-height:1.6;margin-top:12px">Use sempre o email mais recente. Muitos cliques seguidos podem invalidar links anteriores.</div>
    </div>
  </div>`;
  updateResendCooldown();
}

function renderExistingAccountNotice(email) {
  const safeEmail = escapeHTML(email || APP.registerData?.email || localStorage.getItem('v_pending_signup_email') || '');
  const jsEmail = safeEmail.replace(/'/g,"\\'");
  const el = document.getElementById('auth-screen');
  el.classList.add('active');
  el.innerHTML = `<div class="auth-bg" style="justify-content:center;padding:20px">
    <div class="auth-card" style="text-align:center;max-width:340px">
      <div style="font-size:44px;margin-bottom:12px">OK</div>
      <h2 class="auth-title" style="margin-bottom:8px">Conta ja existe</h2>
      <p class="auth-sub" style="line-height:1.6">O email <strong style="color:var(--green)">${safeEmail || 'informado'}</strong> ja tem uma conta no VitalIA. Por seguranca, o Supabase nao envia novo email de confirmacao para uma conta ja criada.</p>
      <button class="btn btn-primary btn-full" onclick="APP.authStep='login';renderAuth();setTimeout(()=>{const e=document.getElementById('a-email');if(e)e.value='${jsEmail}';},60)" style="padding:13px;margin-bottom:10px">Ir para login</button>
      <button class="btn btn-outline btn-full" onclick="sendPasswordReset('${jsEmail}')" style="padding:13px">Recuperar senha</button>
      <div style="font-size:11px;color:var(--text2);line-height:1.6;margin-top:12px">Se quiser testar cadastro novo, use um email que ainda nao exista no projeto.</div>
    </div>
  </div>`;
}

async function resendSignupEmail(email) {
  const btn = event?.currentTarget;
  const last = Number(localStorage.getItem('v_resend_confirm_at') || 0);
  const wait = Math.ceil((60000 - (Date.now() - last)) / 1000);
  if (wait > 0) {
    toast('Aguarde ' + wait + 's antes de reenviar novamente.', 'info', 3500);
    updateResendCooldown();
    return;
  }
  if (btn) { btn.disabled = true; btn.classList.add('btn-loading'); }
  const res = await sbResendSignupConfirmation(email);
  if (btn) { btn.disabled = false; btn.classList.remove('btn-loading'); }
  if (res.error) toast('Erro ao reenviar: ' + res.error.message, 'error', 5000);
  else {
    localStorage.setItem('v_resend_confirm_at', String(Date.now()));
    toast('Confirmacao reenviada. Use apenas o email mais recente.', 'success', 5000);
    updateResendCooldown();
  }
}

async function sendPasswordReset(email) {
  if (!email) { toast('Informe o email para recuperar a senha.', 'error', 4000); return; }
  try {
    await sb.auth.resetPasswordForEmail(email, { redirectTo: getAuthRedirectUrl() });
    toast('Email de recuperacao enviado. Verifique caixa de entrada e spam.', 'success', 5000);
  } catch(e) {
    toast('Nao foi possivel enviar recuperacao: ' + (e.message || e), 'error', 6000);
  }
}

function updateResendCooldown() {
  const btn = document.getElementById('resend-confirm-btn');
  if (!btn) return;
  const last = Number(localStorage.getItem('v_resend_confirm_at') || 0);
  const wait = Math.ceil((60000 - (Date.now() - last)) / 1000);
  if (wait > 0) {
    btn.disabled = true;
    btn.textContent = 'Reenviar em ' + wait + 's';
    setTimeout(updateResendCooldown, 1000);
  } else {
    btn.disabled = false;
    btn.textContent = 'Reenviar confirmacao';
  }
}

function renderRegister2() {
  const el = document.getElementById('auth-screen');
  el.innerHTML = `<div class="auth-bg" style="padding-top:20px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
      <button onclick="APP.authStep='register';renderAuth()" class="btn btn-icon">←</button>
      <div style="flex:1"><div class="step-indicator">${[1,2,3,4].map((s,i)=>`<div class="step-dot ${i<=1?'done':''}${i===1?' active':''}" style="flex:1"></div>`).join('')}</div></div>
    </div>
    <div class="auth-card">
      <h2 class="auth-title">${t('step')} 2 ${t('of')} 4 — Perfil físico</h2>
      <p class="auth-sub">Para cálculos precisos de nutrição</p>
      <div class="input-row">
        <div class="input-wrap"><label class="input-label">Data de nasc.</label><input id="r-dob" class="input" type="text" inputmode="numeric" maxlength="10" placeholder="DD/MM/AAAA" value="${isoToBrDate(APP.registerData.dob)||''}" oninput="maskBirthDate(this)"><div style="font-size:11px;color:var(--green);margin-top:5px">Digite direto, exemplo: 14/08/1981</div></div>
        <div class="input-wrap"><label class="input-label">Sexo</label><select id="r-gender" class="input"><option value="m">Masculino</option><option value="f">Feminino</option><option value="other">Prefiro não dizer</option></select></div>
      </div>
      <div class="input-row">
        <div class="input-wrap"><label class="input-label">Peso (kg)</label><input id="r-weight" class="input" type="number" placeholder="70" value="${APP.registerData.weight||''}"></div>
        <div class="input-wrap"><label class="input-label">Altura (cm)</label><input id="r-height" class="input" type="number" placeholder="170" value="${APP.registerData.height||''}"></div>
      </div>
      <button class="btn btn-primary btn-full" onclick="nextRegister2()" style="padding:14px">Continuar →</button>
    </div>
  </div>`;
}

function nextRegister2() {
  const dobInput=document.getElementById('r-dob').value, dob=brDateToIso(dobInput), gender=document.getElementById('r-gender').value, weight=document.getElementById('r-weight').value, height=document.getElementById('r-height').value;
  if(!weight||!height){toast(t('toast_fill_body'),'error');return;}
  if(!dob){toast(t('auth_birth_format'),'error');return;}
  const age=new Date().getFullYear()-new Date(dob).getFullYear();
  if(age < 10 || age > 100){toast(t('auth_birth_year'),'error');return;}
  APP.registerData={...APP.registerData,dob,gender,weight,height,age};
  APP.authStep='register3';renderAuth();
}

function renderRegister3() {
  const goals=[['lose','🔥','Perder peso'],['gain','💪','Ganhar massa'],['maintain','⚖️','Manutenção'],['health','🥗','Saúde geral']];
  const acts=[['sed','🪑','Sedentário','Trabalho sentado'],['light','🚶','Leve','1-3x semana'],['mod','🏃','Moderado','3-5x semana'],['active','💪','Muito ativo','6-7x semana']];
  const el = document.getElementById('auth-screen');
  el.innerHTML = `<div class="auth-bg" style="padding-top:20px;overflow-y:auto">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
      <button onclick="APP.authStep='register2';renderAuth()" class="btn btn-icon">←</button>
      <div style="flex:1"><div class="step-indicator">${[0,1,2,3].map(i=>`<div class="step-dot ${i<=2?'done':''}" style="flex:1"></div>`).join('')}</div></div>
    </div>
    <div class="auth-card" style="margin-bottom:12px">
      <h2 class="auth-title">${t('step')} 3 ${t('of')} 4 — Objetivos</h2>
      <p class="auth-sub">Personalizamos tudo para você</p>
      <div class="input-label" style="margin-bottom:8px">${t('auth_main_goal')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
        ${goals.map(([v,e,n])=>`<div class="opt-card${APP.registerData.goal===v?' selected':''}" onclick="APP.registerData.goal='${v}';renderAuth()" style="padding:12px;border-radius:12px;border:2px solid ${APP.registerData.goal===v?'var(--green)':'var(--border2)'};cursor:pointer;text-align:center;background:${APP.registerData.goal===v?'rgba(34,197,94,.08)':'var(--surface2)'};transition:all .2s"><div style="font-size:24px">${e}</div><div style="font-size:13px;font-weight:600;margin-top:4px">${n}</div></div>`).join('')}
      </div>
      <div class="input-label" style="margin-bottom:8px">${t('auth_activity_level')}</div>
      ${acts.map(([v,e,n,d])=>`<div onclick="APP.registerData.activity='${v}';renderAuth()" style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:12px;border:2px solid ${APP.registerData.activity===v?'var(--green)':'var(--border2)'};cursor:pointer;margin-bottom:8px;background:${APP.registerData.activity===v?'rgba(34,197,94,.08)':'var(--surface2)'};transition:all .2s"><div style="font-size:24px">${e}</div><div><div style="font-size:13px;font-weight:700">${n}</div><div style="font-size:11px;color:var(--text2)">${d}</div></div>${APP.registerData.activity===v?'<span style="margin-left:auto;color:var(--green)">✓</span>':''}</div>`).join('')}
      <button class="btn btn-primary btn-full" onclick="nextRegister3()" style="padding:14px;margin-top:8px">Continuar →</button>
    </div>
  </div>`;
}

function nextRegister3() {
  if(!APP.registerData.goal){toast(t('toast_select_goal'),'error');return;}
  if(!APP.registerData.activity){toast(t('toast_select_act'),'error');return;}
  APP.authStep='register4';renderAuth();
}

function renderRegister4() {
  const el = document.getElementById('auth-screen');
  el.innerHTML = `<div class="auth-bg" style="padding-top:20px;overflow-y:auto">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
      <button onclick="APP.authStep='register3';renderAuth()" class="btn btn-icon">←</button>
      <div style="flex:1"><div class="step-indicator">${[0,1,2,3].map(i=>`<div class="step-dot done" style="flex:1"></div>`).join('')}</div></div>
    </div>
    <div class="auth-card">
      <h2 class="auth-title">${t('step')} 4 ${t('of')} 4 — Preferências</h2>
      <p class="auth-sub">Últimos ajustes</p>
      <div class="input-label" style="margin-bottom:8px">Idioma preferido</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
        ${t('languages').map(l=>`<div class="lang-option ${APP.lang===l.code?'active':''}" onclick="saveUserLanguage('${l.code}');renderAuth()"><span class="lang-flag">${l.flag}</span><span class="lang-name">${l.name}</span></div>`).join('')}
      </div>
      <div class="input-label" style="margin-bottom:8px">Notificações</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
        ${[['push','📱','Push no celular'],['whatsapp','💬','WhatsApp'],['sms','📱','SMS'],['email','📧','Email'],['telegram','✈️','Telegram']].map(([v,e,n])=>`<label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px;border-radius:10px;border:1px solid ${v==='telegram'?'rgba(34,158,217,.25)':'var(--border)'};background:${v==='telegram'?'rgba(34,158,217,.06)':'var(--surface2)'}"><input type="checkbox" id="notif-${v}" style="accent-color:${v==='telegram'?'#229ED9':'var(--green)'}" ${v==='push'?'checked':''}> <span style="font-size:16px">${e}</span> <span style="font-size:13px">${n}</span></label>`).join('')}
      </div>
      <button id="register-btn" class="btn btn-primary btn-full" onclick="completeRegister()" style="padding:14px">Criar minha conta</button>
    </div>
  </div>`;
}

async function completeRegister() {
  const rd = APP.registerData;
  const btn = document.querySelector('#register-btn');
  if(btn){ btn.disabled=true; btn.classList.add('btn-loading'); btn.dataset.label=btn.textContent; btn.textContent='Criando conta...'; }

  try {
    if(!rd.email || !rd.password || !rd.name || !rd.weight || !rd.height || !rd.goal || !rd.activity) {
      toast('Revise os passos anteriores. Faltam dados obrigatorios.','error');
      APP.authStep = 'register';
      renderAuth();
      return;
    }

    const { data, error } = await sbSignUp(rd.email, rd.password, rd.name);

    if (error) {
      if (error.message.includes('already registered')) {
        toast('Este email já tem cadastro. Tente reenviar a confirmação ou fazer login.','info',6000);
        renderExistingAccountNotice(rd.email);
      }
      else toast('Erro no cadastro: ' + error.message, 'error', 7000);
      return;
    }

    if (isExistingAccountSignup(data)) {
      toast('Este email ja existe. Entre com sua senha ou recupere o acesso.','info',7000);
      renderExistingAccountNotice(rd.email);
      return;
    }

    APP.user = { email: rd.email, name: rd.name, id: data.user?.id };
    APP.profile = {
      name: rd.name, weight: parseFloat(rd.weight), height: parseFloat(rd.height),
      age: rd.age||30, gender: rd.gender||'m', goal: rd.goal||'lose',
      activity: rd.activity||'mod', dob: rd.dob, restrictions:[]
    };
    APP.calc = calcProfile(APP.profile);
    APP.water = 0; APP.meals = [];
    APP.weightHistory = [{ date: new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}), peso: APP.profile.weight }];
    APP.session = data.session?.access_token || null;

    clearSensitiveLocalCache();

    if (data.user?.id && data.session?.access_token) {
      try {
        await sbSavePerfil(data.user.id, {
          nome: rd.name, email: rd.email,
          peso: parseFloat(rd.weight), altura: parseFloat(rd.height),
          idade: rd.age||30, genero: rd.gender||'m',
          objetivo: rd.goal||'lose', atividade: rd.activity||'mod'
        });
        await sbSaveOnboardingGoal(data.user.id, rd.goal||'lose', { source: 'short_onboarding' });
        await sbRecordConsent(data.user.id, { source: 'register', user_agent: navigator.userAgent, app: 'VitalIA' });
        await sbAddPeso(data.user.id, parseFloat(rd.weight));
      } catch(syncErr) {
        console.warn('[VitalIA] Cadastro criado, sincronizacao inicial pendente:', syncErr);
        toast('Conta criada. A sincronizacao continuara apos o login.', 'info', 4500);
      }
    }

    confetti();
    if (!data.session) {
      toast('Conta criada. Confirme seu email para liberar o acesso.', 'info', 6000);
      renderEmailConfirmationNotice(rd.email);
    } else {
      toast('Conta criada com sucesso!','success',2500);
      APP.authStep = 'biometric'; renderAuth();
    }
  } catch(e) {
    console.error('[VitalIA] Falha no cadastro:', e);
    toast('Nao foi possivel criar a conta agora. Confira conexao e tente novamente.', 'error', 5000);
  } finally {
    const freshBtn = document.querySelector('#register-btn');
    if(freshBtn){
      freshBtn.disabled=false;
      freshBtn.classList.remove('btn-loading');
      freshBtn.textContent=freshBtn.dataset.label || 'Criar minha conta';
    }
  }
}

function finishAuth() {
  if(!APP.meals) APP.meals = [];
  normalizeMeals();
  if (!APP.calc && APP.profile) APP.calc = calcProfile(APP.profile);
  if (!APP.meals?.length) { APP.water=0; APP.meals=[]; }
  if (!APP.weightHistory?.length) APP.weightHistory = WEIGHT_HISTORY.map((p,i)=>({date:new Date(Date.now()-i*86400000).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),peso:p})).reverse();
  document.getElementById('auth-screen').classList.remove('active');
  startApp();
}

function MOCK_MEALS() {
  return [
    {id:1,time:'07:30',name:'Omelete de espinafre',emoji:'🥚',cal:220,prot:18,carb:4,fat:15,type:'breakfast'},
    {id:2,time:'10:00',name:'Iogurte grego + granola',emoji:'🫙',cal:260,prot:18,carb:30,fat:6,type:'snack'},
    {id:3,time:'13:00',name:'Frango + arroz + feijão',emoji:'🐔',cal:520,prot:42,carb:58,fat:8,type:'lunch'},
    {id:4,time:'16:00',name:'Banana com pasta amendoim',emoji:'🍌',cal:230,prot:8,carb:32,fat:10,type:'snack'},
  ];
}
