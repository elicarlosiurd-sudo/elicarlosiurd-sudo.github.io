/* ═══════════════════════════════════════
   V230-D3 — MÓDULO LABS (js/modules/labs.js)
   Ex-bloco inline do index.html (extração literal).
═══════════════════════════════════════ */

function renderLabResultsShell() {
  return '<div class="screen-header"><div class="screen-title">🔬 Exames de Sangue</div></div><div id="main-content"></div>';
}

async function renderLabResults() {
  var main = document.getElementById('main-content');
  if (!main) return;
  var t = getLang();

  // Carregar histórico
  var history = [];
  try {
    var sb = getVitaliaSupabaseClient();
    if (sb) {
      var { data: { user } } = await sb.auth.getUser();
      if (user) {
        var { data } = await sb.from('lab_results')
          .select('id,analyzed_at,summary,flags,recommendations')
          .eq('user_id', user.id)
          .order('analyzed_at', { ascending: false })
          .limit(10);
        if (data) history = data;
      }
    }
  } catch(e) {}

  // Histórico HTML
  var histHtml = history.length === 0
    ? '<p style="text-align:center;padding:16px;opacity:.5;">Nenhum exame analisado ainda.</p>'
    : history.map(function(r) {
        var flags = Array.isArray(r.flags) ? r.flags : [];
        var highFlags = flags.filter(function(f){ return f.severity === 'high'; });
        var d = r.analyzed_at ? new Date(r.analyzed_at).toLocaleDateString() : '';
        return '<div class="card" style="padding:12px;margin-bottom:8px;">'
          + '<div style="display:flex;justify-content:space-between;align-items:center;">'
          + '<span style="font-size:13px;font-weight:600;">' + escHtml(d) + '</span>'
          + (highFlags.length > 0 ? '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:#f443361a;color:#f44336;border:1px solid #f44336;">⚠️ ' + highFlags.length + ' alerta(s)</span>' : '<span style="font-size:11px;color:#4caf50;">✓ Sem alertas críticos</span>')
          + '</div>'
          + '<div style="font-size:12px;opacity:.7;margin-top:4px;">' + escHtml((r.summary || '').substring(0, 120)) + (r.summary && r.summary.length > 120 ? '…' : '') + '</div>'
          + '</div>';
      }).join('');

  main.innerHTML = '<div class="view-container" style="max-width:520px;margin:0 auto;padding:16px;">'
    + '<h2 style="margin-bottom:4px;">🔬 Exames de Sangue</h2>'
    + '<p style="font-size:13px;opacity:.6;margin-bottom:16px;">Tire uma foto do seu exame para análise por IA</p>'
    + '<div class="card" style="padding:16px;margin-bottom:20px;">'
    + '<div id="lab-upload-area" style="border:2px dashed var(--border-color);border-radius:12px;padding:24px;text-align:center;cursor:pointer;" onclick="document.getElementById(\'lab-file-input\').click();">'
    + '<div style="font-size:36px;">📋</div>'
    + '<div style="margin-top:8px;font-size:14px;font-weight:600;">Selecionar foto do exame</div>'
    + '<div style="font-size:12px;opacity:.6;margin-top:4px;">JPG, PNG ou PDF • Máx 10MB</div>'
    + '</div>'
    + '<input id="lab-file-input" type="file" accept="image/*,application/pdf" style="display:none;" onchange="handleLabFileSelect(this)">'
    + '<div id="lab-preview" style="display:none;margin-top:12px;text-align:center;"></div>'
    + '<button id="lab-analyze-btn" class="btn-primary" style="width:100%;margin-top:12px;display:none;">🔬 Analisar exame</button>'
    + '<div id="lab-status" style="text-align:center;margin-top:8px;font-size:13px;min-height:20px;"></div>'
    + '</div>'
    + '<div id="lab-result-card" style="display:none;"></div>'
    + '<h3 style="margin-bottom:10px;">Histórico</h3>'
    + '<div class="card" style="padding:12px;">' + histHtml + '</div>'
    + '<div style="margin-top:12px;padding:10px;background:#ff980011;border:1px solid #ff9800;border-radius:8px;font-size:12px;opacity:.8;">⚠️ Esta análise é informativa. Sempre consulte seu médico para diagnóstico e tratamento.</div>'
    + '</div>';
}

function handleLabFileSelect(input) {
  var file = input.files && input.files[0];
  if (!file) return;
  var preview = document.getElementById('lab-preview');
  var btn = document.getElementById('lab-analyze-btn');
  if (preview && file.type.startsWith('image/')) {
    var reader = new FileReader();
    reader.onload = function(e) {
      preview.style.display = 'block';
      preview.innerHTML = '<img src="' + e.target.result + '" style="max-width:100%;max-height:200px;border-radius:8px;object-fit:contain;">';
      window._labImageData = { base64: e.target.result.split(',')[1], mime: file.type };
      if (btn) btn.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else if (file.type === 'application/pdf') {
    preview.style.display = 'block';
    preview.innerHTML = '<div style="padding:12px;background:var(--bg-secondary);border-radius:8px;">📄 ' + escHtml(file.name) + '</div>';
    if (btn) btn.style.display = 'block';
    window._labImageData = null; // PDF: não suportado nesta versão
  }
}

document.addEventListener('click', function(e) {
  if (e.target && e.target.id === 'lab-analyze-btn') {
    analyzeLabImage();
  }
});

async function analyzeLabImage() {
  var status = document.getElementById('lab-status');
  var btn = document.getElementById('lab-analyze-btn');
  var resultCard = document.getElementById('lab-result-card');

  if (!window._labImageData) {
    if (status) status.textContent = 'Apenas imagens são suportadas nesta versão (não PDF).';
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = '⏳ Analisando…'; }
  if (status) { status.style.color = 'var(--text-secondary)'; status.textContent = 'Enviando para análise…'; }

  try {
    var sb = getVitaliaSupabaseClient();
    if (!sb) throw new Error('Supabase não disponível');
    var { data: { session } } = await sb.auth.getSession();
    if (!session) throw new Error('Não autenticado');

    var supabaseUrl = (typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : ((window.CONFIG && window.CONFIG.SUPABASE_URL) || ''));
    var fnUrl = supabaseUrl.replace(/\/$/, '') + '/functions/v1/lab-interpreter-v1';

    var res = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + session.access_token
      },
      body: JSON.stringify({
        image_base64: window._labImageData.base64,
        mime_type: window._labImageData.mime
      })
    });

    var data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Erro na análise');

    var result = data.result;

    // Renderizar resultado
    var flagsHtml = '';
    if (result.flags && result.flags.length > 0) {
      flagsHtml = '<div style="margin-top:12px;"><strong style="font-size:13px;">⚠️ Alertas:</strong>'
        + result.flags.map(function(f) {
            var color = f.severity === 'high' ? '#f44336' : f.severity === 'medium' ? '#ff9800' : '#9e9e9e';
            return '<div style="margin-top:6px;padding:8px 10px;border-left:3px solid ' + color + ';background:' + color + '11;border-radius:0 6px 6px 0;font-size:12px;"><strong>' + escHtml(f.marker) + '</strong><br>' + escHtml(f.concern) + '</div>';
          }).join('')
        + '</div>';
    }

    var recHtml = '';
    if (result.recommendations && result.recommendations.length > 0) {
      recHtml = '<div style="margin-top:12px;"><strong style="font-size:13px;">💡 Recomendações:</strong>'
        + result.recommendations.map(function(r) {
            return '<div style="margin-top:6px;padding:6px 10px;border-left:3px solid var(--color-primary,#6c63ff);background:var(--color-primary,#6c63ff)11;font-size:12px;">' + escHtml(r) + '</div>';
          }).join('')
        + '</div>';
    }

    if (resultCard) {
      resultCard.style.display = 'block';
      resultCard.innerHTML = '<div class="card" style="padding:16px;margin-bottom:16px;border-left:3px solid var(--color-primary,#6c63ff);">'
        + '<strong style="font-size:14px;">📊 Resultado da análise</strong>'
        + '<p style="font-size:13px;margin-top:8px;">' + escHtml(result.summary || '') + '</p>'
        + flagsHtml + recHtml
        + (result.disclaimer ? '<div style="margin-top:12px;font-size:11px;opacity:.6;">' + escHtml(result.disclaimer) + '</div>' : '')
        + '</div>';
    }

    if (status) { status.style.color = 'var(--color-success,#4caf50)'; status.textContent = 'Análise concluída e salva!'; }
    if (typeof capturePostHogEvent === 'function') {
      capturePostHogEvent('lab_result_analyzed', { flags_count: (result.flags || []).length });
    }

  } catch(err) {
    if (status) { status.style.color = 'var(--color-danger,#f44)'; status.textContent = 'Erro: ' + (err.message || err); }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🔬 Analisar exame'; }
  }
}
