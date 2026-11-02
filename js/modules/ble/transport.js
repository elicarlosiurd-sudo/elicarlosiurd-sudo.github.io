/* A single transport API. Web exposes the browser chooser; RSSI is native-only. */
(function (root) {
  'use strict';
  const G = () => root.VitaliaGatt,
    hr = () => root.VitaliaBle;
  function create({
    native = null,
    bluetooth = typeof navigator !== 'undefined' ? navigator.bluetooth : null,
    remember = () => {},
    recall = () => null,
    session = null,
    sleep = ms => new Promise(r => setTimeout(r, ms)),
    scanMs = 8000
  } = {}) {
    const listeners = new Set(),
      devices = new Map(),
      subscriptions = [];
    let current = null,
      stopped = true,
      reconnecting = false,
      epoch = 0,
      handoff = false,
      sessionListener = null;
    const emit = value => listeners.forEach(fn => fn(value));
    const services = () => Object.values(G().SERVICES).map(G().uuid);
    async function scan() {
      devices.clear();
      if (native) {
        await native.initialize({ androidNeverForLocation: true });
        // The paired FB050 may advertise only its proprietary UUIDs. Listing an
        // existing bond does not pair/unpair it or access those services.
        if (native.getBondedDevices) {
          try {
            for (const d of await native.getBondedDevices()) {
              if (!/FB050|Bettdow|e208/i.test(d.name || '')) continue;
              const item = { id: d.deviceId, name: d.name, rssi: null, services: [] };
              devices.set(item.id, item);
              emit({ kind: 'device', device: item });
            }
          } catch {}
        }
        try {
          await native.requestLEScan({ services: services(), allowDuplicates: false }, r => {
            const item = {
              id: r.device.deviceId,
              name: r.localName || r.device.name || 'BLE',
              rssi: Number.isFinite(r.rssi) ? r.rssi : null,
              services: r.uuids || []
            };
            devices.set(item.id, item);
            emit({ kind: 'device', device: item });
          });
          await sleep(scanMs);
        } finally {
          await native.stopLEScan();
        }
      } else {
        if (!bluetooth) throw Error('bluetooth_unavailable');
        const d = await bluetooth.requestDevice({
          filters: services().map(service => ({ services: [service] })),
          optionalServices: services()
        });
        const item = { id: d.id, name: d.name || 'BLE', rssi: null, services: [] };
        devices.set(d.id, { ...item, raw: d });
        emit({ kind: 'device', device: item });
      }
      return [...devices.values()].map(({ raw, ...d }) => d);
    }
    async function detach() {
      for (const stop of subscriptions.splice(0))
        try {
          await stop();
        } catch {}
    }
    async function subscribe(service, characteristic, decode) {
      const svc = G().uuid(service),
        char = G().uuid(characteristic),
        deliver = value => {
          if (stopped) return;
          const data = decode(value);
          if (data) emit(data);
        };
      if (native) {
        await native.startNotifications(current.id, svc, char, deliver);
        subscriptions.push(() => native.stopNotifications(current.id, svc, char));
      } else {
        const s = await current.gatt.getPrimaryService(svc),
          c = await s.getCharacteristic(char);
        const fn = e => deliver(e.target.value);
        c.addEventListener('characteristicvaluechanged', fn);
        await c.startNotifications();
        subscriptions.push(async () => {
          c.removeEventListener('characteristicvaluechanged', fn);
          try {
            await c.stopNotifications();
          } catch {}
        });
      }
    }
    async function read(service, characteristic) {
      if (native) return native.read(current.id, G().uuid(service), G().uuid(characteristic));
      return (
        await (
          await current.gatt.getPrimaryService(G().uuid(service))
        ).getCharacteristic(G().uuid(characteristic))
      ).readValue();
    }
    async function establish() {
      const token = epoch;
      await detach();
      if (native) await native.connect(current.id, lost, { services: services() });
      else current.gatt = await current.raw.gatt.connect();
      if (token !== epoch || stopped) {
        if (native) await native.disconnect(current.id);
        else current.raw.gatt.disconnect();
        throw Error('cancelled');
      }
      const actual = native
        ? (await native.getServices(current.id)).map(s => s.uuid.toLowerCase())
        : (await current.gatt.getPrimaryServices()).map(s => s.uuid.toLowerCase());
      current.services = actual;
      const failures = [];
      for (const [svc, char, decoder] of [
        [
          0x180d,
          0x2a37,
          v => {
            const d = hr().decode(v);
            return d ? { kind: 'heart_rate', ...d } : null;
          }
        ],
        [0x1822, 0x2a5e, G().spot],
        [0x1822, 0x2a5f, G().continuous],
        [0x1814, 0x2a53, G().running],
        [0x1818, 0x2a63, G().power],
        [0x1816, 0x2a5b, G().cycling]
      ]) {
        if (!actual.includes(G().uuid(svc))) continue;
        try {
          await subscribe(svc, char, decoder);
        } catch {
          failures.push(G().uuid(char));
        }
      }
      if (actual.includes(G().uuid(0x180f)))
        try {
          const d = G().battery(await read(0x180f, 0x2a19));
          if (d) emit(d);
        } catch {
          failures.push('battery');
        }
      if (actual.includes(G().uuid(0x180a)))
        for (const [key, char] of [
          ['manufacturer', 0x2a29],
          ['model', 0x2a24]
        ])
          try {
            const value = G().information(await read(0x180a, char));
            if (value) emit({ kind: 'information', [key]: value });
          } catch {}
      if (token !== epoch || stopped) throw Error('cancelled');
      remember({ id: current.id, name: current.name, services: actual });
      emit({
        kind: 'connected',
        device: { id: current.id, name: current.name, services: actual },
        unavailable: failures
      });
    }
    async function lost() {
      if (stopped || reconnecting || handoff) return;
      reconnecting = true;
      const token = epoch;
      emit({ kind: 'disconnected', retrying: true });
      try {
        for (let i = 0; i < 4 && !stopped && token === epoch; i++) {
          await sleep(Math.min(1000 * 2 ** i, 8000));
          if (stopped || token !== epoch) return;
          try {
            await establish();
            return;
          } catch {}
        }
        if (!stopped) emit({ kind: 'disconnected', retrying: false });
      } finally {
        reconnecting = false;
      }
    }
    async function disconnect() {
      stopped = true;
      epoch++;
      await detach();
      if (current) {
        if (native)
          try {
            await native.disconnect(current.id);
          } catch {}
        else {
          current.raw.removeEventListener('gattserverdisconnected', lost);
          if (current.raw.gatt.connected) current.raw.gatt.disconnect();
        }
      }
      current = null;
      await session?.stop?.();
      await sessionListener?.remove?.();
      sessionListener = null;
      handoff = false;
      emit({ kind: 'disconnected', retrying: false });
    }
    async function connect(device) {
      await disconnect();
      if (native) await native.initialize({ androidNeverForLocation: true });
      const item = devices.get(device.id) || device;
      if (!item?.id) throw Error('device_required');
      current = { ...item };
      stopped = false;
      epoch++;
      if (!native) {
        if (!current.raw && bluetooth?.getDevices)
          current.raw = (await bluetooth.getDevices()).find(d => d.id === current.id);
        if (!current.raw) throw Error('device_permission_required');
        current.raw.addEventListener('gattserverdisconnected', lost);
      }
      try {
        await establish();
      } catch (e) {
        await disconnect();
        throw e;
      }
    }
    async function reconnectRemembered() {
      const d = recall();
      if (!d) return false;
      await connect(d);
      return true;
    }
    async function startSession(options) {
      if (!native || !session) return false;
      if (!current) throw Error('device_required');
      handoff = true;
      await detach();
      await native.disconnect(current.id);
      sessionListener = await session.addListener('reading', event => {
        if (event.kind === 'reading' || event.kind === 'stopped')
          emit({
            kind: 'native_summary',
            summary: event.summary,
            stopped: event.kind === 'stopped'
          });
        else emit({ kind: event.kind, retrying: event.kind === 'disconnected' });
      });
      try {
        await session.start({ ...options, device: current.id });
        return true;
      } catch (e) {
        handoff = false;
        throw e;
      }
    }
    return {
      scan,
      connect,
      subscribe,
      disconnect,
      onReading(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
      reconnectRemembered,
      startSession,
      snapshot: options => session?.snapshot?.(options),
      mode: native ? 'native' : 'web'
    };
  }
  root.VitaliaBLE = { create };
})(typeof window !== 'undefined' ? window : globalThis);
