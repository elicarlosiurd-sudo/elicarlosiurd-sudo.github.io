/* ═══════════════════════════════════════
   V230-D3 — MÓDULO NOTIFICATIONS (js/modules/notifications.js)
   Ex-bloco inline do index.html (extração literal).
═══════════════════════════════════════ */

function renderNotificationsInboxShell() {
  return '<div class="screen-header"><div class="screen-title">🔔 Notificações do Coach</div></div><div id="main-content"></div>';
}

async function renderNotificationsInbox() {
  var main = document.getElementById('main-content');
  if (!main) return;

  var notifications = [];
  var unreadCount = 0;

  try {
    var sb = getVitaliaSupabaseClient();
    if (sb) {
      var { data: { user } } = await sb.auth.getUser();
      if (user) {
        var { data, error } = await sb.from('coach_notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);
        if (!error && data) {
          notifications = data;
          unreadCount = data.filter(function(n){ return !n.is_read; }).length;
        }
      }
    }
  } catch(e) {}

  var emptyHtml = notifications.length === 0
    ? '<div style="text-align:center;padding:32px;opacity:.5;"><div style="font-size:40px;">🔔</div><div style="margin-top:8px;">Nenhuma notificação ainda</div></div>'
    : '';

  var listHtml = notifications.map(function(n) {
    var date = n.created_at ? new Date(n.created_at).toLocaleDateString() : '';
    return '<div class="card" style="padding:14px;margin-bottom:8px;opacity:' + (n.is_read ? '.6' : '1') + ';border-left:3px solid ' + (n.is_read ? 'var(--border-color)' : 'var(--color-primary,#6c63ff)') + ';cursor:pointer;" '
      + 'onclick="markNotificationRead(\'' + n.id + '\',this)">'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-start;">'
      + '<strong style="font-size:13px;">' + escHtml(n.title) + '</strong>'
      + '<span style="font-size:11px;opacity:.5;white-space:nowrap;margin-left:8px;">' + escHtml(date) + '</span>'
      + '</div>'
      + '<div style="font-size:13px;margin-top:4px;opacity:.8;">' + escHtml(n.body) + '</div>'
      + (!n.is_read ? '<div style="font-size:11px;color:var(--color-primary,#6c63ff);margin-top:4px;">Toque para marcar como lida</div>' : '')
      + '</div>';
  }).join('');

  main.innerHTML = '<div class="view-container" style="max-width:520px;margin:0 auto;padding:16px;">'
    + '<h2 style="margin-bottom:4px;">🔔 Notificações do Coach</h2>'
    + '<p style="font-size:13px;opacity:.6;margin-bottom:16px;">' + (unreadCount > 0 ? unreadCount + ' não lida(s)' : 'Todas lidas') + '</p>'
    + emptyHtml + listHtml
    + '</div>';
}

// Marcar como lida (global para onclick inline)
function markNotificationRead(id, el) {
  var sb = getVitaliaSupabaseClient();
  if (!sb || !id) return;
  sb.from('coach_notifications').update({ is_read: true }).eq('id', id).then(function(result) {
    if (result && result.error) { reportProgressHealthError('Notificações do Coach', result.error); return; }
    if (el) {
      el.style.opacity = '.6';
      el.style.borderLeftColor = 'var(--border-color)';
      var hint = el.querySelector('[style*="color:var(--color-primary"]');
      if (hint) hint.remove();
    }
  }).catch(function(err){ reportProgressHealthError('Notificações do Coach', err); });
}
