/* ═══════════════════════════════════════
   V230-D3 — MÓDULO LONGEVITY (js/modules/longevity.js)
   Ex-bloco inline do index.html (extração literal).
═══════════════════════════════════════ */

var LONGEVITY_PROTOCOLS = [
  {
    key: 'zone2',
    emoji: '🚴',
    title: 'Exercício Zona 2',
    source: 'Attia',
    evidence: 'HIGH',
    time: '30–45 min',
    desc: 'Cardio de baixa intensidade onde você consegue conversar. Máxima saúde mitocondrial, base da longevidade física.',
    why: 'VO2max é o preditor individual mais forte de mortalidade por todas as causas. Zona 2 é o caminho mais eficiente para elevar o VO2max.',
    action: 'Caminhe em ritmo acelerado, pedale ou nade sem ficar ofegante. Frequência cardíaca: 60–70% do máximo.'
  },
  {
    key: 'strength',
    emoji: '🏋️',
    title: 'Treino de Força',
    source: 'Attia',
    evidence: 'HIGH',
    time: '40–60 min',
    desc: 'Massa muscular é o maior preditor de longevidade e independência funcional após os 60 anos.',
    why: 'Músculo é o "órgão da longevidade" — regula glicose, produz miocinas anti-inflamatórias e previne sarcopenia.',
    action: 'Foque em compostos: agachamento, levantamento terra, supino, remada. Progressão de carga ao longo do tempo.'
  },
  {
    key: 'sunlight',
    emoji: '☀️',
    title: 'Luz Solar Matinal',
    source: 'Huberman',
    evidence: 'HIGH',
    time: '10–20 min',
    desc: 'Exposição aos olhos (sem óculos) nos primeiros 30–60 min após acordar. Âncora do ritmo circadiano.',
    why: 'Ativa melanopsina nas células retinianas ipRGC. Dispara cortisol no momento certo, melhora sono noturno e regula humor.',
    action: 'Saia para fora logo ao acordar. Nublado: 20 min. Ensolarado: 5–10 min. Nunca através de vidro.'
  },
  {
    key: 'fasting',
    emoji: '⏱️',
    title: 'Jejum Intermitente',
    source: 'Sinclair',
    evidence: 'HIGH',
    time: '16h+ de janela',
    desc: 'Ativa autofagia, inibe mTOR e estimula sirtuínas — os três caminhos moleculares centrais da longevidade.',
    why: 'Sem comida, células ativam modo de "limpeza" (autofagia), reciclando proteínas danificadas. mTOR inibido = menos envelhecimento celular.',
    action: 'Janela alimentar de 8h (ex: 12h–20h). Café preto e água não quebram o jejum. Comece com 12h e evolua.'
  },
  {
    key: 'sauna',
    emoji: '🧖',
    title: 'Sauna / Calor',
    source: 'Attia + Huberman',
    evidence: 'HIGH',
    time: '20 min a 80–100°C',
    desc: 'Proteínas de choque térmico (HSPs) protegem células. 4x/semana reduz mortalidade cardiovascular em 50% (Laukkanen et al.).',
    why: 'HSPs previnem agregação de proteínas mal dobradas. Mimetiza esforço aeróbico. Aumenta GH naturalmente.',
    action: 'Sauna seca 80–100°C por 15–20 min. Finalizar com ducha fria. Reposição de água essencial.'
  },
  {
    key: 'cold',
    emoji: '🧊',
    title: 'Exposição ao Frio',
    source: 'Huberman',
    evidence: 'MEDIUM',
    time: '2–5 min',
    desc: 'Libera norepinefrina (300%), ativa gordura marrom, melhora foco e ânimo por horas.',
    why: 'Frio aumenta norepinefrina e dopamina de forma sustentada — diferente da dopamina de redes sociais, não cria tolerância.',
    action: 'Ducha fria nos últimos 2 min do banho, ou banho de gelo 11°C. Respire normalmente, não hiperventile antes.'
  },
  {
    key: 'sleep_optimize',
    emoji: '😴',
    title: 'Sono Otimizado',
    source: 'Huberman + Attia',
    evidence: 'HIGH',
    time: '7–9h consistentes',
    desc: 'Durante o sono, sistema glinfático elimina beta-amiloide e tau — proteínas ligadas ao Alzheimer. Sem sono, não há longevidade.',
    why: 'Sono < 6h por noche aumenta risco de Alzheimer, câncer, DCV e obesidade. É o único protocolo de longevidade sem custo.',
    action: 'Mesma hora de dormir e acordar 7 dias/semana. Quarto frio (18–19°C). Zero luz após 22h. Melatonina 0.5mg se necessário.'
  },
  {
    key: 'nmn_nad',
    emoji: '🔬',
    title: 'Precursores NAD+',
    source: 'Sinclair',
    evidence: 'EMERGING',
    time: 'Diário (manhã)',
    desc: 'NMN ou NR elevam NAD+, cofator essencial para sirtuínas e reparação do DNA. Declina 50% dos 20 aos 50 anos.',
    why: 'Sirtuínas são as "guardiãs do epigenoma". Sem NAD+, não funcionam. Restaurar NAD+ é restaurar capacidade de reparo celular.',
    action: '250–500mg NMN ou NR de manhã. Combinar com Resveratrol 250mg + gordura (ex: iogurte) para melhor absorção.'
  },
  {
    key: 'glucose',
    emoji: '📊',
    title: 'Controle Glicêmico',
    source: 'Attia',
    evidence: 'HIGH',
    time: 'Hábito alimentar',
    desc: 'Picos de glicose geram glicação — envelhecimento acelerado de proteínas, vasos e neurônios.',
    why: 'Hemoglobina glicada (HbA1c) é um marcador direto de velocidade de envelhecimento. Cada pico glicêmico danifica endotélio.',
    action: 'Comer fibra antes de carboidratos. Caminhar 10 min após refeições. Evitar ultra-processados. Vinagre antes de refeições ricas em carbo.'
  },
  {
    key: 'stress_mgmt',
    emoji: '🧘',
    title: 'Gestão de Estresse',
    source: 'Huberman',
    evidence: 'HIGH',
    time: '5–10 min',
    desc: 'Cortisol crônico encurta telômeros, acumula gordura visceral e suprime imunidade — envelhecimento acelerado direto.',
    why: 'Técnica NSDR (Non-Sleep Deep Rest) restaura dopamina e norepinefrina de forma ativa — mais eficiente que "não pensar em nada".',
    action: 'Respiração fisiológica: inspire fundo, 2ª inspiração curta, expire longo. Repita 3–5x para baixar cortisol em 30 segundos.'
  }
];

var LONGEVITY_EVIDENCE = {
  HIGH:     { label: 'Alta evidência',      color: '#4caf50', bg: '#4caf5022' },
  MEDIUM:   { label: 'Evidência moderada',  color: '#ff9800', bg: '#ff980022' },
  EMERGING: { label: 'Emergente',           color: '#9c27b0', bg: '#9c27b022' }
};

var LONGEVITY_SOURCES = {
  'Sinclair':        { color: '#9c27b0', bg: '#9c27b018' },
  'Attia':           { color: '#2196f3', bg: '#2196f318' },
  'Huberman':        { color: '#ff9800', bg: '#ff980018' },
  'Huberman + Attia':{ color: '#4caf50', bg: '#4caf5018' },
  'Attia + Huberman':{ color: '#4caf50', bg: '#4caf5018' }
};

function renderLongevityShell() {
  return '<div class="screen-header"><div class="screen-title">🧬 Longevidade & Rejuvenescimento</div></div><div id="main-content"></div>';
}

async function renderLongevity() {
  var main = document.getElementById('main-content');
  if (!main) return;

  var weekHistory = [];
  var todayDone = {};
  var today = new Date().toISOString().split('T')[0];

  try {
    var sb = getVitaliaSupabaseClient();
    if (sb) {
      var { data: { user } } = await sb.auth.getUser();
      if (user) {
        var { data: logData } = await sb.from('longevity_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('log_date', { ascending: false })
          .limit(7);
        if (logData && logData.length > 0) {
          weekHistory = logData;
          var todayEntry = logData.find(function(r){ return r.log_date === today; });
          if (todayEntry) {
            (todayEntry.protocols_done || []).forEach(function(k){ todayDone[k] = true; });
          }
        }
      }
    }
  } catch(e) {}

  var doneCount = Object.keys(todayDone).length;
  var totalCount = LONGEVITY_PROTOCOLS.length;
  var scorePercent = Math.round((doneCount / totalCount) * 100);
  var scoreColor = scorePercent >= 70 ? '#4caf50' : scorePercent >= 40 ? '#ff9800' : '#9e9e9e';

  var streak = 0;
  var sortedDates = weekHistory.map(function(r){ return r.log_date; }).sort().reverse();
  for (var i = 0; i < sortedDates.length; i++) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    var ds = d.toISOString().split('T')[0];
    if (sortedDates.indexOf(ds) >= 0 && (weekHistory.find(function(r){ return r.log_date === ds; }) || {}).score > 0) {
      streak++;
    } else break;
  }

  var activeFilter = window._longevityFilter || 'all';
  var sourceFilters = ['all', 'Sinclair', 'Attia', 'Huberman'];
  var filterHtml = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;">';
  sourceFilters.forEach(function(f) {
    var isActive = activeFilter === f;
    var src = LONGEVITY_SOURCES[f] || {};
    filterHtml += '<button onclick="window._longevityFilter=\'' + f + '\';renderLongevity();" style="padding:5px 12px;border-radius:20px;border:1px solid;cursor:pointer;font-size:12px;font-weight:500;'
      + (isActive ? 'background:' + (src.bg || 'rgba(108,99,255,.10)') + ';color:' + (src.color || 'var(--color-primary,#6c63ff)') + ';border-color:' + (src.color || 'var(--color-primary,#6c63ff)') + ';' : 'background:var(--bg-secondary);color:var(--text-secondary);border-color:var(--border-color);')
      + '">' + (f === 'all' ? 'Todos' : f) + '</button>';
  });
  filterHtml += '</div>';

  var filtered = LONGEVITY_PROTOCOLS.filter(function(p) {
    if (activeFilter === 'all') return true;
    return p.source.indexOf(activeFilter) >= 0;
  });

  var cardsHtml = filtered.map(function(p) {
    var isDone = todayDone[p.key] === true;
    var ev = LONGEVITY_EVIDENCE[p.evidence] || LONGEVITY_EVIDENCE.MEDIUM;
    var src = LONGEVITY_SOURCES[p.source] || {};
    return '<div class="card" id="lon-card-' + p.key + '" style="padding:14px;margin-bottom:10px;border-left:3px solid ' + (isDone ? '#4caf50' : 'var(--border-color)') + ';opacity:' + (isDone ? '1' : '.95') + ';">'
      + '<div style="display:flex;align-items:flex-start;gap:10px;">'
      + '<span style="font-size:22px;flex-shrink:0;">' + p.emoji + '</span>'
      + '<div style="flex:1;">'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:6px;margin-bottom:4px;">'
      + '<strong style="font-size:14px;">' + escHtml(p.title) + '</strong>'
      + '<div style="display:flex;gap:5px;flex-wrap:wrap;">'
      + '<span style="font-size:10px;padding:2px 7px;border-radius:10px;background:' + (src.bg||'#eee') + ';color:' + (src.color||'#333') + ';border:0.5px solid ' + (src.color||'#ccc') + '40;">' + escHtml(p.source) + '</span>'
      + '<span style="font-size:10px;padding:2px 7px;border-radius:10px;background:' + ev.bg + ';color:' + ev.color + ';border:0.5px solid ' + ev.color + '44;">' + ev.label + '</span>'
      + '</div></div>'
      + '<div style="font-size:12px;opacity:.75;margin-bottom:6px;">' + escHtml(p.desc) + '</div>'
      + '<details style="margin-bottom:8px;">'
      + '<summary style="font-size:12px;color:var(--color-primary,#6c63ff);cursor:pointer;list-style:none;">▸ Por que funciona · Como fazer</summary>'
      + '<div style="margin-top:8px;padding:8px 10px;background:var(--bg-secondary);border-radius:6px;font-size:12px;line-height:1.6;">'
      + '<div style="margin-bottom:4px;"><strong>🔬 Mecanismo:</strong> ' + escHtml(p.why) + '</div>'
      + '<div><strong>✅ Ação:</strong> ' + escHtml(p.action) + '</div>'
      + '</div></details>'
      + '<div style="display:flex;align-items:center;justify-content:space-between;">'
      + '<span style="font-size:11px;opacity:.55;">⏱ ' + escHtml(p.time) + '</span>'
      + '<button onclick="toggleLongevityProtocol(\'' + p.key + '\',' + (!isDone) + ');" style="padding:5px 14px;border-radius:8px;border:none;cursor:pointer;font-size:12px;font-weight:600;'
      + (isDone ? 'background:#4caf5022;color:#4caf50;border:1px solid #4caf5055;' : 'background:rgba(108,99,255,.09);color:var(--color-primary,#6c63ff);border:1px solid rgba(108,99,255,.28);')
      + '">' + (isDone ? '✓ Feito hoje' : '+ Marcar feito') + '</button>'
      + '</div>'
      + '</div></div></div>';
  }).join('');

  main.innerHTML = '<div class="view-container" style="max-width:520px;margin:0 auto;padding:16px;">'
    + '<h2 style="margin-bottom:4px;">🧬 Longevidade & Rejuvenescimento</h2>'
    + '<p style="font-size:13px;opacity:.6;margin-bottom:16px;">Protocolos baseados em Sinclair · Attia · Huberman</p>'
    + '<div style="display:flex;gap:10px;margin-bottom:16px;">'
    + '<div class="card" style="flex:1;text-align:center;padding:14px;">'
    + '<div style="font-size:11px;opacity:.6;">Hoje</div>'
    + '<div style="font-size:26px;font-weight:700;color:' + scoreColor + ';">' + doneCount + '/' + totalCount + '</div>'
    + '<div style="font-size:11px;opacity:.6;">protocolos</div>'
    + '</div>'
    + '<div class="card" style="flex:1;text-align:center;padding:14px;">'
    + '<div style="font-size:11px;opacity:.6;">Score</div>'
    + '<div style="font-size:26px;font-weight:700;color:' + scoreColor + ';">' + scorePercent + '%</div>'
    + '<div style="font-size:11px;opacity:.6;">do dia</div>'
    + '</div>'
    + '<div class="card" style="flex:1;text-align:center;padding:14px;">'
    + '<div style="font-size:11px;opacity:.6;">Sequência</div>'
    + '<div style="font-size:26px;font-weight:700;">' + streak + '</div>'
    + '<div style="font-size:11px;opacity:.6;">dias</div>'
    + '</div>'
    + '</div>'
    + filterHtml
    + cardsHtml
    + '<button id="lon-coach-btn" class="btn-secondary" style="width:100%;margin-top:8px;">🤖 Analisar meus protocolos com CoachIA</button>'
    + '</div>';

  var coachBtn = document.getElementById('lon-coach-btn');
  if (coachBtn) {
    coachBtn.addEventListener('click', function() {
      var activeProts = LONGEVITY_PROTOCOLS.filter(function(p){ return todayDone[p.key]; }).map(function(p){ return p.title; });
      try {
        localStorage.setItem('vitalia_coach_context_longevity', JSON.stringify({
          protocols_done_today: activeProts,
          score_percent: scorePercent,
          streak_days: streak
        }));
      } catch(e) {}
      navigate('coach');
    });
  }
}

function toggleLongevityProtocol(key, activate) {
  var sb = getVitaliaSupabaseClient();
  if (!sb) { reportProgressHealthError('Longevidade', 'Supabase não disponível'); return; }
  var today = new Date().toISOString().split('T')[0];
  sb.auth.getUser().then(function(res) {
    var user = res.data && res.data.user;
    if (!user) { reportProgressHealthError('Longevidade', 'Usuário não autenticado'); return; }
    sb.from('longevity_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('log_date', today)
      .maybeSingle()
      .then(function(result) {
        if (result && result.error) { reportProgressHealthError('Longevidade', result.error); return; }
        var existing = result.data;
        var currentDone = existing ? (existing.protocols_done || []) : [];
        var newDone = activate
          ? (currentDone.indexOf(key) >= 0 ? currentDone : currentDone.concat([key]))
          : currentDone.filter(function(k){ return k !== key; });
        var score = Math.round((newDone.length / LONGEVITY_PROTOCOLS.length) * 100);
        if (existing) {
          sb.from('longevity_logs')
            .update({ protocols_done: newDone, score: score })
            .eq('id', existing.id)
            .then(function(writeResult){
              if (writeResult && writeResult.error) { reportProgressHealthError('Longevidade', writeResult.error); return; }
              renderLongevity();
            });
        } else {
          sb.from('longevity_logs')
            .insert([{ user_id: user.id, log_date: today, protocols_done: newDone, score: score }])
            .then(function(writeResult){
              if (writeResult && writeResult.error) { reportProgressHealthError('Longevidade', writeResult.error); return; }
              renderLongevity();
            });
        }
      }).catch(function(err){ reportProgressHealthError('Longevidade', err); });
  }).catch(function(err){ reportProgressHealthError('Longevidade', err); });
}
