/* Bluetooth SIG standard GATT profiles. Pure decoders; no clinical interpretation. */
(function (root) {
  'use strict';
  const uuid = n => '0000' + n.toString(16).padStart(4, '0') + '-0000-1000-8000-00805f9b34fb';
  const SERVICES = {
    heart_rate: 0x180d,
    oximeter: 0x1822,
    battery: 0x180f,
    information: 0x180a,
    running: 0x1814,
    cycling_power: 0x1818,
    cycling_cadence: 0x1816
  };
  class Reader {
    constructor(value) {
      if (!(value instanceof DataView)) throw Error('invalid_packet');
      this.v = value;
      this.p = 0;
    }
    take(n) {
      if (this.p + n > this.v.byteLength) throw Error('truncated');
      const p = this.p;
      this.p += n;
      return p;
    }
    u8() {
      return this.v.getUint8(this.take(1));
    }
    u16() {
      return this.v.getUint16(this.take(2), true);
    }
    i16() {
      return this.v.getInt16(this.take(2), true);
    }
    u32() {
      return this.v.getUint32(this.take(4), true);
    }
    skip(n) {
      this.take(n);
    }
  }
  function sfloat(n) {
    const m = n & 0xfff;
    if ([0x7fe, 0x7ff, 0x800, 0x801, 0x802].includes(m)) return null;
    const exponent = (n >> 12) & 15;
    return (m & 0x800 ? m - 4096 : m) * 10 ** (exponent & 8 ? exponent - 16 : exponent);
  }
  function safe(fn) {
    return value => {
      try {
        return fn(new Reader(value));
      } catch {
        return null;
      }
    };
  }
  const oximeter = continuous =>
    safe(r => {
      const flags = r.u8(),
        spo2 = sfloat(r.u16()),
        pulse = sfloat(r.u16());
      if (spo2 === null || pulse === null || spo2 < 70 || spo2 > 100 || pulse < 25 || pulse > 250)
        return null;
      const out = { kind: 'oximeter', spo2, pulse };
      if (continuous) {
        if (flags & 1) r.skip(4);
        if (flags & 2) r.skip(4);
        if (flags & 4) out.measurementStatus = r.u16();
        if (flags & 8) r.skip(3);
        if (flags & 16) r.skip(2);
      } else {
        if (flags & 1) r.skip(7);
        if (flags & 2) out.measurementStatus = r.u16();
        if (flags & 4) r.skip(3);
        if (flags & 8) r.skip(2);
      }
      return out;
    });
  const running = safe(r => {
    const flags = r.u8(),
      speed = r.u16() / 256,
      cadence = r.u8();
    const out = { kind: 'running', speed_mps: speed, cadence_spm: cadence, running: !!(flags & 4) };
    if (flags & 1) out.stride_m = r.u16() / 100;
    if (flags & 2) out.distance_m = r.u32() / 10;
    return out;
  });
  const cycling = safe(r => {
    const flags = r.u8(),
      out = { kind: 'cycling_cadence' };
    if (flags & 1) {
      out.wheel_revolutions = r.u32();
      out.wheel_time = r.u16();
    }
    if (flags & 2) {
      out.crank_revolutions = r.u16();
      out.crank_time = r.u16();
    }
    return out;
  });
  const power = safe(r => {
    const flags = r.u16(),
      out = { kind: 'cycling_power', watts: r.i16() };
    if (flags & 1) r.skip(1);
    if (flags & 4) r.skip(2);
    if (flags & 16) {
      out.wheel_revolutions = r.u32();
      out.wheel_time = r.u16();
    }
    if (flags & 32) {
      out.crank_revolutions = r.u16();
      out.crank_time = r.u16();
    }
    for (const [bit, length] of [
      [6, 4],
      [7, 4],
      [8, 3],
      [9, 2],
      [10, 2],
      [11, 2]
    ])
      if (flags & (1 << bit)) r.skip(length);
    return out;
  });
  const battery = safe(r => {
    const level = r.u8();
    return level <= 100 && r.v.byteLength === 1 ? { kind: 'battery', percent: level } : null;
  });
  function information(value) {
    try {
      if (!(value instanceof DataView) || value.byteLength > 120) return null;
      const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      return new TextDecoder('utf-8', { fatal: true })
        .decode(bytes)
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .trim();
    } catch {
      return null;
    }
  }
  class Cadence {
    constructor() {
      this.last = null;
    }
    add(reading) {
      let rpm = null;
      const old = this.last;
      this.last = reading;
      if (old && reading.crank_time != null && old.crank_time != null) {
        const ticks = (reading.crank_time - old.crank_time + 65536) % 65536,
          revs = (reading.crank_revolutions - old.crank_revolutions + 65536) % 65536;
        if (ticks && revs <= 20) {
          const n = (revs * 60 * 1024) / ticks;
          if (n <= 250) rpm = n;
        }
      }
      return rpm;
    }
  }
  root.VitaliaGatt = {
    uuid,
    SERVICES,
    sfloat,
    battery,
    information,
    running,
    cycling,
    power,
    spot: oximeter(false),
    continuous: oximeter(true),
    Cadence
  };
})(typeof window !== 'undefined' ? window : globalThis);
