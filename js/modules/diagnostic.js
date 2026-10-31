/* ═══════════════════════════════════════
   V230-D4 — MÓDULO DIAGNOSTIC (js/modules/diagnostic.js)
   Ex-bloco inline do index.html (extração literal).
═══════════════════════════════════════ */

var PLAN_TEMPLATES = {
  coachia_7d: {
    id: 'coachia_7d',
    name: 'Plano CoachIA',
    subtitle: 'Criado pela IA com base nos seus bloqueios reais.',
    icon: '🧠',
    duration_days: 7,
    focus: 'personalized',
    weeks: [
      { label: 'Semana 1', theme: 'Diagnóstico e primeiras trocas' }
    ]
  },
  fat_burn_21d: {
    id: 'fat_burn_21d',
    name: 'Plano 21D — Queima Inteligente',
    subtitle: 'Reduza gordura com estratégia, controle de fome e rotina prática.',
    icon: '🔥',
    duration_days: 21,
    focus: 'fat_loss',
    weeks: [
      { label: 'Semana 1', theme: 'Controle do ambiente' },
      { label: 'Semana 2', theme: 'Aceleração inteligente' },
      { label: 'Semana 3', theme: 'Consolidação' }
    ]
  },
  vital_transform_30d: {
    id: 'vital_transform_30d',
    name: 'Plano 30D — Transformação Vital',
    subtitle: 'Construa uma rotina de saúde, energia e evolução sustentável.',
    icon: '🌱',
    duration_days: 30,
    focus: 'health_transformation',
    weeks: [
      { label: 'Semana 1', theme: 'Reset da rotina' },
      { label: 'Semana 2', theme: 'Nutrição inteligente' },
      { label: 'Semana 3', theme: 'Corpo em evolução' },
      { label: 'Semana 4', theme: 'Consolidação' }
    ]
  }
};

function renderGoalDiagnosticsShell() {
  return ("" + "<div class=\"screen-header\">" + "" + "<div class=\"screen-title\">" + "🧭 " + (LANG[APP.lang] || LANG.en).catalog_copy["Plano Ativo VitalIA"] + "</div>" + "" + "</div>" + "" + "<div id=\"main-content\">" + "" + "</div>" + "");
}

function calculateGoalDiagnosticCurrentDay(planStartedAt, planDurationDays) {
  if (!planStartedAt) return null;
  var day = Math.floor((Date.now() - new Date(planStartedAt).getTime()) / 86400000) + 1;
  var duration = planDurationDays || 7;
  if (day > duration) return duration;
  return Math.max(1, day);
}

function _goalDiagnosticArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === 'string') {
    return value.split(',').map(function(v){ return v.trim(); }).filter(Boolean);
  }
  return [];
}

function _goalDiagnosticText(id) {
  var el = document.getElementById(id);
  return el ? (el.value || '').trim() : '';
}

function _goalDiagnosticNumber(id) {
  var v = parseInt(_goalDiagnosticText(id), 10);
  return isNaN(v) ? null : v;
}

function _goalDiagnosticSafetyText() {
  return VITALIA_CLINICAL.localizedClinicalFallback(VITALIA_CLINICAL.normalizeClinicalLang(APP.lang), 'sensitive_clinical');
}

function _goalDiagnosticHasSafetySignal(text) {
  var s = (text || '').toLowerCase();
  if (VITALIA_CLINICAL.classifySharedClinicalRisk(s) !== 'normal_nutrition') return true;
  if (/purging|self.harm|laxative|haven.t eaten|vomit after|atracon|autolesi|laxante|v[oó]mito.*comer|самоповрежд|слабитель|рвот|не ем.*дн/i.test(s)) return true;
  return ['bulimia','anorexia','vômito após comer','vomito apos comer','provoco vômito','provoco vomito','uso laxante','tomo laxante','não como há dias','nao como ha dias','fiquei sem comer','medo intenso de comida','culpa extrema','me odeio por comer','compulsão grave','compulsao grave','como sem parar','autoagressão','autoagressao'].some(function(k){ return s.indexOf(k) >= 0; });
}

function buildDiagnosticCoachSummary(diag) {
  diag = diag || {};
  return {
    language: APP.lang,
    goal: diag.goal_text || '',
    goal_type: diag.goal_type || '',
    motivation: diag.motivation || '',
    primary_saboteur: diag.primary_saboteur || '',
    critical_periods: Array.isArray(diag.critical_periods) ? diag.critical_periods : [],
    food_pattern: diag.current_food_pattern || '',
    emotional_triggers: Array.isArray(diag.emotional_triggers) ? diag.emotional_triggers : [],
    environment_triggers: Array.isArray(diag.environment_triggers) ? diag.environment_triggers : [],
    emergency_strategy: diag.emergency_strategy || '',
    plan_name: diag.selected_plan_name || ((LANG[APP.lang] || LANG.en).catalog_copy["Plano CoachIA"]),
    plan_day: calculateGoalDiagnosticCurrentDay(diag.plan_started_at, diag.plan_duration_days || 7),
    plan_duration: diag.plan_duration_days || 7,
    plan_started_at: diag.plan_started_at || null,
    plan_ends_at: diag.plan_ends_at || null,
    commitment_level: diag.commitment_level,
    confidence_score: diag.confidence_score
  };
}

function syncDiagnosticCoachContext(activeDiagnostic) {
  if (!activeDiagnostic || activeDiagnostic.status !== 'active') return;
  try {
    localStorage.setItem(userScopedKey('vitalia_coach_context_diagnostic'), JSON.stringify(buildDiagnosticCoachSummary(activeDiagnostic)));
  } catch(e) {}
}

function _buildGoalDiagnosticPayload(status) {
  var barriers = _goalDiagnosticText('gd-barriers');
  var food = _goalDiagnosticText('gd-food');
  var motivation = _goalDiagnosticText('gd-motivation');
  var goalText = _goalDiagnosticText('gd-goal-text');
  var emergency = _goalDiagnosticText('gd-emergency');
  var allText = [barriers, food, motivation, goalText, emergency].join(' ');
  var payload = {
    goal_type: _goalDiagnosticText('gd-goal-type') || 'weight_loss',
    goal_text: goalText || t('diag_unset'),
    motivation: motivation || null,
    current_barriers: barriers || null,
    current_food_pattern: food || null,
    emotional_triggers: _goalDiagnosticArray(_goalDiagnosticText('gd-emotional')),
    environment_triggers: _goalDiagnosticArray(_goalDiagnosticText('gd-environment')),
    critical_periods: _goalDiagnosticArray(_goalDiagnosticText('gd-periods')),
    primary_saboteur: _goalDiagnosticText('gd-saboteur') || null,
    emergency_strategy: emergency || null,
    commitment_level: _goalDiagnosticNumber('gd-commitment'),
    confidence_score: _goalDiagnosticNumber('gd-confidence'),
    status: status || 'draft',
    updated_at: new Date().toISOString()
  };
  if (_goalDiagnosticHasSafetySignal(allText)) payload._safetySignal = true;
  return payload;
}

function _buildInitialGoalDiagnosticPlan(payload) {
  var fields={goal:payload.goal_text || t('diag_unset'),obstacle:payload.primary_saboteur || t('diag_unset'),periods:(payload.critical_periods || []).join(', ') || t('diag_unset'),emergency:payload.emergency_strategy || t('diag_unset')};
  return t('diag_plan_intro').replace(/\{(\w+)\}/g,function(_,key){return fields[key] || '';});
 }

async function renderGoalDiagnostics() {
  var main = document.getElementById('main-content');
  if (!main) return;
  var active = null, draft = null, history = [];
  try {
    var sb = getVitaliaSupabaseClient();
    if (sb) {
      var userRes = await sb.auth.getUser();
      var user = userRes.data && userRes.data.user;
      if (user) {
        var res = await sb.from('goal_diagnostics').select('*').eq('user_id', user.id).order('created_at', { ascending:false }).limit(20);
        var rows = res.data || [];
        active = rows.find(function(r){ return r.status === 'active'; }) || null;
        draft = rows.find(function(r){ return r.status === 'draft'; }) || null;
        history = rows.filter(function(r){ return r.status === 'archived' || r.status === 'completed'; });
      }
    }
  } catch(e) {}
  if (active) syncDiagnosticCoachContext(active);
  var source = draft || active || {};
  window._goalDiagnosticDraftId = draft ? draft.id : null;
  var safety = _goalDiagnosticHasSafetySignal([
    source.goal_text, source.motivation, source.current_barriers, source.current_food_pattern, source.primary_saboteur, source.emergency_strategy
  ].join(' '));
  var safetyHtml = safety ? '<div style="margin-bottom:12px;padding:10px;border-radius:8px;background:#ff980014;border:1px solid #ff9800;color:var(--text-primary);font-size:12px;line-height:1.5;">' + escHtml(_goalDiagnosticSafetyText()) + '</div>' : '';
  main.innerHTML = '<div class="view-container" style="max-width:560px;margin:0 auto;padding:16px;">'
    + ("" + "<h2 style=\"margin-bottom:4px;\">" + "🧭 " + (LANG[APP.lang] || LANG.en).catalog_copy["Plano Ativo VitalIA"] + "</h2>" + "")
    + ("" + "<p style=\"font-size:13px;opacity:.65;margin-bottom:14px;\">" + (LANG[APP.lang] || LANG.en).catalog_copy["Entenda seus bloqueios reais e transforme isso em uma estratégia prática."] + "</p>" + "")
    + safetyHtml
    + renderCurrentDiagnosticPlan(active)
    + '<form id="goal-diagnostic-form" class="card" style="padding:14px;margin-bottom:14px;">'
    + ("" + "<div style=\"font-size:13px;font-weight:700;margin-bottom:10px;\">" + (LANG[APP.lang] || LANG.en).catalog_copy["Diagnóstico de bloqueios"] + "</div>" + "")
    + ("" + "<div style=\"font-size:12px;opacity:.72;line-height:1.45;margin-bottom:12px;padding:10px;border-radius:8px;background:var(--bg-secondary);\">" + (LANG[APP.lang] || LANG.en).catalog_copy["Escreva do seu jeito. Exemplos: quero perder 10kg sem passar fome; belisco à noite por ansiedade; peço delivery quando chego cansado; sexta-feira e domingo são meus períodos mais difíceis."] + "</div>" + "")
    + ("" + "<label style=\"font-size:12px;\">" + (LANG[APP.lang] || LANG.en).catalog_copy["Meu objetivo"] + "</label>" + "" + "<select id=\"gd-goal-type\" style=\"width:100%;margin:4px 0 8px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);\">" + "")
    + ['weight_loss:Emagrecer','muscle_gain:Ganhar massa','energy:Melhorar energia','compulsion:Controlar compulsão','nutrition:Melhorar alimentação','performance:Aumentar performance','health:Melhorar saúde'].map(function(opt){ var p=opt.split(':'); return '<option value="'+p[0]+'"'+((source.goal_type||'weight_loss')===p[0]?' selected':'')+'>'+escHtml(localizeCatalogData(p[1]))+'</option>'; }).join('')
    + '</select>'
    + ("" + "<label style=\"font-size:12px;\">" + (LANG[APP.lang] || LANG.en).catalog_copy["Explique com suas palavras"] + "</label>" + "" + ("<textarea id=\"gd-goal-text\" rows=\"2\" placeholder=\"" + escHtml(t("diag_placeholder_0")) + "\" style=\"width:100%;box-sizing:border-box;margin:4px 0 8px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);resize:vertical;\">") + "") + escHtml(source.goal_text || '') + '</textarea>'
    + ("" + "<label style=\"font-size:12px;\">" + (LANG[APP.lang] || LANG.en).catalog_copy["Por que isso importa?"] + "</label>" + "" + ("<textarea id=\"gd-motivation\" rows=\"2\" placeholder=\"" + escHtml(t("diag_placeholder_1")) + "\" style=\"width:100%;box-sizing:border-box;margin:4px 0 8px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);resize:vertical;\">") + "") + escHtml(source.motivation || '') + '</textarea>'
    + ("" + "<label style=\"font-size:12px;\">" + (LANG[APP.lang] || LANG.en).catalog_copy["O que me impede hoje"] + "</label>" + "" + ("<textarea id=\"gd-barriers\" rows=\"3\" placeholder=\"" + escHtml(t("diag_placeholder_2")) + "\" style=\"width:100%;box-sizing:border-box;margin:4px 0 8px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);resize:vertical;\">") + "") + escHtml(source.current_barriers || '') + '</textarea>'
    + ("" + "<label style=\"font-size:12px;\">" + (LANG[APP.lang] || LANG.en).catalog_copy["Minha alimentação real"] + "</label>" + "" + ("<textarea id=\"gd-food\" rows=\"3\" placeholder=\"" + escHtml(t("diag_placeholder_3")) + "\" style=\"width:100%;box-sizing:border-box;margin:4px 0 8px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);resize:vertical;\">") + "") + escHtml(source.current_food_pattern || '') + '</textarea>'
    + ("" + "<label style=\"font-size:12px;\">" + (LANG[APP.lang] || LANG.en).catalog_copy["Gatilhos emocionais (separe por vírgula)"] + "</label>" + ("<input id=\"gd-emotional\" placeholder=\"" + escHtml(t("diag_placeholder_4")) + "\" value=\"")) + escHtml(_goalDiagnosticArray(source.emotional_triggers).join(', ')) + '" style="width:100%;box-sizing:border-box;margin:4px 0 8px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);">'
    + ("" + "<label style=\"font-size:12px;\">" + (LANG[APP.lang] || LANG.en).catalog_copy["Gatilhos de ambiente (separe por vírgula)"] + "</label>" + ("<input id=\"gd-environment\" placeholder=\"" + escHtml(t("diag_placeholder_5")) + "\" value=\"")) + escHtml(_goalDiagnosticArray(source.environment_triggers).join(', ')) + '" style="width:100%;box-sizing:border-box;margin:4px 0 8px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);">'
    + ("" + "<label style=\"font-size:12px;\">" + (LANG[APP.lang] || LANG.en).catalog_copy["Períodos críticos (separe por vírgula)"] + "</label>" + ("<input id=\"gd-periods\" placeholder=\"" + escHtml(t("diag_placeholder_6")) + "\" value=\"")) + escHtml(_goalDiagnosticArray(source.critical_periods).join(', ')) + '" style="width:100%;box-sizing:border-box;margin:4px 0 8px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);">'
    + ("" + "<label style=\"font-size:12px;\">" + (LANG[APP.lang] || LANG.en).catalog_copy["Sabotador principal"] + "</label>" + ("<input id=\"gd-saboteur\" placeholder=\"" + escHtml(t("diag_placeholder_7")) + "\" value=\"")) + escHtml(source.primary_saboteur || '') + '" style="width:100%;box-sizing:border-box;margin:4px 0 8px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);">'
    + ("" + "<label style=\"font-size:12px;\">" + (LANG[APP.lang] || LANG.en).catalog_copy["Estratégia de emergência"] + "</label>" + "" + ("<textarea id=\"gd-emergency\" rows=\"2\" placeholder=\"" + escHtml(t("diag_placeholder_8")) + "\" style=\"width:100%;box-sizing:border-box;margin:4px 0 8px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);resize:vertical;\">") + "") + escHtml(source.emergency_strategy || '') + '</textarea>'
    + ("" + "<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:8px;\">" + "" + "<div>" + "" + "<label style=\"font-size:12px;\">" + (LANG[APP.lang] || LANG.en).catalog_copy["Compromisso 0-10"] + "</label>" + "<input id=\"gd-commitment\" type=\"number\" min=\"0\" max=\"10\" value=\"") + (source.commitment_level != null ? source.commitment_level : '') + ("\" style=\"width:100%;box-sizing:border-box;margin-top:4px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);\">" + "</div>" + "" + "<div>" + "" + "<label style=\"font-size:12px;\">" + (LANG[APP.lang] || LANG.en).catalog_copy["Confiança 0-10"] + "</label>" + "<input id=\"gd-confidence\" type=\"number\" min=\"0\" max=\"10\" value=\"") + (source.confidence_score != null ? source.confidence_score : '') + '" style="width:100%;box-sizing:border-box;margin-top:4px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);"></div></div>'
    + ("" + "<div style=\"display:flex;gap:8px;margin-top:12px;\">" + "" + ("<button type=\"button\" onclick=\"saveGoalDiagnosticDraft();\" class=\"btn-secondary\" style=\"flex:1;\">") + (LANG[APP.lang] || LANG.en).catalog_copy["Salvar rascunho"] + "</button>" + "" + ("<button type=\"button\" onclick=\"activateGoalDiagnostic();\" class=\"btn-primary\" style=\"flex:1;\">") + (LANG[APP.lang] || LANG.en).catalog_copy["Ativar Plano CoachIA"] + "</button>" + "" + "</div>" + "")
    + '<div id="gd-status" style="min-height:18px;text-align:center;font-size:12px;margin-top:8px;"></div>'
    + '</form>'
    + renderDiagnosticHistory(history)
    + '</div>';
}

function renderCurrentDiagnosticPlan(active) {
  if (!active) {
    return ("" + "<div class=\"card\" style=\"padding:14px;margin-bottom:14px;text-align:center;\">" + "" + "<div style=\"font-weight:700;margin-bottom:4px;\">" + (LANG[APP.lang] || LANG.en).catalog_copy["Meu Plano Atual"] + "</div>" + "" + "<div style=\"font-size:13px;opacity:.65;\">" + (LANG[APP.lang] || LANG.en).catalog_copy["Nenhum plano ativo ainda. Preencha o diagnóstico e ative o Plano CoachIA."] + "</div>" + "" + "</div>" + "");
  }
  var summary = buildDiagnosticCoachSummary(active);
  var currentDay = calculateDiagnosticCurrentDay(active.plan_started_at, active.plan_duration_days || 7);
  var completionHtml = currentDay && currentDay >= (active.plan_duration_days || 7) ? renderDiagnosticCompletion(active) : '';
  var plan = active.coach_context_summary?.language === APP.lang ? active.coach_plan || t('diag_plan_fallback') : _buildInitialGoalDiagnosticPlan(active);
  return '<div class="card" style="padding:14px;margin-bottom:14px;border-left:3px solid var(--color-primary,#6c63ff);">'
    + renderDiagnosticProgress(active)
    + renderPlanTemplateSelector(active)
    + ("" + "<div style=\"display:flex;justify-content:space-between;gap:8px;align-items:center;\">" + "" + "<strong>" + (LANG[APP.lang] || LANG.en).catalog_copy["Meu Plano Atual"] + "</strong>" + "" + "<span style=\"font-size:11px;opacity:.65;\">" + t("diag_day") + " ") + (active.weekly_routine ? escHtml(t('week_title')) : (summary.plan_day || 1) + '/' + summary.plan_duration) + '</span></div>'
    + '<div style="font-size:12px;opacity:.7;margin:6px 0;">' + escHtml((localizeCatalogData(PLAN_TEMPLATES)[active.plan_template_id] || localizeCatalogData(PLAN_TEMPLATES).coachia_7d).name) + ' · ' + escHtml(summary.primary_saboteur || t('diag_unset')) + '</div>'
    + '<pre style="white-space:pre-wrap;font-family:inherit;font-size:12px;line-height:1.55;margin:0;background:var(--bg-secondary);border-radius:8px;padding:10px;">' + escHtml(plan) + '</pre>'
    + renderDailyDiagnosticCheckin(active)
    + completionHtml
    + ("<button onclick=\"personalizePlanFromDiagnostic()\" class=\"btn-primary\" style=\"width:100%;margin-top:10px;\">" + escHtml(t("diag_personalize")) + "</button>")
    + ("<button onclick=\"navigate('coach')\" class=\"btn-secondary\" style=\"width:100%;margin-top:10px;\">" + escHtml(t("diag_review")) + "</button>")
    + ("<button onclick=\"completeGoalDiagnostic();\" class=\"btn-secondary\" style=\"width:100%;margin-top:8px;\">" + escHtml(t("diag_complete")) + "</button>")
    + '</div>';
}

function renderDiagnosticHistory(history) {
  var html = ("" + "<h3 style=\"margin-bottom:8px;\">" + (LANG[APP.lang] || LANG.en).catalog_copy["Histórico"] + "</h3>" + "");
  if (!history || !history.length) {
    return html + ("" + "<div class=\"card\" style=\"padding:14px;text-align:center;font-size:13px;opacity:.65;\">" + (LANG[APP.lang] || LANG.en).catalog_copy["Nenhum diagnóstico arquivado ou concluído ainda."] + "</div>" + "");
  }
  return html + history.map(function(row) {
    var d = row.created_at ? new Date(row.created_at).toLocaleDateString() : '';
    return '<div class="card" style="padding:12px;margin-bottom:8px;">'
      + '<div style="display:flex;justify-content:space-between;gap:8px;"><strong style="font-size:13px;">' + escHtml(row.selected_plan_name || row.goal_text || 'Plano VitalIA') + '</strong><span style="font-size:11px;opacity:.55;">' + escHtml(row.status) + '</span></div>'
      + (row.weekly_routine ? '<button class="btn btn-outline" onclick="VitaliaWeek.open(\'' + escHtml(row.id) + '\')">' + escHtml(t('week_open')) + '</button>' : '')
      + '<div style="font-size:12px;opacity:.7;margin-top:4px;">' + escHtml(d) + ' · ' + escHtml(row.primary_saboteur || ((LANG[APP.lang] || LANG.en).catalog_copy["sem sabotador principal"])) + '</div>'
      + '</div>';
  }).join('');
}

async function saveGoalDiagnosticDraft() {
  var status = document.getElementById('gd-status');
  try {
    var sb = getVitaliaSupabaseClient();
    if (!sb) throw new Error('Supabase não disponível');
    var userRes = await sb.auth.getUser();
    var user = userRes.data && userRes.data.user;
    if (!user) throw new Error('Usuário não autenticado');
    var payload = _buildGoalDiagnosticPayload('draft');
    var safetySignal = payload._safetySignal;
    delete payload._safetySignal;
    payload.user_id = user.id;
    if (window._goalDiagnosticDraftId) {
      var upd = await sb.from('goal_diagnostics').update(payload).eq('id', window._goalDiagnosticDraftId).eq('user_id',user.id).eq('status','draft').select('id').single();
      if (upd.error || !upd.data?.id) throw upd.error || new Error('save_failed');
    } else {
      var ins = await sb.from('goal_diagnostics').insert([payload]).select('id').single();
      if (ins.error || !ins.data?.id) throw ins.error || new Error('save_failed');
      window._goalDiagnosticDraftId=ins.data.id;
    }
    if (status) { status.style.color = 'var(--color-success,#4caf50)'; status.textContent = safetySignal ? _goalDiagnosticSafetyText() : ((LANG[APP.lang] || LANG.en).catalog_copy["Rascunho salvo."]); }
    setTimeout(function(){ renderGoalDiagnostics(); }, 600);
  } catch(err) {
    if (status) { status.style.color = 'var(--color-danger,#f44)'; status.textContent = getLang().ui_save_error; }
  }
}

async function archivePreviousGoalDiagnostics(exceptId) {
  var sb = getVitaliaSupabaseClient();
  if (!sb) return;
  var userRes = await sb.auth.getUser();
  var user = userRes.data && userRes.data.user;
  if (!user) return;
  var q = sb.from('goal_diagnostics').update({ status:'archived', archived_at:new Date().toISOString(), updated_at:new Date().toISOString() }).eq('user_id', user.id).eq('status', 'active');
  if (exceptId) q = q.neq('id', exceptId);
  await q;
}

async function activateGoalDiagnostic() {
  var status = document.getElementById('gd-status');
  try {
    var sb = getVitaliaSupabaseClient();
    if (!sb) throw new Error('Supabase não disponível');
    var userRes = await sb.auth.getUser();
    var user = userRes.data && userRes.data.user;
    if (!user) throw new Error('Usuário não autenticado');
    var now = new Date();
    var ends = new Date(now.getTime() + 7 * 86400000);
    var payload = _buildGoalDiagnosticPayload('active');
    var safetySignal = payload._safetySignal;
    delete payload._safetySignal;
    payload.user_id = user.id;
    payload.selected_plan_type = 'coachia';
    payload.selected_plan_name = ((LANG[APP.lang] || LANG.en).catalog_copy["Plano CoachIA"]);
    payload.plan_template_id = 'coachia_7d';
    payload.plan_duration_days = 7;
    payload.plan_started_at = now.toISOString();
    payload.plan_ends_at = ends.toISOString();
    payload.activated_at = now.toISOString();
    payload.coach_plan = _buildInitialGoalDiagnosticPlan(payload);
    payload.coach_context_summary = buildDiagnosticCoachSummary(payload);
    var saved = await sb.rpc('vitalia_activate_goal_diagnostic',{p_payload:payload,p_draft_id:window._goalDiagnosticDraftId || null});
    if (saved.error) throw saved.error;
    if (saved.data) syncDiagnosticCoachContext(saved.data);
    if (typeof capturePostHogEvent === 'function') capturePostHogEvent('goal_diagnostic_activated', { goal_type: payload.goal_type, confidence_score: payload.confidence_score });
    if (status) { status.style.color = 'var(--color-success,#4caf50)'; status.textContent = safetySignal ? _goalDiagnosticSafetyText() : ((LANG[APP.lang] || LANG.en).catalog_copy["Plano CoachIA ativado."]); }
    setTimeout(function(){ renderGoalDiagnostics(); }, 700);
  } catch(err) {
    if (status) { status.style.color = 'var(--color-danger,#f44)'; status.textContent = getLang().ui_save_error; }
  }
}

async function completeGoalDiagnostic() {
  try {
    var sb = getVitaliaSupabaseClient();
    if (!sb) return;
    var userRes = await sb.auth.getUser();
    var user = userRes.data && userRes.data.user;
    if (!user) return;
    var mutationResult=await sb.from('goal_diagnostics').update({ status:'completed', completed_at:new Date().toISOString(), updated_at:new Date().toISOString() }).eq('user_id', user.id).eq('status', 'active').select('id');
  if(mutationResult.error || !mutationResult.data?.length)throw mutationResult.error || new Error('save_failed');
    try { localStorage.removeItem(userScopedKey('vitalia_coach_context_diagnostic')); } catch(error) {reportProgressHealthError('diagnostic',error);}
    renderGoalDiagnostics();
  } catch(error){reportProgressHealthError('diagnostic',error);}
}

function calculateDiagnosticCurrentDay(planStartedAt, planDurationDays) {
  if (!planStartedAt) return null;
  var day = Math.floor((Date.now() - new Date(planStartedAt).getTime()) / 86400000) + 1;
  if (day > planDurationDays) return planDurationDays;
  return Math.max(1, day);
}

function renderPlanTemplateSelector(active) {
  var current = (active && active.plan_template_id) || 'coachia_7d';
  return '<div style="display:grid;grid-template-columns:1fr;gap:8px;margin:10px 0;">'
    + Object.keys(localizeCatalogData(PLAN_TEMPLATES)).map(function(k) {
        var template = localizeCatalogData(PLAN_TEMPLATES)[k];
        var sel = current === k;
        return ("<button onclick=\"selectDiagnosticPlanTemplate('") + k + '\')" style="text-align:left;padding:10px;border-radius:10px;border:1px solid ' + (sel ? 'var(--color-primary,#6c63ff)' : 'var(--border-color)') + ';background:' + (sel ? 'rgba(108,99,255,.13)' : 'var(--bg-secondary)') + ';color:var(--text-primary);cursor:pointer;">'
          + '<div style="font-size:13px;font-weight:700;">' + template.icon + ' ' + escHtml(template.name) + '</div>'
          + '<div style="font-size:11px;opacity:.65;margin-top:2px;">' + escHtml(template.subtitle) + ' · ' + template.duration_days + (" " + escHtml(t("diag_days")) + "</div>")
          + '</button>';
      }).join('')
    + '</div>';
}

async function selectDiagnosticPlanTemplate(templateId) {
 try{
  var tmpl = localizeCatalogData(PLAN_TEMPLATES)[templateId];
  if (!tmpl) return;
  var sb = getVitaliaSupabaseClient();
  if (!sb) return;
  var res = await sb.auth.getUser();
  var user = res.data && res.data.user;
  if (!user) return;
  var diagRes = await sb.from('goal_diagnostics').select('*').eq('user_id', user.id).eq('status', 'active').maybeSingle();
  if(diagRes.error)throw diagRes.error;
  var diag = diagRes.data;
  if (!diag) return;
  var now = new Date();
  var ends = new Date(now.getTime() + tmpl.duration_days * 86400000);
  var mutationResult=await sb.from('goal_diagnostics').update({
    selected_plan_type: tmpl.id === 'coachia_7d' ? 'coachia' : 'template',
    selected_plan_name: tmpl.name,
    plan_template_id: tmpl.id,
    plan_duration_days: tmpl.duration_days,
    plan_started_at: now.toISOString(),
    plan_ends_at: ends.toISOString(),
    updated_at: now.toISOString()
  }).eq('id', diag.id).select('id');
  if(mutationResult.error || !mutationResult.data?.length)throw mutationResult.error || new Error('save_failed');
  syncDiagnosticCoachContext(Object.assign({}, diag, {
    selected_plan_name: tmpl.name,
    plan_template_id: tmpl.id,
    plan_duration_days: tmpl.duration_days,
    plan_started_at: now.toISOString(),
    plan_ends_at: ends.toISOString()
  }));
  renderGoalDiagnostics();

 }catch(error){reportProgressHealthError('diagnostic',error);}
}

async function personalizePlanFromDiagnostic() {
  var sb=getVitaliaSupabaseClient();if(!sb)return;
  try {
   var auth=await sb.auth.getUser(),user=auth.data && auth.data.user;if(!user)return;
   var result=await sb.from('goal_diagnostics').select('*').eq('user_id',user.id).eq('status','active').maybeSingle();
   if(result.error)throw result.error;var diag=result.data;
   if(!diag){navigate('coach');return;}
   var template=localizeCatalogData(PLAN_TEMPLATES)[diag.plan_template_id] || localizeCatalogData(PLAN_TEMPLATES).coachia_7d;
   var summary=buildDiagnosticCoachSummary(diag);
   var msg=t('diag_prefill').replace('{days}',diag.plan_duration_days || 7)+'\n'+template.name+'\n\n'+t('diag_prefill_rules')+'\n\n'+JSON.stringify({...summary,language:APP.lang});
   localStorage.setItem(userScopedKey('vitalia_coach_prefill_message'),msg);navigate('coach');
  } catch(_){reportProgressHealthError('CoachIA',getLang().ui_save_error);}
 }

function renderDiagnosticProgress(active) {
  if (active?.weekly_routine) {
    var cycle = active.weekly_routine.cycles.at(-1);
    var format = new Intl.DateTimeFormat(APP.lang,{dateStyle:'medium',timeZone:'UTC'});
    return '<p>'+escHtml(t('week_title'))+' · '+escHtml(format.format(new Date(cycle.start+'T12:00:00Z')))+' – '+escHtml(format.format(new Date(cycle.end+'T12:00:00Z')))+'</p>';
  }
  if (!active) return '';
  var duration = active.plan_duration_days || 7;
  var day = calculateDiagnosticCurrentDay(active.plan_started_at, duration) || 1;
  var pct = Math.min(100, Math.round((day / duration) * 100));
  var tmpl = localizeCatalogData(PLAN_TEMPLATES)[active.plan_template_id] || localizeCatalogData(PLAN_TEMPLATES).coachia_7d;
  var weekIndex = Math.min(tmpl.weeks.length - 1, Math.max(0, Math.ceil(day / 7) - 1));
  var week = tmpl.weeks[weekIndex] || tmpl.weeks[0];
  return '<div style="margin:10px 0;padding:10px;border-radius:8px;background:var(--bg-secondary);">'
    + ("<div style=\"display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;\"><strong>" + escHtml(t("diag_day")) + " ") + day + ' / ' + duration + '</strong><span>' + pct + '%</span></div>'
    + '<div style="height:8px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden;"><div style="width:' + pct + '%;height:100%;background:var(--color-primary,#6c63ff);"></div></div>'
    + '<div style="font-size:11px;opacity:.65;margin-top:6px;">' + escHtml((week && week.label ? week.label : t('diag_current_week')) + ': ' + (week && week.theme ? week.theme : tmpl.focus)) + '</div>'
    + '</div>';
}

function renderDailyDiagnosticCheckin(active) {
  if (active?.weekly_routine) return window.VITALIA_WEEKLY_ROUTINE_ENABLED===false ? '<button class="btn btn-outline" onclick="VitaliaWeek.open()">'+escHtml(t('week_open'))+'</button>' : window.VitaliaWeek.home();
  if (!active || active.status !== 'active') return '';
  var day = calculateDiagnosticCurrentDay(active.plan_started_at, active.plan_duration_days || 7) || 1;
  return '<div style="margin-top:12px;padding:10px;border-radius:8px;background:var(--bg-secondary);">'
    + ("<div style=\"font-size:13px;font-weight:700;margin-bottom:8px;\">" + escHtml(t("diag_day")) + " ") + day + (" — " + escHtml(t("diag_checkin_title")) + "</div>")
    + ("<label style=\"font-size:11px;\">" + escHtml(t("diag_adherence")) + "</label><input id=\"diag-adherence\" type=\"range\" min=\"0\" max=\"10\" value=\"7\" style=\"width:100%;\">")
    + ("<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;\"><div><label style=\"font-size:11px;\">" + escHtml(t("diag_mood")) + "</label><input id=\"diag-mood\" type=\"number\" min=\"1\" max=\"5\" value=\"3\" style=\"width:100%;box-sizing:border-box;padding:7px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);\"></div><div><label style=\"font-size:11px;\">" + escHtml(t("diag_difficulty")) + "</label><input id=\"diag-difficulty\" type=\"number\" min=\"1\" max=\"5\" value=\"3\" style=\"width:100%;box-sizing:border-box;padding:7px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);\"></div></div>")
    + ("<textarea id=\"diag-note\" rows=\"2\" placeholder=\"" + escHtml(t("diag_note")) + "\" style=\"width:100%;box-sizing:border-box;margin-top:8px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);resize:vertical;\"></textarea>")
    + ("<button onclick=\"saveDiagnosticCheckin('") + active.id + '\',' + day + (",{adherence_score:parseInt(document.getElementById('diag-adherence').value),mood_score:parseInt(document.getElementById('diag-mood').value),difficulty_level:parseInt(document.getElementById('diag-difficulty').value),note:document.getElementById('diag-note').value})\" class=\"btn-secondary\" style=\"width:100%;margin-top:8px;\">" + escHtml(t("diag_save_checkin")) + "</button>")
    + '<div id="diag-checkin-status" style="min-height:18px;text-align:center;font-size:12px;margin-top:6px;"></div>'
    + '</div>';
}

async function saveDiagnosticCheckin(diagnosticId, dayNumber, data) {
  var status = document.getElementById('diag-checkin-status');
  try {
    var sb = getVitaliaSupabaseClient();
    if (!sb) throw new Error('Supabase não disponível');
    var res = await sb.auth.getUser();
    var user = res.data && res.data.user;
    if (!user) throw new Error('Usuário não autenticado');
    var note = data.note || null;
    if (_goalDiagnosticHasSafetySignal(note) && status) {
      status.style.color = 'var(--color-warning,#ff9800)';
      status.textContent = _goalDiagnosticSafetyText();
    }
    var saved = await sb.from('diagnostic_checkins').upsert([{
      diagnostic_id: diagnosticId,
      user_id: user.id,
      day_number: dayNumber,
      adherence_score: data.adherence_score,
      mood_score: data.mood_score,
      difficulty_level: data.difficulty_level,
      note: note
    }], { onConflict: 'diagnostic_id,day_number' });
    if(saved.error)throw saved.error;
    await updateDiagnosticCoachContextWithCheckins(diagnosticId);
    if (status && !_goalDiagnosticHasSafetySignal(note)) { status.style.color = 'var(--color-success,#4caf50)'; status.textContent = t('diag_checkin_saved'); }
    setTimeout(function(){ renderGoalDiagnostics(); }, 700);
  } catch(err) {
    if (status) { status.style.color = 'var(--color-danger,#f44)'; status.textContent = getLang().ui_save_error; }
  }
}

function renderDiagnosticCompletion(active) {
  if (active?.weekly_routine) return ''; // Weekly review never completes a plan silently.
  if (!active) return '';
  if (!window._diagnosticCompletionMarked) {
    window._diagnosticCompletionMarked = {};
  }
  if (!window._diagnosticCompletionMarked[active.id]) {
    window._diagnosticCompletionMarked[active.id] = true;
    setTimeout(function(){ completeDiagnosticPlan(active.id, true); }, 0);
  }
  return '<div style="margin-top:12px;padding:12px;border-radius:8px;background:#4caf5014;border:1px solid #4caf50;">'
    + ("<div style=\"font-weight:700;\">🎉 " + escHtml(t("diag_cycle_completed")) + "</div>")
    + '<div style="font-size:12px;opacity:.75;margin-top:4px;">'+escHtml(t('diag_cycle_info').replace('{days}',active.plan_duration_days || 7))+'</div>'
    + '<div style="font-size:12px;opacity:.75;margin-top:4px;">'+escHtml(t('diag_cycle_notes'))+'</div>'
    + ("<button onclick=\"restartDiagnosticCycle()\" class=\"btn-secondary\" style=\"width:100%;margin-top:8px;\">" + escHtml(t("diag_restart")) + "</button>")
    + ("<button onclick=\"navigate('coach')\" class=\"btn-secondary\" style=\"width:100%;margin-top:8px;\">" + escHtml(t("diag_talk")) + "</button>")
    + '</div>';
}

async function completeDiagnosticPlan(id, silent) {
  try {
    var sb = getVitaliaSupabaseClient();
    if (!sb) return;
    var q = sb.from('goal_diagnostics').update({ status:'completed', completed_at:new Date().toISOString(), updated_at:new Date().toISOString() });
    if (id) q = q.eq('id', id);
    else {
      var res = await sb.auth.getUser();
      var user = res.data && res.data.user;
      if (!user) return;
      q = q.eq('user_id', user.id).eq('status', 'active');
    }
    var mutationResult=await q.select('id');
    if(mutationResult.error || !mutationResult.data?.length)throw mutationResult.error || new Error('save_failed');
    try { localStorage.removeItem(userScopedKey('vitalia_coach_context_diagnostic')); } catch(error) {reportProgressHealthError('diagnostic',error);if(id && window._diagnosticCompletionMarked)delete window._diagnosticCompletionMarked[id];}
    if (!silent) renderGoalDiagnostics();
  } catch(error){reportProgressHealthError('diagnostic',error);if(id && window._diagnosticCompletionMarked)delete window._diagnosticCompletionMarked[id];}
}

async function restartDiagnosticCycle() {
 try{
  var sb = getVitaliaSupabaseClient();
  if (!sb) return;
  var res = await sb.auth.getUser();
  var user = res.data && res.data.user;
  if (!user) return;
  var mutationResult=await sb.from('goal_diagnostics')
    .update({ status:'archived', archived_at:new Date().toISOString(), updated_at:new Date().toISOString() })
    .eq('user_id', user.id)
    .in('status', ['completed', 'active']).select('id');
  if(mutationResult.error || !mutationResult.data?.length)throw mutationResult.error || new Error('save_failed');
  try { localStorage.removeItem(userScopedKey('vitalia_coach_context_diagnostic')); } catch(error) {reportProgressHealthError('diagnostic',error);}
  renderGoalDiagnostics();

 }catch(error){reportProgressHealthError('diagnostic',error);}
}

async function updateDiagnosticCoachContextWithCheckins(diagnosticId) {
 try{
  var sb = getVitaliaSupabaseClient();
  if (!sb) return;
  var res = await sb.from('diagnostic_checkins')
    .select('*')
    .eq('diagnostic_id', diagnosticId)
    .order('day_number', { ascending:false })
    .limit(7);
  if(res.error)throw res.error;
  var checkins = (res.data || []).filter(function(c){return c.adherence_score != null;});
  if (!checkins.length) return;
  var avgAdherence = Math.round(checkins.reduce(function(s,c){ return s + (c.adherence_score || 0); }, 0) / checkins.length);
  var lastCheckin = checkins[0];
  var existing = {};
  try { existing = JSON.parse(localStorage.getItem(userScopedKey('vitalia_coach_context_diagnostic')) || '{}'); } catch(error) {reportProgressHealthError('diagnostic',error);}
  localStorage.setItem(userScopedKey('vitalia_coach_context_diagnostic'), JSON.stringify(Object.assign({}, existing, {
    adherence_average: avgAdherence,
    last_checkin_day: lastCheckin.day_number,
    last_adherence: lastCheckin.adherence_score,
    last_mood: lastCheckin.mood_score,
    last_difficulty: lastCheckin.difficulty_level,
    last_note: lastCheckin.note || null,
    low_adherence_alert: avgAdherence < 5
  })));

 }catch(error){reportProgressHealthError('diagnostic',error);}
}
// Weekly actions are an extension of the existing diagnostic, never a second plan.
window.VitaliaWeek = (function () {
  var model = null,
    rows = [],
    owner = null,
    busy = false,
    generation = 0;
  var reviewViews = new Set();
  var states = ['unrecorded', 'done', 'not_done', 'postponed', 'dismissed'];
  var difficulties = ['', 'time', 'cost', 'tired', 'forgot', 'hard', 'other'];
  function label(key) {
    return t('week_' + key);
  }
  function safetyText(text) {
    var risk = VITALIA_CLINICAL.classifySharedClinicalRisk(text);
    return risk === 'normal_nutrition'
      ? _goalDiagnosticSafetyText()
      : VITALIA_CLINICAL.buildClinicalContextGuidance(APP.lang, risk, text);
  }
  function e(value) {
    return escHtml(String(value == null ? '' : value));
  }
  function day(date, zone) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }
  function add(date, n) {
    return new Date(Date.parse(date + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10);
  }
  function span(a, b) {
    return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000);
  }
  function pretty(date) {
    return new Intl.DateTimeFormat(APP.lang, { dateStyle: 'medium', timeZone: 'UTC' }).format(
      new Date(date + 'T12:00:00Z')
    );
  }
  function summary(cycle, checkins, today) {
    var result = {
      done: 0,
      not_done: 0,
      postponed: 0,
      dismissed: 0,
      unrecorded: 0,
      total: 0,
      difficulties: {}
    };
    for (var d = cycle.start; d <= cycle.end && d <= today; d = add(d, 1)) {
      var record = checkins.find(function (r) {
        return r.routine_date === d;
      });
      var data = record && record.routine_data;
      cycle.actions.forEach(function (_, i) {
        var state = (data && data.states[i]) || 'unrecorded';
        result[states.includes(state) ? state : 'unrecorded']++;
        result.total++;
      });
      if (data && difficulties.includes(data.difficulty) && data.difficulty)
        result.difficulties[data.difficulty] = (result.difficulties[data.difficulty] || 0) + 1;
    }
    return result;
  }
  function comparison(previous, current, checkins, today) {
    if (
      !previous ||
      previous.end >= today ||
      current.end >= today ||
      span(previous.start, previous.end) !== span(current.start, current.end) ||
      JSON.stringify(previous.actions) !== JSON.stringify(current.actions)
    )
      return null;
    if (
      checkins.some(function (r) {
        var c =
          r.routine_date >= current.start && r.routine_date <= current.end
            ? current
            : r.routine_date >= previous.start && r.routine_date <= previous.end
              ? previous
              : null;
        return (
          c &&
          r.routine_data?.replacements &&
          JSON.stringify(r.routine_data.replacements) !== JSON.stringify(c.actions)
        );
      })
    )
      return null;
    var before = summary(previous, checkins, today),
      after = summary(current, checkins, today);
    if (before.unrecorded || after.unrecorded) return null;
    return { previous: before.done, current: after.done, total: after.total };
  }
  function host() {
    return document.getElementById('week-content');
  }
  function currentOwner() {
    return APP.user && APP.user.id;
  }
  function valid() {
    return !!owner && owner === currentOwner() && !!host();
  }
  function button(action, text) {
    return (
      '<button type="button" class="btn btn-outline" style="min-height:44px;white-space:normal" onclick="VitaliaWeek.' +
      action +
      '">' +
      e(text) +
      '</button>'
    );
  }
  function field(id, title, value, limit) {
    return (
      '<label style="display:block;margin:12px 0">' +
      e(title) +
      '<input id="' +
      id +
      '" maxlength="' +
      limit +
      '" value="' +
      e(value) +
      '" style="display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:12px;background:var(--bg-secondary);color:var(--text-primary);border:1px solid var(--border-color);border-radius:10px"></label>'
    );
  }
  function select(id, title, values, value) {
    return (
      '<label style="display:block;margin:12px 0">' +
      e(title) +
      '<select id="' +
      id +
      '" style="display:block;width:100%;padding:12px;background:var(--bg-secondary);color:var(--text-primary);border:1px solid var(--border-color);border-radius:10px">' +
      values
        .map(function (v) {
          return (
            '<option value="' +
            e(v[0]) +
            '"' +
            (v[0] === value ? ' selected' : '') +
            '>' +
            e(v[1]) +
            '</option>'
          );
        })
        .join('') +
      '</select></label>'
    );
  }
  function report(error) {
    if (valid()) {
      var s = document.getElementById('week-status');
      if (s)
        s.textContent = label(
          error && String(error.message).includes('conflict') ? 'conflict' : 'error'
        );
    }
  }
  function shell() {
    if (window.VITALIA_WEEKLY_ROUTINE_ENABLED === false) return '';
    setTimeout(loadHome, 0);
    return (
      '<section class="premium-card" style="padding:18px;margin:4px 0 14px"><h2 style="font-size:18px;margin:0 0 8px">' +
      e(label('title')) +
      '</h2><p style="color:var(--text2);line-height:1.5">' +
      e(label('intro')) +
      '</p>' +
      '<div id="week-home" aria-live="polite"></div>' +
      button('open()', label('open')) +
      '</section>'
    );
  }
  async function loadHome() {
    var target = document.getElementById('week-home'),
      account = currentOwner();
    if (!target || !account) return;
    target.textContent = label('loading');
    try {
      var sb = getVitaliaSupabaseClient();
      if (!sb) throw new Error('unavailable');
      var result = await sb
        .from('goal_diagnostics')
        .select('id,goal_text,weekly_routine')
        .eq('user_id', account)
        .eq('status', 'active')
        .maybeSingle();
      if (result.error) throw result.error;
      var plan = result.data,
        routine = plan?.weekly_routine,
        cycle = routine?.cycles.at(-1);
      var html = '<p>' + e(plan?.goal_text || label('no_plan')) + '</p>';
      if (cycle) {
        var today = day(new Date(), routine.timezone);
        var checks = await sb
          .from('diagnostic_checkins')
          .select('routine_date,routine_data')
          .eq('diagnostic_id', plan.id)
          .eq('user_id', account);
        if (checks.error) throw checks.error;
        var items = checks.data || [],
          record = items.find(function (r) {
            return r.routine_date === today;
          })?.routine_data;
        var stats = summary(cycle, items, today);
        if (today <= cycle.end)
          html +=
            '<ul>' +
            cycle.actions
              .map(function (a, i) {
                return (
                  '<li>' +
                  e(record?.replacements?.[i] || a) +
                  ' · ' +
                  e(label(record?.states?.[i] || 'unrecorded')) +
                  '</li>'
                );
              })
              .join('') +
            '</ul>';
        html +=
          '<p>' +
          e(label('done')) +
          ': ' +
          stats.done +
          ' / ' +
          stats.total +
          ' · ' +
          e(label('unrecorded')) +
          ': ' +
          stats.unrecorded +
          '</p>';
      }
      if (account === currentOwner() && document.getElementById('week-home') === target)
        target.innerHTML = html;
    } catch (_) {
      if (account === currentOwner() && document.getElementById('week-home') === target)
        target.textContent = label('error');
    }
  }
  async function open(id) {
    var token = ++generation;
    owner = currentOwner();
    model = null;
    rows = [];
    draft = null;
    resetAutosave();
    busy = false;
    openModal(
      label('title'),
      '<div id="week-content" style="line-height:1.5">' +
        e(label('loading')) +
        '</div><div id="week-status" role="status" aria-live="polite"></div>'
    );
    document.getElementById('modal-overlay')?.addEventListener?.('click', guardClose, true);
    try {
      var sb = getVitaliaSupabaseClient();
      if (!sb || !owner) throw new Error('authentication_required');
      var auth = await sb.auth.getUser();
      if (auth.error || auth.data.user?.id !== owner) throw new Error('authentication_required');
      var query = sb.from('goal_diagnostics').select('*').eq('user_id', owner);
      var res = await (id ? query.eq('id', id) : query.eq('status', 'active')).maybeSingle();
      if (res.error) throw res.error;
      if (token !== generation || !valid()) return;
      model = res.data;
      if (!model) {
        var history = await sb
          .from('goal_diagnostics')
          .select('id,goal_text,weekly_routine')
          .eq('user_id', owner)
          .order('created_at', { ascending: false });
        if (history.error) throw history.error;
        if (token !== generation || !valid()) return;
        host().innerHTML =
          '<p>' +
          e(label('no_plan')) +
          '</p>' +
          button('plan()', label('plan')) +
          (history.data || [])
            .filter(function (r) {
              return r.weekly_routine && /^[a-f0-9-]{36}$/i.test(r.id);
            })
            .map(function (r) {
              return '<p>' + button("open('" + r.id + "')", r.goal_text) + '</p>';
            })
            .join('');
        return;
      }
      // Probe the additive schema before offering edits. Never pretend persistence succeeded.
      var checks = await sb
        .from('diagnostic_checkins')
        .select('day_number,note,routine_date,routine_data')
        .eq('diagnostic_id', model.id)
        .eq('user_id', owner);
      if (checks.error) throw checks.error;
      if (token !== generation || !valid()) return;
      rows = checks.data || [];
      if (!model.weekly_routine && model.status === 'active') setup();
      else if (model.weekly_routine) render();
      else host().textContent = label('no_plan');
    } catch (error) {
      if (token === generation && valid()) {
        host().innerHTML = button('open()', label('open'));
        report(error);
      }
    }
  }
  async function plan() {
    if (await close()) navigate('diagnostic');
  }
  // Local, reviewed habits. IDs shared with Meu Dia where the action is equivalent.
  var habitCatalog = [
    { id: 'water_log', pillar: 'hydration', minutes: 1 },
    { id: 'meal_photo', pillar: 'nutrition', minutes: 1 },
    { id: 'meal_note', pillar: 'nutrition', minutes: 2 },
    { id: 'sleep_review', pillar: 'sleep', minutes: 0 },
    { id: 'sleep_log', pillar: 'sleep', minutes: 1 },
    { id: 'mind_pause', pillar: 'mind', minutes: 2 },
    { id: 'mind_check', pillar: 'mind', minutes: 1 },
    { id: 'recipe_review', pillar: 'nutrition', minutes: 3 },
    { id: 'walk_5', pillar: 'movement', minutes: 5 },
    { id: 'walk_10', pillar: 'movement', minutes: 10 },
    { id: 'walk_20', pillar: 'movement', minutes: 20 }
  ];
  var timeOptions = [5, 10, 20, 30, 45],
    draft = null;
  function detectedZone() {
    try {
      var zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      day(new Date(), zone);
      return zone || 'UTC';
    } catch (_) {
      return 'UTC';
    }
  }
  function suggestions(goal, minutes, values) {
    var priorities = {
      weight_loss: 'nutrition',
      muscle_gain: 'movement',
      energy: 'sleep',
      compulsion: 'mind',
      nutrition: 'nutrition',
      performance: 'movement',
      health: 'hydration'
    };
    var walk = minutes >= 20 ? 'walk_20' : minutes >= 10 ? 'walk_10' : 'walk_5';
    return habitCatalog
      .filter(function (h) {
        return h.minutes <= minutes && (!h.id.startsWith('walk_') || h.id === walk);
      })
      .map(function (h, index) {
        var score = values?.[h.pillar];
        // Missing data is unknown, never a fabricated weak score.
        return {
          habit: h,
          index: index,
          rank:
            (typeof score === 'number' && Number.isFinite(score) ? Math.max(0, 100 - score) : 0) +
            (priorities[goal] === h.pillar ? 35 : 0)
        };
      })
      .sort(function (a, b) {
        return b.rank - a.rank || a.index - b.index;
      })
      .slice(0, 8)
      .map(function (x) {
        return x.habit;
      });
  }
  function actionTitle(h) {
    return label('habit_' + h.id);
  }
  function actionReason(text) {
    var habit = habitCatalog.find(function (h) {
      return ['pt', 'en', 'es', 'ru'].some(function (lang) {
        return LANG[lang]?.['week_habit_' + h.id] === text;
      });
    });
    return label(habit ? 'why_' + habit.pillar : 'custom_why');
  }
  function validateActions(actions) {
    return (
      Array.isArray(actions) &&
      actions.length >= 1 &&
      actions.length <= 3 &&
      actions.every(function (a) {
        return typeof a === 'string' && !!a.trim() && a.trim().length <= 240;
      }) &&
      new Set(
        actions.map(function (a) {
          return a.trim().toLocaleLowerCase();
        })
      ).size === actions.length
    );
  }
  function introKey() {
    return userScopedKey(VITALIA_WEEK_INTRO_STORAGE_KEY, owner);
  }
  function introDone() {
    if (!valid()) return;
    vitaliaStorageSet(introKey(), true);
    drawSetup();
  }
  function setup() {
    if (
      !valid() ||
      !model ||
      model.status !== 'active' ||
      window.VITALIA_WEEKLY_ROUTINE_ENABLED === false
    )
      return;
    if (APP.profile?.age != null && Number(APP.profile.age) < 18) {
      host().textContent = label('adult_only');
      return;
    }
    var routine = model.weekly_routine,
      previous = routine?.cycles.at(-1);
    var zone = routine?.timezone || detectedZone(),
      today = day(new Date(), zone);
    if (previous && today <= previous.end) return;
    var values = {};
    try {
      values = window.VitaliaDaily?.snapshot().values || {};
    } catch (_) {
      /* unknown pillars remain unknown */
    }
    draft = {
      owner: owner,
      step: 1,
      minutes: null,
      zone: zone,
      end: add(today, 6),
      adult: !!routine?.adult_confirmed,
      selected: [],
      custom: '',
      values: values
    };
    if (!vitaliaStorageGet(introKey(), false)) {
      host().innerHTML =
        '<p>' +
        e(label('simple_intro')) +
        '</p><div data-week-intro>' +
        [1, 2, 3]
          .map(function (i) {
            return (
              '<section class="premium-card" style="padding:16px;margin:12px 0"><span style="color:var(--green)">' +
              i +
              '</span><p>' +
              e(label('intro_' + i)) +
              '</p></section>'
            );
          })
          .join('') +
        '</div>' +
        button('introDone()', label('intro_continue')) +
        button('introDone()', label('intro_skip'));
    } else drawSetup();
  }
  function setupValid() {
    return valid() && draft?.owner === owner && model?.status === 'active' && !busy;
  }
  function minutesLabel(n) {
    return label(n === 45 ? 'time_plus' : 'time_value').replace('{minutes}', n);
  }
  function setTime(n) {
    if (!setupValid() || !timeOptions.includes(n)) return;
    draft.minutes = n;
    // Keep selections only if their combined estimate still fits the chosen time.
    var total = 0;
    draft.selected = draft.selected.filter(function (item) {
      if (total + (item.minutes || 0) > n) return false;
      total += item.minutes || 0;
      return true;
    });
    drawSetup();
  }
  function moveStep(n) {
    if (!setupValid() || ![1, 2, 3].includes(n)) return;
    if (n > 1 && !draft.minutes) return;
    if (
      n === 3 &&
      !validateActions(
        draft.selected.map(function (x) {
          return x.title;
        })
      )
    )
      return;
    draft.step = n;
    drawSetup();
    var title = document.getElementById('week-step-title');
    if (title) title.focus();
  }
  function toggleHabit(id) {
    if (!setupValid()) return;
    var existing = draft.selected.findIndex(function (x) {
      return x.id === id;
    });
    if (existing >= 0) draft.selected.splice(existing, 1);
    else {
      var h = suggestions(model.goal_type, draft.minutes, draft.values).find(function (x) {
        return x.id === id;
      });
      if (
        !h ||
        draft.selected.length >= 3 ||
        draft.selected.reduce(function (sum, x) {
          return sum + (x.minutes || 0);
        }, 0) +
          h.minutes >
          draft.minutes
      )
        return;
      draft.selected.push({ id: h.id, title: actionTitle(h), minutes: h.minutes });
    }
    drawSetup();
  }
  function addCustom() {
    if (!setupValid()) return;
    var input = document.getElementById('week-custom'),
      text = input?.value.trim() || '';
    var actions = draft.selected
      .map(function (x) {
        return x.title;
      })
      .concat(text);
    if (!validateActions(actions)) {
      document.getElementById('week-custom-status').textContent = label('custom_invalid');
      return;
    }
    if (_goalDiagnosticHasSafetySignal(text)) {
      document.getElementById('week-custom-status').textContent = safetyText(text);
      return;
    }
    draft.selected.push({ id: 'custom_' + Date.now(), title: text, minutes: 0 });
    draft.custom = '';
    drawSetup();
  }
  function changeAdvanced() {
    if (!setupValid()) return;
    try {
      var zone = document.getElementById('week-zone').value.trim(),
        today = day(new Date(), zone);
      var end = document.getElementById('week-end').value;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(end) || end < today || end > add(today, 6))
        throw Error('end');
      if (model.weekly_routine && zone !== model.weekly_routine.timezone) throw Error('zone');
      draft.zone = zone;
      draft.end = end;
      drawSetup();
    } catch (_) {
      document.getElementById('week-advanced-status').textContent = label('advanced_invalid');
    }
  }
  function setCustom(value) {
    if (setupValid()) draft.custom = String(value).slice(0, 240);
  }
  function setAdult(value) {
    if (setupValid()) {
      draft.adult = !!value;
      updateStart();
    }
  }
  function updateStart() {
    var b = document.getElementById('week-start');
    if (b) {
      b.disabled = !draft?.adult || busy;
      b.style.opacity = b.disabled ? '.45' : '1';
    }
  }
  function drawSetup() {
    if (!setupValid()) return;
    var today = day(new Date(), draft.zone);
    if (draft.end < today || draft.end > add(today, 6)) draft.end = add(today, 6);
    var html =
      '<p>' +
      e(label('simple_intro')) +
      '</p><p style="font-size:12px;color:var(--green)">' +
      e(label('step_count').replace('{step}', draft.step)) +
      '</p><h3 id="week-step-title" tabindex="-1">' +
      e(label('step_' + draft.step)) +
      '</h3>';
    if (draft.step === 1) {
      html +=
        '<div style="display:flex;flex-wrap:wrap;gap:10px">' +
        timeOptions
          .map(function (n) {
            return (
              '<button type="button" class="btn btn-outline" style="min-height:48px;flex:1 0 28%;border-color:' +
              (draft.minutes === n ? 'var(--green)' : 'var(--border)') +
              '" aria-pressed="' +
              (draft.minutes === n) +
              '" onclick="VitaliaWeek.setTime(' +
              n +
              ')">' +
              e(minutesLabel(n)) +
              '</button>'
            );
          })
          .join('') +
        '</div><p>' +
        e(label('time_note')) +
        '</p><button type="button" class="btn btn-primary" style="min-height:48px;width:100%" ' +
        (!draft.minutes ? 'disabled' : '') +
        ' onclick="VitaliaWeek.moveStep(2)">' +
        e(label('continue')) +
        '</button>';
    } else if (draft.step === 2) {
      var used = draft.selected.reduce(function (sum, x) {
        return sum + (x.minutes || 0);
      }, 0);
      html +=
        '<p>' +
        e(label('selection_count').replace('{count}', draft.selected.length)) +
        '</p><div style="display:grid;gap:10px">' +
        suggestions(model.goal_type, draft.minutes, draft.values)
          .map(function (h) {
            var chosen = draft.selected.some(function (x) {
              return x.id === h.id;
            });
            return (
              '<button type="button" class="premium-card" data-habit="' +
              h.id +
              '" aria-pressed="' +
              chosen +
              '" ' +
              (!chosen && (draft.selected.length >= 3 || used + h.minutes > draft.minutes)
                ? 'disabled'
                : '') +
              ' onclick="VitaliaWeek.toggleHabit(\'' +
              h.id +
              '\')" style="text-align:left;width:100%;margin:0;box-sizing:border-box;min-width:0;overflow-wrap:anywhere;padding:14px;min-height:88px;color:var(--text);border:1px solid ' +
              (chosen ? 'var(--green)' : 'var(--border)') +
              ';background:' +
              (chosen ? 'rgba(34,197,94,.12)' : 'var(--surface)') +
              ';border-radius:14px"><strong>' +
              (chosen ? '✓ ' : '') +
              e(actionTitle(h)) +
              '</strong><span style="display:block;font-size:12px;color:var(--text2);margin-top:5px">' +
              e(label('why_' + h.pillar)) +
              '</span><span style="display:block;font-size:12px;color:var(--green);margin-top:4px">' +
              e(h.minutes ? minutesLabel(h.minutes) : label('no_extra')) +
              '</span></button>'
            );
          })
          .join('') +
        '</div><p style="font-size:12px">' +
        e(label('selection_note')) +
        '</p><details id="week-custom-details"><summary>' +
        e(label('custom')) +
        '</summary><p>' +
        e(label('custom_rule')) +
        '</p><label>' +
        e(label('custom')) +
        '<input id="week-custom" maxlength="240" oninput="VitaliaWeek.setCustom(this.value)" style="width:100%;box-sizing:border-box;padding:12px;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:10px" placeholder="' +
        e(label('custom_example')) +
        '"></label><p>' +
        e(label('custom_time')) +
        '</p><p id="week-custom-status" role="status"></p>' +
        button('addCustom()', label('custom_add')) +
        '</details><div id="week-selected" style="margin:12px 0"></div><p id="week-selection-help">' +
        e(label(draft.selected.length ? 'selection_ready' : 'selection_required')) +
        '</p><button type="button" class="btn btn-primary" style="min-height:48px;width:100%" ' +
        (!draft.selected.length ? 'disabled' : '') +
        ' aria-describedby="week-selection-help" onclick="VitaliaWeek.moveStep(3)">' +
        e(label('continue')) +
        '</button>';
    } else {
      html +=
        '<section class="premium-card" style="padding:16px"><p>' +
        e(label('daily_time')) +
        ': ' +
        e(minutesLabel(draft.minutes)) +
        '</p><ol id="week-summary-actions" style="padding-left:20px;overflow-wrap:anywhere"></ol><p>' +
        e(label('until')) +
        ' <strong>' +
        e(
          new Intl.DateTimeFormat(APP.lang, {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
            timeZone: 'UTC'
          }).format(new Date(draft.end + 'T12:00:00Z'))
        ) +
        '</strong></p></section><details style="margin:16px 0"><summary>' +
        e(label('advanced')) +
        '</summary><details><summary>' +
        e(label('change_zone')) +
        '</summary>' +
        field('week-zone', label('zone'), draft.zone, 80) +
        (model.weekly_routine ? '<p>' + e(label('zone_locked')) + '</p>' : '') +
        '</details><label>' +
        e(label('end')) +
        '<input id="week-end" type="date" min="' +
        today +
        '" max="' +
        add(today, 6) +
        '" value="' +
        draft.end +
        '" style="display:block;min-height:44px;max-width:100%"></label><p id="week-advanced-status" role="status"></p>' +
        button('changeAdvanced()', label('apply_options')) +
        '</details><label style="display:block;padding:12px 0"><input id="week-adult" type="checkbox" ' +
        (draft.adult ? 'checked' : '') +
        ' onchange="VitaliaWeek.setAdult(this.checked)"> ' +
        e(label('adult_short')) +
        '</label><button id="week-start" type="button" class="btn btn-primary" style="min-height:48px;width:100%" onclick="VitaliaWeek.accept()" ' +
        (!draft.adult ? 'disabled' : '') +
        '>' +
        e(label('start')) +
        '</button>';
    }
    html +=
      '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">' +
      (draft.step > 1 ? button('moveStep(' + (draft.step - 1) + ')', label('back')) : '') +
      button('close()', label('cancel')) +
      '</div><details style="margin-top:16px"><summary>ⓘ ' +
      e(label('learn_more')) +
      '</summary><p>' +
      e(label('intro')) +
      '</p></details>';
    host().innerHTML = html;
    // User-written text is only ever assigned through DOM textContent/value.
    var list = document.getElementById(draft.step === 3 ? 'week-summary-actions' : 'week-selected');
    if (list)
      draft.selected.forEach(function (item) {
        var node = document.createElement(draft.step === 3 ? 'li' : 'div');
        node.textContent = item.title;
        if (draft.step === 2) {
          var remove = document.createElement('button');
          remove.type = 'button';
          remove.className = 'btn btn-outline';
          remove.style.minHeight = '44px';
          remove.textContent = label('remove');
          remove.setAttribute('aria-label', label('remove') + ': ' + item.title);
          remove.addEventListener('click', function () {
            if (setupValid()) {
              draft.selected = draft.selected.filter(function (x) {
                return x.id !== item.id;
              });
              drawSetup();
            }
          });
          node.appendChild(remove);
        }
        list.appendChild(node);
      });
    var customInput = document.getElementById('week-custom');
    if (customInput) {
      customInput.value = draft.custom;
      if (draft.custom) document.getElementById('week-custom-details').open = true;
    }
    updateStart();
    var zoneInput = document.getElementById('week-zone');
    if (zoneInput) zoneInput.disabled = !!model.weekly_routine;
  }

  async function commit(routine, date, check, automatic) {
    if (busy || !valid() || window.VITALIA_WEEKLY_ROUTINE_ENABLED === false) return false;
    busy = true;
    lastCommitError = null;
    var account = owner,
      token = generation;
    if (!automatic)
      host()
        .querySelectorAll('button')
        .forEach(function (b) {
          b.disabled = true;
        });
    try {
      var sb = getVitaliaSupabaseClient(),
        revision = model.weekly_routine?.revision || 0;
      routine.revision = revision + 1;
      var res = await sb.rpc('vitalia_save_weekly_routine', {
        p_id: model.id,
        p_revision: revision,
        p_routine: routine,
        p_date: date || null,
        p_check: check || null
      });
      if (res.error) throw res.error;
      if (token !== generation || account !== currentOwner() || !valid()) return false;
      var confirmed = Array.isArray(res.data) ? res.data[0] : res.data;
      if (!confirmed?.weekly_routine || confirmed.id !== model.id) throw new Error('save_failed');
      model = confirmed;
      if (!automatic) document.getElementById('week-status').textContent = label('saved');
      return true;
    } catch (error) {
      lastCommitError = error;
      if (!automatic) report(error);
      return false;
    } finally {
      if (token === generation) {
        busy = false;
        if (valid() && !automatic)
          host()
            .querySelectorAll('button')
            .forEach(function (b) {
              b.disabled = false;
            });
        if (valid() && draft) updateStart();
      }
    }
  }
  function track(event, step) {
    if (typeof window.vitaliaTrackEvent === 'function')
      window.vitaliaTrackEvent(
        event,
        Object.assign({ surface: 'weekly_routine' }, step == null ? {} : { step: step })
      );
  }
  async function accept() {
    if (busy || !valid()) return;
    try {
      if (!setupValid() || draft.step !== 3) throw new Error('required');
      var zone = draft.zone,
        today = day(new Date(), zone);
      var availability = minutesLabel(draft.minutes),
        actions = draft.selected.map(function (x) {
          return x.title.trim();
        });
      if (
        !timeOptions.includes(draft.minutes) ||
        !validateActions(actions) ||
        !draft.adult ||
        (APP.profile?.age != null && Number(APP.profile.age) < 18) ||
        draft.end < today ||
        draft.end > add(today, 6)
      )
        throw new Error('required');
      if (_goalDiagnosticHasSafetySignal(actions.join(' '))) {
        document.getElementById('week-status').textContent = safetyText(actions.join(' '));
        return;
      }
      var old = model.weekly_routine;
      if (old && today <= old.cycles.at(-1).end) throw new Error('conflict');
      var end = draft.end;
      var routine = old
        ? JSON.parse(JSON.stringify(old))
        : {
            revision: 0,
            adult_confirmed: true,
            timezone: zone,
            origin: day(new Date(model.plan_started_at || model.created_at), zone),
            cycles: []
          };
      routine.cycles.push({
        start: today,
        end: end,
        availability: availability,
        actions: actions,
        accepted_at: new Date().toISOString(),
        source: 'user'
      });
      if (await commit(routine)) {
        track(old ? 'plan_adjustment_accepted' : 'weekly_plan_accepted');
        draft = null;
        render();
      }
    } catch (error) {
      if (valid())
        document.getElementById('week-status').textContent = label(
          error.message === 'conflict' ? 'conflict' : 'required'
        );
    }
  }
  function review(cycle, today) {
    var s = summary(cycle, rows, today);
    return (
      '<section style="margin:16px 0;border-top:1px solid var(--border-color);padding-top:12px"><h3 style="font-size:15px">' +
      e(label('review')) +
      ' · ' +
      e(pretty(cycle.start)) +
      ' – ' +
      e(pretty(cycle.end)) +
      '</h3><p>' +
      e(label('coverage')) +
      '</p><ul>' +
      states
        .map(function (k) {
          return '<li>' + e(label(k)) + ': ' + s[k] + ' / ' + s.total + '</li>';
        })
        .join('') +
      '</ul>' +
      Object.keys(s.difficulties)
        .map(function (k) {
          return '<p>' + e(label(k)) + ': ' + s.difficulties[k] + '</p>';
        })
        .join('') +
      '</section>'
    );
  }
  function render(date) {
    if (!valid() || !model?.weekly_routine) return;
    var routine = model.weekly_routine,
      cycle = routine.cycles.at(-1),
      today = day(new Date(), routine.timezone);
    if (model.status !== 'active' || window.VITALIA_WEEKLY_ROUTINE_ENABLED === false) {
      host().innerHTML =
        '<p><strong>' +
        e(model.goal_text) +
        '</strong></p>' +
        routine.cycles
          .map(function (c) {
            return '<p>' + c.actions.map(e).join(' · ') + '</p>' + review(c, today);
          })
          .join('');
      return;
    }
    var ended = today > cycle.end;
    date = date || (ended ? cycle.end : today);
    if (date < cycle.start || date > cycle.end || date > today) return;
    var record = rows.find(function (r) {
      return r.routine_date === date;
    });
    // Preserve and show legacy daily notes; do not convert scores into action completion.
    var legacy = rows.find(function (r) {
      return r.day_number === span(routine.origin, date) + 1;
    });
    activeDate = date;
    var data = Object.assign({}, record?.routine_data || {}, pendingCheck(date));
    var last = rows
      .filter(function (r) {
        return r.routine_date && r.routine_date <= today;
      })
      .map(function (r) {
        return r.routine_date;
      })
      .sort()
      .at(-1);
    var absent = span(last || cycle.start, today) >= 3;
    var counts = summary(cycle, rows, today).difficulties;
    var barrier = Object.keys(counts).sort(function (a, b) {
      return counts[b] - counts[a];
    })[0];
    var comparable = comparison(routine.cycles.at(-2), cycle, rows, today);
    var comparisonText = comparable
      ? label('comparison')
          .replace('{previous}', comparable.previous)
          .replace('{current}', comparable.current)
          .replaceAll('{total}', comparable.total)
      : '';
    host().innerHTML =
      '<p><strong>' +
      e(model.goal_text) +
      '</strong></p><p>' +
      e(pretty(cycle.start)) +
      ' – ' +
      e(pretty(cycle.end)) +
      '</p>' +
      (absent ? '<p style="color:var(--green)">' + e(label('resume')) + '</p>' : '') +
      '<div id="week-save-feedback" role="status" aria-live="polite" hidden style="position:sticky;top:0;z-index:1;background:var(--surface);padding:10px;border-radius:12px;margin:10px 0"><span id="week-autosave-status" style="color:var(--green)"></span><button id="week-retry" type="button" class="btn btn-outline" style="min-height:48px;white-space:normal" hidden onclick="VitaliaWeek.retrySave()"></button></div><details id="week-date-options"><summary>' +
      e(label('more_options')) +
      '</summary><label>' +
      e(label('date')) +
      '<input id="week-date" type="date" min="' +
      cycle.start +
      '" max="' +
      (ended ? cycle.end : today) +
      '" value="' +
      date +
      '" onchange="VitaliaWeek.render(this.value)" style="display:block;padding:10px;background:var(--bg-secondary);color:var(--text-primary);border:1px solid var(--border-color);border-radius:10px;color-scheme:dark"></label></details>' +
      cycle.actions
        .map(function (_, i) {
          var state = data.states?.[i] || 'unrecorded';
          return (
            '<section class="premium-card" style="padding:14px;margin:14px 0"><strong id="week-action-title-' +
            i +
            '" style="overflow-wrap:anywhere"></strong><p id="week-action-why-' +
            i +
            '" style="font-size:12px;color:var(--text2)"></p><input id="week-state-' +
            i +
            '" type="hidden" value="' +
            e(state) +
            '"><div role="group" aria-labelledby="week-action-title-' +
            i +
            '" style="display:flex;flex-wrap:wrap;gap:8px">' +
            ['done', 'not_done', 'postponed']
              .map(function (k) {
                return (
                  '<button type="button" class="btn btn-outline" data-check-action="' +
                  i +
                  '" data-check-state="' +
                  k +
                  '" aria-pressed="' +
                  (state === k) +
                  '" style="min-height:48px;flex:1;white-space:normal" onclick="VitaliaWeek.setCheckState(' +
                  i +
                  ",'" +
                  k +
                  '\')">' +
                  e(label('check_' + k)) +
                  '</button>'
                );
              })
              .join('') +
            '</div><details style="margin-top:10px"><summary>' +
            e(label('more_options')) +
            '</summary>' +
            ['dismissed', 'unrecorded']
              .map(function (k) {
                return (
                  '<button type="button" class="btn btn-outline" data-check-action="' +
                  i +
                  '" data-check-state="' +
                  k +
                  '" aria-pressed="' +
                  (state === k) +
                  '" style="min-height:44px" onclick="VitaliaWeek.setCheckState(' +
                  i +
                  ",'" +
                  k +
                  '\')">' +
                  e(label(k)) +
                  '</button>'
                );
              })
              .join('') +
            (date === today ? field('week-swap-' + i, label('swap'), '', 240) : '') +
            '</details><p id="week-state-label-' +
            i +
            '" style="font-size:12px;color:var(--text2)">' +
            e(label(state)) +
            '</p></section>'
          );
        })
        .join('') +
      '<section id="week-barrier" hidden><h3 style="font-size:16px">' +
      e(label('barrier_question')) +
      '</h3>' +
      select(
        'week-difficulty',
        label('difficulty'),
        difficulties.map(function (k) {
          return [k, label(k || 'none')];
        }),
        data.difficulty || ''
      ) +
      field('week-note', label('note'), '', 500) +
      '</section>' +
      (legacy?.note
        ? '<details><summary>' +
          e(label('existing_note')) +
          '</summary><p>' +
          e(legacy.note) +
          '</p></details>'
        : '') +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      button('close()', label('skip')) +
      '</div>' +
      '<div id="week-review-stats">' +
      review(cycle, today) +
      '</div>' +
      (isReviewDay(cycle, today, date)
        ? select(
            'week-useful',
            label('useful'),
            [
              ['', label('none')],
              ['yes', label('yes')],
              ['no', label('no')]
            ],
            data.useful || ''
          )
        : '') +
      (comparisonText ? '<p>' + e(comparisonText) + '</p>' : '') +
      '<p>' +
      e(label(barrier ? 'proposal_' + barrier : 'adjust')) +
      '</p>' +
      (ended ? button('setup()', label('next')) : '') +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      button('records()', label('records')) +
      button('plan()', label('plan')) +
      '</div>' +
      (routine.cycles.length > 1
        ? '<details><summary>' +
          e(label('history')) +
          '</summary>' +
          routine.cycles
            .slice(0, -1)
            .map(function (c) {
              return '<p>' + c.actions.map(e).join(' · ') + '</p>' + review(c, today);
            })
            .join('') +
          '</details>'
        : '');
    cycle.actions.forEach(function (action, i) {
      var title = data.replacements?.[i] || action;
      document.getElementById('week-action-title-' + i).textContent = title;
      document.getElementById('week-action-why-' + i).textContent = actionReason(title);
      var input = document.getElementById('week-swap-' + i);
      if (input) input.value = data.replacements?.[i] || '';
    });
    document.getElementById('week-note').value = data.note ?? legacy?.note ?? '';
    cycle.actions.forEach(function (_, i) {
      paintCheckState(i, data.states?.[i] || 'unrecorded');
    });
    updateBarrier();
    ['difficulty', 'note', 'useful'].forEach(function (field) {
      var el = document.getElementById('week-' + field);
      if (!el) return;
      if (field === 'note') {
        el.oninput = function () {
          editField(field, el.value, true);
        };
        el.onblur = function () {
          if (!saveFailure) flushSaves();
        };
      } else
        el.onchange = function () {
          editField(field, el.value, false);
        };
    });
    cycle.actions.forEach(function (_, i) {
      var el = document.getElementById('week-swap-' + i);
      if (el)
        el.onchange = function () {
          editField('replacements.' + i, el.value, false);
        };
    });
    document.getElementById('week-retry').textContent = label('autosave_retry');
    saveStatus(saveFailure ? 'failed' : saveFlight || edits.size ? 'saving' : '');
    var viewKey = owner + ':' + model.id + ':' + cycle.start;
    if (!reviewViews.has(viewKey)) {
      reviewViews.add(viewKey);
      track('weekly_review_viewed');
    }
  }
  function updateBarrier() {
    if (!valid() || !model?.weekly_routine) return;
    var blocked = model.weekly_routine.cycles.at(-1).actions.some(function (_, i) {
      return ['not_done', 'postponed'].includes(document.getElementById('week-state-' + i)?.value);
    });
    var section = document.getElementById('week-barrier');
    if (section) section.hidden = !blocked;
  }
  function paintCheckState(i, state) {
    if (!valid() || !states.includes(state)) return;
    var input = document.getElementById('week-state-' + i);
    if (!input) return;
    input.value = state;
    host()
      .querySelectorAll('[data-check-action="' + i + '"]')
      .forEach(function (b) {
        var selected = b.dataset.checkState === state;
        b.setAttribute('aria-pressed', String(selected));
        b.style.borderColor = selected ? 'var(--green)' : 'var(--border)';
        b.style.background = selected ? 'rgba(34,197,94,.16)' : 'transparent';
      });
    document.getElementById('week-state-label-' + i).textContent = label(
      ['done', 'not_done', 'postponed'].includes(state) ? 'check_' + state : state
    );
    updateBarrier();
  }
  // One serialized writer. Pending patches belong to this modal/account/plan only.
  // A confirmed row is never replaced by an unacknowledged UI snapshot.
  var edits = new Map(),
    editSerial = 0,
    saveFlight = null,
    saveTimer = null;
  var activeDate = null,
    saveFailure = false,
    lastCommitError = null;
  function resetAutosave() {
    clearTimeout(saveTimer);
    saveTimer = null;
    edits = new Map();
    saveFlight = null;
    activeDate = null;
    saveFailure = false;
  }
  function baseCheck(date) {
    var cycle = model.weekly_routine.cycles.at(-1);
    var before =
      rows.find(function (r) {
        return r.routine_date === date;
      })?.routine_data || {};
    var legacy = rows.find(function (r) {
      return r.day_number === span(model.weekly_routine.origin, date) + 1;
    });
    return {
      states: cycle.actions.map(function (_, i) {
        return before.states?.[i] || 'unrecorded';
      }),
      difficulty: before.difficulty || '',
      note: before.note ?? legacy?.note ?? '',
      useful: before.useful || '',
      replacements: cycle.actions.map(function (a, i) {
        return before.replacements?.[i] || a;
      })
    };
  }
  function applyPatch(check, field, value) {
    var match = /^(states|replacements)\.(\d)$/.exec(field);
    if (match) check[match[1]][Number(match[2])] = value;
    else check[field] = value;
  }
  function pendingCheck(date) {
    var check = baseCheck(date),
      patch = edits.get(date);
    if (patch)
      patch.forEach(function (edit, field) {
        applyPatch(check, field, edit.value);
      });
    return check;
  }
  function saveStatus(state) {
    if (!valid()) return;
    var status = document.getElementById('week-autosave-status'),
      retry = document.getElementById('week-retry');
    if (status) {
      status.textContent = state && state !== 'failed' ? label('autosave_' + state) : '';
      status.hidden = !state || state === 'failed';
    }
    var feedback = document.getElementById('week-save-feedback');
    if (feedback) feedback.hidden = !state;
    if (retry) {
      retry.textContent = label(state === 'failed' ? 'autosave_failed' : 'autosave_retry');
      retry.hidden = state !== 'failed';
      retry.style.display = state === 'failed' ? '' : 'none';
      retry.disabled = !!saveFlight;
    }
  }
  function editField(field, value, delayed) {
    if (
      !valid() ||
      !activeDate ||
      model?.status !== 'active' ||
      window.VITALIA_WEEKLY_ROUTINE_ENABLED === false
    )
      return;
    var match = /^(states|replacements)\.(\d)$/.exec(field);
    if (match && Number(match[2]) >= model.weekly_routine.cycles.at(-1).actions.length) return;
    if (match?.[1] === 'states' && !states.includes(value)) return;
    if (!match && !['note', 'difficulty', 'useful'].includes(field)) return;
    if (field === 'difficulty' && !difficulties.includes(value)) return;
    if (
      field === 'useful' &&
      (!['', 'yes', 'no'].includes(value) ||
        !isReviewDay(
          model.weekly_routine.cycles.at(-1),
          day(new Date(), model.weekly_routine.timezone),
          activeDate
        ))
    )
      return;
    value = String(value);
    if (field === 'note') value = value.slice(0, 500);
    if (match?.[1] === 'replacements')
      value =
        value.trim().slice(0, 240) || model.weekly_routine.cycles.at(-1).actions[Number(match[2])];
    var current = pendingCheck(activeDate),
      old = match ? current[match[1]][Number(match[2])] : current[field];
    if (old === value) {
      if (!saveFailure) saveStatus(saveFlight || edits.size ? 'saving' : 'saved');
      return saveFlight || Promise.resolve(!saveFailure);
    }
    if (!edits.has(activeDate)) edits.set(activeDate, new Map());
    edits.get(activeDate).set(field, { value: value, serial: ++editSerial });
    clearTimeout(saveTimer);
    saveTimer = null;
    // Failed edits remain pending. Only an explicit retry performs reconciliation.
    if (saveFailure) {
      saveStatus('failed');
      return Promise.resolve(false);
    }
    saveStatus('saving');
    if (delayed) {
      saveTimer = setTimeout(function () {
        saveTimer = null;
        flushSaves();
      }, 400);
      return;
    }
    return flushSaves();
  }
  function isReviewDay(cycle, today, date) {
    return today >= cycle.end && date === cycle.end;
  }
  async function refreshForRetry(token) {
    var sb = getVitaliaSupabaseClient(),
      id = model.id,
      account = owner;
    var plan = await sb
      .from('goal_diagnostics')
      .select('*')
      .eq('user_id', account)
      .eq('id', id)
      .maybeSingle();
    if (plan.error) throw plan.error;
    var records = await sb
      .from('diagnostic_checkins')
      .select('day_number,note,routine_date,routine_data')
      .eq('diagnostic_id', id)
      .eq('user_id', account);
    if (records.error) throw records.error;
    if (token !== generation || !valid()) return false;
    // Never move a pending patch to a different cycle or silently edit history.
    if (
      plan.data?.status !== 'active' ||
      JSON.stringify(plan.data.weekly_routine?.cycles) !==
        JSON.stringify(model.weekly_routine.cycles) ||
      plan.data.weekly_routine.timezone !== model.weekly_routine.timezone
    )
      throw Error('routine_conflict');
    model = plan.data;
    rows = records.data || [];
    return true;
  }
  async function retrySave() {
    if (!valid() || saveFlight) return saveFlight;
    var token = generation;
    document.getElementById('week-status').textContent = '';
    saveStatus('saving');
    // Reserve the writer during refresh too, so repeated retry taps cannot race.
    saveFlight = (async function () {
      try {
        if (!(await refreshForRetry(token))) return false;
        saveFailure = false;
        return true;
      } catch (error) {
        if (token === generation && valid()) {
          report(error);
          saveFailure = true;
          saveStatus('failed');
        }
        return false;
      }
    })();
    var refreshed = await saveFlight;
    if (token !== generation) return false;
    saveFlight = null;
    if (!refreshed) {
      saveStatus('failed');
      return false;
    }
    var saved = await flushSaves();
    if (saved && token === generation && valid() && !edits.size) {
      render(activeDate);
      saveStatus('saved');
    }
    return saved;
  }
  function flushSaves() {
    clearTimeout(saveTimer);
    saveTimer = null;
    if (saveFlight) return saveFlight;
    if (!valid() || busy || saveFailure) return Promise.resolve(false);
    var token = generation;
    saveFlight = (async function () {
      while (edits.size && token === generation && valid()) {
        var date = edits.keys().next().value,
          patch = edits.get(date),
          sentSerial = editSerial;
        var before = rows.find(function (r) {
          return r.routine_date === date;
        })?.routine_data;
        var check = pendingCheck(date),
          baseline = baseCheck(date);
        if (JSON.stringify(check) !== JSON.stringify(baseline)) {
          if (_goalDiagnosticHasSafetySignal(check.replacements.join(' '))) {
            document.getElementById('week-status').textContent = safetyText(
              check.replacements.join(' ')
            );
            saveFailure = true;
            break;
          }
          check.completed_once = check.states.map(function (s, i) {
            return !!before?.completed_once?.[i] || s === 'done';
          });
          check.feedback_once = !!before?.feedback_once || !!check.useful;
          var meaningful =
            check.states.some(function (s) {
              return s !== 'unrecorded';
            }) ||
            !!check.difficulty ||
            !!check.note ||
            !!check.useful;
          check.submitted_once = !!before?.submitted_once || !!meaningful;
          var last = rows
            .filter(function (r) {
              return r.routine_date;
            })
            .map(function (r) {
              return r.routine_date;
            })
            .sort()
            .at(-1);
          saveStatus('saving');
          if (
            !(await commit(JSON.parse(JSON.stringify(model.weekly_routine)), date, check, true))
          ) {
            if (token === generation && valid()) {
              saveFailure = true;
              if (lastCommitError) report(lastCommitError);
            }
            break;
          }
          if (token !== generation || !valid()) return false;
          var existingRow = rows.find(function (r) {
            return r.routine_date === date;
          });
          rows = rows.filter(function (r) {
            return r.routine_date !== date;
          });
          rows.push(Object.assign({}, existingRow, { routine_date: date, routine_data: check }));
          var reviewHost = document.getElementById('week-review-stats');
          if (reviewHost)
            reviewHost.innerHTML = review(
              model.weekly_routine.cycles.at(-1),
              day(new Date(), model.weekly_routine.timezone)
            );
          if (_goalDiagnosticHasSafetySignal(check.note))
            document.getElementById('week-status').textContent =
              label('autosave_saved') + ' ' + safetyText(check.note);
          if (meaningful && !before?.submitted_once) track('daily_checkin_submitted');
          check.states.forEach(function (s, i) {
            if (s === 'done' && !before?.completed_once?.[i])
              track('daily_action_completed', i + 1);
          });
          if (check.useful && !before?.feedback_once) track('usefulness_feedback_submitted');
          if (meaningful && span(last || model.weekly_routine.cycles.at(-1).start, date) >= 3)
            track('routine_resumed');
        }
        // Preserve fields edited while this RPC was in flight.
        patch.forEach(function (edit, field) {
          if (edit.serial <= sentSerial) patch.delete(field);
        });
        if (!patch.size) edits.delete(date);
      }
      return !saveFailure;
    })();
    var flight = saveFlight;
    return flight.finally(function () {
      if (token !== generation) return;
      saveFlight = null;
      saveStatus(saveFailure ? 'failed' : edits.size ? 'saving' : 'saved');
    });
  }
  function setCheckState(i, state) {
    if (!valid() || !states.includes(state)) return;
    var input = document.getElementById('week-state-' + i);
    if (!input) return;
    paintCheckState(i, state);
    return editField('states.' + i, state, false);
  }
  // Backward-compatible explicit save entry point; no extra save button is required.
  function save() {
    if (!valid() || !activeDate) return Promise.resolve(false);
    var cycle = model.weekly_routine.cycles.at(-1);
    cycle.actions.forEach(function (_, i) {
      var state = document.getElementById('week-state-' + i),
        swap = document.getElementById('week-swap-' + i);
      if (state) editField('states.' + i, state.value, true);
      if (swap) editField('replacements.' + i, swap.value, true);
    });
    ['difficulty', 'note', 'useful'].forEach(function (field) {
      var el = document.getElementById('week-' + field);
      if (el) editField(field, el.value, true);
    });
    if (saveFailure) return retrySave();
    return flushSaves();
  }

  function guardClose(event) {
    if (!valid()) return;
    if (
      event.target === document.getElementById('modal-overlay') ||
      event.target.closest?.('.sheet-close')
    ) {
      event.stopImmediatePropagation();
      close();
    }
  }
  async function records() {
    if (await close()) navigate('nutrition');
  }
  async function close() {
    if (valid() && (edits.size || saveFlight)) {
      var token = generation;
      if (saveFailure) {
        saveStatus('failed');
        return false;
      }
      await flushSaves();
      if (token !== generation || !valid() || saveFailure || edits.size) return false;
    }
    document.getElementById('modal-overlay')?.removeEventListener?.('click', guardClose, true);
    generation++;
    resetAutosave();
    model = null;
    rows = [];
    owner = null;
    closeModal();
    return true;
  }
  return {
    suggestions: suggestions,
    validateActions: validateActions,
    detectedZone: detectedZone,
    actionReason: actionReason,
    catalog: habitCatalog,
    introDone: introDone,
    setTime: setTime,
    moveStep: moveStep,
    toggleHabit: toggleHabit,
    addCustom: addCustom,
    changeAdvanced: changeAdvanced,
    setCustom: setCustom,
    setAdult: setAdult,
    editField: editField,
    retrySave: retrySave,
    isReviewDay: isReviewDay,
    setCheckState: setCheckState,
    home: shell,
    open: open,
    plan: plan,
    setup: setup,
    accept: accept,
    render: render,
    save: save,
    records: records,
    close: close,
    day: day,
    add: add,
    summary: summary,
    comparison: comparison
  };
})();
