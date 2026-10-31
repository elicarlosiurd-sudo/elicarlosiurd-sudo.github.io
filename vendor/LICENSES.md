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

- The optional selfie segmenter is restored from the official versioned model distribution; provenance, SHA-256 and model terms are recorded in `vendor/mediapipe/models/selfie_segmenter.source.json`.
- File: `vendor/mediapipe/models/selfie_segmenter.tflite`. It uses the existing Tasks Vision runtime and does not add a package dependency.

- File: `vendor/mediapipe/models/pose_landmarker_lite.task`
- License: Apache-2.0 / MediaPipe model distribution terms
- Source: https://developers.google.com/mediapipe

Total vendored size for Body Twin V1 was validated at about 14.91 MiB.

## Supabase JS

- Package: `@supabase/supabase-js`
- Version: `2.117.3` (the same version served by the former @2 CDN URL at audit time)
- Files: `vendor/supabase/supabase.js`, `vendor/supabase/LICENSE`
- License: MIT
- Pinned source/integrity: `vendor/supabase/source.json`
- Purpose: keep the existing SDK and auth APIs available in the verified PWA shell offline.

## Sora and Lora fonts

The existing Google Fonts faces are self-hosted without changing family, weight, style or display settings.
- License: SIL Open Font License 1.1 (`vendor/fonts/sora-OFL.txt`, `vendor/fonts/lora-OFL.txt`)
- Sources and SHA-256: `vendor/fonts/source.json`
