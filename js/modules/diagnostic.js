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
  return '<div class="screen-header"><div class="screen-title">🧭 Plano Ativo VitalIA</div></div><div id="main-content"></div>';
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
  return 'Isso que você compartilhou é importante. Para esse tipo de situação, o acompanhamento de um profissional de saúde faz toda a diferença. O CoachIA pode te apoiar, mas não substitui esse cuidado.';
}

function _goalDiagnosticHasSafetySignal(text) {
  var s = (text || '').toLowerCase();
  return ['bulimia','anorexia','vômito após comer','vomito apos comer','provoco vômito','provoco vomito','uso laxante','tomo laxante','não como há dias','nao como ha dias','fiquei sem comer','medo intenso de comida','culpa extrema','me odeio por comer','compulsão grave','compulsao grave','como sem parar','autoagressão','autoagressao'].some(function(k){ return s.indexOf(k) >= 0; });
}

function buildDiagnosticCoachSummary(diag) {
  diag = diag || {};
  return {
    goal: diag.goal_text || '',
    goal_type: diag.goal_type || '',
    motivation: diag.motivation || '',
    primary_saboteur: diag.primary_saboteur || '',
    critical_periods: Array.isArray(diag.critical_periods) ? diag.critical_periods : [],
    food_pattern: diag.current_food_pattern || '',
    emotional_triggers: Array.isArray(diag.emotional_triggers) ? diag.emotional_triggers : [],
    environment_triggers: Array.isArray(diag.environment_triggers) ? diag.environment_triggers : [],
    emergency_strategy: diag.emergency_strategy || '',
    plan_name: diag.selected_plan_name || 'Plano CoachIA',
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
    localStorage.setItem('vitalia_coach_context_diagnostic', JSON.stringify(buildDiagnosticCoachSummary(activeDiagnostic)));
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
    goal_text: goalText || 'Meu objetivo VitalIA',
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
  var sab = payload.primary_saboteur || 'bloqueio principal ainda não definido';
  var emergency = payload.emergency_strategy || 'usar uma pausa de 10 minutos, hidratar e escolher uma refeição simples com proteína';
  var periods = (payload.critical_periods || []).join(', ') || 'momentos críticos da rotina';
  return 'Diagnóstico honesto\n'
    + 'Seu objetivo é ' + payload.goal_text + '. O foco inicial não é perfeição: é atacar o ponto que mais derruba sua consistência.\n\n'
    + 'Sabotador principal\n'
    + sab + '\n\n'
    + 'Estratégia de emergência\n'
    + emergency + '\n\n'
    + 'Próximos 3 passos\n'
    + '1. Organizar uma opção simples para ' + periods + '.\n'
    + '2. Reduzir exposição ao sabotador principal por 7 dias.\n'
    + '3. Conversar com o CoachIA quando perceber risco de sair do plano.\n\n'
    + 'Plano inicial de 7 dias simples\n'
    + 'Dia 1: identificar o horário mais perigoso e preparar uma alternativa.\n'
    + 'Dia 2: garantir proteína na refeição anterior ao período crítico.\n'
    + 'Dia 3: remover ou dificultar acesso ao principal alimento sabotador.\n'
    + 'Dia 4: caminhar 10 minutos após a refeição mais difícil.\n'
    + 'Dia 5: planejar uma escolha realista para o fim de semana ou delivery.\n'
    + 'Dia 6: repetir a melhor refeição da semana.\n'
    + 'Dia 7: revisar com o CoachIA o que funcionou e o que precisa mudar.';
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
    + '<h2 style="margin-bottom:4px;">🧭 Plano Ativo VitalIA</h2>'
    + '<p style="font-size:13px;opacity:.65;margin-bottom:14px;">Entenda seus bloqueios reais e transforme isso em uma estratégia prática.</p>'
    + safetyHtml
    + renderCurrentDiagnosticPlan(active)
    + '<form id="goal-diagnostic-form" class="card" style="padding:14px;margin-bottom:14px;">'
    + '<div style="font-size:13px;font-weight:700;margin-bottom:10px;">Diagnóstico de bloqueios</div>'
    + '<div style="font-size:12px;opacity:.72;line-height:1.45;margin-bottom:12px;padding:10px;border-radius:8px;background:var(--bg-secondary);">Escreva do seu jeito. Exemplos: quero perder 10kg sem passar fome; belisco à noite por ansiedade; peço delivery quando chego cansado; sexta-feira e domingo são meus períodos mais difíceis.</div>'
    + '<label style="font-size:12px;">Meu objetivo</label><select id="gd-goal-type" style="width:100%;margin:4px 0 8px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);">'
    + ['weight_loss:Emagrecer','muscle_gain:Ganhar massa','energy:Melhorar energia','compulsion:Controlar compulsão','nutrition:Melhorar alimentação','performance:Aumentar performance','health:Melhorar saúde'].map(function(opt){ var p=opt.split(':'); return '<option value="'+p[0]+'"'+((source.goal_type||'weight_loss')===p[0]?' selected':'')+'>'+p[1]+'</option>'; }).join('')
    + '</select>'
    + '<label style="font-size:12px;">Explique com suas palavras</label><textarea id="gd-goal-text" rows="2" placeholder="Ex: Quero perder 10kg, reduzir barriga e ter energia no trabalho sem viver de dieta maluca." style="width:100%;box-sizing:border-box;margin:4px 0 8px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);resize:vertical;">' + escHtml(source.goal_text || '') + '</textarea>'
    + '<label style="font-size:12px;">Por que isso importa?</label><textarea id="gd-motivation" rows="2" placeholder="Ex: Quero voltar a me sentir confiante, dormir melhor e ter disposição para minha família." style="width:100%;box-sizing:border-box;margin:4px 0 8px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);resize:vertical;">' + escHtml(source.motivation || '') + '</textarea>'
    + '<label style="font-size:12px;">O que me impede hoje</label><textarea id="gd-barriers" rows="3" placeholder="Ex: Belisco à noite, peço delivery quando estou cansado, como doce quando fico ansioso e não planejo as compras." style="width:100%;box-sizing:border-box;margin:4px 0 8px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);resize:vertical;">' + escHtml(source.current_barriers || '') + '</textarea>'
    + '<label style="font-size:12px;">Minha alimentação real</label><textarea id="gd-food" rows="3" placeholder="Ex: Café com pão, almoço corrido, doce à tarde, refrigerante no fim de semana e pizza toda sexta." style="width:100%;box-sizing:border-box;margin:4px 0 8px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);resize:vertical;">' + escHtml(source.current_food_pattern || '') + '</textarea>'
    + '<label style="font-size:12px;">Gatilhos emocionais (separe por vírgula)</label><input id="gd-emotional" placeholder="Ex: ansiedade, solidão, cansaço, frustração, recompensa depois de um dia difícil" value="' + escHtml(_goalDiagnosticArray(source.emotional_triggers).join(', ')) + '" style="width:100%;box-sizing:border-box;margin:4px 0 8px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);">'
    + '<label style="font-size:12px;">Gatilhos de ambiente (separe por vírgula)</label><input id="gd-environment" placeholder="Ex: doces em casa, aplicativo de delivery, colegas pedindo lanche, festas de família" value="' + escHtml(_goalDiagnosticArray(source.environment_triggers).join(', ')) + '" style="width:100%;box-sizing:border-box;margin:4px 0 8px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);">'
    + '<label style="font-size:12px;">Períodos críticos (separe por vírgula)</label><input id="gd-periods" placeholder="Ex: depois das 20h, sexta à noite, domingo à tarde, TPM, plantão" value="' + escHtml(_goalDiagnosticArray(source.critical_periods).join(', ')) + '" style="width:100%;box-sizing:border-box;margin:4px 0 8px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);">'
    + '<label style="font-size:12px;">Sabotador principal</label><input id="gd-saboteur" placeholder="Ex: Compulsão noturna por ansiedade / delivery quando chego cansado" value="' + escHtml(source.primary_saboteur || '') + '" style="width:100%;box-sizing:border-box;margin:4px 0 8px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);">'
    + '<label style="font-size:12px;">Estratégia de emergência</label><textarea id="gd-emergency" rows="2" placeholder="Ex: Tomar banho, comer iogurte com fruta, caminhar 10 min e só depois decidir se ainda quero pedir delivery." style="width:100%;box-sizing:border-box;margin:4px 0 8px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);resize:vertical;">' + escHtml(source.emergency_strategy || '') + '</textarea>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;"><div><label style="font-size:12px;">Compromisso 0-10</label><input id="gd-commitment" type="number" min="0" max="10" value="' + (source.commitment_level != null ? source.commitment_level : '') + '" style="width:100%;box-sizing:border-box;margin-top:4px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);"></div><div><label style="font-size:12px;">Confiança 0-10</label><input id="gd-confidence" type="number" min="0" max="10" value="' + (source.confidence_score != null ? source.confidence_score : '') + '" style="width:100%;box-sizing:border-box;margin-top:4px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);"></div></div>'
    + '<div style="display:flex;gap:8px;margin-top:12px;"><button type="button" onclick="saveGoalDiagnosticDraft();" class="btn-secondary" style="flex:1;">Salvar rascunho</button><button type="button" onclick="activateGoalDiagnostic();" class="btn-primary" style="flex:1;">Ativar Plano CoachIA</button></div>'
    + '<div id="gd-status" style="min-height:18px;text-align:center;font-size:12px;margin-top:8px;"></div>'
    + '</form>'
    + renderDiagnosticHistory(history)
    + '</div>';
}

function renderCurrentDiagnosticPlan(active) {
  if (!active) {
    return '<div class="card" style="padding:14px;margin-bottom:14px;text-align:center;"><div style="font-weight:700;margin-bottom:4px;">Meu Plano Atual</div><div style="font-size:13px;opacity:.65;">Nenhum plano ativo ainda. Preencha o diagnóstico e ative o Plano CoachIA.</div></div>';
  }
  var summary = buildDiagnosticCoachSummary(active);
  var currentDay = calculateDiagnosticCurrentDay(active.plan_started_at, active.plan_duration_days || 7);
  var completionHtml = currentDay && currentDay >= (active.plan_duration_days || 7) ? renderDiagnosticCompletion(active) : '';
  var plan = active.coach_plan || 'Plano ativo criado. Converse com o CoachIA para refinar os próximos passos.';
  return '<div class="card" style="padding:14px;margin-bottom:14px;border-left:3px solid var(--color-primary,#6c63ff);">'
    + renderDiagnosticProgress(active)
    + renderPlanTemplateSelector(active)
    + '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;"><strong>Meu Plano Atual</strong><span style="font-size:11px;opacity:.65;">Dia ' + (summary.plan_day || 1) + '/' + summary.plan_duration + '</span></div>'
    + '<div style="font-size:12px;opacity:.7;margin:6px 0;">' + escHtml(summary.plan_name) + ' · ' + escHtml(summary.primary_saboteur || 'sabotador em análise') + '</div>'
    + '<pre style="white-space:pre-wrap;font-family:inherit;font-size:12px;line-height:1.55;margin:0;background:var(--bg-secondary);border-radius:8px;padding:10px;">' + escHtml(plan) + '</pre>'
    + renderDailyDiagnosticCheckin(active)
    + completionHtml
    + '<button onclick="personalizePlanFromDiagnostic()" class="btn-primary" style="width:100%;margin-top:10px;">Personalizar com CoachIA</button>'
    + '<button onclick="navigate(\'coach\')" class="btn-secondary" style="width:100%;margin-top:10px;">Revisar com CoachIA</button>'
    + '<button onclick="completeGoalDiagnostic();" class="btn-secondary" style="width:100%;margin-top:8px;">Marcar plano como concluído</button>'
    + '</div>';
}

function renderDiagnosticHistory(history) {
  var html = '<h3 style="margin-bottom:8px;">Histórico</h3>';
  if (!history || !history.length) {
    return html + '<div class="card" style="padding:14px;text-align:center;font-size:13px;opacity:.65;">Nenhum diagnóstico arquivado ou concluído ainda.</div>';
  }
  return html + history.map(function(row) {
    var d = row.created_at ? new Date(row.created_at).toLocaleDateString() : '';
    return '<div class="card" style="padding:12px;margin-bottom:8px;">'
      + '<div style="display:flex;justify-content:space-between;gap:8px;"><strong style="font-size:13px;">' + escHtml(row.selected_plan_name || row.goal_text || 'Plano VitalIA') + '</strong><span style="font-size:11px;opacity:.55;">' + escHtml(row.status) + '</span></div>'
      + '<div style="font-size:12px;opacity:.7;margin-top:4px;">' + escHtml(d) + ' · ' + escHtml(row.primary_saboteur || 'sem sabotador principal') + '</div>'
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
      var upd = await sb.from('goal_diagnostics').update(payload).eq('id', window._goalDiagnosticDraftId);
      if (upd.error) throw upd.error;
    } else {
      var ins = await sb.from('goal_diagnostics').insert([payload]);
      if (ins.error) throw ins.error;
    }
    if (status) { status.style.color = 'var(--color-success,#4caf50)'; status.textContent = safetySignal ? _goalDiagnosticSafetyText() : 'Rascunho salvo.'; }
    setTimeout(function(){ renderGoalDiagnostics(); }, 600);
  } catch(err) {
    if (status) { status.style.color = 'var(--color-danger,#f44)'; status.textContent = 'Erro: ' + (err.message || err); }
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
    payload.selected_plan_name = 'Plano CoachIA';
    payload.plan_template_id = 'coachia_7d';
    payload.plan_duration_days = 7;
    payload.plan_started_at = now.toISOString();
    payload.plan_ends_at = ends.toISOString();
    payload.activated_at = now.toISOString();
    payload.coach_plan = _buildInitialGoalDiagnosticPlan(payload);
    payload.coach_context_summary = buildDiagnosticCoachSummary(payload);
    await archivePreviousGoalDiagnostics(window._goalDiagnosticDraftId || null);
    var saved;
    if (window._goalDiagnosticDraftId) {
      saved = await sb.from('goal_diagnostics').update(payload).eq('id', window._goalDiagnosticDraftId).select('*').maybeSingle();
    } else {
      saved = await sb.from('goal_diagnostics').insert([payload]).select('*').maybeSingle();
    }
    if (saved.error) throw saved.error;
    if (saved.data) syncDiagnosticCoachContext(saved.data);
    if (typeof capturePostHogEvent === 'function') capturePostHogEvent('goal_diagnostic_activated', { goal_type: payload.goal_type, confidence_score: payload.confidence_score });
    if (status) { status.style.color = 'var(--color-success,#4caf50)'; status.textContent = safetySignal ? _goalDiagnosticSafetyText() : 'Plano CoachIA ativado.'; }
    setTimeout(function(){ renderGoalDiagnostics(); }, 700);
  } catch(err) {
    if (status) { status.style.color = 'var(--color-danger,#f44)'; status.textContent = 'Erro: ' + (err.message || err); }
  }
}

async function completeGoalDiagnostic() {
  try {
    var sb = getVitaliaSupabaseClient();
    if (!sb) return;
    var userRes = await sb.auth.getUser();
    var user = userRes.data && userRes.data.user;
    if (!user) return;
    await sb.from('goal_diagnostics').update({ status:'completed', completed_at:new Date().toISOString(), updated_at:new Date().toISOString() }).eq('user_id', user.id).eq('status', 'active');
    try { localStorage.removeItem('vitalia_coach_context_diagnostic'); } catch(e) {}
    renderGoalDiagnostics();
  } catch(e) {}
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
    + Object.keys(PLAN_TEMPLATES).map(function(k) {
        var t = PLAN_TEMPLATES[k];
        var sel = current === k;
        return '<button onclick="selectDiagnosticPlanTemplate(\'' + k + '\')" style="text-align:left;padding:10px;border-radius:10px;border:1px solid ' + (sel ? 'var(--color-primary,#6c63ff)' : 'var(--border-color)') + ';background:' + (sel ? 'rgba(108,99,255,.13)' : 'var(--bg-secondary)') + ';color:var(--text-primary);cursor:pointer;">'
          + '<div style="font-size:13px;font-weight:700;">' + t.icon + ' ' + escHtml(t.name) + '</div>'
          + '<div style="font-size:11px;opacity:.65;margin-top:2px;">' + escHtml(t.subtitle) + ' · ' + t.duration_days + ' dias</div>'
          + '</button>';
      }).join('')
    + '</div>';
}

async function selectDiagnosticPlanTemplate(templateId) {
  var tmpl = PLAN_TEMPLATES[templateId];
  if (!tmpl) return;
  var sb = getVitaliaSupabaseClient();
  if (!sb) return;
  var res = await sb.auth.getUser();
  var user = res.data && res.data.user;
  if (!user) return;
  var diagRes = await sb.from('goal_diagnostics').select('*').eq('user_id', user.id).eq('status', 'active').maybeSingle();
  var diag = diagRes.data;
  if (!diag) return;
  var now = new Date();
  var ends = new Date(now.getTime() + tmpl.duration_days * 86400000);
  await sb.from('goal_diagnostics').update({
    selected_plan_type: tmpl.id === 'coachia_7d' ? 'coachia' : 'template',
    selected_plan_name: tmpl.name,
    plan_template_id: tmpl.id,
    plan_duration_days: tmpl.duration_days,
    plan_started_at: now.toISOString(),
    plan_ends_at: ends.toISOString(),
    updated_at: now.toISOString()
  }).eq('id', diag.id);
  syncDiagnosticCoachContext(Object.assign({}, diag, {
    selected_plan_name: tmpl.name,
    plan_template_id: tmpl.id,
    plan_duration_days: tmpl.duration_days,
    plan_started_at: now.toISOString(),
    plan_ends_at: ends.toISOString()
  }));
  renderGoalDiagnostics();
}

async function personalizePlanFromDiagnostic() {
  var sb = getVitaliaSupabaseClient();
  if (!sb) return;
  var res = await sb.auth.getUser();
  var user = res.data && res.data.user;
  if (!user) return;
  var diagRes = await sb.from('goal_diagnostics').select('*').eq('user_id', user.id).eq('status', 'active').maybeSingle();
  var diag = diagRes.data;
  if (!diag) {
    navigate('coach');
    return;
  }
  var templateInfo = PLAN_TEMPLATES[diag.plan_template_id] || PLAN_TEMPLATES.coachia_7d;
  var days = diag.plan_duration_days || 7;
  var msg = 'Preciso que você crie meu plano personalizado de ' + days + ' dias (' + templateInfo.name + ').\n\n'
    + 'Meu objetivo: ' + diag.goal_text + '\n'
    + 'Por que isso importa: ' + (diag.motivation || 'não informado') + '\n'
    + 'Meu principal sabotador: ' + (diag.primary_saboteur || 'não identificado') + '\n'
    + 'Períodos críticos: ' + (Array.isArray(diag.critical_periods) ? diag.critical_periods.join(', ') : 'não informado') + '\n'
    + 'Minha alimentação real: ' + (diag.current_food_pattern || 'não descrito') + '\n'
    + 'Gatilhos emocionais: ' + (Array.isArray(diag.emotional_triggers) ? diag.emotional_triggers.join(', ') : 'nenhum') + '\n'
    + 'Gatilhos de ambiente: ' + (Array.isArray(diag.environment_triggers) ? diag.environment_triggers.join(', ') : 'nenhum') + '\n'
    + 'O que me impede: ' + (diag.current_barriers || 'não informado') + '\n'
    + 'Minha estratégia de emergência: ' + (diag.emergency_strategy || 'não definida') + '\n'
    + 'Confiança no plano: ' + (diag.confidence_score || 'não informado') + '/10\n\n'
    + 'Com base nisso, crie um plano de ' + days + ' dias com foco em ' + templateInfo.focus + '. '
    + 'Adapte ao meu sabotador principal e meus períodos críticos. '
    + 'Seja específico e realista, não genérico.';
  try { localStorage.setItem('vitalia_coach_prefill_message', msg); } catch(e) {}
  navigate('coach');
}

function renderDiagnosticProgress(active) {
  if (!active) return '';
  var duration = active.plan_duration_days || 7;
  var day = calculateDiagnosticCurrentDay(active.plan_started_at, duration) || 1;
  var pct = Math.min(100, Math.round((day / duration) * 100));
  var tmpl = PLAN_TEMPLATES[active.plan_template_id] || PLAN_TEMPLATES.coachia_7d;
  var weekIndex = Math.min(tmpl.weeks.length - 1, Math.max(0, Math.ceil(day / 7) - 1));
  var week = tmpl.weeks[weekIndex] || tmpl.weeks[0];
  return '<div style="margin:10px 0;padding:10px;border-radius:8px;background:var(--bg-secondary);">'
    + '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;"><strong>Dia ' + day + ' de ' + duration + '</strong><span>' + pct + '%</span></div>'
    + '<div style="height:8px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden;"><div style="width:' + pct + '%;height:100%;background:var(--color-primary,#6c63ff);"></div></div>'
    + '<div style="font-size:11px;opacity:.65;margin-top:6px;">' + escHtml((week && week.label ? week.label : 'Semana atual') + ': ' + (week && week.theme ? week.theme : tmpl.focus)) + '</div>'
    + '</div>';
}

function renderDailyDiagnosticCheckin(active) {
  if (!active || active.status !== 'active') return '';
  var day = calculateDiagnosticCurrentDay(active.plan_started_at, active.plan_duration_days || 7) || 1;
  return '<div style="margin-top:12px;padding:10px;border-radius:8px;background:var(--bg-secondary);">'
    + '<div style="font-size:13px;font-weight:700;margin-bottom:8px;">Dia ' + day + ' — Check-in de hoje</div>'
    + '<label style="font-size:11px;">Aderência 0-10</label><input id="diag-adherence" type="range" min="0" max="10" value="7" style="width:100%;">'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;"><div><label style="font-size:11px;">Humor 1-5</label><input id="diag-mood" type="number" min="1" max="5" value="3" style="width:100%;box-sizing:border-box;padding:7px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);"></div><div><label style="font-size:11px;">Dificuldade 1-5</label><input id="diag-difficulty" type="number" min="1" max="5" value="3" style="width:100%;box-sizing:border-box;padding:7px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);"></div></div>'
    + '<textarea id="diag-note" rows="2" placeholder="Nota livre do dia" style="width:100%;box-sizing:border-box;margin-top:8px;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);resize:vertical;"></textarea>'
    + '<button onclick="saveDiagnosticCheckin(\'' + active.id + '\',' + day + ',{adherence_score:parseInt(document.getElementById(\'diag-adherence\').value),mood_score:parseInt(document.getElementById(\'diag-mood\').value),difficulty_level:parseInt(document.getElementById(\'diag-difficulty\').value),note:document.getElementById(\'diag-note\').value})" class="btn-secondary" style="width:100%;margin-top:8px;">Salvar check-in</button>'
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
    await sb.from('diagnostic_checkins').upsert([{
      diagnostic_id: diagnosticId,
      user_id: user.id,
      day_number: dayNumber,
      adherence_score: data.adherence_score,
      mood_score: data.mood_score,
      difficulty_level: data.difficulty_level,
      note: note
    }], { onConflict: 'diagnostic_id,day_number' });
    await updateDiagnosticCoachContextWithCheckins(diagnosticId);
    if (status && !status.textContent) { status.style.color = 'var(--color-success,#4caf50)'; status.textContent = 'Check-in salvo.'; }
    setTimeout(function(){ renderGoalDiagnostics(); }, 700);
  } catch(err) {
    if (status) { status.style.color = 'var(--color-danger,#f44)'; status.textContent = 'Erro: ' + (err.message || err); }
  }
}

function renderDiagnosticCompletion(active) {
  if (!active) return '';
  if (!window._diagnosticCompletionMarked) {
    window._diagnosticCompletionMarked = {};
  }
  if (!window._diagnosticCompletionMarked[active.id]) {
    window._diagnosticCompletionMarked[active.id] = true;
    setTimeout(function(){ completeDiagnosticPlan(active.id, true); }, 0);
  }
  return '<div style="margin-top:12px;padding:12px;border-radius:8px;background:#4caf5014;border:1px solid #4caf50;">'
    + '<div style="font-weight:700;">🎉 Ciclo concluído!</div>'
    + '<div style="font-size:12px;opacity:.75;margin-top:4px;">Você completou o ' + escHtml(active.selected_plan_name || 'Plano CoachIA') + ' em ' + (active.plan_duration_days || 7) + ' dias.</div>'
    + '<div style="font-size:12px;opacity:.75;margin-top:4px;">Aderência média: atualize após seus check-ins. Maior dificuldade: veja suas notas recentes.</div>'
    + '<button onclick="restartDiagnosticCycle()" class="btn-secondary" style="width:100%;margin-top:8px;">Iniciar novo ciclo</button>'
    + '<button onclick="navigate(\'coach\')" class="btn-secondary" style="width:100%;margin-top:8px;">Conversar com CoachIA</button>'
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
    await q;
    try { localStorage.removeItem('vitalia_coach_context_diagnostic'); } catch(e) {}
    if (!silent) renderGoalDiagnostics();
  } catch(e) {}
}

async function restartDiagnosticCycle() {
  var sb = getVitaliaSupabaseClient();
  if (!sb) return;
  var res = await sb.auth.getUser();
  var user = res.data && res.data.user;
  if (!user) return;
  await sb.from('goal_diagnostics')
    .update({ status:'archived', archived_at:new Date().toISOString(), updated_at:new Date().toISOString() })
    .eq('user_id', user.id)
    .in('status', ['completed', 'active']);
  try { localStorage.removeItem('vitalia_coach_context_diagnostic'); } catch(e) {}
  renderGoalDiagnostics();
}

async function updateDiagnosticCoachContextWithCheckins(diagnosticId) {
  var sb = getVitaliaSupabaseClient();
  if (!sb) return;
  var res = await sb.from('diagnostic_checkins')
    .select('*')
    .eq('diagnostic_id', diagnosticId)
    .order('day_number', { ascending:false })
    .limit(7);
  var checkins = res.data || [];
  if (!checkins.length) return;
  var avgAdherence = Math.round(checkins.reduce(function(s,c){ return s + (c.adherence_score || 0); }, 0) / checkins.length);
  var lastCheckin = checkins[0];
  var existing = {};
  try { existing = JSON.parse(localStorage.getItem('vitalia_coach_context_diagnostic') || '{}'); } catch(e) {}
  localStorage.setItem('vitalia_coach_context_diagnostic', JSON.stringify(Object.assign({}, existing, {
    adherence_average: avgAdherence,
    last_checkin_day: lastCheckin.day_number,
    last_adherence: lastCheckin.adherence_score,
    last_mood: lastCheckin.mood_score,
    last_difficulty: lastCheckin.difficulty_level,
    last_note: lastCheckin.note || null,
    low_adherence_alert: avgAdherence < 5
  })));
}
