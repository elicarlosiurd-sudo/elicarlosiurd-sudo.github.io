/* ═══════════════════════════════════════
   V230-D2 — MÓDULO SUPLEMENTAÇÃO (js/modules/supplements.js)
   Ex-bloco inline L5671–5812 do index.html (extração literal).
   Funções globais: renderSupplementsShell, renderSupplements, toggleSupplement.
═══════════════════════════════════════ */

var SUPPLEMENT_CATALOG = [
  { key:'vitd3',       name:'Vitamina D3',       dose:'2000–5000 UI/dia',    evidence:'HIGH',     tags:['longevidade','imunidade','ossos'],       emoji:'☀️',  desc:'Essencial para imunidade, ossos e humor. Deficiência muito comum.' },
  { key:'omega3',      name:'Ômega-3 (EPA/DHA)', dose:'1–3g/dia',            evidence:'HIGH',     tags:['coração','inflamação','cérebro'],        emoji:'🐟',  desc:'Anti-inflamatório potente. Suporte cardiovascular e cognitivo.' },
  { key:'magnesium',   name:'Magnésio',           dose:'300–400mg/dia',       evidence:'HIGH',     tags:['sono','estresse','músculos'],            emoji:'🪨',  desc:'Melhora qualidade do sono, reduz estresse e cãibras.' },
  { key:'creatine',    name:'Creatina',           dose:'3–5g/dia',            evidence:'HIGH',     tags:['atleta','músculo','força'],              emoji:'💪',  desc:'Maior evidência científica em suplementos esportivos.' },
  { key:'b12',         name:'Vitamina B12',       dose:'500–1000mcg/dia',     evidence:'HIGH',     tags:['energia','neurológico','veganos'],       emoji:'⚡',  desc:'Essencial para energia e sistema nervoso. Crítico em dietas plant-based.' },
  { key:'zinc',        name:'Zinco',              dose:'15–30mg/dia',         evidence:'MEDIUM',   tags:['imunidade','testosterona','pele'],       emoji:'🛡️', desc:'Suporte imunológico e hormonal. Evitar megadose.' },
  { key:'collagen',    name:'Colágeno Hidrolisado',dose:'10–15g/dia',         evidence:'MEDIUM',   tags:['pele','articulações','rejuvenecimento'], emoji:'✨',  desc:'Melhora elasticidade da pele e saúde articular.' },
  { key:'curcumin',    name:'Curcumina + Piperina',dose:'500–1000mg/dia',     evidence:'MEDIUM',   tags:['inflamação','articulações','antioxidante'],emoji:'🌿',desc:'Potente anti-inflamatório natural. Piperina aumenta absorção 20x.' },
  { key:'probiotics',  name:'Probióticos',        dose:'10–50 bilhões UFC',   evidence:'MEDIUM',   tags:['intestino','imunidade','humor'],         emoji:'🦠',  desc:'Microbioma saudável ligado à imunidade, digestão e humor.' },
  { key:'ashwagandha', name:'Ashwagandha',        dose:'300–600mg/dia',       evidence:'MEDIUM',   tags:['estresse','cortisol','sono'],            emoji:'🧘',  desc:'Adaptogênico. Reduz cortisol e melhora resposta ao estresse.' },
  { key:'coq10',       name:'Coenzima Q10',       dose:'100–200mg/dia',       evidence:'MEDIUM',   tags:['longevidade','energia','coração'],       emoji:'⚙️', desc:'Suporte mitocondrial. Importante para quem usa estatinas.' },
  { key:'melatonin',   name:'Melatonina',         dose:'0.5–3mg (noite)',     evidence:'HIGH',     tags:['sono','jet-lag','antioxidante'],         emoji:'🌙',  desc:'Regula ciclo circadiano. Usar dose baixa (0.5–1mg).' },
  { key:'nmn',         name:'NMN / NR',           dose:'250–500mg/dia',       evidence:'EMERGING', tags:['longevidade','NAD+','rejuvenecimento'],  emoji:'🔬',  desc:'Precursor do NAD+. Pesquisas promissoras em longevidade (Sinclair).' },
  { key:'resveratrol', name:'Resveratrol',         dose:'250–500mg/dia',       evidence:'EMERGING', tags:['longevidade','antioxidante','coração'],  emoji:'🍷',  desc:'Ativa sirtuínas. Estudos em longevidade ainda em curso.' },
  { key:'protein',     name:'Proteína Whey/Vegetal',dose:'20–30g pós-treino', evidence:'HIGH',     tags:['atleta','músculo','recuperação'],        emoji:'🥛',  desc:'Base da hipertrofia e recuperação muscular.' }
];

var EVIDENCE_CONFIG = {
  HIGH:     { label:'Alta evidência',      color:'#4caf50', bg:'#4caf5022' },
  MEDIUM:   { label:'Evidência moderada',  color:'#ff9800', bg:'#ff980022' },
  EMERGING: { label:'Evidência emergente', color:'#9c27b0', bg:'#9c27b022' },
  LOW:      { label:'Evidência limitada',  color:'#9e9e9e', bg:'#9e9e9e22' }
};

function renderSupplementsShell() {
  return '<div class="screen-header"><div class="screen-title">💊 Suplementação Inteligente</div></div><div id="main-content"></div>';
}

async function renderSupplements() {
  var t = getLang();
  var main = document.getElementById('main-content');
  if (!main) return;

  // Carregar estado do usuário
  var userTracking = {};
  try {
    var sb = getVitaliaSupabaseClient();
    if (sb) {
      var { data: { user } } = await sb.auth.getUser();
      if (user) {
        var { data, error } = await sb.from('supplement_tracking')
          .select('*')
          .eq('user_id', user.id);
        if (!error && data) {
          data.forEach(function(row) { userTracking[row.supplement_key] = row; });
        }
      }
    }
  } catch(e) {}

  var activeCount = Object.values(userTracking).filter(function(r){ return r.is_active; }).length;

  // Filtro ativo
  var currentFilter = window._suppFilter || 'all';
  var filters = [
    { key:'all',           label:'Todos' },
    { key:'atleta',        label:'Atleta' },
    { key:'longevidade',   label:'Longevidade' },
    { key:'rejuvenecimento',label:'Rejuvenecimento' },
    { key:'sono',          label:'Sono' },
    { key:'inflamação',    label:'Anti-inflamatório' },
    { key:'intestino',     label:'Intestino' }
  ];

  var filterHtml = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">';
  filters.forEach(function(f) {
    var active = currentFilter === f.key;
    filterHtml += '<button onclick="window._suppFilter=\'' + f.key + '\';renderSupplements();" '
      + 'style="padding:6px 12px;border-radius:20px;border:1px solid var(--border-color);cursor:pointer;font-size:12px;'
      + (active ? 'background:var(--color-primary,#6c63ff);color:#fff;border-color:var(--color-primary,#6c63ff);' : 'background:var(--bg-secondary);color:var(--text-primary);')
      + '">' + escHtml(f.label) + '</button>';
  });
  filterHtml += '</div>';

  // Filtrar catálogo
  var filtered = SUPPLEMENT_CATALOG.filter(function(s) {
    if (currentFilter === 'all') return true;
    return s.tags.indexOf(currentFilter) >= 0;
  });

  // Cards de suplementos
  var cardsHtml = filtered.map(function(s) {
    var track = userTracking[s.key] || {};
    var isActive = track.is_active === true;
    var ev = EVIDENCE_CONFIG[s.evidence] || EVIDENCE_CONFIG.LOW;
    return '<div class="card" id="supp-card-' + s.key + '" style="padding:14px;margin-bottom:10px;border-left:3px solid ' + (isActive ? 'var(--color-primary,#6c63ff)' : 'var(--border-color)') + ';">'
      + '<div style="display:flex;align-items:flex-start;gap:10px;">'
      + '<span style="font-size:22px;">' + s.emoji + '</span>'
      + '<div style="flex:1;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">'
      + '<strong style="font-size:14px;">' + escHtml(s.name) + '</strong>'
      + '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:' + ev.bg + ';color:' + ev.color + ';border:1px solid ' + ev.color + ';">' + ev.label + '</span>'
      + '</div>'
      + '<div style="font-size:12px;opacity:.7;margin:3px 0;">' + escHtml(s.desc) + '</div>'
      + '<div style="font-size:12px;opacity:.6;">📏 ' + escHtml(s.dose) + '</div>'
      + '<div style="margin-top:8px;display:flex;gap:8px;align-items:center;">'
      + '<button onclick="toggleSupplement(\'' + s.key + '\',' + (isActive ? 'false' : 'true') + ');" '
      + 'style="padding:6px 14px;border-radius:8px;border:none;cursor:pointer;font-size:12px;font-weight:600;'
      + (isActive ? 'background:#f443361a;color:#f44336;' : 'background:rgba(108,99,255,.10);color:var(--color-primary,#6c63ff);border:1px solid var(--color-primary,#6c63ff);')
      + '">' + (isActive ? '✓ Ativo — Desativar' : '+ Adicionar') + '</button>'
      + (track.custom_dose ? '<span style="font-size:11px;opacity:.6;">Dose: ' + escHtml(track.custom_dose) + '</span>' : '')
      + '</div>'
      + '</div></div></div>';
  }).join('');

  main.innerHTML = '<div class="view-container" style="max-width:520px;margin:0 auto;padding:16px;">'
    + '<h2 style="margin-bottom:4px;">💊 Suplementação Inteligente</h2>'
    + '<p style="font-size:13px;opacity:.6;margin-bottom:16px;">' + activeCount + ' suplementos ativos</p>'
    + filterHtml
    + cardsHtml
    + '<div style="margin-top:16px;">'
    + '<button id="supp-coach-btn" class="btn-secondary" style="width:100%;">🤖 Analisar stack com CoachIA</button>'
    + '</div>'
    + '</div>';

  // CoachIA
  var coachBtn = document.getElementById('supp-coach-btn');
  if (coachBtn) {
    coachBtn.addEventListener('click', function() {
      var activeSupps = SUPPLEMENT_CATALOG.filter(function(s) {
        return userTracking[s.key] && userTracking[s.key].is_active;
      }).map(function(s) { return { key: s.key, name: s.name, dose: (userTracking[s.key].custom_dose || s.dose) }; });
      try {
        localStorage.setItem('vitalia_coach_context_supplements', JSON.stringify({
          active_supplements: activeSupps,
          count: activeSupps.length
        }));
      } catch(e) {}
      navigate('coach');
    });
  }
}

// Toggle supplement (global para usar em onclick inline)
async function toggleSupplement(key, activate) {
  var card = document.getElementById('supp-card-' + key);
  var statusId = 'supp-status-' + key;
  var status = card ? card.querySelector('#' + statusId) : null;
  if (!status && card) {
    status = document.createElement('div');
    status.id = statusId;
    status.style.cssText = 'font-size:11px;margin-top:8px;min-height:16px;opacity:.85;';
    card.appendChild(status);
  }
  if (status) { status.style.color = 'var(--text-secondary)'; status.textContent = 'Salvando...'; }
  try {
    var suppAuth = await getVitaliaSupabaseUser('suplementacao');
    var sb = suppAuth.sb;
    var user = suppAuth.user;
    var { error } = await sb.from('supplement_tracking').upsert([{
      user_id:        user.id,
      supplement_key: key,
      is_active:      activate,
      updated_at:     new Date().toISOString()
    }], { onConflict: 'user_id,supplement_key' });
    if (error) throw error;
    if (status) { status.style.color = 'var(--color-success,#4caf50)'; status.textContent = activate ? 'Suplemento adicionado.' : 'Suplemento desativado.'; }
    renderSupplements();
  } catch(err) {
    if (status) {
      status.style.color = 'var(--color-danger,#f44)';
      status.textContent = 'Erro ao salvar: ' + (err.message || err);
    }
    reportProgressHealthError('Suplementação', err);
  }
}
