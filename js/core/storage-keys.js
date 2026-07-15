/* ═══════════════════════════════════════
   V230-C — STORAGE CENTRAL (js/core/storage-keys.js)
   Acesso seguro ao localStorage com JSON e fallback.
   Adoção gradual: módulos migram para estes helpers nas fases V230-D.
   Não altera nenhum comportamento existente.
═══════════════════════════════════════ */

function vitaliaStorageGet(key, fallback) {
  try {
    var raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

function vitaliaStorageGetRaw(key, fallback) {
  try {
    var raw = localStorage.getItem(key);
    return raw === null ? fallback : raw;
  } catch (err) {
    return fallback;
  }
}

function vitaliaStorageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    return false;
  }
}

function vitaliaStorageSetRaw(key, value) {
  try {
    localStorage.setItem(key, String(value));
    return true;
  } catch (err) {
    return false;
  }
}

function vitaliaStorageRemove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    return false;
  }
}
