/* ═══════════════════════════════════════
   V230-D3 — MÓDULO ATHLETE (js/modules/athlete.js)
   Ex-bloco inline do index.html (extração literal).
═══════════════════════════════════════ */

var ATHLETE_PHASES = {
  hypertrophy: { label:'Hipertrofia', color:'#4caf50', bg:'#4caf5022', focus:'Volume progressivo · 6-12 reps · RIR 1-3' },
  strength:    { label:'Força',       color:'#2196f3', bg:'#2196f322', focus:'Carga alta · 3-6 reps · descanso longo' },
  power:       { label:'Potência',    color:'#ff9800', bg:'#ff980022', focus:'Velocidade · baixa fadiga · técnica explosiva' },
  deload:      { label:'Deload',      color:'#9e9e9e', bg:'#9e9e9e22', focus:'Reduzir volume 40-60% · recuperar sensibilidade' }
};

var MUSCLE_GROUPS = [
  { key:'chest', label:'Peito' },
  { key:'back', label:'Costas' },
  { key:'quads', label:'Quadríceps' },
  { key:'hamstrings', label:'Posteriores' },
  { key:'glutes', label:'Glúteos' },
  { key:'shoulders', label:'Ombros' },
  { key:'biceps', label:'Bíceps' },
  { key:'triceps', label:'Tríceps' },
  { key:'calves', label:'Panturrilhas' },
  { key:'core', label:'Core' }
];

var EXERCISE_LIBRARY = [
  { name:'Agachamento livre', group:'quads', type:'compound' },
  { name:'Levantamento terra romeno', group:'hamstrings', type:'compound' },
  { name:'Supino reto', group:'chest', type:'compound' },
  { name:'Barra fixa / puxada', group:'back', type:'compound' },
  { name:'Remada curvada', group:'back', type:'compound' },
  { name:'Desenvolvimento militar', group:'shoulders', type:'compound' },
  { name:'Hip thrust', group:'glutes', type:'compound' },
  { name:'Afundo / passada', group:'quads', type:'compound' },
  { name:'Rosca direta', group:'biceps', type:'isolation' },
  { name:'Tríceps testa / corda', group:'triceps', type:'isolation' },
  { name:'Elevação lateral', group:'shoulders', type:'isolation' },
  { name:'Panturrilha em pé', group:'calves', type:'isolation' },
  { name:'Prancha', group:'core', type:'stability' }
];

var VOLUME_LANDMARKS = {
  chest:     { label:'Peito',       MEV:8,  MAV:'10-18', MRV:22 },
  back:      { label:'Costas',      MEV:10, MAV:'12-22', MRV:26 },
  quads:     { label:'Quadríceps',  MEV:8,  MAV:'10-20', MRV:24 },
  hamstrings:{ label:'Posteriores', MEV:6,  MAV:'8-16',  MRV:20 },
  shoulders: { label:'Ombros',      MEV:6,  MAV:'8-16',  MRV:20 },
  glutes:    { label:'Glúteos',     MEV:6,  MAV:'8-18',  MRV:22 }
};

var NUTRITION_BY_PHASE = {
  hypertrophy: { kcal:'Superávit leve (+5-10%)', protein:'1.6-2.2 g/kg', carbs:'4-6 g/kg', fat:'0.6-1.0 g/kg', note:'Priorizar carboidrato ao redor do treino e proteína distribuída em 3-5 refeições.' },
  strength:    { kcal:'Manutenção ou +5%',       protein:'1.8-2.2 g/kg', carbs:'3-5 g/kg', fat:'0.8-1.0 g/kg', note:'Alta disponibilidade de glicogênio para sessões neurais pesadas.' },
  power:       { kcal:'Manutenção',              protein:'1.6-2.0 g/kg', carbs:'3-5 g/kg', fat:'0.8-1.0 g/kg', note:'Evitar déficit agressivo; potência cai rápido com baixa energia.' },
  deload:      { kcal:'Manutenção',              protein:'1.8-2.2 g/kg', carbs:'2-4 g/kg', fat:'0.8-1.1 g/kg', note:'Manter proteína alta e reduzir carbo conforme queda de volume.' }
};

var ATHLETE_EXPERIENCE_LABELS = {
  beginner:'Iniciante',
  intermediate:'Intermediário',
  advanced:'Avançado'
};

function renderAthleteShell() {
  return '<div class="screen-header"><div class="screen-title">🏋️ Modo Atleta Premium</div></div><div id="main-content"></div>';
}

async function renderAthlete() {
  var main = document.getElementById('main-content');
  if (!main) return;

  var profile = null;
  var logs = [];
  try {
    var sb = getVitaliaSupabaseClient();
    if (sb) {
      var userRes = await sb.auth.getUser();
      var user = userRes.data && userRes.data.user;
      if (user) {
        var profileRes = await sb.from('athlete_profile').select('*').eq('user_id', user.id).maybeSingle();
        if (profileRes.data) profile = profileRes.data;
        var logsRes = await sb.from('athlete_logs').select('*').eq('user_id', user.id).order('session_date', { ascending:false }).limit(28);
        if (logsRes.data) logs = logsRes.data;
      }
    }
  } catch(e) {}

  var phaseKey = (profile && profile.current_phase) || 'hypertrophy';
  var phase = ATHLETE_PHASES[phaseKey] || ATHLETE_PHASES.hypertrophy;
  var nutrition = NUTRITION_BY_PHASE[phaseKey] || NUTRITION_BY_PHASE.hypertrophy;
  var daysPerWeek = (profile && profile.days_per_week) || 4;
  var mesoWeeks = (profile && profile.mesocycle_weeks) || 6;
  var mesoStart = profile && profile.mesocycle_start ? new Date(profile.mesocycle_start + 'T12:00:00') : new Date();
  var elapsedWeeks = Math.max(1, Math.min(mesoWeeks, Math.floor((Date.now() - mesoStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1));
  var currentWeekLogs = logs.filter(function(l) {
    return (Date.now() - new Date(l.session_date + 'T12:00:00').getTime()) <= 7 * 24 * 60 * 60 * 1000;
  });
  var currentLoad = currentWeekLogs.reduce(function(s,l){ return s + ((parseInt(l.duration_min)||0) * (parseInt(l.session_rpe)||0)); }, 0);
  var fourWeekLoad = logs.filter(function(l) {
    return (Date.now() - new Date(l.session_date + 'T12:00:00').getTime()) <= 28 * 24 * 60 * 60 * 1000;
  }).reduce(function(s,l){ return s + ((parseInt(l.duration_min)||0) * (parseInt(l.session_rpe)||0)); }, 0);
  var chronicLoad = fourWeekLoad / 4;
  var acwr = chronicLoad > 0 ? (currentLoad / chronicLoad).toFixed(2) : '-';
  var acwrNum = parseFloat(acwr);
  var acwrColor = isNaN(acwrNum) ? '#9e9e9e' : acwrNum > 1.5 ? '#f44336' : acwrNum >= 0.8 && acwrNum <= 1.3 ? '#4caf50' : '#ff9800';

  var weeklySetsByGroup = {};
  currentWeekLogs.forEach(function(l) {
    (l.exercises || []).forEach(function(ex) {
      if (!ex.group) return;
      weeklySetsByGroup[ex.group] = (weeklySetsByGroup[ex.group] || 0) + (parseInt(ex.sets) || 0);
    });
  });

  var phaseOptions = Object.keys(ATHLETE_PHASES).map(function(k) {
    return '<option value="' + k + '"' + (phaseKey === k ? ' selected' : '') + '>' + ATHLETE_PHASES[k].label + '</option>';
  }).join('');
  var expKey = (profile && profile.experience_level) || 'intermediate';
  var expOptions = Object.keys(ATHLETE_EXPERIENCE_LABELS).map(function(k) {
    return '<option value="' + k + '"' + (expKey === k ? ' selected' : '') + '>' + ATHLETE_EXPERIENCE_LABELS[k] + '</option>';
  }).join('');

  var volumeHtml = Object.keys(VOLUME_LANDMARKS).map(function(k) {
    var v = VOLUME_LANDMARKS[k];
    var sets = weeklySetsByGroup[k] || 0;
    var color = sets < v.MEV ? '#9e9e9e' : sets > v.MRV ? '#f44336' : '#4caf50';
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border-color)22;">'
      + '<span style="font-size:12px;">' + escHtml(v.label) + '</span>'
      + '<span style="font-size:12px;color:' + color + ';font-weight:700;">' + sets + ' sets</span>'
      + '<span style="font-size:10px;opacity:.55;">MEV ' + v.MEV + ' · MAV ' + v.MAV + ' · MRV ' + v.MRV + '</span>'
      + '</div>';
  }).join('');

  var recentHtml = logs.length ? logs.slice(0, 6).map(function(l) {
    var d = l.session_date ? new Date(l.session_date + 'T12:00:00').toLocaleDateString() : '';
    var p = ATHLETE_PHASES[l.phase] || ATHLETE_PHASES.hypertrophy;
    return '<div class="card" style="padding:12px;margin-bottom:8px;border-left:3px solid ' + p.color + ';">'
      + '<div style="display:flex;justify-content:space-between;gap:8px;"><strong style="font-size:13px;">' + escHtml(d) + '</strong><span style="font-size:11px;color:' + p.color + ';">' + escHtml(p.label) + '</span></div>'
      + '<div style="font-size:12px;opacity:.7;margin-top:4px;">RPE ' + (l.session_rpe || '-') + ' · ' + (l.duration_min || '-') + ' min · ' + (l.total_sets || 0) + ' sets</div>'
      + (l.notes ? '<div style="font-size:12px;opacity:.65;margin-top:4px;">' + escHtml(l.notes).substring(0, 140) + '</div>' : '')
      + '</div>';
  }).join('') : '<p style="text-align:center;padding:16px;opacity:.55;">Nenhum treino registrado ainda.</p>';

  main.innerHTML = '<div class="view-container" style="max-width:560px;margin:0 auto;padding:16px;">'
    + '<h2 style="margin-bottom:4px;">🏋️ Modo Atleta Premium</h2>'
    + '<p style="font-size:13px;opacity:.65;margin-bottom:14px;">Periodização · ACWR · MEV/MAV/MRV · nutrição por fase</p>'
    + '<div class="card" style="padding:14px;margin-bottom:12px;border-left:3px solid ' + phase.color + ';">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;"><strong>' + escHtml(phase.label) + '</strong><span style="font-size:11px;padding:2px 8px;border-radius:10px;background:' + phase.bg + ';color:' + phase.color + ';">Semana ' + elapsedWeeks + '/' + mesoWeeks + '</span></div>'
    + '<div style="font-size:12px;opacity:.75;margin-top:5px;">' + escHtml(phase.focus) + '</div>'
    + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">'
    + '<div class="card" style="text-align:center;padding:12px;"><div style="font-size:11px;opacity:.6;">ACWR</div><div style="font-size:24px;font-weight:700;color:' + acwrColor + ';">' + acwr + '</div><div style="font-size:10px;opacity:.5;">0.8-1.3 ideal</div></div>'
    + '<div class="card" style="text-align:center;padding:12px;"><div style="font-size:11px;opacity:.6;">Carga 7d</div><div style="font-size:24px;font-weight:700;">' + Math.round(currentLoad) + '</div><div style="font-size:10px;opacity:.5;">min x RPE</div></div>'
    + '<div class="card" style="text-align:center;padding:12px;"><div style="font-size:11px;opacity:.6;">Frequência</div><div style="font-size:24px;font-weight:700;">' + daysPerWeek + 'x</div><div style="font-size:10px;opacity:.5;">por semana</div></div>'
    + '</div>'
    + '<div class="card" style="padding:14px;margin-bottom:12px;"><div style="font-size:13px;font-weight:700;margin-bottom:8px;">📈 Volume semanal por grupo</div>' + volumeHtml + '</div>'
    + '<div class="card" style="padding:14px;margin-bottom:12px;"><div style="font-size:13px;font-weight:700;margin-bottom:8px;">🍽 Nutrição da fase</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">'
    + '<div><strong>Calorias</strong><br><span style="opacity:.7;">' + escHtml(nutrition.kcal) + '</span></div>'
    + '<div><strong>Proteína</strong><br><span style="opacity:.7;">' + escHtml(nutrition.protein) + '</span></div>'
    + '<div><strong>Carboidratos</strong><br><span style="opacity:.7;">' + escHtml(nutrition.carbs) + '</span></div>'
    + '<div><strong>Gorduras</strong><br><span style="opacity:.7;">' + escHtml(nutrition.fat) + '</span></div>'
    + '</div><div style="font-size:12px;opacity:.7;margin-top:8px;">' + escHtml(nutrition.note) + '</div></div>'
    + '<button onclick="openAthleteLogForm();" class="btn-primary" style="width:100%;margin-bottom:10px;">Registrar treino</button>'
    + '<div id="athlete-log-form" style="display:none;margin-bottom:12px;"></div>'
    + '<div class="card" style="padding:14px;margin-bottom:12px;"><div style="font-size:13px;font-weight:700;margin-bottom:8px;">⚙️ Perfil atleta</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'
    + '<select id="ath-phase" style="padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);">' + phaseOptions + '</select>'
    + '<select id="ath-exp" style="padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);">' + expOptions + '</select>'
    + '<input id="ath-days" type="number" min="1" max="7" value="' + daysPerWeek + '" placeholder="Dias/semana" style="padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);">'
    + '<input id="ath-weeks" type="number" min="3" max="12" value="' + mesoWeeks + '" placeholder="Semanas" style="padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);">'
    + '</div><button onclick="saveAthleteProfile();" class="btn-secondary" style="width:100%;margin-top:10px;">Salvar perfil</button><div id="ath-profile-status" style="min-height:18px;text-align:center;font-size:12px;margin-top:6px;"></div></div>'
    + '<h3 style="margin-bottom:8px;">Últimos treinos</h3>' + recentHtml
    + '<button id="ath-coach-btn" class="btn-secondary" style="width:100%;margin-top:8px;">Analisar periodização com CoachIA</button>'
    + '</div>';

  var coachBtn = document.getElementById('ath-coach-btn');
  if (coachBtn) {
    coachBtn.addEventListener('click', function() {
      try {
        localStorage.setItem('vitalia_coach_context_athlete', JSON.stringify({
          phase: phaseKey,
          acwr: acwr,
          weekly_load: currentLoad,
          days_per_week: daysPerWeek,
          weekly_sets_by_group: weeklySetsByGroup,
          recent_sessions: logs.slice(0, 5)
        }));
      } catch(e) {}
      navigate('coach');
    });
  }
}

function openAthleteLogForm() {
  var wrap = document.getElementById('athlete-log-form');
  if (!wrap) return;
  wrap.style.display = 'block';
  var today = new Date().toISOString().split('T')[0];
  var phaseOptions = Object.keys(ATHLETE_PHASES).map(function(k) {
    return '<option value="' + k + '">' + ATHLETE_PHASES[k].label + '</option>';
  }).join('');
  wrap.innerHTML = '<div class="card" style="padding:14px;border-left:3px solid var(--color-primary,#6c63ff);">'
    + '<div style="font-weight:700;font-size:13px;margin-bottom:10px;">Novo treino</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">'
    + '<input id="ath-log-date" type="date" value="' + today + '" style="padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);">'
    + '<select id="ath-log-phase" style="padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);">' + phaseOptions + '</select>'
    + '<input id="ath-duration" type="number" min="1" placeholder="Duração min" style="padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);">'
    + '<input id="ath-rpe" type="number" min="1" max="10" placeholder="RPE 1-10" style="padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);">'
    + '<input id="ath-fatigue-before" type="number" min="1" max="5" placeholder="Fadiga antes 1-5" style="padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);">'
    + '<input id="ath-fatigue-after" type="number" min="1" max="5" placeholder="Fadiga depois 1-5" style="padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);">'
    + '</div><div id="ath-exercises"></div>'
    + '<button onclick="addAthleteExerciseBlock();" class="btn-secondary" style="width:100%;margin-bottom:8px;">Adicionar exercício</button>'
    + '<textarea id="ath-notes" rows="2" placeholder="Notas do treino" style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);resize:vertical;"></textarea>'
    + '<button onclick="saveAthleteLog();" class="btn-primary" style="width:100%;margin-top:10px;">Salvar treino</button>'
    + '<div id="ath-log-status" style="min-height:18px;text-align:center;font-size:12px;margin-top:6px;"></div>'
    + '</div>';
  addAthleteExerciseBlock();
}

function toggleAthleteMuscleSel(key, el) {
  if (!window._athleteSelectedMuscles) window._athleteSelectedMuscles = {};
  window._athleteSelectedMuscles[key] = !window._athleteSelectedMuscles[key];
  if (el) {
    el.style.borderColor = window._athleteSelectedMuscles[key] ? 'var(--color-primary,#6c63ff)' : 'var(--border-color)';
    el.style.background = window._athleteSelectedMuscles[key] ? 'rgba(108,99,255,.15)' : 'var(--bg-secondary)';
  }
}

function addAthleteExerciseBlock() {
  var holder = document.getElementById('ath-exercises');
  if (!holder) return;
  var idx = holder.querySelectorAll('.ath-ex-row').length;
  var exerciseOptions = EXERCISE_LIBRARY.map(function(ex) {
    return '<option value="' + escHtml(ex.name) + '" data-group="' + ex.group + '">' + escHtml(ex.name) + '</option>';
  }).join('');
  holder.insertAdjacentHTML('beforeend', '<div class="ath-ex-row" style="display:grid;grid-template-columns:1fr 64px 64px;gap:6px;margin-bottom:6px;">'
    + '<select class="ath-ex-name" data-idx="' + idx + '" style="padding:7px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);font-size:12px;">' + exerciseOptions + '</select>'
    + '<input class="ath-ex-sets" type="number" min="1" placeholder="sets" style="padding:7px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);font-size:12px;">'
    + '<input class="ath-ex-reps" type="text" placeholder="reps" style="padding:7px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);font-size:12px;">'
    + '</div>');
}

async function saveAthleteLog() {
  var status = document.getElementById('ath-log-status');
  try {
    var sb = getVitaliaSupabaseClient();
    if (!sb) throw new Error('Supabase não disponível');
    var userRes = await sb.auth.getUser();
    var user = userRes.data && userRes.data.user;
    if (!user) throw new Error('Usuário não autenticado');
    var rows = Array.prototype.slice.call(document.querySelectorAll('.ath-ex-row'));
    var exercises = rows.map(function(row) {
      var sel = row.querySelector('.ath-ex-name');
      var selected = sel && sel.options[sel.selectedIndex];
      var name = sel ? sel.value : '';
      var lib = EXERCISE_LIBRARY.find(function(ex){ return ex.name === name; }) || {};
      return { name: name, group: (selected && selected.getAttribute('data-group')) || lib.group || '', sets: parseInt((row.querySelector('.ath-ex-sets') || {}).value) || 0, reps: (row.querySelector('.ath-ex-reps') || {}).value || '' };
    }).filter(function(ex){ return ex.name && ex.sets > 0; });
    var totalSets = exercises.reduce(function(s,ex){ return s + ex.sets; }, 0);
    var payload = {
      user_id: user.id,
      session_date: (document.getElementById('ath-log-date') || {}).value || new Date().toISOString().split('T')[0],
      phase: (document.getElementById('ath-log-phase') || {}).value || 'hypertrophy',
      duration_min: parseInt((document.getElementById('ath-duration') || {}).value) || null,
      session_rpe: parseInt((document.getElementById('ath-rpe') || {}).value) || null,
      total_sets: totalSets,
      exercises: exercises,
      fatigue_before: parseInt((document.getElementById('ath-fatigue-before') || {}).value) || null,
      fatigue_after: parseInt((document.getElementById('ath-fatigue-after') || {}).value) || null,
      notes: ((document.getElementById('ath-notes') || {}).value || '').trim() || null
    };
    var ins = await sb.from('athlete_logs').insert([payload]);
    if (ins.error) throw ins.error;
    if (typeof capturePostHogEvent === 'function') capturePostHogEvent('athlete_log_saved', { total_sets: totalSets, phase: payload.phase });
    if (status) { status.style.color = 'var(--color-success,#4caf50)'; status.textContent = 'Treino salvo!'; }
    setTimeout(function(){ renderAthlete(); }, 700);
  } catch(err) {
    if (status) { status.style.color = 'var(--color-danger,#f44)'; status.textContent = 'Erro: ' + (err.message || err); }
  }
}

async function saveAthleteProfile() {
  var status = document.getElementById('ath-profile-status');
  try {
    var sb = getVitaliaSupabaseClient();
    if (!sb) throw new Error('Supabase não disponível');
    var userRes = await sb.auth.getUser();
    var user = userRes.data && userRes.data.user;
    if (!user) throw new Error('Usuário não autenticado');
    var phase = (document.getElementById('ath-phase') || {}).value || 'hypertrophy';
    var goalForPhase = phase === 'strength' ? 'strength' : phase === 'power' ? 'performance' : 'hypertrophy';
    var existing = await sb.from('athlete_profile').select('mesocycle_start').eq('user_id', user.id).maybeSingle();
    var mesocycleStart = (existing.data && existing.data.mesocycle_start)
      ? existing.data.mesocycle_start
      : new Date().toISOString().split('T')[0];
    var payload = {
      user_id: user.id,
      goal: goalForPhase,
      current_phase: phase,
      experience_level: (document.getElementById('ath-exp') || {}).value || 'intermediate',
      days_per_week: parseInt((document.getElementById('ath-days') || {}).value) || 4,
      mesocycle_weeks: parseInt((document.getElementById('ath-weeks') || {}).value) || 6,
      mesocycle_start: mesocycleStart,
      updated_at: new Date().toISOString()
    };
    var up = await sb.from('athlete_profile').upsert([payload], { onConflict:'user_id' });
    if (up.error) throw up.error;
    if (status) { status.style.color = 'var(--color-success,#4caf50)'; status.textContent = 'Perfil salvo!'; }
    setTimeout(function(){ renderAthlete(); }, 600);
  } catch(err) {
    if (status) { status.style.color = 'var(--color-danger,#f44)'; status.textContent = 'Erro: ' + (err.message || err); }
  }
}
