/* ═══════════════════════════════════════
   V230-D2 — MÓDULO SUPLEMENTAÇÃO (js/modules/supplements.js)
   Ex-bloco inline L5671–5812 do index.html (extração literal).
   Funções globais: renderSupplementsShell, renderSupplements, toggleSupplement.
═══════════════════════════════════════ */

var SUPPLEMENT_CATALOG = [{"key":"vitd3","evidence":"HIGH","tags":["longevidade","imunidade","ossos"],"emoji":"☀️"},{"key":"omega3","evidence":"HIGH","tags":["coração","inflamação","cérebro"],"emoji":"🐟"},{"key":"magnesium","evidence":"HIGH","tags":["sono","estresse","músculos"],"emoji":"🪨"},{"key":"creatine","evidence":"HIGH","tags":["atleta","músculo","força"],"emoji":"💪"},{"key":"b12","evidence":"HIGH","tags":["energia","neurológico","veganos"],"emoji":"⚡"},{"key":"zinc","evidence":"MEDIUM","tags":["imunidade","testosterona","pele"],"emoji":"🛡️"},{"key":"collagen","evidence":"MEDIUM","tags":["pele","articulações","rejuvenecimento"],"emoji":"✨"},{"key":"curcumin","evidence":"MEDIUM","tags":["inflamação","articulações","antioxidante"],"emoji":"🌿"},{"key":"probiotics","evidence":"MEDIUM","tags":["intestino","imunidade","humor"],"emoji":"🦠"},{"key":"ashwagandha","evidence":"MEDIUM","tags":["estresse","cortisol","sono"],"emoji":"🧘"},{"key":"coq10","evidence":"MEDIUM","tags":["longevidade","energia","coração"],"emoji":"⚙️"},{"key":"melatonin","evidence":"HIGH","tags":["sono","jet-lag","antioxidante"],"emoji":"🌙"},{"key":"nmn","evidence":"EMERGING","tags":["longevidade","NAD+","rejuvenecimento"],"emoji":"🔬"},{"key":"resveratrol","evidence":"EMERGING","tags":["longevidade","antioxidante","coração"],"emoji":"🍷"},{"key":"protein","evidence":"HIGH","tags":["atleta","músculo","recuperação"],"emoji":"🥛"}];
function localizedSupplementCatalog() {
  var copy = getLang();
  return SUPPLEMENT_CATALOG.map(function(item) { return Object.assign({}, item, { name: copy['supp_name_' + item.key], desc: copy['supp_desc_' + item.key], dose: copy.ui_supp_dose }); });
}

var EVIDENCE_CONFIG = {
  HIGH:     { label:'Alta evidência',      color:'#4caf50', bg:'#4caf5022' },
  MEDIUM:   { label:'Evidência moderada',  color:'#ff9800', bg:'#ff980022' },
  EMERGING: { label:'Evidência emergente', color:'#9c27b0', bg:'#9c27b022' },
  LOW:      { label:'Evidência limitada',  color:'#9e9e9e', bg:'#9e9e9e22' }
};

function renderSupplementsShell() {
  return ("<div class=\"screen-header\"><div class=\"screen-title\">" + getLang().ui_supp_title + "</div></div><div id=\"main-content\"></div>");
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
    { key:'all',           label:getLang().ui_all },
    { key:'atleta',        label:getLang().ui_athlete },
    { key:'longevidade',   label:getLang().ui_longevity },
    { key:'rejuvenecimento',label:'Rejuvenecimento' },
    { key:'sono',          label:getLang().ui_sleep },
    { key:'inflamação',    label:getLang().ui_inflammation },
    { key:'intestino',     label:getLang().ui_gut }
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
  var filtered = localizedSupplementCatalog().filter(function(s) {
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
      + '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:' + ev.bg + ';color:' + ev.color + ';border:1px solid ' + ev.color + ';">' + getLang()['ui_evidence_' + s.evidence] + '</span>'
      + '</div>'
      + '<div style="font-size:12px;opacity:.7;margin:3px 0;">' + escHtml(s.desc) + '</div>'
      + '<div style="font-size:12px;opacity:.6;">📏 ' + escHtml(s.dose) + '</div>'
      + '<div style="margin-top:8px;display:flex;gap:8px;align-items:center;">'
      + '<button onclick="toggleSupplement(\'' + s.key + '\',' + (isActive ? 'false' : 'true') + ');" '
      + 'style="padding:6px 14px;border-radius:8px;border:none;cursor:pointer;font-size:12px;font-weight:600;'
      + (isActive ? 'background:#f443361a;color:#f44336;' : 'background:rgba(108,99,255,.10);color:var(--color-primary,#6c63ff);border:1px solid var(--color-primary,#6c63ff);')
      + '">' + (isActive ? getLang().ui_supp_deactivate : getLang().ui_supp_add) + '</button>'
      + '<button class="btn-secondary" onclick="editSupplementDose(\'' + s.key + '\')" style="font-size:11px;padding:6px;">' + getLang().ui_supp_edit_dose + '</button>'
      + (track.custom_dose ? ("<span style=\"font-size:11px;opacity:.6;\">" + getLang().ui_dose) + escHtml(track.custom_dose) + '</span>' : '')
      + '</div>'
      + '</div></div></div>';
  }).join('');

  main.innerHTML = '<div class="view-container" style="max-width:520px;margin:0 auto;padding:16px;">'
    + ("<h2 style=\"margin-bottom:4px;\">" + getLang().ui_supp_title + "</h2>")
    + '<p style="font-size:13px;opacity:.6;margin-bottom:16px;">' + activeCount + ' ' + (getLang().ui_supp_active + "</p>")
    + filterHtml
    + cardsHtml
    + '<div style="margin-top:16px;">'
    + ("<button id=\"supp-coach-btn\" class=\"btn-secondary\" style=\"width:100%;\">" + getLang().ui_supp_coach + "</button>")
    + '</div>'
    + '</div>';

  // CoachIA
  var coachBtn = document.getElementById('supp-coach-btn');
  if (coachBtn) {
    coachBtn.addEventListener('click', function() {
      var activeSupps = localizedSupplementCatalog().filter(function(s) {
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
  if (status) { status.style.color = 'var(--text-secondary)'; status.textContent = getLang().ui_saving; }
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
    if (status) { status.style.color = 'var(--color-success,#4caf50)'; status.textContent = activate ? getLang().ui_supp_added : getLang().ui_supp_removed; }
    renderSupplements();
  } catch(err) {
    if (status) {
      status.style.color = 'var(--color-danger,#f44)';
      status.textContent = getLang().ui_save_error;
    }
    reportProgressHealthError('Suplementação', err);
  }
}

async function editSupplementDose(key) {
  if (!SUPPLEMENT_CATALOG.some(function(item){return item.key===key;})) return;
  try {
    var auth = await getVitaliaSupabaseUser('suplementacao');
    var current = await auth.sb.from('supplement_tracking').select('custom_dose').eq('user_id',auth.user.id).eq('supplement_key',key).maybeSingle();
    if (current.error) throw current.error;
    openModal(getLang().ui_supp_edit_dose, '<p style="font-size:12px;color:var(--text2);">'+escapeHTML(getLang().ui_supp_dose_help)+'</p><input id="supp-custom-dose" class="input" maxlength="120" value="'+escapeAttr(current.data?.custom_dose || '')+'"><button class="btn btn-primary btn-full" onclick="saveSupplementDose(\''+key+'\')">'+t('settings_save')+'</button>');
  } catch(error) { reportProgressHealthError('supplements', error); }
}
async function saveSupplementDose(key) {
  if (!SUPPLEMENT_CATALOG.some(function(item){return item.key===key;})) return;
  try {
    var auth = await getVitaliaSupabaseUser('suplementacao');
    var custom = String(document.getElementById('supp-custom-dose')?.value || '').trim().slice(0,120);
    var result = await auth.sb.from('supplement_tracking').upsert([{user_id:auth.user.id,supplement_key:key,custom_dose:custom || null,updated_at:new Date().toISOString()}],{onConflict:'user_id,supplement_key'});
    if(result.error)throw result.error;
    closeModal(); renderSupplements();
  } catch(error) { reportProgressHealthError('supplements', error); }
}
