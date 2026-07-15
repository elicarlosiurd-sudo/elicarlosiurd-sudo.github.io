/* ═══════════════════════════════════════
   V230-C — ERROS DE MÓDULO (js/core/errors.js)
   Caminho único de erro: console + Sentry + observabilidade.
   Adoção gradual: módulos migram para este helper nas fases V230-D.
   Não altera nenhum comportamento existente.
═══════════════════════════════════════ */

function showVitaliaModuleError(moduleId, err, userMessage) {
  var message = userMessage || 'Algo deu errado. Tente novamente.';
  try {
    console.error('[vitalia:' + moduleId + ']', err);
  } catch (_) {}
  try {
    if (window.Sentry && typeof window.Sentry.captureException === 'function') {
      window.Sentry.captureException(err, { tags: { vitalia_module: moduleId } });
    }
  } catch (_) {}
  try {
    if (typeof vitaliaLogEvent === 'function') {
      vitaliaLogEvent('error', 'module_error', moduleId, {
        message: err && err.message ? String(err.message).slice(0, 200) : String(err).slice(0, 200)
      });
    }
  } catch (_) {}
  return message;
}
