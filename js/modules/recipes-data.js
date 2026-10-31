/* ═══════════════════════════════════════
   V230-E2 — js/modules/recipes-data.js
   Ex-bloco principal do index.html L879–1474 (extração literal, ordem preservada).
   Conteúdo: RECIPES DATA + MOCK AI RESPONSES
═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   RECIPES DATA
═══════════════════════════════════════ */
const RECIPES = [];
window.RECIPES = RECIPES;

// The premium bank uses the same validated, localized recipe contract online and offline.
function expandPremiumRecipeBank() {
  var lang=normalizeLang(typeof getUserLanguage==='function'?getUserLanguage():APP.lang);
  var bank=(window.VITALIA_RECIPE_FALLBACK||{})[lang];
  if(!bank || !bank.length)return;
  replaceActiveRecipeBank(adaptRecipeBank(bank,lang));
}

function replaceActiveRecipeBank(recipes) {
  RECIPES.splice(0, RECIPES.length, ...recipes);
  window.RECIPES=RECIPES;
}

function recipePersonalStorageKey() {
  if(typeof currentUserId!=='function' || !currentUserId())return null;
  return userScopedKey('recipe_preferences');
}
function getRecipePersonalState(recipe) {
  try {
    var key=recipePersonalStorageKey();
    var store=key?JSON.parse(localStorage.getItem(key)||'{}'):{};
    return store[(recipe.lang||APP.lang)+':'+(recipe.sourceId||recipe.id)]||{};
  }catch(_){return {};}
}
function updateRecipePersonalState(id, update) {
  try {
    var recipe=window.RECIPES.find(function(item){return item.id===id;});
    var key=recipePersonalStorageKey();if(!recipe || !key)throw new Error('unavailable');
    var store=JSON.parse(localStorage.getItem(key)||'{}');
    var identity=(recipe.lang||APP.lang)+':'+(recipe.sourceId||recipe.id);
    var previous=store[identity]||{};
    store[identity]=Object.assign({},previous,update,{updated_at:new Date().toISOString()});
    localStorage.setItem(key,JSON.stringify(store));
    return {recipe:recipe,previous:previous};
  }catch(_){toast(t('recipes.persistFailed'),'error');return null;}
}
function setRecipePersonalRating(id, rating) {
  if(!Number.isInteger(rating)||rating<1||rating>5)return;
  if(updateRecipePersonalState(id,{rating:rating}))navigate('recipes');
}
function saveRecipeFavorite(id) {
  var current=window.RECIPES.find(function(item){return item.id===id;});if(!current)return;
  var result=updateRecipePersonalState(id,{favorite:!getRecipePersonalState(current).favorite});
  if(result){rememberRecipeSelection(id,'favorite');toast(t(getRecipePersonalState(current).favorite?'recipes.saved':'recipes.unsaved'),'success');navigate('recipes');}
}
function addRecipeToPersonalPlan(id) {
  var result=updateRecipePersonalState(id,{planned:true});
  if(result){rememberRecipeSelection(id,'add_to_plan');if(!result.previous.planned)addXP(15);toast(t('recipes.added'),'success');}
}


var recipesCache = window.recipesCache || {};
window.recipesCache = recipesCache;

function normalizeLang(code) {
  var raw = String(code || 'en').trim().toLowerCase();
  // eslint-disable-next-line no-misleading-character-class -- pré-existente no index.html; corrigir na V231
  raw = raw.replace(/[🇧🇷🇺🇸🇪🇸🇷🇺]/g, '').trim();
  if (raw === 'português' || raw === 'portugues' || raw === 'portuguese' || raw.indexOf('pt') === 0) return 'pt';
  if (raw === 'english' || raw.indexOf('en') === 0) return 'en';
  if (raw === 'español' || raw === 'espanol' || raw === 'spanish' || raw.indexOf('es') === 0) return 'es';
  if (raw === 'русский' || raw === 'russian' || raw.indexOf('ru') === 0) return 'ru';
  return 'en';
}

function normalizeRecipeLang(code) { return normalizeLang(code); }

function normalizeSearchText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s_-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function recipeArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return String(value).split(/\n|;|,/).map(function(v){ return v.trim(); }).filter(Boolean);
}

function recipeFilterKeysFromText(text, nut) {
  var s = normalizeSearchText(text);
  var keys = [];
  function add(key){ if (keys.indexOf(key) < 0) keys.push(key); }
  if (/emagrec|weight loss|adelgaz|perdida de peso|похуд|снижен/.test(s)) add('weight_loss');
  if (/massa|muscle|musculo|ganancia|набор|масса/.test(s)) add('muscle_gain');
  if (/vegano|vegan|веган/.test(s)) add('vegan');
  if (/sem gluten|gluten free|sin gluten|без глютена/.test(s)) add('gluten_free');
  if (/low carb|baixo carbo|bajo carbo|низкоуглевод/.test(s)) add('low_carb');
  if (/alta proteina|high protein|alta proteina|много белка|белок/.test(s)) add('high_protein');
  if (/sem lactose|lactose free|sin lactosa|без лактозы/.test(s)) add('lactose_free');
  if (/detox|детокс/.test(s)) add('detox');
  if (/prebiot|prebiotic|пребиот/.test(s)) add('prebiotic');
  if (/gestante|pregnan|embarazo|беремен/.test(s)) add('pregnant');
  if (/menstrual|period|periodo|цикл|менстру/.test(s)) add('menstrual');
  if (/pre treino|pre workout|pre entreno|до тренировки/.test(s)) add('pre_workout');
  if (/pos treino|post workout|post entreno|после тренировки/.test(s)) add('post_workout');
  if (/omega|omega 3|омега/.test(s)) add('omega3');
  if (/ferro|iron|hierro|желез/.test(s)) add('iron');
  if (/anti inflam|anti-inflam|anti inflammatory|противовоспал/.test(s)) add('anti_inflammatory');
  if (Number(nut.prot || nut.protein || nut.proteina || nut['белок'] || 0) >= 25) add('high_protein');
  if (Number(nut.carb || nut.carbs || nut.carbo || nut.carbos || nut['углеводы'] || 0) <= 20) add('low_carb');
  return keys;
}

function recipeMealTypeFromText(text) {
  var s = normalizeSearchText(text);
  if (/breakfast|cafe|café|desayuno|завтрак|omelet|omelete|омлет|oatmeal|каша|panqueca|pancake/.test(s)) return 'breakfast';
  if (/snack|lanche|merienda|перекус|полдник|smoothie|shake|iogurte|yogurt|йогурт/.test(s)) return 'snack';
  if (/dinner|jantar|cena|ужин|soup|sopa|caldo|суп/.test(s)) return 'dinner';
  if (/lunch|almoco|almoço|almuerzo|обед/.test(s)) return 'lunch';
  return 'lunch';
}

function recipeGoalFromKeys(keys) {
  if (keys.indexOf('weight_loss') >= 0) return 'lose';
  if (keys.indexOf('muscle_gain') >= 0) return 'gain';
  return 'maintain';
}

async function fetchRecipeJsonForLang(lang, ts) {
  var filename = 'receitas_' + lang + '.json';
  var version = CONFIG.APP_VERSION;
  var urls = [
    './' + filename + '?v=' + version
  ];
  var lastError = null;
  for (var u = 0; u < urls.length; u++) {
    try {
      console.log('[Recipes] Trying:', urls[u]);
      var controller = new AbortController();
      var tid = setTimeout(function(){ try { controller.abort(); } catch(_) {} }, 6000);
      var resp = await fetch(urls[u], { signal: controller.signal, cache: 'no-store' });
      clearTimeout(tid);
      if (!resp.ok) { console.warn('[Recipes] HTTP', resp.status, urls[u]); continue; }
      var raw = await resp.text();
      var data = JSON.parse(raw);
      var arr = Array.isArray(data) ? data : (data && Array.isArray(data.recipes) ? data.recipes : null);
      if (arr && arr.length > 0) {
        arr.forEach(function(r) { normalizeRecipeContract(r, lang); });
        return { lang: lang, recipes: arr, url: urls[u] };
      }
    } catch(e) {
      try { clearTimeout(tid); } catch(_) {}
      lastError = e;
      console.error('[Recipes] FAILED:', urls[u], e.message);
    }
  }
  return { lang: lang, recipes: null, error: lastError };
}

async function loadExternalRecipes() {
  try {
    var requestedLang = normalizeLang(getUserLanguage ? getUserLanguage() : (APP.lang || 'pt'));
    APP.lang = requestedLang;
    if (window._recipesLang === requestedLang && window._recipesLoaded) return;
    window._recipesError = null;
    window._recipesFallbackEmbedded = false;
    if (recipesCache[requestedLang] && recipesCache[requestedLang].length) {
      replaceActiveRecipeBank(recipesCache[requestedLang]);
      window._recipesLang = requestedLang;
      window._recipesLoaded = true;
      if (APP.tab === 'recipes') navigate('recipes');
      return;
    }

  // PASSO 1: Feedback visual imediato
    var recList = document.getElementById('rec-list');
    var langNames = {pt:'Portugu\u00eas',en:'English',es:'Espa\u00f1ol',ru:'\u0420\u0443\u0441\u0441\u043a\u0438\u0439'};
    if (recList) recList.innerHTML = '<div style="text-align:center;padding:60px 20px"><div style="font-size:36px;margin-bottom:16px;animation:spin 1.5s linear infinite;display:inline-block">\u2699\ufe0f</div><div style="font-size:15px;color:var(--text);font-weight:700">' + t('rec_loading') + '</div><div style="font-size:12px;color:var(--text3);margin-top:6px">' + (langNames[requestedLang]||requestedLang) + '</div></div>';

  // Same-language bank, then a bundled subset of that exact bank.
    var ts = Date.now();
    var recipesArray = null;
    var loadedLang = requestedLang;
    var attempts = [requestedLang];
    for (var a = 0; a < attempts.length; a++) {
      var result = await fetchRecipeJsonForLang(attempts[a], ts);
      if (result.recipes && Array.isArray(result.recipes) && result.recipes.length) {
        recipesArray = result.recipes;
        loadedLang = result.lang;
        console.log('[Recipes] SUCCESS: ' + recipesArray.length + ' recipes (' + loadedLang + ') from', result.url);
        break;
      }
    }

  // PASSO 3: Se falhou, usa receitas embutidas e libera a UI para evitar travamento no loader.
    if (!recipesArray || !Array.isArray(recipesArray) || recipesArray.length === 0) {
      console.error('[Recipes] ALL URLS FAILED for', requestedLang);
      recipesArray = (window.VITALIA_RECIPE_FALLBACK || {})[requestedLang];
      if (!recipesArray || !recipesArray.length) throw new Error('same-language recipe fallback unavailable');
      window._recipesFallbackEmbedded = true;
    }

  // PASSO 4: Adaptar receitas ao formato interno
    var adapted = adaptRecipeBank(recipesArray, loadedLang);
    if (!adapted.length) throw new Error('recipes adapter returned empty list');
    recipesCache[requestedLang] = adapted;

  // PASSO 5: Atualizar variável GLOBAL — window.RECIPES
    // Ignore a late response after the user changes language.
    if (requestedLang !== normalizeLang(getUserLanguage ? getUserLanguage() : APP.lang)) return;
    replaceActiveRecipeBank(adapted);
    window._recipesLang = requestedLang;
    window._recipesLoaded = true;
    window._recipesError = null;

  // PASSO 6: Enriquecer tags
    if (typeof enrichRecipeTags === 'function') enrichRecipeTags();

  // PASSO 7: Re-renderizar APÓS dados na variável global
    console.log('[Recipes] GLOBAL RECIPES count:', window.RECIPES.length, '(' + requestedLang + ')');
    if (APP.tab === 'recipes') navigate('recipes');
  } catch(e) {
    console.error('Erro ao carregar receitas:', e);
    window._recipesLoaded = true;
    window._recipesError = t('rec_load_error');
    var lang = normalizeLang(getUserLanguage ? getUserLanguage() : (APP.lang || 'pt'));
    var list = document.getElementById('rec-list');
    if (list) list.innerHTML = showRecipeErrorState(lang);
    if (APP.tab === 'recipes') toast(t('rec_load_error'), 'error', 3000);
  }
}

// Additive contract: legacy JSON keys remain supported without duplicating bank text.
var RECIPE_LABEL_COPY = {
  pt: { breakfast: 'Café da manhã', lunch: 'Almoço', dinner: 'Jantar', snack: 'Lanche', drink: 'Bebida', special: 'Especial', weight_loss: 'Controle de peso', maintenance: 'Manutenção', muscle_gain: 'Ganho muscular', energy: 'Energia', detox: 'Leve', low_carb: 'Menos carboidratos', high_protein: 'Alta proteína', vegetarian: 'Vegetariano', diabetic: 'Foco metabólico' },
  en: { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack', drink: 'Drink', special: 'Special', weight_loss: 'Weight management', maintenance: 'Maintenance', muscle_gain: 'Muscle gain', energy: 'Energy', detox: 'Light', low_carb: 'Lower carbohydrate', high_protein: 'High protein', vegetarian: 'Vegetarian', diabetic: 'Metabolic focus' },
  es: { breakfast: 'Desayuno', lunch: 'Almuerzo', dinner: 'Cena', snack: 'Merienda', drink: 'Bebida', special: 'Especial', weight_loss: 'Control de peso', maintenance: 'Mantenimiento', muscle_gain: 'Ganancia muscular', energy: 'Energía', detox: 'Ligero', low_carb: 'Menos carbohidratos', high_protein: 'Alta proteína', vegetarian: 'Vegetariano', diabetic: 'Enfoque metabólico' },
  ru: { breakfast: 'Завтрак', lunch: 'Обед', dinner: 'Ужин', snack: 'Перекус', drink: 'Напиток', special: 'Особое', weight_loss: 'Контроль веса', maintenance: 'Поддержание', muscle_gain: 'Набор мышц', energy: 'Энергия', detox: 'Лёгкое', low_carb: 'Меньше углеводов', high_protein: 'Много белка', vegetarian: 'Вегетарианское', diabetic: 'Метаболическое здоровье' }
};
function localizedRecipeLabel(label, lang) {
  return (RECIPE_LABEL_COPY[lang] && RECIPE_LABEL_COPY[lang][label]) || label;
}
function normalizeRecipeContract(recipe, lang) {
  if (!recipe || recipe.lang !== lang) throw new Error('recipe language mismatch');
  var benefits = recipeArray(recipe.benefits || recipe.nutrition_benefits || recipe.nutritionist_note);
  var insights = recipe.ingredient_quantities && globalThis.VITALIA_RECIPE_NUTRITION ? globalThis.VITALIA_RECIPE_NUTRITION.buildRecipeNutritionInsights(recipe,lang) : null;
  if(insights && !recipe.benefits && !recipe.nutrition_benefits)benefits=insights.benefits;
  var labels = recipeArray(recipe.labels || recipe.tags).map(function(label) {
    return localizedRecipeLabel(label, lang);
  });
  var result = {
    title: recipe.title, ingredients: recipeArray(recipe.ingredients), steps: recipeArray(recipe.steps),
    chef_note: recipe.chef_note, nutritionist_note: recipe.nutritionist_note,
    macros: recipe.macros, labels: labels, benefits: Array.from(new Set(benefits)),
    nutritional_focus: recipe.nutritional_focus || recipe.foco || recipe.focus || (insights && insights.nutritional_focus) || recipe.nutritionist_note,
    benefit_evidence: insights ? insights.benefit_evidence : []
  };
  if (recipe.nutrition_basis && recipe.ingredient_quantities && globalThis.VITALIA_RECIPE_NUTRITION) {
    if (result.ingredients.length !== recipe.ingredient_quantities.length || result.ingredients.some(function(ingredient,index){return ingredient!==recipe.ingredient_quantities[index].ingredient;}))throw new Error('recipe ingredient/portion mismatch');
    var calculated = globalThis.VITALIA_RECIPE_NUTRITION.calculateRecipeNutrition(recipe.ingredient_quantities);
    Object.keys(calculated).forEach(function(key) { if(calculated[key] !== recipe.macros[key]) throw new Error('recipe nutrition drift: ' + key); });
    result.ingredients = globalThis.VITALIA_RECIPE_NUTRITION.renderRecipePortions(recipe.ingredient_quantities, lang);
  }
  ['title', 'chef_note', 'nutritionist_note', 'nutritional_focus'].forEach(function(key) {
    if (typeof result[key] !== 'string' || !result[key].trim()) throw new Error('recipe field missing: ' + key);
  });
  ['ingredients', 'steps', 'labels', 'benefits'].forEach(function(key) {
    if (!result[key].length || result[key].some(function(v) { return typeof v !== 'string' || !v.trim(); })) throw new Error('recipe array empty: ' + key);
  });
  ['kcal', 'protein', 'carbs', 'fat'].forEach(function(key) {
    if (!Number.isFinite(result.macros && result.macros[key]) || result.macros[key] < 0) throw new Error('recipe macro invalid: ' + key);
  });
  return result;
}

function showRecipeErrorState(lang) {
  lang = normalizeLang(lang || APP.lang || 'pt');
  return `<div class="v-card v-safe-text" style="margin:0 16px 16px;padding:28px;text-align:center">
    <div style="font-size:34px;margin-bottom:10px">${vitaliaIcon('recipes')}</div>
    <div style="font-size:16px;font-weight:800;color:var(--text);margin-bottom:6px">${t('rec_load_error')}</div>
    <div style="font-size:12px;color:var(--text2);line-height:1.5;margin-bottom:14px">Lang: ${lang}${window._recipesError ? ' · ' + escapeHTML(String(window._recipesError).slice(0, 90)) : ''}</div>
    <button class="btn btn-primary" onclick="window._recipesLoaded=false;window._recipesError=null;loadExternalRecipes();navigate('recipes')" style="padding:12px 18px">${t('rec_reload')}</button>
  </div>`;
}

// Receitas já embutidas no código — fetch externo desativado

const PRODUCTS = [
  {code:'7891000315507',name:'Leite Integral Nestlé',brand:'Nestlé',sem:'🟡',score:6,cal100:61,cal_serving:153,carb100:'4.7g',prot100:'3.2g',fat100:'3.2g',sodium100:'44mg',serving:'250ml',alerts:['🔴 Gordura saturada: 2g','🟡 Açúcares naturais: 11g'],alt:'Leite desnatado ou vegetal',tags:['Laticínio'],country:'🇧🇷'},
  {code:'7896005800027',name:'Aveia em Flocos Quaker',brand:'Quaker',sem:'🟢',score:9,cal100:366,cal_serving:110,carb100:'63g',prot100:'13g',fat100:'7g',sodium100:'3mg',serving:'30g',alerts:['✅ Alta em fibras'],alt:'Produto ótimo!',tags:['Integral'],country:'🇧🇷'},
  {code:'041570055106',name:'Chobani Greek Yogurt',brand:'Chobani',sem:'🟢',score:9,cal100:97,cal_serving:140,carb100:'7g',prot100:'10g',fat100:'0g',sodium100:'50mg',serving:'170g',alerts:['✅ High protein: 17g','✅ Probiotics'],alt:'Already great!',tags:['High Protein'],country:'🇺🇸'},
  {code:'028400064316',name:"Lay's Classic Chips",brand:'Frito-Lay',sem:'🔴',score:2,cal100:536,cal_serving:160,carb100:'56g',prot100:'7g',fat100:'32g',sodium100:'536mg',serving:'30g',alerts:['🔴 High sodium','🔴 Ultra-processed'],alt:'Air-popped popcorn',tags:['Ultra-processed'],country:'🇺🇸'},
  {code:'4607033310013',name:'Гречка Увелка',brand:'Увелка',sem:'🟢',score:10,cal100:329,cal_serving:165,carb100:'62g',prot100:'13g',fat100:'3g',sodium100:'3mg',serving:'50g',alerts:['✅ Proteína vegetal','✅ Rico em magnésio'],alt:'Produto excelente!',tags:['Integral'],country:'🇷🇺'},
];

const SHOP_ITEMS = [
  {cat:'🥩 Proteínas',items:[{n:'Peito de frango',q:'1kg',price:'R$ 18,90',done:false},{n:'Atum em água (pack)',q:'4 unid.',price:'R$ 12,00',done:false},{n:'Ovos',q:'12 unid.',price:'R$ 9,50',done:true},{n:'Iogurte grego',q:'4 potes',price:'R$ 16,00',done:false}]},
  {cat:'🥦 Legumes',items:[{n:'Brócolis',q:'1 maço',price:'R$ 5,00',done:false},{n:'Espinafre',q:'1 maço',price:'R$ 3,50',done:false},{n:'Abobrinha',q:'2 unid.',price:'R$ 4,00',done:true},{n:'Pimentão vermelho',q:'2 unid.',price:'R$ 4,50',done:false}]},
  {cat:'🍌 Frutas',items:[{n:'Banana',q:'1 kg',price:'R$ 6,00',done:false},{n:'Maçã',q:'4 unid.',price:'R$ 7,00',done:false},{n:'Limão',q:'6 unid.',price:'R$ 3,00',done:true}]},
  {cat:'🌾 Grãos e Cereais',items:[{n:'Arroz integral',q:'1 kg',price:'R$ 8,00',done:false},{n:'Aveia em flocos',q:'500g',price:'R$ 7,50',done:false},{n:'Quinoa',q:'300g',price:'R$ 12,90',done:false}]},
  {cat:'🥛 Laticínios',items:[{n:'Leite desnatado',q:'1L',price:'R$ 4,50',done:false},{n:'Ricota',q:'200g',price:'R$ 6,00',done:false}]},
];

const WATER_HISTORY = [6,7,5,8,6,7,6]; // copos últimos 7 dias
const WEIGHT_HISTORY = [79.2,78.8,78.5,78.3,78.6,78.1,77.8];

/* ═══════════════════════════════════════
   MOCK AI RESPONSES
═══════════════════════════════════════ */
function getAIResponse(msg) {
  return Promise.resolve(typeof coachLocalFallback === 'function' ? coachLocalFallback(msg) : VITALIA_CLINICAL.localizedClinicalFallback(VITALIA_CLINICAL.normalizeClinicalLang(getUserLanguage()), 'normal_nutrition'));
}

async function analyzeFood(imageDesc) {
  const safeEstimate = {
    name: t('nutr_analysis_unavailable'), emoji: '🍽️',
    cal: 0, prot: 0, carb: 0, fat: 0, score: 0, fallback: true, needs_manual_input: true,
    nutrition: { iron:'—', calcium:'—', sodium:'—', vitA:'—', vitC:'—', b12:'—' },
    msg: t('nutr_manual_required')
  };
  const description = imageDesc && imageDesc !== 'food photo' ? String(imageDesc) : '';
  if (!NUTR.imagePreview && !description) return safeEstimate;
  try {
    const session = (await sb.auth.getSession())?.data?.session || null;
    if (!session?.access_token) return safeEstimate;
    const resp = await fetch(SUPABASE_URL + '/functions/v1/coach-elite-v11', {
      method: 'POST',
      headers: {'Content-Type':'application/json', 'Authorization':'Bearer ' + session.access_token},
      body: JSON.stringify({ mode:description?'food_description':'food_vision', message:description || t('nutr_analyze_photo'), image_base64:description?'':NUTR.imagePreview, mime_type:description?'':/^data:([^;]+);/.exec(NUTR.imagePreview || '')?.[1] || 'image/jpeg', lang:getUserLanguage(), calc:APP.calc || {} })
    });
    if (!resp.ok) return safeEstimate;
    const data = await resp.json();
    return data.analysis || safeEstimate;
  } catch(_) {
    return safeEstimate;
  }
}

function adaptRecipeBank(recipesArray, loadedLang) {
return recipesArray.map(function(r, idx) {
    var contract = normalizeRecipeContract(r, loadedLang);
    var nome = r.nome || r.name || r.nombre || r.title || r.titulo || r['\u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435'] || t('recipe_untitled');
    var tempo = r.tempo || r.time_min || r.tiempo_min || r.time_minutes || r['\u0432\u0440\u0435\u043c\u044f_\u043c\u0438\u043d'] || 15;
    var cat = String(r.categoria || r.category || r['\u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f'] || '').toLowerCase();
    var foco = r.foco || r.focus || r.enfoque || r['\u0446\u0435\u043b\u044c'] || '';
    var ingr = contract.ingredients;
    var prep = recipeArray(r.preparo || r.directions || r.preparacion || r.preparation || r.steps || r['\u043f\u0440\u0438\u0433\u043e\u0442\u043e\u0432\u043b\u0435\u043d\u0438\u0435'] || []);
    var nut = r.macros || r.nutricao || r.nutrition || r.nutricion || r['\u043f\u0438\u0449\u0435\u0432\u0430\u044f_\u0446\u0435\u043d\u043d\u043e\u0441\u0442\u044c'] || {};
    var cal = nut.calorias || nut.calories || nut.kcal || nut['\u043a\u0430\u043b\u043e\u0440\u0438\u0438'] || 0;
    var prot = nut.proteina || nut.protein || nut.prot || nut['\u0431\u0435\u043b\u043e\u043a'] || 0;
    var carb = nut.carbo || nut.carbs || nut.carbos || nut['\u0443\u0433\u043b\u0435\u0432\u043e\u0434\u044b'] || 0;
    var fat = nut.gordura || nut.fat || nut.grasa || nut['\u0436\u0438\u0440\u044b'] || 0;
    var rawTags = recipeArray(r.tags || r.etiquetas || r['\u0442\u0435\u0433\u0438'] || []).concat(recipeArray(r.diet || []));
    var searchText = [nome, cat, foco, r.goal, r.chef_note, r.nutritionist_note, r.search_index, rawTags.join(' '), ingr.join(' '), prep.join(' ')].join(' ');
    var filterKeys = recipeFilterKeysFromText(searchText, {prot:prot, protein:prot, carb:carb, fat:fat}).concat(recipeArray(r.diet || []).map(normalizeRecipeFilterKey));
    var goal = r.goal === 'weight_loss' ? 'lose' : r.goal === 'muscle_gain' ? 'gain' : recipeGoalFromKeys(filterKeys);
    var mealType = ['breakfast','lunch','dinner','snack','drink'].indexOf(r.category) >= 0 ? r.category : recipeMealTypeFromText(searchText);
    var special = filterKeys.indexOf('pregnant') >= 0 ? 'pregnant' : null;
    return {
      id: 1000 + (Number.isInteger(r.bank_index) ? r.bank_index : idx), sourceId: r.id || idx, lang: loadedLang, emoji: r.emoji || '\ud83c\udf7d', name: nome, cat: mealType,
      goal: goal, time: tempo + 'min', diff: '',
      cal: cal, prot: prot, carb: carb, fat: fat, fiber: nut.fiber ?? null, gi: r.gi ?? null, score: r.score ?? null,
      tags: rawTags, filterKeys: filterKeys, searchText: searchText,
      ingredients: ingr, ingredientes: ingr, steps: prep, preparo: prep,
      foco: contract.nutritional_focus, nutritional_focus: contract.nutritional_focus,
      benefits: contract.benefits, labels: contract.labels, macros: contract.macros,
      chef_note: contract.chef_note, nutritionist_note: contract.nutritionist_note, nutrition_basis:r.nutrition_basis, ingredient_quantities:r.ingredient_quantities, special: special, external: true
    };
    }).filter(function(r){ return r && r.name; });
}

// Screen filter helpers are declared by the following script. Initialize after all classic scripts load.
if(typeof document.addEventListener==='function'){
  document.addEventListener('DOMContentLoaded',function(){if(!window._recipesLoaded)expandPremiumRecipeBank();},{once:true});
}
