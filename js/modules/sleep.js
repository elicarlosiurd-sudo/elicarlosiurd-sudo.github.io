/* ═══════════════════════════════════════
   V230-D1 — MÓDULO SONO (js/modules/sleep.js)
   Ex-bloco inline L5638–5836 do index.html (extração literal).
   Funções globais: renderSleepRecoveryShell, renderSleepRecovery.
═══════════════════════════════════════ */

function renderSleepRecoveryShell() {
  return '<div class="screen-header"><div class="screen-title">😴 Sono & Recuperação</div></div><div id="main-content"></div>';
}

async function renderSleepRecovery() {
  var t = getLang();
  var main = document.getElementById('main-content');
  if (!main) return;

  var history = [];
  var avgDuration = null;
  var avgQuality = null;

  try {
    var sb = getVitaliaSupabaseClient();
    if (sb) {
      var { data: { user } } = await sb.auth.getUser();
      if (user) {
        var { data, error } = await sb.from('sleep_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('sleep_date', { ascending: false })
          .limit(14);
        if (!error && data) {
          history = data;
          if (history.length > 0) {
            var durs = history.filter(function(r){ return r.duration_hours != null; });
            var quals = history.filter(function(r){ return r.quality != null; });
            if (durs.length > 0) avgDuration = (durs.reduce(function(s,r){ return s + parseFloat(r.duration_hours); }, 0) / durs.length).toFixed(1);
            if (quals.length > 0) avgQuality = (quals.reduce(function(s,r){ return s + r.quality; }, 0) / quals.length).toFixed(1);
          }
        }
      }
    }
  } catch(e) {}

  // Última entrada para pré-preencher
  var last = history[0] || null;

  // Médias
  var metricsHtml = '';
  if (avgDuration !== null || avgQuality !== null) {
    metricsHtml = '<div style="display:flex;gap:12px;margin-bottom:16px;">';
    if (avgDuration !== null) metricsHtml += '<div class="card" style="flex:1;text-align:center;padding:12px;"><div style="font-size:11px;opacity:.7;">' + escHtml(t.sleep_avg||'Média') + ' h</div><div style="font-size:24px;font-weight:700;">' + avgDuration + '</div></div>';
    if (avgQuality !== null) metricsHtml += '<div class="card" style="flex:1;text-align:center;padding:12px;"><div style="font-size:11px;opacity:.7;">' + escHtml(t.sleep_avg||'Média') + ' ★</div><div style="font-size:24px;font-weight:700;">' + avgQuality + '</div></div>';
    metricsHtml += '</div>';
  }

  // Histórico
  var historyHtml = '';
  if (history.length === 0) {
    historyHtml = '<p class="text-muted" style="text-align:center;padding:12px 0;">' + escHtml(t.sleep_no_history||'Nenhum registro ainda.') + '</p>';
  } else {
    var qualLabels = t.sleep_quality_labels || ['','Péssimo','Ruim','Regular','Bom','Ótimo'];
    historyHtml = '<table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr>'
      + '<th style="text-align:left;padding:4px 6px;border-bottom:1px solid var(--border-color)">Data</th>'
      + '<th style="text-align:right;padding:4px 6px;border-bottom:1px solid var(--border-color)">h</th>'
      + '<th style="text-align:right;padding:4px 6px;border-bottom:1px solid var(--border-color)">★</th>'
      + '</tr></thead><tbody>';
    history.forEach(function(row) {
      var d = row.sleep_date || '—';
      var stars = row.quality ? '★'.repeat(row.quality) + '☆'.repeat(5 - row.quality) : '—';
      historyHtml += '<tr>'
        + '<td style="padding:4px 6px;">' + escHtml(String(d)) + '</td>'
        + '<td style="text-align:right;padding:4px 6px;">' + (row.duration_hours != null ? row.duration_hours : '—') + '</td>'
        + '<td style="text-align:right;padding:4px 6px;font-size:11px;">' + stars + '</td>'
        + '</tr>';
    });
    historyHtml += '</tbody></table>';
  }

  // Stars selector helper
  function starsHtml(selectedId, currentVal) {
    var html = '<div style="display:flex;gap:6px;margin-top:4px;">';
    for (var i = 1; i <= 5; i++) {
      html += '<label style="cursor:pointer;font-size:24px;">'
        + '<input type="radio" name="' + selectedId + '" value="' + i + '"'
        + (currentVal == i ? ' checked' : '')
        + ' style="display:none;">'
        + '<span class="star-label" data-val="' + i + '">☆</span>'
        + '</label>';
    }
    return html + '</div>';
  }

  main.innerHTML = '<div class="view-container" style="max-width:520px;margin:0 auto;padding:16px;">'
    + '<h2 style="margin-bottom:16px;">😴 ' + escHtml(t.sleep_title||'Sono & Recuperação') + '</h2>'
    + metricsHtml
    + '<form id="sleep-form" class="card" style="padding:16px;margin-bottom:20px;">'
    + '<div style="margin-bottom:10px;"><label style="font-size:13px;display:block;margin-bottom:4px;">' + escHtml(t.sleep_date||'Data') + '</label>'
    + '<input id="sl-date" type="date" value="' + (last && last.sleep_date ? last.sleep_date : new Date().toISOString().split("T")[0]) + '" style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);"></div>'
    + '<div style="display:flex;gap:12px;margin-bottom:10px;">'
    + '<div style="flex:1;"><label style="font-size:13px;display:block;margin-bottom:4px;">' + escHtml(t.sleep_bedtime||'Dormir') + '</label>'
    + '<input id="sl-bed" type="time" value="' + (last && last.bedtime ? last.bedtime.substring(0,5) : '') + '" style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);"></div>'
    + '<div style="flex:1;"><label style="font-size:13px;display:block;margin-bottom:4px;">' + escHtml(t.sleep_wake||'Acordar') + '</label>'
    + '<input id="sl-wake" type="time" value="' + (last && last.wake_time ? last.wake_time.substring(0,5) : '') + '" style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);"></div>'
    + '</div>'
    + '<div style="margin-bottom:10px;"><label style="font-size:13px;display:block;margin-bottom:4px;">' + escHtml(t.sleep_quality||'Qualidade') + '</label>'
    + starsHtml('sl-quality', last && last.quality ? last.quality : 0)
    + '</div>'
    + '<div style="margin-bottom:10px;"><label style="font-size:13px;display:block;margin-bottom:4px;">' + escHtml(t.sleep_notes||'Observações') + '</label>'
    + '<textarea id="sl-notes" rows="2" style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);resize:vertical;">' + escHtml(last && last.notes ? last.notes : '') + '</textarea></div>'
    + '<button type="submit" class="btn-primary" style="width:100%;margin-top:4px;">' + escHtml(t.sleep_save||'Salvar') + '</button>'
    + '<div id="sl-status" style="text-align:center;margin-top:8px;font-size:13px;min-height:20px;"></div>'
    + '</form>'
    + '<h3 style="margin-bottom:10px;">' + escHtml(t.sleep_history||'Últimos 14 dias') + '</h3>'
    + '<div class="card" style="padding:12px;margin-bottom:16px;overflow-x:auto;">' + historyHtml + '</div>'
    + '<button id="sl-coach-btn" class="btn-secondary" style="width:100%;">' + escHtml(t.sleep_ask_coach||'Analisar com CoachIA') + '</button>'
    + '</div>';

  // Stars interaction
  var starLabels = main.querySelectorAll('.star-label');
  starLabels.forEach(function(span) {
    span.parentElement.addEventListener('change', function() {
      var val = parseInt(this.querySelector('input').value);
      starLabels.forEach(function(s) {
        s.textContent = parseInt(s.getAttribute('data-val')) <= val ? '★' : '☆';
      });
    });
    // Init visual
    var radioInput = span.parentElement.querySelector('input');
    if (radioInput && radioInput.checked) {
      var val2 = parseInt(radioInput.value);
      starLabels.forEach(function(s) {
        s.textContent = parseInt(s.getAttribute('data-val')) <= val2 ? '★' : '☆';
      });
    }
  });

  // Submit
  var form = document.getElementById('sleep-form');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      var status = document.getElementById('sl-status');
      var t2 = getLang();
      try {
        var sleepAuth = await getVitaliaSupabaseUser('sono');
        var sb2 = sleepAuth.sb;
        var u2 = sleepAuth.user;

        var bedVal  = document.getElementById('sl-bed').value  || null;
        var wakeVal = document.getElementById('sl-wake').value || null;
        var durHours = null;
        if (bedVal && wakeVal) {
          var bedMin  = parseInt(bedVal.split(':')[0])*60  + parseInt(bedVal.split(':')[1]);
          var wakeMin = parseInt(wakeVal.split(':')[0])*60 + parseInt(wakeVal.split(':')[1]);
          var diff = wakeMin - bedMin;
          if (diff < 0) diff += 1440; // atravessou meia-noite
          durHours = Math.round(diff / 60 * 100) / 100;
        }

        var qualInput = form.querySelector('input[name="sl-quality"]:checked');
        var qual = qualInput ? parseInt(qualInput.value) : null;

        var payload = {
          user_id:        u2.id,
          sleep_date:     document.getElementById('sl-date').value || new Date().toISOString().split('T')[0],
          bedtime:        bedVal,
          wake_time:      wakeVal,
          duration_hours: durHours,
          quality:        qual,
          notes:          (document.getElementById('sl-notes').value || '').trim() || null
        };

        var { error: insErr } = await sb2.from('sleep_logs').insert([payload]);
        if (insErr) throw insErr;

        if (status) { status.style.color = 'var(--color-success,#4caf50)'; status.textContent = t2.sleep_saved || 'Registro salvo!'; }

        if (typeof capturePostHogEvent === 'function') {
          capturePostHogEvent('sleep_log_saved', { has_duration: durHours != null, quality: qual });
        }

        setTimeout(function() { renderSleepRecovery(); }, 900);
      } catch(err) {
        if (status) { status.style.color = 'var(--color-danger,#f44)'; status.textContent = 'Erro: ' + (err.message || err); }
      }
    });
  }

  // Botão CoachIA
  var coachBtn = document.getElementById('sl-coach-btn');
  if (coachBtn) {
    coachBtn.addEventListener('click', function() {
      if (history.length > 0) {
        try {
          localStorage.setItem('vitalia_coach_context_sleep', JSON.stringify({
            avg_duration_hours: avgDuration,
            avg_quality: avgQuality,
            last_entry: history[0],
            entries_count: history.length
          }));
        } catch(e) {}
      }
      navigate('coach');
    });
  }
}
