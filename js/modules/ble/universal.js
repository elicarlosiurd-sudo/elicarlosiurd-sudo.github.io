/* P5 presentation uses the existing premium Connect styles and authenticated API. */
window.VitaliaUniversal = (() => {
  'use strict';
  const u = k => t('universal_' + k),
    c = k => t('connect_' + k),
    CONSENT = 'connect-proposal-p5-2026-11-01';
  let active = null;
  const node = (tag, text, cls) => {
    const n = document.createElement(tag);
    if (text != null) n.textContent = String(text);
    if (cls) n.className = cls;
    return n;
  };
  const card = title => {
    const n = node('section', null, 'connect-card');
    n.append(node('h2', title));
    return n;
  };
  const button = (p, title, fn, primary = false) => {
    const n = node('button', title, primary ? 'connect-primary' : '');
    n.type = 'button';
    n.style.margin = '6px 6px 6px 0';
    n.addEventListener('click', fn);
    p.append(n);
    return n;
  };
  const status = p => {
    const n = node('p', '', 'connect-status');
    n.setAttribute('role', 'status');
    n.setAttribute('aria-live', 'polite');
    p.append(n);
    return n;
  };
  const owner = () => currentUserId(),
    zone = () => VitaliaDaily.accountTimezone();
  const number = value => new Intl.NumberFormat(APP.lang).format(value);
  function sleepTime(minutes) {
    const hours = Math.floor(minutes / 60),
      rest = minutes % 60;
    return [
      hours ? number(hours) + ' ' + u('hours_short') : '',
      rest || !hours ? number(rest) + ' ' + u('minutes_short') : ''
    ]
      .filter(Boolean)
      .join(' ');
  }
  function summaryDate(day) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return '';
    return new Intl.DateTimeFormat(APP.lang, { dateStyle: 'short', timeZone: 'UTC' }).format(
      new Date(day + 'T12:00:00Z')
    );
  }
  function readableSections(daily, estimated = false) {
    const sections = [];
    const rates = [
      ['hr_avg', 'day_average'],
      ['hr_min', 'day_lowest'],
      ['hr_max', 'day_highest'],
      ['resting_hr', 'at_rest']
    ]
      .filter(([key]) => Number.isFinite(daily[key]))
      .map(
        ([key, label]) =>
          u(label) +
          ': ' +
          number(daily[key]) +
          ' ' +
          u('per_minute') +
          (key === 'resting_hr' && estimated ? ' · ' + u('estimated') : '')
      );
    if (rates.length) sections.push({ title: u('heart_title'), lines: rates, kind: 'heart' });
    if (Number.isFinite(daily.sleep_minutes))
      sections.push({
        title: u('sleep_title'),
        lines: [u('sleep_total') + ': ' + sleepTime(daily.sleep_minutes)],
        kind: 'sleep'
      });
    if (Number.isFinite(daily.steps))
      sections.push({
        title: u('steps_title'),
        lines: [number(daily.steps) + ' ' + u('steps_unit')],
        kind: 'steps'
      });
    if (Number.isFinite(daily.spo2_avg))
      sections.push({
        title: u('oxygen_title'),
        lines: [number(daily.spo2_avg) + '%'],
        kind: 'oxygen'
      });
    if (Number.isFinite(daily.hrv_rmssd_ms))
      sections.push({
        title: u('variation_title'),
        lines: [number(daily.hrv_rmssd_ms) + ' ' + u('milliseconds')],
        kind: 'variation'
      });
    return sections;
  }
  const bindingKey = source => userScopedKey('vitalia_native_consent_' + source, owner());
  async function request(action, source, body) {
    const payload = { ...(body || {}) };
    if (action === 'native_snapshot')
      payload.consented_at = vitaliaStorageGet(bindingKey(source), null);
    const r = await window.VitaliaConnect.request(action, source, payload);
    if (action === 'native_connect' && r.consented_at)
      vitaliaStorageSet(bindingKey(source), r.consented_at);
    if (action === 'disconnect' || action === 'delete_source')
      vitaliaStorageRemove(bindingKey(source));
    return r;
  }
  function errorText(e) {
    return /permission|consent_changed/i.test(e?.message)
      ? u('permission')
      : /health_unavailable/.test(e?.message)
        ? u('health_missing')
        : c('failed');
  }
  async function consent(p, source, scopes, next) {
    const part = card(c('consent'));
    part.dataset.universalState = 'consent';
    part.append(node('p', c('purpose')));
    if (window.VITALIA_QA_BUILD) part.append(node('p', c('proposal')));
    const inputs = [];
    for (const key of scopes) {
      const label = node('label'),
        input = node('input');
      input.type = 'checkbox';
      input.checked = true;
      input.value = key;
      inputs.push(input);
      label.append(input, document.createTextNode(c(key)));
      part.append(label);
    }
    const s = status(part),
      agree = button(
        part,
        c('agree'),
        async () => {
          agree.disabled = true;
          s.textContent = c('saving');
          try {
            const chosen = inputs.filter(n => n.checked).map(n => n.value);
            if (!chosen.length) throw Error('permission_required');
            await next(chosen);
            part.remove();
          } catch (e) {
            s.textContent = errorText(e);
          } finally {
            agree.disabled = !inputs.some(n => n.checked);
          }
        },
        true
      );
    inputs.forEach(n =>
      n.addEventListener('change', () => {
        agree.disabled = !inputs.some(n => n.checked);
      })
    );
    button(part, c('privacy'), () => showLegalModal('privacy'));
    p.append(part);
    part.scrollIntoView({ block: 'nearest' });
  }
  function native() {
    return window.Capacitor?.isNativePlatform?.() && window.Capacitor.getPlatform() === 'android'
      ? window.VitaliaNative
      : null;
  }
  let hcBusy = false;
  function bridge(progress = () => {}) {
    const n = native();
    if (!n) throw Error('health_unavailable');
    const raw = VitaliaHealthBridge.create({
      health: n.Health,
      changes: n.Changes,
      request,
      owner,
      timezone: zone,
      wallInstant: VitaliaConnect.instant,
      onProgress: progress
    });
    const lock =
      fn =>
      async (...args) => {
        if (hcBusy) throw Error('sync_busy');
        hcBusy = true;
        try {
          return await fn(...args);
        } finally {
          hcBusy = false;
        }
      };
    return { ...raw, connect: lock(raw.connect), sync: lock(raw.sync) };
  }
  async function renderDevices() {
    const main = document.getElementById('main-content');
    if (!main) return;
    const root = node('div');
    root.id = 'vitalia-connect';
    main.replaceChildren(root);
    const header = document.querySelector('.screen-header .screen-title');
    if (header) header.textContent = c('title');
    const top = card(u('connect'));
    top.append(node('p', u('depends')));
    if (!native()) {
      const install = node('a', u('install_android'));
      install.href =
        'https://elicarlosiurd-sudo.github.io/downloads/VitalIA.apk?v=' +
        globalThis.VITALIA_APP_VERSION;
      install.setAttribute('download', 'VitalIA.apk');
      top.append(node('p', u('native_only')), install);
    }
    root.append(top);
    const panel = node('div');
    root.append(panel);
    button(
      top,
      u('connect'),
      () => {
        panel.replaceChildren();
        const choose = card(u('select'));
        panel.append(choose);
        button(
          choose,
          u('automatic'),
          () => {
            if (!native()) {
              choose.append(node('p', u('native_only')));
              return;
            }
            consent(
              panel,
              'health_connect',
              ['sleep', 'heart_rate', 'hrv', 'steps', 'spo2'],
              async scopes => {
                choose.append(node('p', u('health_read')));
                const s = status(choose);
                await bridge((i, n) => (s.textContent = c('saving') + ' ' + i + '/' + n)).connect(
                  scopes
                );
                await renderDevices();
              }
            );
          },
          true
        );
        button(choose, u('direct'), () => direct(panel, false));
      },
      true
    );
    try {
      const sb = getVitaliaSupabaseClient(),
        uid = owner(),
        r = await sb.from('device_connections').select('*').eq('user_id', uid);
      if (r.error) throw r.error;
      if (uid !== owner() || !root.isConnected) return;
      for (const connection of r.data || []) {
        if (
          !['health_connect', 'ble_hr'].includes(connection.connector) ||
          connection.consent_version !== CONSENT
        )
          continue;
        const box = card(connection.device_label || connection.connector),
          s = status(box);
        s.textContent = c(connection.status);
        if (connection.last_sync_at)
          box.append(
            node(
              'p',
              c('last') +
                ': ' +
                new Intl.DateTimeFormat(APP.lang, {
                  dateStyle: 'short',
                  timeStyle: 'short',
                  timeZone: zone()
                }).format(new Date(connection.last_sync_at))
            )
          );
        if (connection.connector === 'health_connect' && connection.status === 'active') {
          if (native()) {
            try {
              await bridge().permissions(connection.scopes);
            } catch (e) {
              s.textContent = errorText(e);
            }
            if (uid !== owner() || !root.isConnected) return;
          } else box.append(node('p', u('native_only')));
          const sync = button(box, c('sync'), async () => {
            if (hcBusy) {
              s.textContent = c('saving');
              return;
            }
            sync.disabled = true;
            s.textContent = c('saving');
            try {
              await bridge((i, n) => (s.textContent = c('saving') + ' ' + i + '/' + n)).sync(
                connection.scopes
              );
              s.textContent = c('saved');
              VitaliaDaily.refresh();
            } catch (e) {
              s.textContent = errorText(e);
            } finally {
              sync.disabled = !native();
            }
          });
          sync.disabled = !native();
        }
        button(box, c('disconnect'), async () => {
          try {
            await active?.disconnect();
            await request(
              'disconnect',
              connection.connector === 'ble_hr' ? 'ble' : 'health_connect'
            );
            await renderDevices();
          } catch (e) {
            s.textContent = errorText(e);
          }
        });
        button(box, c('delete'), async () => {
          if (!confirm(c('confirm'))) return;
          try {
            await active?.disconnect();
            if (connection.connector === 'health_connect') await bridge().delete();
            else await request('delete_source', 'ble');
            await renderDevices();
            VitaliaDaily.refresh();
          } catch (e) {
            s.textContent = errorText(e);
          }
        });
        root.append(box);
      }
      const snapshots = await sb
        .from('device_health_snapshots')
        .select('origins,day,source,payload')
        .eq('user_id', uid)
        .order('day', { ascending: false })
        .limit(5);
      if (snapshots.error) throw snapshots.error;
      if (uid !== owner() || !root.isConnected) return;
      const origins = new Map();
      for (const snapshot of snapshots.data || [])
        for (const id of snapshot.origins || [])
          origins.set(id, snapshot.payload?.origin_names?.[id]);
      if (origins.size) {
        const origin = card(u('origin'));
        for (const [id, name] of origins) origin.append(node('p', originLabel(id, name)));
        root.append(origin);
      }
      for (const snapshot of snapshots.data || []) {
        if (snapshot.source !== 'health_connect') continue;
        const daily = snapshot.payload?.daily || {},
          box = card(u('summary_title') + ' · ' + summaryDate(snapshot.day));
        box.dataset.universalState = 'imported';
        for (const id of snapshot.origins || [])
          box.append(node('p', originLabel(id, snapshot.payload?.origin_names?.[id])));
        for (const section of readableSections(daily, !!snapshot.payload?.resting_hr_estimate)) {
          box.append(node('h3', section.title));
          section.lines.forEach(text => box.append(node('p', text)));
          if (section.kind === 'heart') {
            if (snapshot.payload?.resting_hr_estimate) box.append(node('p', u('estimate_tip')));
            else if (daily.resting_hr == null && daily.hr_avg != null)
              box.append(node('p', u('rest_missing')));
          }
          if (section.kind === 'variation') box.append(node('p', u('variation_tip')));
        }
        root.append(box);
      }
    } catch (e) {
      const failure = card(c('error'));
      failure.append(node('p', errorText(e)));
      button(failure, c('retry'), renderDevices);
      root.append(failure);
    }
    const legacy = node('details', null, 'universal-legacy');
    legacy.append(node('summary', u('other')));
    const inner = node('div');
    legacy.append(inner);
    root.append(legacy);
    legacy.addEventListener('toggle', () => {
      if (legacy.open && !inner.childNodes.length) VitaliaConnect.render(inner);
    });
  }
  function originLabel(name, provided) {
    const label =
      {
        'com.watchic.app': 'Fitbeing',
        'com.fitbit.FitbitMobile': 'Fitbit',
        'com.sec.android.app.shealth': 'Samsung Health',
        'android.healthconnect': 'Health Connect'
      }[name] ||
      provided ||
      name;
    return ({ pt: 'via ', en: 'via ', es: 'vía ', ru: 'через ' }[APP.lang] || 'via ') + label;
  }
  function capabilities(services) {
    return Object.entries(VitaliaGatt.SERVICES)
      .filter(([, id]) => services.map(v => v.toLowerCase()).includes(VitaliaGatt.uuid(id)))
      .map(([key]) => u(key === 'cycling_power' || key === 'cycling_cadence' ? 'cycling' : key));
  }
  function guide(p) {
    const d = node('details');
    d.append(node('summary', u('guide')), node('p', u('vary')));
    const select = node('select', null, 'universal-select');
    select.setAttribute('aria-label', u('guide'));
    const out = node('div');
    const sources = [
      ['Bettdow FB050 / Fitbeing', u('no_live'), null],
      [
        'Garmin',
        'Broadcast Heart Rate',
        'https://support.garmin.com/en-US/?faq=Zj1947s6pqAHzBCAhLhrC9'
      ],
      [
        'Polar',
        'HR sensor mode',
        'https://support.polar.com/us-en/troubleshooting-ignite-2-hr-sensor-mode'
      ],
      [
        'Fitbit Charge 6 / Pixel Watch 2+',
        'Connected Fitness / Share Heart Rate',
        'https://support.google.com/googlehealth/answer/14236705'
      ],
      [
        'Xiaomi Watch 5 / S5',
        'HR Broadcast',
        'https://www.mi.com/uk/support/faq/details/KA-667495/'
      ],
      [
        'Huawei / Honor',
        'Heart rate broadcasts',
        'https://consumer.huawei.com/en/support/content/en-us15827504/'
      ],
      [
        'COROS',
        'Broadcast HR',
        'https://support.coros.com/hc/en-us/articles/360040256991-Broadcasting-Heart-Rate'
      ],
      ['Amazfit / Zepp / Redmi / Suunto / Wahoo / Samsung / Apple Watch', null, null]
    ];
    sources.forEach((s, i) => {
      const o = node('option', s[0]);
      o.value = String(i);
      select.append(o);
    });
    const update = () => {
      const [brand, menu, url] = sources[Number(select.value)];
      out.replaceChildren(node('p', brand), node('p', menu || u('unknown')));
      if (url) {
        const a = node('a', url);
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener';
        out.append(a);
      }
    };
    select.addEventListener('change', update);
    d.append(select, out);
    update();
    p.append(d);
  }
  async function direct(p, workout = false, phase = 'hypertrophy') {
    if (active) {
      await active.disconnect();
      active = null;
    }
    p.replaceChildren();
    const part = card(workout ? c('live') : u('direct'));
    p.append(part);
    guide(part);
    if (!native() && !navigator.bluetooth) {
      part.append(node('p', c('unsupported')));
      return;
    }
    await consent(
      part,
      'ble',
      workout ? ['heart_rate'] : ['heart_rate', 'hrv', 'spo2'],
      async scopes => {
        await request('native_connect', 'ble', {
          scopes,
          consent_version: CONSENT,
          device_label: 'Bluetooth'
        });
        mountScanner(part, scopes, workout, phase);
      }
    );
  }
  function mountScanner(p, scopes, workout, phase) {
    p.dataset.universalState = 'scanner';
    const uid = owner(),
      n = native(),
      key = userScopedKey('vitalia_ble_device_v1', uid);
    const adapter = VitaliaBLE.create({
      native: n?.BleClient || null,
      session: n?.Session || null,
      remember: d => vitaliaStorageSet(key, d),
      recall: () => vitaliaStorageGet(key, null)
    });
    active = adapter;
    const s = status(p),
      list = node('div'),
      live = node('div'),
      unsupported = node('p');
    unsupported.hidden = true;
    p.append(list, unsupported, live);
    const rememberLabel = node('label'),
      remember = node('input');
    remember.type = 'checkbox';
    remember.checked = true;
    rememberLabel.append(remember, document.createTextNode(u('remember')));
    p.append(rememberLabel);
    remember.addEventListener('change', () => {
      if (!remember.checked) vitaliaStorageRemove(key);
    });
    const devices = new Map();
    const connectDevice = async device => {
      s.textContent = c('connecting');
      try {
        await adapter.connect(device);
        if (!remember.checked) vitaliaStorageRemove(key);
      } catch (e) {
        s.textContent = errorText(e);
      }
    };
    const sensor = {
      device: null,
      battery: null,
      last: null,
      monitor: null,
      workout: null,
      nativeSummary: null,
      started: 0,
      busy: false,
      timer: null,
      wake: null
    };
    const readings = node('div'),
      info = node('p'),
      metrics = node('p'),
      bpm = node('div', '— bpm', 'connect-bpm'),
      zoneText = node('p'),
      lastReading = node('p');
    live.append(info, metrics, bpm, zoneText, lastReading, readings);
    let monitorButton;
    const age = Number(APP.profile?.age) || null,
      cadence = new VitaliaGatt.Cadence(),
      plot = [];
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 300 90');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', c('heart_rate'));
    const line = document.createElementNS(svg.namespaceURI, 'polyline');
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', '#54ed89');
    line.setAttribute('stroke-width', '2');
    svg.append(line);
    if (workout) {
      live.append(node('p', c(age ? 'estimate' : 'unknown_age')), svg);
    }
    function showBpm(value) {
      if (!scopes.includes('heart_rate') || !Number.isFinite(value)) return;
      bpm.textContent = value + ' bpm';
      lastReading.textContent = new Intl.DateTimeFormat(APP.lang, {
        timeStyle: 'medium',
        timeZone: zone()
      }).format(new Date());
      const z = VitaliaBle.zone(value, age);
      zoneText.textContent = workout && z ? c('zone') + ' ' + z : '';
      const now = Date.now();
      plot.push({ at: now, bpm: value });
      while (plot.length && plot[0].at < now - 60000) plot.shift();
      line.setAttribute(
        'points',
        plot.map(s => (s.at - now + 60000) / 200 + ',' + (85 - ((s.bpm - 25) / 225) * 80)).join(' ')
      );
    }
    adapter.onReading(event => {
      if (uid !== owner() || !p.isConnected) {
        adapter.disconnect();
        clearInterval(sensor.timer);
        return;
      }
      if (event.kind === 'device') {
        devices.set(event.device.id, event.device);
        list.replaceChildren();
        for (const d of devices.values())
          button(
            list,
            (d.name || 'BLE') +
              ' · ' +
              (d.rssi == null ? u('signal') : d.rssi + ' dBm') +
              (d.services.length ? ' · ' + capabilities(d.services).join(' · ') : ''),
            () => connectDevice(d)
          );
      }
      if (event.kind === 'connected') {
        const hasLive = event.device?.services.some(v =>
          [VitaliaGatt.uuid(0x180d), VitaliaGatt.uuid(0x1822)].includes(v)
        );
        unsupported.hidden = !!hasLive;
        unsupported.textContent = hasLive ? '' : u('no_live');
        if (event.device) sensor.device = event.device;
        s.textContent = c('active');
        if (sensor.device)
          info.textContent =
            sensor.device.name + ' · ' + capabilities(sensor.device.services).join(' · ');
        if (monitorButton)
          monitorButton.disabled =
            sensor.busy ||
            !sensor.device?.services.some(v =>
              [VitaliaGatt.uuid(0x180d), VitaliaGatt.uuid(0x1822)].includes(v)
            );
      }
      if (event.kind === 'disconnected') {
        s.textContent = event.retrying ? c('connecting') : c('revoked');
        bpm.textContent = '— bpm';
        sensor.monitor?.add({ contact: false });
        if (!event.retrying && monitorButton) monitorButton.disabled = true;
      }
      if (event.kind === 'battery') {
        sensor.battery = event.percent;
        metrics.textContent = u('battery') + ': ' + event.percent + '%';
      }
      if (event.kind === 'information')
        info.textContent = [sensor.device?.name, event.manufacturer, event.model]
          .filter(Boolean)
          .join(' · ');
      if (event.kind === 'running')
        readings.textContent =
          u('running') +
          ': ' +
          event.speed_mps.toFixed(2) +
          ' m/s · ' +
          event.cadence_spm +
          ' /min';
      if (event.kind === 'cycling_power' || event.kind === 'cycling_cadence') {
        const rpm = cadence.add(event);
        readings.textContent =
          u('cycling') +
          ': ' +
          (event.watts != null ? event.watts + ' W ' : '') +
          (rpm != null ? Math.round(rpm) + ' rpm' : '');
      }
      if (event.kind === 'native_summary') {
        sensor.nativeSummary = event.summary;
        showBpm(event.summary?.bpm);
        if (event.stopped) finish();
        return;
      }
      if (event.kind === 'heart_rate' || event.kind === 'oximeter') {
        const d = event.kind === 'oximeter' ? { bpm: event.pulse, spo2: event.spo2 } : event;
        if (d.contact === false) return;
        sensor.last = d;
        showBpm(d.bpm);
        if (d.spo2 != null && scopes.includes('spo2'))
          readings.textContent = 'SpO₂ ' + d.spo2 + '%';
        sensor.monitor?.add({
          bpm: scopes.includes('heart_rate') ? d.bpm : undefined,
          rr: scopes.includes('hrv') ? d.rr || [] : [],
          spo2: scopes.includes('spo2') ? d.spo2 : undefined,
          contact: d.contact
        });
        if (sensor.workout) {
          const packet = new DataView(Uint8Array.from([0, d.bpm]).buffer);
          sensor.workout.add(packet);
        }
      }
    });
    const scan = button(
      p,
      u('scan'),
      async () => {
        scan.disabled = true;
        s.textContent = u('scan') + '…';
        try {
          await adapter.scan();
          s.textContent = u('select');
        } catch (e) {
          s.textContent = errorText(e);
        } finally {
          scan.disabled = false;
        }
      },
      true
    );
    const saved = vitaliaStorageGet(key, null);
    if (saved) button(p, u('restore'), () => connectDevice(saved));
    const durationLabel = node('label', u('minutes')),
      duration = node('select', null, 'universal-select');
    duration.setAttribute('aria-label', u('minutes'));
    for (let i = 1; i <= 5; i++) {
      const o = node('option', i + ' min');
      o.value = String(i);
      duration.append(o);
    }
    duration.value = '2';
    durationLabel.append(duration);
    if (!workout) p.append(durationLabel);
    const progress = node('p');
    p.append(progress);
    if (n) p.append(node('p', u('notification')));
    monitorButton = button(
      p,
      workout ? c('live') : u('monitor'),
      async () => {
        if (sensor.busy || !sensor.device) return;
        sensor.busy = true;
        p.dataset.universalState = 'live';
        monitorButton.disabled = true;
        scan.disabled = true;
        duration.disabled = true;
        sensor.started = Date.now();
        sensor.monitor = new VitaliaMonitor.Monitor();
        sensor.workout = workout ? new VitaliaBle.Session(Number(APP.profile?.age) || null) : null;
        const seconds = workout ? 14400 : Number(duration.value) * 60;
        try {
          await adapter.startSession({
            owner: uid,
            seconds,
            scopes,
            age,
            title: 'VitalIA',
            description: u('background'),
            stop: u('stop')
          });
          if (!n && navigator.wakeLock)
            try {
              sensor.wake = await navigator.wakeLock.request('screen');
            } catch {}
          s.textContent = u('measuring');
          sensor.timer = setInterval(() => {
            if (uid !== owner()) {
              adapter.disconnect();
              clearInterval(sensor.timer);
              return;
            }
            progress.textContent =
              c('duration') + ': ' + Math.floor((Date.now() - sensor.started) / 1000) + ' s';
            if (Date.now() - sensor.started >= seconds * 1000) finish();
          }, 1000);
        } catch (e) {
          sensor.busy = false;
          s.textContent = errorText(e);
          monitorButton.disabled = false;
          scan.disabled = false;
          duration.disabled = false;
        }
      },
      true
    );
    monitorButton.disabled = true;
    let finishing = false;
    async function finish() {
      if (finishing || !sensor.busy) return;
      finishing = true;
      clearInterval(sensor.timer);
      if (n)
        try {
          sensor.nativeSummary = await adapter.snapshot({ owner: uid });
        } catch {}
      await adapter.disconnect();
      sensor.wake?.release().catch(() => {});
      const summary = n
        ? sensor.nativeSummary
        : workout
          ? sensor.workout?.summary()
          : sensor.monitor?.summary();
      if (!summary) {
        s.textContent = u('no_measurement');
        return;
      }
      const box = card(c('summary'));
      box.dataset.universalState = 'summary';
      p.append(box);
      box.append(node('p', c('duration') + ': ' + summary.duration_seconds + ' s'));
      for (const [label, value, unit] of [
        [
          workout ? c('average') : c('resting'),
          workout ? summary.hr_avg : summary.resting_hr,
          'bpm'
        ],
        ['HRV (RMSSD)', summary.hrv_rmssd_ms, 'ms'],
        ['SpO₂', summary.spo2_avg, '%']
      ])
        if (value != null) box.append(node('p', label + ': ' + value + ' ' + unit));
      if (summary.hrv_rmssd_ms == null && !workout) box.append(node('p', u('no_rr')));
      if (workout) {
        if (summary.hr_max != null)
          box.append(node('p', c('maximum') + ': ' + summary.hr_max + ' bpm'));
        (summary.zones_seconds || []).forEach((seconds, i) =>
          box.append(node('p', c('zone') + ' ' + (i + 1) + ': ' + seconds + ' s'))
        );
      }
      const daily = {};
      for (const [k, scope] of [
        ['resting_hr', 'heart_rate'],
        ['hrv_rmssd_ms', 'hrv'],
        ['spo2_avg', 'spo2']
      ])
        if (
          scopes.includes(scope) &&
          summary[k] != null &&
          (k !== 'hrv_rmssd_ms' || (summary[k] >= 1 && summary[k] <= 300))
        )
          daily[k] = summary[k];
      const valid = workout ? summary.sample_count > 0 : Object.keys(daily).length > 0;
      if (!valid) {
        box.append(node('p', u('no_measurement')));
        return;
      }
      const result = status(box),
        id = crypto.randomUUID();
      let savedWorkout = false;
      const save = button(
        box,
        c('save'),
        async () => {
          save.disabled = true;
          result.textContent = c('saving');
          try {
            if (uid !== owner()) throw Error('account_changed');
            const day = VitaliaDaily.dateKey(new Date(), zone());
            if (workout) {
              if (!savedWorkout) {
                const row = {
                  id,
                  user_id: uid,
                  session_date: day,
                  phase,
                  duration_min: Math.max(1, Math.round(summary.duration_seconds / 60)),
                  total_sets: 0,
                  exercises: [
                    {
                      kind: 'ble_hr_summary',
                      duration_seconds: summary.duration_seconds,
                      sample_count: summary.sample_count,
                      hr_avg: summary.hr_avg,
                      hr_min: summary.hr_min,
                      hr_max: summary.hr_max,
                      zones_seconds: summary.zones_seconds || [],
                      estimated: true
                    }
                  ]
                };
                const r = await getVitaliaSupabaseClient()
                  .from('athlete_logs')
                  .upsert(row, { onConflict: 'id' });
                if (r.error) throw r.error;
                savedWorkout = true;
              }
              await request('ingest_daily', 'ble_hr', {
                timezone: zone(),
                rows: [
                  { day, hr_avg: summary.hr_avg, hr_min: summary.hr_min, hr_max: summary.hr_max }
                ]
              });
            } else
              await request('native_snapshot', 'ble', {
                day,
                timezone: zone(),
                captured_at: new Date().toISOString(),
                daily,
                origins: [sensor.device.id],
                sleep: []
              });
            result.textContent = c('saved');
            VitaliaDaily.refresh();
          } catch (e) {
            result.textContent = errorText(e);
            save.disabled = false;
          }
        },
        true
      );
    }
    button(p, u('stop'), finish);
    button(p, c('disconnect'), async () => {
      if (sensor.busy) await finish();
      else await adapter.disconnect();
    });
    if (saved) connectDevice(saved);
  }
  function mountAthlete(main, phase) {
    if (document.getElementById('connect-ble')) return;
    const p = node('section');
    p.id = 'connect-ble';
    main.prepend(p);
    const box = card(c('live'));
    p.append(box);
    button(box, c('sensor'), () => direct(box, true, phase), true);
  }
  let autoBusy = false;
  async function autosync() {
    if (
      !native() ||
      autoBusy ||
      hcBusy ||
      !owner() ||
      document.hidden ||
      navigator.onLine === false ||
      !vitaliaStorageGet(bindingKey('health_connect'), null)
    )
      return;
    const key = userScopedKey('vitalia_hc_last_attempt_v1', owner()),
      last = vitaliaStorageGet(key, 0);
    if (Date.now() - last < 1800000) return;
    autoBusy = true;
    vitaliaStorageSet(key, Date.now());
    try {
      const uid = owner(),
        r = await getVitaliaSupabaseClient()
          .from('device_connections')
          .select('scopes,status,consented_at')
          .eq('user_id', uid)
          .eq('connector', 'health_connect')
          .maybeSingle();
      if (
        !r.error &&
        r.data?.status === 'active' &&
        uid === owner() &&
        Date.parse(r.data.consented_at) ===
          Date.parse(vitaliaStorageGet(bindingKey('health_connect'), null))
      )
        await bridge().sync(r.data.scopes);
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
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) autosync();
  });
  window.addEventListener('online', autosync);
  return {
    renderDevices,
    mountAthlete,
    originLabel,
    autosync,
    readableSections,
    sleepTime,
    summaryDate
  };
})();
