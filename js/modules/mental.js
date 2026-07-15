/* ═══════════════════════════════════════
   V230-D3 — MÓDULO MENTAL (js/modules/mental.js)
   Ex-bloco inline do index.html (extração literal).
═══════════════════════════════════════ */

var BREATHING_PROTOCOLS = [
  {
    key: 'physiological_sigh',
    emoji: '😮‍💨',
    title: 'Suspiro Fisiológico',
    source: 'Huberman',
    time: '< 30 seg',
    badge: 'Mais rápido',
    badgeColor: '#4caf50',
    desc: 'A forma mais rápida de reduzir estresse. Inspiração dupla pelo nariz + expiração longa pela boca.',
    steps: [
      'Inspire fundo pelo nariz (enchendo os pulmões)',
      'Sem expirar, inspire mais uma vez curta pelo nariz (expande ao máximo)',
      'Expire lentamente e completamente pela boca (2x mais longa que a inspiração)',
      'Repita 1–3 vezes — efeito imediato'
    ],
    why: 'Reinflata os alvéolos pulmonares colapsados, expele CO₂ acumulado e ativa o nervo vago para resposta parassimpática.'
  },
  {
    key: 'box_breathing',
    emoji: '🔲',
    title: 'Box Breathing',
    source: 'Navy SEALs / Huberman',
    time: '4–5 min',
    badge: 'Foco & controle',
    badgeColor: '#2196f3',
    desc: 'Técnica usada por militares e atletas de elite. Equilibra sistema nervoso autônomo em minutos.',
    steps: [
      'Inspire pelo nariz contando até 4',
      'Segure o ar contando até 4',
      'Expire pela boca contando até 4',
      'Segure sem ar contando até 4',
      'Repita por 4–6 ciclos'
    ],
    why: 'O padrão 4-4-4-4 sincroniza ritmo cardíaco e respiratório, elevando HRV (variabilidade cardíaca) — marcador direto de resiliência ao estresse.'
  },
  {
    key: 'four_seven_eight',
    emoji: '🌙',
    title: '4-7-8 (Respiração do Sono)',
    source: 'Dr. Andrew Weil',
    time: '2–3 min',
    badge: 'Ansiedade & sono',
    badgeColor: '#9c27b0',
    desc: 'Derivada do pranayama. Poderosa para ansiedade aguda e para pegar no sono.',
    steps: [
      'Expire completamente pela boca fazendo um som de "whoosh"',
      'Feche a boca e inspire pelo nariz contando até 4',
      'Segure a respiração contando até 7',
      'Expire pela boca fazendo som de "whoosh" contando até 8',
      'Repita 4 ciclos completos (máx. 4 da primeira vez)'
    ],
    why: 'A expiração prolongada (8 counts) ativa parassimpático de forma intensa. A retenção (7 counts) aumenta CO₂ que dilata vasos e acalma o sistema nervoso.'
  },
  {
    key: 'resonance',
    emoji: '🫀',
    title: 'Respiração de Ressonância',
    source: 'HRV Science',
    time: '10–20 min',
    badge: 'HRV máxima',
    badgeColor: '#ff9800',
    desc: '5,5 respirações por minuto — a frequência que maximiza variabilidade cardíaca (HRV) e coerência cardíaca.',
    steps: [
      'Inspire por 5,5 segundos (nariz)',
      'Expire por 5,5 segundos (nariz ou boca)',
      'Ritmo constante, sem pausas',
      'Ideal: olhos fechados, postura ereta',
      'Pratique por 10–20 minutos para efeito profundo'
    ],
    why: 'Alinha ritmos respiratório, cardiovascular e cerebral. Estudos mostram aumento de 40–50% no HRV após 5 semanas de prática diária.'
  },
  {
    key: 'cyclic_sighing',
    emoji: '🌊',
    title: 'Suspiro Cíclico',
    source: 'Huberman / Stanford',
    time: '5 min',
    badge: 'Bem-estar geral',
    badgeColor: '#00bcd4',
    desc: 'Estudo de Stanford 2023: 5 min/dia supera meditação na melhora de humor e redução de ansiedade.',
    steps: [
      'Inspire lentamente pelo nariz (3–4 seg)',
      'Inspire mais uma vez pelo nariz (curta, adicional)',
      'Expire lentamente pela boca (6–8 seg)',
      'Mantenha ritmo contínuo por 5 minutos',
      'Foco: apenas na expiração longa'
    ],
    why: 'Respiração com expiração dominante ativa consistentemente o nervo vago. 5 min/dia produz melhoras mensuráveis em humor e estresse ao longo de semanas.'
  }
];

var MOOD_LABELS = ['', '😔 Muito mal', '😟 Mal', '😐 Neutro', '😊 Bem', '😄 Ótimo'];
var STRESS_LABELS = ['', '😤 Extremo', '😰 Alto', '😅 Moderado', '😌 Baixo', '🧘 Mínimo'];

function renderMentalHealthShell() {
  return '<div class="screen-header"><div class="screen-title">🧘 Saúde Mental & Estresse</div></div><div id="main-content"></div>';
}

async function renderMentalHealth() {
  var main = document.getElementById('main-content');
  if (!main) return;

  var today = new Date().toISOString().split('T')[0];
  var todayLog = null;
  var weekHistory = [];

  try {
    var sb = getVitaliaSupabaseClient();
    if (sb) {
      var { data: { user } } = await sb.auth.getUser();
      if (user) {
        var { data: logs } = await sb.from('stress_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('log_date', { ascending: false })
          .limit(7);
        if (logs && logs.length > 0) {
          weekHistory = logs;
          var t = logs.find(function(r){ return r.log_date === today; });
          if (t) todayLog = t;
        }
      }
    }
  } catch(e) {}

  var mood = todayLog ? todayLog.mood_score : 0;
  var stress = todayLog ? todayLog.stress_score : 0;
  var breathingDone = todayLog ? todayLog.breathing_done : false;
  var walkedToday = todayLog ? (todayLog.walked_today || false) : false;
  var walkingMinutes = todayLog ? (todayLog.walking_minutes || null) : null;
  var activeProtocol = window._mentalBreathProtocol || null;

  var avgMood = 0, avgStress = 0;
  if (weekHistory.length > 0) {
    var moodSum = 0, stressSum = 0, moodCount = 0, stressCount = 0;
    weekHistory.forEach(function(r) {
      if (r.mood_score) { moodSum += r.mood_score; moodCount++; }
      if (r.stress_score) { stressSum += r.stress_score; stressCount++; }
    });
    avgMood = moodCount ? (moodSum / moodCount).toFixed(1) : 0;
    avgStress = stressCount ? (stressSum / stressCount).toFixed(1) : 0;
  }

  var trendHtml = '';
  if (weekHistory.length > 0) {
    var sorted = weekHistory.slice().sort(function(a,b){ return a.log_date > b.log_date ? 1 : -1; });
    trendHtml = '<div class="card" style="padding:12px;margin-bottom:14px;">'
      + '<div style="font-size:12px;font-weight:600;margin-bottom:8px;">📈 Últimos 7 dias</div>'
      + '<div style="display:flex;gap:6px;align-items:flex-end;justify-content:flex-start;">'
      + sorted.map(function(r) {
          var h = (r.mood_score || 0) * 8;
          var col = r.mood_score >= 4 ? '#4caf50' : r.mood_score >= 3 ? '#ff9800' : '#f44336';
          var dayLabel = new Date(r.log_date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' });
          return '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">'
            + '<div style="width:20px;height:' + h + 'px;background:' + col + ';border-radius:3px;min-height:4px;"></div>'
            + '<span style="font-size:9px;opacity:.5;">' + dayLabel + '</span>'
            + '</div>';
        }).join('')
      + '</div>'
      + '<div style="font-size:11px;opacity:.6;margin-top:6px;">Humor médio: ' + (avgMood || '—') + '/5 · Estresse médio: ' + (avgStress || '—') + '/5</div>'
      + '</div>';
  }

  var moodHtml = '<div class="card" style="padding:14px;margin-bottom:12px;">'
    + '<div style="font-weight:600;font-size:13px;margin-bottom:10px;">💭 Como você está se sentindo hoje?</div>'
    + '<div style="display:flex;gap:6px;justify-content:space-between;">'
    + [1,2,3,4,5].map(function(v) {
        var selected = mood === v;
        var em = MOOD_LABELS[v].split(' ')[0];
        return '<button onclick="saveMentalCheckIn(\'mood\',' + v + ');" style="flex:1;padding:8px 4px;border-radius:8px;border:2px solid;cursor:pointer;font-size:18px;text-align:center;'
          + (selected ? 'border-color:var(--color-primary,#6c63ff);background:rgba(108,99,255,.15);' : 'border-color:var(--border-color);background:var(--bg-secondary);')
          + '">' + em + '</button>';
      }).join('')
    + '</div>'
    + (mood ? '<div style="font-size:12px;opacity:.7;margin-top:8px;text-align:center;">' + escHtml(MOOD_LABELS[mood]) + '</div>' : '')
    + '</div>';

  var stressHtml = '<div class="card" style="padding:14px;margin-bottom:12px;">'
    + '<div style="font-weight:600;font-size:13px;margin-bottom:10px;">⚡ Nível de estresse hoje?</div>'
    + '<div style="display:flex;gap:6px;justify-content:space-between;">'
    + [1,2,3,4,5].map(function(v) {
        var selected = stress === v;
        var em = STRESS_LABELS[v].split(' ')[0];
        return '<button onclick="saveMentalCheckIn(\'stress\',' + v + ');" style="flex:1;padding:8px 4px;border-radius:8px;border:2px solid;cursor:pointer;font-size:18px;text-align:center;'
          + (selected ? 'border-color:var(--color-primary,#6c63ff);background:rgba(108,99,255,.15);' : 'border-color:var(--border-color);background:var(--bg-secondary);')
          + '">' + em + '</button>';
      }).join('')
    + '</div>'
    + (stress ? '<div style="font-size:12px;opacity:.7;margin-top:8px;text-align:center;">' + escHtml(STRESS_LABELS[stress]) + '</div>' : '')
    + '</div>';

  var breathHtml = BREATHING_PROTOCOLS.map(function(p) {
    var isActive = activeProtocol === p.key;
    return '<div class="card" style="padding:14px;margin-bottom:10px;border-left:3px solid ' + (breathingDone && todayLog && todayLog.breathing_protocol === p.key ? '#4caf50' : p.badgeColor) + ';">'
      + '<div style="display:flex;align-items:flex-start;gap:10px;">'
      + '<span style="font-size:22px;flex-shrink:0;">' + p.emoji + '</span>'
      + '<div style="flex:1;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:4px;">'
      + '<strong style="font-size:14px;">' + escHtml(p.title) + '</strong>'
      + '<div style="display:flex;gap:5px;">'
      + '<span style="font-size:10px;padding:2px 7px;border-radius:10px;background:' + p.badgeColor + '22;color:' + p.badgeColor + ';border:0.5px solid ' + p.badgeColor + '55;">' + escHtml(p.badge) + '</span>'
      + '</div></div>'
      + '<div style="font-size:11px;opacity:.55;margin-bottom:5px;">⏱ ' + escHtml(p.time) + ' · ' + escHtml(p.source) + '</div>'
      + '<div style="font-size:12px;opacity:.75;margin-bottom:8px;">' + escHtml(p.desc) + '</div>'
      + '<details' + (isActive ? ' open' : '') + '><summary style="font-size:12px;color:var(--color-primary,#6c63ff);cursor:pointer;list-style:none;">▸ Passo a passo · Por que funciona</summary>'
      + '<div style="margin-top:8px;padding:8px 10px;background:var(--bg-secondary);border-radius:6px;font-size:12px;line-height:1.7;">'
      + '<ol style="margin:0 0 8px 16px;padding:0;">' + p.steps.map(function(s){ return '<li>' + escHtml(s) + '</li>'; }).join('') + '</ol>'
      + '<div><strong>🔬</strong> ' + escHtml(p.why) + '</div>'
      + '</div></details>'
      + '<button onclick="markBreathingDone(\'' + p.key + '\');" style="margin-top:8px;width:100%;padding:7px;border-radius:8px;border:none;cursor:pointer;font-size:12px;font-weight:600;'
      + (breathingDone && todayLog && todayLog.breathing_protocol === p.key
          ? 'background:#4caf5022;color:#4caf50;border:1px solid #4caf5055;'
          : 'background:rgba(108,99,255,.12);color:var(--color-primary,#6c63ff);border:1px solid rgba(108,99,255,.3);')
      + '">'
      + (breathingDone && todayLog && todayLog.breathing_protocol === p.key ? '✓ Feito hoje!' : '✅ Pratiquei agora')
      + '</button>'
      + '</div></div></div>';
  }).join('');

  var walkHtml = '<div class="card" style="padding:14px;margin-bottom:12px;">'
    + '<div style="font-weight:600;font-size:13px;margin-bottom:10px;">🚶 Caminhei hoje?</div>'
    + '<div style="display:flex;gap:10px;margin-bottom:10px;">'
    + '<button onclick="saveWalkingToday(true);" style="flex:1;padding:10px;border-radius:8px;border:2px solid;cursor:pointer;font-size:14px;'
    + (walkedToday ? 'border-color:var(--color-primary,#6c63ff);background:rgba(108,99,255,.15);' : 'border-color:var(--border-color);background:var(--bg-secondary);')
    + '">✅ Sim</button>'
    + '<button onclick="saveWalkingToday(false);" style="flex:1;padding:10px;border-radius:8px;border:2px solid;cursor:pointer;font-size:14px;border-color:var(--border-color);background:var(--bg-secondary);'
    + '">❌ Não</button>'
    + '</div>'
    + (walkedToday
        ? '<div style="margin-top:6px;display:flex;align-items:center;gap:8px;">'
          + '<label style="font-size:12px;">Minutos:</label>'
          + '<input type="number" id="walk-minutes" min="0" max="300" value="' + (walkingMinutes || '') + '" placeholder="Ex: 30"'
          + ' style="width:80px;padding:6px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);">'
          + '<button onclick="saveWalkingMinutes();" style="padding:6px 12px;border-radius:8px;border:1px solid var(--color-primary,#6c63ff);background:transparent;color:var(--color-primary,#6c63ff);cursor:pointer;font-size:12px;">Salvar</button>'
          + '</div>'
        : '')
    + '</div>';

  main.innerHTML = '<div class="view-container" style="max-width:520px;margin:0 auto;padding:16px;">'
    + '<h2 style="margin-bottom:4px;">🧘 Saúde Mental & Estresse</h2>'
    + '<p style="font-size:13px;opacity:.6;margin-bottom:16px;">Check-in diário · Protocolos de respiração baseados em ciência</p>'
    + trendHtml
    + moodHtml
    + stressHtml
    + '<div style="font-weight:600;font-size:13px;margin-bottom:10px;margin-top:4px;">🌬️ Protocolos de Respiração</div>'
    + breathHtml
    + walkHtml
    + '<button id="mental-coach-btn" class="btn-secondary" style="width:100%;margin-top:8px;">🤖 Analisar meu estado emocional com CoachIA</button>'
    + '</div>';

  var cb = document.getElementById('mental-coach-btn');
  if (cb) {
    cb.addEventListener('click', function() {
      try {
        localStorage.setItem('vitalia_coach_context_mental', JSON.stringify({
          mood_today: mood,
          stress_today: stress,
          breathing_done: breathingDone,
          walked_today: walkedToday,
          walking_minutes: walkingMinutes,
          avg_mood_7d: avgMood,
          avg_stress_7d: avgStress
        }));
      } catch(e) {}
      navigate('coach');
    });
  }
}

function saveMentalCheckIn(field, value) {
  var sb = getVitaliaSupabaseClient();
  if (!sb) { reportProgressHealthError('Saúde Mental', 'Supabase não disponível'); return; }
  var today = new Date().toISOString().split('T')[0];
  sb.auth.getUser().then(function(res) {
    var user = res.data && res.data.user;
    if (!user) { reportProgressHealthError('Saúde Mental', 'Usuário não autenticado'); return; }
    sb.from('stress_logs').select('id').eq('user_id', user.id).eq('log_date', today).maybeSingle()
      .then(function(r) {
        if (r && r.error) { reportProgressHealthError('Saúde Mental', r.error); return; }
        var upd = {};
        upd[field === 'mood' ? 'mood_score' : 'stress_score'] = value;
        if (r.data) {
          sb.from('stress_logs').update(upd).eq('id', r.data.id).then(function(writeResult){
            if (writeResult && writeResult.error) { reportProgressHealthError('Saúde Mental', writeResult.error); return; }
            renderMentalHealth();
          });
        } else {
          upd.user_id = user.id;
          upd.log_date = today;
          sb.from('stress_logs').insert([upd]).then(function(writeResult){
            if (writeResult && writeResult.error) { reportProgressHealthError('Saúde Mental', writeResult.error); return; }
            renderMentalHealth();
          });
        }
      }).catch(function(err){ reportProgressHealthError('Saúde Mental', err); });
  }).catch(function(err){ reportProgressHealthError('Saúde Mental', err); });
}

function saveWalkingToday(walked) {
  var sb = getVitaliaSupabaseClient();
  if (!sb) { reportProgressHealthError('Caminhada', 'Supabase não disponível'); return; }
  var today = new Date().toISOString().split('T')[0];
  sb.auth.getUser().then(function(res) {
    var user = res.data && res.data.user;
    if (!user) { reportProgressHealthError('Caminhada', 'Usuário não autenticado'); return; }
    sb.from('stress_logs').select('id').eq('user_id', user.id).eq('log_date', today).maybeSingle()
      .then(function(r) {
        if (r && r.error) { reportProgressHealthError('Caminhada', r.error); return; }
        var upd = { walked_today: walked };
        if (!walked) upd.walking_minutes = null;
        if (r.data) {
          sb.from('stress_logs').update(upd).eq('id', r.data.id).then(function(writeResult){
            if (writeResult && writeResult.error) { reportProgressHealthError('Caminhada', writeResult.error); return; }
            renderMentalHealth();
          });
        } else {
          upd.user_id = user.id;
          upd.log_date = today;
          sb.from('stress_logs').insert([upd]).then(function(writeResult){
            if (writeResult && writeResult.error) { reportProgressHealthError('Caminhada', writeResult.error); return; }
            renderMentalHealth();
          });
        }
      }).catch(function(err){ reportProgressHealthError('Caminhada', err); });
  }).catch(function(err){ reportProgressHealthError('Caminhada', err); });
}

function saveWalkingMinutes() {
  var sb = getVitaliaSupabaseClient();
  if (!sb) { reportProgressHealthError('Caminhada', 'Supabase não disponível'); return; }
  var today = new Date().toISOString().split('T')[0];
  var minutesInput = document.getElementById('walk-minutes');
  var minutes = minutesInput ? (parseInt(minutesInput.value, 10) || null) : null;
  sb.auth.getUser().then(function(res) {
    var user = res.data && res.data.user;
    if (!user) { reportProgressHealthError('Caminhada', 'Usuário não autenticado'); return; }
    sb.from('stress_logs').select('id').eq('user_id', user.id).eq('log_date', today).maybeSingle()
      .then(function(r) {
        if (r && r.error) { reportProgressHealthError('Caminhada', r.error); return; }
        var upd = { walked_today: true, walking_minutes: minutes };
        if (r.data) {
          sb.from('stress_logs').update(upd).eq('id', r.data.id).then(function(writeResult){
            if (writeResult && writeResult.error) { reportProgressHealthError('Caminhada', writeResult.error); return; }
            renderMentalHealth();
          });
        } else {
          upd.user_id = user.id;
          upd.log_date = today;
          sb.from('stress_logs').insert([upd]).then(function(writeResult){
            if (writeResult && writeResult.error) { reportProgressHealthError('Caminhada', writeResult.error); return; }
            renderMentalHealth();
          });
        }
      }).catch(function(err){ reportProgressHealthError('Caminhada', err); });
  }).catch(function(err){ reportProgressHealthError('Caminhada', err); });
}

function markBreathingDone(protocolKey) {
  var sb = getVitaliaSupabaseClient();
  if (!sb) { reportProgressHealthError('Respiração', 'Supabase não disponível'); return; }
  var today = new Date().toISOString().split('T')[0];
  sb.auth.getUser().then(function(res) {
    var user = res.data && res.data.user;
    if (!user) { reportProgressHealthError('Respiração', 'Usuário não autenticado'); return; }
    sb.from('stress_logs').select('id').eq('user_id', user.id).eq('log_date', today).maybeSingle()
      .then(function(r) {
        if (r && r.error) { reportProgressHealthError('Respiração', r.error); return; }
        var upd = { breathing_done: true, breathing_protocol: protocolKey };
        if (r.data) {
          sb.from('stress_logs').update(upd).eq('id', r.data.id).then(function(writeResult){
            if (writeResult && writeResult.error) { reportProgressHealthError('Respiração', writeResult.error); return; }
            renderMentalHealth();
          });
        } else {
          upd.user_id = user.id;
          upd.log_date = today;
          sb.from('stress_logs').insert([upd]).then(function(writeResult){
            if (writeResult && writeResult.error) { reportProgressHealthError('Respiração', writeResult.error); return; }
            renderMentalHealth();
          });
        }
      }).catch(function(err){ reportProgressHealthError('Respiração', err); });
  }).catch(function(err){ reportProgressHealthError('Respiração', err); });
}
