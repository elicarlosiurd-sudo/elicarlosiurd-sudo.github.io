# Vendor Licenses

VitalIA Body Twin V1 vendors these browser-only assets so they can load under the app CSP without CDN runtime dependencies.

## Three.js

- Package: `three`
- Version: `0.184.0`
- File: `vendor/three/three.module.min.js`
- License: MIT
- Source: https://www.npmjs.com/package/three

## MediaPipe Tasks Vision

- Package: `@mediapipe/tasks-vision`
- Version: `0.10.8`
- Files:
  - `vendor/mediapipe/tasks-vision/vision_bundle.mjs`
  - `vendor/mediapipe/tasks-vision/wasm/vision_wasm_internal.js`
  - `vendor/mediapipe/tasks-vision/wasm/vision_wasm_internal.wasm`
- License: Apache-2.0
- Source: https://www.npmjs.com/package/@mediapipe/tasks-vision

## MediaPipe Pose Landmarker Lite Model

- File: `vendor/mediapipe/models/pose_landmarker_lite.task`
- License: Apache-2.0 / MediaPipe model distribution terms
- Source: https://developers.google.com/mediapipe

Total vendored size for Body Twin V1 was validated at about 14.91 MiB.
