(function (root) {
  'use strict';
  const TYPES = {
    sleep: ['sleep'],
    heart_rate: ['heartRate', 'restingHeartRate'],
    hrv: ['heartRateVariability'],
    spo2: ['oxygenSaturation'],
    steps: ['steps']
  };
  function dateKey(value, z) {
    const p = new Intl.DateTimeFormat('en-CA', {
      timeZone: z,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date(value));
    return ['year', 'month', 'day'].map(k => p.find(v => v.type === k).value).join('-');
  }
  function sleepSessions(samples, day, z) {
    const unique = new Map();
    for (const s of samples) {
      if (!s.platformId || !s.sourceId || dateKey(s.endDate, z) !== day) continue;
      const start = Date.parse(s.startDate),
        end = Date.parse(s.endDate);
      if (!Number.isFinite(start) || end <= start || end - start > 86400000) continue;
      const segments = (s.stages || [])
        .filter(v => ['asleep', 'awake', 'rem', 'deep', 'light'].includes(v.stage))
        .map(v => ({
          stage: v.stage === 'awake' ? 'wake' : v.stage,
          start: v.startDate,
          end: v.endDate
        }));
      const asleep = segments.length
        ? segments
            .filter(v => v.stage !== 'wake')
            .reduce((n, v) => n + (Date.parse(v.end) - Date.parse(v.start)) / 60000, 0)
        : Number(s.value);
      const key = s.sourceId + ':' + s.platformId;
      unique.set(key, {
        external_id: key,
        start_at: s.startDate,
        end_at: s.endDate,
        stages: {
          segments,
          summary: {
            minutes_asleep: Math.round(Math.max(0, Math.min((end - start) / 60000, asleep)))
          }
        },
        origin: s.sourceId
      });
    }
    const ordered = [...unique.values()].sort(
      (a, b) =>
        Date.parse(b.end_at) -
          Date.parse(b.start_at) -
          (Date.parse(a.end_at) - Date.parse(a.start_at)) ||
        b.stages.segments.length - a.stages.segments.length ||
        a.external_id.localeCompare(b.external_id)
    );
    const accepted = [];
    for (const s of ordered)
      if (
        !accepted.some(
          v =>
            Date.parse(s.start_at) < Date.parse(v.end_at) &&
            Date.parse(s.end_at) > Date.parse(v.start_at)
        )
      )
        accepted.push(s);
    return accepted;
  }
  function measured(samples) {
    const groups = new Map();
    for (const s of samples) {
      if (!s.sourceId || !Number.isFinite(s.value)) continue;
      const group = groups.get(s.sourceId) || new Map();
      group.set(s.platformId || s.startDate, s);
      groups.set(s.sourceId, group);
    }
    return (
      [...groups].sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]))[0]?.[1] ||
      new Map()
    );
  }
  function create({
    health,
    changes,
    request,
    owner,
    timezone,
    now = () => new Date(),
    wallInstant,
    onProgress = () => {}
  }) {
    let busy = false;
    const readTypes = scopes => [...new Set(scopes.flatMap(s => TYPES[s] || []))];
    async function permissions(scopes, prompt = false) {
      const read = readTypes(scopes),
        r = await health[prompt ? 'requestAuthorization' : 'checkAuthorization']({
          read,
          write: [],
          requestHistoryAccess: false
        });
      if (read.some(s => !r.readAuthorized?.includes(s))) throw Error('permission_denied');
      return r;
    }
    async function connect(scopes) {
      const uid = owner();
      if (!(await health.isAvailable()).available) throw Error('health_unavailable');
      await permissions(scopes, true);
      if (uid !== owner()) throw Error('account_changed');
      await request('native_connect', 'health_connect', {
        scopes,
        consent_version: 'connect-proposal-p5-2026-11-01',
        device_label: 'Health Connect'
      });
      return sync(scopes);
    }
    async function sync(scopes) {
      if (busy) return;
      busy = true;
      const uid = owner(),
        z = timezone();
      try {
        await permissions(scopes);
        const selected = scopes.flatMap(s =>
          s === 'heart_rate' ? ['heart_rate', 'resting_hr'] : [s]
        );
        const plan = await changes.plan({ owner: uid, scopes: selected, timezone: z });
        for (let i = 0; i < plan.days.length; i++) {
          if (uid !== owner()) throw Error('account_changed');
          await permissions(scopes);
          const day = plan.days[i],
            next = new Date(day + 'T12:00:00Z');
          next.setUTCDate(next.getUTCDate() + 1);
          const startDate = wallInstant(day + 'T00:00', z),
            endDate = new Date(
              Math.min(
                Date.parse(wallInstant(next.toISOString().slice(0, 10) + 'T00:00', z)),
                now().getTime()
              )
            ).toISOString();
          const daily = {},
            origins = new Set(),
            originNames = {},
            sleep = [];
          let heart = null,
            restingEstimate = null;
          if (scopes.includes('steps')) {
            const r = await health.queryAggregated({
              dataType: 'steps',
              startDate,
              endDate,
              bucket: 'day',
              aggregation: 'sum'
            });
            if (r.samples?.length)
              daily.steps = r.samples.reduce((n, s) => n + Number(s.values?.sum ?? s.value), 0);
          }
          if (scopes.includes('sleep')) {
            const r = await health.readSamples({
              dataType: 'sleep',
              startDate: new Date(Date.parse(startDate) - 86400000).toISOString(),
              endDate,
              limit: 1000,
              ascending: true
            });
            if (r.samples?.length >= 1000) throw Error('health_page_limit');
            for (const sample of r.samples || [])
              if (sample.sourceId && sample.sourceName)
                originNames[sample.sourceId] = sample.sourceName;
            for (const s of sleepSessions(r.samples || [], day, z)) {
              origins.add(s.origin);
              const { origin, ...session } = s;
              sleep.push(session);
            }
            if (sleep.length)
              daily.sleep_minutes = sleep.reduce((n, s) => n + s.stages.summary.minutes_asleep, 0);
          }
          if (scopes.includes('heart_rate')) {
            if (changes.dailyHeartSummary) {
              const sleepWindows = sleep.flatMap(s =>
                s.stages.segments.length
                  ? s.stages.segments
                      .filter(v => v.stage !== 'wake')
                      .map(v => ({ start: v.start, end: v.end }))
                  : [{ start: s.start_at, end: s.end_at }]
              );
              heart = await changes.dailyHeartSummary({
                owner: uid,
                startDate,
                endDate,
                sleepWindows
              });
              for (const k of ['hr_avg', 'hr_min', 'hr_max'])
                if (Number.isFinite(heart.daily?.[k])) daily[k] = heart.daily[k];
              for (const origin of heart.origins || []) origins.add(origin);
            } else {
              const r = await health.queryAggregated({
                dataType: 'heartRate',
                startDate,
                endDate,
                bucket: 'day',
                aggregation: ['average', 'min', 'max']
              });
              if (r.samples?.length) {
                let weighted = 0,
                  seconds = 0;
                for (const s of r.samples) {
                  if (Number.isFinite(s.values?.average)) {
                    const span = Math.max(
                      1,
                      (Date.parse(s.endDate) - Date.parse(s.startDate)) / 1000
                    );
                    weighted += s.values.average * span;
                    seconds += span;
                  }
                }
                if (seconds) daily.hr_avg = Math.round(weighted / seconds);
                const mins = r.samples.map(s => s.values?.min).filter(Number.isFinite),
                  maxs = r.samples.map(s => s.values?.max).filter(Number.isFinite);
                if (mins.length) daily.hr_min = Math.min(...mins);
                if (maxs.length) daily.hr_max = Math.max(...maxs);
              }
            }
          }
          for (const [scope, type, key] of [
            ['heart_rate', 'restingHeartRate', 'resting_hr'],
            ['hrv', 'heartRateVariability', 'hrv_rmssd_ms'],
            ['spo2', 'oxygenSaturation', 'spo2_avg']
          ])
            if (scopes.includes(scope)) {
              const r = await health.readSamples({
                dataType: type,
                startDate,
                endDate,
                limit: 10000,
                ascending: true
              });
              if (r.samples?.length >= 10000) throw Error('health_page_limit');
              for (const sample of r.samples || [])
                if (sample.sourceId && sample.sourceName)
                  originNames[sample.sourceId] = sample.sourceName;
              const values = [...measured(r.samples || []).values()];
              if (values.length) {
                values.forEach(v => origins.add(v.sourceId));
                const mean = values.reduce((n, v) => n + v.value, 0) / values.length;
                daily[key] = key === 'spo2_avg' ? Math.round(mean * 10) / 10 : Math.round(mean);
              }
            }
          if (daily.resting_hr == null && heart?.resting_estimate) {
            restingEstimate = heart.resting_estimate;
            daily.resting_hr = restingEstimate.value;
          }
          if (changes.sourceNames && origins.size) {
            try {
              const resolved = await changes.sourceNames({ owner: uid, packages: [...origins] });
              for (const [id, name] of Object.entries(resolved.names || {}))
                if (name !== id) originNames[id] = name;
            } catch {}
          }
          for (const id of Object.keys(originNames)) if (!origins.has(id)) delete originNames[id];
          if (!origins.size && (Object.keys(daily).length || sleep.length))
            origins.add('android.healthconnect');
          if (uid !== owner()) throw Error('account_changed');
          await request('native_snapshot', 'health_connect', {
            day,
            timezone: z,
            captured_at: now().toISOString(),
            origins: [...origins],
            origin_names: originNames,
            ...(restingEstimate ? { resting_hr_estimate: restingEstimate } : {}),
            daily,
            sleep
          });
          onProgress(i + 1, plan.days.length);
        }
        if (uid !== owner()) throw Error('account_changed');
        await changes.commit({ owner: uid, plan_id: plan.plan_id });
        return { days: plan.days.length };
      } finally {
        busy = false;
      }
    }
    return {
      connect,
      sync,
      permissions,
      disconnect: () => request('disconnect', 'health_connect'),
      delete: async () => {
        await request('delete_source', 'health_connect');
        await changes.forget({ owner: owner() });
      }
    };
  }
  root.VitaliaHealthBridge = { create, sleepSessions, measured, dateKey, TYPES };
})(typeof window !== 'undefined' ? window : globalThis);
