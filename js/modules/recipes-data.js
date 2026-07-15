/* ═══════════════════════════════════════
   V230-E2 — js/modules/recipes-data.js
   Ex-bloco principal do index.html L879–1474 (extração literal, ordem preservada).
   Conteúdo: RECIPES DATA + MOCK AI RESPONSES
═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   RECIPES DATA
═══════════════════════════════════════ */
const RECIPES = [
  {id:1,emoji:'🥚',name:'Omelete de Espinafre',cat:'breakfast',time:'10min',diff:'fácil',cal:220,prot:18,carb:4,fat:15,fiber:2,gi:20,score:9,tags:['Sem glúten','Alta proteína','Low Carb'],ingredients:['3 ovos','1 xíc. espinafre','1/4 cebola','1 col. azeite','Sal e pimenta'],steps:['Bata os ovos.','Refogue espinafre e cebola.','Despeje os ovos.','Dobre e sirva.'],nutrition:{calories:220,protein:'18g',carbs:'4g',fat:'15g',fiber:'2g'},rating:4.8,reviews:124,goal:'lose'},
  {id:5,emoji:'🐔',name:'Frango + Arroz Integral',cat:'lunch',time:'35min',diff:'médio',cal:520,prot:42,carb:58,fat:8,fiber:10,gi:50,score:9,tags:['Completo','Alta proteína'],ingredients:['150g frango','4 col. arroz integral','1/2 xíc. feijão','Salada verde','Azeite'],steps:['Cozinhe arroz e feijão.','Grelhe o frango.','Monte o prato.'],nutrition:{calories:520,protein:'42g',carbs:'58g',fat:'8g',fiber:'10g'},rating:4.9,reviews:231,goal:'maintain'},
  {id:8,emoji:'🍌',name:'Banana com Pasta de Amendoim',cat:'snack',time:'2min',diff:'fácil',cal:230,prot:8,carb:32,fat:10,fiber:3,gi:52,score:7,tags:['Vegano','Rápido','Pré-treino'],ingredients:['1 banana','2 col. pasta de amendoim'],steps:['Corte a banana.','Aplique a pasta.','Sirva.'],nutrition:{calories:230,protein:'8g',carbs:'32g',fat:'10g',fiber:'3g'},rating:4.4,reviews:203,goal:'gain'},
  {id:10,emoji:'🍗',name:'Peito de Frango Grelhado',cat:'dinner',time:'20min',diff:'fácil',cal:350,prot:40,carb:15,fat:12,fiber:4,gi:35,score:9,tags:['Alta proteína','Sem glúten'],ingredients:['200g frango','Legumes variados','Azeite e limão'],steps:['Tempere o frango.','Grelhe 7 min cada lado.','Sirva com legumes.'],nutrition:{calories:350,protein:'40g',carbs:'15g',fat:'12g',fiber:'4g'},rating:4.7,reviews:178,goal:'lose'},
  {id:20,emoji:'🥗',name:'Salada Caesar Fit',cat:'lunch',time:'15min',diff:'fácil',cal:310,prot:28,carb:12,fat:16,fiber:3,gi:30,score:8,tags:['Alta proteína','Low Carb'],ingredients:['Alface romana','Frango grelhado','Parmesão','Croutons integrais','Molho caesar light'],steps:['Lave as folhas.','Corte o frango.','Misture e tempere.'],nutrition:{calories:310,protein:'28g',carbs:'12g',fat:'16g',fiber:'3g'},rating:4.6,reviews:156,goal:'lose'},
];
window.RECIPES = RECIPES;

// Receitas carregadas externamente via loadExternalRecipes()

function expandPremiumRecipeBank() {
  if (window._premiumRecipesExpanded) return;
  window._premiumRecipesExpanded = true;
  const proteins = [
    ['Frango', '🐔', 34, 6, ['Alta proteína', 'Sem glúten']],
    ['Patinho', '🥩', 32, 9, ['Alta proteína', 'Ferro']],
    ['Salmão', '🐟', 30, 14, ['Ômega-3', 'Anti-inflamatório']],
    ['Ovos', '🥚', 24, 16, ['Low Carb', 'Sem glúten']],
    ['Tofu', '🌱', 22, 10, ['Vegano', 'Sem lactose']],
    ['Iogurte Grego', '🥣', 26, 3, ['Alta proteína', 'Prebiótico']],
    ['Atum', '🐟', 35, 5, ['Alta proteína', 'Ômega-3']],
    ['Lentilha', '🫘', 20, 3, ['Vegano', 'Ferro']]
  ];
  const carbs = [
    ['arroz integral', 38, ['Completo']],
    ['batata doce', 32, ['Pré-treino']],
    ['quinoa', 28, ['Sem glúten']],
    ['abóbora', 16, ['Low Carb']],
    ['aveia', 34, ['Prebiótico']],
    ['feijão', 30, ['Ferro']],
    ['salada verde', 8, ['Low Carb']],
    ['banana', 32, ['Pré-treino']]
  ];
  const goals = ['lose', 'gain', 'maintain', 'health'];
  const cats = ['breakfast', 'lunch', 'snack', 'dinner'];
  const budgets = ['baixo', 'medio', 'premium'];
  const styles = ['Bowl', 'Prato', 'Creme', 'Wrap', 'Salada', 'Marmita', 'Omelete', 'Shake'];
  let id = 5000;

  for (let p = 0; p < proteins.length; p++) {
    for (let c = 0; c < carbs.length; c++) {
      for (let g = 0; g < goals.length; g++) {
        for (let s = 0; s < styles.length; s++) {
          const protein = proteins[p], carb = carbs[c], goal = goals[g], style = styles[s];
          const lowCarb = carb[1] <= 18;
          const prot = Math.max(18, protein[2] + (goal === 'gain' ? 8 : goal === 'lose' ? 4 : 0));
          const carbG = lowCarb ? carb[1] : carb[1] + (goal === 'gain' ? 16 : 0);
          const fat = Math.max(4, protein[3] + (style === 'Salada' ? 2 : 0));
          const cal = Math.round(prot * 4 + carbG * 4 + fat * 9 + (goal === 'gain' ? 80 : 35));
          const time = 8 + ((p + c + s) % 6) * 5;
          const tags = Array.from(new Set([].concat(protein[4], carb[2], goal === 'lose' ? ['Emagrecimento'] : goal === 'gain' ? ['Massa'] : ['Performance'], lowCarb ? ['Low Carb'] : [], time <= 15 ? ['Rápido'] : [])));
          RECIPES.push({
            id: id++,
            emoji: protein[1],
            name: style + ' de ' + protein[0] + ' com ' + carb[0],
            cat: cats[(p + c + s) % cats.length],
            time: time + 'min',
            diff: time <= 15 ? 'fácil' : 'médio',
            cal, prot, carb: carbG, fat, fiber: lowCarb ? 5 : 8, gi: lowCarb ? 28 : 48, score: 8 + ((p + c) % 2),
            tags,
            ingredients: [protein[0], carb[0], 'legumes ou folhas', 'temperos naturais', 'azeite medido'],
            steps: ['Prepare a proteína com temperos naturais.', 'Ajuste a porção de carboidrato ao seu objetivo.', 'Monte com legumes para aumentar saciedade.'],
            nutrition: {calories: cal, protein: prot + 'g', carbs: carbG + 'g', fat: fat + 'g', fiber: (lowCarb ? 5 : 8) + 'g'},
            rating: +(4.5 + ((p + c + s) % 5) / 10).toFixed(1),
            reviews: 80 + ((p * 37 + c * 19 + s * 11) % 420),
            goal,
            budget: budgets[(p + c + s) % budgets.length],
            proteinDensity: prot / Math.max(cal, 1)
          });
          if (RECIPES.length >= 1205) break;
        }
        if (RECIPES.length >= 1205) break;
      }
      if (RECIPES.length >= 1205) break;
    }
    if (RECIPES.length >= 1205) break;
  }
  window.RECIPES = RECIPES;
  console.log('[Recipes] Banco premium expandido para ' + RECIPES.length + ' receitas');
}
expandPremiumRecipeBank();


// ═══ ENRIQUECER TAGS DE TODAS AS RECEITAS ═══
(function enrichRecipeTags() {
  for (var i = 0; i < RECIPES.length; i++) {
    var r = RECIPES[i];
    if (!r.tags) r.tags = [];
    var allText = ((r.name||r.nome||'') + ' ' + (r.foco||'') + ' ' + (r.ingredientes||r.ingredients||[]).join(' ')).toLowerCase();
    
    // Detox (gengibre, cúrcuma, chá verde, limão detox, couve)
    if (!r.tags.includes('Detox') && /gengibre|ginger|cúrcuma|turmeric|chá verde|green tea|detox|couve|kale|limão|lemon|desintoxica/.test(allText)) r.tags.push('Detox');
    
    // Prebiótico/Probiótico (iogurte, kefir, chucrute, aveia, banana, alho, cebola)
    if (!r.tags.includes('Prebiótico') && /iogurte|yogurt|kefir|chucrute|sauerkraut|prebi|probi|aveia|oat|banana|alho|garlic|cebola|onion|fibra|fiber/.test(allText)) r.tags.push('Prebiótico');
    
    // Pré-treino (banana, aveia, café, energia, carboidrato rápido, batata-doce)
    if (!r.tags.includes('Pré-treino') && /pré.?treino|pre.?workout|banana|aveia|oat|café|coffee|energia|energy|batata.?doce|sweet potato|mel|honey|panqueca|pancake/.test(allText)) r.tags.push('Pré-treino');
    
    // Anti-inflamatório (cúrcuma, gengibre, salmão, ômega, azeite, abacate, frutas vermelhas)
    if (!r.tags.includes('Anti-inflamatório') && /anti.?inflam|cúrcuma|turmeric|gengibre|ginger|salmão|salmon|ômega|omega|azeite|olive oil|abacate|avocado|frutas vermelhas|berries|nozes|nuts/.test(allText)) r.tags.push('Anti-inflamatório');
    
    // Período menstrual (ferro, espinafre, lentilha, beterraba, chocolate, magnésio, banana)
    if (!r.tags.includes('Período menstrual') && /ferro|iron|espinafre|spinach|lentilha|lentil|beterraba|beet|chocolate|magnésio|magnesium|menstrual|período|cãibra|cramp/.test(allText)) r.tags.push('Período menstrual');
    
    // Sem lactose (vegano = automaticamente sem lactose)
    if (!r.tags.includes('Sem lactose') && (r.tags.includes('Vegano') || /sem lactose|lactose.?free|vegano|vegan|leite de coco|coconut milk|leite vegetal|plant milk/.test(allText))) r.tags.push('Sem lactose');
    
    // Sem glúten (recipes with rice, potato, quinoa, eggs as base)
    if (!r.tags.includes('Sem glúten') && /sem glúten|gluten.?free|arroz|rice|batata|potato|quinoa|ovo|egg|peixe|fish|frango|chicken|carne|meat|salada|salad/.test(allText) && !/macarrão|pasta|pão|bread|farinha|flour|aveia|oat|trigo|wheat/.test(allText)) r.tags.push('Sem glúten');
    
    // Ômega-3
    if (!r.tags.includes('Ômega-3') && /salmão|salmon|ômega|omega|atum|tuna|sardinha|sardine|linhaça|flaxseed|chia|nozes|walnut/.test(allText)) r.tags.push('Ômega-3');
    
    // Ferro
    if (!r.tags.includes('Ferro') && /ferro|iron|lentilha|lentil|espinafre|spinach|feijão|beans|carne|beef|fígado|liver|beterraba|beet|couve|kale/.test(allText)) r.tags.push('Ferro');
  }
  console.log('[Recipes] Tags enriquecidas para ' + RECIPES.length + ' receitas');
})();



var recipesCache = window.recipesCache || {};
window.recipesCache = recipesCache;

function normalizeLang(code) {
  var raw = String(code || 'pt').trim().toLowerCase();
  // eslint-disable-next-line no-misleading-character-class -- pré-existente no index.html; corrigir na V231
  raw = raw.replace(/[🇧🇷🇺🇸🇪🇸🇷🇺]/g, '').trim();
  if (raw === 'português' || raw === 'portugues' || raw === 'portuguese' || raw.indexOf('pt') === 0) return 'pt';
  if (raw === 'english' || raw.indexOf('en') === 0) return 'en';
  if (raw === 'español' || raw === 'espanol' || raw === 'spanish' || raw.indexOf('es') === 0) return 'es';
  if (raw === 'русский' || raw === 'russian' || raw.indexOf('ru') === 0) return 'ru';
  return 'pt';
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
  var version = CONFIG.APP_VERSION || 'vitalia-coach-global-hardening-v10';
  var urls = [
    './' + filename + '?v=' + version + '&t=' + ts,
    'https://cdn.jsdelivr.net/gh/elicarlosiurd-sudo/vitalia-app@main/' + filename + '?v=' + version + '&t=' + ts,
    'https://elicarlosiurd-sudo.github.io/vitalia-app/' + filename + '?v=' + version + '&t=' + ts,
    'https://raw.githubusercontent.com/elicarlosiurd-sudo/vitalia-app/main/' + filename + '?v=' + version + '&t=' + ts
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
      if (arr && arr.length > 0) return { lang: lang, recipes: arr, url: urls[u] };
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
      window.RECIPES = window.RECIPES.filter(function(r) { return !r.external; }).concat(recipesCache[requestedLang]);
      window._recipesLang = requestedLang;
      window._recipesLoaded = true;
      if (APP.tab === 'recipes') navigate('recipes');
      return;
    }

  // PASSO 1: Feedback visual imediato
    var recList = document.getElementById('rec-list');
    var langNames = {pt:'Portugu\u00eas',en:'English',es:'Espa\u00f1ol',ru:'\u0420\u0443\u0441\u0441\u043a\u0438\u0439'};
    if (recList) recList.innerHTML = '<div style="text-align:center;padding:60px 20px"><div style="font-size:36px;margin-bottom:16px;animation:spin 1.5s linear infinite;display:inline-block">\u2699\ufe0f</div><div style="font-size:15px;color:var(--text);font-weight:700">' + t('rec_loading') + '</div><div style="font-size:12px;color:var(--text3);margin-top:6px">' + (langNames[requestedLang]||requestedLang) + '</div></div>';

  // PASSO 2: Tentar idioma atual, depois fallback PT.
    var ts = Date.now();
    var recipesArray = null;
    var loadedLang = requestedLang;
    var attempts = requestedLang === 'pt' ? ['pt'] : [requestedLang, 'pt'];
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
      window._recipesLang = requestedLang;
      window._recipesLoaded = true;
      window._recipesFallbackEmbedded = true;
      window._recipesError = t('rec_load_error');
      window.RECIPES = window.RECIPES.filter(function(r) { return !r.external; });
      recList = document.getElementById('rec-list');
      if (recList) recList.innerHTML = showRecipeErrorState(requestedLang);
      if (APP.tab === 'recipes') toast(t('rec_load_error'), 'error', 3000);
      return;
    }

  // PASSO 4: Adaptar receitas ao formato interno
    var adapted = recipesArray.map(function(r, idx) {
    var nome = r.nome || r.name || r.nombre || r.title || r.titulo || r['\u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435'] || t('recipe_untitled');
    var tempo = r.tempo || r.time_min || r.tiempo_min || r.time_minutes || r['\u0432\u0440\u0435\u043c\u044f_\u043c\u0438\u043d'] || 15;
    var cat = String(r.categoria || r.category || r['\u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f'] || '').toLowerCase();
    var foco = r.foco || r.focus || r.enfoque || r['\u0446\u0435\u043b\u044c'] || '';
    var ingr = recipeArray(r.ingredientes || r.ingredients || r['\u0438\u043d\u0433\u0440\u0435\u0434\u0438\u0435\u043d\u0442\u044b'] || []);
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
      id: 1000 + idx, sourceId: r.id || idx, lang: loadedLang, emoji: r.emoji || '\ud83c\udf7d', name: nome, cat: mealType,
      goal: goal, time: tempo + 'min', diff: '',
      cal: cal, prot: prot, carb: carb, fat: fat, fiber: 3, gi: 40, score: 9,
      tags: rawTags, filterKeys: filterKeys, searchText: searchText,
      ingredients: ingr, ingredientes: ingr, steps: prep, preparo: prep,
      foco: foco, chef_note: r.chef_note || '', nutritionist_note: r.nutritionist_note || '', special: special, external: true
    };
    }).filter(function(r){ return r && r.name; });
    if (!adapted.length) throw new Error('recipes adapter returned empty list');
    recipesCache[requestedLang] = adapted;

  // PASSO 5: Atualizar variável GLOBAL — window.RECIPES
    window.RECIPES = window.RECIPES.filter(function(r) { return !r.external; });
    for (var i = 0; i < adapted.length; i++) window.RECIPES.push(adapted[i]);
    window._recipesLang = requestedLang;
    window._recipesLoaded = true;
    window._recipesFallbackEmbedded = false;
    window._recipesError = null;

  // PASSO 6: Enriquecer tags
    if (typeof enrichRecipeTags === 'function') enrichRecipeTags();

  // PASSO 7: Re-renderizar APÓS dados na variável global
    console.log('[Recipes] GLOBAL RECIPES count:', window.RECIPES.length, '(' + requestedLang + ')');
    if (APP.tab === 'recipes') navigate('recipes');
  } catch(e) {
    console.error('Erro ao carregar receitas:', e);
    window._recipesLoaded = true;
    window._recipesError = e && e.message ? e.message : t('rec_load_error');
    var lang = normalizeLang(getUserLanguage ? getUserLanguage() : (APP.lang || 'pt'));
    var list = document.getElementById('rec-list');
    if (list) list.innerHTML = showRecipeErrorState(lang);
    if (APP.tab === 'recipes') toast(t('rec_load_error'), 'error', 3000);
  }
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
const COACH_RESPONSES = [
  // Proteínas e músculo
  r=>`${APP.profile?.name?.split(' ')[0]||''}! 💪 ${r.includes('proteína')||r.includes('protein')||r.includes('músculo')||r.includes('massa') ?
    `Sua meta é ${APP.calc?.prot||140}g de proteína/dia. Distribua em 4-5 refeições (30-40g por refeição para absorção ideal).
\n🥚 Melhores fontes: frango (31g/100g), atum (29g/lata), ovos (13g/2un), iogurte grego (17g/170g), whey (25g/scoop).
\n⏰ Pós-treino: consuma 30-40g de proteína em até 45 min para maximizar síntese muscular.
\n💊 Suplementos: Whey concentrado (custo-benefício), isolado (lactose zero), caseína (noite).` :
    `Baseado no seu perfil, estou aqui para te ajudar! Pode me perguntar sobre proteínas, carboidratos, gorduras, suplementos, receitas, jejum intermitente ou qualquer dúvida de nutrição. 🌿`}`,

  // Emagrecimento
  r=>`${r.includes('emagrecer')||r.includes('perder peso')||r.includes('gordura')||r.includes('déficit') ?
    `Eu entendo sua meta. Para queimar gordura mantendo energia, o caminho hoje é simples: proteína em cada refeição, vegetais para dar saciedade e uma porção medida de carboidrato bom.
\nIsso funciona porque protege seus músculos, evita fome forte à noite e deixa o processo mais leve de manter.
\nSua única missão agora: beber um copo de água e escolher uma proteína para a próxima refeição.` :
    `Posso te ajudar com emagrecimento, alimentação e nutrição esportiva. Me conta mais sobre seu objetivo! 🎯`}`,

  // Hidratação
  r=>`${r.includes('água')||r.includes('hidrat') ?
    `💧 Hidratação ideal: ${APP.calc?.agua||2100}ml/dia (${APP.calc?.aguaCopos||8} copos).
\nVocê bebeu hoje: ${APP.water} de ${APP.calc?.aguaCopos||8} copos.
\n⏰ Dicas práticas:
• Beba 500ml ao acordar (reidrata após o sono)
• 1 copo 30 min antes de cada refeição
• 500-700ml por hora de exercício
• Urina amarela clara = hidratação adequada
\n🌡️ Aumente 500ml em dias quentes ou treinos intensos.
\nSinais de desidratação: dor de cabeça, concentração reduzida, fadiga.` :
    `Hidratação é fundamental! Sua meta é ${APP.calc?.aguaCopos||8} copos por dia.`}`,

  // Suplementos
  r=>`${r.includes('suplemento')||r.includes('whey')||r.includes('creatina')||r.includes('bcaa') ?
    `💊 Guia completo de suplementos:

🥛 WHEY PROTEIN
• Concentrado: 70-80% proteína, econômico
• Isolado: 90%+, sem lactose
• Hidrolisado: absorção rápida, pré/pós-treino
• Dose: 1-2 scoops/dia (25-50g proteína)

⚡ CREATINA MONOHIDRATADA
• Mais estudada e segura do mercado
• Aumenta força, potência e volume muscular
• Dose: 3-5g/dia (sem necessidade de fase de saturação)
• Sem horário fixo, consistência é o que importa
• Contraindicada para quem tem problemas renais

🌿 BCAA
• Útil em treinos longos ou jejum
• Se já come proteína suficiente, o whey supre
• Dose: 5-10g por treino

☀️ VITAMINA D
• 70% dos brasileiros com deficiência
• 1000-2000UI/dia (ou conforme exame)

🐟 ÔMEGA-3
• 2-3g EPA+DHA/dia
• Anti-inflamatório, saúde cardiovascular

⚠️ LEMBRE: suplementos complementam, não substituem alimentação. Consulte médico/nutricionista para doses individualizadas.` :
    `Tenho conhecimento completo sobre suplementação! Whey, creatina, BCAA, vitaminas... Me pergunte especificamente! 💊`}`,

  // Jejum intermitente
  r=>`${r.includes('jejum')||r.includes('16:8')||r.includes('intermitente') ?
    `⏱️ Jejum Intermitente — Guia Completo:

🏆 PROTOCOLOS:
• 16:8: Jejua 16h, come em janela de 8h (mais popular)
• 18:6: Jejua 18h — avançado
• 20:4: Warrior Diet — muito restritivo
• OMAD: Uma refeição/dia — apenas experts
• 5:2: 5 dias normal + 2 dias 500kcal

✅ BENEFÍCIOS COMPROVADOS:
• Perda de gordura sem perda muscular (com proteína adequada)
• Melhora sensibilidade à insulina
• Autophagia (limpeza celular)
• Melhora foco e energia no jejum

💧 DURANTE O JEJUM: água, café preto, chá sem açúcar são liberados.

⚠️ NÃO RECOMENDADO PARA: gestantes, diabéticos tipo 1, histórico de TCA, menores de 18 anos.

💡 Dica: comece com 12:12 por 1 semana, depois evolua para 16:8.` :
    `Posso te explicar sobre qualquer protocolo de jejum intermitente! 🌙`}`,

  // Gestante
  r=>`${r.includes('grávid')||r.includes('gestante')||r.includes('gravidez')||r.includes('bebê') ?
    `🤰 Nutrição na Gestação — Orientações Essenciais:

📊 NECESSIDADES AUMENTADAS:
• Calorias: +300kcal/dia (2º e 3º trimestre)
• Proteína: +25g/dia → meta ${(APP.calc?.prot||60)+25}g/dia
• Ferro: 27mg/dia (vs 18mg normais)
• Folato: 600mcg/dia (ESSENCIAL no 1º trimestre)
• Cálcio: 1000-1300mg/dia
• DHA: 200-300mg/dia

✅ ALIMENTOS ESSENCIAIS:
🥦 Espinafre, brócolis — ferro + folato
🐟 Salmão, sardinha — DHA (evite peixes crus/grandes)
🥚 Ovos — colina para cérebro do bebê
🥛 Laticínios — cálcio e proteína
🫘 Leguminosas — ferro vegetal + ácido fólico

❌ EVITAR NA GESTAÇÃO:
• Álcool (zero tolerância)
• Peixes grandes crus (atum, cação, cerne)
• Queijos moles não pasteurizados
• Embutidos (contêm nitratos)
• Cafeína acima de 200mg/dia
• Frituras e ultraprocessados

⚠️ IMPORTANTE: Consulte sempre seu obstetra e nutricionista para acompanhamento individualizado!` :
    `Se você está grávida, tenho orientações específicas sobre nutrição gestacional! 🤰`}`,

  // Período menstrual
  r=>`${r.includes('menstrual')||r.includes('cólica')||r.includes('tpm')||r.includes('período')||r.includes('menstruação') ?
    `🌸 Nutrição no Período Menstrual:

💊 NUTRIENTES PRIORITÁRIOS:
• Magnésio: reduz cólicas em até 50% — amêndoas, cacau, sementes abóbora
• Ferro: repõe perdas do fluxo — carnes, leguminosas + vitamina C
• Ômega-3: anti-inflamatório — sardinha, chia, linhaça
• Vitamina B6: reduz sintomas TPM — banana, batata doce
• Cálcio: alivia tensão pré-menstrual — laticínios, brócolis

✅ ESTRATÉGIAS POR FASE:
📅 Dias 1-3 (fluxo): Priorize ferro + vitamina C, alimentos quentes, magnésio
📅 Dias 1-7 (folicular): Carbs complexos para energia, proteína
📅 Dias antes (lútea): Reduza sódio (menos inchaço), aumente magnésio

☕ EVITE NO PERÍODO:
• Cafeína excessiva (aumenta cólicas)
• Álcool (piora inflamação)
• Sódio excessivo (inchaço)
• Açúcar refinado (picos de insulina pioram humor)

💚 ANTI-INFLAMATÓRIOS NATURAIS:
Gengibre, cúrcuma, frutas vermelhas, abacate` :
    `Posso orientar sobre alimentação específica para cada fase do ciclo menstrual! 🌸`}`,

  // Pré e pós treino
  r=>`${r.includes('treino')||r.includes('exercício')||r.includes('academia')||r.includes('pré')||r.includes('pós') ?
    `🏋️ Nutrição Esportiva — Pré e Pós Treino:

⚡ PRÉ-TREINO (1-2h antes):
• Carboidrato de médio IG: arroz, batata doce, banana
• Proteína moderada: 15-20g
• Evite gordura em excesso (retarda esvaziamento gástrico)
• Hidratação: 500ml de água
• Exemplo: banana + pasta amendoim + café

🔄 PÓS-TREINO (até 45 min):
• Proteína rápida: 30-40g de whey ou alimento proteico
• Carboidrato: repõe glicogênio muscular
• Ratio proteína:carbo = 1:2 a 1:3
• Exemplo: shake whey + banana OU frango + arroz

☕ SUPLEMENTOS PARA PERFORMANCE:
• Cafeína: 3-6mg/kg, 45-60 min antes (melhora resistência)
• Creatina: 3-5g/dia (força e volume)
• Beta-alanina: 3-6g (reduz fadiga)
• Citrulina: 6-8g (bomba muscular)

💧 HIDRATAÇÃO NO TREINO:
• 500ml antes
• 150-250ml a cada 15-20 min
• Bebida isotônica em treinos >1h` :
    `Me diga quando você treina e posso montar uma estratégia nutricional completa! 🏋️`}`,
];

// ── Enhanced AI Response with context ──
function getAIResponse(msg) {
  return new Promise(resolve => {
    const delay = 1200 + Math.random()*800;
    setTimeout(() => {
      const msgLower = msg.toLowerCase();
      // Find best matching response
      for(const fn of COACH_RESPONSES) {
        const response = fn(msgLower);
        if(!response.includes('Baseado no seu perfil') && !response.includes('Me pergunte') && !response.includes('Posso te')) {
          resolve(response);
          return;
        }
      }
      // Default intelligent response
      const defaults = [
        `Ótima pergunta! Para responder melhor, me conta: qual é seu objetivo principal agora? Emagrecimento, ganho de massa, saúde geral ou performance esportiva? 🎯`,
        `Entendo! Baseado no seu perfil (${APP.profile?.weight||78}kg, meta ${APP.calc?.meta||1800}kcal), posso criar um plano personalizado. O que você prefere começar: alimentação, suplementação ou treino? 💪`,
        `Excelente! A chave do sucesso é consistência. Seu streak de ${APP.streak} dias mostra que você está comprometido! Me pergunte sobre qualquer nutriente, alimento ou estratégia. 🌱`,
        `Para te dar a melhor orientação: você tem alguma restrição alimentar? Intolerância à lactose, glúten, ou segue alguma dieta específica? Assim posso personalizar melhor! 🥗`,
      ];
      resolve(defaults[Math.floor(Math.random()*defaults.length)]);
    }, delay);
  });
}

async function analyzeFood(imageDesc) {
  const safeEstimate = {
    name: imageDesc && imageDesc !== 'food photo' ? 'Refeição descrita' : 'Prato analisado pela IA',
    emoji: '🍽️',
    cal: 480,
    prot: 42,
    carb: 42,
    fat: 14,
    score: 8,
    nutrition: { iron:'2.1mg', calcium:'80mg', sodium:'320mg', vitA:'180µg', vitC:'22mg', b12:'0.9µg' },
    msg: 'Revise a porção e confirme antes de salvar. Assim o diário fica preciso e o Coach consegue ajustar suas metas com segurança.'
  };
  if (!NUTR.imagePreview) {
    return new Promise(resolve => setTimeout(()=>resolve(safeEstimate), 900));
  }
  try {
    const session = (await sb.auth.getSession())?.data?.session || null;
    if (!session?.access_token) return safeEstimate;
    const resp = await fetch(COACH_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json', 'Authorization':'Bearer ' + session.access_token},
      body: JSON.stringify({ mode:'food_vision', message:'Analisar refeição por foto', image_base64:NUTR.imagePreview, lang:APP.lang || 'pt', calc:APP.calc || {} })
    });
    if (!resp.ok) return safeEstimate;
    const data = await resp.json();
    return data.analysis || safeEstimate;
  } catch(_) {
    return safeEstimate;
  }
}
