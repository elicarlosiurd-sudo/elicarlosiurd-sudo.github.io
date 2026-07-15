/* ═══════════════════════════════════════
   V230-D3 — MÓDULO WEARABLES (js/modules/wearables.js)
   Ex-bloco inline do index.html (extração literal).
═══════════════════════════════════════ */

var WEARABLE_METRICS = [
  { key:'steps',           label:'Passos',          emoji:'👣', unit:'',     goal:10000, color:'#4caf50' },
  { key:'resting_hr',      label:'FC Repouso',      emoji:'❤️', unit:'bpm',  goal:null,  color:'#f44336' },
  { key:'hrv_ms',          label:'HRV',             emoji:'📈', unit:'ms',   goal:null,  color:'#9c27b0' },
  { key:'spo2_pct',        label:'SpO₂',            emoji:'🫁', unit:'%',    goal:98,    color:'#2196f3' },
  { key:'active_minutes',  label:'Min. Ativos',     emoji:'🏃', unit:'min',  goal:30,    color:'#ff9800' },
  { key:'active_calories', label:'Cal. Ativas',     emoji:'🔥', unit:'kcal', goal:500,   color:'#ff5722' },
  { key:'sleep_score',     label:'Score de Sono',   emoji:'😴', unit:'/100', goal:85,    color:'#673ab7' }
];

var WEARABLE_PROVIDERS = [
  { key:'fitbit',       label:'Fitbit',       emoji:'⌚', color:'#00B0B9', status:'available', method:'oauth2' },
  { key:'oura',         label:'Oura Ring',    emoji:'💍', color:'#9c27b0', status:'available', method:'api_key' },
  { key:'garmin',       label:'Garmin',       emoji:'🏔️', color:'#007DC5', status:'soon',      method:'oauth2' },
  { key:'apple_health', label:'Apple Health', emoji:'🍎', color:'#ff2d55', status:'soon',      method:'export' }
];

function renderWearablesShell() {
  return '<div class="screen-header"><div class="screen-title">⌚ Wearables</div></div><div id="main-content"></div>';
}

async function renderWearables() {
  var main = document.getElementById('main-content');
  if (!main) return;

  var today = new Date().toISOString().split('T')[0];
  var todayData = [];
  var weekData = [];
  var connectedProviders = [];

  try {
    var sb = getVitaliaSupabaseClient();
    if (sb) {
      var { data: { user } } = await sb.auth.getUser();
      if (user) {
        var sevenAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        var { data: wd } = await sb.from('wearable_data')
          .select('*').eq('user_id', user.id)
          .gte('data_date', sevenAgo).order('data_date', { ascending: false });
        if (wd) {
          weekData = wd;
          todayData = wd.filter(function(r){ return r.data_date === today; });
        }
        var { data: tokens } = await sb.from('wearable_tokens')
          .select('provider').eq('user_id', user.id);
        if (tokens) connectedProviders = tokens.map(function(t){ return t.provider; });
      }
    }
  } catch(e) {}

  var todayMerged = {};
  ['manual','oura','fitbit'].forEach(function(src) {
    var row = todayData.find(function(r){ return r.source === src; });
    if (row) {
      WEARABLE_METRICS.forEach(function(m) {
        if (row[m.key] != null) todayMerged[m.key] = { value: row[m.key], source: src };
      });
    }
  });

  var metricsHtml = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">'
    + WEARABLE_METRICS.map(function(m) {
        var d = todayMerged[m.key];
        var val = d ? d.value : null;
        var pct = (val && m.goal) ? Math.min(100, Math.round(val / m.goal * 100)) : null;
        var barColor = pct ? (pct >= 100 ? '#4caf50' : pct >= 60 ? m.color : '#9e9e9e') : m.color;
        return '<div class="card" style="padding:12px;">'
          + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">'
          + '<span style="font-size:11px;opacity:.6;">' + m.emoji + ' ' + m.label + '</span>'
          + (d ? '<span style="font-size:9px;opacity:.4;">' + escHtml(d.source) + '</span>' : '')
          + '</div>'
          + '<div style="font-size:22px;font-weight:700;color:' + (val ? m.color : 'var(--text-secondary)') + ';">'
          + (val != null ? val.toLocaleString() : '—') + '<span style="font-size:11px;font-weight:400;opacity:.7;margin-left:2px;">' + m.unit + '</span>'
          + '</div>'
          + (pct != null ? '<div style="background:var(--bg-secondary);border-radius:4px;height:4px;margin-top:6px;overflow:hidden;"><div style="width:' + pct + '%;height:100%;background:' + barColor + ';border-radius:4px;"></div></div>' : '')
          + '</div>';
      }).join('')
    + '</div>';

  var manualHtml = '<div class="card" style="padding:12px;margin-bottom:14px;">'
    + '<details><summary style="font-size:13px;font-weight:600;cursor:pointer;list-style:none;">✏️ Entrada manual hoje</summary>'
    + '<div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:8px;">'
    + WEARABLE_METRICS.map(function(m) {
        var d = todayMerged[m.key];
        var cur = d && d.source === 'manual' ? d.value : '';
        return '<div><label style="font-size:11px;opacity:.6;display:block;margin-bottom:3px;">' + m.emoji + ' ' + m.label + '</label>'
          + '<input id="wear-' + m.key + '" type="number" value="' + (cur||'') + '" placeholder="—" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid var(--border-color);background:var(--bg-secondary);color:var(--text-primary);font-size:13px;" /></div>';
      }).join('')
    + '</div>'
    + '<button onclick="saveWearableManual();" style="margin-top:10px;width:100%;padding:8px;border-radius:8px;border:none;background:var(--color-primary,#6c63ff);color:#fff;font-size:13px;font-weight:600;cursor:pointer;">Salvar dados manuais</button>'
    + '</details>'
    + '</div>';

  var providersHtml = '<div style="margin-bottom:14px;">'
    + '<div style="font-size:13px;font-weight:600;margin-bottom:8px;">🔗 Dispositivos & Apps</div>'
    + WEARABLE_PROVIDERS.map(function(p) {
        var isConnected = connectedProviders.indexOf(p.key) >= 0;
        var isSoon = p.status === 'soon';
        return '<div class="card" style="padding:12px;margin-bottom:8px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
          + '<span style="font-size:24px;">' + p.emoji + '</span>'
          + '<div style="flex:1;">'
          + '<div style="font-size:13px;font-weight:600;">' + p.label + '</div>'
          + '<div style="font-size:11px;opacity:.55;">'
          + (isSoon ? 'Em breve' : isConnected ? 'Conectado' : p.method === 'oauth2' ? 'OAuth2 disponível' : 'API Key')
          + '</div></div>'
          + (isSoon
              ? '<span style="font-size:11px;padding:3px 8px;border-radius:10px;background:var(--bg-secondary);color:var(--text-secondary);">Em breve</span>'
              : isConnected
                ? '<div style="display:flex;gap:6px;flex-direction:column;align-items:flex-end;">'
                  + '<span style="font-size:11px;padding:3px 8px;border-radius:10px;background:#4caf5020;color:#4caf50;border:0.5px solid #4caf5060;">✓ Conectado</span>'
                  + '<button onclick="syncWearableProvider(\'' + p.key + '\');" style="font-size:11px;padding:3px 10px;border-radius:8px;border:1px solid var(--color-primary,#6c63ff)44;background:rgba(108,99,255,.1);color:var(--color-primary,#6c63ff);cursor:pointer;">↻ Sincronizar</button>'
                  + '</div>'
                : '<button onclick="connectWearableProvider(\'' + p.key + '\');" style="padding:6px 12px;border-radius:8px;border:none;background:' + p.color + '22;color:' + p.color + ';border:1px solid ' + p.color + '44;font-size:12px;font-weight:600;cursor:pointer;">Conectar</button>')
          + (p.key === 'fitbit' ? '<div id="fitbit-connect-status" style="flex-basis:100%;"></div>' : '')
          + '</div>';
      }).join('')
    + '</div>';

  main.innerHTML = '<div class="view-container" style="max-width:520px;margin:0 auto;padding:16px;">'
    + '<h2 style="margin-bottom:4px;">⌚ Wearables</h2>'
    + '<p style="font-size:13px;opacity:.6;margin-bottom:14px;">Dados de hoje · Fitbit · Oura · Entrada manual</p>'
    + metricsHtml
    + manualHtml
    + providersHtml
    + '</div>';

  var urlParams = new URLSearchParams(window.location.search);
  var fitbitCode = urlParams.get('fitbit_code') || urlParams.get('code');
  if (fitbitCode) {
    window.history.replaceState({}, '', window.location.pathname);
    handleFitbitCallback(fitbitCode);
  }
}

function saveWearableManual() {
  var sb = getVitaliaSupabaseClient();
  if (!sb) { reportProgressHealthError('Wearables', 'Supabase não disponível'); return; }
  var today = new Date().toISOString().split('T')[0];
  var row = { source: 'manual', data_date: today };
  WEARABLE_METRICS.forEach(function(m) {
    var inp = document.getElementById('wear-' + m.key);
    if (inp && inp.value) row[m.key] = parseInt(inp.value, 10) || null;
  });
  sb.auth.getUser().then(function(res) {
    var user = res.data && res.data.user;
    if (!user) { reportProgressHealthError('Wearables', 'Usuário não autenticado'); return; }
    row.user_id = user.id;
    sb.from('wearable_data').upsert([row], { onConflict: 'user_id,data_date,source' })
      .then(function(result){
        if (result && result.error) { reportProgressHealthError('Wearables', result.error); return; }
        renderWearables();
      }).catch(function(err){ reportProgressHealthError('Wearables', err); });
  }).catch(function(err){ reportProgressHealthError('Wearables', err); });
}

function connectWearableProvider(provider) {
  if (provider === 'fitbit') {
    if (!window.VITALIA_FITBIT_CLIENT_ID && typeof CONFIG !== 'undefined' && CONFIG.FITBIT_CLIENT_ID) {
      window.VITALIA_FITBIT_CLIENT_ID = CONFIG.FITBIT_CLIENT_ID;
    }
    var clientId = window.VITALIA_FITBIT_CLIENT_ID || '';
    if (!clientId) {
      var fitbitStatusEl = document.getElementById('fitbit-connect-status');
      if (fitbitStatusEl) {
        fitbitStatusEl.innerHTML = '<div style="font-size:12px;color:var(--color-warning,#ff9800);margin-top:8px;">'
          + '⚠️ Fitbit requer Client ID. Configure em: <a href="https://dev.fitbit.com/apps/new" target="_blank" style="color:inherit;">dev.fitbit.com</a> e adicione ao CONFIG.</div>';
      }
      return;
    }
    var verifier = Array.from(crypto.getRandomValues(new Uint8Array(40)))
      .map(function(b){ return ('0' + b.toString(16)).slice(-2); }).join('').substring(0,128);
    try { localStorage.setItem('vitalia_fitbit_pkce_verifier', verifier); } catch(e) {}
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)).then(function(hash) {
      var challenge = btoa(String.fromCharCode.apply(null, new Uint8Array(hash)))
        .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
      var redirectUri = window.location.origin + window.location.pathname;
      var url = 'https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=' + encodeURIComponent(clientId)
        + '&scope=activity+heartrate+sleep+oxygen_saturation&code_challenge=' + encodeURIComponent(challenge)
        + '&code_challenge_method=S256&redirect_uri=' + encodeURIComponent(redirectUri);
      window.location.href = url;
    });
    return;
  }
  if (provider === 'oura') {
    var key = prompt('Cole sua Oura Ring Personal Access Token\n(obtenha em cloud.ouraring.com/personal-access-tokens):');
    if (!key || !key.trim()) return;
    var sb = getVitaliaSupabaseClient();
    if (!sb) return;
    sb.auth.getSession().then(function(res) {
      var session = res.data && res.data.session;
      if (!session) return;
      fetch((typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_URL ? CONFIG.SUPABASE_URL : '') + '/functions/v1/wearables-sync-v1', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + session.access_token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_key', provider: 'oura', api_key: key.trim() })
      }).then(function(r){ return r.json(); }).then(function(d){ if (d.ok) renderWearables(); });
    });
  }
}

function handleFitbitCallback(code) {
  var verifier = '';
  try { verifier = localStorage.getItem('vitalia_fitbit_pkce_verifier') || ''; } catch(e) {}
  if (!verifier) return;
  var sb = getVitaliaSupabaseClient();
  if (!sb) return;
  var redirectUri = window.location.origin + window.location.pathname;
  sb.auth.getSession().then(function(res) {
    var session = res.data && res.data.session;
    if (!session) return;
    fetch((typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_URL ? CONFIG.SUPABASE_URL : '') + '/functions/v1/wearables-sync-v1', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + session.access_token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'token_exchange', provider: 'fitbit', code: code, verifier: verifier, redirect_uri: redirectUri })
    }).then(function(r){ return r.json(); }).then(function(d){
      if (d.ok) {
        try { localStorage.removeItem('vitalia_fitbit_pkce_verifier'); } catch(e) {}
        syncWearableProvider('fitbit');
      }
    });
  });
}

function syncWearableProvider(provider) {
  var sb = getVitaliaSupabaseClient();
  if (!sb) return;
  sb.auth.getSession().then(function(res) {
    var session = res.data && res.data.session;
    if (!session) return;
    fetch((typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_URL ? CONFIG.SUPABASE_URL : '') + '/functions/v1/wearables-sync-v1', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + session.access_token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sync', provider: provider })
    }).then(function(r){ return r.json(); }).then(function(d){ if (d.ok) renderWearables(); });
  });
}
