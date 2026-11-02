/* P4: scoped device UI. Device names and all records use textContent. */
window.VitaliaConnect = (() => {
  'use strict';
  const CONSENT = 'connect-proposal-2026-11-01',
    SCOPES = ['sleep', 'heart_rate', 'hrv', 'steps', 'spo2'];
  let renderToken = 0,
    oauth = null,
    autoBusy = false,
    ble = null;
  const text = k => t('connect_' + k);
  const node = (tag, copy, cls) => {
    const e = document.createElement(tag);
    if (copy != null) e.textContent = copy;
    if (cls) e.className = cls;
    return e;
  };
  const append = (p, ...children) => {
    p.append(...children);
    return p;
  };
  const card = title => append(node('section', null, 'connect-card'), node('h2', title));
  const actions = p => {
    const d = node('div', null, 'connect-actions');
    p.append(d);
    return d;
  };
  const button = (p, label, fn, primary = false) => {
    const b = node('button', label, primary ? 'connect-primary' : '');
    b.type = 'button';
    b.addEventListener('click', fn);
    p.append(b);
    return b;
  };
  function owner() {
    return typeof currentUserId === 'function' ? currentUserId() : null;
  }
  function zone() {
    return (
      window.VitaliaDaily?.accountTimezone?.() || Intl.DateTimeFormat().resolvedOptions().timeZone
    );
  }
  function day(date = new Date()) {
    return window.VitaliaDaily
      ? window.VitaliaDaily.dateKey(date, zone())
      : date.toISOString().slice(0, 10);
  }
  async function request(action, source, body = {}, slug = 'health-ingest') {
    const uid = owner(),
      sb = getVitaliaSupabaseClient();
    if (!uid || !sb) throw Error('auth_required');
    const session = (await sb.auth.getSession())?.data?.session;
    if (!session || session.user.id !== uid) throw Error('auth_required');
    const r = await fetch(CONFIG.SUPABASE_URL + '/functions/v1/' + slug, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + session.access_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action,
        ...(slug === 'health-ingest' ? { source } : { provider: source }),
        ...body,
        lang: APP.lang
      }),
      signal: AbortSignal.timeout(55000)
    });
    const data = await r.json();
    if (owner() !== uid) throw Error('account_changed');
    if (!r.ok || !data.ok) {
      const e = Error(data.error || 'failed');
      throw e;
    }
    return data;
  }
  function feedback(p) {
    const s = node('div', '', 'connect-status');
    s.setAttribute('role', 'status');
    s.setAttribute('aria-live', 'polite');
    p.append(s);
    return s;
  }
  function saveButton(p, label, fn, primary = true) {
    const s = feedback(p);
    let busy = false;
    const b = button(
      p,
      label,
      async () => {
        if (busy) return;
        busy = true;
        b.disabled = true;
        s.textContent = text('saving');
        try {
          await fn();
          s.textContent = text('saved');
        } catch (e) {
          s.textContent =
            e.message === 'google_not_configured' ? text('google_missing') : text('failed');
        } finally {
          busy = false;
          b.disabled = false;
        }
      },
      primary
    );
    return b;
  }
  function consent(p, source, allowed, next) {
    const c = card(text('consent'));
    c.dataset.connectState = 'consent';
    append(c, node('p', text('purpose')));
    if (window.VITALIA_QA_BUILD) append(c, node('p', text('proposal')));
    const checks = allowed.map(scope => {
      const input = node('input');
      input.type = 'checkbox';
      input.checked = true;
      input.value = scope;
      const label = node('label');
      append(label, input, document.createTextNode(text(scope)));
      c.append(label);
      return input;
    });
    const privacy = node('a', text('privacy'));
    privacy.href = '#privacy';
    privacy.addEventListener('click', e => {
      e.preventDefault();
      showLegalModal('privacy');
    });
    c.append(privacy);
    const line = actions(c),
      status = feedback(c);
    let busy = false;
    const agree = button(
      line,
      text('agree'),
      async () => {
        if (busy) return;
        busy = true;
        agree.disabled = true;
        status.textContent = text('saving');
        try {
          const scopes = checks.filter(v => v.checked).map(v => v.value);
          if (!scopes.length) throw Error('scope_required');
          await request('connect', source, {
            scopes,
            consent_version: CONSENT,
            device_label: source
          });
          status.textContent = text('saved');
          await next(scopes);
          c.remove();
        } catch (e) {
          status.textContent =
            e.message === 'google_not_configured' ? text('google_missing') : text('failed');
        } finally {
          busy = false;
          agree.disabled = !checks.some(v => v.checked);
        }
      },
      true
    );
    checks.forEach(v =>
      v.addEventListener('change', () => {
        agree.disabled = busy || !checks.some(x => x.checked);
      })
    );
    button(line, text('cancel'), () => c.remove());
    p.append(c);
    c.scrollIntoView({ block: 'nearest' });
    return c;
  }
  function field(p, label, type, value) {
    const wrap = node('label', label),
      input = node('input');
    input.type = type;
    if (value != null) input.value = value;
    append(wrap, input);
    p.append(wrap);
    return input;
  }
  function wallTime(date, z) {
    const p = new Intl.DateTimeFormat('sv-SE', {
      timeZone: z,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).format(date);
    return p.replace(' ', 'T');
  }
  function instant(local, z) {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) throw Error('invalid_date');
    const guess = Date.parse(local + 'Z');
    let n = guess;
    for (let i = 0; i < 4; i++) {
      const displayed = Date.parse(wallTime(new Date(n), z) + 'Z');
      n += guess - displayed;
    }
    if (wallTime(new Date(n), z) !== local) throw Error('invalid_date');
    return new Date(n).toISOString();
  }
  function manual(p, scopes) {
    const c = card(text('manual'));
    c.dataset.connectState = 'manual';
    p.append(c);
    if (scopes.includes('sleep')) {
      const form = node('form');
      c.append(form);
      form.addEventListener('submit', e => e.preventDefault());
      const end = new Date(),
        start = new Date(end.getTime() - 8 * 3600000),
        z = zone();
      const bed = field(form, text('bed'), 'datetime-local', wallTime(start, z)),
        wake = field(form, text('wake'), 'datetime-local', wallTime(end, z));
      bed.required = true;
      wake.required = true;
      const quality = field(form, text('quality'), 'number', 3);
      quality.min = '1';
      quality.max = '5';
      quality.step = '1';
      quality.required = true;
      let external = crypto.randomUUID();
      saveButton(form, text('save'), async () => {
        if (!form.reportValidity()) throw Error('invalid_value');
        const start_at = instant(bed.value, z),
          end_at = instant(wake.value, z);
        await request('ingest_sleep', 'manual', {
          timezone: z,
          rows: [
            {
              external_id: external,
              start_at,
              end_at,
              stages: {
                segments: [],
                summary: {
                  quality: Number(quality.value),
                  minutes_asleep: Math.floor((Date.parse(end_at) - Date.parse(start_at)) / 60000)
                }
              }
            }
          ]
        });
        window.VitaliaDaily?.refresh();
      });
      // Editing a saved entry updates that same session; no accidental retry duplicates.
      form.addEventListener('reset', () => {
        external = crypto.randomUUID();
      });
    }
    if (scopes.includes('heart_rate')) {
      const form = node('form');
      form.addEventListener('submit', e => e.preventDefault());
      c.append(form);
      const hr = field(form, text('resting'), 'number');
      hr.min = '25';
      hr.max = '250';
      hr.required = true;
      form.append(node('p', text('resting_tip')));
      saveButton(form, text('save'), async () => {
        if (!form.reportValidity()) throw Error('invalid_value');
        await request('ingest_daily', 'manual', {
          timezone: zone(),
          rows: [{ day: day(), resting_hr: Number(hr.value) }]
        });
      });
    }
  }
  async function google(p) {
    const popup = window.open('about:blank', 'vitalia-connect', 'width=480,height=720');
    if (!popup) throw Error('popup_blocked');
    try {
      const redirect_uri = new URL('./connect-callback.html', location.href).href;
      const data = await request(
        'google_authorize',
        'fitbit',
        { redirect_uri },
        'wearables-sync-v1'
      );
      oauth = { state: data.state, uid: owner(), popup, expires: Date.now() + 600000, used: false };
      popup.location.href = data.url;
      p.append(node('p', text('awaiting')));
    } catch (e) {
      popup.close();
      throw e;
    }
  }
  async function receive(payload, event) {
    if (
      !oauth ||
      oauth.used ||
      owner() !== oauth.uid ||
      Date.now() > oauth.expires ||
      payload?.type !== 'vitalia-connect-oauth' ||
      payload.state !== oauth.state
    )
      return;
    if (event && (event.origin !== location.origin || event.source !== oauth.popup)) return;
    oauth.used = true;
    try {
      if (payload.error || !payload.code) throw Error('oauth_denied');
      await request(
        'google_exchange',
        'fitbit',
        { state: payload.state, code: payload.code },
        'wearables-sync-v1'
      );
      await request('sync', 'fitbit', { initial: true, timezone: zone() }, 'wearables-sync-v1');
      await render();
    } catch {
      const p = document.getElementById('vitalia-connect');
      if (p) {
        const error = card(text('error'));
        error.append(node('p', text('failed')));
        p.append(error);
      }
    } finally {
      oauth = null;
    }
  }
  window.addEventListener('message', e => receive(e.data, e));
  if (typeof window.BroadcastChannel === 'function') {
    const channel = new window.BroadcastChannel('vitalia-connect-oauth');
    channel.onmessage = e => receive(e.data);
  }
  async function render(target) {
    if (target?.nodeType !== 1) target = null;
    const main = target || document.getElementById('main-content');
    if (!main) return;
    const token = ++renderToken,
      uid = owner();
    const root = node('div');
    root.id = target ? 'vitalia-connect-legacy' : 'vitalia-connect';
    main.replaceChildren(root);
    const title = document.querySelector('.screen-header .screen-title');
    if (title) title.textContent = text('title');
    const choose = card(text('choose'));
    choose.append(node('p', text('intro')));
    root.append(choose);
    const list = actions(choose),
      detail = node('div');
    root.append(detail);
    [
      'Samsung',
      'Xiaomi',
      'Amazfit',
      'Garmin',
      'Fitbit',
      'Oura',
      'Apple Watch',
      'other',
      'none'
    ].forEach(brand => {
      const label =
        brand === 'none'
          ? text('none')
          : brand === 'other'
            ? { pt: 'Outro', en: 'Other', es: 'Otro', ru: 'Другое' }[APP.lang] || 'Other'
            : brand;
      button(list, label, () => {
        detail.replaceChildren();
        if (brand === 'none') {
          consent(detail, 'manual', ['sleep', 'heart_rate'], scopes => {
            detail.replaceChildren();
            manual(detail, scopes);
          });
          return;
        }
        if (brand === 'Fitbit') {
          consent(detail, 'fitbit', SCOPES, () => google(detail));
          return;
        }
        if (brand === 'Oura') {
          consent(detail, 'oura', ['sleep', 'hrv', 'steps'], async () => {
            await connectWearableProvider('oura');
            await render();
          });
          return;
        }
        const c = card(label);
        c.append(node('p', text(brand === 'Apple Watch' ? 'apple' : 'soon')));
        if (brand !== 'Apple Watch')
          saveButton(
            c,
            text('notify'),
            () => {
              const key = userScopedKey(VITALIA_CONNECT_WAITLIST_STORAGE_KEY),
                saved = vitaliaStorageGet(key, []);
              if (!vitaliaStorageSet(key, [...new Set([...saved, brand])]))
                throw Error('storage_failed');
              c.append(node('p', text('notified')));
            },
            false
          );
        detail.append(c);
      });
    });
    const status = feedback(choose);
    try {
      const sb = getVitaliaSupabaseClient();
      const result = await sb.from('device_connections').select('*').eq('user_id', uid);
      if (result.error) throw result.error;
      if (token !== renderToken || uid !== owner() || !root.isConnected) return;
      for (const row of result.data || []) {
        const c = card(row.device_label || row.connector),
          s =
            row.last_error === 'awaiting_provider'
              ? 'awaiting'
              : row.last_error && !row.last_error.startsWith('sync:')
                ? 'error'
                : row.status;
        c.append(
          node('p', text(s)),
          node(
            'p',
            text('last') +
              ': ' +
              (row.last_sync_at
                ? new Intl.DateTimeFormat(APP.lang, {
                    dateStyle: 'short',
                    timeStyle: 'short',
                    timeZone: zone()
                  }).format(new Date(row.last_sync_at))
                : text('no_data'))
          )
        );
        const line = actions(c);
        if (['fitbit', 'oura'].includes(row.connector) && row.status === 'active')
          saveButton(
            line,
            text('sync'),
            async () => {
              await request(
                'sync',
                row.connector,
                { timezone: zone(), date: day() },
                'wearables-sync-v1'
              );
              await render();
            },
            false
          );
        if (row.connector === 'manual' && row.status === 'active')
          button(line, text('manual'), () => {
            detail.replaceChildren();
            manual(detail, row.scopes);
          });
        if (row.status !== 'revoked')
          saveButton(
            line,
            text('disconnect'),
            async () => {
              await request('disconnect', row.connector);
              await render();
            },
            false
          );
        saveButton(
          line,
          text('delete'),
          async () => {
            if (!confirm(text('confirm'))) return;
            await request('delete_source', row.connector);
            await render();
            window.VitaliaDaily?.refresh();
          },
          false
        );
        root.append(c);
      }
      const cfg = await request('google_config', 'fitbit', {}, 'wearables-sync-v1');
      if (!cfg.configured) {
        const info = card('Fitbit');
        info.append(node('p', text('google_missing')));
        root.append(info);
      }
    } catch {
      status.textContent = text('failed');
      button(root, text('retry'), render);
    }
    const old = node('details');
    old.append(node('summary', text('legacy')));
    const metrics = node('div');
    old.append(metrics);
    root.append(old);
    old.addEventListener('toggle', () => {
      if (old.open && !metrics.childNodes.length) renderWearablesLegacy(metrics, true);
    });
  }
  async function autosync() {
    if (autoBusy || !owner() || navigator.onLine === false || document.hidden) return;
    autoBusy = true;
    const uid = owner();
    try {
      const sb = getVitaliaSupabaseClient(),
        r = await sb
          .from('device_connections')
          .select('connector,status')
          .eq('user_id', uid)
          .eq('status', 'active');
      if (r.error || owner() !== uid) return;
      for (const c of r.data || [])
        if (['fitbit', 'oura'].includes(c.connector))
          await request(
            'sync',
            c.connector,
            { automatic: true, timezone: zone(), date: day() },
            'wearables-sync-v1'
          );
    } catch {
    } finally {
      autoBusy = false;
    }
  }
  function install() {
    const app = document.getElementById('app');
    if (app)
      new MutationObserver(() => {
        if (app.style.display !== 'none') autosync();
      }).observe(app, { attributes: true, attributeFilter: ['style'] });
    autosync();
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) autosync();
  });
  window.addEventListener('online', autosync);
  function mountBle(main, phase = 'hypertrophy') {
    if (window.VitaliaUniversal) return window.VitaliaUniversal.mountAthlete(main, phase);
    if (document.getElementById('connect-ble')) return;
    const root = node('section');
    root.id = 'connect-ble';
    main.prepend(root);
    const c = card(text('live'));
    root.append(c);
    if (!navigator.bluetooth) {
      c.append(node('p', text('unsupported')));
      return;
    }
    if (ble) {
      c.append(node('p', text('live')));
      button(c, text('finish'), () => ble.finish());
      return;
    }
    button(
      c,
      text('sensor'),
      () => consent(c, 'ble_hr', ['heart_rate'], () => startBle(c, phase)),
      true
    );
  }
  async function startBle(p, phase = 'hypertrophy') {
    if (ble) return;
    const uid = owner();
    // requestDevice must run in the click gesture. Consent network round trips must
    // finish first, so this second explicit button preserves browser activation.
    const c = p;
    c.replaceChildren(node('h2', text('sensor')));
    const connect = button(
      c,
      text('sensor'),
      async () => {
        if (ble) return;
        connect.disabled = true;
        let device;
        try {
          device = await navigator.bluetooth.requestDevice({
            filters: [{ services: ['heart_rate'] }]
          });
        } catch {
          connect.disabled = false;
          return;
        }
        if (owner() !== uid) return;
        c.replaceChildren(node('h2', text('connecting')));
        c.dataset.connectState = 'connecting';
        const state = {
          device,
          uid,
          session: null,
          characteristic: null,
          stopped: false,
          lock: null,
          timer: null,
          retries: 0
        };
        ble = state;
        const profile = APP.profile || {};
        let age = Number(profile.age) || null;
        if (!age && profile.dob) {
          const born = new Date(profile.dob),
            now = new Date();
          age =
            now.getFullYear() -
            born.getFullYear() -
            (now.getMonth() < born.getMonth() ||
            (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())
              ? 1
              : 0);
        }
        const status = feedback(c),
          live = node('div'),
          bpm = node('div', '— bpm', 'connect-bpm'),
          zoneText = node('p'),
          timer = node('p');
        append(c, live);
        append(live, bpm, zoneText, timer, node('p', text(age ? 'estimate' : 'unknown_age')));
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 300 90');
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', text('heart_rate'));
        const line = document.createElementNS(svg.namespaceURI, 'polyline');
        line.setAttribute('fill', 'none');
        line.setAttribute('stroke', '#54ed89');
        line.setAttribute('stroke-width', '2');
        svg.append(line);
        live.append(svg);
        const wake = async () => {
          if (navigator.wakeLock && !document.hidden && !state.stopped)
            try {
              state.lock = await navigator.wakeLock.request('screen');
            } catch {}
        };
        const visibility = () => {
          if (!document.hidden) wake();
        };
        document.addEventListener('visibilitychange', visibility);
        const notification = e => {
          if (state.stopped || owner() !== uid) {
            stop();
            return;
          }
          if (!state.session) state.session = new window.VitaliaBle.Session(age);
          const d = state.session.add(e.target.value);
          if (!d) return;
          c.dataset.connectState = 'live';
          bpm.textContent = d.bpm + ' bpm';
          zoneText.textContent = d.zone ? text('zone') + ' ' + d.zone : '';
          status.textContent = text('live');
          const now = Date.now();
          line.setAttribute(
            'points',
            state.session.recent
              .map(
                s => ((s.at - (now - 60000)) / 60000) * 300 + ',' + (85 - ((s.bpm - 25) / 225) * 80)
              )
              .join(' ')
          );
        };
        const attach = async () => {
          const gatt = await device.gatt.connect();
          if (state.stopped) {
            gatt.disconnect();
            throw Error('stopped');
          }
          const service = await gatt.getPrimaryService('heart_rate');
          state.characteristic = await service.getCharacteristic('heart_rate_measurement');
          if (state.stopped) {
            gatt.disconnect();
            throw Error('stopped');
          }
          state.characteristic.addEventListener('characteristicvaluechanged', notification);
          await state.characteristic.startNotifications();
          if (state.stopped) {
            gatt.disconnect();
            throw Error('stopped');
          }
          state.retries = 0;
          status.textContent = text('live');
          await wake();
        };
        const detach = () => {
          if (state.characteristic) {
            state.characteristic.removeEventListener('characteristicvaluechanged', notification);
            state.characteristic.stopNotifications().catch(() => {});
            state.characteristic = null;
          }
        };
        const lost = async () => {
          if (state.reconnecting) return;
          detach();
          state.session?.tick();
          if (state.session) {
            state.session.last = null;
            state.session.lastAt = null;
          }
          if (state.stopped) return;
          state.reconnecting = true;
          status.textContent = text('connecting');
          bpm.textContent = '— bpm';
          zoneText.textContent = '';
          try {
            for (let attempt = 0; attempt < 3 && !state.stopped; attempt++) {
              await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
              if (state.stopped) return;
              try {
                await attach();
                return;
              } catch {}
            }
            if (!state.stopped) status.textContent = text('failed');
          } finally {
            state.reconnecting = false;
          }
        };
        device.addEventListener('gattserverdisconnected', lost);
        function stop() {
          state.stopped = true;
          clearInterval(state.timer);
          detach();
          device.removeEventListener('gattserverdisconnected', lost);
          document.removeEventListener('visibilitychange', visibility);
          if (device.gatt.connected) device.gatt.disconnect();
          state.lock?.release().catch(() => {});
          if (ble === state) ble = null;
        }
        async function finish() {
          const summary = state.session?.summary();
          stop();
          if (!summary?.sample_count) {
            status.textContent = text('no_data');
            return;
          }
          c.replaceChildren(node('h2', text('summary')));
          c.dataset.connectState = 'summary';
          const dl = node('dl');
          c.append(dl);
          [
            [text('duration'), summary.duration_seconds + ' s'],
            [text('average'), summary.hr_avg + ' bpm'],
            [text('maximum'), summary.hr_max + ' bpm'],
            ...summary.zones_seconds.map((s, i) => [text('zone') + ' ' + (i + 1), s + ' s'])
          ].forEach(([label, value]) => append(dl, node('dt', label), node('dd', value)));
          const id = crypto.randomUUID(),
            savedDay = day();
          let workoutSaved = false;
          saveButton(c, text('save'), async () => {
            if (owner() !== uid) throw Error('account_changed');
            const sb = getVitaliaSupabaseClient();
            if (!workoutSaved) {
              const r = await sb.from('athlete_logs').upsert(
                {
                  id,
                  user_id: uid,
                  session_date: savedDay,
                  phase: ['hypertrophy', 'strength', 'power', 'deload'].includes(phase)
                    ? phase
                    : 'hypertrophy',
                  duration_min: Math.max(1, Math.round(summary.duration_seconds / 60)),
                  total_sets: 0,
                  exercises: [summary]
                },
                { onConflict: 'id' }
              );
              if (r.error) throw r.error;
              workoutSaved = true;
            }
            await request('ingest_daily', 'ble_hr', {
              timezone: zone(),
              rows: [
                {
                  day: savedDay,
                  hr_avg: summary.hr_avg,
                  hr_min: summary.hr_min,
                  hr_max: summary.hr_max
                }
              ]
            });
            window.VitaliaDaily?.refresh();
          });
        }
        state.finish = finish;
        const controls = actions(c);
        button(controls, text('finish'), finish, true);
        button(controls, text('disconnect'), () => {
          stop();
          status.textContent = text('revoked');
        });
        state.timer = setInterval(() => {
          if (owner() !== uid) {
            stop();
            return;
          }
          if (!c.isConnected) {
            stop();
            return;
          }
          if (state.session)
            timer.textContent =
              text('duration') +
              ': ' +
              Math.floor((Date.now() - state.session.start) / 1000) +
              ' s';
        }, 1000);
        try {
          await attach();
          c.querySelector('h2').textContent = device.name || text('live');
          c.dataset.connectState = 'live';
        } catch {
          stop();
          status.textContent = text('failed');
          button(c, text('retry'), () => startBle(p, phase));
        }
      },
      true
    );
    connect.dataset.connectAction = 'request-device';
  }
  return { render, mountBle, autosync, request, instant, wallTime };
})();
