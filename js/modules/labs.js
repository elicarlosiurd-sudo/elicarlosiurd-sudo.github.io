/* ═══════════════════════════════════════
   V230-D3 — MÓDULO LABS (js/modules/labs.js)
   Ex-bloco inline do index.html (extração literal).
═══════════════════════════════════════ */

function renderLabResultsShell() {
  return '<div class="screen-header"><div class="screen-title">🔬 ' + t('lab_title') + '</div></div><div id="main-content"></div>';
}

async function renderLabResults() {
  var main = document.getElementById('main-content');
  if (!main) return;


  // Carregar histórico
  var history = [];
  try {
    var sb = getVitaliaSupabaseClient();
    if (sb) {
      var { data: { user } } = await sb.auth.getUser();
      if (user) {
        var { data } = await sb.from('lab_results')
          .select('id,analyzed_at,summary,flags,recommendations,raw_response')
          .eq('user_id', user.id)
          .order('analyzed_at', { ascending: false })
          .limit(10);
        if (data) history = data;
      }
    }
  } catch(e) {}

  // ' + t('lab_history') + ' HTML
  var histHtml = history.length === 0
    ? '<p style="text-align:center;padding:16px;opacity:.5;">' + t('lab_empty') + '</p>'
    : history.map(function(r) {
        var flags = Array.isArray(r.flags) ? r.flags : [];
        var highFlags = flags.filter(function(f){ return f.severity === 'high'; });
        var d = r.analyzed_at ? new Date(r.analyzed_at).toLocaleDateString(localeForLang(APP.lang)) : '';
        return '<div class="card" style="padding:12px;margin-bottom:8px;">'
          + '<div style="display:flex;justify-content:space-between;align-items:center;">'
          + '<span style="font-size:13px;font-weight:600;">' + escHtml(d) + '</span>'
          + (highFlags.length > 0 ? '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:#f443361a;color:#f44336;border:1px solid #f44336;">⚠️ ' + highFlags.length + ' ' + t('lab_flag_count') + '</span>' : '<span style="font-size:11px;color:#4caf50;">✓ ' + t('lab_no_flags') + '</span>')
          + '</div>'
          + '<div style="font-size:12px;opacity:.7;margin-top:4px;">' + escHtml(((r.raw_response?.lang === APP.lang || (APP.lang === 'pt' && !r.raw_response?.lang)) ? r.summary || '' : t('lab_history_language')).substring(0, 120)) + (r.summary && r.summary.length > 120 ? '…' : '') + '</div>'
          + '</div>';
      }).join('');

  main.innerHTML = '<div class="view-container" style="max-width:520px;margin:0 auto;padding:16px;">'
    + '<h2 style="margin-bottom:4px;">🔬 ' + t('lab_title') + '</h2>'
    + '<p style="font-size:13px;opacity:.6;margin-bottom:16px;">' + t('lab_intro') + '</p>'
    + '<div class="card" style="padding:16px;margin-bottom:20px;">'
    + '<div id="lab-upload-area" style="border:2px dashed var(--border-color);border-radius:12px;padding:24px;text-align:center;cursor:pointer;" onclick="document.getElementById(\'lab-file-input\').click();">'
    + '<div style="font-size:36px;">📋</div>'
    + '<div style="margin-top:8px;font-size:14px;font-weight:600;">' + t('lab_select') + '</div>'
    + '<div style="font-size:12px;opacity:.6;margin-top:4px;">' + t('lab_formats') + '</div>'
    + '</div>'
    + '<input id="lab-file-input" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" style="display:none;" onchange="handleLabFileSelect(this)">'
    + '<div id="lab-preview" style="display:none;margin-top:12px;text-align:center;"></div>'
    + '<button id="lab-analyze-btn" class="btn-primary" style="width:100%;margin-top:12px;display:none;">🔬 ' + t('lab_analyze') + '</button>'
    + '<div id="lab-status" role="status" aria-live="polite" style="text-align:center;margin-top:8px;font-size:13px;min-height:20px;"></div>'
    + '</div>'
    + '<div id="lab-result-card" style="display:none;"></div>'
    + '<h3 style="margin-bottom:10px;">' + t('lab_history') + '</h3>'
    + '<div class="card" style="padding:12px;">' + histHtml + '</div>'
    + '<div style="margin-top:12px;padding:10px;background:#ff980011;border:1px solid #ff9800;border-radius:8px;font-size:12px;opacity:.8;">⚠️ ' + t('lab_disclaimer') + '</div>'
    + '</div>';
}

function handleLabFileSelect(input) {
  var file = input.files && input.files[0];
  var selection = (window._labFileSelection || 0) + 1;
  window._labFileSelection = selection;
  window._labImageData = null;
  var preview = document.getElementById('lab-preview');
  var btn = document.getElementById('lab-analyze-btn');
  if (preview) { preview.style.display = 'none'; preview.innerHTML = ''; }
  if (btn) btn.style.display = 'none';
  if (!file) return;
  if (!['application/pdf','image/jpeg','image/png','image/webp'].includes(file.type) || !file.size || file.size > 10*1024*1024) { toast(t('lab_invalid'), 'error'); return; }
  var reader = new FileReader();
  reader.onload = function(e) {
    if (window._labFileSelection !== selection) return;
    var dataUrl = e.target.result;
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:' + file.type + ';base64,')) { toast(t('lab_invalid'), 'error'); return; }
    window._labImageData = { base64: dataUrl.split(',')[1], mime: file.type };
    if (preview) {
      preview.style.display = 'block';
      preview.innerHTML = file.type === 'application/pdf'
        ? '<div style="padding:12px;background:var(--bg-secondary);border-radius:8px;">📄 ' + escHtml(file.name) + '</div>'
        : '<img src="' + dataUrl + '" alt="' + escHtml(t('lab_select')) + '" style="max-width:100%;max-height:200px;border-radius:8px;object-fit:contain;">';
    }
    if (btn) btn.style.display = 'block';
  };
  reader.onerror = function() { if (window._labFileSelection === selection) toast(t('lab_invalid'), 'error'); };
  reader.readAsDataURL(file);
}

document.addEventListener('click', function(e) {
  if (e.target && e.target.id === 'lab-analyze-btn') {
    analyzeLabImage();
  }
});

async function analyzeLabImage() {
  if (window._labAnalysisPending) return;
  var status = document.getElementById('lab-status');
  var btn = document.getElementById('lab-analyze-btn');
  var resultCard = document.getElementById('lab-result-card');

  if (!window._labImageData) {
    if (status) status.textContent = t('lab_invalid');
    return;
  }
  var selectedDocument = window._labImageData;
  window._labAnalysisPending = true;
  var controller = new AbortController();
  var timeout = setTimeout(function() { controller.abort(); }, 45000);

  if (btn) { btn.disabled = true; btn.textContent = '⏳ ' + t('lab_loading') + ''; }
  if (status) { status.style.color = 'var(--text-secondary)'; status.textContent = t('lab_sending'); }

  try {
    var sb = getVitaliaSupabaseClient();
    if (!sb) throw new Error(t('lab_unavailable'));
    var { data: { session } } = await sb.auth.getSession();
    if (!session) throw new Error(t('lab_auth'));

    var supabaseUrl = (typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : ((window.CONFIG && window.CONFIG.SUPABASE_URL) || ''));
    var fnUrl = supabaseUrl.replace(/\/$/, '') + '/functions/v1/lab-interpreter-v1';

    var res = await fetch(fnUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': APP.lang,
        'Authorization': 'Bearer ' + session.access_token
      },
      body: JSON.stringify({
        image_base64: selectedDocument.base64,
        mime_type: selectedDocument.mime,
        lang: APP.lang
      })
    });

    var data = await res.json();
    if (!res.ok || !data.ok) throw new Error(t(res.status === 401 ? 'lab_auth' : res.status === 429 ? 'lab_rate' : res.status === 400 || res.status === 413 ? 'lab_invalid' : 'lab_unavailable'));

    var result = data.result;

    // Renderizar resultado
    var flagsHtml = '';
    if (result.flags && result.flags.length > 0) {
      flagsHtml = '<div style="margin-top:12px;"><strong style="font-size:13px;">⚠️ ' + t('lab_flags') + '</strong>'
        + result.flags.map(function(f) {
            var color = f.severity === 'high' ? '#f44336' : f.severity === 'medium' ? '#ff9800' : '#9e9e9e';
            return '<div style="margin-top:6px;padding:8px 10px;border-left:3px solid ' + color + ';background:' + color + '11;border-radius:0 6px 6px 0;font-size:12px;"><strong>' + escHtml(f.marker) + '</strong><br>' + escHtml(f.concern) + '</div>';
          }).join('')
        + '</div>';
    }

    var recHtml = '';
    if (result.recommendations && result.recommendations.length > 0) {
      recHtml = '<div style="margin-top:12px;"><strong style="font-size:13px;">💡 ' + t('lab_recommendations') + '</strong>'
        + result.recommendations.map(function(r) {
            return '<div style="margin-top:6px;padding:6px 10px;border-left:3px solid var(--color-primary,#6c63ff);background:var(--color-primary,#6c63ff)11;font-size:12px;">' + escHtml(r) + '</div>';
          }).join('')
        + '</div>';
    }

    if (resultCard) {
      resultCard.style.display = 'block';
      resultCard.innerHTML = '<div class="card" style="padding:16px;margin-bottom:16px;border-left:3px solid var(--color-primary,#6c63ff);">'
        + '<strong style="font-size:14px;">📊 ' + t('lab_result') + '</strong>'
        + '<p style="font-size:13px;margin-top:8px;">' + escHtml(result.summary || '') + '</p>'
        + flagsHtml + recHtml
        + (result.disclaimer ? '<div style="margin-top:12px;font-size:11px;opacity:.6;">' + escHtml(result.disclaimer) + '</div>' : '')
        + '</div>';
    }

    if (status) { status.style.color = 'var(--color-success,#4caf50)'; status.textContent = t(data.fallback ? 'lab_fallback' : data.saved ? 'lab_saved' : 'lab_not_saved'); }
    if (typeof capturePostHogEvent === 'function') {
      capturePostHogEvent('lab_result_analyzed', { flags_count: (result.flags || []).length });
    }

  } catch(err) {
    if (status) { status.style.color = 'var(--color-danger,#f44)'; status.textContent = [t('lab_auth'), t('lab_unavailable'), t('lab_rate'), t('lab_invalid')].includes(err.message) ? err.message : t('lab_unavailable'); }
  } finally {
    clearTimeout(timeout);
    window._labAnalysisPending = false;
    if (btn) { btn.disabled = false; btn.textContent = '🔬 ' + t('lab_analyze') + ''; }
  }
}
