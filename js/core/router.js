/* ═══════════════════════════════════════
   V230-E2 — js/core/router.js
   Ex-bloco principal do index.html L2116–2297 (extração literal, ordem preservada).
   Conteúdo: APP NAVIGATION (navigate + mapa de telas)
═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   APP NAVIGATION
═══════════════════════════════════════ */
const TABS = [
  {id:'home',icon:'🏠',labelKey:'nav',navIdx:0},
  {id:'nutrition',icon:'📸',labelKey:'nav',navIdx:1},
  {id:'recipes',icon:'🍴',labelKey:'nav',navIdx:2},
  {id:'hydration',icon:'💧',labelKey:'nav',navIdx:3},
  {id:'more',icon:'···',labelKey:'nav',navIdx:4},
];

const MORE_TABS = ['fasting','scanner','coach','bodytwin','progress','achievements','shopping','settings'];

function vitaliaIcon(name, cls) {
  const icons = {
    home:'<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
    nutrition:'<path d="M4 7h16"/><path d="M5 7a7 7 0 0 1 14 0"/><path d="M6 15h12"/><path d="M8 20h8"/>',
    recipes:'<path d="M4 3v18"/><path d="M8 3v18"/><path d="M4 8h4"/><path d="M15 3v7a3 3 0 0 0 6 0V3"/><path d="M18 13v8"/>',
    hydration:'<path d="M12 2s7 7.1 7 12a7 7 0 0 1-14 0c0-4.9 7-12 7-12Z"/><path d="M9.5 15.5c.7 1.2 1.7 1.8 3 1.8"/>',
    more:'<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    coach:'<rect x="5" y="7" width="14" height="11" rx="3"/><path d="M12 3v4"/><path d="M8.5 12h.01"/><path d="M15.5 12h.01"/><path d="M9 16h6"/><path d="M3 11v3"/><path d="M21 11v3"/>',
    bodytwin:'<path d="M12 3v3"/><circle cx="12" cy="7" r="2"/><path d="M8 11h8"/><path d="M12 9v6"/><path d="m8 11-3 5"/><path d="m16 11 3 5"/><path d="m12 15-4 6"/><path d="m12 15 4 6"/><circle cx="5" cy="16" r="1"/><circle cx="19" cy="16" r="1"/><circle cx="8" cy="21" r="1"/><circle cx="16" cy="21" r="1"/>',
    fasting:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2"/><path d="M9 2h6"/>',
    scanner:'<path d="M4 7V5a1 1 0 0 1 1-1h2"/><path d="M17 4h2a1 1 0 0 1 1 1v2"/><path d="M20 17v2a1 1 0 0 1-1 1h-2"/><path d="M7 20H5a1 1 0 0 1-1-1v-2"/><path d="M7 12h10"/><path d="M9 9h6"/><path d="M10 15h4"/>',
    progress:'<path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 3-3 3 2 5-7"/>',
    achievements:'<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M5 6H3a3 3 0 0 0 4 3"/><path d="M19 6h2a3 3 0 0 1-4 3"/>',
    shopping:'<circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M2 3h3l2.4 12.2a2 2 0 0 0 2 1.8h7.7a2 2 0 0 0 2-1.6L21 8H7"/>',
    analytics:'<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-5"/><path d="M12 16V8"/><path d="M16 16v-3"/>',
    community:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    telegram:'<path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/>',
    integrations:'<path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L11 4.93"/><path d="M14 11a5 5 0 0 0-7.07 0L4.81 13.12a5 5 0 0 0 7.07 7.07L13 19.07"/>',
    premium:'<path d="m12 3 8 6-8 12L4 9l8-6Z"/><path d="M4 9h16"/><path d="m9 9 3 12 3-12"/><path d="m9 9 3-6 3 6"/>',
    settings:'<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .92V20a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-.92 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.92-1H4a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 .92-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.92V4a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 .92 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.38.15.7.47.92 1H20a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-.51 1Z"/>',
    profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    apple:'<path d="M12 6c1.5-2.2 3.5-2.5 5-2.5-.2 2-1.2 3.6-3.2 4.4"/><path d="M12 7c-4.8-3-8 1-7 6.2C6 18.7 9 21 12 19.5c3 1.5 6-.8 7-6.3C20 8 16.8 4 12 7Z"/><path d="M12 7V4"/>',
    utensils:'<path d="M4 3v8"/><path d="M7 3v8"/><path d="M10 3v8"/><path d="M7 11v10"/><path d="M17 3v18"/><path d="M14 3h6v7a3 3 0 0 1-3 3"/>',
    sandwich:'<path d="M4 11 12 5l8 6"/><path d="M4 11h16v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7Z"/><path d="M8 15h.01"/><path d="M12 16h.01"/><path d="M16 15h.01"/>',
    moon:'<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z"/>'
  };
  const body = icons[name] || icons.more;
  return '<span class="vitalia-icon '+(cls||'')+'" aria-hidden="true"><svg viewBox="0 0 24 24">'+body+'</svg></span>';
}

function startApp() {
  document.getElementById('app').style.display = 'flex';
  document.getElementById('app').style.flexDirection = 'column';
  renderNav();
  navigate('home');

  try { updateWeatherHydration(false); } catch(e) {}
  try { scheduleNotifications(); } catch(e) {}
}

function renderNav() {
  const navLabels = t('nav');
  var navEl = document.getElementById('bottom-nav');
  navEl.className = 'bottom-nav ' + (APP.tab || 'home') + '-nav';
  navEl.innerHTML = TABS.map(tab =>
    `<button class="nav-item${APP.tab===tab.id||(['fasting','scanner','coach','progress','achievements','shopping','settings','analytics','community','integrations','premium','telegram'].includes(APP.tab)&&tab.id==='more')?' active':''}" onclick="navigate('${tab.id}')">
      <span class="nav-icon">${vitaliaIcon(tab.id)}</span>
      <span class="nav-label">${navLabels[tab.navIdx]}</span>
    </button>`
  ).join('');
  repairVisibleText(navEl);
}

function navigate(tab) {
  if (tab === 'coach' && !hasHealthAIConsent()) {
    showHealthConsentModal('coach');
    return;
  }
  if (tab === 'bodytwin' && !hasBodyTwinConsent()) {
    showBodyTwinConsentModal('bodytwin');
    return;
  }
  // Auto-reload recipes when language changes
  if (tab === 'recipes' && (!window._recipesLoaded || window._recipesLang !== APP.lang)) {
    try { loadExternalRecipes(); } catch(e) {}
  }
  // Track navigation history for back button
  if (APP.tab && APP.tab !== tab) {
    if (!APP.navHistory) APP.navHistory = [];
    // Don't push same tab twice
    if (APP.navHistory[APP.navHistory.length-1] !== APP.tab) {
      APP.navHistory.push(APP.tab);
      if (APP.navHistory.length > 10) APP.navHistory.shift();
    }
  }
  APP.tab = tab;
  if (tab !== 'fasting' && typeof FAST !== 'undefined' && FAST.interval) { clearInterval(FAST.interval); FAST.interval = null; }
  if (tab !== 'scanner' && typeof stopLiveScanner === 'function') stopLiveScanner();
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  var rootEl = document.getElementById('root') || document.body;
  if (tab === 'coach') { rootEl.classList.add('coach-open'); } else { rootEl.classList.remove('coach-open'); }
  renderNav();
  var body = document.getElementById('app-body');
  body.innerHTML = '';
  var screen = document.createElement('div');
  screen.className = 'screen active fade-in ' + tab + '-screen';
  var renderers = {
    home:renderHome, nutrition:renderNutrition, recipes:renderRecipes,
    hydration:renderHydration, more:renderMore, fasting:renderFasting,
    scanner:renderScanner, coach:renderCoach, bodytwin:renderBodyTwin, bodycomp:renderBodyCompositionShell, sleep:renderSleepRecoveryShell, supplements:renderSupplementsShell, notifications:renderNotificationsInboxShell, labresults:renderLabResultsShell, longevity:renderLongevityShell, mental:renderMentalHealthShell, microbiome:renderMicrobiomeShell, wearables:renderWearablesShell, athlete:renderAthleteShell, diagnostic:renderGoalDiagnosticsShell, progress:renderProgress,
    achievements:renderAchievements, shopping:renderShoppingShell, settings:renderSettings,
    analytics:renderAnalytics, community:renderCommunity, integrations:renderIntegrations,
    premium:renderPremiumScreen, telegram:renderTelegramSettings
  };
  if (renderers[tab]) {
    screen.innerHTML = renderers[tab]();
    body.appendChild(screen);
    if (tab === 'coach') attachCoach(screen);
    if (tab === 'bodytwin') setTimeout(function(){ window.dispatchEvent(new CustomEvent('vitalia:bodytwin:open')); }, 0);
    if (tab === 'bodycomp') setTimeout(function(){ renderBodyComposition(); }, 0);
    if (tab === 'sleep') setTimeout(function(){ renderSleepRecovery(); }, 0);
    if (tab === 'supplements') setTimeout(function(){ renderSupplements(); }, 0);
    if (tab === 'notifications') setTimeout(function(){ renderNotificationsInbox(); }, 0);
    if (tab === 'labresults') setTimeout(function(){ renderLabResults(); }, 0);
    if (tab === 'longevity') setTimeout(function(){ renderLongevity(); }, 0);
    if (tab === 'mental') setTimeout(function(){ renderMentalHealth(); }, 0);
    if (tab === 'microbiome') setTimeout(function(){ renderMicrobiome(); }, 0);
    if (tab === 'shopping') setTimeout(function(){ renderShoppingV200(); }, 0);
    if (tab === 'wearables') setTimeout(function(){ renderWearables(); }, 0);
    if (tab === 'athlete') setTimeout(function(){ renderAthlete(); }, 0);
    if (tab === 'diagnostic') setTimeout(function(){ renderGoalDiagnostics(); }, 0);
    if (tab === 'nutrition') attachNutrition(screen);
    if (tab === 'scanner' && SCAN.mode === 'live' && !SCAN.result) setTimeout(startLiveScanner, 400);
    // Inject back button on secondary screens (not main nav tabs)
    var primaryTabs = ['home','nutrition','recipes','hydration','more'];
    if (primaryTabs.indexOf(tab) === -1 && tab !== 'coach') {
      injectBackBtn(screen);
    }
    repairVisibleText(screen);
    translateVisibleStaticText(screen);
    initProfileAvatar();
  }
}
function goBack() {
  if (!APP.navHistory || !APP.navHistory.length) { navigate('home'); return; }
  var prev = APP.navHistory.pop();
  // Don't go back to coach from coach header (already has its own back btn)
  navigate(prev || 'home');
}
function injectBackBtn(screen) {
  var header = screen.querySelector('.screen-header') || screen.querySelector('.screen-title')?.parentElement;
  if (!header) return;
  // Don't add if already exists
  if (header.querySelector('.back-btn-inline')) return;
  var btn = document.createElement('button');
  btn.className = 'back-btn-inline';
  btn.innerHTML = '←';
  btn.onclick = function() { goBack(); };
  btn.style.cssText = [
    'background:transparent',
    'border:none',
    'font-size:28px',
    'font-weight:bold',
    'color:var(--text)',
    'cursor:pointer',
    'padding:8px 14px',
    'min-width:44px',
    'min-height:44px',
    'border-radius:12px',
    'background:var(--surface2)',
    'border:1px solid var(--border2)',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'line-height:1',
    'flex-shrink:0',
    '-webkit-tap-highlight-color:transparent',
    'touch-action:manipulation'
  ].join(';');
  // Insert at start of header
  header.style.display = header.style.display || 'flex';
  header.style.alignItems = 'center';
  header.insertBefore(btn, header.firstChild);
}
