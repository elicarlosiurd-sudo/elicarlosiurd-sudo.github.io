/* ═══════════════════════════════════════
   V230-D4 — MÓDULO PROGRESS (js/modules/progress.js)
   Ex-bloco inline do index.html (extração literal).
═══════════════════════════════════════ */

function renderProgress() {
  const c = APP.calc||{}, weights = APP.weightHistory||[], current = weights.at(-1)?.peso ?? APP.profile?.weight, r = weeklyReportData();
  if(!NUTR.week && !NUTR.weekLoading && !NUTR.weekError)setTimeout(loadRealNutritionWeek,0);
  const metrics = [[t('progress_energy'),r.energyPct,'var(--orange)'],[t('progress_protein'),r.proteinPct,'var(--green)'],[t('progress_hydration'),r.waterPct,'var(--blue)'],[t('progress_records'),r.quality,'var(--purple)']];
  return `<div class="screen-header"><div class="screen-title">📊 ${t('progress_global_title')}</div></div>
  <div class="stat-pair v-safe-text"><div class="stat-box"><div class="stat-label">${t('progress_current_weight')}</div><div class="stat-val" style="color:var(--orange)">${Number.isFinite(current)?current+' kg':'—'}</div></div><div class="stat-box"><div class="stat-label">${t('progress_goal')}</div><div class="stat-val" style="color:var(--green)">${Number.isFinite(c.pesoMeta)?c.pesoMeta+' kg':'—'}</div></div></div>
  ${renderProgressModuleLinks()}
  <div style="padding:0 16px;margin-bottom:12px"><div class="card card-blue v-card"><div style="font-size:12px;font-weight:700;color:var(--blue);margin-bottom:8px">${t('progress_coach_reading')}</div><div style="font-size:13px;color:var(--text);line-height:1.65">${weeklyInsightText(r)}</div></div></div>
  <div style="padding:0 16px;margin-bottom:12px"><div class="card card-blue v-card"><div style="font-size:12px;font-weight:700;color:var(--blue);margin-bottom:10px">${t('progress_week_evolution')}</div>${metrics.map(x=>`<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:12px"><strong>${x[0]}</strong><span>${x[1]==null?'—':x[1]+'%'}</span></div><div class="progress-bar"><div class="progress-fill" style="width:${Math.min(x[1]||0,100)}%;background:${x[2]}"></div></div></div>`).join('')}</div></div>
  <div class="section-title">${t('progress_next_steps')}</div><div style="padding:0 16px;margin-bottom:14px">${r.next.map((n,i)=>`<div class="next-action-card v-card" style="cursor:default"><div class="step-num">${i+1}</div><div style="font-size:13px;font-weight:700;line-height:1.45">${escapeHTML(n)}</div></div>`).join('')}</div>
  <div style="padding:0 16px;margin-bottom:16px"><div style="display:flex;gap:8px"><input class="input" id="weight-input" type="number" step="0.1" placeholder="${t('progress_weight_placeholder')}" style="flex:1"><button class="btn btn-primary" onclick="registerWeight()">${t('progress_register')}</button></div></div>
  <div style="padding:0 16px;margin-bottom:16px"><button class="btn btn-outline btn-full" onclick="exportFullHistory()" style="padding:12px">${t('progress_export')}</button></div>`;
}

function renderProgressModuleLinks(){
 var menus=[["diagnostic","🧭","Plano Ativo VitalIA","progress_diag_desc"],["bodycomp","⚖️","body_comp_title","body_comp_menu_desc"],["sleep","😴","sleep_title","sleep_menu_desc"],["supplements","💊","ui_supp_title","progress_supp_desc"],["notifications","🔔","notifications_title","progress_notif_desc"],["labresults","🔬","lab_title","progress_lab_desc"],["longevity","🧬","ui_lon_title","progress_long_desc"],["mental","🧘","Saúde Mental & Estresse","progress_mental_desc"],["microbiome","🦠","Microbioma Intestinal","progress_micro_desc"],["shopping","🛒","Lista de Compras","progress_shop_desc"],["wearables","⌚","Wearables","progress_wear_desc"],["athlete","🏋️","Modo Atleta Premium","progress_athlete_desc"]];
 return '<div style="padding:0 16px;margin-bottom:12px">'+menus.map(function(item){return '<div class="card" style="cursor:pointer;padding:16px;margin-bottom:12px" onclick="navigate(\''+item[0]+'\')"><div style="font-weight:600">'+item[1]+' '+escapeHTML(['body_comp_title','sleep_title','ui_supp_title','notifications_title','lab_title','ui_lon_title'].includes(item[2])?t(item[2]):localizeCatalogData(item[2]))+'</div><div style="font-size:13px;opacity:.7">'+escapeHTML(t(item[3]))+'</div></div>';}).join('')+'</div>';
}
