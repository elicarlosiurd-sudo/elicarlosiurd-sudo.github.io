/* ═══════════════════════════════════════
   V230-E2 — js/core/boot.js
   Ex-bloco principal do index.html L5302–5970 (extração literal, ordem preservada).
   Conteúdo: START: defaults, aniversário, DOMContentLoaded, auth listener
═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   START
═══════════════════════════════════════ */
/* Premium UX overrides - Item 3 */
function coachOpeningInsight() {
  const r = weeklyReportData();
  if (r.proteinPct >= 95) return 'Percebi que sua proteína está forte hoje. Mantenha essa distribuição nas próximas refeições.';
  if (r.waterPct < 70) return 'Sua hidratação está abaixo do alvo inteligente. Vamos antecipar água antes do fim do dia.';
  if ((APP.meals||[]).length >= 3) return 'Você já registrou boas refeições hoje. Posso ajustar o jantar ao seu objetivo principal.';
  return 'Vou usar seu perfil, objetivo, refeições, água e histórico recente para responder com mais contexto.';
}


function openSevenDayPlan(day) {
  const protein = APP.calc?.prot || 120;
  const days = t('plan7_days');
  const items = t('plan7_items');
  openModal(t('home_plan_7'), `${items.map((x,i)=>`<div class="ingredient-item"><div class="step-num">${i+1}</div><div class="step-text">${x}<br><span style="color:var(--text3);font-size:11px">${days[day] || days[0]} · ${t('plan7_meta')} ${protein}g ${t('home_protein')}</span></div></div>`).join('')}<button class="btn btn-primary btn-full" onclick="closeModal();navigate('recipes')" style="margin-top:12px;padding:12px">${t('plan7_button')}</button>`);
}

REC.premium = REC.premium || {goal:'all', time:'all', protein:'all', carb:'all', budget:'all'};
function setPremiumFilter(k,v){ REC.premium[k]=v; document.getElementById('rec-list').innerHTML=renderRecipeList(); }

function normalizeRecipeFilterKey(value) {
  var s = normalizeSearchText(value);
  var map = {
    lose:'weight_loss', emagrecimento:'weight_loss', adelgazamiento:'weight_loss', похудение:'weight_loss',
    gain:'muscle_gain', massa:'muscle_gain', muscle:'muscle_gain', muscle_gain:'muscle_gain',
    vegano:'vegan', vegan:'vegan', веганское:'vegan',
    'sem gluten':'gluten_free', 'sin gluten':'gluten_free', gluten_free:'gluten_free',
    'low carb':'low_carb', low_carb:'low_carb', 'baixo carbo':'low_carb',
    'alta proteina':'high_protein', high_protein:'high_protein', protein:'high_protein',
    'sem lactose':'lactose_free', lactose_free:'lactose_free',
    detox:'detox', prebiotico:'prebiotic', prebiotic:'prebiotic',
    gestante:'pregnant', pregnant:'pregnant', menstrual:'menstrual',
    'pre treino':'pre_workout', pre_workout:'pre_workout',
    'pos treino':'post_workout', post_workout:'post_workout',
    omega3:'omega3', 'omega 3':'omega3', ferro:'iron', iron:'iron',
    'anti inflamatorio':'anti_inflammatory', anti_inflammatory:'anti_inflammatory'
  };
  return map[s] || s.replace(/-/g, '_');
}

function recipeSearchText(r) {
  return [
    r.name, r.nome, r.title, r.foco, r.focus, r.enfoque, r.cat, r.goal,
    (r.tags || []).join(' '), (r.filterKeys || []).join(' '), recipeUniversalSearchAliases(r),
    recipeArray(r.ingredients || r.ingredientes).join(' '),
    recipeArray(r.steps || r.preparo || r.directions || r.preparacion).join(' ')
  ].join(' ');
}

function recipeUniversalSearchAliases(r) {
  var out = [];
  var catAliases = {
    breakfast:'breakfast cafe café desayuno завтрак morning manha manhã',
    lunch:'lunch almoco almoço almuerzo обед',
    dinner:'dinner jantar cena ужин',
    snack:'snack lanche merienda перекус полдник'
  };
  if (catAliases[r.cat]) out.push(catAliases[r.cat]);
  var keys = Array.isArray(r.filterKeys) && r.filterKeys.length ? r.filterKeys : recipeFilterKeysFromText([
    r.name, r.nome, r.title, r.foco, r.focus, r.enfoque, r.cat, r.goal,
    (r.tags || []).join(' '),
    recipeArray(r.ingredients || r.ingredientes).join(' ')
  ].join(' '), {prot:r.prot, protein:r.prot, carb:r.carb, fat:r.fat});
  keys.forEach(function(k){
    var m = {
      weight_loss:'weight loss emagrecimento adelgazar adelgazamiento похудение снижение веса',
      muscle_gain:'muscle gain massa hipertrofia masa muscular набор массы',
      vegan:'vegan vegano веган',
      gluten_free:'gluten free sem gluten sem glúten sin gluten без глютена',
      low_carb:'low carb baixo carbo baixo carboidrato bajo carbohidrato низкоуглеводный',
      high_protein:'high protein alta proteina alta proteína alto proteico белок много белка protein proteina proteína',
      lactose_free:'lactose free sem lactose sin lactosa без лактозы',
      detox:'detox детокс',
      prebiotic:'prebiotic prebiotico prebiótico пребиотик',
      pregnant:'pregnancy gestante embarazo беременность',
      menstrual:'period menstrual periodo período менструальный цикл',
      pre_workout:'pre workout pre treino pré treino pre entreno до тренировки',
      post_workout:'post workout pos treino pós treino post entreno после тренировки',
      omega3:'omega omega3 omega 3 ômega омега',
      iron:'iron ferro hierro железо',
      anti_inflammatory:'anti inflammatory anti inflamatorio anti-inflamatorio противовоспалительный'
    };
    if (m[k]) out.push(m[k]);
  });
  return out.join(' ');
}

function recipeFilterKeys(r) {
  if (Array.isArray(r.filterKeys) && r.filterKeys.length) return r.filterKeys;
  var keys = recipeFilterKeysFromText([
    r.name, r.nome, r.title, r.foco, r.focus, r.enfoque, r.cat, r.goal,
    (r.tags || []).join(' '),
    recipeArray(r.ingredients || r.ingredientes).join(' '),
    recipeArray(r.steps || r.preparo || r.directions || r.preparacion).join(' ')
  ].join(' '), {prot:r.prot, protein:r.prot, carb:r.carb, fat:r.fat});
  if (r.goal === 'lose') keys.push('weight_loss');
  if (r.goal === 'gain') keys.push('muscle_gain');
  if (r.special === 'gestante' || r.special === 'pregnant') keys.push('pregnant');
  return Array.from(new Set(keys.map(normalizeRecipeFilterKey)));
}

function coachRecipeReason(r) { if ((APP.profile?.goal === 'gain') && Number(r.prot||0) >= 25) return t('recipe_reason_gain'); if ((APP.profile?.goal === 'lose') && Number(r.cal||999) <= 420) return t('recipe_reason_lose'); if (Number(r.carb||0) <= 18) return t('recipe_reason_lowcarb'); return t('recipe_reason_default'); }

function renderHydration() {
  const target = smartHydrationTarget(), pct = Math.min(100, Math.round((APP.water/target.cups)*100)), hist = WATER_HISTORY;
  const weatherText = target.temp ? climateName(APP.waterContext.climate) + ' · ' + target.temp + '°C · ' + target.weatherLabel : climateName(APP.waterContext.climate) + ' · ajuste manual';
  return `<div class="screen-header"><div class="screen-title">${vitaliaIcon('hydration')} ${t('hydration_smart')}</div></div><div style="padding:0 16px 12px;color:var(--text2);font-size:12px;line-height:1.55">${t('hydration_copy')}</div><div class="water-hero"><div style="position:relative;width:190px;height:190px;margin:0 auto 18px">${svgRing(190,14,pct,'var(--blue)','rgba(56,200,255,.16)')}<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column"><div class="water-big-num">${APP.water}</div><div style="font-size:12px;color:var(--text3)">${t('home_cups_of')} ${target.cups} ${t('unit_cups')}</div><div style="font-size:11px;color:var(--blue)">${target.ml}ml · ${pct}%</div></div></div></div><div style="padding:0 16px;margin-bottom:12px"><div class="card card-blue"><div style="font-size:12px;font-weight:700;color:var(--blue);margin-bottom:8px">${t('hydration_by_weight')}</div><div style="font-size:12px;color:var(--text2);line-height:1.7">${t('hydration_base')}: ${target.base}ml · ${t('hydration_activity')}: +${target.activityExtra}ml · ${t('hydration_climate')}: ${target.climateExtra>=0?'+':''}${target.climateExtra}ml<br>${t('hydration_reading')}: ${weatherText}</div><button class="btn btn-outline btn-full" onclick="updateWeatherHydration(true);toast('Buscando clima real...','info')" style="margin-top:10px;padding:10px">${t('hydration_update_weather')}</button></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 16px;margin-bottom:12px"><select class="input" onchange="APP.waterContext.climate=this.value;APP.waterContext.weatherLabel='manual';save('v_water_context',APP.waterContext);navigate('hydration')"><option value="normal" ${APP.waterContext.climate==='normal'?'selected':''}>${t('hydration_normal')}</option><option value="hot" ${APP.waterContext.climate==='hot'?'selected':''}>${t('hydration_hot')}</option><option value="very_hot" ${APP.waterContext.climate==='very_hot'?'selected':''}>${t('hydration_very_hot')}</option><option value="cold" ${APP.waterContext.climate==='cold'?'selected':''}>${t('hydration_cold')}</option></select><input class="input" type="number" value="${APP.waterContext.activityMinutes||45}" onchange="APP.waterContext.activityMinutes=parseInt(this.value||0);save('v_water_context',APP.waterContext);navigate('hydration')" placeholder="${t('hydration_training_min')}"></div><div class="water-liquid-cups">${Array.from({length:target.cups},(_,i)=>`<div class="water-capsule ${i<APP.water?'filled':''}" onclick="setWater(${i+1})"></div>`).join('')}</div><div class="water-buttons">${[[250,'250ml'],[500,'500ml'],[750,'750ml'],[1000,'1L']].map(([ml,l])=>`<button class="water-add-btn" onclick="addWater(${ml})">${vitaliaIcon('hydration')} ${l}</button>`).join('')}</div><div style="padding:0 16px;margin:16px 0"><div class="card"><div style="font-size:12px;font-weight:700;margin-bottom:8px">${t('hydration_alerts')}</div><div style="font-size:12px;color:var(--text2);line-height:1.7">${t('hydration_alerts_desc')}</div><button class="btn btn-outline btn-full" onclick="requestVitalIANotifications(true)" style="margin-top:10px;padding:10px">${t('hydration_enable_alerts')}</button></div></div><div class="section-title">${t('hydration_last7')}</div><div style="padding:0 16px;margin-bottom:16px"><div class="history-bar-row">${hist.map(h=>`<div class="history-bar" style="height:${Math.round((h/Math.max(...hist))*100)}%;background:${h>=target.cups?'var(--blue)':'rgba(56,189,248,.3)'}"></div>`).join('')}</div></div>`;
}

function renderFasting() {
  const proto = PROTOCOLS.find(p=>p.id===FAST.protocol)||PROTOCOLS[0], elapsed = FAST.active && FAST.startTime ? Math.min((Date.now()-FAST.startTime)/3600000, proto.fast || 1) : 0, pct = proto.fast>0 ? Math.round((elapsed/proto.fast)*100) : 0, history = APP.fastingHistory || [];
  return `<div class="screen-header"><div class="screen-title">${vitaliaIcon('fasting')} ${t('fasting_elite')}</div></div><div class="fast-hero v-fasting-card"><div style="position:relative;width:210px;height:210px;margin:0 auto 16px">${svgRing(210,14,pct,'var(--purple)','#1e2530')}<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column"><div class="fast-time" style="color:var(--purple)">${formatTime(elapsed*3600)}</div><div style="font-size:11px;color:var(--text3)">${FAST.active?t('home_cups_of')+' '+proto.fast+'h':t('fasting_eating_window')}</div><div style="font-size:11px;font-weight:700;color:var(--purple);text-transform:uppercase">${FAST.protocol}</div></div></div><button class="btn btn-primary btn-full" onclick="toggleFast()" style="padding:15px;max-width:280px;margin:0 auto;display:block;background:${FAST.active?'rgba(248,113,113,.15)':'var(--gradient)'};color:${FAST.active?'var(--red)':'#000'}">${FAST.active?t('stop_fast'):t('start_fast')}</button></div><div class="section-title">${t('fasting_protocols')}</div><div style="padding:0 16px;margin-bottom:14px">${PROTOCOLS.map(p=>`<div class="protocol-card v-fasting-card ${FAST.protocol===p.id?'active':''}" onclick="FAST.protocol='${p.id}';navigate('fasting')"><div style="min-width:0"><div class="protocol-name">${p.name}</div><div class="protocol-desc">${fastingProtocolDesc(p.id)}</div></div>${FAST.protocol===p.id?'<span style="color:var(--purple)">✓</span>':'›'}</div>`).join('')}</div><div style="padding:0 16px;margin-bottom:14px"><div class="card card-blue v-fasting-card"><div style="font-size:12px;font-weight:700;color:var(--blue);margin-bottom:6px">${t('hydration_alerts')}</div><div style="font-size:12px;color:var(--text2);line-height:1.7">${t('fasting_alerts_desc')}</div></div></div><div class="section-title">${t('fast_history')}</div><div style="padding:0 16px;margin-bottom:16px">${history.length?history.slice(0,6).map(h=>`<div class="v-fasting-card" style="display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)"><span style="font-size:13px">${h.protocol}</span><span style="font-size:12px;color:var(--text2);text-align:right">${h.hours}h · ${h.date}</span></div>`).join(''):'<div class="card v-fasting-card" style="font-size:12px;color:var(--text2)">'+t('fasting_history_empty')+'</div>'}</div>`;
}
function toggleFast() { if (FAST.active) { const proto = PROTOCOLS.find(p=>p.id===FAST.protocol)||PROTOCOLS[0], hours = Math.max(.1, ((Date.now()-FAST.startTime)/3600000)).toFixed(1); FAST.active=false; clearInterval(FAST.interval); clearTimeout(window._fastHalfTimer); clearTimeout(window._fastFinalTimer); FAST.interval=null; APP.fastingHistory = [{protocol:FAST.protocol, hours, date:new Date().toLocaleDateString(localeForLang())}].concat(APP.fastingHistory||[]).slice(0,20); save('v_fasting_history', APP.fastingHistory); try { coachMemoryService().saveMemory(currentUserId(), 'fasting_finished', {protocol:FAST.protocol, hours:hours}); } catch(_) {} notifyVitalIA(t('fasting_finished_title'), t('fasting_finished_body')+': '+hours+'h · '+FAST.protocol+'.'); addXP(Number(hours)>=proto.fast?35:15); } else { const proto = PROTOCOLS.find(p=>p.id===FAST.protocol)||PROTOCOLS[0]; FAST.active=true; FAST.startTime=Date.now(); try { coachMemoryService().saveMemory(currentUserId(), 'fasting_started', {protocol:FAST.protocol, targetHours:proto.fast}); } catch(_) {} FAST.interval=setInterval(()=>{ if(APP.tab==='fasting') navigate('fasting'); },1000); requestVitalIANotifications(false); scheduleFastingAlerts(proto); notifyVitalIA(t('fasting_started_title'), FAST.protocol+' '+t('fasting_started_body')); } navigate('fasting'); }

function renderInflammatoryScoreBadge(product) {
  var inflam = getInflammatoryScore(product || {});
  var icon = inflam.score <= -1 ? '🌿' : inflam.score === 0 ? '⚖️' : '🔥';
  return '<div data-inflammatory-score style="margin-top:12px;padding:10px 14px;border-radius:10px;background:' + inflam.color + '22;border:1px solid ' + inflam.color + ';">'
    + '<div style="display:flex;align-items:center;gap:8px;">'
    + '<span style="font-size:20px;">' + icon + '</span>'
    + '<div>'
    + '<div style="font-weight:600;color:' + inflam.color + ';">' + escHtml(inflam.label) + '</div>'
    + (inflam.reasons.length > 0 ? '<div style="font-size:12px;opacity:.8;margin-top:2px;">' + inflam.reasons.slice(0,2).map(function(r){return escHtml(r);}).join(' · ') + '</div>' : '')
    + '</div></div>'
    + '</div>';
}

function renderProductCard(p) {
  const semCol = p.score>=7?'var(--green)':p.score>=4?'var(--orange)':'var(--red)';
  const rows = [
    [t('scanner_calories'), p.cal100 + ' kcal', p.cal_serving + ' kcal'],
    [t('scanner_carbs'), p.carb100, t('scanner_confirm')],
    [t('scanner_protein'), p.prot100, t('scanner_confirm')],
    [t('scanner_fat'), p.fat100, t('scanner_confirm')],
    [t('scanner_sodium'), p.sodium100, t('scanner_confirm')]
  ];
  return `<div class="product-card v-card v-safe-text" style="border:1px solid ${semCol}40;background:${semCol}08">
    <div style="display:flex;gap:12px;margin-bottom:12px">
      <div class="product-semaphore" style="background:${semCol}20;color:${semCol}">${p.sem}</div>
      <div style="flex:1;min-width:0"><div class="product-name">${escapeHTML(p.name)}</div><div class="product-brand">${escapeHTML(p.brand)} · ${p.code}</div><span class="pill" style="background:${semCol}15;color:${semCol};font-size:11px">${t('recipes.score')} ${p.score}/10</span></div>
    </div>
    <table class="nutrient-table"><thead><tr><th>${t('scanner_nutrient')}</th><th>100g</th><th>${t('scanner_serving')} ${p.serving}</th></tr></thead><tbody>${rows.map(function(r){ return `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`; }).join('')}</tbody></table>
    ${renderInflammatoryScoreBadge(p)}
    ${p.alerts.length?`<div style="margin-top:12px">${p.alerts.map(a=>`<div class="alert-item">${escapeHTML(a)}</div>`).join('')}</div>`:''}
    <div style="margin-top:12px;padding:10px;background:rgba(56,189,248,.08);border-radius:10px;border-left:3px solid var(--blue)">
      <div style="font-size:12px;font-weight:700;color:var(--blue)">${t('scanner_confirm_nutrition')}</div>
      <div style="font-size:12px;color:var(--text2);line-height:1.5">${t('scanner_confirm_desc')}</div>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-primary" style="flex:1;padding:11px" onclick="confirmScanNutrition()">${t('scanner_confirm_save')}</button>
      <button class="btn btn-outline" style="flex:1;padding:11px" onclick="SCAN.result=null;SCAN.barcode='';navigate('scanner')">${t('scanner_scan_other')}</button>
    </div>
  </div>`;
}
function confirmScanNutrition() { const p = SCAN.result; if(!p) return; const meal = normalizeMeal({id:Date.now(),time:new Date().toLocaleTimeString(localeForLang(),{hour:'2-digit',minute:'2-digit'}),name:p.name,emoji:p.sem||'🔎',kcal:p.cal_serving||p.cal100||0,prot:parseFloat(p.prot100)||0,carb:parseFloat(p.carb100)||0,fat:parseFloat(p.fat100)||0,type:'scanner'}); APP.meals.push(meal); saveMealsLocal(); try { coachMemoryService().saveMemory(currentUserId(), 'scanner_analysis', {product:p, meal:meal}); } catch(_) {} addXP(12); toast(t('scanner_saved'),'success'); navigate('nutrition'); }

function renderBodyCompositionShell() {
  return '<div class="screen-header"><div class="screen-title">⚖️ Composição Corporal</div></div><div id="main-content"></div>';
}

async function renderBodyComposition() {
  var t = getLang();
  var main = document.getElementById('main-content');
  if (!main) return;

  // --- Calcular IMC e RCQ a partir da última medida ---
  var imc = null, rcq = null;
  var latestEntry = null;

  // Tentar carregar histórico do Supabase
  var history = [];
  try {
    var sb = getVitaliaSupabaseClient();
    if (sb) {
      var { data: { user } } = await sb.auth.getUser();
      if (user) {
        var { data, error } = await sb.from('body_measurements')
          .select('*')
          .eq('user_id', user.id)
          .order('measured_at', { ascending: false })
          .limit(30);
        if (!error && data) history = data;
      }
    }
  } catch(e) {}

  if (history.length > 0) {
    latestEntry = history[0];
    // IMC = peso(kg) / (altura(m))^2 — usar altura do perfil se disponível
    var heightM = (window._vitalia_profile && window._vitalia_profile.height_cm)
      ? window._vitalia_profile.height_cm / 100
      : null;
    if (latestEntry.weight_kg && heightM) {
      imc = (latestEntry.weight_kg / (heightM * heightM)).toFixed(1);
    }
    if (latestEntry.waist_cm && latestEntry.hip_cm && latestEntry.hip_cm > 0) {
      rcq = (latestEntry.waist_cm / latestEntry.hip_cm).toFixed(2);
    }
  }

  // --- Histórico HTML (lista simples) ---
  var historyHtml = '';
  if (history.length === 0) {
    historyHtml = '<p class="text-muted" style="text-align:center;padding:12px 0;">'
      + escHtml(t.body_comp_no_history || 'Nenhuma medida registrada.') + '</p>';
  } else {
    historyHtml = '<table style="width:100%;border-collapse:collapse;font-size:13px;">'
      + '<thead><tr>'
      + '<th style="text-align:left;padding:4px 6px;border-bottom:1px solid var(--border-color)">Data</th>'
      + '<th style="text-align:right;padding:4px 6px;border-bottom:1px solid var(--border-color)">' + escHtml(t.body_comp_weight||'Peso') + '</th>'
      + '<th style="text-align:right;padding:4px 6px;border-bottom:1px solid var(--border-color)">' + escHtml(t.body_comp_fat||'Gordura%') + '</th>'
      + '<th style="text-align:right;padding:4px 6px;border-bottom:1px solid var(--border-color)">' + escHtml(t.body_comp_imc||'IMC') + '</th>'
      + '</tr></thead><tbody>';
    history.slice(0, 10).forEach(function(row) {
      var d = row.measured_at ? new Date(row.measured_at).toLocaleDateString() : '—';
      var hm = null;
      if (window._vitalia_profile && window._vitalia_profile.height_cm && row.weight_kg) {
        var hh = window._vitalia_profile.height_cm / 100;
        hm = (row.weight_kg / (hh * hh)).toFixed(1);
      }
      historyHtml += '<tr>'
        + '<td style="padding:4px 6px;">' + escHtml(d) + '</td>'
        + '<td style="text-align:right;padding:4px 6px;">' + (row.weight_kg != null ? row.weight_kg : '—') + '</td>'
        + '<td style="text-align:right;padding:4px 6px;">' + (row.body_fat_pct != null ? row.body_fat_pct + '%' : '—') + '</td>'
        + '<td style="text-align:right;padding:4px 6px;">' + (hm || '—') + '</td>'
        + '</tr>';
    });
    historyHtml += '</tbody></table>';
  }

  // --- Métricas calculadas ---
  var metricsHtml = '';
  if (imc !== null || rcq !== null) {
    metricsHtml = '<div style="display:flex;gap:12px;margin-bottom:16px;">';
    if (imc !== null) metricsHtml += '<div class="card" style="flex:1;text-align:center;padding:12px;"><div style="font-size:11px;opacity:.7;">' + escHtml(t.body_comp_imc||'IMC') + '</div><div style="font-size:24px;font-weight:700;">' + imc + '</div></div>';
    if (rcq !== null) metricsHtml += '<div class="card" style="flex:1;text-align:center;padding:12px;"><div style="font-size:11px;opacity:.7;">' + escHtml(t.body_comp_rcq||'RCQ') + '</div><div style="font-size:24px;font-weight:700;">' + rcq + '</div></div>';
    metricsHtml += '</div>';
  }

  // --- Render ---
  main.innerHTML = '<div class="view-container" style="max-width:520px;margin:0 auto;padding:16px;">'
    + '<h2 style="margin-bottom:16px;">' + escHtml(t.body_comp_title||'Composição Corporal') + '</h2>'
    + metricsHtml
    + '<form id="body-comp-form" class="card" style="padding:16px;margin-bottom:20px;">'
    + buildField(t.body_comp_weight||'Peso (kg)',      'bc-weight',  'number', latestEntry && latestEntry.weight_kg    != null ? latestEntry.weight_kg    : '')
    + buildField(t.body_comp_fat  ||'Gordura (%)',     'bc-fat',     'number', latestEntry && latestEntry.body_fat_pct != null ? latestEntry.body_fat_pct : '')
    + buildField(t.body_comp_waist||'Cintura (cm)',    'bc-waist',   'number', latestEntry && latestEntry.waist_cm     != null ? latestEntry.waist_cm     : '')
    + buildField(t.body_comp_hip  ||'Quadril (cm)',    'bc-hip',     'number', latestEntry && latestEntry.hip_cm       != null ? latestEntry.hip_cm       : '')
    + buildField(t.body_comp_arm  ||'Braço (cm)',      'bc-arm',     'number', latestEntry && latestEntry.arm_cm       != null ? latestEntry.arm_cm       : '')
    + buildField(t.body_comp_thigh||'Coxa (cm)',       'bc-thigh',   'number', latestEntry && latestEntry.thigh_cm     != null ? latestEntry.thigh_cm     : '')
    + '<div style="margin-top:8px;">'
    + '<label style="font-size:13px;display:block;margin-bottom:4px;">' + escHtml(t.body_comp_notes||'Observações') + '</label>'
    + '<textarea id="bc-notes" rows="2" style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);resize:vertical;">' + escHtml(latestEntry && latestEntry.notes ? latestEntry.notes : '') + '</textarea>'
    + '</div>'
    + '<button type="submit" class="btn-primary" style="width:100%;margin-top:12px;">' + escHtml(t.body_comp_save||'Salvar medidas') + '</button>'
    + '<div id="bc-status" style="text-align:center;margin-top:8px;font-size:13px;min-height:20px;"></div>'
    + '</form>'
    + '<h3 style="margin-bottom:10px;">' + escHtml(t.body_comp_history||'Histórico') + '</h3>'
    + '<div class="card" style="padding:12px;margin-bottom:16px;overflow-x:auto;">' + historyHtml + '</div>'
    + '<button id="bc-coach-btn" class="btn-secondary" style="width:100%;">' + escHtml(t.body_comp_ask_coach||'Analisar com CoachIA') + '</button>'
    + '</div>';

  // Helper local para campos
  function buildField(label, id, type, val) {
    return '<div style="margin-bottom:10px;">'
      + '<label for="' + id + '" style="font-size:13px;display:block;margin-bottom:4px;">' + escHtml(label) + '</label>'
      + '<input id="' + id + '" type="' + type + '" step="0.01" min="0" value="' + escHtml(String(val)) + '" style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);">'
      + '</div>';
  }

  // --- Submit ---
  var form = document.getElementById('body-comp-form');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      var status = document.getElementById('bc-status');
      var t2 = getLang();
      try {
        var sb2 = getVitaliaSupabaseClient();
        if (!sb2) throw new Error('Supabase não disponível');
        var { data: { user: u2 } } = await sb2.auth.getUser();
        if (!u2) throw new Error('Usuário não autenticado');

        var payload = {
          user_id:      u2.id,
          measured_at:  new Date().toISOString(),
          weight_kg:    parseFloatOrNull(document.getElementById('bc-weight').value),
          body_fat_pct: parseFloatOrNull(document.getElementById('bc-fat').value),
          waist_cm:     parseFloatOrNull(document.getElementById('bc-waist').value),
          hip_cm:       parseFloatOrNull(document.getElementById('bc-hip').value),
          arm_cm:       parseFloatOrNull(document.getElementById('bc-arm').value),
          thigh_cm:     parseFloatOrNull(document.getElementById('bc-thigh').value),
          notes:        (document.getElementById('bc-notes').value || '').trim() || null
        };

        var { error: insErr } = await sb2.from('body_measurements').insert([payload]);
        if (insErr) throw insErr;

        if (status) { status.style.color = 'var(--color-success, #4caf50)'; status.textContent = t2.body_comp_saved || 'Medidas salvas!'; }

        // PostHog event (respeita consentimento — já gerenciado pela função capturePostHogEvent existente)
        if (typeof capturePostHogEvent === 'function') {
          capturePostHogEvent('body_measurement_saved', { has_weight: payload.weight_kg != null, has_fat: payload.body_fat_pct != null });
        }

        // Recarregar após 1s
        setTimeout(function() { renderBodyComposition(); }, 1000);

      } catch(err) {
        if (status) { status.style.color = 'var(--color-danger, #f44)'; status.textContent = 'Erro: ' + (err.message || err); }
      }
    });
  }

  // --- Botão CoachIA ---
  var coachBtn = document.getElementById('bc-coach-btn');
  if (coachBtn) {
    coachBtn.addEventListener('click', function() {
      // Passar contexto das medidas para o CoachIA via localStorage
      if (latestEntry) {
        try {
          localStorage.setItem('vitalia_coach_context_measurements', JSON.stringify({
            weight_kg:    latestEntry.weight_kg,
            body_fat_pct: latestEntry.body_fat_pct,
            waist_cm:     latestEntry.waist_cm,
            hip_cm:       latestEntry.hip_cm,
            imc:          imc,
            rcq:          rcq,
            measured_at:  latestEntry.measured_at
          }));
        } catch(e) {}
      }
      navigate('coach');
    });
  }
}

// Helper: parseFloat ou null
function parseFloatOrNull(str) {
  if (!str && str !== 0) return null;
  var n = parseFloat(str);
  return isNaN(n) ? null : n;
}


function reportProgressHealthError(label, err) {
  var msg = err && err.message ? err.message : String(err || 'Erro desconhecido');
  try { console.error('[VitalIA ProgressHealth]', label, err); } catch(e) {}
  if (typeof toast === 'function') toast(label + ': ' + msg, 'error', 5000);
}

function renderHome() {
  normalizeMeals();
  const p = APP.profile || {name:t('gen_user'), goal:'health'};
  const c = APP.calc || {};
  const h = new Date().getHours();
  const greet = h<12?t('greeting_m'):h<18?t('greeting_a'):t('greeting_e');
  const totals = macroTotals(), hyd = smartHydrationTarget(), quality = nutritionQualityScore();
  const kcalPct = Math.min(100, Math.round((totals.kcal/(c.meta||1800))*100));
  const proteinPct = Math.min(100, Math.round((totals.prot/(c.prot||120))*100));
  const waterPct = Math.min(100, Math.round((APP.water/hyd.cups)*100));
  const streak = APP.streak || 0;
  const missionDone = [APP.meals.length>0, waterPct>=70, proteinPct>=70, (APP.coachMsgs||[]).length>1];
  const missionPct = Math.round((missionDone.filter(Boolean).length/missionDone.length)*100);
  const dayNames = ['S','T','Q','Q','S','S','D'];
  const liveInsights = (coachInsightsService ? coachInsightsService().home() : []).slice(0,3);
  const insightStyle = {hydration:'insight-blue', nutrition:'insight-orange', progress:'insight-green', scanner:'insight-purple'};
  const insightIcon = {hydration:vitaliaIcon('hydration'), nutrition:vitaliaIcon('nutrition'), progress:vitaliaIcon('progress'), scanner:vitaliaIcon('scanner')};
  return `<div class="premium-home">
    <div class="premium-top">
      <div>
        <div class="premium-greet">${greet}</div>
        <div class="premium-name">${p.name?.split(' ')[0]||t('gen_user')}</div>
      </div>
      <button id="profileAvatarHome" class="premium-avatar tap-effect" onclick="navigate('settings')" title="${t('set_profile')}" style="overflow:hidden">${getProfileAvatarHTML(p.name?.charAt(0)||'V')}</button>
    </div>

    <div class="premium-hero firefly-glow">
      <span class="status-pill">${t('ai_health_system')}</span>
      <h1>${t('home_hero_title')}</h1>
      <p>${t('home_hero_subtitle')}</p>
      <button class="primary-action btn-full tap-effect" onclick="navigate('nutrition')" style="padding:15px 18px">${t('home_continue')}</button>
    </div>

    <div class="premium-metrics">
      <button class="metric-card tap-effect" onclick="navigate('nutrition')"><div class="metric-k">${t('home_metric_nutrition')}</div><div class="metric-v" style="color:var(--firefly)">${quality}%</div><div class="metric-sub">${proteinPct}% ${t('home_protein_goal')}</div></button>
      <button class="metric-card tap-effect" onclick="navigate('hydration')"><div class="metric-k">${t('home_metric_hydration')}</div><div class="metric-v" style="color:var(--blue)">${waterPct}%</div><div class="metric-sub">${APP.water} ${t('home_cups_of')} ${hyd.cups} ${t('unit_cups')}</div></button>
      <button class="metric-card tap-effect" onclick="navigate('progress')"><div class="metric-k">${t('home_metric_streak')}</div><div class="metric-v" style="color:var(--gold)">${streak} ${t('unit_days')}</div><div class="metric-sub">${t('home_rhythm')}</div></button>
      <button class="metric-card tap-effect" onclick="navigate('nutrition')"><div class="metric-k">${t('home_metric_daily')}</div><div class="metric-v" style="color:var(--orange)">${kcalPct}%</div><div class="metric-sub">${totals.kcal} / ${c.meta||1800} kcal</div></button>
    </div>

    <div class="premium-card coach-feature tap-effect" onclick="navigate('coach')" style="padding:18px;margin:4px 0 14px">
      <div style="display:flex;align-items:center;gap:14px">
      <div style="width:54px;height:54px;border-radius:18px;background:rgba(56,200,255,.10);border:1px solid rgba(56,200,255,.24);display:flex;align-items:center;justify-content:center;font-size:26px">${vitaliaIcon('coach')}</div>
        <div style="flex:1">
          <div class="coach-feature-title">${t('coach_title')}</div>
          <div class="coach-feature-sub">${t('coach_feature_sub')}</div>
        </div>
      </div>
      <button class="btn btn-outline btn-full tap-effect" onclick="event.stopPropagation();navigate('coach')" style="margin-top:14px;padding:12px;border-color:rgba(56,200,255,.28)!important;color:var(--blue)!important">${t('coach_converse_now')}</button>
    </div>

    <div class="section-title" style="padding:0;margin-top:18px">${t('home_next_action')}</div>
    <button class="home-register-card tap-effect" onclick="navigate('nutrition')" style="width:100%;display:flex;align-items:center;gap:14px;text-align:left;padding:15px 16px;margin-bottom:14px;cursor:pointer">
      <div class="next-action-icon" style="width:48px;height:48px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:25px;flex-shrink:0">${vitaliaIcon('nutrition')}</div>
      <div style="flex:1;min-width:0">
        <div class="next-action-title" style="font-size:15px;font-weight:700;margin-bottom:3px">${t('home_register_meal')}</div>
        <div class="next-action-sub" style="font-size:12px;line-height:1.45">${t('home_register_meal_sub')}</div>
      </div>
      <span style="color:rgba(255,255,255,.42);font-size:24px">›</span>
    </button>

    <div class="section-title" style="padding:0;margin-top:18px">${t('home_quick_actions')}</div>
    <div class="home-quick-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
      <button class="quick-card quick-coach tap-effect" onclick="navigate('coach')"><div class="quick-icon">${vitaliaIcon('coach')}</div><div class="quick-title">${t('home_coach')}</div><div class="quick-sub">${t('quick_coach_sub')}</div></button>
      <button class="quick-card quick-recipes tap-effect" onclick="navigate('recipes')"><div class="quick-icon">${vitaliaIcon('recipes')}</div><div class="quick-title">${t('home_recipes')}</div><div class="quick-sub">${t('quick_recipes_sub')}</div></button>
      <button class="quick-card quick-fasting tap-effect" onclick="navigate('fasting')"><div class="quick-icon">${vitaliaIcon('fasting')}</div><div class="quick-title">${t('home_fasting')}</div><div class="quick-sub">${t('quick_fasting_sub')}</div></button>
      <button class="quick-card quick-scanner tap-effect" onclick="navigate('scanner')"><div class="quick-icon">${vitaliaIcon('scanner')}</div><div class="quick-title">${t('home_scanner')}</div><div class="quick-sub">${t('quick_scanner_sub')}</div></button>
    </div>

    <div class="section-title" style="padding:0;margin-bottom:8px">${t('home_plan_7')}</div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px">${dayNames.map((d,i)=>`<button class="seven-day-btn tap-effect" onclick="openSevenDayPlan(${i})" style="height:58px;font-weight:700;cursor:pointer"><div>${d}</div><span style="font-size:10px">${t('unit_day')} ${i+1}</span></button>`).join('')}</div>

    <section class="coach-insights-card">
      <div class="coach-insights-head">
        <div>
          <div class="coach-insights-title">${vitaliaIcon('coach')} ${t('home_insights_title')}</div>
          <div class="coach-insights-sub">${t('home_insights_sub')}</div>
        </div>
        <span class="status-pill" style="white-space:nowrap">${t('home_ai_active')}</span>
      </div>
      ${liveInsights.map((it,i)=>`<div class="insight-mini ${insightStyle[it.module]||'insight-green'} tap-effect" onclick="navigate('${it.module||'coach'}')" ${i===liveInsights.length-1?'style="margin-bottom:0"':''}>
        <div class="insight-top"><div class="insight-ico">${insightIcon[it.module]||vitaliaIcon('coach')}</div><div><div class="insight-title">${it.type==='protein_low'?t('insight_protein_low'):it.type==='hydration_low'?t('insight_hydration_low'):it.type==='calories_low'?t('insight_calories_low'):it.type==='scanner_sodium'?t('insight_scanner_sodium'):t('insight_consistency')}</div><div class="insight-copy">${escapeHTML(it.text)}</div></div></div>
        <button class="insight-action tap-effect" onclick="event.stopPropagation();navigate('${it.module||'coach'}')">${it.module==='hydration'?t('insight_adjust_hydration'):it.module==='nutrition'?t('insight_adjust_meal'):it.module==='scanner'?t('insight_review_product'):t('insight_continue')}</button>
      </div>`).join('')}
    </section>

    <section class="mission-card">
      <div class="home-block-title">${t('mission_title')}</div>
      <div class="home-block-sub">${t('mission_sub')}</div>
      <div class="mission-row"><span class="mission-check ${missionDone[0]?'done':''}">${missionDone[0]?'✓':''}</span><span>${t('mission_register')}</span></div>
      <div class="mission-row"><span class="mission-check ${missionDone[1]?'done':''}">${missionDone[1]?'✓':''}</span><span>${t('mission_water')}</span></div>
      <div class="mission-row"><span class="mission-check ${missionDone[2]?'done':''}">${missionDone[2]?'✓':''}</span><span>${t('mission_protein')}</span></div>
      <div class="mission-row"><span class="mission-check ${missionDone[3]?'done':''}">${missionDone[3]?'✓':''}</span><span>${t('mission_coach')}</span></div>
      <div class="mission-progress-label"><span>${t('mission_progress')}</span><span>${missionPct}% ${t('mission_done')}</span></div>
      <div class="mission-track"><div class="mission-fill" style="width:${missionPct}%"></div></div>
    </section>

    <section class="evolution-card tap-effect" onclick="navigate('progress')">
      <div class="evolution-icon">🔥</div>
      <div style="flex:1">
        <div class="home-block-title">${t('evolution_title')}</div>
        <div class="home-block-sub" style="margin-bottom:0">${t('evolution_sub')}</div>
        <div class="evolution-pills"><span class="evo-pill">${t('evolution_energy')}</span><span class="evo-pill">${t('evolution_consistency')}</span><span class="evo-pill">${t('evolution_hydration')}</span></div>
      </div>
    </section>

    <section class="activity-card">
      <div class="home-block-title">${t('activity_title')}</div>
      <div class="home-block-sub">${t('activity_sub')}</div>
      <div class="activity-line"><span class="activity-dot"></span><span class="activity-text">${t('activity_meal')}</span><span class="activity-time">${APP.meals.length?APP.meals[APP.meals.length-1].time:t('unit_today')}</span></div>
      <div class="activity-line"><span class="activity-dot"></span><span class="activity-text">${t('activity_water')}</span><span class="activity-time">${APP.water}/${hyd.cups} ${t('unit_cups')}</span></div>
      <div class="activity-line"><span class="activity-dot"></span><span class="activity-text">${t('activity_coach')}</span><span class="activity-time">${(APP.coachMsgs||[]).length?t('activity_active'):t('activity_ready')}</span></div>
      <div class="activity-line"><span class="activity-dot"></span><span class="activity-text">${t('activity_plan')}</span><span class="activity-time">${t('unit_now')}</span></div>
    </section>
  </div>`;
}

function renderRecipes() {
  try {
    if (REC.openRecipe) return renderRecipeDetail(REC.openRecipe);
    var activeRecipeLang = normalizeLang(getUserLanguage ? getUserLanguage() : APP.lang);
    APP.lang = activeRecipeLang;
    if (window._recipesError) {
      return `<div class="screen-header"><div class="screen-title">${vitaliaIcon('recipes')} ${t('recipes')}</div></div>${showRecipeErrorState(activeRecipeLang)}`;
    }
    if (!window._recipesLoaded || window._recipesLang !== activeRecipeLang) {
      setTimeout(function(){ loadExternalRecipes().catch(function(e){ console.error('Erro ao carregar receitas:', e); window._recipesError = e.message || String(e); navigate('recipes'); }); }, 0);
      return `<div class="screen-header"><div class="screen-title">${vitaliaIcon('recipes')} ${t('recipes')}</div></div>
      <div class="v-card v-safe-text" style="margin:0 16px 16px;padding:24px;text-align:center">
        <div style="font-size:28px;margin-bottom:10px">${vitaliaIcon('recipes')}</div>
        <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:6px">${t('rec_loading')}</div>
        <div style="font-size:12px;color:var(--text2);line-height:1.5">${t('rec_selected_today')}</div>
      </div>
      <div id="rec-list"></div>`;
    }
    const timeItems = [['all','filter_all'],['breakfast','filter_breakfast'],['lunch','filter_lunch'],['snack','filter_snack'],['dinner','filter_dinner'],['drink','rec_detox'],['special','hydration']];
    const filters = [['weight_loss','rec_weight_loss'],['muscle_gain','rec_muscle'],['vegan','filter_vegan'],['gluten_free','filter_gluten'],['low_carb','rec_low_carb'],['protein','rec_high_protein'],['lactose_free','rec_lactose_free'],['detox','rec_detox'],['prebiotic','rec_prebiotic'],['pregnant','rec_pregnant'],['menstrual','rec_menstrual'],['pre_workout','rec_pre_workout'],['post_workout','rec_post_workout'],['omega3','rec_omega3'],['iron','rec_iron'],['anti_inflammatory','rec_anti_inflam']];
    return `<div class="screen-header"><div class="screen-title">${vitaliaIcon('recipes')} ${t('recipes')}</div></div>
  <div style="padding:0 16px;margin-bottom:10px"><input class="input" placeholder="🔍 ${t('recipe_search')}" value="${escapeHTML(REC.search||'')}" oninput="REC.search=this.value;document.getElementById('rec-list').innerHTML=renderRecipeList()"></div>
  <div style="padding:0 16px;margin-bottom:10px"><div class="card" style="padding:12px;border-color:rgba(34,197,94,.18)"><div style="font-size:11px;color:var(--green);font-weight:700;margin-bottom:4px;text-transform:uppercase">${t('rec_intelligent_filters')}</div><div style="font-size:12px;color:var(--text2);margin-bottom:10px">${t('rec_selected_today')}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
    <select class="input" onchange="setPremiumFilter('goal',this.value)"><option value="all">${t('rec_goal')}</option><option value="lose" ${REC.premium.goal==='lose'?'selected':''}>${t('goal_lose')}</option><option value="gain" ${REC.premium.goal==='gain'?'selected':''}>${t('goal_gain')}</option><option value="maintain" ${REC.premium.goal==='maintain'?'selected':''}>${t('rec_performance')}</option><option value="health" ${REC.premium.goal==='health'?'selected':''}>${t('goal_health')}</option></select>
    <select class="input" onchange="setPremiumFilter('time',this.value)"><option value="all">${t('rec_time')}</option><option value="15" ${REC.premium.time==='15'?'selected':''}>≤ 15min</option><option value="30" ${REC.premium.time==='30'?'selected':''}>≤ 30min</option><option value="45" ${REC.premium.time==='45'?'selected':''}>≤ 45min</option></select>
    <select class="input" onchange="setPremiumFilter('protein',this.value)"><option value="all">${t('rec_protein')}</option><option value="high" ${REC.premium.protein==='high'?'selected':''}>${t('rec_high_protein')}</option><option value="elite" ${REC.premium.protein==='elite'?'selected':''}>${t('rec_elite')}</option></select>
    <select class="input" onchange="setPremiumFilter('carb',this.value)"><option value="all">${t('rec_carb')}</option><option value="low" ${REC.premium.carb==='low'?'selected':''}>${t('rec_low_carb')}</option><option value="balanced" ${REC.premium.carb==='balanced'?'selected':''}>${t('goal_maintain')}</option></select>
    <select class="input" onchange="setPremiumFilter('budget',this.value)"><option value="all">${t('rec_budget')}</option><option value="baixo" ${REC.premium.budget==='baixo'?'selected':''}>${t('rec_budget_low')}</option><option value="medio" ${REC.premium.budget==='medio'?'selected':''}>${t('rec_budget_medium')}</option><option value="premium" ${REC.premium.budget==='premium'?'selected':''}>${t('rec_budget_premium')}</option></select>
    <button class="btn btn-outline" onclick="REC.premium={goal:'all',time:'all',protein:'all',carb:'all',budget:'all'};navigate('recipes')">${t('rec_clear')}</button>
  </div></div></div>
  <div style="padding:0 16px;margin-bottom:8px"><div style="font-size:11px;color:var(--text3);font-weight:700;margin-bottom:7px;text-transform:uppercase">${t('recipe_by_time')}</div><div style="display:flex;gap:7px;overflow-x:auto;padding-bottom:4px">${timeItems.map(x=>`<button class="tab-btn ${REC.mealType===x[0]?'active':''}" onclick="REC.mealType='${x[0]}';navigate('recipes')">${t(x[1])}</button>`).join('')}</div></div>
  <div style="padding:0 16px;margin-bottom:12px"><div style="font-size:11px;color:var(--text3);font-weight:700;margin-bottom:7px;text-transform:uppercase">${t('recipe_filters')}</div><div class="filter-chips">${filters.map(x=>`<button class="filter-chip ${REC.filter.includes(x[0])?'active':''}" onclick="toggleFilter('${x[0]}')">${t(x[1])}</button>`).join('')}</div></div>
  <div id="rec-list">${renderRecipeList()}</div>`;
  } catch(e) {
    console.error('renderRecipes failed:', e);
    return `<div class="screen-header"><div class="screen-title">${vitaliaIcon('recipes')} ${t('recipes')}</div></div>${showRecipeErrorState(APP.lang || 'pt')}`;
  }
}

function renderRecipeList() {
  try {
    if (window._recipesError) return showRecipeErrorState(APP.lang || 'pt');
    var l = (window.RECIPES || RECIPES || []).slice();
    var activeRecipeLang = normalizeLang(getUserLanguage ? getUserLanguage() : APP.lang);
    if (activeRecipeLang !== 'pt' && !window._recipesFallbackEmbedded) l = l.filter(function(r){ return !!r.external; });
    if (REC.mealType && REC.mealType !== 'all') l = l.filter(function(r){ return r.cat === REC.mealType || (REC.mealType === 'special' && r.special); });
    if (REC.filter.length) {
      l = l.filter(function(r){ return REC.filter.every(function(f){
        var key = normalizeRecipeFilterKey(f);
        var filterKeys = recipeFilterKeys(r);
        return filterKeys.indexOf(key) >= 0 || r.goal === key || (key === 'weight_loss' && r.goal === 'lose') || (key === 'muscle_gain' && r.goal === 'gain');
      }); });
    }
    if (REC.search) {
      var q=normalizeSearchText(REC.search);
      l = l.filter(function(r){ return normalizeSearchText(recipeSearchText(r)).indexOf(q) >= 0; });
    }
    const pf = REC.premium || {};
    if (pf.goal && pf.goal !== 'all') l = l.filter(r => r.goal === pf.goal || recipeFilterKeys(r).indexOf(pf.goal === 'lose' ? 'weight_loss' : pf.goal === 'gain' ? 'muscle_gain' : pf.goal) >= 0);
    if (pf.time && pf.time !== 'all') l = l.filter(r => parseInt(r.time || r.tempo || 99) <= parseInt(pf.time));
    if (pf.protein === 'high') l = l.filter(r => Number(r.prot || 0) >= 25 || recipeFilterKeys(r).indexOf('high_protein') >= 0);
    if (pf.protein === 'elite') l = l.filter(r => (Number(r.prot || 0) / Math.max(Number(r.cal || 1), 1)) >= 0.075);
    if (pf.carb === 'low') l = l.filter(r => Number(r.carb || 0) <= 20 || recipeFilterKeys(r).indexOf('low_carb') >= 0);
    if (pf.carb === 'balanced') l = l.filter(r => Number(r.carb || 0) > 20 && Number(r.carb || 0) <= 55);
    if (pf.budget && pf.budget !== 'all') l = l.filter(r => (r.budget || 'medio') === pf.budget);
    if (!l.length) return `<div style="text-align:center;padding:40px"><div style="font-size:40px">${vitaliaIcon('search')}</div><div style="font-weight:700;margin-top:8px">${t('rec_no_results')}</div><div style="font-size:12px;color:var(--text3);margin-top:6px">Lang: ${activeRecipeLang}</div><button class="btn btn-outline" onclick="REC.filter=[];REC.mealType='all';REC.search='';window._recipesLoaded=false;window._recipesError=null;loadExternalRecipes();navigate('recipes')" style="margin-top:12px">${t('rec_clear_filters')}</button></div>`;
    return `<div style="text-align:center;padding:8px;font-size:12px;color:var(--text3)">${l.length} ${t('rec_found')}</div><div style="padding:0 16px">` + l.slice(0,30).map(function(r){
      var tags=recipeTags(r).slice(0,3).map(function(tag){return `<span class="pill pill-green" style="font-size:10px">${tag}</span>`;}).join('');
      var reason = coachRecipeReason(r);
      return `<div class="recipe-card v-card" onclick="openRecipeSafe(${r.id})" style="margin-bottom:12px"><div class="recipe-premium-visual"><div class="recipe-premium-mark"></div></div><div class="recipe-body" style="padding:12px"><div style="margin-bottom:8px">${tags}</div><div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:7px">${recipeTitle(r)}</div><div style="font-size:11px;color:var(--green);margin-bottom:7px">${t('recipes.coachRecommends')}: ${reason}</div><div style="display:flex;gap:10px;flex-wrap:wrap;font-size:11px;color:var(--text2)"><span>${vitaliaIcon('fasting')} ${r.time||((r.tempo||15)+'min')}</span><span>${vitaliaIcon('progress')} ${recipeTerm(r.diff||t('rec_easy'))}</span><span style="color:var(--orange)">${r.cal||0} kcal</span><span style="color:#fbbf24">★ ★ ★ ★ ★</span></div></div></div>`;
    }).join('') + '</div>';
  } catch(e) {
    console.error('renderRecipeList failed:', e);
    return showRecipeErrorState(APP.lang || 'pt');
  }
}
async function handleAuthRedirectResult() {
  const raw = (location.hash || '') + '&' + (location.search || '');
  if (!raw || raw.length < 3) return false;
  const params = new URLSearchParams(raw.replace(/^[#?&]+/, '').replace(/\?/g, '&'));
  const errorCode = params.get('error_code') || params.get('error');
  const errorDesc = params.get('error_description') || '';
  const pendingEmail = localStorage.getItem('v_pending_signup_email') || APP.registerData?.email || '';

  if (errorCode) {
    try { history.replaceState({}, document.title, location.pathname); } catch(_) {}
    if (String(errorCode).includes('otp_expired') || /expired|invalid/i.test(errorDesc)) {
      renderEmailConfirmationNotice(pendingEmail, 'expired');
      toast('Link expirado. Reenvie a confirmação e use o email mais recente.', 'info', 6500);
      return true;
    }
    toast('Falha na confirmação: ' + (errorDesc || errorCode), 'error', 7000);
    renderEmailConfirmationNotice(pendingEmail);
    return true;
  }

  try {
    if (params.get('code') && sb?.auth?.exchangeCodeForSession) {
      const res = await sb.auth.exchangeCodeForSession(params.get('code'));
      if (res?.error) throw res.error;
    }
    const session = (await sb.auth.getSession())?.data?.session || null;
    if (session?.user) {
      try { history.replaceState({}, document.title, location.pathname); } catch(_) {}
      localStorage.setItem('v_remember','1');
      sessionStorage.setItem('v_tab_active','1');
      APP.user = { email: session.user.email, name: session.user.user_metadata?.nome || session.user.email.split('@')[0], id: session.user.id };
      APP.session = session.access_token;
      if (!APP.profile) APP.profile = { name: APP.user.name, weight:78, height:175, age:30, gender:'m', goal:'lose', activity:'mod', restrictions:[] };
      APP.calc = calcProfile(APP.profile);
      await syncFromSupabase(session.user.id);
      toast('Email confirmado. Acesso liberado!', 'success', 5000);
      startApp();
      return true;
    }
  } catch(e) {
    toast('Não foi possível concluir a confirmação: ' + (e.message || e), 'error', 7000);
    renderEmailConfirmationNotice(pendingEmail);
    return true;
  }
  return false;
}

window.addEventListener('DOMContentLoaded', async () => {
  applyTheme();
  if(!LANG[APP.lang]) APP.lang='pt';

  // Animate splash
  setTimeout(async () => {
    document.getElementById('splash').style.animation='none';
    document.getElementById('splash').style.opacity='0';
    document.getElementById('splash').style.transition='opacity .4s';

    setTimeout(async () => {
      try {
      document.getElementById('splash').style.display='none';

            if (await handleAuthRedirectResult()) return;

      // Check session — só persiste se "lembrar de mim" foi marcado
      const rememberMe = localStorage.getItem('v_remember') === '1';
      let session = null;
      try {
        const _sr = await sb.auth.getSession();
        session = _sr?.data?.session || null;
      } catch(e) { session = null; }

      var hasTabActive=sessionStorage.getItem('v_tab_active');
      if (session && session.user && (rememberMe||hasTabActive)) {
        const user = session.user;
        APP.user = { email: user.email, name: user.user_metadata?.nome || user.email.split('@')[0], id: user.id };
        APP.session = session.access_token;
        clearSensitiveLocalCache();

        // Load data from Supabase
        if (!APP.profile) APP.profile = { name: APP.user.name, weight:78, height:175, age:30, gender:'m', goal:'lose', activity:'mod', restrictions:[] };
        APP.calc = calcProfile(APP.profile);
        APP.meals=[];

        // Sync from Supabase in background
        syncFromSupabase(user.id).then(() => {
          if(APP.tab) navigate(APP.tab);
        });

        startApp();
        scheduleNotifications();

      // eslint-disable-next-line no-constant-binary-expression -- pré-existente no index.html; corrigir na V231
      } else if (false && APP.session && APP.user) {
        // Fallback to localStorage session
        if(!APP.profile) APP.profile={name:'Usuário',weight:78,height:175,age:30,gender:'m',goal:'lose',activity:'mod'};
        APP.calc=calcProfile(APP.profile);
        APP.water=APP.water||0; APP.meals=APP.meals?.length?APP.meals:[];
        if(!APP.weightHistory?.length) APP.weightHistory=WEIGHT_HISTORY.map((p,i)=>({date:new Date(Date.now()-i*86400000).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),peso:p})).reverse();
        startApp(); scheduleNotifications();
      } else {
        startAuth();
      }
      } catch (e) {
        console.error('[VitalIA] Falha de inicialização recuperada:', e);
        try { document.getElementById('splash').style.display='none'; } catch(_) {}
        try {
          document.getElementById('app').style.display='none';
          startAuth();
        } catch(authErr) {
          console.error('[VitalIA] Fallback de login falhou:', authErr);
        }
      }
    }, 400);
  }, 2200);

  // Listen for auth changes
  try { sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      APP.session = null; APP.user = null;
    }
  }); } catch(e) { console.warn('Auth listener error:', e); }
});
