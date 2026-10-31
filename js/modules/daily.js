/* P1 Meu Dia. Deterministic suggestions, explicit data coverage, no model calls. */
window.VitaliaDaily = (() => {
  const CONFIG = Object.freeze({
    weights: { nutrition: 30, hydration: 20, sleep: 20, movement: 15, mind: 15 },
    version: 1,
    timeout: 6000
  });
  const CATALOG = Object.freeze([
    { id: 'meal_photo', pillar: 'nutrition', key: 'meal_photo', route: 'nutrition' },
    { id: 'meal_note', pillar: 'nutrition', key: 'meal_note', route: 'nutrition' },
    { id: 'water_log', pillar: 'hydration', key: 'water_log', route: 'hydration' },
    { id: 'water_review', pillar: 'hydration', key: 'water_review', route: 'hydration' },
    { id: 'sleep_log', pillar: 'sleep', key: 'sleep_log', route: 'sleep' },
    { id: 'sleep_review', pillar: 'sleep', key: 'sleep_review', route: 'sleep' },
    { id: 'movement_choose', pillar: 'movement', key: 'movement_choose', route: 'athlete' },
    { id: 'movement_log', pillar: 'movement', key: 'movement_log', route: 'athlete' },
    { id: 'mind_check', pillar: 'mind', key: 'mind_check', route: 'mental' },
    { id: 'mind_pause', pillar: 'mind', key: 'mind_pause', route: 'mental' },
    { id: 'recipe_review', pillar: 'nutrition', key: 'recipe_review', route: 'recipes' }
  ]);
  const PILLARS = Object.keys(CONFIG.weights),
    ROUTES = new Set([
      'nutrition',
      'hydration',
      'sleep',
      'athlete',
      'mental',
      'recipes',
      'diagnostic'
    ]);
  let state = null,
    cache = null,
    owner = '',
    dayKey = '',
    busy = false,
    loading = null,
    timer = null,
    root = null,
    signature = '',
    generation = 0,
    localCoreTrusted = true,
    pendingMessage = '';
  const copy = key => t('daily_' + key);
  function dateKey(
    date = new Date(),
    zone = (state?.owner === currentUserId() ? state.timezone : null) ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      'UTC'
  ) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }
  function storageKey(uid) {
    return userScopedKey(VITALIA_DAILY_STORAGE_KEY, uid);
  }
  function clamp(n) {
    return Math.max(0, Math.min(100, n));
  }
  function number(value, min, max) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) && n >= min && n <= max ? n : null;
  }
  function calculate(values) {
    let total = 0,
      weight = 0;
    const available = [],
      missing = [];
    for (const pillar of PILLARS) {
      const value = number(values[pillar], 0, 100);
      if (value === null) {
        missing.push(pillar);
        continue;
      }
      available.push({ pillar, value });
      weight += CONFIG.weights[pillar];
      total += value * CONFIG.weights[pillar];
    }
    available.sort(
      (a, b) => a.value - b.value || PILLARS.indexOf(a.pillar) - PILLARS.indexOf(b.pillar)
    );
    return {
      score: weight ? Math.round(total / weight) : null,
      weight,
      available,
      missing,
      weakest: available[0]?.pillar || null
    };
  }
  function validZone(value) {
    try {
      new Intl.DateTimeFormat('en-CA', { timeZone: value }).format(new Date());
      return typeof value === 'string' && value.length > 0;
    } catch (_) {
      return false;
    }
  }
  function bounded(operation) {
    let deadline;
    return Promise.race([
      operation,
      new Promise((_, reject) => {
        deadline = setTimeout(() => reject(new Error('timeout')), CONFIG.timeout);
      })
    ]).finally(() => clearTimeout(deadline));
  }
  function ensure() {
    const uid = currentUserId(),
      stored = uid ? vitaliaStorageGet(storageKey(uid), null) : null;
    const zone =
      stored?.owner === uid && validZone(stored.timezone)
        ? stored.timezone
        : Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const today = dateKey(new Date(), zone);
    if (owner === uid && dayKey === today && state) return;
    const rolled = owner === uid && !!dayKey && dayKey !== today;
    generation++;
    owner = uid;
    dayKey = today;
    busy = false;
    loading = null;
    signature = '';
    pendingMessage = '';
    localCoreTrusted =
      !rolled &&
      today === dateKey(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    state =
      stored && stored.owner === uid && stored.date === today && stored.version === CONFIG.version
        ? stored
        : {
            version: CONFIG.version,
            owner: uid,
            date: today,
            timezone: zone,
            actions: null,
            credited: false,
            records: null
          };
    state.timezone = zone;
    if (
      !Array.isArray(state.actions) ||
      state.actions.length !== 3 ||
      state.actions.some(
        a =>
          !a ||
          typeof a.id !== 'string' ||
          !['catalog', 'weekly'].includes(a.source) ||
          (a.source === 'catalog' && !CATALOG.some(c => c.id === a.id))
      )
    )
      state.actions = null;
    cache = state.records || { sleep: null, stress: null, training: false, plan: null, core: null };
    root = document.getElementById('daily-root');
  }
  function persist() {
    if (!owner) return true;
    const ok = vitaliaStorageSet(storageKey(owner), state);
    if (!ok) pendingMessage = 'storage_error';
    return ok;
  }
  function readCore() {
    if (!owner) return { nutrition: null, hydration: null, mood: false };
    const meals = (APP.meals || []).filter(m => !m.date || m.date === dayKey),
      target = typeof smartHydrationTarget === 'function' ? smartHydrationTarget().cups : null;
    return {
      nutrition: meals.length ? nutritionQualityScore(meals) : null,
      hydration:
        Number(APP.water) > 0 && number(target, 1, 1000) !== null
          ? clamp((Number(APP.water) / target) * 100)
          : null,
      mood: !!APP.mood
    };
  }
  function values() {
    let core = localCoreTrusted ? readCore() : cache.core || {};
    if (
      navigator.onLine === false &&
      core.nutrition == null &&
      core.hydration == null &&
      cache.core
    )
      core = cache.core;
    const sleep = cache.sleep,
      stress = cache.stress;
    const quality = number(sleep?.quality, 1, 5),
      duration = number(sleep?.duration_hours, 0, 24);
    // Duration contributes record completeness, not distance from a universal sleep target.
    const sleepParts = [
      duration === null ? null : 100,
      quality === null ? null : (quality / 5) * 100
    ].filter(v => v !== null);
    const mindRecorded =
      core.mood ||
      number(stress?.mood_score, 1, 5) !== null ||
      number(stress?.stress_score, 1, 5) !== null ||
      stress?.breathing_done === true;
    const movementDone =
      cache.training ||
      stress?.walked_today === true ||
      state.actions?.some(a => a.id === 'movement_log' && a.done);
    return {
      nutrition: core.nutrition ?? null,
      hydration: core.hydration ?? null,
      sleep: sleepParts.length ? sleepParts.reduce((a, b) => a + b, 0) / sleepParts.length : null,
      movement: movementDone ? 100 : null,
      mind: mindRecorded ? 100 : null
    };
  }
  function selectActions(result, goal, day) {
    const rotation = Math.floor(Date.parse(day + 'T12:00:00Z') / 86400000);
    const ordered = [...result.available.map(x => x.pillar), ...result.missing];
    if (!result.available.length)
      ordered.splice(0, ordered.length, 'nutrition', 'hydration', 'mind', 'sleep', 'movement');
    const focus = /strength|muscle|hypertrophy|performance|gain/.test(goal || '')
      ? 'movement'
      : /sleep/.test(goal || '')
        ? 'sleep'
        : 'nutrition';
    const pillars = [ordered[0], ordered[1], focus];
    if (pillars[2] === pillars[0] || pillars[2] === pillars[1])
      pillars[2] = ordered.find(p => !pillars.slice(0, 2).includes(p)) || 'mind';
    return pillars.map((pillar, index) => {
      const choices = CATALOG.filter(a => a.pillar === pillar);
      const action = choices[(rotation + index) % choices.length];
      return { id: action.id, pillar: action.pillar, source: 'catalog', done: false };
    });
  }
  function initActions() {
    if (state.actions) return;
    state.actions = selectActions(
      calculate(values()),
      cache.plan?.goal_type || APP.profile?.goal,
      dayKey
    );
    if (navigator.onLine === false) state.selectionFinalized = true;
    persist();
  }
  function snapshot() {
    ensure();
    initActions();
    return { ...calculate(values()), values: values(), actions: state.actions, date: dayKey };
  }
  function elem(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = String(text);
    return node;
  }
  function button(text, handler, cls = 'btn btn-outline') {
    const b = elem('button', cls + ' daily-button tap-effect', text);
    b.type = 'button';
    b.addEventListener('click', handler);
    return b;
  }
  function track(name, index) {
    if (typeof window.vitaliaTrackEvent === 'function')
      window.vitaliaTrackEvent(
        name,
        index == null ? { surface: 'daily' } : { surface: 'daily', step: index + 1 }
      );
  }
  function draw() {
    if (!root || !root.isConnected || owner !== currentUserId()) return;
    const result = snapshot();
    root.replaceChildren();
    const header = elem('div', 'daily-header');
    header.append(
      elem('h2', 'daily-title', copy('title')),
      elem(
        'span',
        'daily-date',
        new Intl.DateTimeFormat(APP.lang, { dateStyle: 'medium', timeZone: state.timezone }).format(
          new Date()
        )
      )
    );
    root.append(header);
    const overview = elem('div', 'daily-overview');
    const score = elem('div', 'daily-score', result.score === null ? '—' : result.score);
    score.setAttribute(
      'aria-label',
      result.score === null ? copy('start') : copy('score') + ' ' + result.score + ' / 100'
    );
    const detail = elem('div', 'daily-detail');
    detail.append(
      elem('p', 'daily-score-label', result.score === null ? copy('start') : copy('score')),
      elem('p', 'daily-message', copy('encouragement'))
    );
    detail.append(
      elem('p', 'daily-coverage', copy('coverage').replace('{count}', result.available.length))
    );
    if (result.weakest)
      detail.append(elem('p', 'daily-weakest', copy('weakest') + ' ' + copy(result.weakest)));
    overview.append(score, detail);
    root.append(overview, elem('p', 'daily-note', copy('meaning')));
    if (result.missing.length)
      root.append(
        elem('p', 'daily-missing', copy('missing') + ' ' + result.missing.map(copy).join(' · '))
      );
    const list = elem('ol', 'daily-actions');
    state.actions.forEach((action, index) => {
      const item = elem('li', 'daily-action' + (action.done ? ' daily-action-done' : ''));
      const data = CATALOG.find(c => c.id === action.id),
        title = action.source === 'weekly' ? action.title : copy(data.key),
        route = action.source === 'weekly' ? 'diagnostic' : data.route;
      item.append(elem('p', 'daily-action-title', title));
      const controls = elem('div', 'daily-controls');
      controls.append(
        button(copy('open'), () => {
          if (ROUTES.has(route)) navigate(route);
        })
      );
      const done = button(
        action.done ? copy('done') : copy('mark'),
        () => complete(index),
        'btn btn-primary'
      );
      done.setAttribute('aria-pressed', String(!!action.done));
      done.disabled =
        busy ||
        !owner ||
        !!action.done ||
        (navigator.onLine !== false && !state.selectionFinalized);
      controls.append(done);
      item.append(controls);
      list.append(item);
    });
    root.append(list);
    const status = elem(
      'p',
      'daily-status',
      pendingMessage ? copy(pendingMessage) : state.credited ? copy('credited') : copy('local')
    );
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    root.append(status);
    if (state.actions.every(a => a.done) && !state.credited)
      root.append(button(copy('retry'), () => credit()));
    const formula = elem('details', 'daily-formula');
    formula.append(elem('summary', '', copy('formula_title')), elem('p', '', copy('formula')));
    root.append(formula);
  }
  function shell() {
    setTimeout(mount, 0);
    return (
      '<section id="daily-root" class="premium-card daily-card" aria-label="' +
      escapeHTML(copy('title')) +
      '"></section>'
    );
  }
  function mount() {
    ensure();
    root = document.getElementById('daily-root');
    if (!root || APP.tab !== 'home') return;
    draw();
    loadRemote(!localCoreTrusted);
    if (!timer)
      timer = setInterval(() => {
        if (!document.getElementById('daily-root') || APP.tab !== 'home') {
          clearInterval(timer);
          timer = null;
          return;
        }
        const previousDay = dayKey;
        ensure();
        const next = JSON.stringify([
          dayKey,
          APP.lang,
          localCoreTrusted ? readCore() : null,
          APP.streak
        ]);
        if (next !== signature) {
          signature = next;
          if (localCoreTrusted) {
            const currentCore = readCore();
            if (
              navigator.onLine !== false ||
              currentCore.nutrition !== null ||
              currentCore.hydration !== null ||
              currentCore.mood
            )
              cache.core = currentCore;
            state.records = cache;
            persist();
          }
          draw();
        }
        if (previousDay !== dayKey) loadRemote();
      }, 750);
  }
  async function scopedQuery(table, columns, dateColumn, date, limit = 1) {
    const client = getVitaliaSupabaseClient();
    if (!client || !owner) throw new Error('unavailable');
    let query = client.from(table).select(columns).eq('user_id', owner);
    if (dateColumn) query = query.eq(dateColumn, date);
    if (table === 'goal_diagnostics') query = query.eq('status', 'active');
    return query.limit(limit);
  }
  async function loadRemote(force = false) {
    ensure();
    initActions();
    if (!owner || navigator.onLine === false || loading) return;
    if (!force && state.lastLoaded && Date.now() - state.lastLoaded < 30000) return;
    const token = generation,
      uid = owner,
      date = dayKey;
    let timeout;
    loading = (async () => {
      const queries = [
        scopedQuery('sleep_logs', 'duration_hours,quality,sleep_date', 'sleep_date', date),
        scopedQuery(
          'stress_logs',
          'mood_score,stress_score,breathing_done,walked_today,log_date',
          'log_date',
          date
        ),
        scopedQuery('athlete_logs', 'id,session_date', 'session_date', date),
        scopedQuery('goal_diagnostics', '*', null, date),
        scopedQuery('gamificacao', '*', null, date)
      ];
      const results = await Promise.race([
        Promise.allSettled(queries),
        new Promise((_, reject) => {
          timeout = setTimeout(() => reject(new Error('timeout')), CONFIG.timeout);
        })
      ]);
      if (token !== generation || uid !== currentUserId() || date !== dateKey()) return;
      const game = results[4];
      const gamification =
        game?.status === 'fulfilled' && !game.value.error ? game.value.data?.[0] : null;
      if (gamification)
        state.backendReady =
          'meu_dia_completed_on' in gamification && 'meu_dia_timezone' in gamification;
      if (gamification?.meu_dia_timezone && gamification.meu_dia_timezone !== state.timezone) {
        state.timezone = gamification.meu_dia_timezone;
        persist();
        if (dateKey() !== date) {
          state = null;
          ensure();
          draw();
          setTimeout(() => loadRemote(true), 0);
          return;
        }
      }
      let failed = false;
      ['sleep', 'stress', 'training', 'plan'].forEach((key, index) => {
        const result = results[index];
        if (result.status !== 'fulfilled' || result.value.error) {
          failed = true;
          return;
        }
        const row = result.value.data?.[0] || null;
        cache[key] = key === 'training' ? !!row : row;
      });
      if (!state.selectionFinalized && !state.actions.some(a => a.done))
        state.actions = selectActions(
          calculate(values()),
          cache.plan?.goal_type || APP.profile?.goal,
          date
        );
      const sourcePlan = cache.plan;
      cache.plan = sourcePlan ? { id: sourcePlan.id, goal_type: sourcePlan.goal_type } : null;
      if (sourcePlan?.weekly_routine) await adoptWeekly(sourcePlan, token, uid, date);
      if (token !== generation || uid !== currentUserId() || date !== dateKey()) return;
      if (localCoreTrusted) cache.core = readCore();
      else {
        const coreResults = await Promise.allSettled([
          scopedQuery('refeicoes', 'nome,proteina', 'data', date, 100),
          scopedQuery('hidratacao', 'copos', 'data', date),
          scopedQuery('humor', 'emoji', 'data', date)
        ]);
        if (token !== generation || uid !== currentUserId() || date !== dateKey()) return;
        const valid = i =>
          coreResults[i].status === 'fulfilled' && !coreResults[i].value.error
            ? coreResults[i].value.data
            : null;
        const meals = valid(0),
          water = valid(1),
          mood = valid(2),
          target = smartHydrationTarget().cups;
        cache.core = {
          nutrition: meals?.length
            ? nutritionQualityScore(meals.map(m => ({ name: m.nome, prot: m.proteina })))
            : null,
          hydration:
            water?.length && number(target, 1, 1000) !== null
              ? clamp((Number(water[0].copos) / target) * 100)
              : null,
          mood: !!mood?.length
        };
      }
      cache.plan = cache.plan ? { id: cache.plan.id, goal_type: cache.plan.goal_type } : null;
      state.selectionFinalized = true;
      state.records = cache;
      state.lastLoaded = Date.now();
      pendingMessage = failed ? 'partial' : '';
      persist();
      draw();
    })()
      .catch(() => {
        if (token === generation) {
          pendingMessage = 'partial';
          state.selectionFinalized = true;
          persist();
          draw();
        }
      })
      .finally(() => {
        clearTimeout(timeout);
        if (token === generation) loading = null;
      });
    return loading;
  }
  async function adoptWeekly(plan, token, uid, date) {
    const routine = plan.weekly_routine,
      cycle = routine.cycles?.at(-1);
    if (!cycle || date < cycle.start || date > cycle.end || !Array.isArray(cycle.actions)) return;
    const client = getVitaliaSupabaseClient();
    const result = await bounded(
      client
        .from('diagnostic_checkins')
        .select('*')
        .eq('user_id', uid)
        .eq('diagnostic_id', plan.id)
        .eq('routine_date', date)
        .maybeSingle()
    );
    if (result.error || token !== generation || uid !== currentUserId()) return;
    if (state.selectionFinalized) {
      for (const action of state.actions || [])
        if (
          action.source === 'weekly' &&
          action.planId === plan.id &&
          action.cycleStart === cycle.start &&
          (action.weeklyRevision || 0) <= routine.revision
        )
          action.done = result.data?.routine_data?.states?.[action.index] === 'done';
      return;
    }
    const shared = cycle.actions.slice(0, 3).map((title, index) => ({
      id: 'weekly:' + plan.id + ':' + cycle.start + ':' + index,
      source: 'weekly',
      title: String(title).slice(0, 240),
      pillar: state.actions?.find(a => a.index === index && a.planId === plan.id)?.pillar || null,
      planId: plan.id,
      index,
      cycleStart: cycle.start,
      weeklyRevision: routine.revision,
      done: result.data?.routine_data?.states?.[index] === 'done'
    }));
    const extras = (state.actions || selectActions(calculate(values()), plan.goal_type, date))
      .filter(a => a.source === 'catalog')
      .slice(0, 3 - shared.length);
    if (shared.length + extras.length === 3) state.actions = [...shared, ...extras];
  }
  async function complete(index) {
    ensure();
    initActions();
    if (busy || !owner || !state.actions[index] || state.actions[index].done) return;
    const token = generation,
      uid = owner,
      date = dayKey,
      action = state.actions[index];
    busy = true;
    pendingMessage = '';
    draw();
    try {
      if (action.source === 'weekly') {
        if (navigator.onLine === false) throw new Error('weekly_offline');
        action.weeklyRevision = await bounded(completeWeekly(action, uid, date));
      }
      if (token !== generation || uid !== currentUserId() || date !== dateKey()) return;
      action.done = true;
      action.completedAt = new Date().toISOString();
      if (!persist()) {
        if (action.source === 'catalog') action.done = false;
        draw();
        return;
      }
      track('daily_action_completed', index);
      draw();
    } catch (error) {
      if (token === generation) {
        pendingMessage = error.message === 'weekly_offline' ? 'weekly_offline' : 'save_error';
        draw();
      }
    } finally {
      if (token === generation) {
        busy = false;
        draw();
      }
    }
    if (token === generation && state.actions.every(a => a.done)) await credit();
  }
  async function completeWeekly(action, uid, date) {
    const client = getVitaliaSupabaseClient();
    const planResult = await client
      .from('goal_diagnostics')
      .select('*')
      .eq('user_id', uid)
      .eq('id', action.planId)
      .eq('status', 'active')
      .maybeSingle();
    if (planResult.error || !planResult.data?.weekly_routine) throw new Error('save_error');
    const plan = planResult.data,
      routine = structuredClone(plan.weekly_routine),
      cycle = routine.cycles.at(-1);
    if (
      cycle.start !== action.cycleStart ||
      date < cycle.start ||
      date > cycle.end ||
      action.index >= cycle.actions.length
    )
      throw new Error('stale_action');
    const checkResult = await client
      .from('diagnostic_checkins')
      .select('*')
      .eq('user_id', uid)
      .eq('diagnostic_id', plan.id)
      .eq('routine_date', date)
      .maybeSingle();
    if (checkResult.error) throw checkResult.error;
    const check = structuredClone(
      checkResult.data?.routine_data || {
        states: cycle.actions.map(() => 'unrecorded'),
        difficulty: '',
        note: '',
        useful: ''
      }
    );
    check.states[action.index] = 'done';
    check.completed_once = cycle.actions.map(
      (_, i) => !!check.completed_once?.[i] || i === action.index
    );
    check.submitted_once = true;
    const revision = routine.revision;
    routine.revision++;
    const saved = await client.rpc('vitalia_save_weekly_routine', {
      p_id: plan.id,
      p_revision: revision,
      p_routine: routine,
      p_date: date,
      p_check: check
    });
    if (saved.error) throw saved.error;
    return routine.revision;
  }
  async function credit() {
    ensure();
    if (busy || !owner || state.credited || !state.actions?.every(a => a.done)) return;
    if (navigator.onLine === false || state.backendReady === false) {
      pendingMessage = 'pending';
      draw();
      return;
    }
    const uid = owner,
      date = dayKey,
      token = generation;
    busy = true;
    draw();
    try {
      const client = getVitaliaSupabaseClient();
      if (!client) throw new Error('unavailable');
      const result = await bounded(
        client.rpc('vitalia_complete_daily_actions', {
          p_day: date,
          p_timezone: state.timezone,
          p_action_ids: state.actions.map(a => a.id)
        })
      );
      if (result.error) throw result.error;
      if (token !== generation || uid !== currentUserId() || date !== dateKey()) return;
      const row = Array.isArray(result.data) ? result.data[0] : result.data;
      if (row?.meu_dia_completed_on !== date || !Number.isInteger(row.streak))
        throw new Error('save_error');
      APP.streak = row.streak;
      const streakLabel = document.querySelector?.(
        '.premium-metrics .metric-card:nth-child(3) .metric-v'
      );
      if (streakLabel) streakLabel.textContent = APP.streak + ' ' + t('unit_days');
      state.credited = true;
      pendingMessage = '';
      persist();
      track('daily_completed');
      draw();
    } catch (_) {
      if (token === generation) {
        pendingMessage = 'pending';
        draw();
      }
    } finally {
      if (token === generation) {
        busy = false;
        draw();
      }
    }
  }
  window.addEventListener('online', () => {
    ensure();
    if (document.getElementById('daily-root')) {
      loadRemote(true);
      credit();
    }
  });
  window.addEventListener('storage', event => {
    if (owner && event.key === storageKey(owner)) {
      state = null;
      ensure();
      draw();
    }
  });
  return {
    CONFIG,
    CATALOG,
    calculate,
    selectActions,
    dateKey,
    snapshot,
    shell,
    mount,
    complete,
    credit,
    refresh: () => loadRemote(true)
  };
})();
