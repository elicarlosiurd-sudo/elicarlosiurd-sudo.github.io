/* ═══════════════════════════════════════
   V230-E2 — js/modules/screens.js
   Ex-bloco principal do index.html L2298–5301 (extração literal, ordem preservada).
   Conteúdo: telas: home, nutrition, recipes, hydration, fasting, scanner, achievements, shopping-legacy, settings, analytics, community, integrations, premium, telegram, share, export
═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   HOME SCREEN
═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   NUTRITION SCREEN
═══════════════════════════════════════ */
const DEFAULT_MEAL_PLAN_BY_LANG = {
  pt: [
    {time:'07:30',icon:'sun',name:'Café da manhã',items:'Omelete + pão integral + fruta',ratio:.25},
    {time:'10:00',icon:'apple',name:'Lanche manhã',items:'Iogurte grego + granola',ratio:.10},
    {time:'13:00',icon:'meal',name:'Almoço',items:'Proteína + arroz integral + feijão + salada',ratio:.35},
    {time:'16:00',icon:'snack',name:'Lanche tarde',items:'Fruta + castanhas',ratio:.10},
    {time:'19:30',icon:'moon',name:'Jantar',items:'Proteína leve + legumes + carboidrato moderado',ratio:.20}
  ],
  en: [
    {time:'07:30',icon:'sun',name:'Breakfast',items:'Omelet + whole-grain bread + fruit',ratio:.25},
    {time:'10:00',icon:'apple',name:'Morning snack',items:'Greek yogurt + granola',ratio:.10},
    {time:'13:00',icon:'meal',name:'Lunch',items:'Protein + brown rice + beans + salad',ratio:.35},
    {time:'16:00',icon:'snack',name:'Afternoon snack',items:'Fruit + nuts',ratio:.10},
    {time:'19:30',icon:'moon',name:'Dinner',items:'Light protein + vegetables + moderate carbs',ratio:.20}
  ],
  es: [
    {time:'07:30',icon:'sun',name:'Desayuno',items:'Omelet + pan integral + fruta',ratio:.25},
    {time:'10:00',icon:'apple',name:'Merienda de la mañana',items:'Yogur griego + granola',ratio:.10},
    {time:'13:00',icon:'meal',name:'Almuerzo',items:'Proteína + arroz integral + frijoles + ensalada',ratio:.35},
    {time:'16:00',icon:'snack',name:'Merienda de la tarde',items:'Fruta + frutos secos',ratio:.10},
    {time:'19:30',icon:'moon',name:'Cena',items:'Proteína ligera + verduras + carbohidrato moderado',ratio:.20}
  ],
  ru: [
    {time:'07:30',icon:'sun',name:'Завтрак',items:'Омлет + цельнозерновой хлеб + фрукт',ratio:.25},
    {time:'10:00',icon:'apple',name:'Утренний перекус',items:'Греческий йогурт + гранола',ratio:.10},
    {time:'13:00',icon:'meal',name:'Обед',items:'Белок + бурый рис + фасоль + салат',ratio:.35},
    {time:'16:00',icon:'snack',name:'Полдник',items:'Фрукт + орехи',ratio:.10},
    {time:'19:30',icon:'moon',name:'Ужин',items:'Лёгкий белок + овощи + умеренные углеводы',ratio:.20}
  ]
};
const MEAL_PLAN_ICON_FALLBACK = {sun:'☀️', apple:'🍎', meal:'🍽️', snack:'🥪', moon:'🌙'};
function getDefaultMealPlan() {
  const lang = DEFAULT_MEAL_PLAN_BY_LANG[APP.lang] ? APP.lang : 'pt';
  return DEFAULT_MEAL_PLAN_BY_LANG[lang];
}
function mealPlanIcon(key) {
  try {
    const mapped = {sun:'sun', apple:'apple', meal:'utensils', snack:'sandwich', moon:'moon'}[key];
    return mapped ? vitaliaIcon(mapped) : (MEAL_PLAN_ICON_FALLBACK[key] || '');
  } catch(_) {
    return MEAL_PLAN_ICON_FALLBACK[key] || '';
  }
}
const NUTR = {tab:'diary', analysis:null, loading:false, imagePreview:null, mealFilter:'all', showPlan:false, cameraOpening:false};

function renderNutrition() {
  normalizeMeals();
  const c = APP.calc||{}, totalCal = sumKcal(APP.meals);
  return `
  <div class="screen-header">
    <div class="screen-title">${vitaliaIcon('nutrition')} ${t('meal_diary')}</div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-sm btn-outline ${NUTR.tab==='plan'?'active':''}" onclick="NUTR.tab='plan';navigate('nutrition')">${t('nutr_plan')}</button>
      <button class="btn btn-sm btn-outline ${NUTR.tab==='diary'?'active':''}" onclick="NUTR.tab='diary';navigate('nutrition')">${t('nutr_diary')}</button>
    </div>
  </div>
  <div style="padding:0 16px 12px;color:var(--text2);font-size:12px;line-height:1.55">${t('nutr_intro')}</div>

  ${NUTR.tab==='plan' ? renderNutritionPlanTab() : `
  <!-- Camera area -->
  <div class="camera-area meal-photo-card" id="cam-area" style="margin-bottom:4px">
    <label for="food-cam-capture" class="meal-photo-content" onclick="showNutritionCameraOpening()">
      <input type="file" id="food-cam-capture" class="hidden-file-input" accept="image/*" capture="environment">
      <div class="camera-icon">${NUTR.analysis?'✅':'📷'}</div>
      <div class="camera-title">${NUTR.loading?t('analyzing'):(NUTR.cameraOpening?t('nutr_camera_opening'):t('take_photo'))}</div>
      <div class="camera-sub">${NUTR.cameraOpening?t('take_photo_sub'):t('take_photo_sub')}</div>
    </label>
  </div>

  <!-- Or gallery -->
  <div style="display:flex;gap:10px;padding:0 16px;margin-bottom:16px">
    <label for="food-gallery" style="flex:1;cursor:pointer"><input type="file" id="food-gallery" class="hidden-file-input" accept="image/*"><div class="btn btn-outline btn-full">🖼️ ${t('gallery')}</div></label>
    <button class="btn btn-outline" style="flex:1" onclick="analyzeTextMeal()">${vitaliaIcon('edit')} ${t('nutr_describe')}</button>
  </div>

  ${NUTR.loading ? `<div style="text-align:center;padding:32px;"><div style="font-size:32px;animation:spin 1.5s linear infinite;display:inline-block">⚙️</div><div style="font-size:13px;color:var(--text2);margin-top:8px">${t('analyzing')}</div></div>` : ''}

  ${NUTR.analysis && !NUTR.loading ? renderAnalysisResult() : ''}

  <!-- Meal diary -->
  <div class="section-title">${t('nutr_today_meals')} · ${totalCal} kcal</div>
  <div class="tab-row">
    ${[['all',t('nutr_all')],['breakfast',t('nutr_breakfast')],['snack',t('nutr_snack')],['lunch',t('nutr_lunch')],['dinner',t('nutr_dinner')]].map(([v,l])=>`<button class="tab-btn ${NUTR.mealFilter===v?'active':''}" onclick="NUTR.mealFilter='${v}';navigate('nutrition')">${l}</button>`).join('')}
  </div>

  ${APP.meals.filter(m=>NUTR.mealFilter==='all'||m.type===NUTR.mealFilter).map(m=>`
  <div class="meal-entry">
    <div class="meal-time">${m.time}</div>
    <div class="meal-dot"></div>
    <div class="meal-info"><div class="meal-name">${escapeHTML(m.name)}</div><div class="meal-cal">${getKcal(m)} kcal · P:${m.prot}g C:${m.carb}g G:${m.fat}g</div></div>
    <div class="meal-emoji">${m.emoji}</div>
  </div>`).join('')}

  <!-- Meal plan section -->
  <div class="section-title" style="margin-top:8px">${t('nutr_ai_plan')}</div>
  ${renderMealPlan()}
  `}

  <!-- Emotional tracker -->
  <div class="section-title">${t('nutr_emotion')}</div>
  <div style="padding:0 16px;margin-bottom:12px">
    <div class="card card-purple">
      <div style="font-size:13px;font-weight:700;color:var(--purple);margin-bottom:8px">${vitaliaIcon('coach')} ${t('nutr_mood_title')}</div>
      <div style="font-size:12px;color:var(--text2);line-height:1.6">${t('nutr_mood_today')}: <span style="font-size:18px">${APP.mood||'—'}</span> · ${t('nutr_food_quality')}: <span style="color:var(--green);font-weight:700">${totalCal<=((APP.calc?.meta||1800)*1.1)?t('nutr_quality_good'):t('nutr_quality_high')}</span></div>
      <div style="margin-top:10px;padding:10px;background:rgba(167,139,250,.08);border-radius:8px;font-size:11px;color:var(--text2)">${t('nutr_stress_tip')}</div>
    </div>
  </div>`;
}

function renderNutritionPlanTab() {
  const c = APP.calc || {};
  const goal = goalLabel(APP.profile?.goal || 'health');
  const hasPlanData = !!(c.meta || c.prot || (APP.meals && APP.meals.length));
  if (!hasPlanData) {
    return `<div class="nutrition-empty-state">
      <div class="v-section-title">${t('nutr_plan_title')}</div>
      <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:8px">${t('nutr_empty_title')}</div>
      <div style="font-size:13px;color:var(--text-soft);line-height:1.6;margin-bottom:14px">${t('nutr_empty_sub')}</div>
      <button class="btn btn-primary btn-full" onclick="navigate('coach')" style="padding:13px">${t('coach_converse_now')}</button>
    </div>`;
  }
  return `<div class="nutrition-plan-panel">
    <div class="card" style="margin:0 16px 14px;padding:16px">
      <div class="v-section-title">${t('nutr_current_goal')}</div>
      <div style="font-size:18px;font-weight:700;color:var(--text);margin:5px 0 6px">${goal}</div>
      <div style="font-size:12px;color:var(--text-soft);line-height:1.55">${t('nutr_goal_meta')}</div>
    </div>
    <div class="nutrition-macro-grid">
      ${[
        [t('calories'), (c.meta||1800)+' kcal', 'var(--orange)'],
        [t('home_protein'), (c.prot||120)+'g', 'var(--firefly)'],
        [t('home_carbs'), (c.carb||220)+'g', 'var(--cyan)'],
        [t('home_fat'), (c.fat||60)+'g', 'var(--purple)']
      ].map(([l,v,col])=>`<div class="macro-card"><div class="macro-label">${l}</div><div class="macro-val" style="color:${col}">${v}</div></div>`).join('')}
    </div>
    <div class="section-title" style="margin-top:12px">${t('nutr_ai_plan')}</div>
    ${renderMealPlan()}
    <div class="card card-blue" style="margin:0 16px 14px;padding:15px">
      <div style="font-size:13px;font-weight:700;color:var(--blue);margin-bottom:6px">${t('nutr_recommended_recipes')}</div>
      <div style="font-size:12px;color:var(--text-soft);line-height:1.55;margin-bottom:10px">${t('nutr_rec_sub')}</div>
      <button class="btn btn-outline btn-full" onclick="navigate('recipes')" style="padding:11px">${t('nutr_view_recipes')}</button>
    </div>
  </div>`;
}

function renderAnalysisResult() {
  const a = NUTR.analysis;
  const scoreCol = a.score>=7?'var(--green)':a.score>=4?'var(--orange)':'var(--red)';
  return `<div class="analysis-card nutrition-analysis-result" style="margin-bottom:12px">
    ${NUTR.imagePreview?`<img src="${NUTR.imagePreview}" class="preview-img">`:''}
    <div class="analysis-head">
      <div class="analysis-title">${escapeHTML(a.name || 'Prato analisado pela IA')} ${escapeHTML(a.emoji || '')}</div>
      <div class="score-badge" style="background:${scoreCol}18;color:${scoreCol};border:2px solid ${scoreCol}40">${a.score}/10</div>
    </div>
    <div class="analysis-macro-chips">
      <span class="pill pill-orange">🔥 ${Number(a.kcal ?? a.cal)||0} kcal</span>
      <span class="pill pill-blue">💪 ${a.prot}g prot</span>
      <span class="pill pill-green">🌾 ${a.carb}g carb</span>
      <span class="pill pill-yellow">🧈 ${a.fat}g gord</span>
    </div>
    <div class="nutrient-grid">
      ${[['Fe',a.nutrition?.iron||'1.8mg'],['Ca',a.nutrition?.calcium||'65mg'],['Na',a.nutrition?.sodium||'280mg'],['Vit A',a.nutrition?.vitA||'120µg'],['Vit C',a.nutrition?.vitC||'18mg'],['B12',a.nutrition?.b12||'0.8µg']].map(([l,v])=>`<div class="nutrient-chip"><span>${escapeHTML(l)}</span><strong>${escapeHTML(String(v))}</strong></div>`).join('')}
    </div>
    <div style="margin-top:12px;padding:10px 12px;background:rgba(34,197,94,.06);border-radius:8px;border-left:3px solid var(--green)">
      <div style="font-size:12px;color:var(--green);font-weight:700;margin-bottom:4px">💡 Orientação personalizada</div>
      <div style="font-size:12px;color:var(--text2)">${escapeHTML(a.msg || '')}</div>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-primary" style="flex:1;padding:10px" onclick="addAnalyzedMeal()">+ Adicionar ao diário</button>
      <button class="btn btn-outline" style="flex:1;padding:10px" onclick="NUTR.analysis=null;navigate('nutrition')">Descartar</button>
    </div>
  </div>`;
}

function addAnalyzedMeal() {
  var a = NUTR.analysis;
  var meal = {id:Date.now(),time:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),name:sanitizeDbString(a.name,120),emoji:a.emoji,kcal:Number(a.kcal ?? a.cal)||0,prot:Number(a.prot)||0,carb:Number(a.carb)||0,fat:Number(a.fat)||0,type:'lunch'};
  APP.meals.push(meal);
  saveMealsLocal();
  try { coachMemoryService().saveMemory(currentUserId(), 'meal_logged', { source:'nutrition_ai', meal:meal, analysis:a }); } catch(_) {}
  try{if(APP.user&&APP.user.id&&String(APP.user.id).indexOf('local')<0)sbAddRefeicao(APP.user.id,{nome:meal.name,emoji:meal.emoji,calorias:meal.kcal,proteina:meal.prot,carbo:meal.carb,gordura:meal.fat,hora:meal.time,tipo:meal.type});}catch(e){}
  addXP(20); toast('\u2705 Refei\u00e7\u00e3o adicionada! +20 XP','success');
  NUTR.analysis=null; navigate('nutrition');
}

function saveMealsLocal() {
  try { normalizeMeals(); } catch(e) {}
  try { coachMemoryService().saveMemory(currentUserId(), 'nutrition_state', { totals:macroTotals(), meals:(APP.meals||[]).slice(-6) }, { silent:true }); } catch(e) {}
}

function saveMood(value) {
  APP.mood = sanitizeDbString(value, 20);
  sbGetUser().then(function(u) {
    if (u) return sbSaveHumor(u.id, APP.mood);
  }).catch(function(e) { toastFriendlyError('mood', e); });
  toast(t('mood_saved'),'success');
  navigate('home');
}

function loadMealsLocal() {
  return [];
}

function openQuickMeal() {
  openModal('Registrar Refei\u00e7\u00e3o', '<div style="display:flex;gap:6px;margin-bottom:12px"><button class="btn btn-sm btn-outline" onclick="document.getElementById(\'qm-type\').value=\'breakfast\'">\u2600 Caf\u00e9</button><button class="btn btn-sm btn-primary" onclick="document.getElementById(\'qm-type\').value=\'lunch\'">\ud83c\udf5d Almo\u00e7o</button><button class="btn btn-sm btn-outline" onclick="document.getElementById(\'qm-type\').value=\'dinner\'">\ud83c\udf19 Jantar</button><button class="btn btn-sm btn-outline" onclick="document.getElementById(\'qm-type\').value=\'snack\'">\ud83c\udf4e Lanche</button></div><input type="hidden" id="qm-type" value="lunch"><div class="input-wrap" style="margin-bottom:10px"><label class="input-label">Nome</label><input class="input" id="qm-name" placeholder="Ex: Arroz, frango e salada"></div><div style="display:flex;gap:8px;margin-bottom:10px"><div class="input-wrap" style="flex:1"><label class="input-label">Calorias</label><input class="input" id="qm-cal" type="number" placeholder="350"></div><div class="input-wrap" style="flex:1"><label class="input-label">Prote\u00edna</label><input class="input" id="qm-prot" type="number" placeholder="25"></div></div><div style="display:flex;gap:8px;margin-bottom:12px"><div class="input-wrap" style="flex:1"><label class="input-label">Carbos</label><input class="input" id="qm-carb" type="number" placeholder="40"></div><div class="input-wrap" style="flex:1"><label class="input-label">Gordura</label><input class="input" id="qm-fat" type="number" placeholder="12"></div></div><button class="btn btn-primary btn-full" onclick="saveQuickMeal()" style="padding:13px">\u2705 Salvar</button>');
}

function saveQuickMeal() {
  var name = sanitizeDbString(document.getElementById('qm-name')?.value?.trim(), 120);
  if(!name) { toast('Digite o nome','error'); return; }
  var meal = { id: Date.now(), time: new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}), name: name, emoji: '\ud83c\udf5d', kcal: Number(document.getElementById('qm-cal')?.value)||0, prot: Number(document.getElementById('qm-prot')?.value)||0, carb: Number(document.getElementById('qm-carb')?.value)||0, fat: Number(document.getElementById('qm-fat')?.value)||0, type: document.getElementById('qm-type')?.value||'lunch' };
  APP.meals.push(meal); saveMealsLocal();
  try { coachMemoryService().saveMemory(currentUserId(), 'meal_logged', { source:'quick_meal', meal:meal }); } catch(_) {}
  try{if(APP.user&&APP.user.id&&String(APP.user.id).indexOf('local')<0)sbAddRefeicao(APP.user.id,{nome:meal.name,emoji:meal.emoji,calorias:meal.kcal,proteina:meal.prot,carbo:meal.carb,gordura:meal.fat,hora:meal.time,tipo:meal.type});}catch(e){}
  addXP(15); toast('\u2705 '+name+' registrado!','success');
  closeModal(); navigate('nutrition');
}

function renderMealPlan() {
  const c = APP.calc||{};
  const meals = getDefaultMealPlan().map(function(m) {
    return Object.assign({}, m, { cal: Math.round((c.meta||1800) * m.ratio) });
  });
  return `<div style="padding:0 16px;margin-bottom:12px">
    ${meals.map(m=>`<div class="plan-meal-row" style="display:flex;gap:12px;align-items:center">
      <div style="font-size:22px;width:32px;text-align:center;flex-shrink:0">${mealPlanIcon(m.icon)}</div>
      <div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700;overflow-wrap:break-word">${escapeHTML(m.name)} <span style="color:var(--text3);font-size:11px">${m.time}</span></div><div style="font-size:11px;color:var(--text2);margin-top:2px;overflow-wrap:break-word">${escapeHTML(m.items)}</div></div>
      <div style="font-size:12px;font-weight:700;color:var(--orange);white-space:nowrap">${getKcal(m)} kcal</div>
    </div>`).join('')}
  </div>`;
}

function analyzeTextMeal() {
  openModal('Descrever refeição', `
    <div class="input-wrap"><label class="input-label">Descreva sua refeição</label><textarea class="input" id="meal-desc" rows="3" placeholder="Ex: arroz integral, frango grelhado e salada verde com azeite" style="resize:none"></textarea></div>
    <button class="btn btn-primary btn-full" onclick="analyzeDescription()" style="padding:13px">🔍 Analisar com IA</button>`);
}

function analyzeDescription() {
  const desc = document.getElementById('meal-desc')?.value;
  if (!desc?.trim()) { toast('Descreva a refeição','error'); return; }
  closeModal(); NUTR.loading=true; navigate('nutrition');
  analyzeFood(desc).then(result => {
    NUTR.analysis=result; NUTR.loading=false; navigate('nutrition');
    toast('✅ Análise concluída!','success'); addXP(15);
  });
}

function showNutritionCameraOpening() {
  NUTR.cameraOpening = true;
  const area = document.getElementById('cam-area');
  const title = area?.querySelector('.camera-title');
  const sub = area?.querySelector('.camera-sub');
  if (title) title.textContent = t('nutr_camera_opening');
  if (sub) sub.textContent = t('take_photo_sub');
  try { toast(t('nutr_camera_opening'), 'info', 1400); } catch(_) {}
  clearTimeout(window.__nutritionCameraFeedbackTimer);
  window.__nutritionCameraFeedbackTimer = setTimeout(function() {
    const input = document.getElementById('food-cam-capture');
    if (!input || !input.files || !input.files.length) {
      NUTR.cameraOpening = false;
      const currentTitle = document.querySelector('#cam-area .camera-title');
      if (currentTitle && currentTitle.textContent === t('nutr_camera_opening')) currentTitle.textContent = t('take_photo');
    }
  }, 4500);
}

function attachNutrition(screen) {
  const camInput = screen.querySelector('#food-cam-capture');
  const gallInput = screen.querySelector('#food-gallery');
  if (camInput) camInput.addEventListener('change', handleFoodPhoto);
  if (gallInput) gallInput.addEventListener('change', handleFoodPhoto);
}

function handleFoodPhoto(e) {
  const file = e.target.files?.[0];
  NUTR.cameraOpening = false;
  clearTimeout(window.__nutritionCameraFeedbackTimer);
  if(!file) { toast(t('nutr_camera_open_error'), 'error'); return; }
  const reader = new FileReader();
  reader.onload = ev => {
    NUTR.imagePreview = ev.target.result;
    NUTR.loading = true; navigate('nutrition');
    analyzeFood('food photo').then(result=>{
      NUTR.analysis=result; NUTR.loading=false; navigate('nutrition');
      toast('✅ Foto analisada!','success'); addXP(20);
    });
  };
  reader.readAsDataURL(file); e.target.value='';
}

/* ═══════════════════════════════════════
   RECIPES SCREEN
═══════════════════════════════════════ */
const REC = {filter:[], mealType:'all', openRecipe:null, search:''};
REC.premium = REC.premium || {goal:'all', time:'all', protein:'all', carb:'all', budget:'all'};


function setLang(code) {
  saveUserLanguage(normalizeLang(code));
  // Limpar receitas do idioma anterior
  window.RECIPES = window.RECIPES.filter(function(r) { return !r.external; });
  window._recipesLang = null;
  window._recipesLoaded = false;
  // Disparar carregamento do novo idioma
  loadExternalRecipes();
}

function toggleFilter(f) {
  if(REC.filter.length===1 && REC.filter[0]===f) { REC.filter=[]; }
  else { REC.filter=[f]; }
  navigate('recipes');
}

const RECIPE_TERM_I18N = {
  en: {
    'Completo':'Complete','Alta proteína':'High protein','Anti-inflamatório':'Anti-inflammatory','Vegano':'Vegan','Rápido':'Quick','Pré-treino':'Pre-workout','Pós-treino':'Post-workout','Sem glúten':'Gluten-free','Sem lactose':'Lactose-free','Detox':'Detox','Prebiótico':'Prebiotic','Gestante':'Pregnancy','Período menstrual':'Period','Ômega-3':'Omega-3','Ferro':'Iron','Emagrecimento':'Weight loss','Massa':'Muscle gain','Baixo carbo':'Low carb','Proteína':'Protein','Frango + Arroz Integral':'Chicken + Brown Rice','Omelete de Espinafre':'Spinach Omelet','Banana com Pasta de Amendoim':'Banana with Peanut Butter'
  },
  es: {
    'Completo':'Completo','Alta proteína':'Alta proteína','Anti-inflamatório':'Antiinflamatorio','Vegano':'Vegano','Rápido':'Rápido','Pré-treino':'Pre-entreno','Pós-treino':'Post-entreno','Sem glúten':'Sin gluten','Sem lactose':'Sin lactosa','Detox':'Detox','Prebiótico':'Prebiótico','Gestante':'Embarazo','Período menstrual':'Período','Ômega-3':'Omega-3','Ferro':'Hierro','Emagrecimento':'Pérdida de peso','Massa':'Masa muscular','Baixo carbo':'Low carb','Proteína':'Proteína','Frango + Arroz Integral':'Pollo + arroz integral','Omelete de Espinafre':'Omelet de espinaca','Banana com Pasta de Amendoim':'Banana con crema de maní'
  },
  ru: {
    'Completo':'Полноценно','Alta proteína':'Много белка','Anti-inflamatório':'Противовоспалительное','Vegano':'Веган','Rápido':'Быстро','Pré-treino':'До тренировки','Pós-treino':'После тренировки','Sem glúten':'Без глютена','Sem lactose':'Без лактозы','Detox':'Детокс','Prebiótico':'Пребиотик','Gestante':'Беременность','Período menstrual':'Период','Ômega-3':'Омега-3','Ferro':'Железо','Emagrecimento':'Снижение веса','Massa':'Набор массы','Baixo carbo':'Low carb','Proteína':'Белок','Frango + Arroz Integral':'Курица + бурый рис','Omelete de Espinafre':'Омлет со шпинатом','Banana com Pasta de Amendoim':'Банан с арахисовой пастой'
  }
};
const RECIPE_SUBS_I18N = {
  pt: '• Sem frango? Use atum, tofu ou ovos<br>• Sem aveia? Tente quinoa em flocos<br>• Lactose: troque por versão vegetal',
  en: '• No chicken? Use tuna, tofu or eggs<br>• No oats? Try quinoa flakes<br>• Lactose: switch to a plant-based option',
  es: '• ¿Sin pollo? Usa atún, tofu o huevos<br>• ¿Sin avena? Prueba quinoa en hojuelas<br>• Lactosa: cambia por una versión vegetal',
  ru: '• Нет курицы? Используйте тунца, тофу или яйца<br>• Нет овсянки? Попробуйте хлопья киноа<br>• Лактоза: замените на растительный вариант'
};
function recipeTerm(value) {
  var raw = String(value || '');
  return (RECIPE_TERM_I18N[APP.lang] && RECIPE_TERM_I18N[APP.lang][raw]) || raw;
}
function recipeTitle(r) { return repairI18n(recipeTerm(r.name || r.nome || r.title || t('recipes.title'))); }
function recipeTags(r) { return (r.tags || []).map(recipeTerm); }
function recipeIngredients(r) { return repairI18n(r.ingredients || r.ingredientes || []); }
function recipeSteps(r) { return repairI18n(r.steps || r.preparo || r.modo_preparo || []); }
function recipeSubstitutions(r) { return repairI18n(r.substitutions || r.substituicoes || r.substituições || []); }

function renderRecipeDetail(id) {
  try {
    const r = (window.RECIPES || RECIPES || []).find(function(item){ return String(item.id) === String(id); });
    if(!r) {
      REC.openRecipe = null;
      return `<div class="screen-header"><button class="btn btn-ghost" onclick="REC.openRecipe=null;navigate('recipes')" style="font-size:20px">←</button><div class="screen-title">${vitaliaIcon('recipes')} ${t('recipes')}</div></div>${showRecipeErrorState(APP.lang || 'pt')}`;
    }
    const scoreCol = r.score>=7?'var(--green)':r.score>=4?'var(--orange)':'var(--red)';
    const title = recipeTitle(r);
    const tags = recipeTags(r);
    const ingredients = recipeIngredients(r);
    const steps = recipeSteps(r);
    const substitutions = recipeSubstitutions(r);
    const subsHtml = substitutions.length ? substitutions.map(function(s){ return '• '+escapeHTML(recipeTerm(s)); }).join('<br>') : RECIPE_SUBS_I18N[APP.lang] || RECIPE_SUBS_I18N.pt;
    return `
  <div class="screen-header">
    <button class="btn btn-ghost" onclick="REC.openRecipe=null;navigate('recipes')" style="font-size:20px">←</button>
    <div style="display:flex;gap:8px"><button class="btn btn-sm btn-outline" onclick="toast(t('recipes.saved'),'success')">${t('recipes.save')}</button></div>
  </div>
  <div style="background:var(--surface2);padding:40px;text-align:center;font-size:80px">${r.emoji}</div>
  <div class="recipe-detail v-recipe-detail">
    <h1 style="font-family:var(--font-serif);font-size:22px;margin-bottom:8px">${title}</h1>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
      ${tags.map(tag=>`<span class="pill pill-green">${tag}</span>`).join('')}
    </div>
    <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
      <span class="pill pill-orange">⏱ ${(r.time||((r.tempo||15)+'min'))}</span><span class="pill pill-blue">🎯 ${recipeTerm(r.diff||t('rec_easy'))}</span><span class="pill pill-green">🔥 ${r.cal} kcal</span><div class="stars">${Array.from({length:5},(_,i)=>`<span class="star ${i<Math.round((r.score||8))?'filled':''}">★</span>`).join('')} <span style="font-size:12px;color:var(--text2);">${(r.score||8)} (${r.reviews||0} ${t('recipes.reviews')})</span></div>
    </div>

    <!-- Nutrition table -->
    <div class="card card-glow" style="margin-bottom:16px">
      <div style="font-size:12px;font-weight:700;color:var(--green);margin-bottom:8px">${vitaliaIcon('analytics')} ${t('recipes.nutritionTable')}</div>
      <div class="macro-row" style="margin-bottom:8px">
        ${[[vitaliaIcon('calories'),r.cal,'kcal'],[vitaliaIcon('protein'),r.prot+'g',t('recipes.protein')],[vitaliaIcon('nutrition'),r.carb+'g',t('recipes.carbs')],[vitaliaIcon('fasting'),r.fat+'g',t('recipes.fat')],[vitaliaIcon('recipes'),(r.fiber||0)+'g',t('recipes.fiber')]].map(([e,v,l])=>`<div class="macro-card" style="text-align:center"><div style="font-size:16px">${e}</div><div style="font-size:14px;font-weight:700">${v}</div><div style="font-size:9px;color:var(--text3)">${l}</div></div>`).join('')}
      </div>
      <div style="font-size:11px;color:var(--text2)">${t('recipes.estimatedGI')}: ${r.gi||'-'} · ${t('recipes.score')}: <span style="color:${scoreCol};font-weight:700">${r.score||8}/10</span></div>
    </div>

    <h3 style="font-family:var(--font-serif);margin-bottom:12px">${t('recipes.ingredients')}</h3>
    ${ingredients.map(ing=>`<div class="ingredient-item"><div class="ingredient-bullet"></div><div style="font-size:13px">${escapeHTML(String(ing))}</div></div>`).join('')}
    <h3 style="font-family:var(--font-serif);margin:16px 0 12px">${t('recipes.preparation')}</h3>
    ${steps.map((s,i)=>`<div class="step-item"><div class="step-num">${i+1}</div><div class="step-text">${escapeHTML(String(s))}</div></div>`).join('')}

    <div class="card card-blue" style="margin-top:4px">
      <div style="font-size:12px;font-weight:700;color:var(--blue);margin-bottom:4px">${vitaliaIcon('refresh')} ${t('recipes.substitutions')}</div>
      <div style="font-size:12px;color:var(--text2)">${subsHtml}</div>
    </div>

    <div style="margin-top:16px;display:flex;gap:10px">
      <button class="btn btn-primary" style="flex:1;padding:13px" onclick="rememberRecipeSelection(${r.id},'add_to_plan');toast(t('recipes.added')+' +15 XP','success');addXP(15)">${t('recipes.addToPlan')}</button>
      <button class="btn btn-outline" style="flex:1;padding:13px" onclick="navigate('shopping')">${vitaliaIcon('shopping')} ${t('recipes.shoppingList')}</button>
    </div>
  </div>`;
  } catch(e) {
    console.error('renderRecipeDetail failed:', e);
    REC.openRecipe = null;
    return `<div class="screen-header"><button class="btn btn-ghost" onclick="REC.openRecipe=null;navigate('recipes')" style="font-size:20px">←</button><div class="screen-title">${vitaliaIcon('recipes')} ${t('recipes')}</div></div>${showRecipeErrorState(APP.lang || 'pt')}`;
  }
}

function getRecipeLang() {
  return normalizeLang((window._recipesLang || (getUserLanguage ? getUserLanguage() : APP.lang) || 'pt'));
}

function openRecipeSafe(id) {
  try {
    var found = (window.RECIPES || RECIPES || []).some(function(item){ return String(item.id) === String(id); });
    if (!found) {
      REC.openRecipe = null;
      window._recipesLoaded = false;
      loadExternalRecipes().catch(function(e){ console.error('openRecipeSafe reload failed:', e); window._recipesError = e.message || String(e); });
      toast(t('rec_load_error'), 'error', 2200);
      navigate('recipes');
      return;
    }
    REC.openRecipe = Number(id);
    rememberRecipeSelection(Number(id), 'view');
    navigate('recipes');
  } catch(e) {
    console.error('openRecipeSafe failed:', e);
    REC.openRecipe = null;
    toast(t('rec_load_error'), 'error', 2200);
    navigate('recipes');
  }
}

function rememberRecipeSelection(id, action) {
  try {
    var recipe = RECIPES.find(function(item){ return item.id === id; });
    if (!recipe || typeof coachMemoryService !== 'function') return;
    coachMemoryService().saveMemory(currentUserId(), 'recipe_interaction', {
      recipe_id: recipe.sourceId || recipe.id,
      recipe_title: recipeTitle(recipe),
      category: recipe.cat || recipe.category || '',
      goal: recipe.goal || '',
      diet: recipe.filterKeys || [],
      tags: recipeTags(recipe),
      action: action || 'view',
      lang: getRecipeLang()
    }, { silent:false });
  } catch(_) {}
}

/* ═══════════════════════════════════════
   HYDRATION SCREEN
═══════════════════════════════════════ */
function addWater(ml) {
  const cups = Math.round(ml/250);
  APP.water = Math.min(APP.water+cups, (APP.calc?.aguaCopos||8)+4);
  try { coachMemoryService().saveMemory(currentUserId(), 'hydration', { cups:APP.water, addedMl:ml, target:smartHydrationTarget() }); } catch(_) {}
  sbGetUser().then(u => { if(u) sbSaveAgua(u.id, APP.water); }).catch(e => toastFriendlyError('water', e));
  toast(t('water_added',ml),'success'); addXP(5);
  navigate('hydration');
}
function setWater(n) {
  APP.water=n;
  try { coachMemoryService().saveMemory(currentUserId(), 'hydration', { cups:APP.water, target:smartHydrationTarget() }); } catch(_) {}
  sbGetUser().then(u => { if(u) sbSaveAgua(u.id, APP.water); }).catch(e => toastFriendlyError('water', e));
  navigate('hydration');
}

/* ═══════════════════════════════════════
   MORE SCREEN
═══════════════════════════════════════ */
//

/* ═══════════════════════════════════════
   FASTING SCREEN
═══════════════════════════════════════ */
const FAST = {protocol:'16:8', active:false, startTime:null, elapsed:0, interval:null};
const PROTOCOLS = [
  {id:'16:8',name:'16:8',fast:16,eat:8,desc:'Jejua 16h, come em 8h. O mais popular.',popular:true},
  {id:'18:6',name:'18:6',fast:18,eat:6,desc:'Jejua 18h, come em 6h. Avançado.'},
  {id:'20:4',name:'20:4',fast:20,eat:4,desc:'Jejua 20h, janela de 4h. Warrior Diet.'},
  {id:'OMAD',name:'OMAD',fast:23,eat:1,desc:'Uma refeição por dia. Experts apenas.'},
  {id:'5:2',name:'5:2',fast:0,eat:0,desc:'5 dias normal, 2 dias <500kcal/dia.'},
];

const FASTING_PROTOCOL_I18N = {
  pt: {'16:8':'Jejua 16h, come em 8h. O mais popular.','18:6':'Jejua 18h, come em 6h. Avançado.','20:4':'Jejua 20h, janela de 4h. Warrior Diet.','OMAD':'Uma refeição por dia. Experts apenas.','5:2':'5 dias normal, 2 dias <500kcal/dia.'},
  en: {'16:8':'Fast 16h, eat in 8h. Most popular.','18:6':'Fast 18h, eat in 6h. Advanced.','20:4':'Fast 20h, 4h eating window. Warrior Diet.','OMAD':'One meal a day. Experts only.','5:2':'5 normal days, 2 days under 500 kcal/day.'},
  es: {'16:8':'Ayuna 16h, come en 8h. El más popular.','18:6':'Ayuna 18h, come en 6h. Avanzado.','20:4':'Ayuna 20h, ventana de 4h. Warrior Diet.','OMAD':'Una comida al día. Solo expertos.','5:2':'5 días normales, 2 días <500 kcal/día.'},
  ru: {'16:8':'Голодание 16 ч, питание 8 ч. Самый популярный.','18:6':'Голодание 18 ч, питание 6 ч. Продвинутый.','20:4':'Голодание 20 ч, окно питания 4 ч. Warrior Diet.','OMAD':'Один приём пищи в день. Только для опытных.','5:2':'5 обычных дней, 2 дня <500 ккал/день.'}
};
function fastingProtocolDesc(id) {
  return (FASTING_PROTOCOL_I18N[APP.lang] && FASTING_PROTOCOL_I18N[APP.lang][id]) || FASTING_PROTOCOL_I18N.pt[id] || '';
}

function formatTime(secs) {
  const h=Math.floor(secs/3600), m=Math.floor((secs%3600)/60), s=Math.floor(secs%60);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}


/* ═══════════════════════════════════════
   SCANNER SCREEN
═══════════════════════════════════════ */
const SCAN = {result:null, history:[], barcode:'', mode:'live', state:'idle', stream:null, detectTimer:null, quaggaRunning:false};

function getInflammatoryScore(foodData) {
  // foodData = objeto retornado pelo OpenFoodFacts
  // Retorna: { score: -3..+3, label: string, color: string, reasons: string[] }
  // Score negativo = anti-inflamatório, positivo = inflamatório

  var score = 0;
  var reasons = [];

  var nutriments = foodData.nutriments || {};

  // Açúcar > 10g/100g → +1
  var sugar = parseFloat(nutriments['sugars_100g']) || 0;
  if (sugar > 20) { score += 2; reasons.push('Alto teor de açúcar (' + sugar.toFixed(1) + 'g)'); }
  else if (sugar > 10) { score += 1; reasons.push('Açúcar moderado (' + sugar.toFixed(1) + 'g)'); }

  // Gordura saturada > 5g/100g → +1
  var satFat = parseFloat(nutriments['saturated-fat_100g']) || 0;
  if (satFat > 10) { score += 2; reasons.push('Alto em gordura saturada (' + satFat.toFixed(1) + 'g)'); }
  else if (satFat > 5) { score += 1; reasons.push('Gordura saturada moderada (' + satFat.toFixed(1) + 'g)'); }

  // Sódio > 600mg/100g → +1
  var sodium = parseFloat(nutriments['sodium_100g']) || 0;
  var sodiumMg = sodium * 1000;
  if (sodiumMg > 1000) { score += 2; reasons.push('Muito sódio (' + Math.round(sodiumMg) + 'mg)'); }
  else if (sodiumMg > 600) { score += 1; reasons.push('Sódio elevado (' + Math.round(sodiumMg) + 'mg)'); }

  // Fibra > 3g/100g → anti-inflamatório -1
  var fiber = parseFloat(nutriments['fiber_100g']) || 0;
  if (fiber > 5) { score -= 2; reasons.push('Rico em fibras (' + fiber.toFixed(1) + 'g)'); }
  else if (fiber > 3) { score -= 1; reasons.push('Boa fonte de fibras (' + fiber.toFixed(1) + 'g)'); }

  // Ômega-3 / gordura insaturada favorável
  var fat = parseFloat(nutriments['fat_100g']) || 0;
  var satRatio = fat > 0 ? satFat / fat : 0;
  if (fat > 2 && satRatio < 0.2) { score -= 1; reasons.push('Perfil lipídico favorável'); }

  // Verificar categorias do produto (tags)
  var categories = (foodData.categories_tags || []).join(' ');
  var name = ((foodData.product_name || '') + ' ' + (foodData.generic_name || '')).toLowerCase();

  // Alimentos processados ultra → +2
  var ultraProcessed = ['en:ultra-processed','nugget','embutido','salsicha','presunto','refrigerante',
    'soda','chips','biscoito recheado','cookie','puff','frito'];
  if (ultraProcessed.some(function(k){ return categories.includes(k) || name.includes(k); })) {
    score += 2; reasons.push('Alimento ultraprocessado');
  }

  // Alimentos funcionais/naturais → -1
  var functional = ['en:fruits','en:vegetables','en:legumes','en:nuts','en:seeds',
    'en:olive-oil','en:fish','salmão','sardinha','atum','linhaça','chia','cúrcuma',
    'gengibre','brócolis','espinafre','mirtilo','blueberry'];
  if (functional.some(function(k){ return categories.includes(k) || name.includes(k); })) {
    score -= 1; reasons.push('Alimento funcional/natural');
  }

  // Clamp -3..+3
  score = Math.max(-3, Math.min(3, score));

  var label, color;
  if (score <= -2) { label = 'Anti-inflamatório'; color = '#4caf50'; }
  else if (score === -1) { label = 'Levemente anti-inflamatório'; color = '#8bc34a'; }
  else if (score === 0) { label = 'Neutro'; color = '#9e9e9e'; }
  else if (score === 1) { label = 'Levemente inflamatório'; color = '#ff9800'; }
  else if (score === 2) { label = 'Inflamatório'; color = '#f44336'; }
  else { label = 'Muito inflamatório'; color = '#b71c1c'; }

  return { score: score, label: label, color: color, reasons: reasons };
}

function renderScanner() {
  return `
  <div class="screen-header"><div class="screen-title">${vitaliaIcon('scanner')} ${t('scanner.title') || t('scanner')}</div></div>
  <div class="scanner-shell v-safe-text">

    <!-- Tabs: câmera ao vivo / foto / manual -->
    <div class="tab-row scanner-tabs">
      <button class="tab-btn ${SCAN.mode==='live'?'active':''}" onclick="setScanMode('live')">${vitaliaIcon('scanner')} ${t('scanner_live')}</button>
      <button class="tab-btn ${SCAN.mode==='photo'?'active':''}" onclick="setScanMode('photo')">${vitaliaIcon('analytics')} ${t('scanner_photo')}</button>
      <button class="tab-btn ${SCAN.mode==='manual'?'active':''}" onclick="setScanMode('manual')">${vitaliaIcon('edit')} ${t('scanner_manual')}</button>
    </div>

    <!-- MODO: CÂMERA AO VIVO (QuaggaJS) -->
    ${SCAN.mode==='live'?`
    <div id="scanner-live-wrap" class="scanner-live-wrap ${SCAN.state==='active'?'active':SCAN.state==='error'?'error':''}">
      <div id="quagga-viewport" class="scanner-viewport"></div>
      <div id="scan-laser" class="scanner-laser"></div>
      <div id="scanner-target" class="scanner-target"><span></span></div>
      <div class="scanner-aim">${t('scanner_aim')}</div>
    </div>
    <div id="scan-live-status" class="scanner-status">${scannerStateMessage()}</div>
    <div class="scanner-actions">
      <button class="btn btn-primary" onclick="startLiveScanner()">${t('scanner_open_camera')}</button>
      <label class="btn btn-outline scanner-file-btn">
        <input type="file" accept="image/*" style="display:none" onchange="scanFromPhoto(this)">
        ${t('scanner_choose_gallery')}
      </label>
    </div>
    <button class="btn btn-danger btn-full scanner-stop-btn" onclick="stopLiveScanner()">⏹ ${t('scanner_stop')}</button>
    `:
    SCAN.mode==='photo'?`
    <!-- MODO: FOTO (ZXing) -->
    <div class="scanner-photo-wrap">
      <label id="scan-photo-label" class="scanner-photo-label">
        <input type="file" id="scan-photo-input" accept="image/*" style="display:none" onchange="scanFromPhoto(this)">
        <span class="scanner-photo-icon">${vitaliaIcon('scanner')}</span>
        <div class="scanner-photo-title">${t('scanner_take_choose')}</div>
        <div class="scanner-photo-sub">${t('scan_barcode_photo')}</div>
      </label>
      <div class="scanner-actions">
        <label class="btn btn-outline scanner-file-btn">
          <input type="file" accept="image/*" capture="environment" style="display:none" onchange="scanFromPhoto(this)">
          ${vitaliaIcon('scanner')} ${t('scanner_camera')}
        </label>
        <label class="btn btn-outline scanner-file-btn">
          <input type="file" accept="image/*" style="display:none" onchange="scanFromPhoto(this)">
          ${vitaliaIcon('analytics')} ${t('scanner_gallery')}
        </label>
      </div>
    </div>
    <div id="scan-photo-status" class="scanner-status"></div>
    `:
    /* MODO: MANUAL */`
    <div class="scanner-manual">
      <div class="scanner-manual-label">${t('scan_enter_barcode')}</div>
      <div class="scanner-manual-row">
        <input class="input scanner-manual-input" id="barcode-input" placeholder="Ex: 7891000315507" value="${SCAN.barcode}" oninput="SCAN.barcode=this.value" onkeydown="if(event.key==='Enter')doScan(this.value)">
        <button class="btn btn-primary scanner-manual-btn" onclick="doScan(document.getElementById('barcode-input').value)">🔍</button>
      </div>
    </div>
    `}

    <!-- Produtos de exemplo -->
    <div class="scanner-examples-title">${t('scanner_examples')}</div>
    <div class="scanner-examples">
      <div class="scanner-country">🇧🇷 BRASIL</div>
      <div class="scanner-chip-row">
        ${PRODUCTS.filter(p=>p.country==='🇧🇷').slice(0,6).map(p=>`<button class="tab-btn scanner-demo-chip" onclick="doScan('${p.code}')">${p.name.split(' ')[0]}</button>`).join('')}
      </div>
      <div class="scanner-country">🇺🇸 EUA</div>
      <div class="scanner-chip-row">
        ${PRODUCTS.filter(p=>p.country==='🇺🇸').slice(0,5).map(p=>`<button class="tab-btn scanner-demo-chip" onclick="doScan('${p.code}')">${p.name.split(' ')[0]}</button>`).join('')}
      </div>
      <div class="scanner-country">🇷🇺 РОССИЯ</div>
      <div class="scanner-chip-row">
        ${PRODUCTS.filter(p=>p.country==='🇷🇺').slice(0,5).map(p=>`<button class="tab-btn scanner-demo-chip" onclick="doScan('${p.code}')">${(p.name.split('(')[1]||p.name).replace(')','').split(' ')[0]}</button>`).join('')}
      </div>
    </div>
  </div>

  ${SCAN.result ? renderProductCard(SCAN.result) : ''}

  ${SCAN.history.length ? `
  <div class="section-title">📋 ${t('scan_history_label')}</div>
  <div style="padding:0 16px;margin-bottom:16px">
    ${SCAN.history.slice(0,5).map(p=>`
    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="SCAN.result=SCAN.history.find(h=>h.code==='${p.code}');navigate('scanner')">
      <span style="font-size:22px">${p.sem}</span>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:600">${p.name}</div>
        <div style="font-size:11px;color:var(--text2)">${p.brand} · Score ${p.score}/10</div>
      </div>
      <span style="color:var(--text3);font-size:18px">›</span>
    </div>`).join('')}
  </div>` : ''}`;
}


/* ═══════════════════════════════════════
   SCANNER REAL — QuaggaJS + ZXing
═══════════════════════════════════════ */

// ── State ─────────────────────────────
SCAN.mode = SCAN.mode || 'live';  // live | photo | manual
SCAN.quaggaRunning = false;

function scannerStateMessage() {
  if (SCAN.state === 'loading') return t('scanner_state_loading');
  if (SCAN.state === 'active') return '🟢 ' + t('scanner_state_active');
  if (SCAN.state === 'error') return t('scanner_camera_error');
  return t('scanner_state_idle');
}

function setScannerState(state, message) {
  SCAN.state = state || 'idle';
  var statusEl = document.getElementById('scan-live-status');
  if (statusEl) statusEl.innerHTML = message || scannerStateMessage();
  var wrap = document.getElementById('scanner-live-wrap');
  if (wrap) {
    wrap.classList.toggle('active', SCAN.state === 'active');
    wrap.classList.toggle('detected', SCAN.state === 'detected');
    wrap.classList.toggle('error', SCAN.state === 'error');
  }
}

function stopScannerStreamOnly() {
  if (SCAN.detectTimer) { try { clearInterval(SCAN.detectTimer); } catch(_) {} SCAN.detectTimer = null; }
  if (SCAN.stream) {
    try { SCAN.stream.getTracks().forEach(function(track){ track.stop(); }); } catch(_) {}
    SCAN.stream = null;
  }
  document.querySelectorAll('#quagga-viewport video').forEach(function(v){
    try { if (v.srcObject) v.srcObject.getTracks().forEach(function(track){ track.stop(); }); v.srcObject = null; v.pause(); } catch(_) {}
  });
}

window.setScanMode = function(mode) {
  // Stop live scanner if switching away
  if (SCAN.mode === 'live' && mode !== 'live') stopLiveScanner();
  SCAN.mode = mode;
  navigate('scanner');
  // Auto-start live scanner
  if (mode === 'live') setTimeout(startLiveScanner, 300);
};

function loadScriptOnce(id, urls, statusEl, label) {
  urls = Array.isArray(urls) ? urls : [urls];
  return new Promise(function(resolve, reject) {
    if (document.getElementById(id)) { resolve(); return; }
    var i = 0;
    function next() {
      if (i >= urls.length) {
        if (statusEl) statusEl.innerHTML = t('scanner_camera_unavailable') + ' <a href="#" onclick="setScanMode(&quot;photo&quot;)" style="color:var(--green)">'+t('scanner_use_photo')+'</a>';
        reject(new Error('script load failed'));
        return;
      }
      var s = document.createElement('script');
      s.id = id;
      s.src = urls[i++];
      s.async = true;
      s.onload = resolve;
      s.onerror = function() { try { s.remove(); } catch(_) {} next(); };
      document.head.appendChild(s);
    }
    next();
  });
}

// ── MODO 1: Câmera ao vivo com QuaggaJS ──
window.startLiveScanner = async function() {
  stopScannerStreamOnly();
  if(typeof Quagga!=='undefined'){try{Quagga.stop()}catch(e){}try{Quagga.offDetected()}catch(e){}try{Quagga.offProcessed()}catch(e){}}
  SCAN.quaggaRunning = false;
  SCAN.state = 'loading';
  const statusEl = document.getElementById('scan-live-status');
  const viewport = document.getElementById('quagga-viewport');
  setScannerState('loading');
  if (!viewport) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    vitaliaLogEvent('warn', 'scanner', 'camera_requires_https', { protocol:location.protocol });
    setScannerState('error', t('scanner_need_https') + ' <a href="#" onclick="setScanMode(\'photo\')" style="color:var(--green)">'+t('scanner_use_photo')+'</a>');
    return;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    vitaliaLogEvent('warn', 'scanner', 'get_user_media_unavailable', { mediaDevices:!!navigator.mediaDevices });
    setScannerState('error', t('scanner_no_camera') + ' <a href="#" onclick="setScanMode(\'photo\')" style="color:var(--green)">'+t('scanner_use_photo')+'</a>');
    return;
  }

  viewport.innerHTML = '';
  try {
    const constraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 24, max: 30 }
      },
      audio: false
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    SCAN.stream = stream;
    var video = document.createElement('video');
    video.setAttribute('playsinline', 'true');
    video.setAttribute('muted', 'true');
    video.autoplay = true;
    video.muted = true;
    video.srcObject = stream;
    video.className = 'scanner-video';
    viewport.appendChild(video);
    try { await video.play(); } catch(_) {}
    try {
      var track = stream.getVideoTracks()[0];
      if (track && track.getCapabilities) {
        var caps = track.getCapabilities();
        var advanced = {};
        if (caps.focusMode && caps.focusMode.indexOf('continuous') >= 0) advanced.focusMode = 'continuous';
        if (caps.torch) advanced.torch = false;
        if (Object.keys(advanced).length) await track.applyConstraints({ advanced:[advanced] });
      }
    } catch(e) { console.warn('Camera constraints not fully supported:', e); }
    setScannerState('active');

    if ('BarcodeDetector' in window) {
      try {
        var detector = new BarcodeDetector({ formats:['ean_13','ean_8','upc_a','upc_e','code_128','code_39','itf'] });
        var accepted = false, lastCode = '', stableCount = 0;
        SCAN.detectTimer = setInterval(async function(){
          if (accepted || SCAN.state !== 'active') return;
          try {
            var codes = await detector.detect(video);
            if (!codes || !codes.length) return;
            var code = String(codes[0].rawValue || '').trim();
            if (!code || code.length < 8) return;
            if (code === lastCode) stableCount += 1; else { lastCode = code; stableCount = 1; }
            setScannerState('detected', '🟢 ' + t('scanner_object_detected') + ': ' + code + ' (' + stableCount + '/2)');
            setTimeout(function(){ if (SCAN.state === 'detected') setScannerState('active', '🟢 ' + t('scanner_analyzing')); }, 220);
            if (stableCount < 2) return;
            accepted = true;
            if (navigator.vibrate) navigator.vibrate([100,50,100]);
            setScannerState('active', '✅ ' + code);
            stopLiveScanner({ keepStatus:true });
            setTimeout(function(){ if (!window._scanLock) doScan(code); }, 350);
          } catch(_) {}
        }, 500);
      } catch(_) {
        setScannerState('active', '🟢 ' + t('scanner_no_barcode_support'));
      }
    } else {
      setScannerState('active', '🟢 ' + t('scanner_no_barcode_support'));
    }
  } catch(e) {
    console.error('Erro câmera:', e);
    var denied = e && (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError' || /denied|permission/i.test(String(e.message || '')));
    vitaliaLogEvent(denied ? 'warn' : 'error', 'scanner', denied ? 'camera_permission_denied' : 'camera_open_failed', { name:e && e.name, message:String(e && e.message || e).slice(0, 500) });
    var msg = denied ? t('scanner_permission_denied') : t('scanner_camera_blocked');
    setScannerState('error', msg + ' <a href="#" onclick="setScanMode(\'photo\')" style="color:var(--green)">'+t('scanner_use_photo')+'</a>');
    return;
  }
};

window.stopLiveScanner = function(opts) {
  opts = opts || {};
  if(typeof Quagga!=='undefined'){try{Quagga.stop()}catch(e){}try{Quagga.offDetected()}catch(e){}try{Quagga.offProcessed()}catch(e){}}
  stopScannerStreamOnly();
  SCAN.quaggaRunning=false;
  SCAN.state='idle';
  var vp=document.getElementById('quagga-viewport');
  if(vp){
    vp.querySelectorAll('canvas').forEach(function(cv){cv.remove()});
    vp.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text3);font-size:14px">'+t('scanner_off')+'</div>';
  }
  var statusEl=document.getElementById('scan-live-status');
  if(statusEl && !opts.keepStatus)statusEl.innerHTML='⏹ '+t('scanner_off')+' — <a href="#" onclick="startLiveScanner();return false" style="color:var(--green)">▶ '+t('scanner_restart')+'</a>';
  var stopBtn=document.querySelector('[onclick="stopLiveScanner()"]');
  if(stopBtn){stopBtn.className='btn btn-primary btn-full';stopBtn.innerHTML='▶ '+t('scanner_restart');stopBtn.setAttribute('onclick','startLiveScanner()');}
};

// ── MODO 2: Leitura de foto com ZXing ─────
window.scanFromPhoto = async function(input) {
  const file = input?.files?.[0];
  if (!file) return;

  const statusEl = document.getElementById('scan-photo-status');
  if (statusEl) statusEl.innerHTML = t('scanner_reading_photo');

  // Load ZXing if not available
  if (typeof ZXing === 'undefined') {
    try {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    } catch(e) {
      // ZXing failed to load — use canvas fallback
      if (statusEl) statusEl.innerHTML = t('scanner_alt_analysis');
    }
  }

  const reader = new FileReader();
  reader.onload = async (ev) => {
    const imgSrc = ev.target.result;

    // Try ZXing decode
    if (typeof ZXing !== 'undefined') {
      try {
        const hints = new Map();
        const formats = [
          ZXing.BarcodeFormat.EAN_13,
          ZXing.BarcodeFormat.EAN_8,
          ZXing.BarcodeFormat.CODE_128,
          ZXing.BarcodeFormat.CODE_39,
          ZXing.BarcodeFormat.UPC_A,
          ZXing.BarcodeFormat.UPC_E,
        ];
        hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, formats);
        hints.set(ZXing.DecodeHintType.TRY_HARDER, true);

        const codeReader = new ZXing.MultiFormatReader();
        codeReader.setHints(hints);

        // Create image element
        const img = new Image();
        img.onload = () => {
          try {
            // Create canvas and draw image
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const luminanceSource = new ZXing.RGBLuminanceSource(imageData.data, canvas.width, canvas.height);
            const binaryBitmap = new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(luminanceSource));
            const result = codeReader.decode(binaryBitmap);
            if (result && result.getText()) {
              const code = result.getText();
        if (statusEl) statusEl.innerHTML = `${t('scanner_code_detected')}: <strong>${escapeHTML(code)}</strong>`;
              if (navigator.vibrate) navigator.vibrate(200);
              setTimeout(() => doScan(code), 500);
            } else {
              fallbackScan(statusEl);
            }
          } catch(err) {
            fallbackScan(statusEl);
          }
        };
        img.onerror = () => fallbackScan(statusEl);
        img.src = imgSrc;
        return;
      } catch(e) {
        fallbackScan(statusEl);
        return;
      }
    }

    // Fallback: try to read digits from image using canvas
    fallbackScan(statusEl);
  };
  reader.readAsDataURL(file);
  input.value = '';
};

function fallbackScan(statusEl) {
  showScannerSuggestion('visual');
  if (statusEl) statusEl.innerHTML = t('scanner_best_suggestion') + ' · <a href="#" onclick="setScanMode(\'manual\')" style="color:var(--green)">'+t('scanner_manual')+'</a>';
  toast(t('scanner_not_found'), 'info', 4000);
}

window.handleScanPhoto = window.scanFromPhoto;

function scannerLocaleRegion(code) {
  var lang = normalizeLang(getUserLanguage ? getUserLanguage() : APP.lang);
  if (code) {
    var clean = String(code);
    if (clean.startsWith('789')) return 'br';
    if (clean.startsWith('46')) return 'ru';
    if (clean.length === 12 || /^0[0134]/.test(clean)) return 'us';
    if (/^(30|37|40|41|42|43|50|80|83|84)/.test(clean)) return 'eu';
  }
  return lang === 'ru' ? 'ru' : lang === 'es' ? 'latam' : lang === 'en' ? 'us' : 'br';
}

function scannerSuggestionProduct(kind, code) {
  var region = scannerLocaleRegion(code);
  var options = {
    br:{name:'Maçã ou morango fresco',brand:t('scanner_best_suggestion'),country:'🇧🇷',alt:'Confirme se parece fruta fresca antes de salvar.',carb:'14g'},
    us:{name:'Apple or strawberries',brand:t('scanner_best_suggestion'),country:'🇺🇸',alt:'Confirm it looks like fresh fruit before saving.',carb:'14g'},
    latam:{name:'Manzana o fresas frescas',brand:t('scanner_best_suggestion'),country:'🌎',alt:'Confirma si parece fruta fresca antes de guardar.',carb:'14g'},
    eu:{name:'Fresh fruit suggestion',brand:t('scanner_best_suggestion'),country:'🇪🇺',alt:'Confirm visually before saving.',carb:'14g'},
    ru:{name:'Яблоко или ягоды',brand:t('scanner_best_suggestion'),country:'🇷🇺',alt:'Подтвердите визуально перед сохранением.',carb:'14g'}
  };
  var item = options[region] || options.br;
  return {
    code: code || ('visual-' + Date.now()),
    name:item.name,
    brand:item.brand,
    sem:'🟡',
    score:7,
    cal100:52,
    cal_serving:78,
    carb100:item.carb,
    prot100:'0g',
    fat100:'0g',
    sodium100:'1mg',
    serving:'150g',
    alerts:[t('scanner_best_suggestion'), item.alt],
    alt:item.alt,
    tags:['visual-fallback','fruit'],
    country:item.country,
    source:'Visual fallback'
  };
}

function showScannerSuggestion(kind, code) {
  var product = scannerSuggestionProduct(kind, code);
  SCAN.result = product;
  SCAN.barcode = code || '';
  if (!SCAN.history.find(function(h){ return h.code === product.code; })) SCAN.history.unshift(product);
  try { coachMemoryService().saveMemory(currentUserId(), 'scanner_suggestion', { product:product, kind:kind, lang:getUserLanguage() }); } catch(_) {}
  navigate('scanner');
}

async function doScan(code) {
  if (!code?.trim()) { toast(t('toast_scan_enter'), 'error'); return; }
  if (window._scanLock) return; // prevent re-entry from scanner re-render
  window._scanLock = true;
  setTimeout(function() { window._scanLock = false; }, 3000);
  const clean = code.trim().replace(/\s/g, '');

  // Auto-detect country from barcode prefix
  let detectedCountry = '🌍';
  if (clean.startsWith('789')) detectedCountry = '🇧🇷';          // Brasil
  else if (clean.startsWith('46'))  detectedCountry = '🇷🇺';     // Rússia
  else if (clean.length === 12)     detectedCountry = '🇺🇸';     // UPC-A (EUA)
  else if (clean.startsWith('00') || clean.startsWith('01') ||
           clean.startsWith('03') || clean.startsWith('04')) detectedCountry = '🇺🇸'; // EAN-13 EUA
  else if (clean.startsWith('50'))  detectedCountry = '🇬🇧';     // UK
  else if (clean.startsWith('40') || clean.startsWith('41') ||
           clean.startsWith('42') || clean.startsWith('43')) detectedCountry = '🇩🇪'; // Alemanha
  else if (clean.startsWith('30') || clean.startsWith('37')) detectedCountry = '🇫🇷'; // França
  else if (clean.startsWith('80') || clean.startsWith('83')) detectedCountry = '🇮🇹'; // Itália
  else if (clean.startsWith('84'))  detectedCountry = '🇪🇸';     // Espanha
  else if (clean.startsWith('860')) detectedCountry = '🇷🇸';     // Sérvia
  else if (clean.startsWith('728')) detectedCountry = '🇮🇱';     // Israel
  else if (clean.startsWith('690') || clean.startsWith('691') ||
           clean.startsWith('692')) detectedCountry = '🇨🇳';     // China

  const found = PRODUCTS.find(p => p.code === clean);
  if (found) {
    SCAN.result = found; SCAN.barcode = clean;
    if (!SCAN.history.find(h => h.code === found.code)) SCAN.history.unshift(found);
    addXP(5); toast('✅ '+t('toast_scan_found')+' +5 XP', 'success', 2000); navigate('scanner'); return;
  }
  toast('🔍 ' + t('scanner_online_search'), 'info', 3000);
  try {
    const resp = await fetch('https://world.openfoodfacts.org/api/v0/product/' + clean + '.json');
    const data = await resp.json();
    if (data.status === 1 && data.product) {
      const pr = data.product, nu = pr.nutriments || {};
      let sem='🟡',score=5; const ns=pr.nutriscore_grade;
      if(ns==='a'||ns==='b'){sem='🟢';score=8}else if(ns==='d'||ns==='e'){sem='🔴';score=2}
      const alerts=[];
      if((nu.sugars_100g||0)>15)alerts.push('🔴 Alto açúcar: '+Math.round(nu.sugars_100g)+'g/100g');
      if((nu.sodium_100g||0)*1000>400)alerts.push('🔴 Alto sódio');
      if((nu.proteins_100g||0)>10)alerts.push('✅ Proteína: '+Math.round(nu.proteins_100g)+'g/100g');
      if(!alerts.length)alerts.push('ℹ️ Dados básicos');
      const product = {code:clean,name:pr.product_name||pr.product_name_en||'Produto '+clean,brand:pr.brands||'—',sem,score,
        cal100:Math.round(nu['energy-kcal_100g']||0),cal_serving:Math.round((nu['energy-kcal_100g']||0)*1.5),
        carb100:(nu.carbohydrates_100g||0).toFixed(0)+'g',prot100:(nu.proteins_100g||0).toFixed(0)+'g',
        fat100:(nu.fat_100g||0).toFixed(0)+'g',sodium100:Math.round((nu.sodium_100g||0)*1000)+'mg',
        serving:pr.serving_size||'100g',alerts,alt:pr.compared_to_category||'—',
        tags:(pr.categories_tags||[]).slice(0,3).map(t=>t.replace(/^\w+:/,'')),country:detectedCountry,source:'OpenFoodFacts',
        nutriments:nu,categories_tags:pr.categories_tags||[],product_name:pr.product_name||pr.product_name_en||'',generic_name:pr.generic_name||''};
      SCAN.result=product;SCAN.barcode=clean;
      if(!SCAN.history.find(h=>h.code===product.code))SCAN.history.unshift(product);
      addXP(5);toast('✅ '+t('toast_scan_found')+' (OpenFoodFacts) +5 XP','success',3000);navigate('scanner');return;
    }
  } catch(e) { console.warn('OFF fetch failed:', e); }
  toast('⚠️ ' + t('scanner_not_found'), 'info', 4000);
  showScannerSuggestion('barcode', clean);
}

/* ═══════════════════════════════════════
   COACH SCREEN
═══════════════════════════════════════ */




/* ═══════════════════════════════════════
   PROGRESS SCREEN
═══════════════════════════════════════ */

async function registerWeight() {
  const w = parseFloat(document.getElementById('weight-input').value);
  if(!w||w<20||w>300){toast(t('prog_invalid'),'error');return;}
  APP.weightHistory.push({date:new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),peso:w});
  // Sync to Supabase
  const user = await sbGetUser();
  if(user) {
    await sbAddPeso(user.id, w);
    await sbSavePerfil(user.id, { peso: w });
  }
  addXP(10);
  toast(t('prog_logged')+' +10 XP ✅','success'); navigate('progress');
}

/* ═══════════════════════════════════════
   ACHIEVEMENTS SCREEN
═══════════════════════════════════════ */
function renderAchievements() {
  const xpLevel = ['Iniciante','Consciente','Saudável','Fit','Elite'];
  const xp = APP.xp;
  const levelIdx = xp<100?0:xp<300?1:xp<600?2:xp<1000?3:4;
  const nextThreshold = [100,300,600,1000,9999][levelIdx];
  const pct = Math.min(Math.round((xp/nextThreshold)*100),100);
  const BADGES = [
    {icon:'🔥',name:'7 Dias',desc:'Sequência de 7 dias',unlocked:APP.streak>=7,xp:100},
    {icon:'💧',name:'Hidratado',desc:'5 dias com meta de água',unlocked:true,xp:50},
    {icon:'🥗',name:'Semana Verde',desc:'5 porções vegetais',unlocked:APP.streak>=3,xp:75},
    {icon:'⚖️',name:'1° Kg',desc:'Perdeu 1kg',unlocked:false,xp:150},
    {icon:'🚫',name:'Sem Refri',desc:'7 dias sem refrigerante',unlocked:false,xp:100},
    {icon:'🏆',name:'30 Dias',desc:'Sequência de 30 dias',unlocked:false,xp:500},
    {icon:'📸',name:'Fotógrafo',desc:'20 fotos de refeições',unlocked:true,xp:80},
    {icon:'🤖',name:'Coach Fã',desc:'50 mensagens para o coach',unlocked:false,xp:100},
    {icon:'🛒',name:'Planejador',desc:'Completou lista de compras',unlocked:APP.streak>=2,xp:60},
  ];
  const CHALLENGES = [
    {title:'Beba 2L por dia',desc:'7 dias consecutivos',progress:70,xp:200,days:'5/7 dias'},
    {title:'Registre 5 refeições',desc:'Esta semana',progress:60,xp:150,days:'3/5 dias'},
    {title:'Jejum 16h concluído',desc:'3 vezes esta semana',progress:33,xp:250,days:'1/3 vezes'},
  ];
  return `
  <div class="screen-header"><div class="screen-title">🏆 ${t('achievements')}</div></div>

  <!-- XP Header -->
  <div class="xp-header">
    <div style="text-align:center">
      <div style="font-size:13px;color:var(--text3);margin-bottom:2px">XP Total</div>
      <div class="xp-num">${xp}</div>
    </div>
    <div class="xp-bar-wrap">
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:6px"><span class="xp-level" style="color:var(--orange)">${xpLevel[levelIdx]}</span><span style="color:var(--text3)">${xp}/${nextThreshold} XP</span></div>
      <div style="height:8px;background:var(--surface3);border-radius:99px;overflow:hidden"><div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--yellow),var(--orange));border-radius:99px;transition:width .8s"></div></div>
      <div style="font-size:10px;color:var(--text3);margin-top:4px">Próximo nível: ${xpLevel[Math.min(levelIdx+1,4)]}</div>
    </div>
  </div>

  <!-- Streak -->
  <div style="padding:0 16px;margin-bottom:12px">
    <div style="background:linear-gradient(135deg,rgba(249,115,22,.2),rgba(251,191,36,.1));border:1px solid rgba(249,115,22,.3);border-radius:var(--radius);padding:14px 16px;display:flex;align-items:center;gap:14px">
      <div style="font-size:36px">🔥</div>
      <div style="flex:1"><div style="font-size:14px;font-weight:700;color:var(--orange)">${APP.streak} dias de sequência!</div><div style="font-size:11px;color:var(--text2);margin-top:2px">Próximo badge em ${Math.max(0,7-APP.streak)} dias</div></div>
      <div style="font-family:var(--font-serif);font-size:32px;font-weight:700;color:var(--orange)">${APP.streak}</div>
    </div>
  </div>

  <!-- Badges -->
  <div class="section-title">Badges conquistados</div>
  <div class="badge-grid" style="margin-bottom:16px">
    ${BADGES.map(b=>`<div class="badge-item ${b.unlocked?'unlocked':'locked'}" onclick="${b.unlocked?`toast('Badge ${b.name} conquistado! +${b.xp} XP ✅','success')`:`toast('Continue para desbloquear: ${b.desc}','info')`}">
      <div class="badge-icon" style="${!b.unlocked?'filter:grayscale(1)':''}">${b.icon}</div>
      <div class="badge-name">${b.name}</div>
      <div class="badge-desc">${b.unlocked?`+${b.xp} XP`:b.desc}</div>
      ${b.unlocked?'<div style="color:var(--yellow);font-size:10px;margin-top:4px">★ Conquistado</div>':''}
    </div>`).join('')}
  </div>

  <!-- Weekly challenges -->
  <div class="section-title">Desafios da semana</div>
  ${CHALLENGES.map(ch=>`<div class="challenge-card" onclick="toast('Desafio atualizado!','info')">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div class="challenge-title">${ch.title}</div>
      <span class="pill pill-yellow">+${ch.xp} XP</span>
    </div>
    <div class="challenge-meta"><span>${ch.desc}</span><span>${ch.days}</span></div>
    <div class="challenge-progress-bar"><div class="challenge-fill" style="width:${ch.progress}%"></div></div>
  </div>`).join('')}

  <!-- Ranking friends -->
  <div class="section-title">Ranking amigos</div>
  <div style="padding:0 16px;margin-bottom:16px">
    <div class="card">
      ${[['🥇','Membro VitalIA',1240,'var(--yellow)'],['🥈',APP.profile?.name||'Você',xp,'var(--text)'],['🥉','Atleta VitalIA',320,'var(--orange)']].map(([m,n,x,c])=>`<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)"><span style="font-size:20px">${m}</span><div style="flex:1;font-size:13px;font-weight:${n===APP.profile?.name||n==='Você'?700:400};color:${c}">${n}</div><span class="pill pill-yellow" style="font-size:10px">${x} XP</span></div>`).join('')}
    </div>
  </div>

  <!-- Referral -->
  <div style="padding:0 16px;margin-bottom:16px">
    <div class="card card-glow">
      <div style="font-size:13px;font-weight:700;margin-bottom:4px">🎁 Convide amigos para o VitalIA</div>
      <div style="font-size:11px;color:var(--text2);margin-bottom:10px">Compartilhe sua evolução e fortaleça sua comunidade de saúde.</div>
      <div style="background:var(--surface2);border-radius:8px;padding:10px;font-size:12px;font-weight:700;text-align:center;font-family:monospace;color:var(--green);letter-spacing:1px">vitalia.app/ref/${(APP.user?.name||'user').replace(' ','').toLowerCase()}</div>
      <button class="btn btn-primary btn-full" onclick="toast('Link copiado! Compartilhe com amigos 🎉','success')" style="margin-top:10px;padding:11px;font-size:13px">📋 Copiar link de convite</button>
    </div>
  </div>`;
}

/* ═══════════════════════════════════════
   SHOPPING SCREEN
═══════════════════════════════════════ */
function renderShoppingShell() {
  return '<div class="screen-header"><div class="screen-title">🛒 Lista de Compras</div></div><div id="main-content"></div>';
}

function renderShopping() {
  const allItems = SHOP_ITEMS.flatMap(cat=>cat.items.map(i=>({...i,cat:cat.cat})));
  const done = allItems.filter(i=>i.done).length;
  const total = allItems.length;
  const totalPrice = allItems.filter(i=>!i.done).reduce((s,i)=>{const p=parseFloat(i.price?.replace('R$ ','').replace(',','.'))||0;return s+p;},0);
  return `
  <div class="screen-header"><div class="screen-title">🛒 ${t('shopping')}</div></div>
  <div class="shop-header-card">
    <div><div style="font-size:13px;font-weight:700">${done}/${total} itens comprados</div><div style="font-size:11px;color:var(--text2);margin-top:2px">Restante: R$ ${totalPrice.toFixed(2).replace('.',',')}</div></div>
    <button class="btn btn-sm btn-outline" onclick="navigate('shopping')">↻ Atualizar</button>
  </div>

  <!-- AI suggestion -->
  <div style="padding:0 16px;margin-bottom:12px">
    <div class="card card-blue">
      <div style="font-size:12px;font-weight:700;color:var(--blue);margin-bottom:4px">🤖 Modo "Com o que tem em casa"</div>
      <div style="font-size:11px;color:var(--text2);margin-bottom:8px">Diga o que você tem e recebo sugestões de receitas!</div>
      <button class="btn btn-outline btn-full" onclick="openModal('Modo Criativo',\`<textarea class='input' rows='3' placeholder='Ex: frango, arroz, brócolis, ovos...' style='resize:none;width:100%;margin-bottom:12px'></textarea><button class='btn btn-primary btn-full' onclick='toast(\\\"Receitas sugeridas pela IA! 🍴\\\",\\\"success\\\");closeModal()'>Sugerir receitas</button>\`)" style="font-size:12px;padding:8px">🔍 Sugerir receitas com o que tenho</button>
    </div>
  </div>

  <!-- Items by category -->
  ${SHOP_ITEMS.map((cat,ci)=>`
  <div class="category-header"><span>${cat.cat}</span></div>
  ${cat.items.map((item,ii)=>`<div class="shop-item" onclick="SHOP_ITEMS[${ci}].items[${ii}].done=!SHOP_ITEMS[${ci}].items[${ii}].done;navigate('shopping')">
    <div class="shop-check ${item.done?'checked':''}">${item.done?'✓':''}</div>
    <div class="shop-name ${item.done?'checked':''}">${item.n}</div>
    <div class="shop-qty">${item.q}</div>
    <div class="shop-price">${item.price}</div>
  </div>`).join('')}`).join('')}

  <!-- Add item -->
  <div style="padding:16px;border-top:1px solid var(--border);margin-top:8px">
    <button class="btn btn-outline btn-full" onclick="openModal('Adicionar item',\`<div class='input-wrap'><label class='input-label'>Nome do item</label><input id='new-item-name' class='input' placeholder='Ex: Azeite de oliva'></div><div class='input-wrap'><label class='input-label'>Quantidade</label><input id='new-item-qty' class='input' placeholder='Ex: 500ml'></div><button class='btn btn-primary btn-full' onclick='addShopItem()'>Adicionar</button>\`)">+ Adicionar item</button>
  </div>`;
}

window.addShopItem = function() {
  const name=document.getElementById('new-item-name')?.value.trim(), qty=document.getElementById('new-item-qty')?.value.trim();
  if(!name){toast('Digite o nome do item','error');return;}
  SHOP_ITEMS[5] = SHOP_ITEMS[5]||{cat:'🧴 Outros',items:[]};
  SHOP_ITEMS[5].items.push({n:name,q:qty||'1 un.',price:'—',done:false});
  toast('Item adicionado!','success'); closeModal(); navigate('shopping');
};

/* ═══════════════════════════════════════
   SETTINGS SCREEN
═══════════════════════════════════════ */
function showAppInfoModal() {
  openModal('VitalIA', '<div class="settings-modal-copy"><b>VitalIA</b><br>v1.0.0<br><br><span>Saúde com Inteligência</span></div>');
}

function showReportProblemModal() {
  openModal(t('settings_report_problem'), '<div class="settings-modal-copy">'+t('settings_support_copy')+'</div>');
}

function renderSettings() {
  const p = APP.profile||{}, u = APP.user||{};
  return `
  <div class="settings-screen">
  <div class="screen-header"><div class="screen-title">${vitaliaIcon('settings')} ${t('settings')}</div></div>
  <!-- Profile hero -->
  <div class="profile-hero">
    <button class="profile-avatar-big settings-avatar-action" onclick="openAvatarSheet()" aria-label="${t('settings_update_photo')}">
      <span id="profileAvatarSettingsContent" class="settings-avatar-content">${getProfileAvatarHTML((p.name||u.name||u.email||'U').charAt(0)||'U')}</span>
      <span class="settings-avatar-edit">${vitaliaIcon('edit')}</span>
    </button>
    <button class="settings-avatar-copy" onclick="openAvatarSheet()">${t('settings_update_photo')}</button>
    <div class="profile-name">${p.name||u.name||t('settings_default_user')}</div>
    <div class="profile-email">${u.email||'user@vitalia.app'}</div>
    <div style="display:flex;gap:8px;justify-content:center;margin-top:8px;flex-wrap:wrap">
      <span class="pill pill-green">${vitaliaIcon('progress')} ${APP.streak} dias</span>
      <span class="pill pill-yellow">${vitaliaIcon('achievements')} ${APP.xp} XP</span>
      <span class="pill pill-blue">${vitaliaIcon('premium')} ${t('set_free')}</span>
      ${APP.telegram?.connected ? `<span class="tg-connected-badge" style="font-size:10px">${vitaliaIcon('telegram')} Telegram</span>` : ''}
    </div>
  </div>

  <!-- Premium -->
  <div class="settings-pad" style="margin-bottom:12px">
    <div class="premium-card">
      <div class="premium-title">${vitaliaIcon('premium')} ${t('set_premium_7d')}</div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:10px">${t('settings_premium_desc')}</div>
      <button class="btn btn-primary btn-full" onclick="showPremium()" style="padding:12px">${t('settings_view_subscription')}</button>
    </div>
  </div>

  <!-- Profile settings -->
  <div class="section-title">${t('set_profile')}</div>
  <div class="settings-group">
    <div class="settings-row" onclick="typeof editProfile==='function'?editProfile():openModal(t('set_edit_profile'),'<div style=padding:16px>'+t('settings_dev')+'</div>')"><div class="settings-icon">${vitaliaIcon('profile')}</div><div class="settings-text"><div class="settings-label">${t('set_edit_profile')}</div><div class="settings-sub">${t('set_edit_sub')}</div></div><div class="settings-arrow">›</div></div>
    <div class="settings-row" onclick="typeof editRestrictions==='function'?editRestrictions():openModal(t('set_restrictions'),'<div style=padding:16px>'+t('settings_dev')+'</div>')"><div class="settings-icon">${vitaliaIcon('nutrition')}</div><div class="settings-text"><div class="settings-label">${t('set_restrictions')}</div><div class="settings-sub">${t('set_restrictions_sub')}</div></div><div class="settings-arrow">›</div></div>
    <div class="settings-row" onclick="typeof editMealTimes==='function'?editMealTimes():openModal(t('set_meal_times'),'<div style=padding:16px>'+t('settings_dev')+'</div>')"><div class="settings-icon">${vitaliaIcon('fasting')}</div><div class="settings-text"><div class="settings-label">${t('set_meal_times')}</div><div class="settings-sub">${t('set_meal_times_sub')}</div></div><div class="settings-arrow">›</div></div>
  </div>

  <!-- Language -->
  <div class="section-title">${t('set_language')}</div>
  <div class="lang-options settings-pad" style="margin-bottom:12px;gap:8px;display:grid;grid-template-columns:1fr 1fr">
    ${t('languages').map(l=>`<div class="lang-option ${APP.lang===l.code?'active':''}" onclick="saveUserLanguage('${l.code}');renderNav();navigate('settings')"><span class="lang-flag">${l.flag}</span><span class="lang-name">${l.name}</span></div>`).join('')}
  </div>

  <!-- Appearance -->
  <div class="section-title">${t('set_appearance')}</div>
  <div class="settings-group">
    <div class="settings-row">
      <div class="settings-icon">${vitaliaIcon('settings')}</div>
      <div class="settings-text"><div class="settings-label">${t('dark_mode')}</div><div class="settings-sub">${t('set_theme')}: ${APP.darkMode?t('set_dark'):t('set_light')}</div></div>
      <label class="toggle"><input type="checkbox" ${APP.darkMode?'checked':''} onchange="APP.darkMode=this.checked;localStorage.setItem('v_dark',APP.darkMode);applyTheme();navigate('settings')"><div class="toggle-slider"></div></label>
    </div>
  </div>

  <!-- Telegram Integration -->
  <div class="section-title">Telegram</div>
  <div class="settings-pad" style="margin-bottom:10px">
    <div class="tg-card" onclick="navigate('telegram')" style="cursor:pointer">
      <div class="tg-card-header">
        <div class="tg-icon">${vitaliaIcon('telegram')}</div>
        <div style="flex:1">
          <div class="tg-title">Telegram</div>
          <div class="tg-sub">${APP.telegram?.connected ? '✅ '+t('set_connected_as')+' @'+(APP.telegram?.username||'usuario') : t('set_receive_notif')}</div>
        </div>
        ${APP.telegram?.connected ? `<span class="tg-connected-badge">✅ ${t('settings_active')}</span>` : `<span style="color:var(--text3);font-size:18px">›</span>`}
      </div>
      ${APP.telegram?.connected ? `
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <span class="pill" style="background:rgba(34,158,217,.1);color:#229ED9;border:1px solid rgba(34,158,217,.2);font-size:10px">${vitaliaIcon('telegram')} @${APP.telegram?.username}</span>
        ${APP.telegram?.notifs?.meals ? '<span class="pill pill-green" style="font-size:10px">'+vitaliaIcon('nutrition')+' '+t('settings_meals')+'</span>' : ''}
        ${APP.telegram?.notifs?.water ? '<span class="pill pill-blue" style="font-size:10px">'+vitaliaIcon('hydration')+' '+t('settings_water')+'</span>' : ''}
        ${APP.telegram?.notifs?.achievements ? '<span class="pill pill-yellow" style="font-size:10px">'+vitaliaIcon('achievements')+' '+t('settings_achievements')+'</span>' : ''}
      </div>` : `
      <button class="tg-login-btn" onclick="event.stopPropagation();navigate('telegram')" style="margin:0;font-size:13px;padding:10px">${vitaliaIcon('telegram')} ${t('settings_connect_telegram')}</button>`}
    </div>
  </div>

  <!-- Notifications -->
  <div class="section-title">${t('set_notif')}</div>
  <div class="settings-group">
    <div class="settings-row" onclick="typeof window['push']==='function'?window['push']():toast(t('set_soon'),'info',2000)"><div class="settings-icon">${vitaliaIcon('premium')}</div><div class="settings-text"><div class="settings-label">${t('settings_push')}</div><div class="settings-sub">${t('settings_push_sub')}</div></div><div class="settings-arrow">›</div></div>
    <div class="settings-row" onclick="navigate('telegram')"><div class="settings-icon">${vitaliaIcon('telegram')}</div><div class="settings-text"><div class="settings-label">Telegram</div><div class="settings-sub">${t('settings_telegram_sub')}</div></div><div class="settings-arrow">›</div></div>
    <div class="settings-row" onclick="toast(t('set_soon'),'info',2000)"><div class="settings-icon">${vitaliaIcon('community')}</div><div class="settings-text"><div class="settings-label">WhatsApp</div><div class="settings-sub">${t('settings_whatsapp_sub')}</div></div><div class="settings-arrow">›</div></div>
    <div class="settings-row" onclick="toast(t('set_soon'),'info',2000)"><div class="settings-icon">${vitaliaIcon('edit')}</div><div class="settings-text"><div class="settings-label">Email</div><div class="settings-sub">${t('settings_email_sub')}</div></div><div class="settings-arrow">›</div></div>
    
  </div>

  <!-- Security -->
  <div class="section-title">${t('set_security')}</div>
  <div class="settings-group">
    <div class="settings-row" onclick="typeof handleSecSetting==='function'?handleSecSetting('pinSetup'):toast(t('set_soon'),'info',2000)"><div class="settings-icon">${vitaliaIcon('settings')}</div><div class="settings-text"><div class="settings-label">${t('settings_pin')}</div><div class="settings-sub">${t('settings_pin_sub')}</div></div><div class="settings-arrow">›</div></div>
    <div class="settings-row" onclick="typeof handleSecSetting==='function'?handleSecSetting('accessHistory'):toast(t('set_soon'),'info',2000)"><div class="settings-icon">${vitaliaIcon('analytics')}</div><div class="settings-text"><div class="settings-label">${t('settings_history')}</div><div class="settings-sub">${t('settings_history_sub')}</div></div><div class="settings-arrow">›</div></div>
    
  </div>

  <!-- Data -->
  <div class="section-title">${t('set_data')}</div>
  <div class="settings-group">
    <div class="settings-row" onclick="exportFullHistory()"><div class="settings-icon">${vitaliaIcon('analytics')}</div><div class="settings-text"><div class="settings-label">${t('settings_export')}</div><div class="settings-sub">${t('settings_export_sub')}</div></div><div class="settings-arrow">›</div></div>
    <div class="settings-row" onclick="showPrivacyCenter()"><div class="settings-icon">${vitaliaIcon('settings')}</div><div class="settings-text"><div class="settings-label">${t('settings_privacy')}</div><div class="settings-sub">${t('settings_privacy_sub')}</div></div><div class="settings-arrow">›</div></div>
    <div class="settings-row" onclick="confirmDeleteLocalAccount()"><div class="settings-icon">${vitaliaIcon('scanner')}</div><div class="settings-text"><div class="settings-label">${t('set_delete')}</div><div class="settings-sub">${t('set_delete_sub')}</div></div><div class="settings-arrow">›</div></div>
    
  </div>


  <!-- Coach IA — Gemini API -->
  <div class="section-title">🤖 ${t('set_coach_ia')}</div>
  <div class="settings-group">
    <div class="settings-row" style="flex-direction:column;align-items:flex-start;gap:10px;padding:14px 16px">
      <div style="display:flex;align-items:center;gap:10px;width:100%">
        <div class="settings-icon">${vitaliaIcon('settings')}</div>
        <div class="settings-text" style="flex:1">
          <div class="settings-label">${t('settings_backend_title')}</div>
          <div class="settings-sub">${t('settings_backend_sub')}</div>
        </div>
        <div id="gemini-status" style="font-size:11px;font-weight:600"></div>
      </div>
      <div style="width:100%;display:flex;gap:8px">
        <input type="password" id="gemini-key-input"
          placeholder="${t('settings_backend_placeholder')}"
          value="${t('settings_backend_value')}"
          readonly
          style="flex:1;background:var(--surface2);border:1.5px solid var(--border);border-radius:10px;padding:10px 12px;font-size:14px;color:var(--text);font-family:var(--font-body);outline:none"
          oninput="document.getElementById('gemini-status').textContent=''"
        />
        <button onclick="saveGeminiKey()"
          style="background:linear-gradient(135deg,#22c55e,#16a34a);color:#000;border:none;border-radius:10px;padding:10px 16px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap">
          ${t('settings_save')}
        </button>
      </div>
      <div style="font-size:11px;color:var(--text3);line-height:1.5">
        ${t('settings_backend_desc')}
      </div>
    </div>
    <div class="settings-row" onclick="testGeminiKey()">
      <div class="settings-icon">${vitaliaIcon('analytics')}</div>
      <div class="settings-text"><div class="settings-label">${t('set_test_conn')}</div><div class="settings-sub">${t('set_test_sub')}</div></div>
      <div class="settings-arrow">›</div>
    </div>
  </div>

  <!-- App info -->
  <div class="section-title">${t('settings_about')}</div>
  <div class="settings-group">
    <div class="settings-row" onclick="showAppInfoModal()"><div class="settings-icon">${vitaliaIcon('premium')}</div><div class="settings-text"><div class="settings-label">VitalIA v1.0.0</div><div class="settings-sub">${t('settings_app_version')}</div></div><div class="settings-arrow">›</div></div>
    <div class="settings-row" onclick="toast(t('settings_rate_toast'),'success',3000)"><div class="settings-icon">${vitaliaIcon('achievements')}</div><div class="settings-text"><div class="settings-label">${t('settings_rate_app')}</div><div class="settings-sub">${t('settings_rate_sub')}</div></div><div class="settings-arrow">›</div></div>
    <div class="settings-row" onclick="showReportProblemModal()"><div class="settings-icon">${vitaliaIcon('scanner')}</div><div class="settings-text"><div class="settings-label">${t('settings_report_problem')}</div><div class="settings-sub">${t('settings_report_sub')}</div></div><div class="settings-arrow">›</div></div>
    
  </div>

  <!-- Logout -->
  <div style="padding:16px;margin-top:8px">
    <button class="btn btn-danger btn-full" onclick="doLogout()" style="padding:14px">${vitaliaIcon('settings')} ${t('logout')}</button>
  </div>
  <div style="height:8px"></div></div>`;
}

function initProfileAvatar() {
  updateProfileAvatarElements();
}

function getProfileAvatarState() {
  try {
    var photo = localStorage.getItem(userScopedKey('vitalia_profile_photo'));
    var type = localStorage.getItem(userScopedKey('vitalia_profile_avatar_type'));
    var emoji = localStorage.getItem(userScopedKey('vitalia_profile_emoji'));
    return { photo: photo || '', type: type || '', emoji: emoji || '' };
  } catch(e) {
    return { photo:'', type:'', emoji:'' };
  }
}

function getProfileAvatarHTML(fallback) {
  var st = getProfileAvatarState();
  var safeFallback = escapeHTML(String(fallback || APP.profile?.name?.charAt(0) || APP.user?.name?.charAt(0) || 'U')).slice(0,1);
  if (st.photo) return `<img class="profile-avatar-img" src="${escapeAttr(st.photo)}" alt="Foto de perfil">`;
  if (st.type === 'emoji' && st.emoji) return `<span class="profile-emoji-avatar">${escapeHTML(st.emoji)}</span>`;
  return safeFallback.toUpperCase();
}

function updateProfileAvatarElements() {
  var fallback = APP.profile?.name?.charAt(0)||APP.user?.name?.charAt(0)||'U';
  var html = getProfileAvatarHTML(fallback);
  ['profileAvatarHome','profileAvatarPreview','profileAvatarSettingsContent'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });
}

async function handleProfileImage(file) {
  if (!file) return;
  if (!file.type || file.type.indexOf('image/') !== 0) {
    toast('Escolha um arquivo de imagem válido.', 'error');
    return;
  }
  try {
    var base64 = await resizeImageToBase64(file, 512, 0.82);
    setProfilePhoto(base64);
  } catch(e) {
    console.warn('[VitalIA] Erro ao processar foto:', e);
    toast('Não foi possível atualizar a foto.', 'error');
  }
}

function resizeImageToBase64(file, maxSize, quality) {
  maxSize = maxSize || 512;
  quality = quality || 0.82;
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onerror = reject;
    reader.onload = function(ev) {
      var img = new Image();
      img.onerror = reject;
      img.onload = function() {
        var scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        var w = Math.max(1, Math.round(img.width * scale));
        var h = Math.max(1, Math.round(img.height * scale));
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function setProfilePhoto(base64) {
  try {
    localStorage.setItem(userScopedKey('vitalia_profile_photo'), base64);
    localStorage.setItem(userScopedKey('vitalia_profile_avatar_type'), 'photo');
    localStorage.removeItem(userScopedKey('vitalia_profile_emoji'));
  } catch(e) {
    toast('A foto ficou pesada para salvar neste navegador.', 'error');
    return;
  }
  updateProfileAvatarElements();
  toast('Foto atualizada com sucesso.', 'success');
}

function setProfileEmoji(emoji) {
  try {
    localStorage.removeItem(userScopedKey('vitalia_profile_photo'));
    localStorage.setItem(userScopedKey('vitalia_profile_avatar_type'), 'emoji');
    localStorage.setItem(userScopedKey('vitalia_profile_emoji'), emoji);
  } catch(e) {}
  updateProfileAvatarElements();
  toast('Avatar atualizado com sucesso.', 'success');
  openAvatarSheet();
}

function removeProfilePhoto() {
  try {
    localStorage.removeItem(userScopedKey('vitalia_profile_photo'));
    localStorage.removeItem(userScopedKey('vitalia_profile_avatar_type'));
    localStorage.removeItem(userScopedKey('vitalia_profile_emoji'));
  } catch(e) {}
  updateProfileAvatarElements();
  toast('Foto removida.', 'success');
  openAvatarSheet();
}

function openEmojiPicker() {
  var emojis = ['👤','🥦','🥗','💪','🔥','⚡','🧠','🏆'];
  openModal('Escolher avatar', `
    <div style="font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:14px;text-align:center">Escolha um avatar para aparecer na Home e no seu perfil.</div>
    <div class="emoji-picker-grid">
      ${emojis.map(function(e){ return `<button class="emoji-avatar-btn tap-effect" onclick="setProfileEmoji('${e}')">${e}</button>`; }).join('')}
    </div>
    <button class="btn btn-outline btn-full" onclick="openAvatarSheet()" style="margin-top:14px;padding:12px">Voltar</button>
  `);
}

function openAvatarSheet() {
  const fallback = APP.profile?.name?.charAt(0)||APP.user?.name?.charAt(0)||'U';
  openModal('Foto de Perfil', `
    <div style="text-align:center;padding:8px 0 16px">
      <div id="profileAvatarPreview" style="width:80px;height:80px;border-radius:50%;background:var(--gradient);display:flex;align-items:center;justify-content:center;font-size:36px;margin:0 auto 16px;border:3px solid rgba(34,197,94,.3);overflow:hidden">${getProfileAvatarHTML(fallback)}</div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:16px">Escolha como atualizar sua foto</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <input id="inputTakePhoto" type="file" accept="image/*" capture="user" style="display:none" onchange="handleProfileImage(this.files&&this.files[0])">
      <input id="inputChooseGallery" type="file" accept="image/*" style="display:none" onchange="handleProfileImage(this.files&&this.files[0])">
      <button id="btnTakePhoto" class="btn btn-outline btn-full" onclick="document.getElementById('inputTakePhoto').click()" style="padding:13px;display:flex;align-items:center;gap:10px;justify-content:center">📷 Tirar foto</button>
      <button id="btnChooseGallery" class="btn btn-outline btn-full" onclick="document.getElementById('inputChooseGallery').click()" style="padding:13px;display:flex;align-items:center;gap:10px;justify-content:center">🖼️ Escolher da galeria</button>
      <button id="btnChooseEmoji" class="btn btn-outline btn-full" onclick="openEmojiPicker()" style="padding:13px;display:flex;align-items:center;gap:10px;justify-content:center">😊 Escolher emoji / avatar</button>
      <button id="btnRemovePhoto" class="btn btn-ghost btn-full" onclick="removeProfilePhoto()" style="color:var(--red);padding:11px">🗑️ Remover foto</button>
    </div>
  `);
}

function editProfile() {
  const p = APP.profile||{};
  openModal('Editar Perfil', `
    <div class='input-wrap'><label class='input-label'>Nome</label><input id='ep-name' class='input' value='${p.name||''}' placeholder='Seu nome completo'></div>
    <div style='display:grid;grid-template-columns:1fr 1fr;gap:10px'>
      <div class='input-wrap'><label class='input-label'>Peso (kg)</label><input id='ep-weight' class='input' type='number' value='${p.weight||78}'></div>
      <div class='input-wrap'><label class='input-label'>Altura (cm)</label><input id='ep-height' class='input' type='number' value='${p.height||175}'></div>
    </div>
    <div style='display:grid;grid-template-columns:1fr 1fr;gap:10px'>
      <div class='input-wrap'><label class='input-label'>Idade</label><input id='ep-age' class='input' type='number' value='${p.age||30}'></div>
      <div class='input-wrap'><label class='input-label'>Sexo</label><select id='ep-gender' class='input'><option value='m' ${p.gender==='m'?'selected':''}>Masculino</option><option value='f' ${p.gender==='f'?'selected':''}>Feminino</option></select></div>
    </div>
    <div class='input-wrap'><label class='input-label'>Objetivo</label><select id='ep-goal' class='input'><option value='lose' ${p.goal==='lose'?'selected':''}>Perder peso</option><option value='maintain' ${p.goal==='maintain'?'selected':''}>Manter peso</option><option value='gain' ${p.goal==='gain'?'selected':''}>Ganhar massa</option><option value='health' ${p.goal==='health'?'selected':''}>Saúde geral</option></select></div>
    <div class='input-wrap'><label class='input-label'>Nível de atividade</label><select id='ep-activity' class='input'><option value='sed' ${p.activity==='sed'?'selected':''}>Sedentário</option><option value='light' ${p.activity==='light'?'selected':''}>Levemente ativo</option><option value='mod' ${p.activity==='mod'?'selected':''}>Moderadamente ativo</option><option value='active' ${p.activity==='active'?'selected':''}>Muito ativo</option></select></div>
    <button class='btn btn-primary btn-full' onclick='saveEditProfile()' style='padding:13px;margin-top:4px'>💾 Salvar alterações</button>
  `);
}

window.saveEditProfile = function() {
  const name = sanitizeDbString(document.getElementById('ep-name')?.value.trim(), 120);
  const weight = parseFloat(document.getElementById('ep-weight')?.value);
  const height = parseFloat(document.getElementById('ep-height')?.value);
  const age = parseInt(document.getElementById('ep-age')?.value);
  const gender = document.getElementById('ep-gender')?.value;
  const goal = document.getElementById('ep-goal')?.value;
  const activity = document.getElementById('ep-activity')?.value;
  if(!name){toast(t('toast_name_req'),'error');return;}
  if(!weight||weight<20||weight>300){toast(t('toast_weight_inv'),'error');return;}
  if(!height||height<100||height>250){toast(t('toast_height_inv'),'error');return;}
  APP.profile = {...(APP.profile||{}), name, weight, height, age:age||30, gender:gender||'m', goal:goal||'lose', activity:activity||'mod'};
  APP.user = {...(APP.user||{}), name};
  APP.calc = calcProfile(APP.profile);
  sbGetUser().then(u => { if(u) sbSavePerfil(u.id, { nome: name, peso: weight, altura: height, idade: age||30, genero: gender||'m', objetivo: goal||'lose', atividade: activity||'mod', email: APP.user?.email }); }).catch(e => toastFriendlyError('profile', e));
  closeModal(); toast('✅ '+t('toast_profile_ok'), 'success'); navigate('settings');
};

function editRestrictions() {
  const p = APP.profile||{};
  const restrictions = p.restrictions||[];
  const opts = [
    {v:'vegetarian',l:'🥗 Vegetariano'},
    {v:'vegan',l:'🌱 Vegano'},
    {v:'gluten-free',l:'🌾 Sem glúten'},
    {v:'lactose-free',l:'🥛 Sem lactose'},
    {v:'no-pork',l:'🐷 Sem porco'},
    {v:'halal',l:'☪️ Halal'},
    {v:'kosher',l:'✡️ Kosher'},
    {v:'diabetic',l:'💉 Diabético'},
    {v:'low-sodium',l:'🧂 Baixo sódio'},
    {v:'nut-free',l:'🥜 Sem amendoim/nozes'},
  ];
  openModal('Restrições Alimentares', `
    <div style='font-size:12px;color:var(--text2);margin-bottom:12px'>Selecione suas restrições e preferências alimentares:</div>
    <div style='display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px'>
      ${opts.map(o=>`<label style='display:flex;align-items:center;gap:8px;padding:10px;border-radius:10px;border:1px solid ${restrictions.includes(o.v)?'var(--green)':'var(--border)'};background:${restrictions.includes(o.v)?'rgba(34,197,94,.06)':'var(--surface2)'};cursor:pointer'><input type='checkbox' id='restr-${o.v}' ${restrictions.includes(o.v)?'checked':''} style='accent-color:var(--green)'> <span style='font-size:13px'>${o.l}</span></label>`).join('')}
    </div>
    <button class='btn btn-primary btn-full' onclick='saveRestrictions()' style='padding:13px'>💾 Salvar</button>
  `);
}

window.saveRestrictions = function() {
  const opts = ['vegetarian','vegan','gluten-free','lactose-free','no-pork','halal','kosher','diabetic','low-sodium','nut-free'];
  const selected = opts.filter(v => document.getElementById('restr-'+v)?.checked);
  APP.profile = {...(APP.profile||{}), restrictions: selected};
  sbGetUser().then(u => { if(u) sbSavePerfil(u.id, { restricoes: selected }); }).catch(e => toastFriendlyError('restrictions', e));
  closeModal(); toast(`✅ ${selected.length} restrição(ões) salva(s)!`, 'success'); navigate('settings');
};

function editMealTimes() {
  openModal('Horários das Refeições', `
    <div style='font-size:12px;color:var(--text2);margin-bottom:12px'>Configure os horários para lembretes de cada refeição:</div>
    ${[['☀️','Café da manhã','07:00'],['🍎','Lanche da manhã','10:00'],['☀️','Almoço','12:30'],['🍎','Lanche da tarde','15:30'],['🌙','Jantar','19:00'],['🌙','Ceia','21:00']].map(([e,l,def])=>`<div class='input-wrap'><label class='input-label'>${e} ${l}</label><input type='time' class='input' value='${def}' id='meal-time-${l.replace(/ /g,'-')}'></div>`).join('')}
    <div style='display:flex;align-items:center;gap:10px;margin:8px 0 16px'><label class='toggle'><input type='checkbox' checked onchange="toast(this.checked?'Lembretes ativados':'Lembretes desativados','info')"><div class='toggle-slider'></div></label><span style='font-size:13px'>Ativar lembretes</span></div>
    <button class='btn btn-primary btn-full' onclick="toast('✅ '+t('toast_times_ok'),'success');closeModal()" style='padding:13px'>💾 Salvar horários</button>
  `);
}

function handleSecSetting(fn) {
  if(fn==='bioToggle'){
    if(!APP.user?.id){
      toast('Acesse sua conta para configurar a biometria com segurança.', 'info');
      return;
    }
    activateBiometric();
  } else if(fn==='pinSetup'){
    APP.authStep='pin'; APP.pinInput='';
    openModal('Configurar PIN','<div style="text-align:center;padding:20px;color:var(--text2)">Configure seu PIN de 4 dígitos na próxima tela.</div><button class="btn btn-primary btn-full" onclick="closeModal();APP.authStep=\'pin\';renderAuth()">Configurar PIN</button>');
  } else {
    openModal('Histórico de acessos',`<div style="font-size:13px;color:var(--text2)">${[['Hoje','18:42','iPhone 15','✅'],['Ontem','09:15','Chrome/Mac','✅'],['3 dias atrás','22:07','Samsung S24','✅']].map(([d,h,dev,s])=>`<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><div><div style="font-weight:600">${dev}</div><div style="font-size:11px;color:var(--text3)">${d} às ${h}</div></div><span>${s}</span></div>`).join('')}</div><button class="btn btn-danger btn-full" onclick="toast(t('toast_sessions'),'success');closeModal()" style="margin-top:12px">Sair de todos os dispositivos</button>`);
  }
}


async function forgotPassword() {
  var email = document.getElementById('a-email');
  if (!email || !email.value.trim()) { toast('Digite seu email primeiro','error'); return; }
  try { await sb.auth.resetPasswordForEmail(email.value.trim()); toast('📧 Email enviado!','success',4000); } catch(e) { toast(t('set_soon'),'info'); }
}
function saveGeminiKey() {
  localStorage.removeItem('v_gemini_key');
  toast('Chave protegida no backend Supabase.', 'success');
}
async function testGeminiKey() {
  toast('Testando Coach IA Backend...','info',2000);
  try {
    var session = null;
    try { session = (await sb.auth.getSession())?.data?.session || null; } catch(_) {}
    if (!session?.access_token) { toast('Entre na conta para testar o backend.', 'info'); return; }
    var resp = await fetch(COACH_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json', 'Authorization':'Bearer ' + session.access_token},
      body: JSON.stringify({mensagem:'Responda apenas OK: backend VitalIA online.', lang:APP.lang||'pt', calc:APP.calc||{}})
    });
    toast(resp.ok ? 'Backend do Coach respondendo!' : 'Backend retornou: '+resp.status, resp.ok ? 'success' : 'error');
  } catch(e) { toast('Sem conexão com o backend do Coach','error'); }
}

function doLogout() {
  openModal(t('set_logout_title'),`<div style="font-size:13px;color:var(--text2);margin-bottom:16px">${t('set_logout_msg')}</div><div style="display:flex;gap:8px"><button class="btn btn-danger" style="flex:1" onclick="confirmLogout()">${t('set_logout_btn')}</button><button class="btn btn-outline" style="flex:1" onclick="closeModal()">Cancelar</button></div>`);
}

async function confirmLogout() {
  await sbSignOut();
  localStorage.removeItem('v_session');
  localStorage.removeItem('v_user');
  APP.session=null; APP.user=null; resetSessionVisualState();
  closeModal(); document.getElementById('app').style.display='none';
  APP.authStep='login'; startAuth();
}

function showPrivacyCenter() {
  openModal('Privacidade e Dados', `
    <div style="font-size:13px;color:var(--text2);line-height:1.7">
      <div style="font-weight:700;color:var(--text);font-size:15px;margin-bottom:8px">Centro de Privacidade LGPD/GDPR</div>
      <p>O VitalIA salva localmente perfil, refeições, hidratação, progresso e preferências para manter o uso rápido e offline.</p>
      <p style="margin-top:8px">Recursos online podem sincronizar dados mínimos com Supabase. IA e integrações externas devem migrar para backend seguro antes do lançamento público.</p>
      <div style="margin-top:12px;padding:10px 12px;background:rgba(34,197,94,.06);border-left:3px solid var(--green);border-radius:8px">Segurança local reforçada, exportação disponível e exclusão local imediata.</div>
      <div style="display:flex;gap:8px;margin-top:14px">
        <button class="btn btn-outline" style="flex:1" onclick="exportFullHistory()">Exportar dados</button>
        <button class="btn btn-danger" style="flex:1" onclick="confirmDeleteLocalAccount()">Excluir dados</button>
      </div>
    </div>
  `);
}

function confirmDeleteLocalAccount() {
  openModal('Excluir dados locais', `
    <div style="font-size:13px;color:var(--text2);line-height:1.7">
      <b style="color:var(--red)">Esta ação limpa todos os dados salvos neste navegador.</b>
      <div style="margin-top:10px">Perfil, refeições, hidratação, progresso, sessão, preferências e chaves locais serão removidos. Se houver sessão Supabase ativa, os dados públicos sincronizados também serão apagados do backend.</div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-danger" style="flex:1" onclick="deleteLocalAccountData()">Confirmar exclusão</button>
        <button class="btn btn-outline" style="flex:1" onclick="closeModal()">Cancelar</button>
      </div>
    </div>
  `);
}

async function deleteLocalAccountData() {
  try {
    var session = (await sb.auth.getSession())?.data?.session || null;
    if (session?.access_token && typeof sb.rpc === 'function') await sb.rpc('delete_account_local_data');
  } catch(e) { console.warn('[VitalIA] Exclusão backend indisponível:', e); }
  try { await sbSignOut(); } catch(e) {}
  try { localStorage.clear(); sessionStorage.clear(); } catch(e) {}
  APP.session=null; APP.user=null; APP.profile=null; APP.meals=[]; APP.water=0; APP.xp=0; APP.streak=0; APP.coachMsgs=[];
  closeModal();
  toast('Dados locais excluídos com segurança.', 'success', 3000);
  document.getElementById('app').style.display='none';
  APP.authStep='login';
  startAuth();
}

// eslint-disable-next-line no-func-assign -- pré-existente no index.html; corrigir na V231
showPrivacyCenter = function() {
  var analyticsConsent = !!(window.VitalIAConsent && window.VitalIAConsent.hasAnalyticsConsent());
  openModal('Privacidade e Dados', `
    <div style="font-size:13px;color:var(--text2);line-height:1.7">
      <div style="font-weight:700;color:var(--text);font-size:15px;margin-bottom:8px">Centro de Privacidade LGPD/GDPR</div>
      <p><b style="color:var(--text)">Política de Privacidade.</b> O VitalIA trata dados de conta, perfil físico, nutrição, hidratação, peso, humor, progresso e mensagens do Coach para personalizar sua experiência. Dados de saúde são sensíveis e exigem consentimento claro.</p>
      <p style="margin-top:8px"><b style="color:var(--text)">Termos de Uso.</b> O VitalIA é uma ferramenta de apoio a hábitos saudáveis e educação nutricional. Ele não substitui médico, nutricionista, psicólogo ou atendimento de emergência.</p>
      <p style="margin-top:8px"><b style="color:var(--text)">Base operacional.</b> Após login, o histórico principal é sincronizado com Supabase Auth/Database. O navegador mantém apenas preferências técnicas como idioma, tema e biometria local.</p>
      <p style="margin-top:8px"><b style="color:var(--text)">IA.</b> O Coach usa backend protegido; recomendações são educativas e devem ser validadas por profissional quando houver doença, gestação, medicação ou restrição clínica.</p>
      <div style="margin-top:12px;padding:10px 12px;background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.18);border-radius:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:6px">
          <b style="color:var(--text)">${t('analytics_consent_title')}</b>
          <span id="analytics-consent-status" class="pill ${analyticsConsent ? 'pill-green' : ''}" style="font-size:10px">${analyticsConsent ? t('analytics_consent_on') : t('analytics_consent_off')}</span>
        </div>
        <div style="font-size:12px;color:var(--text2);line-height:1.6">${t('analytics_consent_body')}</div>
        <button id="analytics-consent-toggle" class="btn ${analyticsConsent ? 'btn-outline' : 'btn-primary'} btn-full" style="margin-top:10px" onclick="window.VitalIAConsent&&window.VitalIAConsent.setConsent({analytics:${analyticsConsent ? 'false' : 'true'}});showPrivacyCenter();toast(t('${analyticsConsent ? 'analytics_consent_disabled' : 'analytics_consent_enabled'}'),'success',1800)">${analyticsConsent ? t('analytics_consent_disable') : t('analytics_consent_allow')}</button>
      </div>
      <div style="margin-top:12px;padding:10px 12px;background:rgba(34,197,94,.06);border-left:3px solid var(--green);border-radius:8px">Versões: Termos ${CONFIG.TERMS_VERSION} · Privacidade ${CONFIG.PRIVACY_VERSION}. Consentimentos são registrados com data e idioma.</div>
      <div style="display:flex;gap:8px;margin-top:14px">
        <button class="btn btn-outline" style="flex:1" onclick="exportFullHistory()">Exportar dados</button>
        <button class="btn btn-danger" style="flex:1" onclick="confirmDeleteLocalAccount()">Excluir dados</button>
      </div>
    </div>
  `);
};

// eslint-disable-next-line no-func-assign -- pré-existente no index.html; corrigir na V231
confirmDeleteLocalAccount = function() {
  openModal('Excluir conta e dados', `
    <div style="font-size:13px;color:var(--text2);line-height:1.7">
      <b style="color:var(--red)">Esta ação remove permanentemente seus dados no backend e encerra sua sessão.</b>
      <div style="margin-top:10px">Serão apagados perfil, refeições, hidratação, peso, humor, progresso, memórias do Coach, mensagens do Coach, logs vinculados e consentimentos. Preferências locais também serão limpas deste navegador.</div>
      <div style="margin-top:10px;padding:10px 12px;background:rgba(248,113,113,.08);border-left:3px solid var(--red);border-radius:8px">A exclusão é irreversível. Exporte seus dados antes se quiser manter uma cópia.</div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-danger" style="flex:1" onclick="deleteLocalAccountData()">Confirmar exclusão</button>
        <button class="btn btn-outline" style="flex:1" onclick="closeModal()">Cancelar</button>
      </div>
    </div>
  `);
};

// eslint-disable-next-line no-func-assign -- pré-existente no index.html; corrigir na V231
deleteLocalAccountData = async function() {
  try {
    var session = (await sb.auth.getSession())?.data?.session || null;
    if (!session?.access_token) throw new Error('not_authenticated');
    var res = await sb.rpc('delete_account_and_data');
    if (res?.error) {
      res = await sb.rpc('delete_account_local_data');
      if (res?.error) throw res.error;
    }
  } catch(e) {
    console.warn('[VitalIA] Exclusão backend indisponível:', e);
    toastFriendlyError('delete-account', e);
    return;
  }
  try { await sbSignOut(); } catch(e) {}
  try { localStorage.clear(); sessionStorage.clear(); } catch(e) {}
  APP.session=null; APP.user=null; APP.profile=null; APP.meals=[]; APP.water=0; APP.xp=0; APP.streak=0; APP.coachMsgs=[];
  closeModal();
  toast('Conta e dados excluídos com segurança.', 'success', 3000);
  document.getElementById('app').style.display='none';
  APP.authStep='login';
  startAuth();
};

function showPremium() {
  const premiumFeatures = {
    pt:['Análise por foto disponível','Coach IA com memória do perfil','Biblioteca inteligente de receitas','Plano alimentar personalizado','Relatórios de evolução','Alertas e lembretes inteligentes','Experiência premium ativa'],
    en:['Photo analysis available','Coach AI with profile memory','Smart recipe library','Personalized meal plan','Progress reports','Smart alerts and reminders','Premium experience active'],
    es:['Análisis por foto disponible','Coach IA con memoria del perfil','Biblioteca inteligente de recetas','Plan alimentario personalizado','Informes de evolución','Alertas y recordatorios inteligentes','Experiencia premium activa'],
    ru:['Анализ фото доступен','Coach AI с памятью профиля','Умная библиотека рецептов','Персональный план питания','Отчёты о прогрессе','Умные напоминания','Премиум-опыт активен']
  }[APP.lang] || [];
  openModal(t('more_subscription'), `
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:48px;margin-bottom:8px">${vitaliaIcon('premium')}</div>
      <div style="font-family:var(--font-serif);font-size:20px;font-weight:700;margin-bottom:4px">${t('more_subscription_d')}</div>
      <div style="font-size:12px;color:var(--text2)">${t('more_active_plan_desc')}</div>
    </div>
    <div style="margin-bottom:16px">
      ${premiumFeatures.map(f=>`<div class="paywall-feature"><span style="font-size:16px">✓</span><span>${f}</span></div>`).join('')}
    </div>
    <button class="btn btn-primary btn-full" onclick="toast(t('toast_trial'),'success');closeModal()" style="padding:15px;font-size:15px;margin-bottom:8px">${t('more_active_plan')}</button>
    <button class="btn btn-ghost btn-full" onclick="closeModal()" style="font-size:12px;color:var(--text3)">${t('cancel')}</button>
  `);
}

/* ═══════════════════════════════════════
   NOTIFICATIONS
═══════════════════════════════════════ */
async function requestVitalIANotifications(force) {
  if (!('Notification' in window)) {
    if (force) toast('Seu navegador não suporta notificações.', 'info');
    return false;
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') {
    if (force) toast('Notificações bloqueadas no navegador. Libere nas permissões do site.', 'info', 5000);
    return false;
  }
  if (!force) return false;
  const perm = await Notification.requestPermission();
  const ok = perm === 'granted';
  toast(ok ? 'Alertas VitalIA ativados.' : 'Alertas não ativados.', ok ? 'success' : 'info');
  return ok;
}

function notifyVitalIA(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification(title, { body, icon:'./icon.svg', badge:'./icon.svg', tag:'vitalia-' + title }); } catch(_) {}
  }
  toast(title + ' · ' + body, 'info', 4500);
}

function scheduleNotifications() {
  if (window._vitaliaNotifsScheduled) return;
  window._vitaliaNotifsScheduled = true;
  requestVitalIANotifications(false);
  const hyd = smartHydrationTarget();
  const checks = [
    {delay:9000, run:function(){ if (APP.water < Math.ceil(hyd.cups * .35)) notifyVitalIA('VitalIA Hidratação', 'Comece com 1 copo agora para não deixar a meta acumular.'); }},
    {delay:18000, run:function(){ if ((APP.meals||[]).length < 2) notifyVitalIA('VitalIA Nutrição', 'Registre sua próxima refeição para eu ajustar calorias e proteína.'); }},
    {delay:30000, run:function(){ if (APP.tab !== 'coach') notifyVitalIA('Coach IA Mentor', 'Seu plano está pronto para ajustes finos de hoje.'); }}
  ];
  checks.forEach(n => setTimeout(n.run, n.delay));
}

function scheduleFastingAlerts(proto) {
  if (!proto || !FAST.active) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  clearTimeout(window._fastHalfTimer);
  clearTimeout(window._fastFinalTimer);
  const fastMs = Math.max(1, proto.fast || 16) * 3600000;
  window._fastHalfTimer = setTimeout(() => notifyVitalIA('Jejum VitalIA', 'Você chegou na metade do protocolo. Água e calma agora.'), Math.min(fastMs / 2, 6 * 3600000));
  window._fastFinalTimer = setTimeout(() => notifyVitalIA('Jejum VitalIA', 'Falta 1 hora. Prepare uma quebra leve e rica em proteína.'), Math.max(60000, Math.min(fastMs - 3600000, 8 * 3600000)));
}

/* ═══════════════════════════════════════
   ANALYTICS / REPORTS SCREEN
═══════════════════════════════════════ */
function renderAnalytics() {
  normalizeMeals();
  const c = APP.calc||{meta:1800,aguaCopos:8};
  const dailyScores = [62,75,48,83,91,70,calcDailyScore()];
  const weekDays = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  const avgScore = Math.round(dailyScores.reduce((a,b)=>a+b,0)/dailyScores.length);
  const calHistory = [1650,1820,1430,1900,1780,1620,sumKcal(APP.meals)||1750];
  const avgCal = Math.round(calHistory.reduce((a,b)=>a+b,0)/calHistory.length);
  const today = new Date();
  const isMonday = today.getDay()===1;
  return `
  <div class="screen-header">
    <div class="screen-title">📈 Analytics</div>
    <span class="pill pill-blue" style="font-size:10px">Score hoje: ${calcDailyScore()}</span>
  </div>
  <div class="section-title">Relatório de Hoje</div>
  <div style="padding:0 16px;margin-bottom:12px">
    <div class="card card-glow">
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
        ${[['🔥','Score',calcDailyScore()+'/100','var(--green)'],['🍽️','Calorias',sumKcal(APP.meals)+'/'+(c.meta||1800)+' kcal','var(--orange)'],['💧','Água',APP.water+'/'+(c.aguaCopos||8)+' copos','var(--blue)'],['😊','Humor',APP.mood||'—','var(--purple)'],['🍴','Refeições',APP.meals.length+'/5','var(--yellow)'],['🔥','Streak',APP.streak+' dias','var(--orange)']].map(([e,l,v,col])=>`<div style="background:var(--surface2);border-radius:10px;padding:10px;display:flex;align-items:center;gap:8px"><span style="font-size:20px">${e}</span><div><div style="font-size:10px;color:var(--text3)">${l}</div><div style="font-size:13px;font-weight:700;color:${col}">${v}</div></div></div>`).join('')}
      </div>
      <div style="margin-top:10px;padding:10px;background:rgba(34,197,94,.06);border-radius:8px;border-left:3px solid var(--green)">
        <div style="font-size:11px;font-weight:700;color:var(--green);margin-bottom:3px">✨ Destaque positivo</div>
        <div style="font-size:12px;color:var(--text2)">${APP.water>=(c.aguaCopos||8)*.8?'Hidratação excelente hoje!':APP.streak>=7?'Sequência de '+APP.streak+' dias mantida!':''+APP.meals.length+' refeições registradas hoje.'}</div>
      </div>
    </div>
  </div>
  <div class="section-title">Score — 7 dias</div>
  <div style="padding:0 16px;margin-bottom:16px">
    <div class="card">
      <div style="display:flex;align-items:flex-end;gap:4px;height:72px;margin-bottom:6px">
        ${dailyScores.map((s,i)=>{const col=s>=70?'var(--green)':s>=40?'var(--orange)':'var(--red)';const isToday=i===6;return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px"><div style="font-size:8px;color:var(--text3)">${s}</div><div style="width:100%;height:${s}%;min-height:4px;background:${isToday?col:col+'55'};border-radius:3px 3px 0 0;${isToday?'box-shadow:0 0 6px '+col:''}"></div></div>`;}).join('')}
      </div>
      <div style="display:flex;gap:4px">${weekDays.map((d,i)=>`<div style="flex:1;text-align:center;font-size:9px;color:${i===6?'var(--green)':'var(--text3)'};font-weight:${i===6?700:400}">${d}</div>`).join('')}</div>
      <div style="text-align:center;margin-top:8px;font-size:11px;color:var(--text2)">Média: <strong style="color:var(--green)">${avgScore}/100</strong></div>
    </div>
  </div>
  <div class="section-title">Calorias — 7 dias</div>
  <div style="padding:0 16px;margin-bottom:16px">
    <div class="card">
      <div style="display:flex;align-items:flex-end;gap:4px;height:72px;margin-bottom:6px">
        ${calHistory.map((v,i)=>{const meta=c.meta||1800;const pct=Math.min(Math.round((v/meta)*100),120);const col=Math.abs(v-meta)<200?'var(--green)':Math.abs(v-meta)<400?'var(--orange)':'var(--red)';const isToday=i===6;return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px"><div style="font-size:8px;color:var(--text3)">${v}</div><div style="width:100%;height:${Math.min(pct,100)}%;min-height:4px;background:${isToday?col:col+'55'};border-radius:3px 3px 0 0"></div></div>`;}).join('')}
      </div>
      <div style="display:flex;gap:4px">${weekDays.map((d,i)=>`<div style="flex:1;text-align:center;font-size:9px;color:${i===6?'var(--orange)':'var(--text3)'}">${d}</div>`).join('')}</div>
      <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:11px;color:var(--text2)">
        <span>Média: <strong style="color:var(--orange)">${avgCal} kcal</strong></span>
        <span>Meta: <strong style="color:var(--green)">${c.meta||1800} kcal</strong></span>
        <span>Dias OK: <strong style="color:var(--blue)">${calHistory.filter(v=>Math.abs(v-(c.meta||1800))<200).length}/7</strong></span>
      </div>
    </div>
  </div>
  ${isMonday?`<div class="section-title" style="color:var(--yellow)">📋 Relatório Semanal</div><div style="padding:0 16px;margin-bottom:16px"><div class="card card-orange"><div style="font-size:12px;color:var(--text2);line-height:1.75">🤖 Você foi consistente na hidratação (78%) e manteve ${APP.streak} dias de sequência. Qualidade alimentar média: <strong>${avgScore}/100</strong>. Foco desta semana: reduza carboidratos refinados no jantar e adicione +1 porção de vegetais.</div></div></div>`:''}
  <div class="section-title">📈 Relatório Mensal</div>
  <div style="padding:0 16px;margin-bottom:16px">
    <div class="card card-purple">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">
        ${[['Início',(APP.calc?.peso||78)+'kg'],['Atual',(APP.weightHistory?.[APP.weightHistory.length-1]?.peso||77.8)+'kg'],['Meta',(APP.calc?.pesoMeta||73)+'kg']].map(([l,v])=>`<div style="text-align:center;background:var(--surface2);border-radius:8px;padding:10px"><div style="font-size:10px;color:var(--text3)">${l}</div><div style="font-size:15px;font-weight:700;color:var(--purple)">${v}</div></div>`).join('')}
      </div>
      <div style="font-size:11px;color:var(--text2);margin-bottom:10px">Previsão: ~${APP.calc?.semanas||8} semanas para a meta</div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" onclick="exportFullHistory()" style="flex:1;padding:10px;font-size:12px">📄 Exportar histórico</button>
        <button class="btn btn-outline" onclick="shareNative()" style="flex:1;padding:10px;font-size:12px">📤 Compartilhar</button>
      </div>
    </div>
  </div>
  <div class="section-title">🤖 Análise Preditiva</div>
  <div style="padding:0 16px;margin-bottom:16px">
    <div class="card card-blue">
      ${[['⚠️','Terças-feiras','Tendência a pular o lanche da tarde','var(--yellow)'],['✅','Manhãs','Consistência excelente no café da manhã (92%)','var(--green)'],['📉','Fim de semana','Qualidade alimentar cai ~20% aos sábados','var(--orange)'],['💡','Sugestão IA','Adicione proteína às 15h para manter o metabolismo','var(--blue)']].map(([e,t,d,col])=>`<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:18px">${e}</span><div><div style="font-size:12px;font-weight:700;color:${col}">${t}</div><div style="font-size:11px;color:var(--text2);margin-top:2px">${d}</div></div></div>`).join('')}
    </div>
  </div>
  <div class="section-title">🏆 Top receitas do mês</div>
  <div style="padding:0 16px;margin-bottom:16px">
    ${RECIPES.slice(0,3).map((r,i)=>`<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)"><div style="font-family:var(--font-serif);font-size:18px;font-weight:700;color:${['var(--yellow)','var(--text2)','var(--orange)'][i]};width:20px">${i+1}°</div><span style="font-size:26px">${r.emoji}</span><div style="flex:1"><div style="font-size:13px;font-weight:600">${r.name}</div><div style="font-size:11px;color:var(--text2)">${r.cal} kcal · ⭐ ${r.rating}</div></div></div>`).join('')}
  </div>
  <div class="section-title">🛠️ Dashboard Admin</div>
  <div style="padding:0 16px;margin-bottom:16px">
    <div class="card" style="border:2px dashed var(--border2)">
      <div style="font-size:13px;font-weight:700;margin-bottom:10px">Painel de controle (simulado)</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        ${[['👥','Usuários ativos','12.847'],['📈','Retenção 7d','74%'],['💎','Conversão Free→Pro','8.3%'],['⭐','NPS Score','72'],['📸','Fotos analisadas/dia','2.341'],['🤖','Msgs Coach/dia','18.920']].map(([e,l,v])=>`<div style="background:var(--surface2);border-radius:8px;padding:10px"><div style="font-size:16px;margin-bottom:2px">${e}</div><div style="font-size:10px;color:var(--text3)">${l}</div><div style="font-size:15px;font-weight:700;color:var(--green)">${v}</div></div>`).join('')}
      </div>
    </div>
  </div>`;
}

/* ═══════════════════════════════════════
   COMMUNITY SCREEN
═══════════════════════════════════════ */
const COMMUNITY = {tab:'feed'};
const MOCK_USERS = [
  {name:'Membro VitalIA',avatar:'👤',streak:21,lost:4.2,score:88,bio:'Rotina saudável em evolução 🌱',following:true},
  {name:'Atleta VitalIA',avatar:'👤',streak:14,lost:2.1,score:76,bio:'Treino + Nutrição 💪',following:true},
  {name:'Especialista VitalIA',avatar:'👤',streak:30,lost:7.5,score:95,bio:'Saúde integral | -7kg 🏆',following:false},
  {name:'Rafael R.',avatar:'🧑',streak:5,lost:0.8,score:61,bio:'Iniciando a jornada 🌿',following:false},
];
const MOCK_CHALLENGES = [
  {id:1,title:'7 dias sem açúcar',emoji:'🚫🍬',duration:7,progress:4,participants:234,joined:true},
  {id:2,title:'Quem bebe mais água',emoji:'💧',duration:7,progress:6,participants:3,joined:true},
  {id:3,title:'30 dias de refeições',emoji:'📸',duration:30,progress:7,participants:1842,joined:false},
  {id:4,title:'Semana sem ultraprocessados',emoji:'🥗',duration:7,progress:0,participants:5,joined:false},
];
const MOCK_GROUPS = [
  {name:'Veganos VitalIA',emoji:'🌱',members:3241,active:true},
  {name:'Low Carb Brasil',emoji:'🥩',members:5678,active:true},
  {name:'Emagrecimento Juntos',emoji:'🎯',members:8901,active:false},
  {name:'Ganho de Massa',emoji:'💪',members:4532,active:false},
  {name:'Diabéticos Conscientes',emoji:'🩺',members:2103,active:false},
  {name:'Gestantes Saudáveis',emoji:'🤰',members:1892,active:false},
];
const MOCK_FEED = [
  {user:'Membro VitalIA',avatar:'👤',time:'2h',action:'desbloqueou o badge',detail:'🏆 30 Dias de Sequência!',likes:12,liked:false},
  {user:'Atleta VitalIA',avatar:'👤',time:'4h',action:'completou o desafio',detail:'💧 7 dias de hidratação meta',likes:8,liked:true},
  {user:'Especialista VitalIA',avatar:'👤',time:'6h',action:'perdeu mais 0.5kg',detail:'Total: -7.5kg 🎉',likes:34,liked:false},
  {user:'Rafael R.',avatar:'🧑',time:'1d',action:'iniciou o desafio',detail:'🚫 7 dias sem açúcar',likes:5,liked:false},
];

function renderCommunity() {
  const tabs = [{k:'feed',l:'Feed'},{k:'challenges',l:'Desafios'},{k:'groups',l:'Grupos'},{k:'profile',l:'Perfil'}];
  return `
  <div class="screen-header"><div class="screen-title">👥 Comunidade</div></div>
  <div class="tab-row">
    ${tabs.map(({k,l})=>`<button class="tab-btn ${COMMUNITY.tab===k?'active':''}" onclick="COMMUNITY.tab='${k}';navigate('community')">${l}</button>`).join('')}
  </div>
  ${COMMUNITY.tab==='feed'?renderCommFeed():COMMUNITY.tab==='challenges'?renderCommChallenges():COMMUNITY.tab==='groups'?renderCommGroups():renderCommProfile()}`;
}

function renderCommFeed() {
  return `<div style="padding:0 16px">
    ${MOCK_FEED.map((f,i)=>`<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <div style="width:38px;height:38px;border-radius:50%;background:var(--gradient2);display:flex;align-items:center;justify-content:center;font-size:20px">${f.avatar}</div>
        <div style="flex:1"><div style="font-size:13px;font-weight:700">${f.user}</div><div style="font-size:11px;color:var(--text3)">${f.action} · ${f.time}</div></div>
      </div>
      <div style="background:var(--surface2);border-radius:10px;padding:10px;font-size:13px;font-weight:600;margin-bottom:10px">${f.detail}</div>
      <div style="display:flex;align-items:center;gap:16px">
        <button onclick="MOCK_FEED[${i}].liked=!MOCK_FEED[${i}].liked;MOCK_FEED[${i}].likes+=MOCK_FEED[${i}].liked?1:-1;navigate('community')" style="background:transparent;border:none;cursor:pointer;font-size:12px;color:${f.liked?'var(--red)':'var(--text3)'}">❤️ ${f.likes}</button>
        <button onclick="toast(t('toast_comment'),'success')" style="background:transparent;border:none;cursor:pointer;font-size:12px;color:var(--text3)">💬 Comentar</button>
        <button onclick="shareNative()" style="background:transparent;border:none;cursor:pointer;font-size:12px;color:var(--text3)">📤</button>
      </div>
    </div>`).join('')}
  </div>`;
}

function renderCommChallenges() {
  return `<div style="padding:0 16px">
    <button class="btn btn-primary btn-full" onclick="openModal('Criar Desafio',\`<div class='input-wrap'><label class='input-label'>Nome</label><input id='ch-n' class='input' placeholder='Ex: 7 dias sem açúcar'></div><div class='input-wrap'><label class='input-label'>Duração</label><select id='ch-d' class='input'><option>7 dias</option><option>14 dias</option><option>30 dias</option></select></div><button class='btn btn-primary btn-full' onclick='toast(\\\"Desafio criado! 🎯\\\",\\\"success\\\");confetti();closeModal()' style='padding:13px'>Criar e convidar</button>\`)" style="padding:12px;margin-bottom:12px">+ Criar desafio</button>
    ${MOCK_CHALLENGES.map((ch,ci)=>`<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <span style="font-size:28px">${ch.emoji}</span>
        <div style="flex:1"><div style="font-size:14px;font-weight:700">${ch.title}</div><div style="font-size:11px;color:var(--text3)">${ch.participants} participantes · ${ch.duration} dias</div></div>
        ${ch.joined?`<span class="pill pill-green" style="font-size:10px">✓ Ativo</span>`:`<button class="btn btn-sm btn-primary" onclick="MOCK_CHALLENGES[${ci}].joined=true;toast(t('toast_challenge')+' +20 XP','success');addXP(20);navigate('community')">Participar</button>`}
      </div>
      ${ch.joined?`<div><div style="font-size:11px;color:var(--text2);margin-bottom:4px">${ch.progress}/${ch.duration} dias</div><div style="height:6px;background:var(--surface2);border-radius:99px;overflow:hidden"><div style="height:100%;width:${Math.round((ch.progress/ch.duration)*100)}%;background:var(--gradient);border-radius:99px"></div></div></div>`:''}
    </div>`).join('')}
  </div>`;
}

function renderCommGroups() {
  return `<div style="padding:0 16px">
    ${MOCK_GROUPS.map(g=>`<div style="display:flex;align-items:center;gap:12px;padding:14px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:8px">
      <span style="font-size:30px">${g.emoji}</span>
      <div style="flex:1"><div style="font-size:14px;font-weight:700">${g.name}</div><div style="font-size:11px;color:var(--text3)">${g.members.toLocaleString('pt-BR')} membros ${g.active?'· <span style="color:var(--green)">● ativo</span>':''}</div></div>
      <button class="btn btn-sm ${g.active?'btn-primary':'btn-outline'}" onclick="toast(t('toast_entering')+' ${g.name}!','info')">${g.active?'Entrar':'+ Seguir'}</button>
    </div>`).join('')}
  </div>`;
}

function renderCommProfile() {
  const p = APP.profile||{name:'Usuário'};
  const diff = Math.abs(+((APP.weightHistory?.[APP.weightHistory.length-1]?.peso||77.8)-(APP.calc?.peso||78)).toFixed(1));
  return `<div>
  <div style="padding:20px 16px;text-align:center;background:radial-gradient(ellipse at top,rgba(34,197,94,.1),transparent)">
    <div style="width:72px;height:72px;border-radius:50%;background:var(--gradient);display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 10px;border:3px solid rgba(34,197,94,.3)">${p.name?.charAt(0)||'U'}</div>
    <div style="font-family:var(--font-serif);font-size:20px;font-weight:700">${p.name}</div>
    <div style="font-size:12px;color:var(--text2);margin:4px 0 12px">Explorando saúde com IA 🌿</div>
    <div style="display:flex;gap:16px;justify-content:center">
      ${[['🔥',APP.streak,'Streak'],['⚖️',diff+'kg','perdidos'],['⚡',APP.xp,'XP'],['🏅','3','Badges']].map(([e,v,l])=>`<div style="text-align:center"><div style="font-size:16px;font-weight:700;color:var(--green)">${v}</div><div style="font-size:10px;color:var(--text3)">${l}</div></div>`).join('')}
    </div>
  </div>
  <div class="section-title">Seguindo</div>
  <div style="padding:0 16px;margin-bottom:16px">
    ${MOCK_USERS.filter(u=>u.following).map(u=>`<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="width:38px;height:38px;border-radius:50%;background:var(--gradient2);display:flex;align-items:center;justify-content:center;font-size:20px">${u.avatar}</div>
      <div style="flex:1"><div style="font-size:13px;font-weight:700">${u.name}</div><div style="font-size:11px;color:var(--text3)">${u.bio}</div></div>
      <div style="text-align:right"><div style="font-size:12px;font-weight:700;color:var(--orange)">🔥 ${u.streak}d</div><div style="font-size:10px;color:var(--text3)">-${u.lost}kg</div></div>
    </div>`).join('')}
  </div>
  <div class="section-title">Descobrir</div>
  <div style="padding:0 16px;margin-bottom:12px">
    ${MOCK_USERS.filter(u=>!u.following).map(u=>`<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="width:38px;height:38px;border-radius:50%;background:var(--gradient);display:flex;align-items:center;justify-content:center;font-size:20px">${u.avatar}</div>
      <div style="flex:1"><div style="font-size:13px;font-weight:700">${u.name}</div><div style="font-size:11px;color:var(--text3)">${u.bio}</div></div>
      <button class="btn btn-sm btn-outline" onclick="toast(t('toast_following')+' ${u.name}!','success')">+ Seguir</button>
    </div>`).join('')}
  </div>
  <div class="section-title">Cartão compartilhável</div>
  <div class="share-card" style="margin-bottom:16px">
    <div style="font-size:11px;color:rgba(34,197,94,.6);margin-bottom:4px">Minha jornada · VitalIA</div>
    <div style="font-family:var(--font-serif);font-size:40px;font-weight:700;color:var(--green);font-style:italic">-${diff}kg</div>
    <div style="font-size:12px;color:rgba(255,255,255,.5);margin-top:4px">🔥 ${APP.streak} dias · ⚡ ${APP.xp} XP · Score: ${calcDailyScore()}/100</div>
    <div style="margin:10px 0;font-style:italic;font-family:var(--font-serif);color:rgba(255,255,255,.7);">"Cada escolha saudável me aproxima do melhor eu."</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
      ${[['#25D366','💬 WhatsApp','whatsapp'],['#E1306C','📸 Instagram','instagram'],['#1DA1F2','🐦 Twitter','twitter'],['#000','🎵 TikTok','tiktok']].map(([col,l,net])=>`<button style="background:${col};color:#fff;padding:8px 12px;border-radius:99px;font-size:11px;font-weight:700;cursor:pointer;border:none" onclick="shareToNetwork('${net}')">${l}</button>`).join('')}
    </div>
  </div>
  </div>`;
}

/* ═══════════════════════════════════════
   INTEGRATIONS SCREEN
═══════════════════════════════════════ */
function renderIntegrations() {
  const sections = [
    {cat:'⌚ Wearables',items:[
      {name:'Apple Health',icon:'🍎',connected:false,desc:'iOS — passos, calorias, sono'},
      {name:'Google Fit',icon:'🟢',connected:false,desc:'Planejado — requer OAuth/backend'},
      {name:'Samsung Health',icon:'🔵',connected:false,desc:'Sono, estresse, SpO2'},
      {name:'Garmin Connect',icon:'🟠',connected:false,desc:'Treinos e frequência cardíaca'},
      {name:'Fitbit',icon:'🐦',connected:false,desc:'Saúde completa e sono'},
      {name:'Balança Bluetooth',icon:'⚖️',connected:false,desc:'Sincroniza peso automaticamente'},
    ]},
    {cat:'🧪 Nutrição APIs',items:[
      {name:'Nutritionix API',icon:'📊',connected:false,desc:'Planejado — requer chave no backend'},
      {name:'Open Food Facts',icon:'🌍',connected:false,desc:'Planejado — consulta sob demanda'},
      {name:'Edamam API',icon:'🥗',connected:false,desc:'Análise nutricional de receitas'},
      {name:'USDA FoodData',icon:'🇺🇸',connected:false,desc:'Dados nutricionais oficiais EUA'},
    ]},
    {cat:'💳 Pagamento',items:[
      {name:'Stripe',icon:'💳',connected:false,desc:'Cartão de crédito/débito'},
      {name:'Pix',icon:'🟢',connected:false,desc:'Planejado — requer provedor de pagamento'},
      {name:'Apple Pay',icon:'🍎',connected:false,desc:'iOS — pagamento nativo'},
      {name:'Google Pay',icon:'🇬',connected:false,desc:'Android — pagamento nativo'},
    ]},
    {cat:'🔔 Notificações',items:[
      {name:'Push Notification',icon:'📱',connected:false,desc:'Planejado — requer permissão do navegador'},
      {name:'WhatsApp (Twilio)',icon:'💬',connected:false,desc:'Mensagens via WhatsApp Business'},
      {name:'SMS (Twilio)',icon:'📱',connected:false,desc:'SMS transacional'},
      {name:'Email (SendGrid)',icon:'📧',connected:false,desc:'Resumo semanal e conquistas'},
    ]},
    {cat:'🔐 Autenticação Social',items:[
      {name:'Google OAuth 2.0',icon:'🇬',connected:false,desc:'Login com Google'},
      {name:'Apple Sign In',icon:'🍎',connected:false,desc:'Login com Apple ID'},
      {name:'Facebook Login',icon:'📘',connected:false,desc:'Login com Facebook'},
      {name:'WhatsApp OTP',icon:'💬',connected:false,desc:'Verificação por WhatsApp'},
    ]},
    {cat:'🤖 IA APIs',items:[
      {name:'Anthropic Claude',icon:'🤖',connected:false,desc:'Planejado — IA deve rodar via backend'},
      {name:'Google Vision API',icon:'👁️',connected:false,desc:'Reconhecimento de alimentos'},
      {name:'OpenAI Whisper',icon:'🎤',connected:false,desc:'Transcrição de voz para texto'},
    ]},
  ];
  return `
  <div class="screen-header"><div class="screen-title">🔗 Integrações</div></div>
  <div style="padding:0 16px;margin-bottom:8px">
    <div style="background:rgba(56,189,248,.06);border:1px solid rgba(56,189,248,.2);border-radius:var(--radius);padding:12px">
      <div style="font-size:12px;color:var(--blue);font-weight:700;margin-bottom:4px">ℹ️ Modo demonstração</div>
      <div style="font-size:11px;color:var(--text2)">Integrações reais requerem chaves de API configuradas no backend. Aqui você pode visualizar e simular conexões.</div>
    </div>
  </div>
  ${sections.map(s=>`
    <div class="section-title">${s.cat}</div>
    <div style="padding:0 16px;margin-bottom:8px">
      ${s.items.map(item=>`<div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--surface);border:1px solid ${item.connected?'rgba(34,197,94,.25)':'var(--border)'};border-radius:var(--radius-sm);margin-bottom:6px">
        <div style="font-size:22px">${item.icon}</div>
        <div style="flex:1"><div style="font-size:13px;font-weight:700">${item.name}</div><div style="font-size:11px;color:var(--text3)">${item.desc}</div></div>
        ${item.connected?`<div style="text-align:right"><span class="pill pill-green" style="font-size:9px">Disponível</span></div>`:`<button class="btn btn-sm btn-outline" onclick="toast('${item.name}: integração planejada para backend.','info')" style="font-size:10px;flex-shrink:0">Planejado</button>`}
      </div>`).join('')}
    </div>
  `).join('')}
  <div style="height:8px"></div>`;
}

/* ═══════════════════════════════════════
   PREMIUM SCREEN
═══════════════════════════════════════ */
function renderPremiumScreen() {
  return `
  <div class="screen-header">
    <button onclick="navigate('settings')" class="btn btn-ghost" style="font-size:20px;padding:4px">←</button>
    <div class="screen-title">💎 Minha assinatura</div>
    <div></div>
  </div>
  <div style="text-align:center;padding:20px 16px;background:radial-gradient(ellipse at top,rgba(251,191,36,.12),transparent 60%)">
    <div style="font-size:48px;margin-bottom:8px">💎</div>
    <div style="font-family:var(--font-serif);font-size:22px;font-weight:700;margin-bottom:4px">Plano VitalIA ativo · R$29,90/mês</div>
    <div style="font-size:12px;color:var(--text2)">Acesso completo liberado · Garantia de 7 dias</div>
  </div>
  <div style="padding:0 16px;margin-bottom:16px">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
      ${[
        {name:'Essencial',price:'R$0',sub:'/mês',col:'var(--text3)',feats:['Registros básicos','Receitas iniciais','IMC','Coach limitado','Push básico'],featured:false},
        {name:'VitalIA',price:'R$29,90',sub:'/mês',col:'var(--green)',feats:['Acesso completo','Receitas inteligentes','Foto IA','Coach + memória','Alertas avançados','Relatórios','Offline'],featured:true},
        {name:'Família',price:'R$49,90',sub:'/mês',col:'var(--blue)',feats:['Tudo Pro','4 membros','Dashboard fam.','Receitas família','Suporte VIP'],featured:false},
      ].map(pl=>`<div style="border-radius:var(--radius);padding:12px 10px;border:${pl.featured?'2px solid var(--green)':'1.5px solid var(--border2)'};background:${pl.featured?'rgba(34,197,94,.06)':'var(--surface)'};position:relative">
        ${pl.featured?`<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:var(--green);color:#000;font-size:9px;font-weight:700;padding:2px 8px;border-radius:99px;white-space:nowrap">PLANO ATIVO</div>`:''}
        <div style="font-size:11px;font-weight:700;color:${pl.col};text-transform:uppercase;margin-bottom:4px">${pl.name}</div>
        <div style="font-family:var(--font-serif);font-size:15px;font-weight:700;color:${pl.col}">${pl.price}</div>
        <div style="font-size:9px;color:var(--text3);margin-bottom:8px">${pl.sub}</div>
        ${pl.feats.map(f=>`<div style="font-size:10px;color:var(--text2);padding:1px 0">✓ ${f}</div>`).join('')}
        <button class="btn btn-primary btn-full" onclick="toast('${pl.name} selecionado.','success')" style="margin-top:10px;padding:8px;font-size:11px">${pl.featured?'Ativo':'Ver opção'}</button>
      </div>`).join('')}
    </div>
  </div>
  <div style="padding:0 16px;margin-bottom:16px">
    <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:16px">
      <span style="font-size:13px;color:var(--text2)">Mensal</span>
      <label class="toggle" style="margin:0"><input type="checkbox" onchange="toast(this.checked?'Anual: -33%! 💰':'Mensal selecionado.','info')"><div class="toggle-slider"></div></label>
      <span style="font-size:13px;color:var(--green)">Anual <span style="background:rgba(34,197,94,.12);padding:2px 6px;border-radius:99px;font-size:10px;font-weight:700">-33%</span></span>
    </div>
    <button class="btn btn-primary btn-full" onclick="toast('Plano ativo confirmado.','success')" style="padding:15px;font-size:15px;border-radius:var(--radius-lg)">Acesso completo liberado</button>
    <div style="text-align:center;font-size:11px;color:var(--text3);margin-top:8px">Apple Pay · Google Pay · Pix · Cartão</div>
  </div>
  <div class="section-title">Depoimentos</div>
  <div style="padding:0 16px;margin-bottom:16px">
    ${[['Usuário VitalIA','Perdi 8kg em 3 meses com o plano IA. Incrível! ⭐⭐⭐⭐⭐'],['Assinante VitalIA','O coach IA é melhor que meu nutricionista presencial! ⭐⭐⭐⭐⭐'],['Membro Premium','Receitas práticas e deliciosas. Uso o app todo dia! ⭐⭐⭐⭐⭐']].map(([n,t])=>`<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:8px"><div style="font-size:13px;font-weight:700;margin-bottom:6px">${n}</div><div style="font-size:12px;color:var(--text2);font-style:italic">"${t}"</div></div>`).join('')}
  </div>
  <div class="section-title">FAQ</div>
  <div style="padding:0 16px;margin-bottom:16px">
    ${[['Posso cancelar a qualquer momento?','Sim. Sem multas. Cancele pelo app, funciona imediatamente.'],['Como funciona a garantia?','Você tem 7 dias para experimentar com segurança.'],['Meus dados ficam seguros?','Os dados locais ficam no dispositivo; conformidade completa exige backend, consentimento e políticas operacionais.'],['Funciona offline?','No plano VitalIA, sim. Dados essenciais ficam no dispositivo.']].map(([q,a])=>`<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;margin-bottom:6px;cursor:pointer" onclick="const ans=this.querySelector('.ans');ans.style.display=ans.style.display==='block'?'none':'block'"><div style="font-size:13px;font-weight:600;display:flex;justify-content:space-between">${q}<span>+</span></div><div class="ans" style="display:none;font-size:12px;color:var(--text2);margin-top:8px">${a}</div></div>`).join('')}
  </div>
  <div style="padding:0 16px;margin-bottom:24px">
    <div class="card card-glow">
      <div style="font-size:14px;font-weight:700;margin-bottom:4px">🎁 Programa de Indicação</div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:10px">Indique amigos e fortaleça sua jornada VitalIA com benefícios de comunidade.</div>
      <div style="background:var(--surface2);padding:10px;border-radius:8px;font-family:monospace;text-align:center;color:var(--green);font-size:13px;letter-spacing:1px;margin-bottom:10px">vitalia.app/ref/${(APP.user?.name||'user').replace(' ','').toLowerCase()}</div>
      <button class="btn btn-primary btn-full" onclick="toast(t('toast_link_copied')+' 🎉','success')" style="padding:11px">📋 Copiar link</button>
    </div>
  </div>`;
}

/* ═══════════════════════════════════════
   TELEGRAM SYSTEM — COMPLETO
═══════════════════════════════════════ */

// ── State helpers ──────────────────────
function saveTelegram() { save('v_telegram', APP.telegram); }

function genOTP() {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = Date.now() + 5 * 60 * 1000; // 5 min
  APP.telegram = APP.telegram || {};
  APP.telegram.otpCode = code;
  APP.telegram.otpExpires = expires;
  saveTelegram();
  return code;
}

// ── Telegram Login Flow ────────────────
function telegramLogin() {
  toast('Login Telegram será ativado somente via Supabase Auth.', 'info', 3000);
  return;
  // Simulates Telegram Login Widget popup
  // eslint-disable-next-line no-unreachable -- pré-existente no index.html; corrigir na V231
  openModal('✈️ Entrar com Telegram', `
    <div style="text-align:center;padding:8px 0 16px">
      <div style="font-size:48px;margin-bottom:12px">✈️</div>
      <div style="font-family:var(--font-serif);font-size:18px;font-weight:700;margin-bottom:6px">Login com Telegram</div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:20px;line-height:1.6">Clique abaixo para autenticar via Telegram.<br>Você será redirecionado ao app.</div>
    </div>
    <div style="background:var(--surface2);border-radius:var(--radius);padding:14px;margin-bottom:16px">
      <div style="font-size:11px;color:var(--text3);margin-bottom:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Fluxo de autenticação</div>
      ${[
        ['1','Popup abre no Telegram'],
        ['2','Você confirma com 1 clique'],
        ['3','Telegram retorna dados criptografados'],
        ['4','Backend valida hash HMAC-SHA256'],
        ['5','Sessão JWT criada automaticamente'],
      ].map(([n,d])=>`<div class="tg-step"><div class="tg-step-num">${n}</div><div class="tg-step-text">${d}</div></div>`).join('')}
    </div>
    <div style="background:rgba(34,158,217,.06);border:1px solid rgba(34,158,217,.2);border-radius:10px;padding:12px;margin-bottom:16px;font-size:11px;color:var(--text2)">
      🔒 <strong>Segurança:</strong> Validação HMAC-SHA256 com token do bot. Impossível forjar sem o token. Sessão expira em 30 dias.
    </div>
    <button class="tg-login-btn" onclick="doTelegramLogin()" style="margin:0 0 10px">
      <span class="tg-plane">✈️</span> Autenticar com Telegram
    </button>
    <button class="btn btn-ghost btn-full" onclick="closeModal()" style="font-size:13px;color:var(--text3)">Cancelar</button>
  `);
}

function doTelegramLogin() {
  toast('Login Telegram será ativado somente via Supabase Auth.', 'info', 3000);
  return;
  // eslint-disable-next-line no-unreachable -- pré-existente no index.html; corrigir na V231
  closeModal();
  // Simulate Telegram auth response
  const tgData = {
    id: Math.floor(100000000 + Math.random()*900000000),
    first_name: 'Usuário',
    last_name: 'VitalIA',
    username: 'vitalia_user',
    photo_url: null,
    auth_date: Math.floor(Date.now()/1000),
    hash: 'simulated_hmac_sha256_hash_' + Date.now()
  };
  // Show processing
  const loadDiv = document.createElement('div');
  loadDiv.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px';
  loadDiv.innerHTML = '<div style="font-size:48px">✈️</div><div style="color:#fff;font-size:14px;font-weight:600">Validando com Telegram...</div><div style="width:40px;height:40px;border:3px solid #229ED9;border-top-color:transparent;border-radius:50%;animation:spin .7s linear infinite"></div>';
  document.body.appendChild(loadDiv);

  setTimeout(() => {
    loadDiv.remove();
    // Process login
    const name = `${tgData.first_name} ${tgData.last_name}`.trim();
    APP.user = {
      email: `tg_${tgData.id}@telegram.auth`,
      name,
      telegramId: tgData.id,
      telegramUsername: tgData.username,
      loginMethod: 'telegram'
    };
    APP.profile = {
      name,
      weight:78, height:175, age:30, gender:'m', goal:'lose', activity:'mod',
      restrictions:[], telegramLinked: true
    };
    APP.telegram = {
      connected: true,
      username: tgData.username,
      chatId: tgData.id,
      linkedAt: new Date().toISOString(),
      notifs: {meals:true, water:true, streak:true, achievements:true, weekly:true, motivational:true},
      channelSubscribed: false,
      groupJoined: false,
    };
    APP.calc = calcProfile(APP.profile);
    APP.water = 0; APP.meals = [];
    APP.weightHistory = WEIGHT_HISTORY.map((p,i)=>({date:new Date(Date.now()-i*86400000).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),peso:p})).reverse();
    APP.session = 'tg_' + Date.now();
    clearSensitiveLocalCache();
    saveTelegram();
    confetti();
    toast('✅ '+t('toast_tg_login'), 'success', 3000);
    APP.authStep = 'biometric'; renderAuth();
  }, 2000);
}

// ── OTP Vinculação ─────────────────────
function openTelegramConnect() {
  const otp = genOTP();
  const botName = 'VitalIABot';
  const deepLink = `https://t.me/${botName}?start=${otp}`;

  openModal('✈️ Conectar Telegram', `
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:40px;margin-bottom:8px">✈️</div>
      <div style="font-family:var(--font-serif);font-size:17px;font-weight:700;margin-bottom:4px">Vincule seu Telegram</div>
      <div style="font-size:12px;color:var(--text2)">Receba notificações e use comandos direto no Telegram</div>
    </div>

    <div style="background:linear-gradient(135deg,rgba(34,158,217,.12),rgba(34,158,217,.04));border:1px solid rgba(34,158,217,.25);border-radius:var(--radius);padding:16px;margin-bottom:16px;text-align:center">
      <div style="font-size:11px;color:#229ED9;font-weight:700;margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px">Seu código de vinculação</div>
      <div class="otp-wrap" id="otp-display" style="justify-content:center">
        ${otp.split('').map((d,i)=>`<div class="otp-digit filled" style="width:38px;height:46px;line-height:46px;border-color:#229ED9;color:#229ED9">${d}</div>`).join('')}
      </div>
      <div style="font-size:11px;color:var(--text3);margin-top:8px">Válido por <span id="otp-timer" style="color:#229ED9;font-weight:700">5:00</span></div>
    </div>

    <div style="margin-bottom:16px">
      <div style="font-size:11px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Como vincular:</div>
      ${[
        ['1','Abra o Telegram e busque <strong>@VitalIABot</strong>'],
        ['2','Envie o comando <code style="background:rgba(34,158,217,.1);padding:1px 5px;border-radius:4px;color:#229ED9">/start ${otp}</code>'],
        ['3','Ou clique no botão abaixo para abrir direto'],
        ['4','Aguarde a confirmação automática no app'],
      ].map(([n,d])=>`<div class="tg-step"><div class="tg-step-num">${n}</div><div class="tg-step-text" style="font-size:12px">${d}</div></div>`).join('')}
    </div>

    <a href="${deepLink}" target="_blank" style="text-decoration:none;display:block;margin-bottom:10px">
      <button class="tg-login-btn" style="margin:0">
        <span class="tg-plane">✈️</span> Abrir @VitalIABot no Telegram
      </button>
    </a>

    <div style="margin-bottom:4px">
      <label class="input-label">Ou insira o código recebido pelo bot:</label>
      <div class="otp-wrap" id="otp-input-wrap">
        ${[0,1,2,3,4,5].map(i=>`<input class="otp-digit" id="otp-in-${i}" maxlength="1" type="number" min="0" max="9" oninput="otpInput(${i},this)" onkeydown="otpKeydown(${i},event)" style="width:42px">`).join('')}
      </div>
    </div>

    <button class="btn btn-primary btn-full" onclick="verifyOTP('${otp}')" style="padding:13px;margin-bottom:8px" id="verify-otp-btn">✅ Verificar código</button>
    <button class="btn btn-ghost btn-full" onclick="closeModal()" style="font-size:12px;color:var(--text3)">Cancelar</button>
    <div style="text-align:center;font-size:10px;color:var(--text3);margin-top:10px">O código expira em 5 minutos por segurança</div>
  `);
  startOTPTimer(300);
}

window.otpInput = function(i, el) {
  const v = el.value.replace(/\D/,'');
  el.value = v;
  el.classList.toggle('filled', !!v);
  if(v && i<5) { document.getElementById(`otp-in-${i+1}`)?.focus(); }
};

window.otpKeydown = function(i, e) {
  if(e.key==='Backspace' && !e.target.value && i>0) { document.getElementById(`otp-in-${i-1}`)?.focus(); }
};

let _otpInterval = null;
function startOTPTimer(secs) {
  clearInterval(_otpInterval);
  _otpInterval = setInterval(() => {
    const el = document.getElementById('otp-timer');
    if(!el){ clearInterval(_otpInterval); return; }
    secs--;
    if(secs<=0){ clearInterval(_otpInterval); el.textContent='Expirado'; el.style.color='var(--red)'; return; }
    const m = Math.floor(secs/60), s = secs%60;
    el.textContent = `${m}:${String(s).padStart(2,'0')}`;
    if(secs<=60) el.style.color='var(--orange)';
  }, 1000);
}

window.verifyOTP = function(expected) {
  const entered = [0,1,2,3,4,5].map(i=>document.getElementById(`otp-in-${i}`)?.value||'').join('');
  if(entered.length !== 6 || !/^\d{6}$/.test(entered)) { toast(t('toast_tg_6digit'),'error'); return; }
  const btn = document.getElementById('verify-otp-btn');
  if(btn){ btn.classList.add('btn-loading'); btn.disabled=true; }
  setTimeout(()=>{
    // In demo: accept any 6-digit code, or exact match
    const valid = entered === expected || /^\d{6}$/.test(entered);
    clearInterval(_otpInterval);
    if(valid){
      const username = 'vitalia_user';
      APP.telegram = {
        connected: true,
        username,
        chatId: Math.floor(100000000 + Math.random()*900000000),
        linkedAt: new Date().toISOString(),
        notifs: {meals:true, water:true, streak:true, achievements:true, weekly:true, motivational:true},
        channelSubscribed: false,
        groupJoined: false,
      };
      saveTelegram();
      closeModal();
      confetti();
      toast('✅ '+t('toast_tg_linked'), 'success', 4000);
      navigate('telegram');
    } else {
      if(btn){ btn.classList.remove('btn-loading'); btn.disabled=false; }
      toast(t('toast_tg_wrong'),'error');
    }
  }, 1500);
};

// ── Telegram Settings Screen ───────────
function renderTelegramSettings() {
  const tg = APP.telegram || {};
  const p = APP.profile || {};
  const notifs = tg.notifs || {};

  const MSG_PREVIEWS = {
    meal: {
      title:'⏰ Lembrete de Refeição',
      body:`🍳 *Café da manhã* — 07:30\nHoje no seu plano: Omelete de espinafre\n📊 Meta: 280kcal | 20g proteína\n👆 [Ver receita completa](t.me/VitalIABot)`,
      btns:['✅ Já comi','⏰ +15min','📖 Ver receita']
    },
    water: {
      title:'💧 Lembrete de Água',
      body:`💧 *Hidratação*\nVocê tomou ${APP.water} de ${APP.calc?.aguaCopos||8} copos hoje.\nBeba mais um agora! 🌊`,
      btns:['✅ Bebi um copo','💧 +500ml']
    },
    streak: {
      title:'🔥 Streak em Risco',
      body:`🔥 *Atenção, ${p.name?.split(' ')[0]||'Você'}!*\nSua sequência de *${APP.streak} dias* termina em 2 horas.\nRegistre uma refeição para manter o streak! 💪`,
      btns:['📸 Registrar refeição','⚡ Ver progresso']
    },
    achievement: {
      title:'🏆 Conquista Desbloqueada',
      body:`🎖️ *PARABÉNS!*\nVocê desbloqueou o badge *'7 Dias Seguidos'*!\nIsso é dedicação de verdade. Continue! 🚀`,
      btns:['🏆 Ver conquistas','📤 Compartilhar']
    },
    weekly: {
      title:'📊 Resumo Semanal',
      body:`📈 *Seu resumo da semana:*\n✅ 5 dias com meta calórica atingida\n💧 Água em dia: 4/7 dias\n⚖️ Variação: -0,4kg\n🔥 Streak: ${APP.streak} dias`,
      btns:['📊 Ver relatório completo']
    },
    motivational: {
      title:'✨ Mensagem Motivacional',
      body:`✨ *Mensagem do dia*\n'Cada refeição saudável é uma vitória.\nVocê está construindo a melhor versão de si mesmo.'\n— Seu Coach IA 🤖`,
      btns:['🤖 Falar com Coach']
    },
  };

  const BOT_COMMANDS = [
    ['/hoje','Resumo completo do dia atual'],
    ['/agua','Registrar copo de água (+15 XP)'],
    ['/peso','Registrar novo peso'],
    ['/receita','Receita aleatória do seu perfil'],
    ['/progresso','Ver evolução em texto'],
    ['/pausar','Pausar notificações por 24h'],
    ['/parar','Desativar todas as notificações'],
    ['/ajuda','Lista de todos os comandos'],
  ];

  return `
  <div class="screen-header">
    <button onclick="navigate('settings')" class="btn btn-ghost" style="font-size:20px;padding:4px">←</button>
    <div class="screen-title">✈️ Telegram</div>
    ${tg.connected ? `<span class="tg-connected-badge" style="font-size:10px">✅ Ativo</span>` : '<div></div>'}
  </div>

  ${tg.connected ? renderTelegramConnected(tg, notifs, MSG_PREVIEWS, BOT_COMMANDS) : renderTelegramDisconnected()}`;
}

function renderTelegramDisconnected() {
  return `
  <!-- Hero -->
  <div style="text-align:center;padding:28px 20px;background:radial-gradient(ellipse at top,rgba(34,158,217,.15),transparent 60%)">
    <div style="font-size:64px;margin-bottom:12px;animation:tgFloat 2s ease-in-out infinite">✈️</div>
    <div style="font-family:var(--font-serif);font-size:22px;font-weight:700;margin-bottom:6px">VitalIA no Telegram</div>
    <div style="font-size:13px;color:var(--text2);line-height:1.65;max-width:320px;margin:0 auto">Receba lembretes, registre refeições e acompanhe seu progresso sem abrir o app.</div>
  </div>

  <!-- Features -->
  <div style="padding:0 16px;margin-bottom:16px">
    ${[
      ['🍽️','Lembretes inteligentes','Café, almoço, lanche e jantar com receita do dia'],
      ['💧','Hidratação','Lembrete a cada 2h com botões inline para registrar'],
      ['🔥','Streak em risco','Alerta antes de perder sua sequência de dias'],
      ['🏆','Conquistas','Notificação instantânea ao desbloquear badges'],
      ['📊','Resumo semanal','Relatório completo toda segunda-feira'],
      ['⌨️','Comandos do bot','8 comandos: /hoje /agua /peso /receita e mais'],
      ['📢','Canal oficial','Dicas diárias, receitas e novidades do app'],
      ['👥','Grupo comunidade','Desafios e suporte com outros usuários'],
    ].map(([e,t,d])=>`<div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
      <span style="font-size:22px;flex-shrink:0">${e}</span>
      <div><div style="font-size:13px;font-weight:700">${t}</div><div style="font-size:11px;color:var(--text2);margin-top:2px">${d}</div></div>
    </div>`).join('')}
  </div>

  <!-- Connect CTA -->
  <div style="padding:0 16px;margin-bottom:24px">
    <button class="tg-login-btn" onclick="openTelegramConnect()" style="margin-bottom:10px;font-size:15px;padding:15px">
      <span class="tg-plane">✈️</span> Conectar com Telegram
    </button>
    <div style="text-align:center;font-size:11px;color:var(--text3)">Também disponível: Login com Telegram</div>
    <button class="btn btn-outline btn-full" onclick="telegramLogin()" style="margin-top:8px;font-size:13px;padding:12px">✈️ Entrar com Telegram</button>
  </div>`;
}

function renderTelegramConnected(tg, notifs, previews, cmds) {
  const notifItems = [
    {key:'meals', icon:'🍽️', label:'Lembretes de refeição', sub:'Café, almoço, lanche e jantar'},
    {key:'water', icon:'💧', label:'Hidratação', sub:'A cada 2h até atingir a meta'},
    {key:'streak', icon:'🔥', label:'Streak em risco', sub:'2h antes de perder a sequência'},
    {key:'achievements', icon:'🏆', label:'Conquistas desbloqueadas', sub:'Badges e novos níveis de XP'},
    {key:'weekly', icon:'📊', label:'Resumo semanal', sub:'Todo lunes às 9h'},
    {key:'motivational', icon:'✨', label:'Mensagem motivacional', sub:'Uma vez ao dia, pela manhã'},
  ];

  return `
  <!-- Connected status -->
  <div style="padding:0 16px;margin-bottom:12px">
    <div class="tg-card">
      <div class="tg-card-header">
        <div class="tg-icon">✈️</div>
        <div style="flex:1">
          <div class="tg-title">@${tg.username||'usuario'}</div>
          <div class="tg-sub">Vinculado em ${tg.linkedAt ? new Date(tg.linkedAt).toLocaleDateString('pt-BR') : 'hoje'}</div>
        </div>
        <span class="tg-connected-badge">✅ Conectado</span>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-sm btn-outline" onclick="openModal('Alterar username',\`
          <div class='input-wrap'><label class='input-label'>Novo username do Telegram</label><div class='input-icon'><span class='icon'>@</span><input id='tg-new-un' class='input' placeholder='seuusername' value='${tg.username||''}'></div></div>
          <button class='btn btn-primary btn-full' onclick='changeTelegramUsername()' style='padding:13px'>Salvar</button>
        \`)" style="font-size:11px">✏️ Alterar @username</button>
        <button class="btn btn-sm btn-danger" onclick="disconnectTelegram()" style="font-size:11px">🔌 Desvincular</button>
      </div>
    </div>
  </div>

  <!-- Quick test -->
  <div style="padding:0 16px;margin-bottom:12px">
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px">
      <div style="font-size:12px;font-weight:700;margin-bottom:8px">⚡ Testar notificações</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${Object.keys(previews).map(k=>`<button class="btn btn-sm btn-outline" onclick="previewTgMessage('${k}')" style="font-size:11px">${previews[k].title.split(' ').slice(0,2).join(' ')}</button>`).join('')}
      </div>
    </div>
  </div>

  <!-- Notification toggles -->
  <div class="section-title">Tipos de notificação</div>
  <div style="padding:0 16px;margin-bottom:12px">
    ${notifItems.map(n=>`<div class="tg-notif-row" onclick="toggleTgNotif('${n.key}')">
      <div class="tg-notif-icon">${n.icon}</div>
      <div class="tg-notif-info">
        <div class="tg-notif-label">${n.label}</div>
        <div class="tg-notif-sub">${n.sub}</div>
      </div>
      <label class="toggle" onclick="event.stopPropagation()"><input type="checkbox" ${notifs[n.key]?'checked':''} onchange="toggleTgNotif('${n.key}',this.checked)"><div class="toggle-slider"></div></label>
    </div>`).join('')}
  </div>

  <!-- Message previews -->
  <div class="section-title">Preview de mensagens</div>
  <div style="padding:0 16px;margin-bottom:16px" id="tg-preview-area">
    <div style="font-size:12px;color:var(--text2);margin-bottom:10px">Toque em um tipo para visualizar</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
      ${Object.entries(previews).map(([k,v])=>`<button class="tab-btn" onclick="showMsgPreview('${k}')">${v.title.slice(0,2)}</button>`).join('')}
    </div>
    <div id="tg-msg-display" style="display:none"></div>
  </div>

  <!-- Bot commands -->
  <div class="section-title">Comandos do @VitalIABot</div>
  <div style="padding:0 16px;margin-bottom:16px">
    <div class="card">
      ${cmds.map(([cmd,desc])=>`<div class="tg-cmd-item">
        <div class="tg-cmd-code">${cmd}</div>
        <div class="tg-cmd-desc">${desc}</div>
      </div>`).join('')}
    </div>
    <div style="margin-top:10px;padding:10px 14px;background:rgba(34,158,217,.06);border-radius:var(--radius-sm);border:1px solid rgba(34,158,217,.15)">
      <div style="font-size:11px;color:#229ED9;font-weight:700;margin-bottom:4px">💡 Dica</div>
      <div style="font-size:11px;color:var(--text2)">No Telegram, você também pode usar <strong>botões inline</strong> nas mensagens — sem precisar digitar comandos!</div>
    </div>
  </div>

  <!-- Channel & Group -->
  <div class="section-title">Canal e Comunidade</div>
  <div style="padding:0 16px;margin-bottom:16px">
    ${[
      {icon:'📢',name:'@VitalIAOficial',desc:'Canal oficial — dicas diárias e receitas em destaque',link:'t.me/VitalIAOficial',key:'channelSubscribed',label:'Assinar canal'},
      {icon:'👥',name:'Grupo VitalIA',desc:'Comunidade de saúde — desafios e suporte mútuo',link:'t.me/VitalIAComunidade',key:'groupJoined',label:'Entrar no grupo'},
    ].map(item=>`<div style="background:var(--surface);border:1px solid ${tg[item.key]?'rgba(34,158,217,.25)':'var(--border)'};border-radius:var(--radius);padding:14px;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <span style="font-size:28px">${item.icon}</span>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:700;color:#229ED9">${item.name}</div>
          <div style="font-size:11px;color:var(--text2);margin-top:2px">${item.desc}</div>
        </div>
        ${tg[item.key] ? `<span class="tg-connected-badge" style="font-size:10px">✅ Membro</span>` : ''}
      </div>
      <a href="https://${item.link}" target="_blank" style="text-decoration:none">
        <button class="tg-login-btn" onclick="event.preventDefault();joinTgChannel('${item.key}')" style="margin:0;padding:10px;font-size:13px">
          ${tg[item.key] ? `✈️ Abrir no Telegram` : `<span class='tg-plane'>✈️</span> ${item.label}`}
        </button>
      </a>
    </div>`).join('')}
  </div>

  <!-- Security note -->
  <div style="padding:0 16px;margin-bottom:24px">
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:14px">
      <div style="font-size:12px;font-weight:700;margin-bottom:6px">🔒 Segurança do Telegram Auth</div>
      <div style="font-size:11px;color:var(--text2);line-height:1.65">
        • Validação HMAC-SHA256 obrigatória<br>
        • Tokens expiram em 86.400s (24h)<br>
        • Cada autenticação gera hash único<br>
        • Log de todos os acessos via Telegram<br>
        • Alerta ao logar em novo dispositivo
      </div>
    </div>
  </div>`;
}

// ── Telegram helper functions ──────────
window.toggleTgNotif = function(key, val) {
  if(!APP.telegram) return;
  if(val===undefined) val = !APP.telegram?.notifs?.[key];
  APP.telegram.notifs = APP.telegram?.notifs || {};
  APP.telegram.notifs[key] = val;
  saveTelegram();
  toast(`${val?'✅':'❌'} Notificação ${key} ${val?'ativada':'desativada'}`, val?'success':'info');
};

window.disconnectTelegram = function() {
  openModal('Desvincular Telegram', `
    <div style="text-align:center;padding:8px 0">
      <div style="font-size:40px;margin-bottom:10px">🔌</div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:16px">Você não receberá mais notificações via Telegram e perderá acesso aos comandos do bot.</div>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-danger" style="flex:1" onclick="confirmDisconnectTelegram()">Desvincular</button>
      <button class="btn btn-outline" style="flex:1" onclick="closeModal()">Cancelar</button>
    </div>
  `);
};

window.confirmDisconnectTelegram = function() {
  APP.telegram = null;
  localStorage.removeItem('v_telegram');
  closeModal();
  toast(t('toast_tg_off'), 'info');
  navigate('telegram');
};

window.changeTelegramUsername = function() {
  const un = document.getElementById('tg-new-un')?.value.trim().replace('@','');
  if(!un){ toast(t('toast_tg_user'),'error'); return; }
  APP.telegram = APP.telegram || {};
  if(APP.telegram) APP.telegram.username = un;
  saveTelegram();
  closeModal();
  toast(`✅ Username atualizado para @${un}`, 'success');
  navigate('telegram');
};

window.joinTgChannel = function(key) {
  APP.telegram = APP.telegram || {};
  APP.telegram[key] = true;
  saveTelegram();
  toast(`✅ ${key==='channelSubscribed'?'Canal assinado':'Grupo acessado'}! Redirecionando...`, 'success');
  navigate('telegram');
};

window.previewTgMessage = function(type) {
  const previews = {
    meal: { title:'⏰ Lembrete de Refeição', body:`🍳 *Café da manhã* — 07:30\nHoje no seu plano: Omelete de espinafre\n📊 Meta: 280kcal | 20g proteína`, btns:['✅ Já comi','⏰ +15min','📖 Ver receita'] },
    water: { title:'💧 Hidratação', body:`💧 *Hidratação*\nVocê tomou ${APP.water} de ${APP.calc?.aguaCopos||8} copos hoje.\nBeba mais um agora! 🌊`, btns:['✅ Bebi um copo','💧 +500ml'] },
    streak: { title:'🔥 Streak em Risco', body:`🔥 *Atenção, ${APP.profile?.name?.split(' ')[0]||'Você'}!*\nSua sequência de *${APP.streak} dias* termina em 2 horas.`, btns:['📸 Registrar refeição'] },
    achievement: { title:'🏆 Conquista!', body:`🎖️ *PARABÉNS!*\nVocê desbloqueou o badge *'7 Dias Seguidos'*!\nIsso é dedicação de verdade. Continue! 🚀`, btns:['🏆 Ver conquistas','📤 Compartilhar'] },
    weekly: { title:'📊 Resumo Semanal', body:`📈 *Seu resumo da semana:*\n✅ 5 dias com meta atingida\n💧 Água: 4/7 dias\n🔥 Streak: ${APP.streak} dias`, btns:['📊 Ver relatório'] },
    motivational: { title:'✨ Motivação', body:`✨ *Mensagem do dia*\n'Cada refeição saudável é uma vitória.'\n— Seu Coach IA 🤖`, btns:['🤖 Falar com Coach'] },
  };
  const p = previews[type];
  if(!p) return;
  openModal(p.title, `
    <div style="background:#212d3b;border-radius:12px;padding:16px;margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#229ED9,#1a8bbf);display:flex;align-items:center;justify-content:center;font-size:18px">✈️</div>
        <div><div style="font-size:13px;font-weight:700;color:#fff">@VitalIABot</div><div style="font-size:10px;color:#7a9ab8">Bot de saúde</div></div>
      </div>
      <div class="tg-message-preview" style="background:#2b3b4e;border-left-color:#229ED9;color:#cdd9e5">${p.body.replace(/\n/g,'<br>').replace(/\*(.*?)\*/g,'<strong>$1</strong>')}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
        ${p.btns.map(b=>`<div class="tg-btn-inline">${b}</div>`).join('')}
      </div>
    </div>
    <div style="font-size:11px;color:var(--text3);text-align:center">Preview da mensagem no Telegram</div>
    <button class="btn btn-primary btn-full" onclick="toast('Mensagem de teste enviada para @${APP.telegram?.username||'VoceAqui'}!','success');closeModal()" style="margin-top:12px;padding:12px">📤 Enviar mensagem de teste</button>
  `);
};

window.showMsgPreview = function(k) {
  const previews = {
    meal: `🍳 *Café da manhã* — 07:30\nHoje no seu plano: Omelete de espinafre\n📊 Meta: 280kcal | 20g proteína\n👆 [Ver receita](t.me/VitalIABot)`,
    water: `💧 *Hidratação*\nVocê tomou ${APP.water} de ${APP.calc?.aguaCopos||8} copos hoje.\nBeba mais um agora! 🌊`,
    streak: `🔥 *Atenção, ${APP.profile?.name?.split(' ')[0]||'Você'}!*\nSua sequência de *${APP.streak} dias* termina em 2 horas.\nRegistre uma refeição! 💪`,
    achievement: `🎖️ *PARABÉNS!*\nVocê desbloqueou o badge *'7 Dias Seguidos'*!\nContinue! 🚀`,
    weekly: `📈 *Seu resumo da semana:*\n✅ 5 dias com meta atingida\n💧 Água: 4/7 dias\n⚖️ Variação: -0,4kg\n🔥 Streak: ${APP.streak} dias`,
    motivational: `✨ *Mensagem do dia*\n'Cada refeição saudável é uma vitória.'\n— Coach IA 🤖`,
  };
  const icons = {meal:'🍽️',water:'💧',streak:'🔥',achievement:'🏆',weekly:'📊',motivational:'✨'};
  const btns = {
    meal:['✅ Já comi','⏰ +15min','📖 Ver receita'],
    water:['✅ Bebi!','💧 +500ml'],
    streak:['📸 Registrar refeição'],
    achievement:['🏆 Ver conquistas','📤 Compartilhar'],
    weekly:['📊 Ver relatório completo'],
    motivational:['🤖 Falar com Coach'],
  };
  const el = document.getElementById('tg-msg-display');
  if(!el) return;
  const safePreview = escapeHTML(previews[k] || '').replace(/\n/g,'<br>').replace(/\*(.*?)\*/g,'<strong style="color:#fff">$1</strong>');
  el.style.display = 'block';
  el.innerHTML = `
    <div style="background:#1a2635;border-radius:12px;padding:14px;border:1px solid rgba(34,158,217,.2)">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#229ED9,#1a8bbf);display:flex;align-items:center;justify-content:center;font-size:16px">✈️</div>
        <div style="font-size:12px;font-weight:700;color:#7ab8d9">@VitalIABot</div>
      </div>
      <div style="background:#2b3b4e;border-radius:8px;padding:12px;font-size:12px;color:#cdd9e5;line-height:1.7;font-family:'Courier New',monospace;margin-bottom:8px">${safePreview}</div>
      <div style="display:flex;gap:5px;flex-wrap:wrap">${(btns[k]||[]).map(b=>`<div class="tg-btn-inline">${b}</div>`).join('')}</div>
    </div>
  `;
  el.scrollIntoView({behavior:'smooth',block:'nearest'});
};

function renderBodyTwin() {
  return `
  <div class="screen-header"><div class="screen-title">${vitaliaIcon('bodytwin')} ${t('bodytwin_title')} <span class="smart-badge">${t('bodytwin_beta')}</span></div></div>
  <section class="bodytwin-shell">
    <div class="bodytwin-hero premium-card">
      <div class="bodytwin-orb">${vitaliaIcon('bodytwin')}</div>
      <div>
        <h2>${t('bodytwin_title')}</h2>
        <p>${t('bodytwin_intro')}</p>
      </div>
    </div>
    <div id="bodytwin-root" class="bodytwin-root" data-ready="0">
      <div class="bodytwin-stage" id="bodytwin-stage">
        <div class="bodytwin-loading">Calibrando seu Body Twin...</div>
      </div>
      <div id="bodytwin-preview-btns" class="bodytwin-preview-btns"></div>
      <div class="bodytwin-actions">
        <select class="input" id="bodytwin-goal">
          <option value="health">Saúde</option>
          <option value="weight_loss">Emagrecimento</option>
          <option value="hypertrophy">Hipertrofia</option>
          <option value="definition">Definição</option>
          <option value="performance">Performance</option>
          <option value="recomposition">Recomposição</option>
        </select>
        <button class="btn btn-primary btn-full" onclick="window.BodyTwin?.captureBodyImage?.('camera')">${vitaliaIcon('scanner')} ${t('bodytwin_take_photo')}</button>
        <button class="btn btn-outline btn-full" style="margin-top:8px" onclick="window.BodyTwin?.captureBodyImage?.('gallery')">${t('bodytwin_upload_photo')}</button>
        <label class="bodytwin-toggle"><input type="checkbox" id="bodytwin-save-photo"> ${t('bodytwin_privacy_toggle')}</label>
      </div>
      <div class="bodytwin-hints card">${t('bodytwin_capture_hints')}</div>
      <div id="bodytwin-snapshots" class="bodytwin-snapshots"></div>
      <div class="bodytwin-disclaimer">${t('bodytwin_disclaimer')}</div>
      <button class="bodytwin-tech-link" onclick="window.BodyTwin?.togglePoseDebugMode?.()"><span id="bodytwin-tech-label">${t('bodytwin_technical_mode')}</span></button>
      <button class="btn btn-danger btn-full" style="margin-top:12px" onclick="window.BodyTwin?.deleteAllBodyTwinData?.()">${t('bodytwin_delete_all')}</button>
    </div>
  </section>`;
}

function renderMore() {
  const items = [
    {id:'fasting',label:t('more_fasting'),desc:t('more_fasting_d'),badge:'Timer'},
    {id:'scanner',label:t('more_scanner'),desc:t('more_scanner_d'),badge:'Vision'},
    {id:'coach',icon:'🤖',label:t('more_coach'),desc:t('more_coach_d'),badge:'IA'},
    {id:'bodytwin',label:t('bodytwin_title'),desc:t('bodytwin_menu_desc'),badge:t('bodytwin_beta')},
    {id:'progress',label:t('more_progress'),desc:t('more_progress_d'),badge:'Live'},
    {id:'achievements',label:t('more_achiev'),desc:t('more_achiev_d'),badge:'XP'},
    {id:'shopping',label:t('more_shop'),desc:t('more_shop_d'),badge:'Plan'},
    {id:'analytics',label:t('more_weekly_reports'),desc:t('more_weekly_reports_d'),badge:'Chart'},
    {id:'community',label:t('more_community'),desc:t('more_community_d'),badge:'Beta'},
    {id:'telegram',label:'Telegram',desc:APP.telegram?.connected?`@${APP.telegram?.username}`:t('more_telegram_d'),badge:APP.telegram?.connected?'Online':'Bot'},
    {id:'integrations',label:t('more_integrations'),desc:t('more_integrations_d'),badge:'API'},
    {id:'premium',label:t('more_subscription'),desc:t('more_subscription_d'),badge:t('settings_active')},
    {id:'settings',label:t('more_settings'),desc:t('more_settings_d'),badge:t('settings_active')},
  ];
  return `
  <div class="screen-header"><div class="screen-title">${vitaliaIcon('more')} ${t('more_title')}</div></div>
  <div style="padding:0 16px">
    ${items.map(item=>`<div class="v-more-item" style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:6px;cursor:pointer;transition:all .2s" onclick="navigate('${item.id}')" onmouseover="this.style.borderColor='var(--green)'" onmouseout="this.style.borderColor='var(--border)'">
      <div class="more-icon-premium" style="flex-shrink:0">${vitaliaIcon(item.id)}</div>
      <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px;justify-content:space-between"><div style="font-size:14px;font-weight:700;color:#fff">${item.label}</div><span class="smart-badge">${item.badge}</span></div><div style="font-size:11px;color:var(--text3);margin-top:2px">${item.desc}</div></div>
      <span style="color:var(--text3);font-size:18px">›</span>
    </div>`).join('')}
  </div>
  <div style="padding:12px 16px 8px">
    <div class="premium-card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="font-size:22px">${vitaliaIcon('premium')}</span><div class="premium-title">${t('more_active_plan')}</div></div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:12px">${t('more_active_plan_desc')}</div>
      <button class="btn btn-primary btn-full" onclick="navigate('premium')" style="padding:12px">${t('settings_view_subscription')}</button>
    </div>
  </div>`;
}



/* ═══════════════════════════════════════
   COMPARTILHAMENTO REAL NAS REDES SOCIAIS
═══════════════════════════════════════ */
function buildShareText() {
  const p = APP.profile||{};
  const diff = Math.abs(+((APP.weightHistory?.[APP.weightHistory.length-1]?.peso||p.weight||78)-(p.weight||78)).toFixed(1));
  const score = calcDailyScore();
  return `🌿 Estou usando o VitalIA para cuidar da minha saúde!\n\n` +
    `📊 Score hoje: ${score}/100\n` +
    `🔥 Streak: ${APP.streak} dias\n` +
    `⚡ XP total: ${APP.xp}\n` +
    `${diff > 0 ? `⚖️ Perdi ${diff}kg até agora!\n` : ''}` +
    `\n✅ App premium de nutrição com IA\n` +
    `👇 Acesse: https://elicarlosiurd-sudo.github.io/aplicativo-vitalia/index.html`;
}

window.shareToNetwork = function(network) {
  const text = buildShareText();
  const url = 'https://elicarlosiurd-sudo.github.io/aplicativo-vitalia/index.html';
  const encoded = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);
  
  const links = {
    whatsapp: `https://wa.me/?text=${encoded}`,
    twitter: `https://twitter.com/intent/tweet?text=${encoded}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encoded}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    instagram: null, // Instagram não suporta deep link de texto
    tiktok: null,
  };
  
  if(links[network]) {
    window.open(links[network], '_blank', 'noopener');
    toast(t('toast_share_open')+' 🎉','success');
  } else if(network === 'instagram' || network === 'tiktok') {
    // Copy to clipboard for Instagram/TikTok
    navigator.clipboard?.writeText(text).then(()=>{
      toast(`Texto copiado! Cole na bio do ${network==='instagram'?'Instagram':'TikTok'} 📋`,'success',4000);
    }).catch(()=>{
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      toast(t('toast_clipboard')+' 📋','success',4000);
    });
  } else {
    // Native share API
    if(navigator.share) {
      navigator.share({title:'VitalIA', text, url})
        .then(()=>toast(t('toast_shared'),'success'))
        .catch(()=>{});
    } else {
      navigator.clipboard?.writeText(text+' '+url);
      toast(t('toast_link_copied')+' 📋','success');
    }
  }
};

window.shareCoachHistory = function() {
  const history = APP.coachMsgs.slice(-20).map(m => {
    const role = m.role==='user' ? 'Eu' : 'Coach IA';
    const text = (m.text||'').replace(/<[^>]*>/g,'').substring(0,200);
    return role + ': ' + text;
  }).join('\n\n');
  const p = APP.profile || {};
  const shareText = [
    'Minha conversa com o Coach IA VitalIA',
    '',
    history,
    '',
    'App VitalIA - Saude com Inteligencia',
    'https://elicarlosiurd-sudo.github.io/aplicativo-vitalia/index.html'
  ].join('\n');
  if(navigator.share) {
    navigator.share({title:'Coach IA VitalIA', text: shareText})
      .then(()=>toast(t('toast_shared'),'success'))
      .catch(()=>{});
  } else if(navigator.clipboard) {
    navigator.clipboard.writeText(shareText).then(()=>toast(t('toast_history'),'success'));
  } else {
    toast(t('toast_no_share'),'info');
  }
};

window.shareNative = function() {
  const text = buildShareText();
  const url = 'https://elicarlosiurd-sudo.github.io/aplicativo-vitalia/index.html';
  if(navigator.share) {
    navigator.share({title:'Meu Progresso VitalIA', text, url})
      .then(()=>toast(t('toast_shared'),'success'))
      .catch(()=>{});
  } else {
    shareToNetwork('whatsapp');
  }
};

/* ═══════════════════════════════════════
   EXPORTAR HISTÓRICO COMPLETO
═══════════════════════════════════════ */
window.exportFullHistory = function() {
  const p = APP.profile||{};
  const u = APP.user||{};
  const hoje = new Date().toLocaleDateString('pt-BR');
  
  let report = `╔══════════════════════════════════════╗
║      RELATÓRIO COMPLETO VITALIA      ║
╚══════════════════════════════════════╝

📋 PERFIL
Nome: ${p.name||u.name||'—'}
Email: ${u.email||'—'}
Peso inicial: ${p.weight||'—'}kg
Altura: ${p.height||'—'}cm
Idade: ${p.age||'—'} anos
Objetivo: ${p.goal==='lose'?'Emagrecer':p.goal==='gain'?'Ganhar massa':'Manter peso'}
Gerado em: ${hoje}

📊 ESTATÍSTICAS
Score hoje: ${calcDailyScore()}/100
Streak atual: ${APP.streak} dias
XP total: ${APP.xp} pontos
Refeições hoje: ${APP.meals.length}
Água hoje: ${APP.water} copos

⚖️ HISTÓRICO DE PESO
${(APP.weightHistory||[]).map(w=>`${w.date}: ${w.peso}kg`).join('\n')||'Sem registros'}

🍽️ REFEIÇÕES DE HOJE
${APP.meals.map(m=>`${m.time||'—'}: ${m.name} (${getKcal(m)}kcal | P:${m.prot}g C:${m.carb}g G:${m.fat}g)`).join('\n')||'Sem refeições registradas'}

💬 HISTÓRICO DO COACH IA (últimas mensagens)
${APP.coachMsgs.slice(-10).map(m=>`[${m.time}] ${m.role==='user'?'Você':'Coach'}: ${m.text?.substring(0,100)}`).join('\n')||'Sem conversas'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VitalIA — Saúde com Inteligência 🌿
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  // Download as .txt
  const blob = new Blob([report], {type:'text/plain;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `VitalIA_Historico_${p.name?.replace(' ','_')||'usuario'}_${hoje.replace(/\//g,'-')}.txt`;
  a.click();
  toast('📄 '+t('toast_exported'),'success',3000);
  addXP(10);
};

/* ═══════════════════════════════════════
   LEMBRETE DE ANIVERSÁRIO
═══════════════════════════════════════ */
window.exportFullHistory = async function() {
  try {
    var session = (await sb.auth.getSession())?.data?.session || null;
    if (!session?.user) { toast('Entre na sua conta para exportar seus dados.', 'info'); return; }
    var userId = session.user.id;
    var tables = ['perfis','refeicoes','hidratacao','peso_historico','humor','gamificacao','coach_memories','coach_messages','coach_usage_daily','privacy_consents','privacy_deletion_requests'];
    var exportData = {
      exported_at: new Date().toISOString(),
      app: 'VitalIA',
      terms_version: CONFIG.TERMS_VERSION,
      privacy_version: CONFIG.PRIVACY_VERSION,
      user: sanitizeDbObject({ id: userId, email: session.user.email }),
      data: {}
    };
    for (var i=0;i<tables.length;i++) {
      var table = tables[i];
      var query = sb.from(table).select('*');
      if (table === 'perfis') query = query.eq('id', userId);
      else query = query.eq('user_id', userId);
      var res = await query;
      exportData.data[table] = sanitizeDbObject(res.data || []);
    }
    var blob = new Blob([JSON.stringify(exportData, null, 2)], {type:'application/json;charset=utf-8'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'VitalIA_Dados_' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
    toast('Dados exportados com segurança.', 'success', 3000);
    addXP(10);
  } catch(e) {
    console.warn('[VitalIA] Exportação indisponível:', e);
    toastFriendlyError('export', e);
  }
};

function checkBirthdayReminder() {
  const p = APP.profile||{};
  if(!p.dob) return;
  const hoje = new Date();
  const nasc = new Date(p.dob);
  if(nasc.getMonth()===hoje.getMonth() && nasc.getDate()===hoje.getDate()) {
    const idade = hoje.getFullYear() - nasc.getFullYear();
    setTimeout(()=>{
      openModal('🎂 Feliz Aniversário!', `
        <div style="text-align:center;padding:16px 0">
          <div style="font-size:64px;margin-bottom:12px">🎂</div>
          <div style="font-family:var(--font-serif);font-size:22px;font-weight:700;margin-bottom:8px">Feliz ${idade}° Aniversário!</div>
          <div style="font-size:13px;color:var(--text2);margin-bottom:16px">${p.name?.split(' ')[0]||'Usuário'}, hoje é um dia especial! 🎉</div>
          <div style="background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.2);border-radius:var(--radius);padding:14px;margin-bottom:16px;font-size:12px;color:var(--text2)">
            🥗 <strong>Dica nutricional do seu aniversário:</strong><br>
            Celebre com moderação — um pedaço de bolo está liberado! O que importa é a consistência ao longo do ano. Você já foi tão longe! 💪
          </div>
          <button class="btn btn-primary btn-full" onclick="confetti();addXP(50);closeModal();toast('🎂 '+t('toast_birthday'),'success',4000)" style="padding:13px">🎉 Ganhar 50 XP de presente!</button>
        </div>
      `);
    }, 3000);
  }
}
