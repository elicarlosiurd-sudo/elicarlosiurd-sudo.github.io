/* Local, bounded monitoring. RR values are never included in a summary. */
(function (root) {
  'use strict';
  class Monitor {
    constructor(clock = () => Date.now()) {
      this.clock = clock;
      this.started = clock();
      this.window = [];
      this.candidate = [];
      this.previous = null;
      this.beats = 0;
      this.rrSum = 0;
      this.diffSquared = 0;
      this.pairs = 0;
      this.rejected = 0;
      this.bpmSum = 0;
      this.bpmCount = 0;
      this.spo2Sum = 0;
      this.spo2Count = 0;
    }
    add({ bpm, rr = [], contact = null, spo2 }) {
      if (contact === false) {
        this.previous = null;
        this.window = [];
        this.candidate = [];
        return;
      }
      if (Number.isFinite(bpm) && bpm >= 25 && bpm <= 250) {
        this.bpmSum += bpm;
        this.bpmCount++;
      }
      if (Number.isFinite(spo2) && spo2 >= 70 && spo2 <= 100) {
        this.spo2Sum += spo2;
        this.spo2Count++;
      }
      for (const n of rr) {
        const mean = this.window.length
          ? this.window.reduce((a, b) => a + b, 0) / this.window.length
          : null;
        if (!Number.isFinite(n) || n < 300 || n > 2000) {
          this.rejected++;
          this.previous = null;
          this.candidate = [];
          continue;
        }
        if (mean !== null && Math.abs(n - mean) > mean * 0.2) {
          this.previous = null;
          if (this.candidate.some(v => Math.abs(n - v) > v * 0.1)) this.candidate = [];
          this.candidate.push(n);
          if (this.candidate.length < 5) {
            this.rejected++;
            continue;
          }
          this.window = this.candidate.slice(0, -1);
          this.candidate = [];
        } else this.candidate = [];
        if (this.previous !== null) {
          this.diffSquared += (n - this.previous) ** 2;
          this.pairs++;
        }
        this.previous = n;
        this.window.push(n);
        if (this.window.length > 5) this.window.shift();
        this.beats++;
        this.rrSum += n;
      }
    }
    summary() {
      const seconds = Math.min(300, Math.max(0, Math.floor((this.clock() - this.started) / 1000))),
        ready = seconds >= 60;
      return {
        duration_seconds: seconds,
        resting_hr: ready && this.bpmCount >= 20 ? Math.round(this.bpmSum / this.bpmCount) : null,
        hrv_rmssd_ms:
          ready && this.beats >= 30 && this.pairs >= 20
            ? Math.round(Math.sqrt(this.diffSquared / this.pairs))
            : null,
        spo2_avg:
          ready && this.spo2Count >= 10
            ? Math.round((this.spo2Sum / this.spo2Count) * 10) / 10
            : null,
        accepted_rr: this.beats,
        rejected_rr: this.rejected
      };
    }
  }
  root.VitaliaMonitor = { Monitor };
})(typeof window !== 'undefined' ? window : globalThis);
