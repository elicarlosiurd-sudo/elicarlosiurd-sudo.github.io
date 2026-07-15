/* ═══════════════════════════════════════
   V230-E2 — js/core/app-core.js
   Ex-bloco principal do index.html L85–878 (extração literal, ordem preservada).
   Conteúdo: APP STATE + CALCULATIONS + DATA HELPERS (serviços do coach) + UI HELPERS
═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   APP STATE
═══════════════════════════════════════ */
const APP = {
  lang: localStorage.getItem('v_lang') || (navigator.language?.slice(0,2) || 'pt'),
  darkMode: localStorage.getItem('v_dark') !== 'false',
  tab: 'home',
  user: null,
  profile: null,
  calc: null,
  session: null,

  // Telegram
  telegram: JSON.parse(localStorage.getItem('v_telegram') || 'null'),
  // telegram = {connected, username, chatId, notifs:{meals,water,streak,achievements,weekly,motivational}, otpCode, otpExpires}

  // Daily data
  mood: null, water: 0, calories: 0, meals: [],
  fastingActive: false, fastStart: null, fastProtocol: '16:8',
  waterContext: JSON.parse(localStorage.getItem('v_water_context') || '{"climate":"normal","activityMinutes":45}'),
  fastingHistory: JSON.parse(localStorage.getItem('v_fasting_history') || '[]'),
  coachMsgs: [],
  coachLoading: false,
  chatHistory: [],

  // Progress
  weightHistory: [],
  xp: 0,
  streak: 0,

  // Shopping
  shopItems: null,

  // Auth state
  authStep: 'login', // login | register | register2 | register3 | register4 | biometric | pin
  registerData: {},
  pinInput: '',
  pinAttempts: 0,
  loginLoading: false,
};

if (!LANG[APP.lang]) APP.lang = 'pt';
try { document.documentElement.lang = ({pt:'pt-BR',en:'en',es:'es',ru:'ru'}[APP.lang] || APP.lang); } catch(_) {}
const CP1252_BYTES = {0x20AC:0x80,0x201A:0x82,0x0192:0x83,0x201E:0x84,0x2026:0x85,0x2020:0x86,0x2021:0x87,0x02C6:0x88,0x2030:0x89,0x0160:0x8A,0x2039:0x8B,0x0152:0x8C,0x017D:0x8E,0x2018:0x91,0x2019:0x92,0x201C:0x93,0x201D:0x94,0x2022:0x95,0x2013:0x96,0x2014:0x97,0x02DC:0x98,0x2122:0x99,0x0161:0x9A,0x203A:0x9B,0x0153:0x9C,0x017E:0x9E,0x0178:0x9F};
function decodeMojibakeSegment(segment) {
  try {
    const bytes = [];
    for (const ch of segment) {
      const cp = ch.codePointAt(0);
      if (cp <= 255) bytes.push(cp);
      else if (CP1252_BYTES[cp] !== undefined) bytes.push(CP1252_BYTES[cp]);
      else return segment;
    }
    return new TextDecoder('utf-8', {fatal:false}).decode(new Uint8Array(bytes));
  } catch(_) { return segment; }
}
function repairMojibakeText(value) {
  const mojibakeProbe = /[\u00c3\u00c2\u00d0\u00d1\u00f0\u00e2\u00ef]/;
  if (typeof value !== 'string' || !mojibakeProbe.test(value)) return value;
  try {
    let fixed = decodeMojibakeSegment(value);
    if (fixed.includes('\uFFFD')) {
      fixed = value.replace(/[\u00c3\u00c2\u00d0\u00d1\u00f0\u00e2\u00ef][^\s<>"']*/g, segment => {
        const decoded = decodeMojibakeSegment(segment);
        return decoded.includes('\uFFFD') ? segment : decoded;
      });
    }
    const badBefore = (value.match(new RegExp(mojibakeProbe.source, 'g')) || []).length;
    const badAfter = (fixed.match(new RegExp(mojibakeProbe.source, 'g')) || []).length;
    return badAfter < badBefore ? fixed : value;
  } catch(_) { return value; }
}
function repairI18n(value) {
  if (typeof value === 'string') return repairMojibakeText(value);
  if (Array.isArray(value)) return value.map(repairI18n);
  if (value && typeof value === 'object') {
    const out = {};
    Object.keys(value).forEach(k => out[k] = repairI18n(value[k]));
    return out;
  }
  return value;
}
function repairVisibleText(root) {
  if (!root) return;
  try {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n => { n.nodeValue = repairMojibakeText(n.nodeValue); });
    root.querySelectorAll?.('[placeholder],[title],[aria-label],input[value]').forEach(el => {
      ['placeholder','title','aria-label','value'].forEach(attr => {
        if (el.hasAttribute(attr)) el.setAttribute(attr, repairMojibakeText(el.getAttribute(attr)));
      });
    });
  } catch(_) {}
}
function t(key, ...args) {
  const v = LANG[APP.lang]?.[key] ?? LANG.pt?.[key] ?? key;
  return repairI18n(typeof v === 'function' ? v(...args) : v);
}
function getLang() {
  var source = LANG[APP.lang] || LANG.pt || {};
  var out = {};
  Object.keys(source).forEach(function(key){ out[key] = t(key); });
  return out;
}
function localeForLang(lang) {
  return ({pt:'pt-BR', en:'en-US', es:'es-ES', ru:'ru-RU'}[lang || APP.lang] || 'pt-BR');
}

function unitSystemForLang(lang) {
  return normalizeLang(lang || getUserLanguage?.() || APP.lang) === 'en' ? 'imperial' : 'metric';
}

function unitContext(lang) {
  var l = normalizeLang(lang || getUserLanguage?.() || APP.lang);
  var imperial = unitSystemForLang(l) === 'imperial';
  return {
    lang:l,
    system: imperial ? 'imperial' : 'metric',
    weight_unit: imperial ? 'lb' : t('unit_weight'),
    height_unit: imperial ? 'ft/in' : t('unit_height'),
    volume_unit: imperial ? 'fl oz' : t('unit_volume'),
    distance_unit: imperial ? 'mi' : t('unit_distance')
  };
}

function formatWeight(kg, lang) {
  var n = Number(kg || 0);
  if (!n) return 'n/a';
  if (unitSystemForLang(lang) === 'imperial') return Math.round(n * 2.20462) + ' lb';
  return Math.round(n * 10) / 10 + ' kg';
}

function formatHeight(cm, lang) {
  var n = Number(cm || 0);
  if (!n) return 'n/a';
  if (unitSystemForLang(lang) === 'imperial') {
    var inches = Math.round(n / 2.54);
    return Math.floor(inches / 12) + "'" + (inches % 12) + '"';
  }
  return Math.round(n) + ' cm';
}

function formatVolumeMl(ml, lang) {
  var n = Number(ml || 0);
  if (!n) return '0 ' + (unitSystemForLang(lang) === 'imperial' ? 'fl oz' : 'ml');
  if (unitSystemForLang(lang) === 'imperial') return Math.round((n / 29.5735) * 10) / 10 + ' fl oz';
  return n >= 1000 ? (Math.round((n / 1000) * 10) / 10 + ' L') : Math.round(n) + ' ml';
}

function formatDistanceKm(km, lang) {
  var n = Number(km || 0);
  if (unitSystemForLang(lang) === 'imperial') return Math.round((n * 0.621371) * 10) / 10 + ' mi';
  return Math.round(n * 10) / 10 + ' km';
}

function healthConsentKey(userId) {
  return userScopedKey('v_health_ai_consent', userId || currentUserId());
}

function hasHealthAIConsent(userId) {
  try { return localStorage.getItem(healthConsentKey(userId)) === CONFIG.PRIVACY_VERSION; } catch(_) { return false; }
}

function saveHealthAIConsent(userId) {
  var id = userId || currentUserId();
  try { localStorage.setItem(healthConsentKey(id), CONFIG.PRIVACY_VERSION); } catch(_) {}
  try { if (id) sbRecordConsent(id, { source:'coach_gate', app_version:CONFIG.APP_VERSION }); } catch(_) {}
  vitaliaLogEvent('info', 'privacy_consent', 'health_ai_consent_accepted', { privacy_version:CONFIG.PRIVACY_VERSION });
}

function showHealthConsentModal(nextTab) {
  var body = ''
    + '<div class="premium-card" style="padding:18px;border-radius:22px;margin-bottom:14px">'
    + '<p style="color:var(--text2);line-height:1.65;margin:0">' + t('health_consent_body') + '</p>'
    + '</div>'
    + '<button class="btn btn-primary btn-full" onclick="saveHealthAIConsent();closeModal();navigate(&quot;' + (nextTab || 'coach') + '&quot;)">' + t('health_consent_accept') + '</button>'
    + '<button class="btn btn-outline btn-full" style="margin-top:10px" onclick="closeModal();toast(t(&quot;health_consent_required&quot;),&quot;info&quot;,3600)">' + t('health_consent_decline') + '</button>';
  openModal(t('health_consent_title'), body);
}

function bodyTwinConsentKey(userId) {
  return userScopedKey('v_body_twin_consent', userId || currentUserId());
}

function hasBodyTwinConsent(userId) {
  try { return localStorage.getItem(bodyTwinConsentKey(userId)) === 'bt-v1'; } catch(_) { return false; }
}

function saveBodyTwinConsent(userId) {
  var id = userId || currentUserId();
  try { localStorage.setItem(bodyTwinConsentKey(id), 'bt-v1'); } catch(_) {}
  try { if (id) sbRecordConsent(id, { kind:'body_twin', consent_version:'bt-v1', source:'bodytwin_gate', app_version:CONFIG.APP_VERSION }); } catch(_) {}
  vitaliaLogEvent('info', 'privacy_consent', 'body_twin_consent_accepted', { consent_version:'bt-v1' });
}

function showBodyTwinConsentModal(nextTab) {
  var body = ''
    + '<div class="premium-card" style="padding:18px;border-radius:22px;margin-bottom:14px">'
    + '<p style="color:var(--text2);line-height:1.65;margin:0">' + t('bodytwin_consent_body') + '</p>'
    + '</div>'
    + '<button class="btn btn-primary btn-full" onclick="saveBodyTwinConsent();closeModal();navigate(&quot;' + (nextTab || 'bodytwin') + '&quot;)">' + t('bodytwin_consent_accept') + '</button>'
    + '<button class="btn btn-outline btn-full" style="margin-top:10px" onclick="closeModal();toast(t(&quot;bodytwin_consent_required&quot;),&quot;info&quot;,3600)">' + t('bodytwin_consent_decline') + '</button>';
  openModal(t('bodytwin_consent_title'), body);
}

function auditI18NHardcoded(root) {
  var words = ['Seu','Plano','Continuar','Nutrição','Receitas','Configurações','Senha','Conta','Refeição','Hidratação','Jejum'];
  var hits = [];
  try {
    var txt = (root || document.body).innerText || '';
    words.forEach(function(w){ if (new RegExp('\\b'+w+'\\b','i').test(txt)) hits.push(w); });
  } catch(_) {}
  return hits;
}
const VISIBLE_I18N_PATCH = {
  en: {
    'Saúde com Inteligência':'Health with Intelligence','E-MAIL':'EMAIL','SENHA':'PASSWORD','OU':'OR','Ainda não tem conta?':'No account yet?','Comece agora →':'Start now →','Outros métodos de acesso':'Other sign-in methods',
    'Sua conta':'Your account','Escolha seu objetivo logo no inicio. Depois, crie suas credenciais.':'Choose your main goal first. Then create your credentials.','Confirmar senha':'Confirm password','Repita a senha':'Repeat password','Concordo com os':'I agree to the','Termos de Uso':'Terms of Use','Política de Privacidade':'Privacy Policy','Autorizo o tratamento de dados de saúde, nutrição, hidratação, peso e humor para personalização do VitalIA.':'I authorize processing health, nutrition, hydration, weight and mood data to personalize VitalIA.','Continuar →':'Continue →',
    'Perfil físico':'Physical profile','Para cálculos precisos de nutrição':'For precise nutrition calculations','Data de nasc.':'Birth date','Digite direto, exemplo: 14/08/1981':'Type directly, example: 08/14/1981','Sexo':'Sex','Masculino':'Male','Feminino':'Female','Prefiro não dizer':'Prefer not to say','Peso (kg)':'Weight (kg)','Altura (cm)':'Height (cm)',
    'Objetivos':'Goals','Personalizamos tudo para você':'We personalize everything for you','Objetivo principal':'Main goal','Nível de atividade':'Activity level','Perder peso':'Lose weight','Ganhar massa':'Gain muscle','Manutenção':'Maintenance','Saúde geral':'General health','Sedentário':'Sedentary','Trabalho sentado':'Desk work','Leve':'Light','Moderado':'Moderate','Muito ativo':'Very active'
  },
  es: {
    'Saúde com Inteligência':'Salud con Inteligencia','E-MAIL':'EMAIL','SENHA':'CONTRASEÑA','OU':'O','Ainda não tem conta?':'¿Aún no tienes cuenta?','Comece agora →':'Empieza ahora →','Outros métodos de acesso':'Otros métodos de acceso',
    'Sua conta':'Tu cuenta','Escolha seu objetivo logo no inicio. Depois, crie suas credenciais.':'Elige tu objetivo principal primero. Luego crea tus credenciales.','Confirmar senha':'Confirmar contraseña','Repita a senha':'Repite la contraseña','Concordo com os':'Acepto los','Termos de Uso':'Términos de Uso','Política de Privacidade':'Política de Privacidad','Autorizo o tratamento de dados de saúde, nutrição, hidratação, peso e humor para personalização do VitalIA.':'Autorizo el tratamiento de datos de salud, nutrición, hidratación, peso y humor para personalizar VitalIA.','Continuar →':'Continuar →',
    'Perfil físico':'Perfil físico','Para cálculos precisos de nutrição':'Para cálculos nutricionales precisos','Data de nasc.':'Fecha de nac.','Digite direto, exemplo: 14/08/1981':'Escribe directo, ejemplo: 14/08/1981','Sexo':'Sexo','Masculino':'Masculino','Feminino':'Femenino','Prefiro não dizer':'Prefiero no decir','Peso (kg)':'Peso (kg)','Altura (cm)':'Altura (cm)',
    'Objetivos':'Objetivos','Personalizamos tudo para você':'Personalizamos todo para ti','Objetivo principal':'Objetivo principal','Nível de atividade':'Nivel de actividad','Perder peso':'Perder peso','Ganhar massa':'Ganar masa','Manutenção':'Mantenimiento','Saúde geral':'Salud general','Sedentário':'Sedentario','Trabalho sentado':'Trabajo sentado','Leve':'Ligero','Moderado':'Moderado','Muito ativo':'Muy activo'
  },
  ru: {
    'Saúde com Inteligência':'Здоровье с интеллектом','E-MAIL':'EMAIL','SENHA':'ПАРОЛЬ','OU':'ИЛИ','Ainda não tem conta?':'Ещё нет аккаунта?','Comece agora →':'Начать →','Outros métodos de acesso':'Другие способы входа',
    'Sua conta':'Ваш аккаунт','Escolha seu objetivo logo no inicio. Depois, crie suas credenciais.':'Сначала выберите главную цель. Затем создайте данные входа.','Confirmar senha':'Подтвердить пароль','Repita a senha':'Повторите пароль','Concordo com os':'Я принимаю','Termos de Uso':'Условия использования','Política de Privacidade':'Политику конфиденциальности','Autorizo o tratamento de dados de saúde, nutrição, hidratação, peso e humor para personalização do VitalIA.':'Я разрешаю обработку данных здоровья, питания, воды, веса и настроения для персонализации VitalIA.','Continuar →':'Продолжить →',
    'Perfil físico':'Физический профиль','Para cálculos precisos de nutrição':'Для точных расчётов питания','Data de nasc.':'Дата рождения','Digite direto, exemplo: 14/08/1981':'Введите напрямую, например: 14/08/1981','Sexo':'Пол','Masculino':'Мужской','Feminino':'Женский','Prefiro não dizer':'Предпочитаю не указывать','Peso (kg)':'Вес (кг)','Altura (cm)':'Рост (см)',
    'Objetivos':'Цели','Personalizamos tudo para você':'Мы всё персонализируем под вас','Objetivo principal':'Главная цель','Nível de atividade':'Уровень активности','Perder peso':'Снизить вес','Ganhar massa':'Набрать массу','Manutenção':'Поддержание','Saúde geral':'Общее здоровье','Sedentário':'Малоподвижный','Trabalho sentado':'Сидячая работа','Leve':'Лёгкий','Moderado':'Средний','Muito ativo':'Очень активный'
  }
};
Object.assign(VISIBLE_I18N_PATCH.en, {
  'Relatório de Hoje':'Today report','Destaque positivo':'Positive highlight','Score — 7 dias':'Score — 7 days','Média':'Average','Calorias — 7 dias':'Calories — 7 days','Meta':'Goal','Dias OK':'OK days','Relatório Semanal':'Weekly Report','Relatório Mensal':'Monthly Report','Início':'Start','Atual':'Current','Previsão':'Forecast','Exportar histórico':'Export history','Compartilhar':'Share','Análise Preditiva':'Predictive analysis','Comunidade':'Community','Integrações':'Integrations','Minha assinatura':'My subscription','Acesso completo liberado':'Full access unlocked'
});
Object.assign(VISIBLE_I18N_PATCH.es, {
  'Relatório de Hoje':'Informe de hoy','Destaque positivo':'Punto positivo','Score — 7 dias':'Score — 7 días','Média':'Promedio','Calorias — 7 dias':'Calorías — 7 días','Meta':'Meta','Dias OK':'Días OK','Relatório Semanal':'Informe Semanal','Relatório Mensal':'Informe Mensual','Início':'Inicio','Atual':'Actual','Previsão':'Previsión','Exportar histórico':'Exportar historial','Compartilhar':'Compartir','Análise Preditiva':'Análisis predictivo','Comunidade':'Comunidad','Integrações':'Integraciones','Minha assinatura':'Mi suscripción','Acesso completo liberado':'Acceso completo liberado'
});
Object.assign(VISIBLE_I18N_PATCH.ru, {
  'Relatório de Hoje':'Отчёт за сегодня','Destaque positivo':'Позитивный сигнал','Score — 7 dias':'Оценка — 7 дней','Média':'Среднее','Calorias — 7 dias':'Калории — 7 дней','Meta':'Цель','Dias OK':'Дней OK','Relatório Semanal':'Еженедельный отчёт','Relatório Mensal':'Месячный отчёт','Início':'Старт','Atual':'Сейчас','Previsão':'Прогноз','Exportar histórico':'Экспорт истории','Compartilhar':'Поделиться','Análise Preditiva':'Прогнозный анализ','Comunidade':'Сообщество','Integrações':'Интеграции','Minha assinatura':'Моя подписка','Acesso completo liberado':'Полный доступ открыт'
});
function translateVisibleStaticText(root) {
  var dict = VISIBLE_I18N_PATCH[APP.lang];
  if (!dict || !root) return;
  try {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function(n) {
      var v = n.nodeValue;
      Object.keys(dict).forEach(function(k){ v = v.split(k).join(dict[k]); });
      n.nodeValue = v;
    });
  } catch(_) {}
}

/* ═══════════════════════════════════════
   CALCULATIONS
═══════════════════════════════════════ */
function calcProfile(p) {
  if (!p) return null;
  const peso = parseFloat(p.weight), h = parseFloat(p.height), idade = parseInt(p.age);
  const male = p.gender === 'm';
  const imc = +(peso / ((h/100)**2)).toFixed(1);
  const imcClass = imc < 18.5 ? 'Abaixo do peso' : imc < 25 ? 'Normal' : imc < 30 ? 'Sobrepeso' : imc < 35 ? 'Obesidade I' : 'Obesidade II+';
  const tmb = Math.round(male ? 10*peso+6.25*h-5*idade+5 : 10*peso+6.25*h-5*idade-161);
  const acts = {sed:1.2,light:1.375,mod:1.55,active:1.725};
  const tdee = Math.round(tmb*(acts[p.activity]||1.375));
  const goalMap = {lose:Math.max(1200,tdee-400),gain:tdee+300,maintain:tdee,health:tdee};
  const meta = goalMap[p.goal]||tdee;
  const prot = Math.round(peso*1.8), fat = Math.round((meta*.28)/9), carb = Math.round((meta-prot*4-fat*9)/4);
  const agua = Math.round(peso*35), aguaCopos = Math.round(agua/250);
  const pesoIdeal = male ? +(50+2.3*((h-152.4)/2.54)).toFixed(1) : +(45.5+2.3*((h-152.4)/2.54)).toFixed(1);
  const pesoMeta = p.goal==='lose' ? Math.max(pesoIdeal,peso-10) : p.goal==='gain' ? peso+5 : peso;
  const semanas = Math.ceil(Math.abs(peso-pesoMeta)/0.75);
  return {imc,imcClass,tmb,tdee,meta,prot,fat,carb,agua,aguaCopos,pesoIdeal,pesoMeta,semanas,peso,altura:h};
}

function calcDailyScore() {
  const c = APP.calc;
  if (!c) return 0;
  const mealScore = Math.min(APP.meals.length / 5, 1) * 30;
  const waterScore = Math.min(APP.water / (c.aguaCopos||8), 1) * 25;
  const streakScore = Math.min(APP.streak / 30, 1) * 20;
  const qualScore = APP.meals.length > 0 ? 25 : 0;
  return Math.round(mealScore + waterScore + streakScore + qualScore);
}

/* ═══════════════════════════════════════
   DATA HELPERS
═══════════════════════════════════════ */
function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
function currentUserId() {
  return APP.user?.id || '';
}
function userScopedKey(base, userId) {
  var id = userId || currentUserId();
  return id ? base + '_' + id : base + '_guest';
}
function resetSessionVisualState() {
  APP.profile = null;
  APP.calc = null;
  APP.water = 0;
  APP.meals = [];
  APP.mood = null;
  APP.coachMsgs = [];
  APP.chatHistory = [];
  NUTR.analysis = null;
  NUTR.loading = false;
  NUTR.imagePreview = null;
  if (typeof SCAN !== 'undefined') {
    SCAN.result = null;
    SCAN.barcode = '';
  }
}
function addXP(n) {
  APP.xp += n;
  sbGetUser().then(u => { if(u) sbSaveGamificacao(u.id, APP.xp, APP.streak); });
}

function goalLabel(goal) {
  return ({lose:'Emagrecimento', gain:'Hipertrofia', maintain:'Performance', health:'Saude geral'})[goal] || 'Saude geral';
}

function smartHydrationTarget() {
  const p = APP.profile || {};
  const ctx = APP.waterContext || {};
  const weight = Number(p.weight || p.peso || 70);
  const base = weight * 35;
  const activityMin = Number(ctx.activityMinutes || 0);
  const activityExtra = Math.max(0, Math.round(activityMin / 30) * 250);
  const climateExtra = ({cold:-200, normal:0, hot:350, very_hot:600})[ctx.climate || 'normal'] || 0;
  const ml = Math.max(1600, Math.round((base + activityExtra + climateExtra) / 50) * 50);
  return { ml, cups: Math.max(6, Math.round(ml / 250)), base: Math.round(base), activityExtra, climateExtra, temp: ctx.temp, weatherLabel: ctx.weatherLabel || 'manual' };
}

function climateName(value) {
  return ({cold:'Frio', normal:'Normal', hot:'Quente', very_hot:'Muito quente'})[value || 'normal'] || 'Normal';
}

async function updateWeatherHydration(force) {
  if (!force && APP.waterContext?.weatherUpdatedAt && Date.now() - APP.waterContext.weatherUpdatedAt < 60 * 60 * 1000) return;
  if (!navigator.geolocation) return;
  try {
    const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, {enableHighAccuracy:false, timeout:6500, maximumAge:900000}));
    const lat = pos.coords.latitude.toFixed(4), lon = pos.coords.longitude.toFixed(4);
    const resp = await fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=temperature_2m,relative_humidity_2m&timezone=auto', {cache:'no-store'});
    const data = await resp.json();
    const temp = Number(data?.current?.temperature_2m);
    if (!Number.isFinite(temp)) return;
    APP.waterContext = APP.waterContext || {};
    APP.waterContext.temp = Math.round(temp);
    APP.waterContext.weatherLabel = 'clima real';
    APP.waterContext.weatherUpdatedAt = Date.now();
    APP.waterContext.climate = temp >= 32 ? 'very_hot' : temp >= 27 ? 'hot' : temp <= 15 ? 'cold' : 'normal';
    save('v_water_context', APP.waterContext);
    if (APP.tab === 'hydration' || APP.tab === 'home') navigate(APP.tab);
  } catch(e) {
    console.warn('[VitalIA] Clima automático indisponível:', e);
  }
}

function macroTotals() {
  normalizeMeals();
  return {
    kcal: sumKcal(APP.meals),
    prot: APP.meals.reduce((s,m)=>s + Number(m.prot || 0), 0),
    carb: APP.meals.reduce((s,m)=>s + Number(m.carb || 0), 0),
    fat: APP.meals.reduce((s,m)=>s + Number(m.fat || 0), 0)
  };
}

function nutritionQualityScore() {
  const meals = APP.meals || [];
  if (!meals.length) return 0;
  const proteinMeals = meals.filter(m => Number(m.prot || 0) >= 18).length;
  const ultraPenalty = meals.filter(m => /doce|refrigerante|frito|pizza|burger/i.test(m.name || '')).length * 8;
  return Math.max(0, Math.min(100, Math.round((proteinMeals / Math.max(meals.length, 1)) * 55 + Math.min(meals.length, 5) * 9 - ultraPenalty)));
}

function weeklyReportData() {
  const c = APP.calc || {};
  const totals = macroTotals();
  const hyd = smartHydrationTarget();
  const energyPct = Math.min(140, Math.round((totals.kcal / (c.meta || 1800)) * 100));
  const proteinPct = Math.min(160, Math.round((totals.prot / (c.prot || 120)) * 100));
  const waterPct = Math.min(140, Math.round((APP.water / hyd.cups) * 100));
  const quality = nutritionQualityScore();
  const next = [];
  if (proteinPct < 85) next.push('Distribuir proteina em 4 refeicoes e subir +25g/dia.');
  if (waterPct < 90) next.push('Antecipar 2 copos ate o almoco e 1 copo pos-treino.');
  if (energyPct < 75) next.push('Adicionar uma refeicao estrategica antes ou depois do treino.');
  if (quality < 70) next.push('Trocar uma refeicao fraca por receita alta em proteina.');
  if (!next.length) next.push('Manter consistencia e ajustar micro-metas para performance.');
  return { energyPct, proteinPct, waterPct, quality, next: next.slice(0,3), totals };
}

function weeklyInsightText(r) {
  const name = (APP.profile?.name || 'Você').split(' ')[0];
  const goal = goalLabel(APP.profile?.goal || 'health').toLowerCase();
  const strong = [];
  if (r.proteinPct >= 90) strong.push('proteína bem encaminhada');
  if (r.waterPct >= 90) strong.push('hidratação consistente');
  if (r.quality >= 75) strong.push('boa qualidade alimentar');
  const best = strong.length ? strong.join(', ') : 'você já tem dados suficientes para ajustar a próxima semana com precisão';
  const focus = r.proteinPct < 85 ? 'proteína em mais refeições' : r.waterPct < 90 ? 'água mais cedo no dia' : r.quality < 70 ? 'trocas simples por refeições mais limpas' : 'manter constância e subir o nível aos poucos';
  return name + ', sua semana mostra ' + best + '. Para o objetivo de ' + goal + ', o próximo passo é focar em ' + focus + '. Isso aumenta energia, reduz fome fora de hora e protege massa muscular.';
}

const CONFIG = {
  // Placeholder para Backend: em produção, mova chamadas de IA para uma Edge Function/API segura.
  GEMINI_FRONTEND_PLACEHOLDER_KEY: 'BACKEND_ONLY_SUPABASE_EDGE_FUNCTION',
  SUPABASE_URL: typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : '',
  SUPABASE_ANON_KEY: typeof SUPABASE_KEY !== 'undefined' ? SUPABASE_KEY : '',
  APP_VERSION: window.VITALIA_APP_VERSION || 'vitalia-v230e1-coach-module',
  TERMS_VERSION: '2026-06-08',
  PRIVACY_VERSION: '2026-06-08'
};

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, function(ch) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
  });
}
function escHtml(value) {
  return escapeHTML(value);
}

function sanitizeDbString(value, max) {
  return String(value ?? '')
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/\son\w+=/gi, '')
    .slice(0, max || 1200)
    .trim();
}

function sanitizeDbObject(value) {
  if (Array.isArray(value)) return value.map(sanitizeDbObject);
  if (!value || typeof value !== 'object') return typeof value === 'string' ? sanitizeDbString(value) : value;
  var out = {};
  Object.keys(value).forEach(function(k) {
    var v = value[k];
    out[k] = typeof v === 'string' ? sanitizeDbString(v) : sanitizeDbObject(v);
  });
  return out;
}

function clearSensitiveLocalCache() {
  ['v_profile','v_meals','v_weights','v_xp','v_streak','v_session','v_user'].forEach(function(k) {
    try { localStorage.removeItem(k); } catch(_) {}
  });
}

function toastFriendlyError(scope, err) {
  var raw = String(err?.message || err || '').toLowerCase();
  var msg = raw.includes('fetch') || raw.includes('network') || raw.includes('failed')
    ? 'Conexão instável. Seus dados serão sincronizados assim que o servidor responder.'
    : 'Não foi possível concluir agora. Tente novamente em instantes.';
  if (!window.__vitaliaLastErrToast || Date.now() - window.__vitaliaLastErrToast > 5000) {
    window.__vitaliaLastErrToast = Date.now();
    toast(msg, 'info', 3500);
  }
  vitaliaLogEvent('warn', scope || 'app', msg, { raw: String(err?.message || err || '').slice(0, 500) });
}

function vitaliaCaptureSentry(level, scope, message, metadata) {
  try {
    if (!window.Sentry || !window.__vitaliaSentryReady) return;
    var sentryLevel = level === 'error' ? 'error' : level === 'warn' ? 'warning' : 'info';
    window.Sentry.withScope(function(sentryScope) {
      sentryScope.setLevel(sentryLevel);
      sentryScope.setTag('scope', String(scope || 'app').slice(0, 80));
      sentryScope.setTag('app_version', CONFIG.APP_VERSION);
      sentryScope.setContext('vitalia', sanitizeDbObject(metadata || {}));
      window.Sentry.captureMessage(String(message || 'VitalIA event').slice(0, 240));
    });
  } catch (_) {}
}

function vitaliaLogEvent(level, scope, message, meta) {
  try {
    var currentLang = 'pt';
    try { currentLang = typeof getUserLanguage === 'function' ? getUserLanguage() : 'pt'; } catch(_) {}
    var payload = {
      level: String(level || 'info').slice(0, 20),
      scope: String(scope || 'app').slice(0, 80),
      message: sanitizeDbString(message || 'event', 900),
      metadata: sanitizeDbObject(Object.assign({
        app_version: CONFIG.APP_VERSION,
        lang: currentLang,
        path: location.pathname + location.hash,
        user_agent: navigator.userAgent
      }, meta || {}))
    };
    if (typeof console !== 'undefined') {
      (level === 'error' ? console.error : level === 'warn' ? console.warn : console.log)('[VitalIA log]', payload.scope, payload.message, payload.metadata);
    }
    if (level === 'error' || level === 'warn') {
      vitaliaCaptureSentry(payload.level, payload.scope, payload.message, payload.metadata);
    }
    if (!sb || !sb.from) return Promise.resolve(null);
    var uid = null;
    try { uid = typeof currentUserId === 'function' ? currentUserId() : null; } catch(_) { uid = null; }
    var row = Object.assign({ user_id: uid && String(uid).indexOf('local') < 0 ? uid : null, code:payload.level }, payload);
    return sb.from('app_error_logs').insert(row).then(function(){ return row; }).catch(function(){
      var compatible = {
        user_id: row.user_id,
        scope: row.scope,
        code: row.code,
        message: row.message,
        metadata: row.metadata
      };
      return sb.from('app_error_logs').insert(compatible).then(function(){ return compatible; }).catch(function(){ return null; });
    });
  } catch(_) {
    return Promise.resolve(null);
  }
}

window.addEventListener('error', function(event) {
  vitaliaLogEvent('error', 'frontend_runtime', event.message || 'window error', {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

window.addEventListener('unhandledrejection', function(event) {
  var reason = event.reason || {};
  vitaliaLogEvent('error', 'frontend_promise', reason.message || String(reason || 'unhandled rejection'), {
    stack: String(reason.stack || '').slice(0, 900)
  });
});

function getKcal(meal) {
  return Number(meal?.kcal ?? meal?.cal ?? 0) || 0;
}

function normalizeMeal(meal) {
  if (!meal) return meal;
  var out = Object.assign({}, meal);
  out.kcal = getKcal(out);
  delete out.cal;
  out.prot = Number(out.prot || 0);
  out.carb = Number(out.carb || 0);
  out.fat = Number(out.fat || 0);
  return out;
}

function normalizeMeals() {
  APP.meals = (APP.meals || []).map(normalizeMeal);
  return APP.meals;
}

function userMemoryKey(userId) {
  var id = userId || currentUserId() || 'guest';
  return 'vitalia_coach_memory_' + id;
}

function getUserLanguage(userId) {
  var id = userId || currentUserId();
  try {
    var scoped = id ? localStorage.getItem(userScopedKey('v_lang', id)) : '';
    return scoped || APP.lang || localStorage.getItem('v_lang') || 'pt';
  } catch(_) {
    return APP.lang || 'pt';
  }
}

function saveUserLanguage(code, userId) {
  var lang = LANG[code] ? code : 'pt';
  APP.lang = lang;
  try {
    localStorage.setItem('v_lang', lang);
    if (userId || currentUserId()) localStorage.setItem(userScopedKey('v_lang', userId), lang);
    document.documentElement.lang = ({pt:'pt-BR',en:'en',es:'es',ru:'ru'}[lang] || lang);
  } catch(_) {}
  try { coachMemoryService().saveMemory(userId || currentUserId(), 'language', { lang: lang }, { silent:true }); } catch(_) {}
}

function coachMemoryService() {
  function readLocal(userId) {
    try {
      return JSON.parse(localStorage.getItem(userMemoryKey(userId)) || '{}') || {};
    } catch(_) {
      return {};
    }
  }
  function writeLocal(userId, memory) {
    try { localStorage.setItem(userMemoryKey(userId), JSON.stringify(memory || {})); } catch(_) {}
  }
  function appendEvent(userId, type, data) {
    var memory = readLocal(userId);
    memory.events = Array.isArray(memory.events) ? memory.events : [];
    memory.events.unshift({ type:type, data:data || {}, at:new Date().toISOString(), lang:getUserLanguage(userId) });
    memory.events = memory.events.slice(0, 60);
    writeLocal(userId, memory);
    return memory;
  }
  function saveMemory(userId, type, data, opts) {
    var id = userId || currentUserId();
    if (!id) return Promise.resolve(null);
    var memory = appendEvent(id, type, data);
    if (type === 'profile') memory.profile = Object.assign({}, memory.profile || {}, data || {});
    if (type === 'goal') memory.goal = data;
    if (type === 'preference') {
      memory.preferences = memory.preferences || { likes:[], dislikes:[] };
      if (data?.like && memory.preferences.likes.indexOf(data.like) < 0) memory.preferences.likes.push(data.like);
      if (data?.dislike && memory.preferences.dislikes.indexOf(data.dislike) < 0) memory.preferences.dislikes.push(data.dislike);
    }
    if (type === 'language') memory.language = data?.lang || getUserLanguage(id);
    writeLocal(id, memory);
    if (!opts?.silent && sb && id && String(id).indexOf('local') < 0) {
      try {
        return sb.from('coach_memories').insert({
          user_id: id,
          kind: String(type || 'context').slice(0, 40),
          content: JSON.stringify(data || {}),
          confidence: 0.82,
          source: 'frontend-context'
        });
      } catch(_) {}
    }
    return Promise.resolve(memory);
  }
  function getMemory(userId) { return readLocal(userId || currentUserId()); }
  function getRecentMeals(userId) { return (APP.meals || []).slice(-8); }
  function getHydrationStatus(userId) {
    var target = smartHydrationTarget();
    var pct = Math.min(100, Math.round(((APP.water || 0) / Math.max(target.cups || 1, 1)) * 100));
    return { cups: APP.water || 0, targetCups: target.cups, mlTarget: target.ml, pct:pct, context:APP.waterContext || {} };
  }
  function getGoals(userId) {
    var p = APP.profile || {};
    var c = APP.calc || calcProfile(p) || {};
    return { goal:p.goal || p.objetivo || 'health', weight:p.weight || p.peso, height:p.height || p.altura, gender:p.gender || p.genero, calories:c.meta, protein:c.prot, water:c.aguaCopos };
  }
  function getNutritionContext(userId) {
    normalizeMeals();
    var totals = macroTotals();
    var goals = getGoals(userId);
    return {
      totals: totals,
      quality: nutritionQualityScore(),
      proteinPct: goals.protein ? Math.min(160, Math.round((totals.prot / goals.protein) * 100)) : 0,
      kcalPct: goals.calories ? Math.min(160, Math.round((totals.kcal / goals.calories) * 100)) : 0,
      meals: getRecentMeals(userId),
      goals: goals
    };
  }
  return { saveMemory:saveMemory, getMemory:getMemory, getNutritionContext:getNutritionContext, getRecentMeals:getRecentMeals, getHydrationStatus:getHydrationStatus, getGoals:getGoals };
}

function coachContextService() {
  return {
    build:function() {
      var id = currentUserId();
      var svc = coachMemoryService();
      return {
        userId:id,
        language:getUserLanguage(id),
        profile:APP.profile || {},
        goals:svc.getGoals(id),
        units:unitContext(getUserLanguage(id)),
        displays:{
          weight:formatWeight(APP.profile?.weight || APP.profile?.peso, getUserLanguage(id)),
          height:formatHeight(APP.profile?.height || APP.profile?.altura, getUserLanguage(id)),
          hydration:formatVolumeMl((APP.water || 0) * 250, getUserLanguage(id))
        },
        nutrition:svc.getNutritionContext(id),
        hydration:svc.getHydrationStatus(id),
        fasting:{ active:!!(typeof FAST !== 'undefined' && FAST.active), protocol:typeof FAST !== 'undefined' ? FAST.protocol : APP.fastProtocol, history:(APP.fastingHistory || []).slice(0, 10) },
        recentMemory:svc.getMemory(id),
        lastScanner:typeof SCAN !== 'undefined' ? SCAN.result : null,
        streak:APP.streak || 0,
        xp:APP.xp || 0
      };
    }
  };
}

function coachIntentService() {
  return {
    classify:function(msg) {
      var m = normalizeCoachText ? normalizeCoachText(msg) : String(msg || '').toLowerCase();
      if (/\b(scanner|produto|rotulo|codigo de barras|sodio|acucar)\b/.test(m)) return 'scanner_analysis';
      if (/\b(detox|suco verde|desinchar|cleanse)\b|детокс|очищени/.test(m)) return 'detox';
      if (/\b(suco|bebida|smoothie|shake|cha|juice|jugo|licuado)\b|сок|напиток|смузи/.test(m)) return 'juice';
      if (/\b(agua|hidrat|sede|copo|water|hydration)\b|вода|воды/.test(m)) return 'hydration';
      if (/\b(jejum|fasting|janela alimentar|ayuno)\b/.test(m)) return 'fasting';
      if (/\b(compuls|ansiedade|emocional|vontade de comer|beliscar)\b/.test(m)) return 'emotional_eating';
      if (/\b(emagrec|perder peso|secar|gordura|weight.loss|fat.loss|adelgazar)\b|похудени|снижение веса/.test(m)) return 'weight_loss';
      if (/\b(hipertrof|massa|musculo|proteina|muscle|hypertrophy|musculacion)\b|набор масс|гипертрофи|мышц/.test(m)) return 'muscle_gain';
      if (/\b(receita|cardapio|prato|refeicao|jantar|almoco|cafe|recipe|receta|meal)\b|рецепт/.test(m)) return 'recipe';
      if (/\b(lanche|snack)\b/.test(m)) return 'snack';
      if (/\b(motiva|foco|disciplina|desanimo)\b/.test(m)) return 'motivation';
      return 'meal';
    }
  };
}

function coachFeedbackService() {
  function insightText(key, data) {
    var lang = getUserLanguage();
    var dict = {
      hydration_low:{pt:'Você ainda está abaixo da meta de água.',en:'You are still below your water target.',es:'Todavía estás por debajo de tu meta de agua.',ru:'Вы пока ниже цели по воде.'},
      protein_low:{pt:'Hoje sua proteína está baixa para proteger massa muscular.',en:'Your protein is low today for preserving lean mass.',es:'Hoy tu proteína está baja para proteger masa muscular.',ru:'Сегодня белка маловато для сохранения мышц.'},
      consistency_good:{pt:'Boa constância: seu plano segue em movimento.',en:'Good consistency: your plan is moving forward.',es:'Buena constancia: tu plan sigue avanzando.',ru:'Хорошая стабильность: ваш план движется вперед.'},
      calories_low:{pt:'Você consumiu menos calorias do que sua meta até agora.',en:'You have eaten below your calorie target so far.',es:'Has comido por debajo de tu meta calórica hasta ahora.',ru:'Пока вы ниже своей цели по калориям.'},
      scanner_sodium:{pt:'Esse produto merece atenção ao sódio antes de entrar no diário.',en:'This product deserves a sodium check before logging.',es:'Este producto merece revisar sodio antes de guardarlo.',ru:'Перед сохранением продукта стоит проверить натрий.'}
    };
    return (dict[key] && (dict[key][lang] || dict[key].pt)) || key;
  }
  function generate(context) {
    var c = context || coachContextService().build();
    var out = [];
    if (c.hydration.pct < 60) out.push({ type:'hydration_low', module:'hydration', text:insightText('hydration_low') });
    if (c.nutrition.proteinPct < 70) out.push({ type:'protein_low', module:'nutrition', text:insightText('protein_low') });
    if (c.streak >= 3) out.push({ type:'consistency_good', module:'progress', text:insightText('consistency_good') });
    if (c.nutrition.kcalPct > 0 && c.nutrition.kcalPct < 55) out.push({ type:'calories_low', module:'nutrition', text:insightText('calories_low') });
    if (c.lastScanner && /sodio|sodium|alto/i.test(JSON.stringify(c.lastScanner))) out.push({ type:'scanner_sodium', module:'scanner', text:insightText('scanner_sodium') });
    return out.slice(0, 4);
  }
  return { generate:generate };
}

function coachInsightsService() {
  return {
    home:function() {
      var ctx = coachContextService().build();
      var insights = coachFeedbackService().generate(ctx);
      if (!insights.length) insights.push({ type:'consistency_good', module:'progress', text:coachFeedbackService().generate(Object.assign({}, ctx, {streak:3}))[0]?.text || 'Seu plano segue em movimento.' });
      return insights;
    }
  };
}

function capturePreferenceFromText(text) {
  var m = normalizeCoachText ? normalizeCoachText(text) : String(text || '').toLowerCase();
  var dislike = m.match(/(?:nao gosto de|não gosto de|odeio|evito) ([a-zA-ZÀ-ÿ\s]{3,30})/);
  var like = m.match(/(?:gosto de|prefiro|amo) ([a-zA-ZÀ-ÿ\s]{3,30})/);
  if (dislike) coachMemoryService().saveMemory(currentUserId(), 'preference', { dislike:dislike[1].trim() });
  if (like) coachMemoryService().saveMemory(currentUserId(), 'preference', { like:like[1].trim() });
}

function sumKcal(meals) {
  return (meals || []).reduce(function(s,m){ return s + getKcal(m); }, 0);
}

/* ═══════════════════════════════════════
   UI HELPERS
═══════════════════════════════════════ */
function toast(msg, type='info', duration=3000) {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  const icon = document.createElement('span');
  icon.textContent = {success:'✅',error:'❌',info:'💬'}[type] || '💬';
  const text = document.createElement('span');
  text.textContent = repairMojibakeText(String(msg ?? ''));
  el.append(icon, text);
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), duration);
}

function openModal(title, bodyHTML) {
  document.getElementById('modal-title').textContent = repairMojibakeText(String(title ?? ''));
  document.getElementById('modal-body').innerHTML = repairMojibakeText(String(bodyHTML ?? ''));
  document.getElementById('modal-overlay').classList.add('open');
}
function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }

function svgRing(size, stroke, pct, color, bg='#21262d') {
  pct = isNaN(pct) || pct == null ? 0 : Math.max(0, Math.min(100, pct));
  const r = (size-stroke)/2, circ = 2*Math.PI*r, offset = circ*(1-pct/100);
  return `<svg width="${size}" height="${size}" style="transform:rotate(-90deg)"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${bg}" stroke-width="${stroke}"/><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round" style="transition:stroke-dashoffset .8s ease"/></svg>`;
}

function confetti() {
  const colors = ['#22c55e','#38bdf8','#f97316','#fbbf24','#a78bfa','#f472b6'];
  for (let i = 0; i < 30; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.cssText = `left:${Math.random()*100}%;top:-20px;background:${colors[i%colors.length]};width:${5+Math.random()*8}px;height:${5+Math.random()*8}px;animation-delay:${Math.random()*1}s;animation-duration:${2+Math.random()*1}s`;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(), 3500);
  }
}
