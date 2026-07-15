const BT_VERSION = 'bodytwin-v179-safe-refinement-gate';
const BODYTWIN_HERO_FRONT_YAW = Math.PI;
// URLs resolvidas contra o MODULO (js/bodytwin.js), nunca contra a pagina —
// corrige o 404 em js/vendor/... no GitHub Pages.
const MODEL_URL = new URL('../vendor/mediapipe/models/pose_landmarker_lite.task', import.meta.url).href;
const SEGMENTER_MODEL_URL = new URL('../vendor/mediapipe/models/selfie_segmenter.task', import.meta.url).href;
const WASM_ROOT = new URL('../vendor/mediapipe/tasks-vision/wasm', import.meta.url).href;
const VISION_BUNDLE = new URL('../vendor/mediapipe/tasks-vision/vision_bundle.mjs', import.meta.url).href;
const BODYTWIN_NEON = 0x00aaff;
const BODYTWIN_NEON_CSS = '#00AAFF';
const BODYTWIN_GRID = 0x0066cc;
const BODYTWIN_ENABLE_GLB_UPGRADE = true;  // V137: GLB SDF mesh é o render principal
const BODYTWIN_ENABLE_PARAMETRIC_OVERLAY = false; // V147: legacy V146 overlay stays off unless explicitly re-enabled.
const BODYTWIN_ENABLE_MESH_SAMPLED_GRID = false; // V156: physical GLB wire is the grid; old technical overlays stay off.
const BODYTWIN_REFERENCE_COMPOSITION = true;

let poseLandmarker = null;
let imageSegmenter = undefined;
let lastResult = null;
let currentCaptureId = null;
let THREE = null;
let activeScene = null;
let poseDebugMode = false;

const GLB_CACHE = {};
// EARLY ASSIGNMENT — defesa contra truncação NTFS: função declarations são
// hoisted, então esta atribuição funciona mesmo sendo feita antes do corpo das funções.
// O bloco idêntico no final do arquivo sobrescreve, mas se o arquivo for truncado
// o botões continuam funcionando via esta cópia antecipada.
window.BodyTwin = {
  captureBodyImage,
  preprocessImage,
  detectPoseLandmarks,
  validateCapture,
  computeQualityScore,
  normalizeBodyPose,
  generateWireframeSkeleton,
  renderBodyTwin3D,
  disposeBodyTwin3D,
  saveBodySnapshot,
  listBodySnapshots: listBodySnapshotsV2,
  togglePoseDebugMode,
  compareBodySnapshot,
  deleteBodySnapshot: deleteBodySnapshotV2,
  deleteAllBodyTwinData: deleteAllBodyTwinDataV2,
  analyzeWithCoach,
  getLastResult: () => lastResult
};


const EDGES = [
  [11,12],[11,13],[13,15],[12,14],[14,16],
  [11,23],[12,24],[23,24],[23,25],[25,27],
  [24,26],[26,28],[27,31],[28,32],[0,11],[0,12]
];

// sb é declarado com 'let' no script principal — não vira window.sb.
// Usa bracket notation para não ser afetado por replace_all de 'window.sb'.
function getSb() {
  const direct = window['sb'];
  if (direct) return direct;
  try { return typeof sb !== 'undefined' ? sb : null; } catch (_) { return null; } // eslint-disable-line no-undef
}

function t(key) {
  try { return window.t ? window.t(key) : key; } catch (_) { return key; }
}

function toast(msg, type = 'info') {
  try { window.toast ? window.toast(msg, type, 3200) : console.log('[BodyTwin]', msg); } catch (_) {}
}

function root() {
  return document.getElementById('bodytwin-root');
}

function stage() {
  return document.getElementById('bodytwin-stage');
}

function setStatus(text) {
  const el = stage();
  if (el) el.innerHTML = `<div class="bodytwin-loading">${text}</div>`;
}

function appProfile() {
  return window.APP?.profile || window.APP?.userProfile || {};
}

async function ensurePoseLandmarker() {
  if (poseLandmarker) return poseLandmarker;
  setStatus('Calibrando seu Body Twin...');
  const vision = await import(VISION_BUNDLE);
  const resolver = await vision.FilesetResolver.forVisionTasks(WASM_ROOT);
  const buildOptions = (delegate) => ({
    baseOptions: { modelAssetPath: MODEL_URL, delegate },
    runningMode: 'IMAGE',
    numPoses: 1
  });
  try {
    poseLandmarker = await vision.PoseLandmarker.createFromOptions(resolver, buildOptions('GPU'));
  } catch (gpuErr) {
    console.warn('[BodyTwin] GPU delegate falhou, usando CPU:', gpuErr?.message || gpuErr);
    poseLandmarker = await vision.PoseLandmarker.createFromOptions(resolver, buildOptions('CPU'));
  }
  return poseLandmarker;
}

function captureBodyImage(source) {
  // source: 'camera' abre a camera direto; 'gallery' (default) abre arquivos/galeria
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/webp,image/png,image/*';
  if (source === 'camera') input.capture = 'environment';
  input.style.display = 'none';
  input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    input.remove();
    if (!file) return;
    try {
      await processBodyImage(file);
    } catch (err) {
      console.warn('[BodyTwin]', err);
      toast(err?.message || 'Falha ao calibrar o Body Twin.', 'error');
      setStatus(t('bodytwin_capture_hints'));
    }
  });
  document.body.appendChild(input);
  input.click();
}

async function processBodyImage(file) {
  setStatus('Processando no seu aparelho...');
  disposeBodyTwin3D();
  lastResult = null;
  const captureId = crypto?.randomUUID?.() || `bt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  currentCaptureId = captureId;
  const processed = await preprocessImage(file);
  if (currentCaptureId !== captureId) return null;
  const result = await detectPoseLandmarks(processed.image);
  if (currentCaptureId !== captureId) return null;
  const valid = validateCapture(result);
  const sourceLandmarks = valid.worldLandmarks || valid.landmarks;
  const normalized = normalizeBodyPose(sourceLandmarks);
  const quality = computeQualityScore(valid.landmarks);
  const silhouette = await buildSilhouetteMetrics(processed.image, valid.landmarks);
  if (currentCaptureId !== captureId) return null;
  const bodyProfile = applySilhouetteToProfile(estimateBodyProfile(normalized, appProfile()), silhouette);
  lastResult = {
    captureId,
    file: processed.blob,
    previewUrl: processed.previewUrl,
    landmarks: valid.landmarks,
    worldLandmarks: sourceLandmarks,
    normalized,
    bodyProfile,
    silhouette,
    quality
  };
  if (currentCaptureId === captureId) renderBodyTwinPreview(lastResult);
  return lastResult;
}

async function preprocessImage(file) {
  const bitmap = await createImageBitmap(file);
  const max = 1280;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  const image = await createImageBitmap(blob);
  return { blob, image, width, height, previewUrl: URL.createObjectURL(blob) };
}

async function detectPoseLandmarks(img) {
  const landmarker = await ensurePoseLandmarker();
  return landmarker.detect(img);
}

async function ensureImageSegmenter() {
  if (imageSegmenter !== undefined) return imageSegmenter;
  try {
    const exists = await fetch(SEGMENTER_MODEL_URL, { method: 'HEAD', cache: 'no-store' });
    if (!exists.ok) throw new Error('segmenter model missing');
    const vision = await import(VISION_BUNDLE);
    if (!vision.ImageSegmenter) throw new Error('ImageSegmenter unavailable in vendor bundle');
    const resolver = await vision.FilesetResolver.forVisionTasks(WASM_ROOT);
    imageSegmenter = await vision.ImageSegmenter.createFromOptions(resolver, {
      baseOptions: { modelAssetPath: SEGMENTER_MODEL_URL, delegate: 'CPU' },
      runningMode: 'IMAGE',
      outputCategoryMask: true,
      outputConfidenceMasks: false
    });
  } catch (err) {
    console.warn('[BodyTwin] Selfie/Image Segmenter indisponivel, usando silhueta canvas:', err?.message || err);
    imageSegmenter = null;
  }
  return imageSegmenter;
}


const BODY_WIDTH_LEVELS = [
  { key: 'head', label: 'Cabeca', y: 0.08 },
  { key: 'neck', label: 'Pescoco', y: 0.17 },
  { key: 'shoulders', label: 'Ombros', y: 0.24 },
  { key: 'chest', label: 'Peitoral', y: 0.32 },
  { key: 'upperAbdomen', label: 'Abdomen Alto', y: 0.42 },
  { key: 'belly', label: 'Barriga Maxima', y: 0.52 },
  { key: 'waist', label: 'Cintura/Short', y: 0.61 },
  { key: 'hip', label: 'Quadril', y: 0.68 },
  { key: 'upperThigh', label: 'Coxa Alta', y: 0.75 },
  { key: 'knee', label: 'Joelho', y: 0.83 },
  { key: 'calf', label: 'Panturrilha', y: 0.91 },
  { key: 'ankle', label: 'Tornozelo', y: 0.975 }
];

function landmarkPixelBounds(landmarks, width, height) {
  const visible = (landmarks || []).filter(p => Number(p?.visibility ?? 1) > 0.35);
  const xs = visible.map(p => clamp(p.x, 0, 1) * width);
  const ys = visible.map(p => clamp(p.y, 0, 1) * height);
  if (!xs.length || !ys.length) return { minX: width * 0.18, maxX: width * 0.82, minY: height * 0.04, maxY: height * 0.96 };
  const minX = Math.max(0, Math.min(...xs) - width * 0.16);
  const maxX = Math.min(width - 1, Math.max(...xs) + width * 0.16);
  const minY = Math.max(0, Math.min(...ys) - height * 0.05);
  const maxY = Math.min(height - 1, Math.max(...ys) + height * 0.07);
  return { minX, maxX, minY, maxY };
}

function estimateBackgroundColor(data, width, height) {
  const samples = [];
  const push = (x, y) => {
    const i = (y * width + x) * 4;
    samples.push([data[i], data[i + 1], data[i + 2]]);
  };
  const stepX = Math.max(1, Math.floor(width / 18));
  const stepY = Math.max(1, Math.floor(height / 18));
  for (let x = 0; x < width; x += stepX) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y += stepY) {
    push(0, y);
    push(width - 1, y);
  }
  const avg = [0, 1, 2].map(c => samples.reduce((sum, rgb) => sum + rgb[c], 0) / Math.max(1, samples.length));
  return avg;
}

function createFallbackSegmentationMask(image, landmarks) {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const src = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const out = ctx.createImageData(canvas.width, canvas.height);
  const bg = estimateBackgroundColor(src.data, canvas.width, canvas.height);
  const bounds = landmarkPixelBounds(landmarks, canvas.width, canvas.height);
  const cx = (bounds.minX + bounds.maxX) * 0.5;
  const halfW = Math.max(1, (bounds.maxX - bounds.minX) * 0.62);

  for (let y = 0; y < canvas.height; y += 1) {
    const y01 = (y - bounds.minY) / Math.max(1, bounds.maxY - bounds.minY);
    const verticalMask = y01 >= -0.03 && y01 <= 1.03;
    for (let x = 0; x < canvas.width; x += 1) {
      const i = (y * canvas.width + x) * 4;
      const dr = src.data[i] - bg[0];
      const dg = src.data[i + 1] - bg[1];
      const db = src.data[i + 2] - bg[2];
      const diff = Math.sqrt(dr * dr + dg * dg + db * db);
      const central = Math.abs(x - cx) / halfW;
      const roi = verticalMask && central < 1.18;
      const skinLike = src.data[i] > 82 && src.data[i + 1] > 45 && src.data[i] > src.data[i + 2] * 1.05;
      const darkCloth = src.data[i] + src.data[i + 1] + src.data[i + 2] < 145 && roi;
      const fg = roi && (diff > 30 || skinLike || darkCloth);
      out.data[i] = 255;
      out.data[i + 1] = 255;
      out.data[i + 2] = 255;
      out.data[i + 3] = fg ? 255 : 0;
    }
  }

  ctx.putImageData(out, 0, 0);
  smoothMaskAlpha(ctx, canvas.width, canvas.height);
  return canvas;
}

function smoothMaskAlpha(ctx, width, height) {
  const img = ctx.getImageData(0, 0, width, height);
  const src = new Uint8ClampedArray(img.data);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      let count = 0;
      for (let yy = -1; yy <= 1; yy += 1) {
        for (let xx = -1; xx <= 1; xx += 1) {
          const a = src[((y + yy) * width + (x + xx)) * 4 + 3];
          if (a > 120) count += 1;
        }
      }
      img.data[(y * width + x) * 4 + 3] = count >= 4 ? 255 : 0;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function extractBodyWidths(maskCanvas) {
  const ctx = maskCanvas?.getContext?.('2d');
  if (!ctx) return null;
  const { width, height } = maskCanvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  let minY = height, maxY = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] > 100) {
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        break;
      }
    }
  }
  if (minY >= maxY) return null;
  const levels = {};
  let maxWidth = 1;
  BODY_WIDTH_LEVELS.forEach(level => {
    const y = Math.round(minY + (maxY - minY) * level.y);
    let left = width, right = -1;
    const radius = Math.max(2, Math.round(height * 0.006));
    for (let yy = Math.max(0, y - radius); yy <= Math.min(height - 1, y + radius); yy += 1) {
      for (let x = 0; x < width; x += 1) {
        if (data[(yy * width + x) * 4 + 3] > 100) {
          left = Math.min(left, x);
          right = Math.max(right, x);
        }
      }
    }
    const px = right >= left ? right - left + 1 : 0;
    maxWidth = Math.max(maxWidth, px);
    levels[level.key] = { ...level, y, left, right, px };
  });
  Object.values(levels).forEach(level => {
    level.norm = clamp(level.px / maxWidth, 0.05, 1);
  });
  return { levels, maxWidth, minY, maxY, width, height };
}

async function buildSilhouetteMetrics(image, landmarks) {
  let maskCanvas = null;
  try {
    const segmenter = await ensureImageSegmenter();
    if (segmenter) {
      const result = segmenter.segment(image);
      const mask = result?.categoryMask;
      if (mask?.getAsUint8Array) {
        const values = mask.getAsUint8Array();
        const width = mask.width || image.width;
        const height = mask.height || image.height;
        maskCanvas = document.createElement('canvas');
        maskCanvas.width = width;
        maskCanvas.height = height;
        const ctx = maskCanvas.getContext('2d');
        const img = ctx.createImageData(width, height);
        for (let i = 0; i < values.length; i += 1) {
          const v = values[i] > 0 ? 255 : 0;
          img.data[i * 4] = 255;
          img.data[i * 4 + 1] = 255;
          img.data[i * 4 + 2] = 255;
          img.data[i * 4 + 3] = v;
        }
        ctx.putImageData(img, 0, 0);
        mask?.close?.();
      }
    }
  } catch (err) {
    console.warn('[BodyTwin] segmentacao MediaPipe falhou, usando fallback:', err?.message || err);
  }
  if (!maskCanvas) maskCanvas = createFallbackSegmentationMask(image, landmarks);
  const widths = extractBodyWidths(maskCanvas);
  if (!widths) return null;
  return { maskCanvas, widths, source: imageSegmenter ? 'mediapipe-segmentation-v132' : 'canvas-silhouette-v132' };
}

function silhouetteNorm(widths, key, fallback = 0.5) {
  return clamp(Number(widths?.levels?.[key]?.norm || fallback), 0.05, 1);
}

function applySilhouetteToProfile(profile, silhouette) {
  if (!profile || !silhouette?.widths?.levels) return profile;
  const p = { ...profile };
  const widths = silhouette.widths;
  const shoulder = silhouetteNorm(widths, 'shoulders', 0.82);
  const chest = silhouetteNorm(widths, 'chest', shoulder * 0.92);
  const upperAbdomen = silhouetteNorm(widths, 'upperAbdomen', chest);
  const belly = silhouetteNorm(widths, 'belly', upperAbdomen);
  const waist = silhouetteNorm(widths, 'waist', belly * 0.94);
  const hip = silhouetteNorm(widths, 'hip', waist * 0.92);
  const upperThigh = silhouetteNorm(widths, 'upperThigh', hip * 0.58);
  const calf = silhouetteNorm(widths, 'calf', upperThigh * 0.45);
  const ankle = silhouetteNorm(widths, 'ankle', calf * 0.55);
  const base = Math.max(0.01, shoulder);

  p.shoulderW = clamp((p.shoulderW || 1) * (0.72 + shoulder / base * 0.28), 0.70, 1.70);
  p.chestW = clamp(p.shoulderW * (chest / base), p.shoulderW * 0.68, p.shoulderW * 1.18);
  p.waistW = clamp(p.shoulderW * Math.max(upperAbdomen, belly, waist) / base, p.hipW * 0.92, p.shoulderW * 1.42);
  p.hipW = clamp(p.shoulderW * Math.max(hip, waist * 0.92) / base, p.shoulderW * 0.62, p.shoulderW * 1.26);
  p.thighR = clamp((p.hipW * 0.10) * Math.max(0.8, upperThigh / Math.max(hip, 0.01) * 1.45), p.hipW * 0.075, p.hipW * 0.18);
  p.calfR = clamp(p.thighR * Math.max(0.52, calf / Math.max(upperThigh, 0.01) * 1.18), p.thighR * 0.48, p.thighR * 0.86);
  p.forearmR = clamp((p.forearmR || p.upperArmR * 0.78) * (1 + Math.max(0, shoulder - chest) * 0.20), p.upperArmR * 0.66, p.upperArmR * 0.92);
  const bellyDominance = clamp((belly - Math.min(chest, hip)) / Math.max(base, 0.01), 0, 0.42);
  p.silhouetteWidths = widths;
  p.bodyShape = {
    ...(p.bodyShape || {}),
    silhouetteDriven: true,
    endomorph01: clamp(Math.max(Number(p.bodyShape?.endomorph01 || 0), bellyDominance * 2.4), 0, 1),
    abdomenScale: clamp(1 + bellyDominance * 1.55 + Math.max(0, belly / Math.max(hip, 0.01) - 1) * 0.42, 1, 1.70),
    chestScale: clamp(1 + Math.max(0, chest / base - 0.86) * 0.45, 1, 1.32),
    depthScale: clamp(1 + bellyDominance * 1.95 + Math.max(0, belly / Math.max(chest, 0.01) - 1) * 0.38, 1, 1.90),
    waistToHip: Math.max(waist, belly) / Math.max(hip, 0.01),
    waistToShoulder: Math.max(waist, belly) / Math.max(shoulder, 0.01),
    limbScale: { upperThigh, calf, ankle }
  };
  return normalizeVisualProfile(p);
}

function validateCapture(result) {
  const poses = result?.landmarks || [];
  if (!poses.length) throw new Error('Nenhuma pessoa detectada. Use uma foto de corpo inteiro.');
  if (poses.length > 1) throw new Error('Mais de uma pessoa detectada. Use uma foto individual.');
  const landmarks = poses[0];
  const visible = landmarks.filter(p => Number(p.visibility ?? 1) > 0.5).length;
  if (visible < 28) throw new Error('Corpo parcial ou foto escura. Tente corpo inteiro, boa luz e fundo limpo.');
  const required = [0, 11, 12, 27, 28];
  const ok = required.every(i => landmarks[i] && Number(landmarks[i].visibility ?? 1) > 0.45);
  if (!ok) throw new Error('Foto parcial. Cabeça, tronco e tornozelos precisam aparecer.');
  const quality = computeQualityScore(landmarks);
  if (quality < 0.55) throw new Error('Foto escura ou pouco nítida. Tente novamente com mais luz.');
  return { landmarks, worldLandmarks: result?.worldLandmarks?.[0] || null };
}

function computeQualityScore(lms) {
  if (!Array.isArray(lms) || !lms.length) return 0;
  const total = lms.reduce((sum, p) => sum + Number(p.visibility ?? 1), 0);
  return Math.max(0, Math.min(1, total / lms.length));
}

function normalizeBodyPose(lms) {
  const hip = midpoint(lms[23], lms[24]);
  const shoulder = midpoint(lms[11], lms[12]);
  const ankle = midpoint(lms[27], lms[28]);
  const scale = distance(shoulder, ankle) || 1;
  return lms.map(p => ({
    x: (p.x - hip.x) / scale,
    y: (p.y - hip.y) / scale,
    z: (Number(p.z || 0) - Number(hip.z || 0)) / scale,
    visibility: Number(p.visibility ?? 1)
  }));
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, Number(n) || 0));
}

function profileNumber(profile, keys) {
  for (const key of keys) {
    const raw = profile?.[key];
    if (raw === undefined || raw === null || raw === '') continue;
    const value = Number(String(raw).replace(',', '.'));
    if (Number.isFinite(value) && value > 0) return value;
  }
  return 0;
}

function landmarkConfidence(lms, indexes) {
  const values = indexes.map(i => Number(lms?.[i]?.visibility ?? 1)).filter(Number.isFinite);
  if (!values.length) return 0;
  return clamp(values.reduce((sum, n) => sum + n, 0) / values.length, 0, 1);
}

function estimateBodyProfile(worldLandmarks, profile) {
  const lms = Array.isArray(worldLandmarks) ? worldLandmarks : [];
  const shoulder = distance(lms[11], lms[12]) || 0.34;
  const hip = distance(lms[23], lms[24]) || shoulder * 0.82;
  const torsoLen = distance(midpoint(lms[11], lms[12]), midpoint(lms[23], lms[24])) || shoulder * 1.35;
  const legLen = (
    distance(lms[23], lms[25]) + distance(lms[25], lms[27]) +
    distance(lms[24], lms[26]) + distance(lms[26], lms[28])
  ) / 2 || torsoLen * 1.45;
  const armLen = (
    distance(lms[11], lms[13]) + distance(lms[13], lms[15]) +
    distance(lms[12], lms[14]) + distance(lms[14], lms[16])
  ) / 2 || torsoLen * 1.08;

  const weight = profileNumber(profile, ['peso', 'weight', 'weight_kg']);
  let height = profileNumber(profile, ['altura', 'height', 'height_cm']);
  if (height > 0 && height < 3) height *= 100;
  const bmi = weight > 0 && height > 0 ? weight / Math.pow(height / 100, 2) : 0;
  const bmiFactor = bmi ? clamp(1 + ((bmi - 23) / 23) * 0.42, 0.82, 1.42) : 1;
  const torsoWidthRatio = shoulder > 0 ? clamp(hip / shoulder, 0.58, 1.28) : 0.82;
  const mass01 = clamp((bmi - 25) / 14, 0, 1);
  const endomorph01 = clamp(Math.max(mass01, (torsoWidthRatio - 0.78) / 0.34), 0, 1);

  // Proporcoes anatomicas medias, estimadas a partir dos landmarks e do perfil.
  // Em biotipo endomorfo a cintura/abdomen nao pode afinar abaixo do quadril.
  const shoulderW = clamp(shoulder * 3.15, 0.72, 1.56);
  const hipW = clamp(hip * 3.05 * (1 + endomorph01 * 0.10), shoulderW * 0.62, shoulderW * 1.18);
  const chestW = clamp(shoulderW * (0.78 + endomorph01 * 0.18) * bmiFactor, shoulderW * 0.58, shoulderW * 1.10);
  const waistMin = endomorph01 > 0.28 ? Math.max(hipW * 1.02, shoulderW * 0.84) : shoulderW * 0.46;
  const waistMax = Math.max(hipW * (1.08 + endomorph01 * 0.28), shoulderW * (0.88 + endomorph01 * 0.24), chestW * 1.08);
  const waistW = clamp(((shoulderW + hipW) / 2) * (0.66 + endomorph01 * 0.38) * bmiFactor, waistMin, waistMax);
  const neckW = clamp(shoulderW * (0.16 + endomorph01 * 0.035) * bmiFactor, 0.09, 0.22);
  const headR = clamp(shoulderW * 0.16, 0.12, 0.22);
  const limbBase = clamp(shoulderW * bmiFactor * (1 + endomorph01 * 0.10), 0.72, 1.62);
  const abdomenScale = clamp(1 + endomorph01 * 0.46 + Math.max(0, waistW / Math.max(hipW, 0.01) - 1) * 0.34, 1, 1.72);
  const chestScale = clamp(1 + endomorph01 * 0.24, 1, 1.34);
  const depthScale = clamp(1 + endomorph01 * 0.58 + Math.max(0, waistW / Math.max(shoulderW, 0.01) - 0.78) * 0.42, 1, 1.86);

  return {
    estimated: true,
    shoulderW,
    chestW,
    waistW,
    hipW,
    neckW,
    headR,
    upperArmR: clamp(limbBase * 0.065, 0.045, 0.105),
    forearmR: clamp(limbBase * 0.052, 0.035, 0.088),
    thighR: clamp(limbBase * 0.092, 0.062, 0.14),
    calfR: clamp(limbBase * 0.068, 0.045, 0.105),
    torsoLen: clamp(torsoLen * 3.2, 0.95, 1.8),
    legLen: clamp(legLen * 3.0, 1.15, 2.3),
    armLen: clamp(armLen * 3.0, 0.9, 1.9),
    heightUnit: clamp(distance(midpoint(lms[11], lms[12]), midpoint(lms[27], lms[28])) || 1, 0.1, 3),
    bmiFactor,
    bodyShape: {
      bmi,
      mass01,
      endomorph01,
      torsoWidthRatio,
      abdomenScale,
      chestScale,
      depthScale,
      waistToHip: waistW / Math.max(hipW, 0.01),
      waistToShoulder: waistW / Math.max(shoulderW, 0.01)
    },
    confidence: landmarkConfidence(lms, [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28])
  };
}

function midpoint(a, b) {
  return {
    x: (Number(a?.x || 0) + Number(b?.x || 0)) / 2,
    y: (Number(a?.y || 0) + Number(b?.y || 0)) / 2,
    z: (Number(a?.z || 0) + Number(b?.z || 0)) / 2
  };
}

function distance(a, b) {
  return Math.hypot(Number(a?.x || 0) - Number(b?.x || 0), Number(a?.y || 0) - Number(b?.y || 0), Number(a?.z || 0) - Number(b?.z || 0));
}

function renderBodyTwinPreview(state) {
  const el = stage();
  if (!el) return;
  const pct = Math.round(state.quality * 100);
  // Apenas o canvas e overlays dentro do stage (overflow:hidden clips botões se ficarem aqui)
  el.innerHTML = `
    <div class="bodytwin-preview">
      <div id="bodytwin-3d" class="bodytwin-3d"></div>
      <div class="bodytwin-scanline"></div>
      <div class="bodytwin-quality">Qualidade visual estimada: ${pct}%</div>
      <div class="bodytwin-habit-note">${t('bodytwin_habit_visual_note')}</div>
    </div>`;
  // Botões já existem no markup — apenas atualiza innerHTML
  const btns = document.getElementById('bodytwin-preview-btns');
  if (btns) btns.innerHTML = `
    <button class="btn btn-primary btn-full" onclick="window.BodyTwin?.saveBodySnapshot?.()">Salvar snapshot estimado</button>
    <button class="btn btn-outline btn-full" style="margin-top:8px" onclick="window.BodyTwin?.analyzeWithCoach?.()">Analisar com o Coach</button>`;
  renderBodyTwin3D(document.getElementById('bodytwin-3d'), state.normalized, { bodyProfile: state.bodyProfile, silhouette: state.silhouette, captureId: state.captureId }).catch(err => {
    console.warn('[BodyTwin 3D fallback]', err);
    const holder = document.getElementById('bodytwin-3d');
    if (holder) holder.innerHTML = '<canvas id="bodytwin-wire-canvas" width="360" height="520"></canvas>';
    drawPremiumBody2D(document.getElementById('bodytwin-wire-canvas'), state.normalized);
  });
  window.dispatchEvent(new CustomEvent('vitalia:bodytwin:pose-ready', { detail: state }));
}

function getUserId() {
  return window.currentUserId?.() || window.APP?.user?.id || null;
}

function getGoalType() {
  return document.getElementById('bodytwin-goal')?.value || 'health';
}

function wantsPhotoStorage() {
  return !!document.getElementById('bodytwin-save-photo')?.checked;
}

function currentRenderedCanvas() {
  activeScene?.renderOnce?.();
  return activeScene?.renderer?.domElement || document.querySelector('#bodytwin-3d canvas');
}

async function renderedTwinBlob() {
  const source = currentRenderedCanvas();
  if (!source) throw new Error('Render do Body Twin ainda não está pronto.');
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d', { alpha: false });
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#020a04');
  gradient.addColorStop(0.45, '#031408');
  gradient.addColorStop(1, '#010403');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0);
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.92));
}

async function signedBodyTwinUrl(path) {
  if (!path) return '';
  const { data, error } = await getSb().storage.from('body-snapshots').createSignedUrl(path, 60 * 10);
  if (error) {
    console.warn('[BodyTwin signed url]', error);
    return '';
  }
  return data?.signedUrl || '';
}

async function loadBodyTwinSettings() {
  const userId = getUserId();
  if (!userId || !getSb()) return;
  const { data, error } = await getSb()
    .from('body_twin_settings')
    .select('show_pose_points')
    .eq('user_id', userId)
    .maybeSingle();
  // V122: poseDebugMode nunca ativa automaticamente
  if (!error && data) poseDebugMode = false; // !!data.show_pose_points — só ativa via botão
  updatePoseDebugLabel();
}

function updatePoseDebugLabel() {
  const label = document.getElementById('bodytwin-tech-label');
  if (label) label.textContent = poseDebugMode ? t('bodytwin_technical_on') : t('bodytwin_technical_mode');
}

async function togglePoseDebugMode() {
  poseDebugMode = !poseDebugMode;
  updatePoseDebugLabel();
  const userId = getUserId();
  if (userId && getSb()) {
    await getSb().from('body_twin_settings').upsert({
      user_id: userId,
      show_pose_points: poseDebugMode,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
  }
  if (lastResult) {
    renderBodyTwin3D(document.getElementById('bodytwin-3d'), lastResult.normalized, {
      bodyProfile: lastResult.bodyProfile,
      silhouette: lastResult.silhouette,
      captureId: lastResult.captureId
    }).catch(err => console.warn('[BodyTwin debug redraw]', err));
  }
}

function todayMetrics() {
  const calc = window.APP?.calc || {};
  const meals = window.APP?.meals || [];
  const kcal = meals.reduce((sum, m) => sum + Number(m.kcal || m.cal || 0), 0);
  const protein = meals.reduce((sum, m) => sum + Number(m.protein || m.prot || m.proteina || 0), 0);
  const target = Number(calc.meta || calc.cal || calc.kcal || calc.calorias || calc.kcalTarget || 0);
  const proteinTarget = Number(calc.prot || calc.proteina || calc.protein || calc.proteinTarget || Math.round(profileNumber(appProfile(), ['peso', 'weight', 'weight_kg']) * 2) || 0);
  const nutrition = target ? Math.min(100, Math.round((kcal / target) * 100)) : null;
  const proteinScore = proteinTarget ? Math.min(100, Math.round((protein / proteinTarget) * 100)) : null;
  const hydrationTarget = Number(window.smartHydrationTarget?.().cups || 0);
  const hydration = hydrationTarget ? Math.min(100, Math.round((Number(window.APP?.water || 0) / hydrationTarget) * 100)) : null;
  const consistency = Math.min(100, Math.round(Number(window.APP?.streak || 0) / 7 * 100));
  const training = (window.APP?.workouts || window.APP?.trainingLogs || []).length ? 100 : null;
  return {
    nutrition_score: nutrition,
    hydration_score: hydration,
    protein_score: proteinScore,
    consistency_score: consistency,
    training_score: training,
    recovery_score: null
  };
}

function estimateSymmetry(landmarks) {
  if (!Array.isArray(landmarks)) return { posture: null, symmetry: null };
  const pairs = [[11,12],[23,24],[25,26],[27,28]];
  const diffs = pairs.map(([a,b]) => Math.abs(Number(landmarks[a]?.y || 0) - Number(landmarks[b]?.y || 0)));
  const avg = diffs.reduce((s, n) => s + n, 0) / diffs.length;
  const score = Math.max(0, Math.min(100, Math.round((1 - avg * 8) * 100)));
  return { posture: score, symmetry: score };
}

async function saveBodySnapshot() {
  if (!lastResult) return toast('Crie seu Body Twin antes de salvar.', 'info');
  const userId = getUserId();
  if (!userId) return toast('Entre na conta para salvar o Body Twin.', 'info');
  try {
    const goal = getGoalType();
    const savePhoto = wantsPhotoStorage();
    const snapshotId = crypto.randomUUID();
    let imagePath = null;
    let renderedPath = null;
    if (savePhoto && lastResult.file) {
      imagePath = `${userId}/${snapshotId}.jpg`;
      const up = await getSb().storage.from('body-snapshots').upload(imagePath, lastResult.file, { contentType: 'image/jpeg', upsert: false });
      if (up.error) throw up.error;
    }
    const rendered = await renderedTwinBlob();
    renderedPath = `${userId}/${snapshotId}_twin.png`;
    const renderedUpload = await getSb().storage.from('body-snapshots').upload(renderedPath, rendered, { contentType: 'image/png', upsert: false });
    if (renderedUpload.error) throw renderedUpload.error;
    const payload = {
      id: snapshotId,
      user_id: userId,
      image_path: imagePath,
      rendered_snapshot_path: renderedPath,
      pose_landmarks_json: lastResult.normalized,
      body_outline_json: { edges: EDGES },
      body_twin_data_json: {
        version: BT_VERSION,
        estimated: true,
        body_profile: lastResult.bodyProfile,
        habit_lighting: todayMetrics()
      },
      quality_score: Number(lastResult.quality.toFixed(3)),
      goal_type: goal,
      consent_version: 'bt-v1'
    };
    const { data, error } = await getSb().from('body_snapshots').insert(payload).select('id').single();
    if (error) throw error;
    const symmetry = estimateSymmetry(lastResult.landmarks);
    const metrics = {
      user_id: userId,
      snapshot_id: data.id,
      estimated_posture_score: symmetry.posture,
      estimated_symmetry_score: symmetry.symmetry,
      ...todayMetrics()
    };
    const metricInsert = await getSb().from('body_progress_metrics').insert(metrics);
    if (metricInsert.error) throw metricInsert.error;
    await getSb().from('body_twin_settings').upsert({
      user_id: userId,
      privacy_mode: savePhoto ? 'with_photo' : 'landmarks_only',
      goal_visual_mode: goal,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
    toast('Body Twin salvo com segurança.', 'success');
    await listBodySnapshotsV2();
    return { id: data.id, imagePath, renderedPath };
  } catch (err) {
    console.error('[BodyTwin save]', err);
    toast(err?.message || 'Erro ao salvar o Body Twin. Tente novamente.', 'error');
  }
}

async function listBodySnapshots() {
  const userId = getUserId();
  const box = document.getElementById('bodytwin-snapshots');
  if (!userId || !box) return;
  const { data, error } = await getSb()
    .from('body_snapshots')
    .select('id,created_at,quality_score,goal_type,image_path,rendered_snapshot_path')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(12);
  if (error) {
    box.innerHTML = `<div class="bodytwin-error">${error.message}</div>`;
    return;
  }
  box.innerHTML = (data || []).map(s => `
    <div class="bodytwin-snapshot-row">
      <div>
        <strong>${new Date(s.created_at).toLocaleDateString()}</strong>
        <span>${s.goal_type || 'health'} · ${Math.round(Number(s.quality_score || 0) * 100)}%</span>
      </div>
      <button class="btn btn-outline" onclick="window.BodyTwin?.deleteBodySnapshot?.('${s.id}','${s.image_path || ''}')">Excluir</button>
    </div>`).join('') || '<div class="bodytwin-empty">Nenhum snapshot salvo ainda.</div>';
}

async function deleteBodySnapshot(id, imagePath) {
  const userId = getUserId();
  if (!userId || !id) return;
  if (!confirm('Excluir este snapshot estimado do Body Twin?')) return;
  if (imagePath) await getSb().storage.from('body-snapshots').remove([imagePath]);
  const { error } = await getSb().from('body_snapshots').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
  toast('Snapshot excluído.', 'success');
  await listBodySnapshots();
}

async function deleteAllBodyTwinData() {
  const userId = getUserId();
  if (!userId) return;
  if (!confirm('Excluir todos os dados do Body Twin? Esta ação não pode ser desfeita.')) return;
  const { data } = await getSb().from('body_snapshots').select('image_path').eq('user_id', userId);
  const paths = (data || []).map(x => x.image_path).filter(Boolean);
  if (paths.length) await getSb().storage.from('body-snapshots').remove(paths);
  await getSb().from('body_progress_metrics').delete().eq('user_id', userId);
  await getSb().from('body_snapshots').delete().eq('user_id', userId);
  await getSb().from('body_twin_settings').delete().eq('user_id', userId);
  toast('Dados do Body Twin excluídos.', 'success');
  await listBodySnapshots();
}

async function listBodySnapshotsV2() {
  const userId = getUserId();
  const box = document.getElementById('bodytwin-snapshots');
  if (!userId || !box) return;
  const { data, error } = await getSb()
    .from('body_snapshots')
    .select('id,created_at,quality_score,goal_type,image_path,rendered_snapshot_path')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(12);
  if (error) {
    box.innerHTML = `<div class="bodytwin-error">${error.message}</div>`;
    return;
  }
  const rows = await Promise.all((data || []).map(async s => ({ ...s, renderedUrl: await signedBodyTwinUrl(s.rendered_snapshot_path) })));
  box.innerHTML = rows.length ? `
    <div class="bodytwin-timeline-label">${t('bodytwin_timeline')}</div>
    <div class="bodytwin-timeline">
      ${rows.map(s => `
      <button class="bodytwin-twin-card" onclick="window.BodyTwin?.compareBodySnapshot?.('${s.id}','${s.rendered_snapshot_path || ''}')">
        ${s.renderedUrl ? `<img src="${s.renderedUrl}" alt="Body Twin ${new Date(s.created_at).toLocaleDateString()}">` : '<span class="bodytwin-twin-empty">Twin</span>'}
        <strong>${new Date(s.created_at).toLocaleDateString()}</strong>
        <small>${Math.round(Number(s.quality_score || 0) * 100)}%</small>
      </button>`).join('')}
    </div>
    ${rows.map(s => `
    <div class="bodytwin-snapshot-row">
      <div>
        <strong>${new Date(s.created_at).toLocaleDateString()}</strong>
        <span>${s.goal_type || 'health'} · ${Math.round(Number(s.quality_score || 0) * 100)}%</span>
      </div>
      <button class="btn btn-outline" onclick="window.BodyTwin?.deleteBodySnapshot?.('${s.id}','${s.image_path || ''}','${s.rendered_snapshot_path || ''}')">Excluir</button>
    </div>`).join('')}` : '<div class="bodytwin-empty">Nenhum snapshot salvo ainda.</div>';
}

async function compareBodySnapshot(id, renderedPath) {
  const previousUrl = await signedBodyTwinUrl(renderedPath);
  const current = currentRenderedCanvas()?.toDataURL?.('image/png') || '';
  const body = `
    <div class="bodytwin-compare">
      <div><span>${t('bodytwin_compare_previous')}</span>${previousUrl ? `<img src="${previousUrl}" alt="Body Twin anterior">` : ''}</div>
      <div><span>${t('bodytwin_compare_current')}</span>${current ? `<img src="${current}" alt="Body Twin atual">` : '<p>Crie um novo Body Twin para comparar.</p>'}</div>
    </div>`;
  if (window.openModal) window.openModal(t('bodytwin_compare_title'), body);
  else toast(id ? 'Comparação pronta.' : 'Snapshot selecionado.', 'info');
}

async function deleteBodySnapshotV2(id, imagePath, renderedPath = '') {
  const userId = getUserId();
  if (!userId || !id) return;
  if (!confirm('Excluir este snapshot estimado do Body Twin?')) return;
  const paths = [imagePath, renderedPath].filter(Boolean);
  if (paths.length) await getSb().storage.from('body-snapshots').remove(paths);
  const { error } = await getSb().from('body_snapshots').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
  toast('Snapshot excluído.', 'success');
  await listBodySnapshotsV2();
}

async function deleteAllBodyTwinDataV2() {
  const userId = getUserId();
  if (!userId) return;
  if (!confirm('Excluir todos os dados do Body Twin? Esta ação não pode ser desfeita.')) return;
  const { data } = await getSb().from('body_snapshots').select('image_path,rendered_snapshot_path').eq('user_id', userId);
  const paths = (data || []).flatMap(x => [x.image_path, x.rendered_snapshot_path]).filter(Boolean);
  if (paths.length) await getSb().storage.from('body-snapshots').remove(paths);
  await getSb().from('body_progress_metrics').delete().eq('user_id', userId);
  await getSb().from('body_snapshots').delete().eq('user_id', userId);
  await getSb().from('body_twin_settings').delete().eq('user_id', userId);
  toast('Dados do Body Twin excluídos.', 'success');
  await listBodySnapshotsV2();
}

function analyzeWithCoach() {
  const goal = getGoalType();
  const metrics = todayMetrics();
  const consistency = metrics.consistency_score ?? 0;
  const nutrition = metrics.nutrition_score ?? 0;
  const hydration = metrics.hydration_score ?? 0;
  const training = metrics.training_score ?? 0;
  const recovery = metrics.recovery_score ?? 0;
  const message = `Meu Body Twin de hoje: objetivo ${goal}; consistência ${consistency}%; nutrição ${nutrition}%; hidratação ${hydration}%; treino ${training}%; sono ${recovery}%. Me dê um resumo motivacional do meu progresso e o foco de hoje.`;
  window.navigate?.('coach');
  setTimeout(() => window.sendCoachMsg?.(message), 250);
}

// Three.js local vendorizado; Body Twin deve funcionar sem CDN externo.
async function ensureThree() {
  if (THREE) return THREE;
  THREE = await import('./../vendor/three/three.module.min.js');
  if (!THREE?.Scene) throw new Error('vendor Three.js incompleto');
  return THREE;
}

// THREE.CapsuleGeometry foi adicionado no r142; o vendor usa r128.
// Fallback: CylinderGeometry com topo/fundo planos — wireframe premium continua.
function makeCapsuleGeo(radius, length, capSegs, radialSegs) {
  if (THREE.CapsuleGeometry) {
    return new THREE.CapsuleGeometry(radius, Math.max(0.01, length), capSegs, radialSegs);
  }
  return new THREE.CylinderGeometry(radius, radius, Math.max(0.01, length), radialSegs, 4);
}

function generateWireframeSkeleton(landmarks3d) {
  const points = (landmarks3d || []).map(p => ({
    x: Number(p.x || 0) * 3.6,
    y: Number(p.y || 0) * -3.6,
    z: Number(p.z || 0) * -2.2,
    visibility: Number(p.visibility ?? 1)
  }));
  const segments = EDGES
    .filter(([a, b]) => points[a] && points[b])
    .map(([a, b]) => [points[a], points[b]]);
  return { points, segments };
}

function bodyPoint(landmarks3d, index) {
  const p = landmarks3d?.[index] || {};
  return new THREE.Vector3(
    Number(p.x || 0) * 3.6,
    Number(p.y || 0) * -3.6,
    Number(p.z || 0) * -2.2
  );
}

function addPremiumMesh(group, geometry, position, quaternion, scale = null, opacityBoost = 1) {
  // V122: só fill escuro — grade explícita via addCapsuleGrid (rings + rails, sem diagonais)
  const fill = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color: 0x001a3a,
      transparent: true,
      opacity: 0.28 * opacityBoost,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  fill.position.copy(position);
  if (quaternion) fill.quaternion.copy(quaternion);
  if (scale) fill.scale.copy(scale);
  group.add(fill);
  return { fill, wire: fill };
}

function neonLine(points, opacity = 0.92, color = BODYTWIN_GRID) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(geometry, new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }));
}

function ellipseLine(center, rx, ry, z = 0.28, segments = 72, opacity = 0.78) {
  const pts = [];
  for (let i = 0; i <= segments; i += 1) {
    const a = (Math.PI * 2 * i) / segments;
    pts.push(new THREE.Vector3(center.x + Math.cos(a) * rx, center.y + Math.sin(a) * ry, center.z + z));
  }
  return neonLine(pts, opacity);
}

function arcLine(center, rx, ry, start, end, z = 0.3, segments = 36, opacity = 0.75) {
  const pts = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const a = start + (end - start) * t;
    pts.push(new THREE.Vector3(center.x + Math.cos(a) * rx, center.y + Math.sin(a) * ry, center.z + z));
  }
  return neonLine(pts, opacity);
}

function addAnatomyOverlay(group, profile, worldLandmarks, torsoCenter, torsoHeight) {
  const p = profile;
  const shoulder = new THREE.Vector3().addVectors(bodyPoint(worldLandmarks, 11), bodyPoint(worldLandmarks, 12)).multiplyScalar(0.5);
  const hip = new THREE.Vector3().addVectors(bodyPoint(worldLandmarks, 23), bodyPoint(worldLandmarks, 24)).multiplyScalar(0.5);
  const head = bodyPoint(worldLandmarks, 0);
  const zFront = 0.42;
  const zBack = -0.18;
  const anatomy = new THREE.Group();
  anatomy.name = 'anatomy-wire-layer';

  anatomy.add(neonLine([
    new THREE.Vector3(shoulder.x, shoulder.y + 0.05, zBack),
    new THREE.Vector3(torsoCenter.x, torsoCenter.y + torsoHeight * 0.18, zBack),
    new THREE.Vector3(torsoCenter.x, torsoCenter.y - torsoHeight * 0.18, zBack),
    new THREE.Vector3(hip.x, hip.y, zBack)
  ], 0.86));

  for (let i = 0; i < 7; i += 1) {
    const y = shoulder.y - torsoHeight * (0.06 + i * 0.075);
    const w = p.chestW * (0.36 - i * 0.018);
    anatomy.add(arcLine(new THREE.Vector3(torsoCenter.x, y, 0), w, 0.065, Math.PI * 0.08, Math.PI * 0.92, zFront, 34, 0.62));
    anatomy.add(arcLine(new THREE.Vector3(torsoCenter.x, y, 0), w, 0.065, Math.PI * 1.08, Math.PI * 1.92, zFront, 34, 0.62));
  }

  anatomy.add(ellipseLine(new THREE.Vector3(torsoCenter.x - p.chestW * 0.22, shoulder.y - torsoHeight * 0.16, 0), p.chestW * 0.21, torsoHeight * 0.12, zFront, 58, 0.84));
  anatomy.add(ellipseLine(new THREE.Vector3(torsoCenter.x + p.chestW * 0.22, shoulder.y - torsoHeight * 0.16, 0), p.chestW * 0.21, torsoHeight * 0.12, zFront, 58, 0.84));

  for (let row = 0; row < 3; row += 1) {
    const y = torsoCenter.y - torsoHeight * (0.04 + row * 0.105);
    anatomy.add(ellipseLine(new THREE.Vector3(torsoCenter.x - p.waistW * 0.13, y, 0), p.waistW * 0.11, torsoHeight * 0.055, zFront + 0.02, 36, 0.76));
    anatomy.add(ellipseLine(new THREE.Vector3(torsoCenter.x + p.waistW * 0.13, y, 0), p.waistW * 0.11, torsoHeight * 0.055, zFront + 0.02, 36, 0.76));
  }

  [[11, p.upperArmR * 2.8], [12, p.upperArmR * 2.8], [13, p.forearmR * 2.2], [14, p.forearmR * 2.2], [25, p.thighR * 2.2], [26, p.thighR * 2.2], [27, p.calfR * 2.0], [28, p.calfR * 2.0]].forEach(([idx, r]) => {
    const c = bodyPoint(worldLandmarks, idx);
    anatomy.add(ellipseLine(c, r, r * 0.68, zFront * 0.45, 36, 0.62));
  });

  anatomy.add(arcLine(new THREE.Vector3(hip.x, hip.y + 0.02, 0), p.hipW * 0.42, torsoHeight * 0.16, Math.PI * 0.05, Math.PI * 0.95, zFront, 46, 0.78));
  anatomy.add(arcLine(new THREE.Vector3(hip.x, hip.y + 0.02, 0), p.hipW * 0.42, torsoHeight * 0.16, Math.PI * 1.05, Math.PI * 1.95, zFront, 46, 0.78));

  anatomy.add(ellipseLine(head, p.headR * 0.72, p.headR * 0.92, zFront * 0.55, 56, 0.72));
  anatomy.add(arcLine(new THREE.Vector3(head.x, head.y - p.headR * 0.12, 0), p.headR * 0.54, p.headR * 0.20, 0, Math.PI, zFront * 0.62, 30, 0.62));
  anatomy.add(neonLine([
    new THREE.Vector3(bodyPoint(worldLandmarks, 15).x, bodyPoint(worldLandmarks, 15).y, zFront * 0.36),
    new THREE.Vector3(bodyPoint(worldLandmarks, 15).x - 0.08, bodyPoint(worldLandmarks, 15).y - 0.10, zFront * 0.34),
    new THREE.Vector3(bodyPoint(worldLandmarks, 15).x + 0.08, bodyPoint(worldLandmarks, 15).y - 0.10, zFront * 0.34)
  ], 0.62));
  anatomy.add(neonLine([
    new THREE.Vector3(bodyPoint(worldLandmarks, 16).x, bodyPoint(worldLandmarks, 16).y, zFront * 0.36),
    new THREE.Vector3(bodyPoint(worldLandmarks, 16).x - 0.08, bodyPoint(worldLandmarks, 16).y - 0.10, zFront * 0.34),
    new THREE.Vector3(bodyPoint(worldLandmarks, 16).x + 0.08, bodyPoint(worldLandmarks, 16).y - 0.10, zFront * 0.34)
  ], 0.62));

  group.add(anatomy);
  return anatomy;
}

function addCapsuleBetween(group, a, b, radius, radialSegments = 16, opacityBoost = 1) {
  const start = bodyPoint(group.userData.landmarks, a);
  const end = bodyPoint(group.userData.landmarks, b);
  const vector = new THREE.Vector3().subVectors(end, start);
  const length = Math.max(0.08, vector.length());
  const midpoint3d = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    vector.clone().normalize()
  );
  const geo = makeCapsuleGeo(radius, Math.max(0.01, length - radius * 2), 6, radialSegments);
  return addPremiumMesh(group, geo, midpoint3d, quat, null, opacityBoost);
}

function createGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(125,211,252,0.62)');
  g.addColorStop(0.35, 'rgba(0,170,255,0.24)');
  g.addColorStop(1, 'rgba(0,170,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

function createParticles() {
  const geometry = new THREE.BufferGeometry();
  const count = 180;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 5.6;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 5.2;
    positions[i * 3 + 2] = -1.8 - Math.random() * 2.6;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({
    color: BODYTWIN_NEON,
    size: 0.018,
    transparent: true,
    opacity: 0.30,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }));
}

function createScanCircle() {
  const group = new THREE.Group();
  const ringMat = new THREE.MeshBasicMaterial({
    color: BODYTWIN_GRID,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  [1.05, 1.45, 1.85].forEach((r, idx) => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.012, 96), ringMat.clone());
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -2.35;
    ring.material.opacity = 0.22 - idx * 0.055;
    group.add(ring);
    group.userData.rings = [...(group.userData.rings || []), ring];
  });
  const grid = new THREE.GridHelper(3.2, 20, BODYTWIN_NEON, 0x0044aa);
  grid.position.y = -2.36;
  grid.material.transparent = true;
  grid.material.opacity = 0.22;
  group.add(grid);
  return group;
}

function setupBodyTwinCameras(width, height) {
  const aspect = Math.max(0.62, width / height);
  const camFront = new THREE.PerspectiveCamera(32, aspect, 0.1, 100);
  camFront.position.set(0, 0.28, 7.2);
  camFront.lookAt(0, -0.2, 0);

  const camSide = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camSide.position.set(6.2, 0.25, 0);
  camSide.lookAt(0, -0.22, 0);

  const camBack = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camBack.position.set(0, 0.25, -6.2);
  camBack.lookAt(0, -0.22, 0);

  const camHead = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
  camHead.position.set(0, 1.15, 3.2);
  camHead.lookAt(0, 1.05, 0);

  const camTorso = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  camTorso.position.set(0, 0.22, 3.4);
  camTorso.lookAt(0, 0.02, 0);

  const camShoulder = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
  camShoulder.position.set(-1.15, 0.75, 2.8);
  camShoulder.lookAt(-0.55, 0.52, 0);

  const camHand = new THREE.PerspectiveCamera(20, 1, 0.1, 100);
  camHand.position.set(-1.35, -0.65, 2.6);
  camHand.lookAt(-1.0, -0.75, 0);

  return { camFront, camSide, camBack, camHead, camTorso, camShoulder, camHand };
}

function renderPanel(renderer, scene, camera, x, y, w, h, clear = true) {
  renderer.setViewport(x, y, w, h);
  renderer.setScissor(x, y, w, h);
  if (clear) renderer.clear(true, true, true);
  renderer.render(scene, camera);
}

function renderBodyTwinViews(renderer, scene, cameras, width, height) {
  renderer.setScissorTest(true);
  renderer.setClearColor(0x000000, 1);

  // Vista frontal: 70% da largura, altura total — destaque premium
  const mainW = Math.round(width * 0.70);
  renderPanel(renderer, scene, cameras.camFront, 0, 0, mainW, height, true);

  // 2 painéis suplementares à direita (lateral + costas)
  const margin = Math.max(6, Math.round(width * 0.018));
  const panW   = width - mainW - margin * 2;
  const panH   = Math.round((height - margin * 3) / 2);
  const panX   = mainW + margin;
  renderPanel(renderer, scene, cameras.camSide, panX, height - panH - margin, panW, panH, true);
  renderPanel(renderer, scene, cameras.camBack, panX, margin,                 panW, panH, true);

  renderer.setScissorTest(false);
}

function addAvatarGridLine(group, points, opacity = 0.56) {
  group.add(neonLine(points, opacity, BODYTWIN_GRID));
}

function addCapsuleGrid(group, start, end, radius, rings = 10, rails = 14) {
  const axis = new THREE.Vector3().subVectors(end, start);
  const length = axis.length();
  if (length < 0.04) return;
  const dir = axis.clone().normalize();
  const up = Math.abs(dir.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3().crossVectors(dir, up).normalize();
  const front = new THREE.Vector3().crossVectors(side, dir).normalize();

  for (let i = 1; i <= rings; i += 1) {
    const t = i / (rings + 1);
    const center = start.clone().lerp(end, t);
    const pts = [];
    for (let s = 0; s <= 32; s += 1) {
      const a = (Math.PI * 2 * s) / 32;
      pts.push(center.clone()
        .add(side.clone().multiplyScalar(Math.cos(a) * radius))
        .add(front.clone().multiplyScalar(Math.sin(a) * radius * 0.62)));
    }
    group.add(neonLine(pts, 0.38, BODYTWIN_NEON));
  }

  for (let r = 0; r < rails; r += 1) {
    const a = (Math.PI * 2 * r) / rails;
    const offset = side.clone().multiplyScalar(Math.cos(a) * radius)
      .add(front.clone().multiplyScalar(Math.sin(a) * radius * 0.62));
    group.add(neonLine([
      start.clone().lerp(end, 0.08).add(offset),
      start.clone().lerp(end, 0.92).add(offset.clone().multiplyScalar(0.78))
    ], 0.44, BODYTWIN_NEON));
  }
}

function addBodySurfaceGrid(group, J, p, torsoMidY, torsoH) {
  const zF = 0.50;
  const zB = -0.36;
  const sw = Math.max(0.28, (p.shoulderW || 0.42) * 0.50);
  const hw = Math.max(0.22, (p.hipW || 0.34) * 0.50);
  const cw = Math.max(0.22, (p.chestW || 0.34) * 0.50);
  const ww = Math.max(0.17, (p.waistW || 0.28) * 0.50);

  for (let i = 0; i < 12; i += 1) {
    const t = i / 11;
    const y = J.hipC.y + torsoH * (0.04 + t * 0.88);
    const width = t < 0.42
      ? hw + (ww - hw) * (t / 0.42)
      : ww + (sw * 0.92 - ww) * ((t - 0.42) / 0.58);
    group.add(ellipseLine(new THREE.Vector3(0, y, 0), width, 0.055 + t * 0.025, zF, 58, 0.42));
  }

  [-0.72, -0.36, 0, 0.36, 0.72].forEach(k => {
    const pts = [];
    for (let i = 0; i <= 18; i += 1) {
      const t = i / 18;
      const y = J.hipC.y + torsoH * (0.02 + t * 0.90);
      const width = t < 0.44
        ? hw + (ww - hw) * (t / 0.44)
        : ww + (cw - ww) * ((t - 0.44) / 0.56);
      pts.push(new THREE.Vector3(width * k, y, zF - Math.abs(k) * 0.08));
    }
    addAvatarGridLine(group, pts, k === 0 ? 0.62 : 0.40);
  });

  addAvatarGridLine(group, [
    new THREE.Vector3(-sw * 0.92, J.shoulderC.y, zF),
    new THREE.Vector3(-cw * 0.72, torsoMidY + torsoH * 0.18, zF),
    new THREE.Vector3(-ww * 0.92, torsoMidY - torsoH * 0.12, zF),
    new THREE.Vector3(-hw * 0.86, J.hipC.y, zF)
  ], 0.60);
  addAvatarGridLine(group, [
    new THREE.Vector3(sw * 0.92, J.shoulderC.y, zF),
    new THREE.Vector3(cw * 0.72, torsoMidY + torsoH * 0.18, zF),
    new THREE.Vector3(ww * 0.92, torsoMidY - torsoH * 0.12, zF),
    new THREE.Vector3(hw * 0.86, J.hipC.y, zF)
  ], 0.60);

  addAvatarGridLine(group, [
    new THREE.Vector3(0, J.neckC.y, zB),
    new THREE.Vector3(0, torsoMidY + torsoH * 0.12, zB),
    new THREE.Vector3(0, J.hipC.y + 0.02, zB)
  ], 0.50);

  [
    [J.shoulderL, J.elbowL, Math.max(0.04, p.upperArmR || 0.065)],
    [J.elbowL, J.handL, Math.max(0.03, p.forearmR || 0.05)],
    [J.shoulderR, J.elbowR, Math.max(0.04, p.upperArmR || 0.065)],
    [J.elbowR, J.handR, Math.max(0.03, p.forearmR || 0.05)],
    [J.hipL, J.kneeL, Math.max(0.05, p.thighR || 0.085)],
    [J.kneeL, J.ankleL, Math.max(0.03, p.calfR || 0.06)],
    [J.hipR, J.kneeR, Math.max(0.05, p.thighR || 0.085)],
    [J.kneeR, J.ankleR, Math.max(0.03, p.calfR || 0.06)]
  ].forEach(([a, b, r]) => addCapsuleGrid(group, a, b, r * 1.2, 4, 3));
}

function segmentQuaternion(start, end) {
  const vector = new THREE.Vector3().subVectors(end, start);
  if (vector.lengthSq() < 0.0001) return new THREE.Quaternion();
  return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vector.normalize());
}

function addAnatomicalSegment(group, start, end, radiusA, radiusB, radialSegments = 20, opacityBoost = 1) {
  const vector = new THREE.Vector3().subVectors(end, start);
  const length = Math.max(0.08, vector.length());
  const midpoint3d = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const geo = new THREE.CylinderGeometry(radiusA, radiusB, length, radialSegments, 8);
  return addPremiumMesh(group, geo, midpoint3d, segmentQuaternion(start, end), null, opacityBoost);
}

function segmentBasis(start, end) {
  const dir = new THREE.Vector3().subVectors(end, start).normalize();
  const up = Math.abs(dir.y) > 0.92 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3().crossVectors(dir, up).normalize();
  const front = new THREE.Vector3().crossVectors(side, dir).normalize();
  return { dir, side, front };
}

function addMuscleFibers(group, start, end, radius, count = 4, opacity = 0.62) {
  const { side, front } = segmentBasis(start, end);
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0 : (i / (count - 1)) - 0.5;
    const offset = side.clone().multiplyScalar(t * radius * 1.25).add(front.clone().multiplyScalar(radius * 0.55));
    const a = start.clone().lerp(end, 0.12).add(offset);
    const b = start.clone().lerp(end, 0.88).add(offset.clone().multiplyScalar(0.72));
    group.add(neonLine([a, b], opacity));
  }
}

function addAnatomicalJoint(group, position, radius, scale = new THREE.Vector3(1, 1, 1), opacityBoost = 0.62) {
  return addPremiumMesh(group, new THREE.SphereGeometry(radius, 20, 14), position, null, scale, opacityBoost);
}

function addAnatomicalLimb(group, startIdx, midIdx, endIdx, upperRadius, lowerRadius, jointRadius, upperLabel = 'upper') {
  const start = bodyPoint(group.userData.landmarks, startIdx);
  const mid = bodyPoint(group.userData.landmarks, midIdx);
  const end = bodyPoint(group.userData.landmarks, endIdx);
  addAnatomicalSegment(group, start, mid, upperRadius * 0.76, upperRadius * 1.10, 22, 1.05);
  addAnatomicalSegment(group, mid, end, lowerRadius * 1.02, lowerRadius * 0.70, 20, 1.0);
  addAnatomicalJoint(group, start, upperRadius * 1.42, new THREE.Vector3(1.18, 0.95, 0.82), 0.74);
  addAnatomicalJoint(group, mid, jointRadius, new THREE.Vector3(1.05, 0.82, 0.82), 0.66);
  addAnatomicalJoint(group, end, lowerRadius * 0.92, new THREE.Vector3(1.24, 0.62, 0.48), 0.58);
  addMuscleFibers(group, start, mid, upperRadius, upperLabel === 'leg' ? 6 : 4, 0.64);
  addMuscleFibers(group, mid, end, lowerRadius, upperLabel === 'leg' ? 5 : 4, 0.58);
}

function addAnatomicalDetailLines(group, p, worldLandmarks, torsoCenter, torsoHeight) {
  const shoulder = new THREE.Vector3().addVectors(bodyPoint(worldLandmarks, 11), bodyPoint(worldLandmarks, 12)).multiplyScalar(0.5);
  const hip = new THREE.Vector3().addVectors(bodyPoint(worldLandmarks, 23), bodyPoint(worldLandmarks, 24)).multiplyScalar(0.5);
  const head = bodyPoint(worldLandmarks, 0);
  const zFront = 0.48;
  const zBack = -0.28;

  group.add(neonLine([
    bodyPoint(worldLandmarks, 11).clone().add(new THREE.Vector3(0, -0.02, zFront)),
    torsoCenter.clone().add(new THREE.Vector3(-p.chestW * 0.18, torsoHeight * 0.23, zFront)),
    torsoCenter.clone().add(new THREE.Vector3(-p.chestW * 0.08, torsoHeight * 0.08, zFront))
  ], 0.82));
  group.add(neonLine([
    bodyPoint(worldLandmarks, 12).clone().add(new THREE.Vector3(0, -0.02, zFront)),
    torsoCenter.clone().add(new THREE.Vector3(p.chestW * 0.18, torsoHeight * 0.23, zFront)),
    torsoCenter.clone().add(new THREE.Vector3(p.chestW * 0.08, torsoHeight * 0.08, zFront))
  ], 0.82));

  group.add(ellipseLine(new THREE.Vector3(torsoCenter.x - p.chestW * 0.22, shoulder.y - torsoHeight * 0.16, 0), p.chestW * 0.22, torsoHeight * 0.13, zFront, 64, 0.88));
  group.add(ellipseLine(new THREE.Vector3(torsoCenter.x + p.chestW * 0.22, shoulder.y - torsoHeight * 0.16, 0), p.chestW * 0.22, torsoHeight * 0.13, zFront, 64, 0.88));

  for (let row = 0; row < 4; row += 1) {
    const y = torsoCenter.y - torsoHeight * (0.01 + row * 0.09);
    group.add(ellipseLine(new THREE.Vector3(torsoCenter.x - p.waistW * 0.12, y, 0), p.waistW * 0.105, torsoHeight * 0.045, zFront + 0.03, 36, 0.75));
    group.add(ellipseLine(new THREE.Vector3(torsoCenter.x + p.waistW * 0.12, y, 0), p.waistW * 0.105, torsoHeight * 0.045, zFront + 0.03, 36, 0.75));
  }

  for (let i = 0; i < 8; i += 1) {
    const y = shoulder.y - torsoHeight * (0.05 + i * 0.065);
    const w = p.chestW * (0.39 - i * 0.018);
    group.add(arcLine(new THREE.Vector3(torsoCenter.x, y, 0), w, 0.055, Math.PI * 0.06, Math.PI * 0.94, zFront * 0.92, 34, 0.52));
    group.add(arcLine(new THREE.Vector3(torsoCenter.x, y, 0), w, 0.055, Math.PI * 1.06, Math.PI * 1.94, zFront * 0.92, 34, 0.52));
  }

  group.add(neonLine([
    shoulder.clone().add(new THREE.Vector3(0, 0.08, zBack)),
    torsoCenter.clone().add(new THREE.Vector3(0, torsoHeight * 0.16, zBack)),
    torsoCenter.clone().add(new THREE.Vector3(0, -torsoHeight * 0.18, zBack)),
    hip.clone().add(new THREE.Vector3(0, 0.02, zBack))
  ], 0.86));
  group.add(arcLine(new THREE.Vector3(hip.x, hip.y + torsoHeight * 0.03, 0), p.hipW * 0.48, torsoHeight * 0.18, Math.PI * 0.08, Math.PI * 0.92, zFront, 54, 0.80));
  group.add(arcLine(new THREE.Vector3(hip.x, hip.y + torsoHeight * 0.03, 0), p.hipW * 0.48, torsoHeight * 0.18, Math.PI * 1.08, Math.PI * 1.92, zFront, 54, 0.80));

  group.add(ellipseLine(head, p.headR * 0.74, p.headR * 0.96, zFront * 0.58, 64, 0.72));
  group.add(arcLine(new THREE.Vector3(head.x, head.y - p.headR * 0.18, 0), p.headR * 0.52, p.headR * 0.18, 0, Math.PI, zFront * 0.66, 30, 0.68));
}

function makeCanonicalLM(x, y, z = 0, visibility = 1) {
  return { x: x / 3.6, y: -y / 3.6, z: -z / 2.2, visibility };
}

function normalizeVisualProfile(profile = {}) {
  const p = { ...profile };
  const shape = p.bodyShape || {};
  const bmiFactor = Number(p.bmiFactor || 1);
  const mass = clamp(Number(shape.endomorph01 ?? ((bmiFactor - 1) / 0.42)), 0, 1);
  const shoulderBase = Number(p.shoulderW || 1.0);
  const hipBase = Number(p.hipW || shoulderBase * 0.82);

  p.hipW = clamp(hipBase * (1 + mass * 0.12), shoulderBase * 0.68, shoulderBase * 1.18);
  p.shoulderW = clamp(shoulderBase * (1 + mass * 0.04), p.hipW * 0.78, p.hipW * (mass > 0.35 ? 1.22 : 1.28));
  p.chestW = clamp(Number(p.chestW || p.shoulderW * 0.80) * (1 + mass * 0.16), p.shoulderW * 0.68, p.shoulderW * 1.12);
  p.waistW = clamp(
    Number(p.waistW || ((p.chestW + p.hipW) * 0.5)) * (1 + mass * 0.34),
    mass > 0.28 ? Math.max(p.hipW * 1.02, p.shoulderW * 0.84) : Math.max(p.hipW * 0.74, p.shoulderW * 0.62),
    Math.max(p.hipW * (1.06 + mass * 0.24), p.chestW * (1.00 + mass * 0.10))
  );
  p.neckW = clamp(Number(p.neckW || p.shoulderW * 0.15) * (1 + mass * 0.10), p.shoulderW * 0.13, p.shoulderW * 0.21);
  p.headR = clamp(Number(p.headR || p.shoulderW * 0.15), p.shoulderW * 0.125, p.shoulderW * 0.155);
  p.upperArmR = clamp(Number(p.upperArmR || p.shoulderW * 0.07) * (1 + mass * 0.22), p.shoulderW * 0.060, p.shoulderW * 0.115);
  p.forearmR = clamp(Number(p.forearmR || p.upperArmR * 0.78) * (1 + mass * 0.12), p.upperArmR * 0.66, p.upperArmR * 0.90);
  p.thighR = clamp(Number(p.thighR || p.hipW * 0.12) * (1 + mass * 0.20), p.hipW * 0.082, p.hipW * 0.155);
  p.calfR = clamp(Number(p.calfR || p.thighR * 0.72) * (1 + mass * 0.12), p.thighR * 0.58, p.thighR * 0.82);
  p.torsoLen = clamp(Number(p.torsoLen || 1.35), 1.12, 1.72);
  p.legLen = clamp(Number(p.legLen || 1.82), 1.28, 2.12);
  p.armLen = clamp(Number(p.armLen || 1.28), 1.02, 1.62);
  p.bodyShape = {
    ...shape,
    endomorph01: mass,
    abdomenScale: clamp(Number(shape.abdomenScale || (1 + mass * 0.55)), 1, 1.82),
    chestScale: clamp(Number(shape.chestScale || (1 + mass * 0.25)), 1, 1.38),
    depthScale: clamp(Number(shape.depthScale || (1 + mass * 0.70)), 1, 1.95),
    waistToHip: p.waistW / Math.max(p.hipW, 0.01),
    waistToShoulder: p.waistW / Math.max(p.shoulderW, 0.01)
  };
  p.visualNormalized = true;
  return p;
}

function createCanonicalLandmarks(profile, sourceLandmarks) {
  const p = profile || estimateBodyProfile(sourceLandmarks, appProfile());
  const source = Array.isArray(sourceLandmarks) ? sourceLandmarks : [];
  const canonical = source.map(lm => ({ ...(lm || {}) }));
  const shoulderW = clamp(p.shoulderW || 1.0, 0.74, 1.26);
  const hipW = clamp(p.hipW || shoulderW * 0.84, shoulderW * 0.68, shoulderW * 1.04);
  const torsoLen = clamp(p.torsoLen || 1.35, 1.12, 1.68);
  const legLen = clamp(p.legLen || 1.82, 1.28, 2.12);
  const armLen = clamp(p.armLen || 1.28, 1.02, 1.58);

  const shoulderY = 0.72;
  const hipY = shoulderY - torsoLen;
  const headY = shoulderY + clamp(p.headR * 2.28, 0.32, 0.46);
  const kneeY = hipY - legLen * 0.48;
  const ankleY = hipY - legLen * 0.98;
  const elbowY = shoulderY - armLen * 0.47;
  const wristY = Math.max(hipY - legLen * 0.12, shoulderY - armLen * 0.84);

  const shoulderX = shoulderW * 0.46;
  const hipX = hipW * 0.42;
  const elbowX = shoulderX + clamp(shoulderW * 0.055, 0.045, 0.10);
  const wristX = hipX + clamp(p.waistW * 0.18, 0.10, 0.18);
  const kneeX = hipX * 0.64;
  const ankleX = hipX * 0.54;

  canonical[0] = makeCanonicalLM(0, headY, 0.03);
  canonical[11] = makeCanonicalLM(-shoulderX, shoulderY, 0);
  canonical[12] = makeCanonicalLM(shoulderX, shoulderY, 0);
  canonical[13] = makeCanonicalLM(-elbowX, elbowY, 0.02);
  canonical[14] = makeCanonicalLM(elbowX, elbowY, 0.02);
  canonical[15] = makeCanonicalLM(-wristX, wristY, 0.03);
  canonical[16] = makeCanonicalLM(wristX, wristY, 0.03);
  canonical[23] = makeCanonicalLM(-hipX, hipY, 0);
  canonical[24] = makeCanonicalLM(hipX, hipY, 0);
  canonical[25] = makeCanonicalLM(-kneeX, kneeY, 0.02);
  canonical[26] = makeCanonicalLM(kneeX, kneeY, 0.02);
  canonical[27] = makeCanonicalLM(-ankleX, ankleY, 0.08);
  canonical[28] = makeCanonicalLM(ankleX, ankleY, 0.08);
  return canonical;
}

function addScannerMeasurementLines(group, profile, canonicalLandmarks) {
  const p = profile || {};
  const shoulderL = bodyPoint(canonicalLandmarks, 11);
  const shoulderR = bodyPoint(canonicalLandmarks, 12);
  const hipL = bodyPoint(canonicalLandmarks, 23);
  const hipR = bodyPoint(canonicalLandmarks, 24);
  const centerX = 0;
  const z = 0.52;
  const waistY = shoulderL.y - Math.abs(shoulderL.y - hipL.y) * 0.58;
  const waistHalf = clamp((p.waistW || 0.72) * 0.42, 0.26, 0.50);

  [
    [shoulderL.x, shoulderR.x, shoulderL.y + 0.035, 0.26],
    [-waistHalf, waistHalf, waistY, 0.22],
    [hipL.x, hipR.x, hipL.y - 0.02, 0.24]
  ].forEach(([x1, x2, y, tick]) => {
    group.add(neonLine([new THREE.Vector3(x1, y, z), new THREE.Vector3(x2, y, z)], 0.26));
    group.add(neonLine([new THREE.Vector3(x1, y - tick * 0.08, z), new THREE.Vector3(x1, y + tick * 0.08, z)], 0.20));
    group.add(neonLine([new THREE.Vector3(x2, y - tick * 0.08, z), new THREE.Vector3(x2, y + tick * 0.08, z)], 0.20));
  });

  group.userData.measurementLines = true;
  group.userData.measurementCenter = centerX;
}

function buildCanonicalAnatomicalBody(profile, sourceLandmarks) {
  const p = normalizeVisualProfile(profile || estimateBodyProfile(sourceLandmarks, appProfile()));
  const canonicalLandmarks = createCanonicalLandmarks(p, sourceLandmarks);
  const group = buildAnatomicalBody(p, canonicalLandmarks);
  group.name = 'bodytwin-canonical-anatomical-pose';
  group.userData.canonical = true;
  group.userData.sourceLandmarks = sourceLandmarks || [];
  group.userData.canonicalLandmarks = canonicalLandmarks;
  addScannerMeasurementLines(group, p, canonicalLandmarks);
  return group;
}

function buildAnatomicalBody(profile, worldLandmarks) {
  if (!worldLandmarks?.length) throw new Error('landmarks ausentes');
  const group = new THREE.Group();
  group.name = 'bodytwin-anatomical-procedural';
  group.userData.landmarks = worldLandmarks || [];
  const p = profile || estimateBodyProfile(worldLandmarks, appProfile());
  const shoulderL = bodyPoint(worldLandmarks, 11);
  const shoulderR = bodyPoint(worldLandmarks, 12);
  const hipL = bodyPoint(worldLandmarks, 23);
  const hipR = bodyPoint(worldLandmarks, 24);
  const shoulder = new THREE.Vector3().addVectors(shoulderL, shoulderR).multiplyScalar(0.5);
  const hip = new THREE.Vector3().addVectors(hipL, hipR).multiplyScalar(0.5);
  const torsoCenter = new THREE.Vector3().addVectors(shoulder, hip).multiplyScalar(0.5);
  const torsoHeight = Math.max(1.0, Math.abs(shoulder.y - hip.y) || p.torsoLen);

  const bellyW = Math.max(p.waistW * 0.52, p.hipW * 0.42, p.chestW * 0.45);
  const torsoProfile = [
    new THREE.Vector2(p.neckW * 0.58, torsoHeight * 0.55),
    new THREE.Vector2(p.shoulderW * 0.44, torsoHeight * 0.43),
    new THREE.Vector2(p.chestW * 0.50, torsoHeight * 0.27),
    new THREE.Vector2(p.chestW * 0.48, torsoHeight * 0.10),
    new THREE.Vector2(bellyW, -torsoHeight * 0.10),
    new THREE.Vector2(Math.max(p.waistW * 0.46, bellyW * 0.94), -torsoHeight * 0.25),
    new THREE.Vector2(p.hipW * 0.50, -torsoHeight * 0.42),
    new THREE.Vector2(p.hipW * 0.42, -torsoHeight * 0.53)
  ];
  addPremiumMesh(group, new THREE.LatheGeometry(torsoProfile, 48), torsoCenter, null, new THREE.Vector3(1, 1, 0.78), 1.20);

  const neckCenter = shoulder.clone().lerp(bodyPoint(worldLandmarks, 0), 0.25);
  addPremiumMesh(group, new THREE.CylinderGeometry(p.neckW * 1.08, p.neckW * 0.88, 0.32, 20, 4), neckCenter, null, new THREE.Vector3(0.86, 1, 0.72), 0.92);
  addPremiumMesh(group, new THREE.SphereGeometry(p.headR, 28, 20), bodyPoint(worldLandmarks, 0), null, new THREE.Vector3(0.82, 1.14, 0.76), 0.98);

  addAnatomicalJoint(group, shoulderL, p.upperArmR * 1.9, new THREE.Vector3(1.28, 0.95, 0.92), 0.82);
  addAnatomicalJoint(group, shoulderR, p.upperArmR * 1.9, new THREE.Vector3(1.28, 0.95, 0.92), 0.82);
  addAnatomicalJoint(group, hipL, p.thighR * 1.16, new THREE.Vector3(1.22, 0.92, 0.88), 0.76);
  addAnatomicalJoint(group, hipR, p.thighR * 1.16, new THREE.Vector3(1.22, 0.92, 0.88), 0.76);

  addAnatomicalLimb(group, 11, 13, 15, p.upperArmR * 1.18, p.forearmR * 1.12, p.forearmR * 1.18, 'arm');
  addAnatomicalLimb(group, 12, 14, 16, p.upperArmR * 1.18, p.forearmR * 1.12, p.forearmR * 1.18, 'arm');
  addAnatomicalLimb(group, 23, 25, 27, p.thighR * 1.22, p.calfR * 1.16, p.calfR * 1.22, 'leg');
  addAnatomicalLimb(group, 24, 26, 28, p.thighR * 1.22, p.calfR * 1.16, p.calfR * 1.22, 'leg');
  [[15, -1], [16, 1]].forEach(([idx, side]) => {
    const wrist = bodyPoint(worldLandmarks, idx).add(new THREE.Vector3(0.018 * side, -0.035, 0.06));
    addPremiumMesh(group, new THREE.SphereGeometry(p.forearmR * 0.92, 14, 10), wrist, null, new THREE.Vector3(0.78, 1.18, 0.48), 0.62);
  });
  [[27, -1], [28, 1]].forEach(([idx, side]) => {
    const ankle = bodyPoint(worldLandmarks, idx).add(new THREE.Vector3(0.03 * side, -0.105, 0.18));
    addPremiumMesh(group, makeCapsuleGeo(p.calfR * 0.58, p.calfR * 1.55, 4, 12), ankle, null, new THREE.Vector3(1.45, 0.42, 0.78), 0.58);
  });

  addAnatomicalDetailLines(group, p, worldLandmarks, torsoCenter, torsoHeight);

  const glowTex = createGlowTexture();
  const backGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0.30, blending: THREE.AdditiveBlending, depthWrite: false }));
  backGlow.position.set(0, 0.02, -0.95);
  backGlow.scale.set(4.7, 5.0, 1);
  group.add(backGlow);
  const chestGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex.clone(), transparent: true, opacity: 0.36, blending: THREE.AdditiveBlending, depthWrite: false }));
  chestGlow.position.copy(torsoCenter).add(new THREE.Vector3(0, torsoHeight * 0.18, 0.28));
  chestGlow.scale.set(0.96, 0.96, 1);
  group.add(chestGlow);
  group.userData.glows = { backGlow, chestGlow };

  const ringMat = new THREE.MeshBasicMaterial({ color: BODYTWIN_GRID, transparent: true, opacity: 0.22, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
  [1.05, 1.45, 1.85].forEach((r, idx) => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.012, 96), ringMat.clone());
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -2.35;
    ring.material.opacity = 0.22 - idx * 0.055;
    group.add(ring);
    group.userData.rings = [...(group.userData.rings || []), ring];
  });
  const grid = new THREE.GridHelper(3.2, 20, BODYTWIN_NEON, 0x0044aa);
  grid.position.y = -2.36;
  grid.material.transparent = true;
  grid.material.opacity = 0.20;
  group.add(grid);

  group.position.y = -0.05;
  group.userData.profile = p;
  group.userData.anatomical = true;
  return group;
}

// V118: corpo canônico de apresentação — posição fixa, proporcional ao perfil.
// Não segue os landmarks diretamente: usa-os apenas para medir proporções.
function buildCanonicalBody(profile) {
  const group = new THREE.Group();
  const p = normalizeVisualProfile(profile || {});

  // Extrair proporções já em unidades Three.js (estimateBodyProfile já escala)
  const sw  = Math.max(0.28, (p.shoulderW || 0.42) * 0.50);  // metade ombro
  const hw  = Math.max(0.22, (p.hipW      || 0.34) * 0.50);  // metade quadril
  const tl  = Math.max(0.90,  p.torsoLen  || 1.20);
  const ll  = Math.max(1.10,  p.legLen    || 1.55);
  const al  = Math.max(0.85,  p.armLen    || 1.10);
  const nr  = Math.max(0.07,  p.neckW     || 0.09);
  const hr  = Math.max(0.11,  p.headR     || 0.145);
  const uar = Math.max(0.04,  p.upperArmR || 0.065);
  const far = Math.max(0.03,  p.forearmR  || 0.050);
  const tr  = Math.max(0.05,  p.thighR    || 0.085);
  const cr  = Math.max(0.03,  p.calfR     || 0.060);
  const cw  = Math.max(0.22, (p.chestW    || 0.34) * 0.50);
  const ww  = Math.max(0.17, (p.waistW    || 0.28) * 0.50);

  // Skeleton canônico (Y cresce para cima, origem = centro do quadril)
  const hipY      = 0;
  const shoulderY = tl * 0.56;
  const neckY     = shoulderY + 0.15;
  const headY     = neckY + hr * 1.10;
  const kneeY     = hipY - ll * 0.46;
  const ankleY    = hipY - ll * 0.90;

  // Braços em A-pose real (~40° abaixo horizontal — natural, não T-pose)
  const elbowX_L = -(sw + al * 0.22);
  const elbowX_R =   sw + al * 0.22;
  const elbowY   = shoulderY - al * 0.42;
  const handX_L  = -(sw + al * 0.44);
  const handX_R  =   sw + al * 0.44;
  const handY    = shoulderY - al * 0.84;

  const J = {
    hipC:      new THREE.Vector3(0,          hipY,      0),
    hipL:      new THREE.Vector3(-hw,         hipY,      0),
    hipR:      new THREE.Vector3( hw,         hipY,      0),
    shoulderC: new THREE.Vector3(0,           shoulderY, 0),
    shoulderL: new THREE.Vector3(-sw,         shoulderY, 0),
    shoulderR: new THREE.Vector3( sw,         shoulderY, 0),
    neckC:     new THREE.Vector3(0,           neckY,     0),
    headC:     new THREE.Vector3(0,           headY,     0),
    elbowL:    new THREE.Vector3(elbowX_L,    elbowY,    0.04),
    elbowR:    new THREE.Vector3(elbowX_R,    elbowY,    0.04),
    handL:     new THREE.Vector3(handX_L,     handY,     0.07),
    handR:     new THREE.Vector3(handX_R,     handY,     0.07),
    kneeL:     new THREE.Vector3(-hw * 0.65,  kneeY,     0),
    kneeR:     new THREE.Vector3( hw * 0.65,  kneeY,     0),
    ankleL:    new THREE.Vector3(-hw * 0.55,  ankleY,    0),
    ankleR:    new THREE.Vector3( hw * 0.55,  ankleY,    0),
  };

  // Helper: cápsula entre dois Vector3
  function seg(a, b, radius, radSegs, boost) {
    radSegs = radSegs || 14;
    boost   = boost   || 1.0;
    const dir = b.clone().sub(a);
    const len = dir.length();
    if (len < 0.02) return;
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    addPremiumMesh(group, makeCapsuleGeo(radius, len, 4, radSegs), mid, q, null, boost);
    addCapsuleGrid(group, a, b, radius, 5, 8);
  }

  // Torso — LatheGeometry com silhueta humana (ombros, cintura, quadril)
  const torsoH   = shoulderY - hipY;
  const torsoMidY = hipY + torsoH * 0.50;
  const lathePts = [
    new THREE.Vector2(hw  * 0.90, -torsoH * 0.50),
    new THREE.Vector2(hw  * 0.94, -torsoH * 0.36),
    new THREE.Vector2(ww  * 1.08, -torsoH * 0.06),
    new THREE.Vector2(cw  * 1.02,  torsoH * 0.20),
    new THREE.Vector2(sw  * 0.96,  torsoH * 0.42),
    new THREE.Vector2(sw  * 0.68,  torsoH * 0.49),
    new THREE.Vector2(nr  * 1.15,  torsoH * 0.52),
  ];
  addPremiumMesh(group, new THREE.LatheGeometry(lathePts, 32),
    new THREE.Vector3(0, torsoMidY, 0), null, new THREE.Vector3(1, 1, 0.60), 1.2);
  const torsoRings = 14;
  for (let i = 1; i < torsoRings; i += 1) {
    const t = i / torsoRings;
    const pIdx = clamp(Math.round(t * (lathePts.length - 1)), 0, lathePts.length - 1);
    const r = lathePts[pIdx] ? lathePts[pIdx].x : cw;
    const y = hipY + torsoH * t;
    const pts = [];
    for (let s = 0; s <= 48; s += 1) {
      const a = (Math.PI * 2 * s) / 48;
      pts.push(new THREE.Vector3(
        Math.cos(a) * r,
        y,
        Math.sin(a) * r * 0.60
      ));
    }
    group.add(neonLine(pts, 0.82 - Math.abs(t - 0.5) * 2 * 0.25, BODYTWIN_NEON));
  }
  for (let rail = 0; rail < 10; rail += 1) {
    const a = (Math.PI * 2 * rail) / 10;
    const pts = [];
    for (let i = 0; i <= 14; i += 1) {
      const t = i / 14;
      const pIdx = clamp(Math.round(t * (lathePts.length - 1)), 0, lathePts.length - 1);
      const r = lathePts[pIdx] ? lathePts[pIdx].x : cw;
      pts.push(new THREE.Vector3(
        Math.cos(a) * r,
        hipY + torsoH * t,
        Math.sin(a) * r * 0.60
      ));
    }
    group.add(neonLine(pts, 0.55 + Math.abs(Math.cos(a)) * 0.20, BODYTWIN_NEON));
  }

  // Pescoço
  seg(J.neckC, J.headC.clone().lerp(J.neckC, 0.30), nr, 14, 0.9);

  // Cabeça
  addPremiumMesh(group, new THREE.SphereGeometry(hr, 22, 16),
    J.headC, null, new THREE.Vector3(0.88, 1.06, 0.80), 1.0);
  for (let lat = 1; lat <= 8; lat += 1) {
    const phi = (Math.PI * lat) / 9;
    const ry = J.headC.y + hr * 1.06 * Math.cos(phi);
    const rx = hr * 0.88 * Math.sin(phi);
    const rz = hr * 0.80 * Math.sin(phi);
    const pts = [];
    for (let s = 0; s <= 36; s += 1) {
      const a = (Math.PI * 2 * s) / 36;
      pts.push(new THREE.Vector3(
        J.headC.x + Math.cos(a) * rx,
        ry,
        J.headC.z + Math.sin(a) * rz
      ));
    }
    group.add(neonLine(pts, 0.65, BODYTWIN_NEON));
  }
  for (let lon = 0; lon < 8; lon += 1) {
    const a = (Math.PI * 2 * lon) / 8;
    const pts = [];
    for (let i = 0; i <= 12; i += 1) {
      const phi = (Math.PI * i) / 12;
      pts.push(new THREE.Vector3(
        J.headC.x + hr * 0.88 * Math.sin(phi) * Math.cos(a),
        J.headC.y + hr * 1.06 * Math.cos(phi),
        J.headC.z + hr * 0.80 * Math.sin(phi) * Math.sin(a)
      ));
    }
    group.add(neonLine(pts, 0.45, BODYTWIN_NEON));
  }

  // Braços
  seg(J.shoulderL, J.elbowL, uar, 16, 1.0);
  seg(J.elbowL,    J.handL,  far, 14, 0.95);
  seg(J.shoulderR, J.elbowR, uar, 16, 1.0);
  seg(J.elbowR,    J.handR,  far, 14, 0.95);

  // Pernas
  seg(J.hipL,  J.kneeL,  tr, 18, 1.05);
  seg(J.kneeL, J.ankleL, cr, 16, 1.00);
  seg(J.hipR,  J.kneeR,  tr, 18, 1.05);
  seg(J.kneeR, J.ankleR, cr, 16, 1.00);

  function glowSphere(pos, r) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(r, 12, 8),
      new THREE.MeshBasicMaterial({
        color: BODYTWIN_NEON,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    m.position.copy(pos);
    group.add(m);
  }
  [J.shoulderL, J.shoulderR].forEach(pos => glowSphere(pos, uar * 1.1));
  [J.elbowL, J.elbowR].forEach(pos => glowSphere(pos, uar * 0.75));
  [J.hipL, J.hipR].forEach(pos => glowSphere(pos, tr * 1.0));
  [J.kneeL, J.kneeR].forEach(pos => glowSphere(pos, tr * 0.75));

  // V119: articulações removidas — eram robóticas/mecânicas demais no visual

  // Mãos
  const handGeo = new THREE.SphereGeometry(far * 1.35, 16, 10);
  addPremiumMesh(group, handGeo.clone(), J.handL, null, new THREE.Vector3(0.78, 1.22, 0.38), 0.62);
  addPremiumMesh(group, handGeo.clone(), J.handR, null, new THREE.Vector3(0.78, 1.22, 0.38), 0.62);
  [-1, 1].forEach(side => {
    const hand = side < 0 ? J.handL : J.handR;
    for (let i = -2; i <= 2; i += 1) {
      const x = hand.x + side * far * (0.72 + Math.abs(i) * 0.04);
      const y = hand.y - far * (0.55 + Math.abs(i) * 0.08);
      const tip = new THREE.Vector3(x + side * far * 0.58, y - far * 0.48, hand.z + 0.02);
      addAvatarGridLine(group, [hand.clone().add(new THREE.Vector3(side * far * 0.28, i * far * 0.18, 0.04)), tip], 0.42);
    }
  });

  // Pés
  const footQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
  const fGeo  = makeCapsuleGeo(cr * 0.58, cr * 2.8, 3, 10);
  addPremiumMesh(group, fGeo.clone(),
    J.ankleL.clone().add(new THREE.Vector3(0, -cr * 0.4, cr * 0.9)), footQ, new THREE.Vector3(1, 1, 1.35), 0.55);
  addPremiumMesh(group, fGeo.clone(),
    J.ankleR.clone().add(new THREE.Vector3(0, -cr * 0.4, cr * 0.9)), footQ, new THREE.Vector3(1, 1, 1.35), 0.55);

  // Overlay anatômico (costelas, peitoral, abs, deltóides, pelve)
  addBodySurfaceGrid(group, J, p, torsoMidY, torsoH);
  addCanonicalAnatomyOverlay(group, p, J, torsoMidY, torsoH);

  // Glow de fundo e peito
  try {
    const gt = createGlowTexture();
    const bg = new THREE.Sprite(new THREE.SpriteMaterial({
      map: gt, transparent: true, opacity: 0.22,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    bg.position.set(0, torsoMidY + 0.1, -0.85);
    bg.scale.set(4.2, 5.2, 1);
    group.add(bg);
    const cg = new THREE.Sprite(new THREE.SpriteMaterial({
      map: gt.clone(), transparent: true, opacity: 0.34,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    cg.position.set(0, torsoMidY + torsoH * 0.18, 0.22);
    cg.scale.set(0.88, 0.88, 1);
    group.add(cg);
    group.userData.glows = { chestGlow: cg };
  } catch (_) {}

  // Anéis de scan no chão
  try {
    const groundY = ankleY - 0.16;
    const rm = new THREE.MeshBasicMaterial({
      color: BODYTWIN_NEON, transparent: true, opacity: 0.18,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
    });
    [1.05, 1.45, 1.85].forEach((r, idx) => {
      const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.012, 96), rm.clone());
      ring.rotation.x = Math.PI / 2;
      ring.position.y = groundY;
      ring.material.opacity = 0.20 - idx * 0.05;
      group.add(ring);
      group.userData.rings = [...(group.userData.rings || []), ring];
    });
    const grid = new THREE.GridHelper(3.2, 18, BODYTWIN_NEON, 0x062536);
    grid.position.y = groundY - 0.01;
    grid.material.transparent = true;
    grid.material.opacity = 0.16;
    group.add(grid);
  } catch (_) {}

  const totalHeight = headY + hr - ankleY;
  group.position.y = -(headY + hr + ankleY) / 2;
  group.userData.totalHeight = totalHeight;
  group.userData.profile = p;
  return group;
}

function addCanonicalAnatomyOverlay(group, p, J, torsoMidY, torsoH) {
  const anatomy = new THREE.Group();
  anatomy.name = 'anatomy-canonical';
  const zF  = 0.44;

  const sw  = Math.max(0.28, (p.shoulderW || 0.42) * 0.50);
  const cw  = Math.max(0.22, (p.chestW    || 0.34) * 0.50);
  const ww  = Math.max(0.17, (p.waistW    || 0.28) * 0.50);
  const hr  = Math.max(0.11,  p.headR     || 0.145);
  const uar = Math.max(0.04,  p.upperArmR || 0.065);
  const tr  = Math.max(0.05,  p.thighR    || 0.085);
  const cr  = Math.max(0.03,  p.calfR     || 0.060);

  // Coluna vertebral (linha de fundo)
  anatomy.add(neonLine([
    new THREE.Vector3(0, J.shoulderC.y + 0.04, -0.22),
    new THREE.Vector3(0, torsoMidY,             -0.20),
    new THREE.Vector3(0, J.hipC.y + 0.04,       -0.18),
  ], 0.88));

  // Costelas discretas — suporte visual, não skeleton/debug.
  for (let i = 0; i < 4; i++) {
    const y  = J.shoulderC.y - torsoH * (0.10 + i * 0.10);
    const rw = cw * (0.86 - i * 0.050);
    anatomy.add(arcLine(new THREE.Vector3(0, y, 0), rw, 0.052, Math.PI * 0.10, Math.PI * 0.90, zF, 24, 0.28));
    anatomy.add(arcLine(new THREE.Vector3(0, y, 0), rw, 0.052, Math.PI * 1.10, Math.PI * 1.90, zF, 24, 0.28));
  }

  // Peitoral (2 elipses)
  anatomy.add(ellipseLine(
    new THREE.Vector3(-cw * 0.40, J.shoulderC.y - torsoH * 0.14, 0),
    cw * 0.34, torsoH * 0.10, zF, 54, 0.62));
  anatomy.add(ellipseLine(
    new THREE.Vector3( cw * 0.40, J.shoulderC.y - torsoH * 0.14, 0),
    cw * 0.34, torsoH * 0.10, zF, 54, 0.62));

  // Abdômen: três curvas sutis, sem efeito "teclado".
  for (let row = 0; row < 3; row++) {
    const y = torsoMidY - torsoH * (0.02 + row * 0.105);
    anatomy.add(arcLine(new THREE.Vector3(0, y, 0), ww * 0.48, torsoH * 0.045, Math.PI * 0.08, Math.PI * 0.92, zF + 0.02, 26, 0.34));
  }

  // Deltóides (elipses nos ombros)
  anatomy.add(ellipseLine(J.shoulderL, uar * 2.4, uar * 1.55, zF * 0.45, 38, 0.46));
  anatomy.add(ellipseLine(J.shoulderR, uar * 2.4, uar * 1.55, zF * 0.45, 38, 0.46));

  // Pelve (2 arcos)
  const pelveR = J.hipR.x * 0.90;
  anatomy.add(arcLine(new THREE.Vector3(0, J.hipC.y + 0.03, 0), pelveR, torsoH * 0.12, Math.PI * 0.06, Math.PI * 0.94, zF, 38, 0.46));
  anatomy.add(arcLine(new THREE.Vector3(0, J.hipC.y + 0.03, 0), pelveR, torsoH * 0.12, Math.PI * 1.06, Math.PI * 1.94, zF, 38, 0.46));

  // V119: elipses musculares nos membros removidas — adicionavam ruído visual

  group.add(anatomy);
  return anatomy;
}

function buildPremiumBody(profile, worldLandmarks) {
  const group = new THREE.Group();
  group.userData.landmarks = worldLandmarks || [];
  const p = profile || estimateBodyProfile(worldLandmarks, appProfile());
  const shoulder = new THREE.Vector3().addVectors(bodyPoint(worldLandmarks, 11), bodyPoint(worldLandmarks, 12)).multiplyScalar(0.5);
  const hip = new THREE.Vector3().addVectors(bodyPoint(worldLandmarks, 23), bodyPoint(worldLandmarks, 24)).multiplyScalar(0.5);
  const torsoCenter = new THREE.Vector3().addVectors(shoulder, hip).multiplyScalar(0.5);
  const torsoHeight = Math.max(1.0, Math.abs(shoulder.y - hip.y) || p.torsoLen);

  const torsoProfile = [
    new THREE.Vector2(p.neckW * 0.58, torsoHeight * 0.52),
    new THREE.Vector2(p.shoulderW * 0.42, torsoHeight * 0.40),
    new THREE.Vector2(p.chestW * 0.46, torsoHeight * 0.20),
    new THREE.Vector2(p.waistW * 0.45, -torsoHeight * 0.12),
    new THREE.Vector2(p.hipW * 0.44, -torsoHeight * 0.40),
    new THREE.Vector2(p.hipW * 0.34, -torsoHeight * 0.50)
  ];
  addPremiumMesh(group, new THREE.LatheGeometry(torsoProfile, 36), torsoCenter, null, new THREE.Vector3(1, 1, 0.62), 1.15);

  const neckCenter = shoulder.clone().lerp(bodyPoint(worldLandmarks, 0), 0.28);
  addPremiumMesh(group, new THREE.CylinderGeometry(p.neckW, p.neckW * 0.88, 0.26, 18, 4), neckCenter, null, null, 0.9);
  const head = bodyPoint(worldLandmarks, 0);
  addPremiumMesh(group, new THREE.SphereGeometry(p.headR, 24, 18), head, null, new THREE.Vector3(0.86, 1.08, 0.78), 0.95);

  addCapsuleBetween(group, 11, 13, p.upperArmR, 16);
  addCapsuleBetween(group, 13, 15, p.forearmR, 16);
  addCapsuleBetween(group, 12, 14, p.upperArmR, 16);
  addCapsuleBetween(group, 14, 16, p.forearmR, 16);
  addCapsuleBetween(group, 23, 25, p.thighR, 18);
  addCapsuleBetween(group, 25, 27, p.calfR, 16);
  addCapsuleBetween(group, 24, 26, p.thighR, 18);
  addCapsuleBetween(group, 26, 28, p.calfR, 16);

  [11, 12, 23, 24].forEach(i => addPremiumMesh(group, new THREE.SphereGeometry(p.upperArmR * 1.18, 16, 12), bodyPoint(worldLandmarks, i), null, null, 0.65));
  [[15, p.forearmR], [16, p.forearmR], [27, p.calfR], [28, p.calfR]].forEach(([i, r]) => {
    addPremiumMesh(group, makeCapsuleGeo(r * 0.74, r * 1.35, 4, 10), bodyPoint(worldLandmarks, i), null, new THREE.Vector3(1.25, 0.62, 0.5), 0.55);
  });

  addAnatomyOverlay(group, p, worldLandmarks, torsoCenter, torsoHeight);

  const glowTex = createGlowTexture();
  const backGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
  backGlow.position.set(0, 0.05, -0.9);
  backGlow.scale.set(4.4, 4.8, 1);
  group.add(backGlow);
  const chestGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex.clone(), transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false }));
  chestGlow.position.copy(torsoCenter).add(new THREE.Vector3(0, torsoHeight * 0.17, 0.24));
  chestGlow.scale.set(0.9, 0.9, 1);
  group.add(chestGlow);
  group.userData.glows = { backGlow, chestGlow };

  const ringMat = new THREE.MeshBasicMaterial({ color: BODYTWIN_GRID, transparent: true, opacity: 0.22, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
  [1.05, 1.45, 1.85].forEach((r, idx) => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.012, 96), ringMat.clone());
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -2.35;
    ring.material.opacity = 0.22 - idx * 0.055;
    group.add(ring);
    group.userData.rings = [...(group.userData.rings || []), ring];
  });
  const grid = new THREE.GridHelper(3.2, 20, BODYTWIN_NEON, 0x0044aa);
  grid.position.y = -2.36;
  grid.material.transparent = true;
  grid.material.opacity = 0.22;
  group.add(grid);

  group.position.y = -0.05;
  group.userData.profile = p;
  return group;
}

function anatomyGender(profile = {}) {
  const raw = String(profile.genero || profile.gender || profile.sex || '').toLowerCase();
  if (/fem|mulher|female|woman|femenino|\u0436\u0435\u043d/.test(raw)) return 'female';
  return 'male';
}

function applyNeonMaterialToMesh(mesh) {
  if (!mesh?.geometry) return;
  mesh.material = new THREE.MeshBasicMaterial({
    color: 0x001133,
    transparent: true,
    opacity: 0.16,
    side: THREE.FrontSide,
    depthWrite: false
  });

  const wfGeomE = new THREE.EdgesGeometry(mesh.geometry, 1);
  const edgeLines = new THREE.LineSegments(
    wfGeomE,
    new THREE.LineBasicMaterial({
      color: 0x00ccff,
      transparent: true,
      opacity: 0.62,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  edgeLines.renderOrder = 2;
  mesh.add(edgeLines);

  const glowMesh = new THREE.Mesh(
    mesh.geometry,
    new THREE.MeshBasicMaterial({
      color: BODYTWIN_NEON,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  glowMesh.scale.setScalar(1.015);
  glowMesh.renderOrder = 0;
  mesh.add(glowMesh);
}

async function loadAnatomyModel(gender = 'male') {
  const safeGender = gender === 'female' ? 'female' : 'male';
  const cacheKey = `glb_${safeGender}`;
  if (GLB_CACHE[cacheKey] === null) return null;   // falha anterior registrada
  if (GLB_CACHE[cacheKey]) return GLB_CACHE[cacheKey]; // hit de cache positivo
  const paths = safeGender === 'male'
    ? [
        new URL('../vendor/bodytwin/body_hero_male.glb', import.meta.url).href,
        new URL('../vendor/bodytwin/body_male.glb', import.meta.url).href
      ]
    : [new URL('../vendor/bodytwin/body_female.glb', import.meta.url).href];

  // Timeout curto: o procedural aparece primeiro; o GLB so faz upgrade se vier rapido.
  const GLB_TIMEOUT_MS = 20000; // V138: aumentado para conexões lentas

  try {
    const { GLTFLoader } = await import('../vendor/bodytwin/GLTFLoader.js');
    const loader = new GLTFLoader();
    let lastErr = null;
    for (const path of paths) {
      try {
        const gltf = await Promise.race([
          new Promise((resolve, reject) => loader.load(path, resolve, undefined, reject)),
          new Promise((_, reject) => setTimeout(() => reject(new Error('GLB timeout')), GLB_TIMEOUT_MS))
        ]);
        gltf.userData = { ...(gltf.userData || {}), sourcePath: path };
        GLB_CACHE[cacheKey] = gltf;
        return gltf;
      } catch (pathErr) {
        lastErr = pathErr;
        console.warn(`[BodyTwin] GLB path falhou (${safeGender}):`, path, pathErr?.message || pathErr);
      }
    }
    throw lastErr || new Error('nenhum GLB carregado');
  } catch (err) {
    console.warn(`[BodyTwin] GLB ${safeGender} indisponivel, usando procedural:`, err?.message || err);
    GLB_CACHE[cacheKey] = null;
    return null;
  }
}

function fitAnatomyModelToStage(model) {
  model.position.set(0, 0, 0);
  model.rotation.set(0, 0, 0);
  model.scale.setScalar(1);
  model.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  const targetHeight = 3.25;
  const scale = size.y > 0 ? targetHeight / size.y : 1.85;
  model.scale.setScalar(scale);
  model.updateMatrixWorld(true);

  const fitted = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  fitted.getCenter(center);
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y += -2.22 - fitted.min.y;
  model.updateMatrixWorld(true);
}

function disposeThreeObject(obj) {
  if (!obj) return;
  obj.traverse?.(child => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) child.material.forEach(mat => mat?.dispose?.());
    else child.material?.dispose?.();
  });
}


function bodyShapeCoefficients(profile = {}) {
  const p = normalizeVisualProfile(profile || {});
  const shape = p.bodyShape || {};
  const endomorph = clamp(Number(shape.endomorph01 || 0), 0, 1);
  const waistToHip = Number(shape.waistToHip || (p.waistW / Math.max(p.hipW, 0.01)));
  const waistToShoulder = Number(shape.waistToShoulder || (p.waistW / Math.max(p.shoulderW, 0.01)));
  const abdomenX = clamp(Number(shape.abdomenScale || 1) * Math.max(1, waistToHip), 1, 1.50);
  const abdomenZ = clamp(Number(shape.depthScale || 1) * (1 + endomorph * 0.12), 1, 1.72);
  const chestX = clamp(Number(shape.chestScale || 1) * (1 + endomorph * 0.06), 1, 1.30);
  const hipX = clamp(Math.max(1, p.hipW / Math.max(p.shoulderW * 0.82, 0.01)) * (1 + endomorph * 0.06), 1, 1.24);
  return { endomorph, waistToHip, waistToShoulder, abdomenX, abdomenZ, chestX, hipX };
}

function applyAnthropometricMorphToModel(model, profile = {}) {
  if (!model) return;
  const coeff = bodyShapeCoefficients(profile);
  const modelBox = new THREE.Box3().setFromObject(model);
  const minY = modelBox.min.y;
  const height = Math.max(0.001, modelBox.max.y - modelBox.min.y);
  const centerX = (modelBox.min.x + modelBox.max.x) * 0.5;
  const centerZ = (modelBox.min.z + modelBox.max.z) * 0.5;
  const width = Math.max(0.001, modelBox.max.x - modelBox.min.x);
  const torsoRadius = width * 0.28;

  model.traverse(child => {
    if (child.isBone) {
      const name = String(child.name || '').toLowerCase();
      if (/spine|abdomen|belly|stomach|waist/.test(name)) {
        child.scale.x *= coeff.abdomenX;
        child.scale.z *= coeff.abdomenZ;
      } else if (/chest|rib|thorax|pectoral/.test(name)) {
        child.scale.x *= coeff.chestX;
        child.scale.z *= clamp(1 + coeff.endomorph * 0.18, 1, 1.28);
      } else if (/hip|pelvis/.test(name)) {
        child.scale.x *= coeff.hipX;
        child.scale.z *= clamp(1 + coeff.endomorph * 0.16, 1, 1.25);
      }
      child.updateMatrixWorld(true);
      return;
    }

    if (!child.isMesh || !child.geometry?.attributes?.position) return;
    child.geometry = child.geometry.clone();
    const geom = child.geometry;
    const pos = geom.attributes.position;
    const local = new THREE.Vector3();
    const world = new THREE.Vector3();
    const inv = child.matrixWorld.clone().invert();

    for (let i = 0; i < pos.count; i += 1) {
      local.fromBufferAttribute(pos, i);
      world.copy(local).applyMatrix4(child.matrixWorld);
      const y01 = clamp((world.y - minY) / height, 0, 1);
      const abdomenBand = Math.exp(-Math.pow((y01 - 0.50) / 0.145, 2));
      const chestBand = Math.exp(-Math.pow((y01 - 0.67) / 0.120, 2));
      const hipBand = Math.exp(-Math.pow((y01 - 0.36) / 0.100, 2));
      const neckHeadGuard = clamp((0.86 - y01) / 0.16, 0, 1);
      const torsoMask = clamp(1 - (Math.abs(world.x - centerX) / torsoRadius - 0.78) / 0.42, 0, 1);
      const xScale = 1
        + (coeff.abdomenX - 1) * abdomenBand * neckHeadGuard * torsoMask
        + (coeff.chestX - 1) * chestBand * neckHeadGuard * torsoMask
        + (coeff.hipX - 1) * hipBand * neckHeadGuard * torsoMask;
      const zScale = 1
        + (coeff.abdomenZ - 1) * abdomenBand * neckHeadGuard * torsoMask
        + (clamp(1 + coeff.endomorph * 0.14, 1, 1.20) - 1) * chestBand * neckHeadGuard * torsoMask
        + (clamp(1 + coeff.endomorph * 0.12, 1, 1.18) - 1) * hipBand * neckHeadGuard * torsoMask;
      world.x = centerX + (world.x - centerX) * xScale;
      world.z = centerZ + (world.z - centerZ) * zScale;
      local.copy(world).applyMatrix4(inv);
      pos.setXYZ(i, local.x, local.y, local.z);
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals?.();
    geom.computeBoundingBox?.();
    geom.computeBoundingSphere?.();
  });
  model.updateMatrixWorld(true);
}

function addDeformedModelEdges(model, thresholdAngle = 18) {
  model.traverse(child => {
    if (!child.isMesh || !child.geometry) return;
    const edgeLines = new THREE.LineSegments(
      new THREE.EdgesGeometry(child.geometry, thresholdAngle),
      new THREE.LineBasicMaterial({
        color: BODYTWIN_NEON,
        transparent: true,
        opacity: 0.035,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    edgeLines.renderOrder = 4;
    child.add(edgeLines);
  });
}


// V132 - Silhouette-driven real morph: a foto define as larguras anatomicas.
function drawHolographicBodyGrid(group, p, H, bottomY) {
  const totalH = Math.max(2.65, Number(H || 3.1));
  const by = Number(bottomY || -totalH * 0.48);
  const C = BODYTWIN_NEON;
  const coeff = bodyShapeCoefficients(p || {});
  const widths = p?.silhouetteWidths || null;
  const referenceBase = Boolean(p?.bodyShape?.premiumReferenceBase && !widths);
  const unitScale = totalH / 3.2;
  const shoulderHalf = clamp(Number(p?.shoulderW || 1.0) * 0.50 * unitScale, totalH * 0.112, totalH * 0.190);
  const widthRadius = (key, fallback) => clamp(shoulderHalf * silhouetteNorm(widths, key, fallback) / Math.max(silhouetteNorm(widths, 'shoulders', 0.82), 0.01), totalH * 0.018, totalH * 0.245);

  const rNeck = widthRadius('neck', referenceBase ? 0.24 : 0.28);
  const rShoulder = widthRadius('shoulders', referenceBase ? 0.92 : 0.82);
  const rChest = widthRadius('chest', referenceBase ? 0.78 : 0.78);
  const rUpperAbdomen = widthRadius('upperAbdomen', referenceBase ? 0.64 : 0.80);
  const rBelly = widthRadius('belly', referenceBase ? 0.58 : 0.86) * (referenceBase ? 1 : clamp(coeff.abdomenX, 1, 1.28));
  const rWaist = referenceBase ? widthRadius('waist', 0.52) : Math.max(widthRadius('waist', 0.80), rBelly * 0.94);
  const rHip = referenceBase ? widthRadius('hip', 0.66) : Math.max(widthRadius('hip', 0.74), rWaist * 0.88);
  const headR = clamp(Number(p?.headR || 0.15) * unitScale, totalH * 0.046, totalH * 0.075);
  const upperArmR = clamp(Number(p?.upperArmR || 0.065) * unitScale, totalH * 0.018, totalH * 0.040);
  const forearmR = clamp(Number(p?.forearmR || 0.050) * unitScale, totalH * 0.014, totalH * 0.032);
  const thighR = clamp(Number(p?.thighR || 0.090) * unitScale, totalH * 0.038, totalH * 0.070);
  const calfR = clamp(Number(p?.calfR || 0.064) * unitScale, totalH * 0.024, totalH * 0.052);

  const hipY = by + totalH * 0.365;
  const shoulderY = by + totalH * 0.725;
  const torsoH = shoulderY - hipY;
  const torsoMidY = hipY + torsoH * 0.50;
  const neckY = shoulderY + totalH * 0.070;
  const headY = neckY + headR * 1.18;
  const kneeY = by + totalH * 0.180;
  const ankleY = by + totalH * 0.035;

  function makeFresnelMaterial(opacity) {
    return new THREE.ShaderMaterial({
      uniforms: { glowColor: { value: new THREE.Color(C) }, uOpacity: { value: opacity } },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float uOpacity;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewPosition)), 0.0), 2.15);
          gl_FragColor = vec4(glowColor, rim * uOpacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide
    });
  }

  function addCyberMesh(geometry, position, quaternion = null, scale = null, fillOpacity = 0.10, edgeOpacity = 0.78) {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: 0x001a3a,
      transparent: true,
      opacity: fillOpacity,
      side: THREE.DoubleSide,
      depthWrite: false
    }));
    mesh.position.copy(position);
    if (quaternion) mesh.quaternion.copy(quaternion);
    if (scale) mesh.scale.copy(scale);
    mesh.renderOrder = 2;
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 24), new THREE.LineBasicMaterial({
      color: C,
      transparent: true,
      opacity: edgeOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    edge.renderOrder = 3;
    mesh.add(edge);
    const rim = new THREE.Mesh(geometry, makeFresnelMaterial(0.30));
    rim.scale.setScalar(1.018);
    rim.renderOrder = 1;
    mesh.add(rim);
    group.add(mesh);
    return mesh;
  }

  function quatBetween(start, end) {
    const dir = new THREE.Vector3().subVectors(end, start);
    if (dir.lengthSq() < 0.00001) return new THREE.Quaternion();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  }

  function addRing(center, rx, rz, opacity = 0.46, segs = 56) {
    const pts = [];
    for (let i = 0; i <= segs; i += 1) {
      const a = (Math.PI * 2 * i) / segs;
      pts.push(new THREE.Vector3(center.x + Math.cos(a) * rx, center.y, center.z + Math.sin(a) * rz));
    }
    group.add(neonLine(pts, opacity, C));
  }

  function addProfileRails(profile, origin, zScale, railCount = 22, opacity = 0.31) {
    for (let rail = 0; rail < railCount; rail += 1) {
      const a = (Math.PI * 2 * rail) / railCount;
      const pts = profile.map(pt => new THREE.Vector3(
        origin.x + Math.cos(a) * pt.x,
        origin.y + pt.y,
        origin.z + Math.sin(a) * pt.x * zScale
      ));
      group.add(neonLine(pts, opacity + Math.abs(Math.cos(a)) * 0.14, C));
    }
  }

  function addLimb(start, end, startRadius, endRadius, radialSegments = 24, heightSegments = 8, boost = 1) {
    const vector = new THREE.Vector3().subVectors(end, start);
    const length = vector.length();
    if (length < 0.02) return;
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const geometry = new THREE.CylinderGeometry(endRadius, startRadius, length, radialSegments, heightSegments, false);
    addCyberMesh(geometry, mid, quatBetween(start, end), null, 0.080 * boost, 0.66 * boost);
    for (let i = 1; i < heightSegments; i += 1) {
      const t = i / heightSegments;
      const center = start.clone().lerp(end, t);
      const radius = startRadius + (endRadius - startRadius) * t;
      addRing(center, radius, radius * 0.82, 0.22 + 0.08 * boost, radialSegments * 2);
    }
  }

  function addHeadGrid(center) {
    addCyberMesh(new THREE.SphereGeometry(headR, 30, 20), center, null, new THREE.Vector3(0.86, 1.10, 0.78), 0.07, 0.68);
    for (let lat = 1; lat <= 10; lat += 1) {
      const phi = (Math.PI * lat) / 11;
      const y = center.y + Math.cos(phi) * headR * 1.10;
      const r = Math.sin(phi);
      addRing(new THREE.Vector3(center.x, y, center.z), headR * 0.86 * r, headR * 0.76 * r, 0.42, 52);
    }
  }

  const J = {
    shoulderL: new THREE.Vector3(-rShoulder, shoulderY, 0),
    shoulderR: new THREE.Vector3(rShoulder, shoulderY, 0),
    elbowL: new THREE.Vector3(-rShoulder - totalH * 0.090, shoulderY - totalH * 0.150, totalH * 0.018),
    elbowR: new THREE.Vector3(rShoulder + totalH * 0.090, shoulderY - totalH * 0.150, totalH * 0.018),
    handL: new THREE.Vector3(-rHip - totalH * 0.155, hipY + totalH * 0.020, totalH * 0.060),
    handR: new THREE.Vector3(rHip + totalH * 0.155, hipY + totalH * 0.020, totalH * 0.060),
    hipL: new THREE.Vector3(-rHip * 0.72, hipY, 0),
    hipR: new THREE.Vector3(rHip * 0.72, hipY, 0),
    kneeL: new THREE.Vector3(-rHip * 0.52, kneeY, totalH * 0.010),
    kneeR: new THREE.Vector3(rHip * 0.52, kneeY, totalH * 0.010),
    ankleL: new THREE.Vector3(-rHip * 0.42, ankleY, totalH * 0.020),
    ankleR: new THREE.Vector3(rHip * 0.42, ankleY, totalH * 0.020)
  };

  const rawProfile = referenceBase ? [
    new THREE.Vector2(rHip * 0.88, -torsoH * 0.52),
    new THREE.Vector2(rHip * 1.06, -torsoH * 0.42),
    new THREE.Vector2(rWaist * 1.08, -torsoH * 0.27),
    new THREE.Vector2(rBelly * 1.03, -torsoH * 0.10),
    new THREE.Vector2(rUpperAbdomen * 1.02, torsoH * 0.08),
    new THREE.Vector2(rChest * 1.06, torsoH * 0.26),
    new THREE.Vector2(rShoulder * 1.08, torsoH * 0.39),
    new THREE.Vector2(rShoulder * 0.88, torsoH * 0.47),
    new THREE.Vector2(rNeck * 1.36, torsoH * 0.545),
    new THREE.Vector2(rNeck * 1.00, torsoH * 0.57)
  ] : [
    new THREE.Vector2(rHip * 0.88, -torsoH * 0.52),
    new THREE.Vector2(rHip * 1.02, -torsoH * 0.43),
    new THREE.Vector2(Math.max(rWaist * 0.98, rHip * 1.02), -torsoH * 0.31),
    new THREE.Vector2(Math.max(rBelly * 1.04, rWaist), -torsoH * 0.16),
    new THREE.Vector2(rBelly * 1.08, torsoH * 0.00),
    new THREE.Vector2(Math.max(rUpperAbdomen, rBelly * 0.94), torsoH * 0.15),
    new THREE.Vector2(Math.max(rChest, rUpperAbdomen * 0.96), torsoH * 0.29),
    new THREE.Vector2(rShoulder * 1.04, torsoH * 0.40),
    new THREE.Vector2(rShoulder * 0.88, torsoH * 0.48),
    new THREE.Vector2(rNeck * 1.30, torsoH * 0.545),
    new THREE.Vector2(rNeck * 0.98, torsoH * 0.57)
  ];
  const curvePts = [];
  for (let i = 0; i < rawProfile.length - 1; i += 1) {
    const a = rawProfile[i];
    const b = rawProfile[i + 1];
    const c1 = new THREE.Vector2(a.x, a.y + (b.y - a.y) * 0.45);
    const c2 = new THREE.Vector2(b.x, a.y + (b.y - a.y) * 0.55);
    for (let s = 0; s < 5; s += 1) {
      const t = s / 5;
      const mt = 1 - t;
      curvePts.push(new THREE.Vector2(
        mt * mt * mt * a.x + 3 * mt * mt * t * c1.x + 3 * mt * t * t * c2.x + t * t * t * b.x,
        mt * mt * mt * a.y + 3 * mt * mt * t * c1.y + 3 * mt * t * t * c2.y + t * t * t * b.y
      ));
    }
  }
  curvePts.push(rawProfile[rawProfile.length - 1]);

  addCyberMesh(
    new THREE.LatheGeometry(curvePts, 36),
    new THREE.Vector3(0, torsoMidY, 0),
    null,
    new THREE.Vector3(1, 1, clamp(0.72 * coeff.abdomenZ, 0.72, 1.30)),
    0.10,
    0.82
  );
  rawProfile.slice(1, -1).forEach(pt => addRing(new THREE.Vector3(0, torsoMidY + pt.y, 0), pt.x, pt.x * clamp(0.72 * coeff.abdomenZ, 0.72, 1.30), 0.46, 64));
  addProfileRails(curvePts, new THREE.Vector3(0, torsoMidY, 0), clamp(0.72 * coeff.abdomenZ, 0.72, 1.30), 24, 0.30);

  addLimb(new THREE.Vector3(0, shoulderY + totalH * 0.012, 0), new THREE.Vector3(0, neckY, 0), rNeck * 0.86, rNeck * 0.78, 20, 4, 0.82);
  addHeadGrid(new THREE.Vector3(0, headY, 0));
  addLimb(J.shoulderL, J.elbowL, upperArmR * 1.08, upperArmR * 0.94, 26, 8, 0.94);
  addLimb(J.elbowL, J.handL, forearmR * 1.04, forearmR * 0.86, 24, 8, 0.88);
  addLimb(J.shoulderR, J.elbowR, upperArmR * 1.08, upperArmR * 0.94, 26, 8, 0.94);
  addLimb(J.elbowR, J.handR, forearmR * 1.04, forearmR * 0.86, 24, 8, 0.88);
  addLimb(J.hipL, J.kneeL, thighR * 1.10, thighR * 0.90, 28, 10, 0.95);
  addLimb(J.kneeL, J.ankleL, calfR * 1.06, calfR * 0.78, 26, 10, 0.90);
  addLimb(J.hipR, J.kneeR, thighR * 1.10, thighR * 0.90, 28, 10, 0.95);
  addLimb(J.kneeR, J.ankleR, calfR * 1.06, calfR * 0.78, 26, 10, 0.90);

  [J.shoulderL, J.shoulderR].forEach(pos => addCyberMesh(new THREE.SphereGeometry(upperArmR * 1.25, 20, 14), pos, null, new THREE.Vector3(1.12, 0.86, 0.82), 0.08, 0.56));
  [J.elbowL, J.elbowR].forEach(pos => addCyberMesh(new THREE.SphereGeometry(upperArmR * 0.86, 18, 12), pos, null, null, 0.07, 0.48));
  [J.hipL, J.hipR].forEach(pos => addCyberMesh(new THREE.SphereGeometry(thighR * 0.88, 18, 12), pos, null, null, 0.07, 0.46));
  [J.kneeL, J.kneeR].forEach(pos => addCyberMesh(new THREE.SphereGeometry(thighR * 0.66, 18, 12), pos, null, null, 0.07, 0.46));

  [-1, 1].forEach(side => {
    const hand = side < 0 ? J.handL : J.handR;
    addCyberMesh(new THREE.SphereGeometry(forearmR * 1.18, 18, 12), hand, null, new THREE.Vector3(0.86, 1.20, 0.44), 0.07, 0.50);
    for (let i = -2; i <= 2; i += 1) {
      const base = hand.clone().add(new THREE.Vector3(side * forearmR * 0.45, i * forearmR * 0.26, forearmR * 0.08));
      const tip = base.clone().add(new THREE.Vector3(side * forearmR * (0.95 + Math.abs(i) * 0.10), -forearmR * (0.52 + Math.abs(i) * 0.08), forearmR * 0.12));
      group.add(neonLine([base, tip], 0.42, C));
    }
    const toe = (side < 0 ? J.ankleL : J.ankleR).clone().add(new THREE.Vector3(side * calfR * 0.08, -calfR * 0.20, calfR * 2.10));
    const footQ = quatBetween(side < 0 ? J.ankleL : J.ankleR, toe);
    addCyberMesh(new THREE.CylinderGeometry(calfR * 0.42, calfR * 0.58, calfR * 2.10, 18, 3, false), (side < 0 ? J.ankleL : J.ankleR).clone().lerp(toe, 0.5), footQ, new THREE.Vector3(1.18, 0.80, 1.0), 0.07, 0.48);
    for (let i = -2; i <= 2; i += 1) {
      const a = toe.clone().add(new THREE.Vector3(i * calfR * 0.18, 0, calfR * 0.08));
      const b = a.clone().add(new THREE.Vector3(i * calfR * 0.03, -calfR * 0.04, calfR * 0.36));
      group.add(neonLine([a, b], 0.34, C));
    }
  });

  [-1, 1].forEach(side => {
    const chestLine = [];
    for (let i = 0; i <= 28; i += 1) {
      const t = i / 28;
      const a = Math.PI * (0.08 + t * 0.84);
      chestLine.push(new THREE.Vector3(
        side * Math.cos(a) * rChest * 0.46 + side * rChest * 0.20,
        torsoMidY + torsoH * (0.23 + Math.sin(a) * 0.055),
        Math.sin(a) * rChest * 0.34 + 0.20
      ));
    }
    group.add(neonLine(chestLine, 0.46, C));
  });
  for (let i = -1; i <= 1; i += 1) {
    const x = i * Math.max(rBelly * 0.16, totalH * 0.025);
    group.add(neonLine([
      new THREE.Vector3(x, torsoMidY + torsoH * 0.12, 0.28),
      new THREE.Vector3(x * 0.72, torsoMidY - torsoH * 0.05, 0.31),
      new THREE.Vector3(x * 0.52, torsoMidY - torsoH * 0.22, 0.24)
    ], 0.38, C));
  }
}





function buildReferenceMappedHologramAvatar(profile = {}, silhouette = null) {
  const hasSilhouette = Boolean(silhouette?.widths?.levels || profile?.silhouetteWidths?.levels);
  const sourceProfile = hasSilhouette ? { ...(profile || {}) } : {
    ...(profile || {}),
    gender: 'male',
    shoulderW: 1.12,
    chestW: 0.88,
    waistW: 0.60,
    hipW: 0.72,
    neckW: 0.16,
    headR: 0.17,
    upperArmR: 0.068,
    forearmR: 0.050,
    thighR: 0.096,
    calfR: 0.064,
    torsoLen: 1.30,
    legLen: 1.90,
    armLen: 1.34,
    bodyShape: {
      ...((profile || {}).bodyShape || {}),
      premiumReferenceBase: true,
      referenceMappedHologram: true,
      endomorph01: 0,
      abdomenScale: 1,
      depthScale: 1,
      chestScale: 1.08
    }
  };
  if (silhouette?.widths?.levels) sourceProfile.silhouetteWidths = silhouette.widths;
  const p = normalizeVisualProfile(sourceProfile);
  const widths = p.silhouetteWidths || null;
  const group = new THREE.Group();
  group.name = BT_VERSION;
  group.userData.profile = p;
  group.userData.mode = 'reference-mapped-procedural';
  group.userData.silhouette = silhouette || widths || null;

  const C = BODYTWIN_NEON;
  const H = Math.max(3.42, Math.min(3.78,
    Number(p.legLen || 1.9) + Number(p.torsoLen || 1.3) + Number(p.headR || 0.17) * 2.35
  ));
  const by = -H * 0.50;
  const unit = H / 3.62;
  const shoulderHalf = clamp(Number(p.shoulderW || 1.12) * 0.50 * unit, H * 0.145, H * 0.205);
  const widthRadius = (key, fallback) => clamp(
    shoulderHalf * silhouetteNorm(widths, key, fallback) / Math.max(silhouetteNorm(widths, 'shoulders', 0.92), 0.01),
    H * 0.018,
    H * 0.235
  );

  const rShoulder = widthRadius('shoulders', 0.92);
  const rChest = widthRadius('chest', 0.80);
  const rRib = widthRadius('upperAbdomen', 0.68);
  const rWaist = widthRadius('waist', 0.55);
  const rBelly = hasSilhouette ? widthRadius('belly', 0.76) : widthRadius('belly', 0.58);
  const rHip = widthRadius('hip', 0.68);
  const rNeck = widthRadius('neck', 0.24);
  const torsoZ = hasSilhouette ? 0.82 : 0.68;
  const headR = clamp(Number(p.headR || 0.17) * unit, H * 0.058, H * 0.078);
  const upperArmR = clamp(Number(p.upperArmR || 0.068) * unit, H * 0.020, H * 0.034);
  const forearmR = clamp(Number(p.forearmR || 0.050) * unit, H * 0.015, H * 0.028);
  const thighR = clamp(Number(p.thighR || 0.096) * unit, H * 0.034, H * 0.056);
  const calfR = clamp(Number(p.calfR || 0.064) * unit, H * 0.022, H * 0.042);

  const footY = by + H * 0.040;
  const ankleY = by + H * 0.090;
  const kneeY = by + H * 0.285;
  const hipY = by + H * 0.480;
  const waistY = by + H * 0.615;
  const chestY = by + H * 0.750;
  const shoulderY = by + H * 0.805;
  const neckBaseY = by + H * 0.825;
  const neckTopY = by + H * 0.895;
  const headY = by + H * 0.965;

  function fresnel(opacity = 0.34) {
    return new THREE.ShaderMaterial({
      uniforms: { glowColor: { value: new THREE.Color(C) }, uOpacity: { value: opacity } },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float uOpacity;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewPosition)), 0.0), 2.55);
          gl_FragColor = vec4(glowColor, rim * uOpacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide
    });
  }

  function addMesh(geometry, position, options = {}) {
    const fill = new THREE.MeshBasicMaterial({
      color: options.fillColor || 0x001632,
      transparent: true,
      opacity: options.fillOpacity ?? 0.055,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geometry, fill);
    mesh.position.copy(position || new THREE.Vector3());
    if (options.quaternion) mesh.quaternion.copy(options.quaternion);
    if (options.rotation) mesh.rotation.set(options.rotation.x || 0, options.rotation.y || 0, options.rotation.z || 0);
    if (options.scale) mesh.scale.copy(options.scale);
    mesh.renderOrder = 2;

    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 24), new THREE.LineBasicMaterial({
      color: C,
      transparent: true,
      opacity: options.edgeOpacity ?? 0.50,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    edge.renderOrder = 4;
    mesh.add(edge);

    const rim = new THREE.Mesh(geometry, fresnel(options.rimOpacity ?? 0.30));
    rim.scale.setScalar(1.020);
    rim.renderOrder = 1;
    mesh.add(rim);
    group.add(mesh);
    return mesh;
  }

  function qBetween(start, end) {
    const dir = new THREE.Vector3().subVectors(end, start);
    if (dir.lengthSq() < 0.00001) return new THREE.Quaternion();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  }

  function ellipse(center, rx, rz, opacity = 0.35, segs = 76) {
    const pts = [];
    for (let i = 0; i <= segs; i += 1) {
      const a = Math.PI * 2 * i / segs;
      pts.push(new THREE.Vector3(center.x + Math.cos(a) * rx, center.y, center.z + Math.sin(a) * rz));
    }
    group.add(neonLine(pts, opacity, C));
  }

  function curve(points, opacity = 0.42) {
    group.add(neonLine(points, opacity, C));
  }

  function bezier(a, b, c, d, steps = 36) {
    const pts = [];
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const mt = 1 - t;
      pts.push(new THREE.Vector3(
        mt * mt * mt * a.x + 3 * mt * mt * t * b.x + 3 * mt * t * t * c.x + t * t * t * d.x,
        mt * mt * mt * a.y + 3 * mt * mt * t * b.y + 3 * mt * t * t * c.y + t * t * t * d.y,
        mt * mt * mt * a.z + 3 * mt * mt * t * b.z + 3 * mt * t * t * c.z + t * t * t * d.z
      ));
    }
    return pts;
  }

  const torsoProfile = [
    new THREE.Vector2(rHip * 0.68, hipY - by - H * 0.035),
    new THREE.Vector2(rHip * 0.95, hipY - by + H * 0.020),
    new THREE.Vector2(Math.max(rWaist, rBelly * 0.88), waistY - by - H * 0.018),
    new THREE.Vector2(rRib, waistY - by + H * 0.092),
    new THREE.Vector2(rChest * 1.04, chestY - by),
    new THREE.Vector2(rShoulder * 1.04, shoulderY - by - H * 0.014),
    new THREE.Vector2(rShoulder * 0.84, shoulderY - by + H * 0.034),
    new THREE.Vector2(rNeck * 1.38, neckBaseY - by),
    new THREE.Vector2(rNeck * 0.98, neckTopY - by - H * 0.010)
  ];
  const smoothTorso = [];
  for (let i = 0; i < torsoProfile.length - 1; i += 1) {
    const a = torsoProfile[i];
    const d = torsoProfile[i + 1];
    const b = new THREE.Vector2(a.x, a.y + (d.y - a.y) * 0.42);
    const c2 = new THREE.Vector2(d.x, a.y + (d.y - a.y) * 0.58);
    for (let s = 0; s < 7; s += 1) {
      const t = s / 7;
      const mt = 1 - t;
      smoothTorso.push(new THREE.Vector2(
        mt * mt * mt * a.x + 3 * mt * mt * t * b.x + 3 * mt * t * t * c2.x + t * t * t * d.x,
        mt * mt * mt * a.y + 3 * mt * mt * t * b.y + 3 * mt * t * t * c2.y + t * t * t * d.y
      ));
    }
  }
  smoothTorso.push(torsoProfile[torsoProfile.length - 1]);
  const torso = addMesh(new THREE.LatheGeometry(smoothTorso, 56), new THREE.Vector3(0, by, 0), {
    scale: new THREE.Vector3(1, 1, torsoZ),
    fillOpacity: 0.065,
    edgeOpacity: 0.46,
    rimOpacity: 0.38
  });
  torso.name = 'reference-mapped-organic-torso';

  const torsoLevels = [
    [hipY, rHip * 0.96, 0.30],
    [waistY - H * 0.055, Math.max(rWaist, rBelly * 0.90), 0.32],
    [waistY + H * 0.025, rRib * 0.98, 0.34],
    [chestY - H * 0.035, rChest * 1.02, 0.40],
    [shoulderY - H * 0.012, rShoulder * 1.06, 0.48],
    [neckBaseY, rNeck * 1.33, 0.40],
    [neckTopY, rNeck * 0.95, 0.36]
  ];
  torsoLevels.forEach(([y, r, op]) => ellipse(new THREE.Vector3(0, y, 0), r, r * torsoZ, op, 88));
  for (let rail = 0; rail < 26; rail += 1) {
    const a = Math.PI * 2 * rail / 26;
    const pts = smoothTorso.map(pt => new THREE.Vector3(
      Math.cos(a) * pt.x,
      by + pt.y,
      Math.sin(a) * pt.x * torsoZ
    ));
    curve(pts, 0.22 + Math.abs(Math.cos(a)) * 0.20);
  }

  [-1, 1].forEach(side => {
    addMesh(new THREE.SphereGeometry(rChest * 0.30, 32, 18), new THREE.Vector3(side * rChest * 0.34, chestY - H * 0.020, rChest * 0.42), {
      scale: new THREE.Vector3(1.28, 0.42, 0.55),
      fillOpacity: 0.045,
      edgeOpacity: 0.34,
      rimOpacity: 0.26
    });
    curve(bezier(
      new THREE.Vector3(side * rChest * 0.06, chestY - H * 0.005, rChest * 0.50),
      new THREE.Vector3(side * rChest * 0.22, chestY + H * 0.040, rChest * 0.55),
      new THREE.Vector3(side * rChest * 0.58, chestY + H * 0.020, rChest * 0.44),
      new THREE.Vector3(side * rChest * 0.72, chestY - H * 0.045, rChest * 0.34),
      38
    ), 0.58);
  });

  for (let i = -2; i <= 2; i += 1) {
    const x = i * rWaist * 0.18;
    curve(bezier(
      new THREE.Vector3(x, chestY - H * 0.075, rRib * 0.58),
      new THREE.Vector3(x * 0.75, waistY + H * 0.070, rRib * 0.62),
      new THREE.Vector3(x * 0.55, waistY - H * 0.030, rBelly * 0.55),
      new THREE.Vector3(x * 0.35, hipY + H * 0.050, rHip * 0.42),
      36
    ), i === 0 ? 0.62 : 0.38);
  }
  [chestY - H * 0.095, waistY + H * 0.045, waistY - H * 0.035].forEach((y, idx) => {
    curve(bezier(
      new THREE.Vector3(-rWaist * 0.34, y, rBelly * 0.54),
      new THREE.Vector3(-rWaist * 0.12, y + H * 0.012, rBelly * 0.60),
      new THREE.Vector3(rWaist * 0.12, y + H * 0.012, rBelly * 0.60),
      new THREE.Vector3(rWaist * 0.34, y, rBelly * 0.54),
      34
    ), 0.40 - idx * 0.03);
  });

  const pelvis = addMesh(new THREE.SphereGeometry(rHip * 0.58, 34, 18), new THREE.Vector3(0, hipY - H * 0.035, 0), {
    scale: new THREE.Vector3(1.52, 0.38, 0.82),
    fillOpacity: 0.052,
    edgeOpacity: 0.42,
    rimOpacity: 0.28
  });
  pelvis.name = 'reference-mapped-pelvis';
  ellipse(new THREE.Vector3(0, hipY - H * 0.032, 0), rHip * 0.86, rHip * 0.55, 0.45, 84);

  function addSegment(start, end, r0, r1, opts = {}) {
    const len = start.distanceTo(end);
    const mid = start.clone().lerp(end, 0.5);
    const geom = new THREE.CylinderGeometry(r1, r0, len, opts.radial || 30, opts.height || 9, false);
    const mesh = addMesh(geom, mid, {
      quaternion: qBetween(start, end),
      fillOpacity: opts.fillOpacity ?? 0.054,
      edgeOpacity: opts.edgeOpacity ?? 0.48,
      rimOpacity: opts.rimOpacity ?? 0.28
    });
    const steps = opts.rings || 7;
    for (let i = 1; i < steps; i += 1) {
      const t = i / steps;
      const c = start.clone().lerp(end, t);
      const r = r0 + (r1 - r0) * t;
      ellipse(c, r, r * (opts.zScale || 0.78), 0.25 + (opts.ringBoost || 0), 56);
    }
    [-0.46, 0, 0.46].forEach(offset => {
      const pts = [];
      for (let i = 0; i <= 20; i += 1) {
        const t = i / 20;
        const c = start.clone().lerp(end, t);
        const r = r0 + (r1 - r0) * t;
        pts.push(c.add(new THREE.Vector3(Math.sin(offset) * r * 0.78, 0, Math.cos(offset) * r * 0.45)));
      }
      curve(pts, 0.24);
    });
    return mesh;
  }

  const J = {
    shoulderL: new THREE.Vector3(-rShoulder * 0.93, shoulderY - H * 0.010, 0),
    shoulderR: new THREE.Vector3(rShoulder * 0.93, shoulderY - H * 0.010, 0),
    elbowL: new THREE.Vector3(-rShoulder * 1.20, shoulderY - H * 0.205, H * 0.010),
    elbowR: new THREE.Vector3(rShoulder * 1.20, shoulderY - H * 0.205, H * 0.010),
    wristL: new THREE.Vector3(-rShoulder * 1.08, hipY + H * 0.030, H * 0.050),
    wristR: new THREE.Vector3(rShoulder * 1.08, hipY + H * 0.030, H * 0.050),
    hipL: new THREE.Vector3(-rHip * 0.44, hipY - H * 0.035, 0),
    hipR: new THREE.Vector3(rHip * 0.44, hipY - H * 0.035, 0),
    kneeL: new THREE.Vector3(-rHip * 0.34, kneeY, H * 0.010),
    kneeR: new THREE.Vector3(rHip * 0.34, kneeY, H * 0.010),
    ankleL: new THREE.Vector3(-rHip * 0.30, ankleY, H * 0.020),
    ankleR: new THREE.Vector3(rHip * 0.30, ankleY, H * 0.020)
  };

  addMesh(new THREE.SphereGeometry(upperArmR * 1.72, 28, 16), J.shoulderL, { scale: new THREE.Vector3(1.22, 0.82, 0.92), fillOpacity: 0.052, edgeOpacity: 0.42 });
  addMesh(new THREE.SphereGeometry(upperArmR * 1.72, 28, 16), J.shoulderR, { scale: new THREE.Vector3(1.22, 0.82, 0.92), fillOpacity: 0.052, edgeOpacity: 0.42 });
  addSegment(J.shoulderL, J.elbowL, upperArmR * 1.16, upperArmR * 0.88, { rings: 8, edgeOpacity: 0.46 });
  addSegment(J.elbowL, J.wristL, forearmR * 1.10, forearmR * 0.72, { rings: 8, edgeOpacity: 0.44 });
  addSegment(J.shoulderR, J.elbowR, upperArmR * 1.16, upperArmR * 0.88, { rings: 8, edgeOpacity: 0.46 });
  addSegment(J.elbowR, J.wristR, forearmR * 1.10, forearmR * 0.72, { rings: 8, edgeOpacity: 0.44 });
  [J.elbowL, J.elbowR].forEach(pos => addMesh(new THREE.SphereGeometry(upperArmR * 0.82, 20, 12), pos, { fillOpacity: 0.044, edgeOpacity: 0.40 }));

  function addHand(side, wrist) {
    const palm = wrist.clone().add(new THREE.Vector3(side * forearmR * 0.56, -forearmR * 0.40, forearmR * 0.22));
    addMesh(new THREE.SphereGeometry(forearmR * 0.92, 22, 14), palm, {
      scale: new THREE.Vector3(0.78, 1.24, 0.38),
      fillOpacity: 0.050,
      edgeOpacity: 0.44
    });
    for (let f = -2; f <= 2; f += 1) {
      const base = palm.clone().add(new THREE.Vector3(side * forearmR * 0.34, -forearmR * 0.12 + f * forearmR * 0.25, forearmR * 0.04));
      const tip = base.clone().add(new THREE.Vector3(side * forearmR * (1.00 + Math.abs(f) * 0.07), -forearmR * (0.42 + Math.abs(f) * 0.035), forearmR * 0.10));
      addSegment(base, tip, forearmR * 0.075, forearmR * 0.045, { radial: 10, height: 2, rings: 2, edgeOpacity: 0.56, fillOpacity: 0.040 });
    }
    const thumbBase = palm.clone().add(new THREE.Vector3(side * forearmR * 0.18, forearmR * 0.52, forearmR * 0.06));
    const thumbTip = thumbBase.clone().add(new THREE.Vector3(side * forearmR * 0.90, forearmR * 0.22, forearmR * 0.10));
    addSegment(thumbBase, thumbTip, forearmR * 0.080, forearmR * 0.050, { radial: 10, height: 2, rings: 2, edgeOpacity: 0.56, fillOpacity: 0.040 });
  }
  addHand(-1, J.wristL);
  addHand(1, J.wristR);

  addSegment(J.hipL, J.kneeL, thighR * 1.24, thighR * 0.76, { rings: 10, edgeOpacity: 0.50, zScale: 0.72 });
  addSegment(J.kneeL, J.ankleL, calfR * 1.20, calfR * 0.62, { rings: 10, edgeOpacity: 0.48, zScale: 0.70 });
  addSegment(J.hipR, J.kneeR, thighR * 1.24, thighR * 0.76, { rings: 10, edgeOpacity: 0.50, zScale: 0.72 });
  addSegment(J.kneeR, J.ankleR, calfR * 1.20, calfR * 0.62, { rings: 10, edgeOpacity: 0.48, zScale: 0.70 });
  [J.kneeL, J.kneeR].forEach(pos => {
    addMesh(new THREE.SphereGeometry(thighR * 0.52, 24, 14), pos, {
      scale: new THREE.Vector3(1.05, 0.64, 0.72),
      fillOpacity: 0.045,
      edgeOpacity: 0.45
    });
    ellipse(pos.clone().add(new THREE.Vector3(0, 0, thighR * 0.18)), thighR * 0.40, thighR * 0.30, 0.52, 46);
  });

  function addFoot(side, ankle) {
    const heel = ankle.clone().add(new THREE.Vector3(side * calfR * 0.05, -H * 0.045, -calfR * 0.25));
    const toe = ankle.clone().add(new THREE.Vector3(side * calfR * 0.18, -H * 0.065, calfR * 2.55));
    addSegment(heel, toe, calfR * 0.42, calfR * 0.55, { radial: 18, height: 4, rings: 4, zScale: 1.00, edgeOpacity: 0.48, fillOpacity: 0.050 });
    for (let t = -2; t <= 2; t += 1) {
      const base = toe.clone().add(new THREE.Vector3(t * calfR * 0.16, 0, -calfR * 0.08));
      const tip = base.clone().add(new THREE.Vector3(t * calfR * 0.03, -calfR * 0.04, calfR * 0.36));
      addSegment(base, tip, calfR * 0.045, calfR * 0.026, { radial: 8, height: 1, rings: 1, edgeOpacity: 0.52, fillOpacity: 0.035 });
    }
  }
  addFoot(-1, J.ankleL);
  addFoot(1, J.ankleR);

  const neckBottom = new THREE.Vector3(0, neckBaseY, 0);
  const neckTop = new THREE.Vector3(0, neckTopY, 0);
  addSegment(neckBottom, neckTop, rNeck * 0.88, rNeck * 0.74, { radial: 24, height: 4, rings: 4, edgeOpacity: 0.42, fillOpacity: 0.045 });
  curve(bezier(new THREE.Vector3(-rShoulder * 0.64, shoulderY, 0.02), new THREE.Vector3(-rShoulder * 0.36, neckBaseY + H * 0.030, 0.02), new THREE.Vector3(-rNeck * 0.78, neckTopY - H * 0.020, 0.02), new THREE.Vector3(-rNeck * 0.58, neckTopY, 0.02), 30), 0.42);
  curve(bezier(new THREE.Vector3(rShoulder * 0.64, shoulderY, 0.02), new THREE.Vector3(rShoulder * 0.36, neckBaseY + H * 0.030, 0.02), new THREE.Vector3(rNeck * 0.78, neckTopY - H * 0.020, 0.02), new THREE.Vector3(rNeck * 0.58, neckTopY, 0.02), 30), 0.42);

  addMesh(new THREE.SphereGeometry(headR, 42, 28), new THREE.Vector3(0, headY, 0), {
    scale: new THREE.Vector3(0.86, 1.18, 0.78),
    fillOpacity: 0.052,
    edgeOpacity: 0.42,
    rimOpacity: 0.34
  });
  addMesh(new THREE.SphereGeometry(headR * 0.58, 26, 16), new THREE.Vector3(0, headY - headR * 0.80, headR * 0.07), {
    scale: new THREE.Vector3(0.78, 0.50, 0.55),
    fillOpacity: 0.042,
    edgeOpacity: 0.34,
    rimOpacity: 0.24
  });
  for (let lat = 1; lat <= 11; lat += 1) {
    const phi = Math.PI * lat / 12;
    const y = headY + Math.cos(phi) * headR * 1.18;
    const rr = Math.sin(phi);
    ellipse(new THREE.Vector3(0, y, 0), headR * 0.86 * rr, headR * 0.78 * rr, 0.35, 72);
  }
  for (let mer = 0; mer < 16; mer += 1) {
    const a = Math.PI * 2 * mer / 16;
    const pts = [];
    for (let i = 0; i <= 32; i += 1) {
      const phi = Math.PI * i / 32;
      pts.push(new THREE.Vector3(
        Math.cos(a) * Math.sin(phi) * headR * 0.86,
        headY + Math.cos(phi) * headR * 1.18,
        Math.sin(a) * Math.sin(phi) * headR * 0.78
      ));
    }
    curve(pts, 0.20 + Math.abs(Math.cos(a)) * 0.20);
  }
  curve([
    new THREE.Vector3(0, headY + headR * 0.05, headR * 0.66),
    new THREE.Vector3(0, headY - headR * 0.10, headR * 0.78),
    new THREE.Vector3(0, headY - headR * 0.22, headR * 0.66)
  ], 0.50);
  curve(bezier(
    new THREE.Vector3(-headR * 0.34, headY - headR * 0.58, headR * 0.52),
    new THREE.Vector3(-headR * 0.16, headY - headR * 0.70, headR * 0.58),
    new THREE.Vector3(headR * 0.16, headY - headR * 0.70, headR * 0.58),
    new THREE.Vector3(headR * 0.34, headY - headR * 0.58, headR * 0.52),
    24
  ), 0.42);

  try {
    const gt = createGlowTexture();
    const bg = new THREE.Sprite(new THREE.SpriteMaterial({
      map: gt,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    bg.position.set(0, by + H * 0.54, -0.95);
    bg.scale.set(4.2, 5.2, 1);
    group.add(bg);

    const chestGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: gt.clone(),
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    chestGlow.position.set(0, chestY, rChest * 0.62);
    chestGlow.scale.set(0.54, 0.54, 1);
    group.add(chestGlow);

    const navelGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: gt.clone(),
      transparent: true,
      opacity: 0.26,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    navelGlow.position.set(0, waistY - H * 0.025, rBelly * 0.58);
    navelGlow.scale.set(0.36, 0.36, 1);
    group.add(navelGlow);
    group.userData.glows = { chestGlow, navelGlow };
  } catch (_) {}

  try {
    const ringMat = new THREE.MeshBasicMaterial({
      color: C,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    [0.80, 1.08, 1.42].forEach((r, idx) => {
      const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.012, 128), ringMat.clone());
      ring.rotation.x = Math.PI / 2;
      ring.position.y = by + H * 0.010;
      ring.material.opacity = 0.18 - idx * 0.04;
      group.add(ring);
      group.userData.rings = [...(group.userData.rings || []), ring];
    });
  } catch (_) {}

  group.updateMatrixWorld(true);
  return group;
}

// Compatibilidade com chamadas antigas: o caminho principal da v134 usa
// buildReferenceMappedHologramAvatar diretamente.
function buildPremiumReferenceAvatar(profile = {}, silhouette = null) {
  return buildReferenceMappedHologramAvatar(profile, silhouette);
}


function buildAnatomicalSurfaceGridOverlay(group, dims) {
  if (!group || !dims) return null;
  const overlay = new THREE.Group();
  overlay.name = 'bodytwin-anatomical-surface-grid';
  overlay.renderOrder = 5;

  const majorMat = new THREE.LineBasicMaterial({
    color: 0x36e7ff,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const minorMat = new THREE.LineBasicMaterial({
    color: 0x13b8e8,
    transparent: true,
    opacity: 0.070,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const accentMat = new THREE.LineBasicMaterial({
    color: 0x8df6ff,
    transparent: true,
    opacity: 0.34,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const z = dims.zFront;
  const add = (pts, mat = minorMat) => {
    if (!pts || pts.length < 2) return null;
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
    line.renderOrder = 5;
    overlay.add(line);
    return line;
  };
  const addEllipse = (cx, y, rx, ry, zz = z, mat = minorMat, start = Math.PI, end = 0, steps = 34) => {
    const pts = [];
    for (let i = 0; i <= steps; i += 1) {
      const t = start + (end - start) * (i / steps);
      pts.push(new THREE.Vector3(cx + Math.cos(t) * rx, y + Math.sin(t) * ry, zz + Math.sin(t) * rx * 0.10));
    }
    return add(pts, mat);
  };
  const addClosedEllipse = (cx, y, rx, ry, zz = z, mat = minorMat, steps = 48) => {
    const pts = [];
    for (let i = 0; i <= steps; i += 1) {
      const t = Math.PI * 2 * (i / steps);
      pts.push(new THREE.Vector3(cx + Math.cos(t) * rx, y + Math.sin(t) * ry, zz + Math.sin(t) * rx * 0.08));
    }
    return add(pts, mat);
  };
  const torsoHalfWidth = y => {
    const h = Math.max(0.001, dims.yShoulder - dims.yPelvis);
    const t = Math.max(0, Math.min(1, (y - dims.yPelvis) / h));
    const chest = 0.58;
    const waist = 0.36;
    const pelvis = 0.47;
    if (t > 0.58) return waist + (chest - waist) * ((t - 0.58) / 0.42);
    return pelvis + (waist - pelvis) * (t / 0.58);
  };

  // Torso horizontal surface bands.
  [
    dims.yShoulder - 0.02,
    dims.yChest + 0.10,
    dims.yChest - 0.02,
    dims.yChest - 0.14,
    dims.yNavel + 0.14,
    dims.yNavel + 0.02,
    dims.yNavel - 0.11,
    dims.yPelvis + 0.10,
    dims.yPelvis - 0.02
  ].forEach((y, idx) => {
    const hw = torsoHalfWidth(y);
    addEllipse(0, y, hw, 0.055, z + 0.010, idx < 4 ? majorMat : minorMat, Math.PI, 0, 42);
  });

  // Torso vertical rails following anatomical silhouette.
  [-0.82, -0.54, -0.28, 0, 0.28, 0.54, 0.82].forEach((rail, idx) => {
    const pts = [];
    for (let i = 0; i <= 26; i += 1) {
      const t = i / 26;
      const y = dims.yPelvis - 0.04 + (dims.yShoulder - dims.yPelvis + 0.04) * t;
      const hw = torsoHalfWidth(y);
      const x = rail * hw;
      pts.push(new THREE.Vector3(x, y, z + 0.018 + Math.abs(rail) * 0.020));
    }
    add(pts, idx === 3 ? accentMat : minorMat);
  });

  // Chest and abdomen premium lines.
  [-1, 1].forEach(side => {
    add([
      new THREE.Vector3(side * 0.08, dims.yChest + 0.11, z + 0.030),
      new THREE.Vector3(side * 0.32, dims.yChest + 0.03, z + 0.050),
      new THREE.Vector3(side * 0.51, dims.yChest - 0.11, z + 0.018)
    ], accentMat);
    add([
      new THREE.Vector3(side * 0.18, dims.yNavel + 0.15, z + 0.025),
      new THREE.Vector3(side * 0.25, dims.yNavel - 0.01, z + 0.038),
      new THREE.Vector3(side * 0.16, dims.yPelvis + 0.04, z + 0.020)
    ], minorMat);
  });
  add([
    new THREE.Vector3(0, dims.yShoulder + 0.01, z + 0.015),
    new THREE.Vector3(0, dims.yNavel, z + 0.035),
    new THREE.Vector3(0, dims.yPelvis - 0.05, z + 0.020)
  ], accentMat);

  // Head latitude and longitude.
  for (let lat = -3; lat <= 3; lat += 1) {
    const yy = dims.yHead + lat * 0.043;
    const rx = 0.165 * (1 - Math.abs(lat) * 0.105);
    addClosedEllipse(0, yy, rx, rx * 0.15, z * 0.74, lat === 0 ? majorMat : minorMat, 42);
  }
  for (let lon = 0; lon < 6; lon += 1) {
    const a = Math.PI * lon / 6;
    const pts = [];
    for (let i = -14; i <= 14; i += 1) {
      const t = i / 14;
      const r = 0.162 * Math.sqrt(Math.max(0.05, 1 - t * t));
      pts.push(new THREE.Vector3(Math.cos(a) * r, dims.yHead + t * 0.18, z * 0.74 + Math.sin(a) * r * 0.20));
    }
    add(pts, minorMat);
  }
  [-1, 1].forEach(side => {
    add([
      new THREE.Vector3(side * 0.045, dims.yHead + 0.014, z * 0.84),
      new THREE.Vector3(side * 0.082, dims.yHead + 0.020, z * 0.86),
      new THREE.Vector3(side * 0.118, dims.yHead + 0.010, z * 0.84)
    ], minorMat);
  });

  // Limbs: rings and rails in a natural A-pose approximation.
  const limbRing = (cx, y, rx, mat = minorMat) => addClosedEllipse(cx, y, rx, rx * 0.16, z * 0.68, mat, 32);
  [-1, 1].forEach(side => {
    const armX0 = side * 0.50;
    const wristX = side * 0.55;
    const armYs = [0.66, 0.59, 0.52, 0.45, 0.38, 0.31, 0.24].map(t => dims.yBase + dims.height * t);
    armYs.forEach((y, idx) => {
      const t = idx / Math.max(1, armYs.length - 1);
      const x = armX0 + (wristX - armX0) * t + side * Math.sin(t * Math.PI) * 0.045;
      limbRing(x, y, 0.072 - t * 0.024, idx % 2 ? minorMat : minorMat);
    });
    [-0.45, 0, 0.45].forEach(offset => {
      const pts = [];
      armYs.forEach((y, idx) => {
        const t = idx / Math.max(1, armYs.length - 1);
        const x = armX0 + (wristX - armX0) * t + side * Math.sin(t * Math.PI) * 0.045 + side * offset * (0.038 - t * 0.014);
        pts.push(new THREE.Vector3(x, y, z * 0.68 + Math.abs(offset) * 0.015));
      });
      add(pts, minorMat);
    });

    const legX = side * 0.215;
    const legYs = [0.32, 0.27, 0.22, 0.17, 0.12, 0.075, 0.035].map(t => dims.yBase + dims.height * t);
    legYs.forEach((y, idx) => {
      const t = idx / Math.max(1, legYs.length - 1);
      const rx = 0.118 - Math.abs(t - 0.35) * 0.048;
      limbRing(legX + side * Math.sin(t * Math.PI) * 0.024, y, Math.max(0.058, rx), minorMat);
    });
    [-0.55, -0.18, 0.18, 0.55].forEach(offset => {
      const pts = [];
      legYs.forEach((y, idx) => {
        const t = idx / Math.max(1, legYs.length - 1);
        const rx = 0.110 - Math.abs(t - 0.35) * 0.042;
        pts.push(new THREE.Vector3(legX + side * offset * Math.max(0.048, rx), y, z * 0.66 + Math.abs(offset) * 0.014));
      });
      add(pts, minorMat);
    });

    // Hands with palm and five fingers.
    const palmX = side * 0.55;
    const palmY = dims.yBase + dims.height * 0.235;
    addClosedEllipse(palmX, palmY, 0.050, 0.026, z * 0.72, majorMat, 28);
    for (let f = -2; f <= 2; f += 1) {
      const baseX = palmX + side * f * 0.018;
      const p1 = new THREE.Vector3(baseX, palmY - 0.018, z * 0.75);
      const p2 = new THREE.Vector3(baseX + side * (0.010 + f * 0.002), palmY - 0.062 - Math.abs(f) * 0.004, z * 0.76);
      const p3 = new THREE.Vector3(baseX + side * (0.016 + f * 0.003), palmY - 0.092 - Math.abs(f) * 0.006, z * 0.75);
      add([p1, p2, p3], minorMat);
    }
    add([
      new THREE.Vector3(palmX - side * 0.040, palmY - 0.006, z * 0.75),
      new THREE.Vector3(palmX - side * 0.085, palmY - 0.050, z * 0.76),
      new THREE.Vector3(palmX - side * 0.110, palmY - 0.080, z * 0.75)
    ], minorMat);

    // Feet and toes.
    const footX = side * 0.225;
    const footY = dims.yFoot - 0.010;
    add([
      new THREE.Vector3(footX - side * 0.070, footY + 0.035, z * 0.62),
      new THREE.Vector3(footX + side * 0.020, footY - 0.005, z * 0.76),
      new THREE.Vector3(footX + side * 0.125, footY + 0.002, z * 0.70)
    ], majorMat);
    for (let toe = -2; toe <= 2; toe += 1) {
      add([
        new THREE.Vector3(footX + side * (0.032 + toe * 0.014), footY - 0.018, z * 0.78),
        new THREE.Vector3(footX + side * (0.050 + toe * 0.016), footY - 0.044, z * 0.82)
      ], minorMat);
    }
  });

  group.add(overlay);
  group.userData.surfaceGrid = overlay;
  return overlay;
}

function classifySurfacePoint(point, bounds, metrics = {}) {
  const height = Math.max(metrics.height || 0, 0.001);
  const width = Math.max(metrics.width || 0, 0.001);
  const yT = (point.y - bounds.min.y) / height;
  const xAbs = Math.abs(point.x);
  const side = point.x < 0 ? 'left' : 'right';
  const torsoCore = width * (yT > 0.62 ? 0.285 : 0.245);

  if (yT > 0.795 && xAbs < width * 0.24) return 'head';
  if (yT > 0.710 && xAbs < width * 0.20) return 'neck';
  if (yT > 0.345 && yT <= 0.715 && xAbs <= torsoCore) return 'torso';
  if (yT > 0.285 && yT <= 0.390 && xAbs <= width * 0.32) return 'pelvis';
  if (yT <= 0.095 && xAbs > width * 0.055 && xAbs < width * 0.36) return side === 'left' ? 'leftFoot' : 'rightFoot';
  if (yT <= 0.365 && xAbs > width * 0.045 && xAbs < width * 0.37) return side === 'left' ? 'leftLeg' : 'rightLeg';
  if (yT > 0.170 && yT < 0.330 && xAbs > width * 0.34) return side === 'left' ? 'leftHand' : 'rightHand';
  if (yT > 0.315 && yT < 0.705 && xAbs > torsoCore * 1.05 && xAbs < width * 0.58) return side === 'left' ? 'leftArm' : 'rightArm';
  return 'unknown';
}

function extractMeshSurfaceSamples(primaryMeshes, group) {
  const meshes = Array.isArray(primaryMeshes) ? primaryMeshes.filter(Boolean) : [];
  const points = [];
  const bounds = new THREE.Box3();
  const tmp = new THREE.Vector3();
  const local = new THREE.Vector3();
  if (!meshes.length || !group) {
    return { points, bounds, height: 0, width: 0, depth: 0, yLevels: [], slices: [], regionBuckets: {} };
  }

  group.updateMatrixWorld(true);
  meshes.forEach(mesh => {
    if (!mesh?.visible || !mesh.geometry?.attributes?.position) return;
    mesh.updateMatrixWorld(true);
    const pos = mesh.geometry.attributes.position;
    const step = pos.count > 48000 ? 2 : 1;
    for (let i = 0; i < pos.count; i += step) {
      tmp.fromBufferAttribute(pos, i);
      tmp.applyMatrix4(mesh.matrixWorld);
      local.copy(tmp);
      group.worldToLocal(local);
      if (!Number.isFinite(local.x) || !Number.isFinite(local.y) || !Number.isFinite(local.z)) continue;
      const point = { x: local.x, y: local.y, z: local.z, region: 'unknown' };
      points.push(point);
      bounds.expandByPoint(local);
    }
  });

  if (!points.length || bounds.isEmpty()) {
    return { points, bounds, height: 0, width: 0, depth: 0, yLevels: [], slices: [], regionBuckets: {} };
  }

  const size = bounds.getSize(new THREE.Vector3());
  const metrics = { height: size.y, width: size.x, depth: size.z };
  const regionBuckets = {
    head: [], neck: [], torso: [], pelvis: [], leftArm: [], rightArm: [],
    leftLeg: [], rightLeg: [], leftHand: [], rightHand: [], leftFoot: [], rightFoot: [], unknown: []
  };
  points.forEach(point => {
    point.region = classifySurfacePoint(point, bounds, metrics);
    (regionBuckets[point.region] || regionBuckets.unknown).push(point);
  });

  const levels = 48;
  const thickness = Math.max(size.y / 112, 0.014);
  const sorted = arr => arr.sort((a, b) => a - b);
  const pct = (values, q) => {
    if (!values.length) return 0;
    const idx = Math.max(0, Math.min(values.length - 1, Math.round((values.length - 1) * q)));
    return values[idx];
  };
  const buildSlice = pts => {
    if (!pts || pts.length < 8) return null;
    const xs = sorted(pts.map(p => p.x));
    const zs = sorted(pts.map(p => p.z));
    const minX = pct(xs, 0.07);
    const maxX = pct(xs, 0.93);
    const minZ = pct(zs, 0.10);
    const maxZ = pct(zs, 0.90);
    return {
      count: pts.length,
      minX,
      maxX,
      minZ,
      maxZ,
      centerX: (minX + maxX) * 0.5,
      centerZ: (minZ + maxZ) * 0.5,
      frontZ: maxZ,
      width: Math.max(0, maxX - minX),
      depth: Math.max(0, maxZ - minZ)
    };
  };
  const slices = [];
  for (let i = 0; i < levels; i += 1) {
    const t = i / (levels - 1);
    const y = bounds.min.y + size.y * t;
    const near = points.filter(p => Math.abs(p.y - y) <= thickness);
    const bodySlice = buildSlice(near);
    const regions = {};
    Object.keys(regionBuckets).forEach(region => {
      const rpts = regionBuckets[region].filter(p => Math.abs(p.y - y) <= thickness);
      const rs = buildSlice(rpts);
      if (rs) regions[region] = rs;
    });
    slices.push({
      y,
      count: near.length,
      valid: !!bodySlice,
      ...(bodySlice || {}),
      regions
    });
  }

  return {
    points,
    bounds,
    height: size.y,
    width: size.x,
    depth: size.z,
    yLevels: slices.map(s => s.y),
    slices,
    regionBuckets
  };
}

function buildMeshSampledSurfaceGrid(group, primaryMeshes, dims = {}) {
  if (!group || !Array.isArray(primaryMeshes) || !primaryMeshes.length) return null;
  const samples = extractMeshSurfaceSamples(primaryMeshes, group);
  if (!samples.points.length || !samples.slices.some(s => s.valid)) return null;

  const overlay = new THREE.Group();
  overlay.name = 'bodytwin-v149-reference-grid-flow';
  overlay.renderOrder = 5;

  const majorMat = new THREE.LineBasicMaterial({
    color: 0x5feeff,
    transparent: true,
    opacity: 0.225,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const minorMat = new THREE.LineBasicMaterial({
    color: 0x16bfe8,
    transparent: true,
    opacity: 0.078,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const accentMat = new THREE.LineBasicMaterial({
    color: 0xa4f8ff,
    transparent: true,
    opacity: 0.265,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const faintMat = new THREE.LineBasicMaterial({
    color: 0x13a8d7,
    transparent: true,
    opacity: 0.050,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const stats = {
    samples: samples.points.length,
    validSlices: 0,
    lines: 0,
    rejected: 0,
    torsoLines: 0,
    headLines: 0,
    legLines: 0,
    armLines: 0,
    skippedHands: true,
    skippedFeet: true
  };
  const bounds = samples.bounds;
  const bodyWidth = Math.max(samples.width, 0.001);
  const yMin = bounds.min.y;
  const yMax = bounds.max.y;
  const height = Math.max(samples.height, 0.001);
  const inRange = (value, min, max) => value >= min && value <= max;
  const sorted = arr => arr.sort((a, b) => a - b);
  const pct = (values, q) => {
    if (!values.length) return 0;
    const idx = Math.max(0, Math.min(values.length - 1, Math.round((values.length - 1) * q)));
    return values[idx];
  };
  const yAt = ratio => yMin + height * ratio;
  const pointsAt = (y, regions) => {
    const regionList = Array.isArray(regions) ? regions : [regions];
    const thickness = Math.max(height / 118, 0.013);
    return samples.points.filter(p => regionList.includes(p.region) && Math.abs(p.y - y) <= thickness);
  };
  const sliceFromPoints = pts => {
    if (!pts || pts.length < 8) return null;
    const xs = sorted(pts.map(p => p.x));
    const zs = sorted(pts.map(p => p.z));
    const minX = pct(xs, 0.08);
    const maxX = pct(xs, 0.92);
    const minZ = pct(zs, 0.12);
    const maxZ = pct(zs, 0.90);
    const width = maxX - minX;
    if (!Number.isFinite(width) || width < 0.024 || width > bodyWidth * 0.74) return null;
    return { minX, maxX, minZ, maxZ, width, frontZ: maxZ, centerX: (minX + maxX) * 0.5 };
  };
  const addLine = (pts, mat = minorMat, smooth = false, bucket = null) => {
    const clean = (pts || []).filter(p =>
      p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z) &&
      inRange(p.x, bounds.min.x - bodyWidth * 0.025, bounds.max.x + bodyWidth * 0.025) &&
      inRange(p.y, yMin - height * 0.012, yMax + height * 0.012)
    );
    if (clean.length < 2) {
      stats.rejected += 1;
      return null;
    }
    const finalPts = smooth && clean.length > 3
      ? new THREE.CatmullRomCurve3(clean).getPoints(Math.min(36, Math.max(10, clean.length * 3)))
      : clean;
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(finalPts), mat);
    line.renderOrder = 5;
    overlay.add(line);
    stats.lines += 1;
    if (bucket && Object.prototype.hasOwnProperty.call(stats, bucket)) stats[bucket] += 1;
    return line;
  };
  const addSurfaceArc = (y, regions, mat = minorMat, strength = 0.010, bucket = null) => {
    const pts = pointsAt(y, regions);
    const sl = sliceFromPoints(pts);
    if (!sl || pts.length < 14) {
      stats.rejected += 1;
      return null;
    }
    const arcPts = [];
    const steps = 28;
    for (let i = 0; i <= steps; i += 1) {
      const u = i / steps;
      const x = sl.minX + sl.width * u;
      const curve = Math.sin(Math.PI * u);
      arcPts.push(new THREE.Vector3(
        x,
        y + curve * height * 0.0022,
        sl.frontZ + strength + curve * Math.max(samples.depth * 0.015, 0.003)
      ));
    }
    return addLine(arcPts, mat, false, bucket);
  };
  const addRail = (levels, regions, ratio, mat = minorMat, bucket = null) => {
    const pts = [];
    levels.forEach(y => {
      const sl = sliceFromPoints(pointsAt(y, regions));
      if (!sl) return;
      pts.push(new THREE.Vector3(sl.minX + sl.width * ratio, y, sl.frontZ + 0.010));
    });
    return addLine(pts, mat, true, bucket);
  };

  const torsoRegions = ['torso', 'pelvis'];
  const torsoLevels = [0.700, 0.662, 0.622, 0.575, 0.525, 0.475, 0.425, 0.370].map(yAt);
  torsoLevels.forEach((y, idx) => addSurfaceArc(y, torsoRegions, idx < 3 ? majorMat : minorMat, idx < 3 ? 0.013 : 0.009, 'torsoLines'));
  [0.24, 0.40, 0.50, 0.60, 0.76].forEach((r, idx) => {
    addRail(torsoLevels, torsoRegions, r, idx === 2 ? accentMat : (idx === 0 || idx === 4 ? faintMat : minorMat), 'torsoLines');
  });

  [-1, 1].forEach(side => {
    const chestY = yAt(0.625);
    const sl = sliceFromPoints(pointsAt(chestY, 'torso'));
    if (!sl) return;
    const sternum = sl.minX + sl.width * 0.50;
    const inner = sl.minX + sl.width * (side < 0 ? 0.40 : 0.60);
    const mid = sl.minX + sl.width * (side < 0 ? 0.28 : 0.72);
    const outer = sl.minX + sl.width * (side < 0 ? 0.13 : 0.87);
    addLine([
      new THREE.Vector3(sternum + side * sl.width * 0.035, chestY + height * 0.026, sl.frontZ + 0.015),
      new THREE.Vector3(inner, chestY + height * 0.020, sl.frontZ + 0.020),
      new THREE.Vector3(mid, chestY + height * 0.000, sl.frontZ + 0.021),
      new THREE.Vector3(outer, chestY - height * 0.028, sl.frontZ + 0.012)
    ], accentMat, true, 'torsoLines');
  });

  const headLevels = [0.830, 0.862, 0.895, 0.928].map(yAt);
  headLevels.forEach((y, idx) => addSurfaceArc(y, 'head', idx === 2 ? majorMat : minorMat, 0.008, 'headLines'));
  [0.38, 0.50, 0.62].forEach((r, idx) => addRail(headLevels, 'head', r, idx === 1 ? minorMat : faintMat, 'headLines'));
  const eyeY = yAt(0.885);
  const headSlice = sliceFromPoints(pointsAt(eyeY, 'head'));
  if (headSlice) {
    [-1, 1].forEach(side => {
      const x0 = headSlice.minX + headSlice.width * (side < 0 ? 0.34 : 0.58);
      const x1 = headSlice.minX + headSlice.width * (side < 0 ? 0.43 : 0.67);
      addLine([
        new THREE.Vector3(x0, eyeY, headSlice.frontZ + 0.008),
        new THREE.Vector3(x1, eyeY + height * 0.002, headSlice.frontZ + 0.009)
      ], faintMat, false, 'headLines');
    });
  }

  const leftLegLevels = [0.330, 0.285, 0.240, 0.195, 0.150, 0.105, 0.065].map(yAt);
  const rightLegLevels = leftLegLevels.slice();
  leftLegLevels.forEach((y, idx) => addSurfaceArc(y, 'leftLeg', idx === 3 ? majorMat : minorMat, 0.008, 'legLines'));
  rightLegLevels.forEach((y, idx) => addSurfaceArc(y, 'rightLeg', idx === 3 ? majorMat : minorMat, 0.008, 'legLines'));
  [0.30, 0.50, 0.70].forEach(r => {
    addRail(leftLegLevels, 'leftLeg', r, minorMat, 'legLines');
    addRail(rightLegLevels, 'rightLeg', r, minorMat, 'legLines');
  });

  const leftArmLevels = [0.640, 0.585, 0.530, 0.475, 0.420, 0.365, 0.315].map(yAt);
  const rightArmLevels = leftArmLevels.slice();
  const canDrawLeftArm = samples.regionBuckets.leftArm.length > 120;
  const canDrawRightArm = samples.regionBuckets.rightArm.length > 120;
  if (canDrawLeftArm) {
    [0.585, 0.485, 0.375].map(yAt).forEach(y => addSurfaceArc(y, 'leftArm', faintMat, 0.005, 'armLines'));
    [0.50].forEach(r => addRail(leftArmLevels, 'leftArm', r, faintMat, 'armLines'));
  }
  if (canDrawRightArm) {
    [0.585, 0.485, 0.375].map(yAt).forEach(y => addSurfaceArc(y, 'rightArm', faintMat, 0.005, 'armLines'));
    [0.50].forEach(r => addRail(rightArmLevels, 'rightArm', r, faintMat, 'armLines'));
  }

  stats.skippedHands = true;
  stats.skippedFeet = true;
  stats.validSlices = samples.slices.filter(s => s.valid).length;
  stats.poseAudit = auditReferencePoseCapability(primaryMeshes, samples);
  group.add(overlay);
  group.userData.surfaceGrid = overlay;
  group.userData.surfaceGridStats = stats;
  group.userData.poseAudit = stats.poseAudit;
  return overlay;
}

function applyReferenceSilhouetteFit(model, bodyMeshes, finalSize) {
  if (!BODYTWIN_REFERENCE_COMPOSITION || !model || !Array.isArray(bodyMeshes) || !bodyMeshes.length) {
    return { applied: false };
  }
  const width = Math.max(finalSize?.x || 0, 0.001);
  const height = Math.max(finalSize?.y || 0, 0.001);
  const narrowness = width / height;
  const xBoost = clamp(narrowness < 0.45 ? 1.065 : 1.045, 1.03, 1.08);
  const zBoost = 1.035;

  model.scale.x *= xBoost;
  model.scale.z *= zBoost;
  model.updateMatrixWorld(true);

  return {
    applied: true,
    xBoost: Number(xBoost.toFixed(3)),
    zBoost: Number(zBoost.toFixed(3)),
    narrowness: Number(narrowness.toFixed(3))
  };
}

function auditReferencePoseCapability(primaryMeshes, samples) {
  const audit = {
    canOpenHands: false,
    handDetailScore: 0,
    headProfilePossible: false,
    shoulderWidthScore: 0,
    torsoFlowScore: 0,
    assetPoseVerdict: 'limited',
    reasons: []
  };
  try {
    const buckets = samples?.regionBuckets || {};
    const leftHand = buckets.leftHand?.length || 0;
    const rightHand = buckets.rightHand?.length || 0;
    const head = buckets.head?.length || 0;
    const torso = buckets.torso?.length || 0;
    const leftArm = buckets.leftArm?.length || 0;
    const rightArm = buckets.rightArm?.length || 0;
    const width = Math.max(samples?.width || 0, 0.001);
    const depth = Math.max(samples?.depth || 0, 0.001);
    const height = Math.max(samples?.height || 0, 0.001);

    audit.handDetailScore = Math.min(1, (leftHand + rightHand) / 900);
    audit.canOpenHands = audit.handDetailScore > 0.62;
    audit.headProfilePossible = depth / height > 0.15 && head > 300;
    audit.shoulderWidthScore = Math.min(1, width / Math.max(height * 0.50, 0.001));
    audit.torsoFlowScore = Math.min(1, torso / 4500);

    if (!audit.canOpenHands) audit.reasons.push('hand geometry/detail is not strong enough for open premium palms');
    if (!audit.headProfilePossible) audit.reasons.push('current head is frontal; profile/three-quarter reference needs a posed asset');
    if (leftArm < 180 || rightArm < 180) audit.reasons.push('arm samples are limited, so arm overlay must stay conservative');
    if (audit.shoulderWidthScore < 0.70) audit.reasons.push('silhouette reads narrow versus the heroic reference');
    if (audit.torsoFlowScore < 0.65) audit.reasons.push('torso surface sampling is usable but not dense enough for reference-grade topology lines');

    audit.assetPoseVerdict = audit.canOpenHands && audit.headProfilePossible && audit.shoulderWidthScore >= 0.70
      ? 'usable'
      : (audit.handDetailScore < 0.45 || !audit.headProfilePossible ? 'requires_new_asset' : 'limited');
  } catch (err) {
    audit.assetPoseVerdict = 'limited';
    audit.reasons.push(`pose audit failed softly: ${err?.message || err}`);
  }
  return audit;
}

function createRegionalHologramLineMaterial(geometry, {
  color = 0x4feeff,
  opacity = 0.58,
  headFade = 0.52,
  handFade = 0.46,
  footFade = 0.38
} = {}) {
  if (!geometry?.boundingBox) geometry?.computeBoundingBox?.();
  const box = geometry?.boundingBox || new THREE.Box3(
    new THREE.Vector3(-0.5, -1, -0.5),
    new THREE.Vector3(0.5, 1, 0.5)
  );
  const size = box.getSize(new THREE.Vector3());
  const maxAbsX = Math.max(Math.abs(box.min.x), Math.abs(box.max.x), size.x * 0.5, 0.001);
  return new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uMinY: { value: box.min.y },
      uHeight: { value: Math.max(size.y, 0.001) },
      uMaxAbsX: { value: maxAbsX },
      uHeadFade: { value: headFade },
      uHandFade: { value: handFade },
      uFootFade: { value: footFade }
    },
    vertexShader: `
      uniform float uMinY;
      uniform float uHeight;
      uniform float uMaxAbsX;
      uniform float uHeadFade;
      uniform float uHandFade;
      uniform float uFootFade;
      varying float vAlpha;
      void main() {
        float y01 = clamp((position.y - uMinY) / uHeight, 0.0, 1.0);
        float x01 = clamp(abs(position.x) / uMaxAbsX, 0.0, 1.0);
        float head = smoothstep(0.800, 0.930, y01);
        float foot = 1.0 - smoothstep(0.035, 0.125, y01);
        float handY = smoothstep(0.285, 0.365, y01) * (1.0 - smoothstep(0.505, 0.610, y01));
        float handX = smoothstep(0.610, 0.815, x01);
        float hand = handY * handX;
        float faceCore = smoothstep(0.855, 0.940, y01) * (1.0 - smoothstep(0.940, 1.0, y01)) * (1.0 - smoothstep(0.42, 0.70, x01));
        float fade = head * uHeadFade + hand * uHandFade + foot * uFootFade + faceCore * 0.18;
        vAlpha = clamp(1.0 - fade, 0.22, 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vAlpha;
      void main() {
        gl_FragColor = vec4(uColor, uOpacity * vAlpha);
      }
    `
  });
}

function createProceduralHologramGridMaterial(geometry, {
  color = 0x4feeff,
  fillColor = 0x001326,
  opacity = 0.86,
  headFade = 0.50,
  handFade = 0.42,
  footFade = 0.36
} = {}) {
  if (!geometry?.boundingBox) geometry?.computeBoundingBox?.();
  const box = geometry?.boundingBox || new THREE.Box3(
    new THREE.Vector3(-0.5, -1, -0.5),
    new THREE.Vector3(0.5, 1, 0.5)
  );
  const size = box.getSize(new THREE.Vector3());
  const maxAbsX = Math.max(Math.abs(box.min.x), Math.abs(box.max.x), size.x * 0.5, 0.001);
  const maxAbsZ = Math.max(Math.abs(box.min.z), Math.abs(box.max.z), size.z * 0.5, 0.001);
  return new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uGridColor: { value: new THREE.Color(color) },
      uFillColor: { value: new THREE.Color(fillColor) },
      uOpacity: { value: opacity },
      uMinY: { value: box.min.y },
      uHeight: { value: Math.max(size.y, 0.001) },
      uMaxAbsX: { value: maxAbsX },
      uMaxAbsZ: { value: maxAbsZ },
      uHeadFade: { value: headFade },
      uHandFade: { value: handFade },
      uFootFade: { value: footFade }
    },
    vertexShader: `
      varying vec3 vLocalPos;
      varying vec3 vLocalNormal;
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      void main() {
        vLocalPos = position;
        vLocalNormal = normalize(normal);
        vNormalView = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uGridColor;
      uniform vec3 uFillColor;
      uniform float uOpacity;
      uniform float uMinY;
      uniform float uHeight;
      uniform float uMaxAbsX;
      uniform float uMaxAbsZ;
      uniform float uHeadFade;
      uniform float uHandFade;
      uniform float uFootFade;
      varying vec3 vLocalPos;
      varying vec3 vLocalNormal;
      varying vec3 vNormalView;
      varying vec3 vViewDir;

      float lineGrid(float value, float density, float width) {
        float coord = value * density;
        float cell = abs(fract(coord) - 0.5);
        float aa = max(fwidth(coord), 0.001);
        return 1.0 - smoothstep(width, width + aa * 1.65, cell);
      }

      float singleLine(float value, float width) {
        float aa = max(fwidth(value), 0.001);
        return 1.0 - smoothstep(width, width + aa * 1.65, abs(value));
      }

      void main() {
        float y01 = clamp((vLocalPos.y - uMinY) / uHeight, 0.0, 1.0);
        vec3 n = normalize(vLocalNormal);
        float xNorm = vLocalPos.x / uMaxAbsX;
        float zNorm = vLocalPos.z / uMaxAbsZ;
        float torso = smoothstep(0.300, 0.430, y01) * (1.0 - smoothstep(0.760, 0.855, y01));
        float chest = smoothstep(0.585, 0.655, y01) * (1.0 - smoothstep(0.700, 0.780, y01));
        float abdomen = smoothstep(0.390, 0.470, y01) * (1.0 - smoothstep(0.585, 0.665, y01));
        float legs = smoothstep(0.085, 0.190, y01) * (1.0 - smoothstep(0.365, 0.455, y01));
        float headMask = smoothstep(0.800, 0.930, y01);
        float footMask = 1.0 - smoothstep(0.035, 0.125, y01);
        float handYMask = smoothstep(0.285, 0.365, y01) * (1.0 - smoothstep(0.505, 0.610, y01));
        float handXMask = smoothstep(0.610, 0.815, abs(xNorm));
        float handMask = handYMask * handXMask;
        float armMask = smoothstep(0.500, 0.700, abs(xNorm)) * smoothstep(0.340, 0.470, y01) * (1.0 - smoothstep(0.735, 0.820, y01));
        float pelvisMask = smoothstep(0.350, 0.405, y01) * (1.0 - smoothstep(0.480, 0.535, y01)) * (1.0 - armMask);
        float calfMask = smoothstep(0.055, 0.100, y01) * (1.0 - smoothstep(0.190, 0.245, y01));

        float shoulderFlow = smoothstep(0.660, 0.735, y01) * (1.0 - smoothstep(0.755, 0.840, y01));
        float harmonic = sin((xNorm + n.x * 0.28) * 5.10) * 0.010 * torso;
        harmonic += sin((xNorm + n.z * 0.20) * 8.20 + y01 * 5.0) * 0.005 * abdomen;
        harmonic += abs(xNorm) * 0.016 * chest;
        harmonic -= shoulderFlow * abs(n.x) * 0.012;

        float xFlow = xNorm + n.x * (0.090 * torso + 0.052 * legs + 0.030 * headMask);
        float zFlow = zNorm + n.z * (0.150 * torso + 0.110 * legs + 0.040 * headMask);
        float yFlow = y01 + harmonic + n.z * 0.013 * chest - n.x * 0.006 * shoulderFlow;
        float radius = length(vec2(xFlow, zFlow));
        float angle = atan(zFlow, xFlow) / 6.28318530718 + 0.5;

        vec2 frontProjection = vec2(xFlow * 0.5 + 0.5, yFlow);
        vec2 sideProjection = vec2(zFlow * 0.5 + 0.5 + sin(yFlow * 6.28318 * 1.2) * 0.012 * (legs + pelvisMask), yFlow + n.z * 0.016 * (legs + torso));
        vec2 wrapProjection = vec2(angle + sin(yFlow * 6.28318 * 2.0) * 0.006 * torso, radius);
        vec3 triWeights = pow(abs(n), vec3(2.6));
        triWeights /= max(triWeights.x + triWeights.y + triWeights.z, 0.0001);

        float frontGrid = max(lineGrid(frontProjection.y, 22.0, 0.014), lineGrid(frontProjection.x + n.z * 0.010, 9.0, 0.011));
        float sideGrid = max(lineGrid(sideProjection.y, 20.0, 0.013), lineGrid(sideProjection.x + n.x * 0.012, 8.0, 0.010));
        float wrapGrid = max(lineGrid(wrapProjection.x, 15.0, 0.011), lineGrid(wrapProjection.y + sin(angle * 6.28318) * 0.010, 7.0, 0.010));
        float triplanarGrid = frontGrid * triWeights.z + sideGrid * triWeights.x + wrapGrid * triWeights.y;

        float torsoRail = lineGrid(frontProjection.x + n.z * 0.018, 7.0, 0.011) * torso;
        float chestArc = chest * lineGrid(radius + sin(xFlow * 4.0) * 0.010, 6.0, 0.013);
        float abdomenArc = abdomen * lineGrid(yFlow + sin(xFlow * 6.0) * 0.016, 12.0, 0.011);
        float gluteCalfFlow = (pelvisMask + calfMask + legs * 0.55) * lineGrid(sideProjection.y + sin(sideProjection.x * 6.28318) * 0.018, 14.0, 0.011);
        float contourBias = pow(1.0 - clamp(dot(normalize(vNormalView), normalize(vViewDir)), 0.0, 1.0), 2.85);
        float muscleContour = contourBias * (0.70 + chest * 0.36 + shoulderFlow * 0.30 + legs * 0.25 + pelvisMask * 0.20);
        float bodyGrid = max(triplanarGrid * 0.24, max(torsoRail * 0.22, max(chestArc * 0.26, max(abdomenArc * 0.20, gluteCalfFlow * 0.28))));
        bodyGrid = mix(bodyGrid, max(bodyGrid, muscleContour), 0.32);

        float frontNormal = pow(clamp(n.z * 0.5 + 0.5, 0.0, 1.0), 1.35);
        float chestSpread = smoothstep(0.08, 0.78, abs(xFlow)) * (1.0 - smoothstep(0.84, 1.06, abs(xFlow)));
        float pecTopCurve = 0.660 - abs(xFlow) * 0.040 + frontNormal * 0.010 - chestSpread * 0.018;
        float pecLowCurve = 0.612 - abs(xFlow) * 0.052 + frontNormal * 0.008 - chestSpread * 0.014;
        float pecMask = chest * (1.0 - smoothstep(0.86, 1.08, abs(xFlow))) * (0.50 + frontNormal * 0.50);
        float pectoralMajor = pecMask * max(singleLine(yFlow - pecTopCurve, 0.0058), singleLine(yFlow - pecLowCurve, 0.0054)) * 0.72;

        float abdominalWindow = smoothstep(0.385, 0.455, y01) * (1.0 - smoothstep(0.610, 0.705, y01));
        float abdomenCenter = abdominalWindow * singleLine(xFlow, 0.0058) * (0.68 + frontNormal * 0.32) * 0.78;
        float abdomenCross = abdominalWindow * lineGrid(yFlow + sin(xFlow * 5.4) * 0.010, 10.0, 0.0048) * (1.0 - smoothstep(0.42, 0.74, abs(xFlow))) * 0.26;
        float analyticalMajor = max(pectoralMajor, max(abdomenCenter, abdomenCross));

        float headHorizontal = lineGrid(yFlow + n.z * 0.008, 12.0, 0.012);
        float headVertical = lineGrid(angle + n.x * 0.018, 9.0, 0.010);
        float headGrid = max(headHorizontal, headVertical) * 0.20 * headMask;
        float extremityGrid = max(handMask, footMask) * bodyGrid * 0.36;

        // V179: keep the technical grid quiet and let continuous anatomical strokes
        // define the torso without creating dark rectangular transitions.
        float fineGrid = bodyGrid * (1.0 - headMask) * (1.0 - max(handMask, footMask) * 0.54) * (1.0 - torso * 0.075);
        float majorAnatomicalLines = max(analyticalMajor * 0.98, max(pectoralMajor * 0.88, max(abdomenCenter * 1.06, abdomenCross * 0.62)));
        float grid = max(fineGrid, max(headGrid, extremityGrid));
        grid = max(grid, majorAnatomicalLines);

        float fresnel = pow(1.0 - clamp(dot(normalize(vNormalView), normalize(vViewDir)), 0.0, 1.0), 3.15);
        float faceCore = smoothstep(0.815, 0.885, y01) * (1.0 - smoothstep(0.955, 1.0, y01)) * (1.0 - smoothstep(0.18, 0.84, abs(xNorm)));
        float faceCenterDamp = faceCore * (1.0 - smoothstep(0.18, 0.68, abs(xNorm))) * (1.0 - smoothstep(0.10, 0.72, fresnel));
        float gridRegionalFade = clamp(headMask * (uHeadFade * 0.42) + handMask * (uHandFade * 0.80) + footMask * (uFootFade * 0.76) + faceCore * 0.040, 0.0, 0.49);
        float alphaRegionalFade = clamp(handMask * (uHandFade * 0.56) + footMask * (uFootFade * 0.52) + faceCenterDamp * 0.070, 0.0, 0.27);

        float sculptedRim = fresnel * (1.0 + shoulderFlow * 0.34 + chest * 0.18 + legs * 0.14);
        float skullTop = smoothstep(0.885, 0.975, y01);
        float cranialRim = headMask * fresnel * (0.365 + skullTop * 0.275) * (1.0 - faceCenterDamp * 0.15);
        float extremityRim = max(handMask, footMask) * fresnel * 0.092;
        float torsoContinuity = (chest + abdomen) * (0.026 + frontNormal * 0.038) + torso * 0.012;

        // Keep dark volume as a ghost, never as an opaque rectangular panel.
        float baseFill = 0.0072 + torso * 0.0074 + legs * 0.0038 + headMask * 0.0032;
        float cleanGrid = max(grid * (1.0 - gridRegionalFade), majorAnatomicalLines * 0.60 + torsoContinuity);
        float faceDiffuseGuard = faceCenterDamp * (0.188 + (1.0 - fresnel) * 0.112);
        float lineLuminance = clamp(cleanGrid * 1.38 + majorAnatomicalLines * 0.46 + sculptedRim * 0.80 + cranialRim * 1.38 + extremityRim * 0.94 - faceDiffuseGuard, 0.0, 1.0);
        float alpha = (baseFill + cleanGrid * 0.315 + majorAnatomicalLines * 0.118 + sculptedRim * 0.026 + cranialRim * 0.152 + extremityRim * 0.082) * uOpacity * (1.0 - alphaRegionalFade) * (1.0 - faceCenterDamp * 0.11);
        vec3 color = mix(uFillColor, uGridColor, clamp(lineLuminance + torsoContinuity * 0.52 + headMask * 0.034, 0.0, 1.0));
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.96));
      }
    `
  });
}

function buildGlbBody(profile, gltf) {
  if (!gltf?.scene) throw new Error('GLB scene missing');
  const p = normalizeVisualProfile(profile || {});
  const group = new THREE.Group();
  group.name = BT_VERSION;
  group.userData.mode = 'glb';
  group.userData.sourcePath = gltf?.userData?.sourcePath || '';
  // V179 preserva a ancoragem frontal homologada: o asset hero abre de frente em PI.
  group.userData.frontYawOffset = BODYTWIN_HERO_FRONT_YAW;

  // V142C: ignora olhos/helpers deslocados do Blender bundle antes de calcular Box3.
  const model = gltf.scene.clone(true);
  model.updateMatrixWorld(true);
  const allMeshes = [];
  const primaryMeshes = [];
  model.traverse(child => {
    if (!child.isMesh || !child.geometry) return;
    allMeshes.push(child);
    const name = `${child.name || ''} ${child.geometry?.name || ''}`.toLowerCase();
    const vertices = child.geometry.getAttribute?.('position')?.count || 0;
    const isDetachedEye = name.includes('eye') || name.includes('olho');
    if (isDetachedEye || vertices < 1000) {
      child.visible = false;
      return;
    }
    primaryMeshes.push(child);
  });
  const bodyMeshes = primaryMeshes.length ? primaryMeshes : allMeshes;
  const boxFromMeshes = meshes => {
    const box = new THREE.Box3();
    meshes.forEach(mesh => {
      mesh.updateMatrixWorld(true);
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      const meshBox = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
      box.union(meshBox);
    });
    return box;
  };
  const sourceBox = boxFromMeshes(bodyMeshes);
  const sourceSize = sourceBox.getSize(new THREE.Vector3());
  const targetHeight = Math.max(3.10, Math.min(3.36,
    Number(p.legLen || 1.55) + Number(p.torsoLen || 1.2) + Number(p.headR || 0.145) * 2
  ));
  const scale = sourceSize.y > 0 ? targetHeight / sourceSize.y : 1;
  model.scale.setScalar(scale);
  model.updateMatrixWorld(true);

  const fitted = boxFromMeshes(bodyMeshes);
  const center = fitted.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y += -targetHeight * 0.50 - fitted.min.y;
  model.updateMatrixWorld(true);

  let finalBox = boxFromMeshes(bodyMeshes);
  let finalSize = finalBox.getSize(new THREE.Vector3());
  let finalCenter = finalBox.getCenter(new THREE.Vector3());
  const silhouetteFit = applyReferenceSilhouetteFit(model, bodyMeshes, finalSize);
  if (silhouetteFit.applied) {
    finalBox = boxFromMeshes(bodyMeshes);
    finalSize = finalBox.getSize(new THREE.Vector3());
    finalCenter = finalBox.getCenter(new THREE.Vector3());
  }
  group.userData.fit = {
    centerX: Number(finalCenter.x.toFixed(4)),
    centerY: Number(finalCenter.y.toFixed(4)),
    sizeX: Number(finalSize.x.toFixed(4)),
    sizeY: Number(finalSize.y.toFixed(4)),
    silhouetteFit
  };

  bodyMeshes.forEach(child => {
    child.material = createProceduralHologramGridMaterial(child.geometry, {
      color: 0x58eeff,
      fillColor: 0x001326,
      opacity: 0.98,
      headFade: 0.46,
      handFade: 0.42,
      footFade: 0.36
    });
    child.renderOrder = 2;
  });

  group.add(model);
  group.userData.primaryModel = model;
  group.userData.primaryMeshes = bodyMeshes;

  const zFront = Math.max(0.22, finalSize.z * 0.56);
  const yBase = -targetHeight * 0.50;
  const yHead = yBase + targetHeight * 0.90;
  const yNeck = yBase + targetHeight * 0.76;
  const yShoulder = yBase + targetHeight * 0.70;
  const yChest = yBase + targetHeight * 0.63;
  const yNavel = yBase + targetHeight * 0.45;
  const yPelvis = yBase + targetHeight * 0.34;
  const yKnee = yBase + targetHeight * 0.20;
  const yAnkle = yBase + targetHeight * 0.04;
  const yFoot = yBase + targetHeight * 0.005;

  if (BODYTWIN_ENABLE_PARAMETRIC_OVERLAY) try {
    buildAnatomicalSurfaceGridOverlay(group, {
      yBase, yHead, yNeck, yShoulder, yChest, yNavel, yPelvis, yKnee, yAnkle, yFoot,
      zFront,
      width: finalSize.x,
      height: targetHeight
    });
  } catch (_) {}

  if (BODYTWIN_ENABLE_MESH_SAMPLED_GRID) try {
    buildMeshSampledSurfaceGrid(group, bodyMeshes, {
      yBase, yHead, yNeck, yShoulder, yChest, yNavel, yPelvis, yKnee, yAnkle, yFoot,
      zFront,
      width: finalSize.x,
      height: targetHeight
    });
  } catch (gridErr) {
    console.warn('[BodyTwin-V156] mesh-sampled grid disabled:', gridErr?.message || gridErr);
  }

  try {
    const gt = createGlowTexture();
    const sprite = (position, scale2d, opacity) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: gt.clone(),
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      }));
      sp.position.copy(position);
      sp.scale.set(scale2d.x, scale2d.y, 1);
      group.add(sp);
      return sp;
    };
    const bg = sprite(new THREE.Vector3(0, yBase + targetHeight * 0.48, -0.95), new THREE.Vector2(2.9, 3.75), 0.052);
    const chest = sprite(new THREE.Vector3(0, yChest, zFront * 0.78), new THREE.Vector2(0.40, 0.40), 0.060);
    const navel = sprite(new THREE.Vector3(0, yNavel - 0.04, zFront * 0.78), new THREE.Vector2(0.20, 0.20), 0.038);
    const kneeL = sprite(new THREE.Vector3(-0.26, yKnee, zFront * 0.64), new THREE.Vector2(0.12, 0.12), 0.032);
    const kneeR = sprite(new THREE.Vector3(0.26, yKnee, zFront * 0.64), new THREE.Vector2(0.12, 0.12), 0.032);
    group.userData.glows = { backGlow: bg, chestGlow: chest, navelGlow: navel, kneeL, kneeR };
  } catch (_) {}

  try {
    const groundY = yBase - 0.08;
    const ringMat = new THREE.MeshBasicMaterial({
      color: BODYTWIN_GRID,
      transparent: true,
      opacity: 0.060,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    [0.84, 1.18, 1.56].forEach((r, idx) => {
      const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.010, 128), ringMat.clone());
      ring.rotation.x = Math.PI / 2;
      ring.position.y = groundY;
      ring.material.opacity = 0.060 - idx * 0.014;
      group.add(ring);
      group.userData.rings = [...(group.userData.rings || []), ring];
    });
    const grid = new THREE.GridHelper(2.7, 18, BODYTWIN_GRID, 0x0044aa);
    grid.position.y = groundY - 0.01;
    grid.material.transparent = true;
    grid.material.opacity = 0.028;
    group.add(grid);
  } catch (_) {}

  group.userData.profile = p;
  group.userData.mode = 'glb';
  group.userData.glb = true;
  return group;
}

function applyPoseToGLBSkeleton(gltfOrScene, worldLandmarks) {
  const scene = gltfOrScene?.scene || gltfOrScene;
  if (!scene || !worldLandmarks || worldLandmarks.length < 29) return;

  const lm = worldLandmarks;
  function toLM(i) {
    const p = lm[i] || {};
    return new THREE.Vector3(Number(p.x || 0), -Number(p.y || 0), -Number(p.z || 0));
  }
  function midpointLM(i, j) {
    return toLM(i).add(toLM(j)).multiplyScalar(0.5);
  }
  function boneQuaternion(fromVec, toVec, restDir = new THREE.Vector3(0, 1, 0)) {
    const dir = toVec.clone().sub(fromVec);
    if (dir.lengthSq() < 0.0001) return new THREE.Quaternion();
    return new THREE.Quaternion().setFromUnitVectors(restDir, dir.normalize());
  }

  const BONE_ROTATIONS = {
    LeftShoulder: () => boneQuaternion(toLM(11), toLM(13)),
    RightShoulder: () => boneQuaternion(toLM(12), toLM(14)),
    LeftArm: () => boneQuaternion(toLM(13), toLM(15)),
    RightArm: () => boneQuaternion(toLM(14), toLM(16)),
    LeftForeArm: () => boneQuaternion(toLM(15), toLM(17)),
    RightForeArm: () => boneQuaternion(toLM(16), toLM(18)),
    LeftHand: () => boneQuaternion(toLM(15), toLM(19)),
    RightHand: () => boneQuaternion(toLM(16), toLM(20)),
    LeftUpLeg: () => boneQuaternion(toLM(23), toLM(25)),
    RightUpLeg: () => boneQuaternion(toLM(24), toLM(26)),
    LeftLeg: () => boneQuaternion(toLM(25), toLM(27)),
    RightLeg: () => boneQuaternion(toLM(26), toLM(28)),
    LeftFoot: () => boneQuaternion(toLM(27), toLM(31)),
    RightFoot: () => boneQuaternion(toLM(28), toLM(32)),
    Hips: () => boneQuaternion(midpointLM(23, 24), midpointLM(11, 12)),
    Spine: () => boneQuaternion(midpointLM(23, 24), midpointLM(11, 12)),
    Spine1: () => boneQuaternion(midpointLM(23, 24), midpointLM(11, 12)),
    Chest: () => boneQuaternion(midpointLM(11, 12), toLM(0)),
    Head: () => boneQuaternion(midpointLM(11, 12), toLM(0))
  };

  scene.traverse(obj => {
    if (!obj.isBone) return;
    const rotFn = BONE_ROTATIONS[obj.name];
    if (!rotFn) return;
    try {
      const q = rotFn();
      obj.quaternion.slerp(q, 0.85);
      obj.updateMatrixWorld(true);
    } catch (_) {}
  });
}

async function buildBodyGroup(profile, worldLandmarks) {
  const gender = anatomyGender(appProfile());
  const gltf = await loadAnatomyModel(gender);
  if (gltf?.scene) {
    const group = new THREE.Group();
    const safetyBody = buildPremiumBody(profile, worldLandmarks);
    safetyBody.name = 'bodytwin-procedural-safety-layer';
    safetyBody.traverse(obj => {
      if (obj.material?.wireframe && obj.material.opacity) obj.material.opacity = Math.min(obj.material.opacity, 0.32);
      else if (obj.material?.opacity) obj.material.opacity = Math.min(obj.material.opacity, 0.08);
    });
    group.add(safetyBody);

    const model = gltf.scene;
    model.name = `bodytwin-${gender}-glb`;
    applyPoseToGLBSkeleton(model, worldLandmarks);
    fitAnatomyModelToStage(model);
    group.add(model);
    const base = createScanCircle();
    group.add(base);
    group.userData.rings = base.userData.rings || [];
    group.userData.profile = profile || estimateBodyProfile(worldLandmarks, appProfile());
    group.userData.landmarks = worldLandmarks || [];
    group.userData.mode = 'glb';
    return group;
  }
  return buildPremiumBody(profile, worldLandmarks);
}

function addPoseDebugOverlay(group, landmarks3d) {
  const data = generateWireframeSkeleton(landmarks3d);
  const lineMaterial = new THREE.LineBasicMaterial({ color: BODYTWIN_GRID, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
  data.segments.forEach(([a, b]) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a.x, a.y, a.z), new THREE.Vector3(b.x, b.y, b.z)]);
    group.add(new THREE.Line(geometry, lineMaterial));
  });
  const jointMaterial = new THREE.MeshBasicMaterial({ color: BODYTWIN_NEON, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
  const jointGeo = new THREE.SphereGeometry(0.028, 10, 8);
  data.points.forEach(p => {
    if (p.visibility < 0.35) return;
    const dot = new THREE.Mesh(jointGeo, jointMaterial);
    dot.position.set(p.x, p.y, p.z);
    group.add(dot);
  });
}

function applyHabitReactiveLighting(group) {
  const metrics = todayMetrics();
  const hydrationOk = Number(metrics.hydration_score || 0) >= 80;
  const proteinOk = Number(metrics.protein_score || 0) >= 80;
  const trainingOk = Number(metrics.training_score || 0) >= 80;
  if (hydrationOk) {
    (group.userData.rings || []).forEach(ring => ring.material?.color?.setHex?.(0x38bdf8));
  }
  if (proteinOk) {
    group.traverse(obj => {
      if (obj.material?.wireframe && obj.material.opacity) obj.material.opacity = Math.min(0.75, obj.material.opacity * 1.15);
    });
  }
  if (trainingOk && group.userData.glows?.chestGlow) {
    group.userData.glows.chestGlow.material.opacity = Math.min(0.58, group.userData.glows.chestGlow.material.opacity + 0.14);
  }
  group.userData.evolutionPulse = hydrationOk && proteinOk && trainingOk;
}

async function renderBodyTwin3D(container, landmarks3d, renderState = {}) {
  if (!container) return;
  disposeBodyTwin3D();

  // FIX 1: mostrar feedback imediato — usuário não vê tela preta enquanto carrega
  container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:340px;color:#00AAFF;font-size:13px;letter-spacing:.05em">Gerando corpo digital...</div>';

  // FIX 2: Three.js com fallback para Canvas2D se falhar
  let T;
  try {
    T = await ensureThree();
  } catch (threeErr) {
    console.warn('[BodyTwin] Three.js indisponivel, usando fallback 2D:', threeErr);
    _render2DFallback(container, landmarks3d);
    return;
  }

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  await new Promise(resolve => requestAnimationFrame(resolve));
  const rect = container.getBoundingClientRect();
  const width  = Math.max(280, Math.floor(rect.width  || container.clientWidth  || 320));
  const measuredHeight = Math.round(rect.height || container.clientHeight || 0);
  const height = Math.max(520, Math.min(720, measuredHeight > 420 ? measuredHeight : Math.round(window.innerHeight * 0.74)));

  // FIX 3: WebGLRenderer com fallback — se WebGL falhar usa Canvas2D
  let renderer;
  try {
    renderer = new T.WebGLRenderer({
      alpha: false,
      antialias: false,          // desliga antialias — menos GPU no mobile
      preserveDrawingBuffer: true,
      powerPreference: 'low-power'
    });
  } catch (glErr) {
    console.warn('[BodyTwin] WebGL indisponivel, usando fallback 2D:', glErr);
    _render2DFallback(container, landmarks3d);
    return;
  }

  renderer.setPixelRatio(1);     // força 1x — sem devicePixelRatio no mobile (menos VRAM)
  renderer.setSize(width, height);
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 1);
  const cvs = renderer.domElement;
  cvs.style.cssText = 'display:block;width:100%;height:auto;max-width:100%;';
  container.innerHTML = '';
  container.appendChild(cvs);

  const scene = new T.Scene();
  const profile = renderState?.bodyProfile || estimateBodyProfile(landmarks3d, appProfile());
  const aspect = width / height;
  const viewH = 3.58;
  const viewW = viewH * aspect;
  const camFront = new T.OrthographicCamera(-viewW / 2, viewW / 2, viewH / 2, -viewH / 2, 0.1, 100);
  camFront.position.set(0, 0.12, 6);
  camFront.lookAt(0, 0.12, 0);
  camFront.updateProjectionMatrix();

  const glbFirst = BODYTWIN_ENABLE_GLB_UPGRADE;
  let group;
  if (glbFirst) {
    group = new T.Group();
    group.name = 'bodytwin-glb-loading-stage';
    group.userData.mode = 'glb-loading';
    group.userData.glbLoading = true;
  } else {
    try {
      group = buildReferenceMappedHologramAvatar(profile, renderState?.silhouette || profile?.silhouetteWidths || null);
      applyHabitReactiveLighting(group);
      if (poseDebugMode) addPoseDebugOverlay(group, landmarks3d);
    } catch (bodyErr) {
      console.warn('[BodyTwin] buildReferenceMappedHologramAvatar falhou, usando fallback 2D:', bodyErr);
      renderer.dispose();
      _render2DFallback(container, landmarks3d);
      return;
    }
  }

  function fitGroupToViewport(targetGroup, label = 'body') {
    try {
      if (!targetGroup) return null;
      targetGroup.updateMatrixWorld(true);
      const fitMeshes = targetGroup.userData?.primaryMeshes || null;
      const fitObject = targetGroup.userData?.primaryModel || targetGroup;
      const boxFromFitMeshes = meshes => {
        const meshBox = new T.Box3();
        meshes.forEach(mesh => {
          mesh.updateMatrixWorld(true);
          if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
          meshBox.union(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
        });
        return meshBox;
      };
      fitObject.updateMatrixWorld(true);
      const box = Array.isArray(fitMeshes) && fitMeshes.length ? boxFromFitMeshes(fitMeshes) : new T.Box3().setFromObject(fitObject);
      const size = box.getSize(new T.Vector3());
      const center = box.getCenter(new T.Vector3());
      if (!Number.isFinite(size.x) || !Number.isFinite(size.y) || size.x <= 0 || size.y <= 0) return null;
      const referenceFit = BODYTWIN_REFERENCE_COMPOSITION && String(label || '').startsWith('glb');
      const fitScale = Math.min(
        (viewW * (referenceFit ? 0.82 : 0.78)) / Math.max(size.x, 0.001),
        (viewH * (referenceFit ? 0.725 : 0.68)) / Math.max(size.y, 0.001)
      );
      targetGroup.scale.multiplyScalar(clamp(fitScale, 0.18, 1.14));
      targetGroup.position.x -= center.x * targetGroup.scale.x;
      targetGroup.position.y -= center.y * targetGroup.scale.y;
      targetGroup.position.y += viewH * (referenceFit ? 0.128 : 0.145);
      targetGroup.position.z -= center.z * targetGroup.scale.z;
      targetGroup.updateMatrixWorld(true);
      fitObject.updateMatrixWorld(true);
      const finalBox = Array.isArray(fitMeshes) && fitMeshes.length ? boxFromFitMeshes(fitMeshes) : new T.Box3().setFromObject(fitObject);
      const finalSize = finalBox.getSize(new T.Vector3());
      const finalCenter = finalBox.getCenter(new T.Vector3());
      targetGroup.userData.viewportFit = {
        label,
        centerX: Number(finalCenter.x.toFixed(4)),
        centerY: Number(finalCenter.y.toFixed(4)),
        sizeX: Number(finalSize.x.toFixed(4)),
        sizeY: Number(finalSize.y.toFixed(4))
      };
      return targetGroup.userData.viewportFit;
    } catch (frameErr) {
      console.warn('[BodyTwin] enquadramento automatico falhou:', frameErr?.message || frameErr);
      return null;
    }
  }

  scene.add(group);
  fitGroupToViewport(group, group?.userData?.mode || 'initial');
  try { scene.add(createParticles()); } catch (_) {}
  try {
    const light = new T.PointLight(BODYTWIN_NEON, 1.0, 12);
    light.position.set(0, 2, 4);
    scene.add(light);
  } catch (_) {}

  // FIX 4: loop de animação blindado — erro num frame não mata o loop nem o app
  function updateGlbFrontOrientation() {
    if (group?.userData?.mode !== 'glb') return group?.rotation?.y || 0;
    const yaw = group.userData?.frontYawOffset || 0;
    group.userData.currentTargetYaw = yaw;
    group.rotation.y = yaw;
    return yaw;
  }

  function renderFront() {
    try {
      const tag = group?.userData?.debugTag;
      if (tag) {
        tag.textContent = 'GLB V179 ativo (Safe Refinement)';
      }
    } catch (_) {}
    renderer.setViewport(0, 0, width, height);
    renderer.setScissor(0, 0, width, height);
    renderer.setScissorTest(false);
    renderer.clear(true, true, true);
    renderer.render(scene, camFront);
  }

  let frame = 0;
  let alive = true;
  let paused = false;
  let frameErrors = 0;
  const rotationStep = (Math.PI * 2) / (60 * 160);
  const frontLockUntil = performance.now() + 120000;
  container.addEventListener('pointerdown', () => { paused = true; },  { passive: true });
  container.addEventListener('pointerup',   () => { paused = false; }, { passive: true });

  if (BODYTWIN_ENABLE_GLB_UPGRADE && group?.userData?.mode !== 'glb') {
    ;(async () => {
      try {
        const gender = anatomyGender(appProfile());
        const gltf = await loadAnatomyModel(gender);
        if (!gltf || !alive) throw new Error('GLB nao carregou');
        const glbGroup = buildGlbBody(profile, gltf);
        applyHabitReactiveLighting(glbGroup);
        scene.remove(group);
        disposeThreeObject(group);
        group = glbGroup;
        updateGlbFrontOrientation();
        group.updateMatrixWorld(true);
        scene.add(group);
        fitGroupToViewport(group, 'glb-v179');
        // V179: indicador visual — confirma shader anatomico e yaw frontal fixo.
        try {
          const tag = document.createElement('div');
          tag.style.cssText = 'position:absolute;bottom:6px;left:6px;font-size:9px;color:#00ff88;background:#00000099;padding:2px 6px;letter-spacing:1px;pointer-events:none;z-index:9;font-family:monospace;';
          tag.textContent = 'GLB V179 ativo (Safe Refinement)';
          container.style.position = 'relative';
          container.appendChild(tag);
          group.userData.debugTag = tag;
        } catch(_) {}
        console.log('[BodyTwin-V179] safe refinement render OK', {
          sourcePath: gltf?.userData?.sourcePath,
          frontYaw: group.userData?.frontYawOffset,
          surfaceGridStats: glbGroup?.userData?.surfaceGridStats || {}
        });
        console.log('[BodyTwin-V179] pose audit', glbGroup?.userData?.poseAudit || {});
        renderFront();
      } catch (glbErr) {
        console.warn('[BodyTwin] GLB indisponivel, usando procedural somente como fallback:', glbErr?.message || glbErr);
        if (!alive) return;
        try {
          const fallbackGroup = buildReferenceMappedHologramAvatar(profile, renderState?.silhouette || profile?.silhouetteWidths || null);
          applyHabitReactiveLighting(fallbackGroup);
          if (poseDebugMode) addPoseDebugOverlay(fallbackGroup, landmarks3d);
          scene.remove(group);
          disposeThreeObject(group);
          group = fallbackGroup;
          scene.add(group);
          fitGroupToViewport(group, group?.userData?.mode || 'procedural-fallback');
          renderFront();
        } catch (fallbackErr) {
          alive = false;
          try { renderer.dispose(); } catch (_) {}
          _render2DFallback(container, landmarks3d);
        }
      }
    })();
  }

  function animate() {
    if (!alive) return;
    try {
      frame += 1;
      if (!reduced && !paused) {
        if (performance.now() > frontLockUntil) {
          group.rotation.y += rotationStep;
        } else if (group?.userData?.mode === 'glb') {
          updateGlbFrontOrientation();
        }
        (group.userData.rings || []).forEach((ring, idx) => {
          ring.scale.setScalar(1 + Math.sin(frame / 60 + idx) * 0.018);
        });
        if (group.userData.glows?.chestGlow) {
          group.userData.glows.chestGlow.material.opacity = 0.075 + Math.sin(frame / 36) * 0.020;
        }
      }
      renderFront();
      frameErrors = 0;
    } catch (frameErr) {
      frameErrors += 1;
      console.warn('[BodyTwin] frame error #' + frameErrors + ':', frameErr?.message || frameErr);
      if (frameErrors > 8) {
        // Muitos erros consecutivos: parar loop, mostrar fallback 2D
        alive = false;
        try { renderer.dispose(); } catch (_) {}
        _render2DFallback(container, landmarks3d);
        return;
      }
    }
    requestAnimationFrame(animate);
  }

  activeScene = {
    renderer,
    scene,
    camera: camFront,
    group,
    renderOnce: () => { try { renderFront(); } catch (_) {} },
    stop() {
      alive = false;
      try {
        scene.traverse(obj => {
          obj.geometry?.dispose?.();
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose?.());
          else obj.material?.dispose?.();
        });
        renderer.dispose();
      } catch (_) {}
      if (renderer.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  };
  animate();
}

// Fallback Canvas2D: sempre funciona, sem WebGL, sem crash
function _render2DFallback(container, landmarks3d) {
  try {
    const W = container.clientWidth  || 320;
    const H = Math.max(380, Math.round(window.innerHeight * 0.52));
    const canvas = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;
    canvas.style.cssText = 'display:block;width:100%;height:auto;max-width:100%;';
    container.innerHTML = '';
    container.appendChild(canvas);
    drawPremiumBody2D(canvas, landmarks3d);
  } catch (e2d) {
    console.warn('[BodyTwin] fallback 2D falhou:', e2d);
    container.innerHTML = '<div style="color:#00AAFF;font-size:12px;padding:24px;text-align:center">Corpo estimado • modo básico</div>';
  }
}

function disposeBodyTwin3D() {
  if (!activeScene) return;
  try { activeScene.stop(); } catch (_) {}
  activeScene = null;
}

function drawPremiumBody2D(canvas, landmarks) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  const p = normalizeVisualProfile(estimateBodyProfile(landmarks, appProfile()));
  const cx = W * 0.50;
  const top = H * 0.12;
  const foot = H * 0.90;
  const bodyH = foot - top;
  const shoulderY = top + bodyH * 0.22;
  const hipY = top + bodyH * 0.52;
  const kneeY = top + bodyH * 0.72;
  const ankleY = top + bodyH * 0.88;
  const headR = Math.max(20, Math.min(34, W * 0.055));
  const shoulderW = W * clamp((p.shoulderW || 1) * 0.20, 0.20, 0.30);
  const hipW = W * clamp((p.hipW || 0.8) * 0.16, 0.16, 0.25);
  const waistW = W * clamp((p.waistW || 0.75) * 0.15, 0.15, 0.25);
  const armR = W * 0.030;
  const legR = W * 0.040;

  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createRadialGradient(cx, H * 0.42, 10, cx, H * 0.42, H * 0.64);
  bg.addColorStop(0, 'rgba(0,217,255,0.18)');
  bg.addColorStop(0.48, 'rgba(2,22,33,0.86)');
  bg.addColorStop(1, '#02080d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.strokeStyle = 'rgba(0,217,255,0.12)';
  ctx.lineWidth = 1;
  for (let y = H * 0.80; y < H; y += 10) {
    ctx.beginPath();
    ctx.ellipse(cx, y, (y - H * 0.72) * 1.15, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  function glowStroke(width = 1.4, alpha = 0.86) {
    ctx.strokeStyle = `rgba(0,217,255,${alpha})`;
    ctx.lineWidth = width;
    ctx.shadowColor = 'rgba(0,217,255,0.72)';
    ctx.shadowBlur = 13;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }
  function capsule(x1, y1, x2, y2, r) {
    glowStroke(1.2, 0.82);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.max(1, Math.hypot(dx, dy));
    const nx = -dy / len * r;
    const ny = dx / len * r;
    const outline = [
      [x1 + nx, y1 + ny], [x2 + nx, y2 + ny],
      [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]
    ];
    ctx.beginPath();
    ctx.moveTo(outline[0][0], outline[0][1]);
    outline.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.closePath();
    ctx.stroke();
    for (let i = 1; i < 5; i += 1) {
      const t = i / 5;
      const x = x1 + dx * t;
      const y = y1 + dy * t;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.95, r * 0.32, Math.atan2(dy, dx), 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  function ellipse(x, y, rx, ry, alpha = 0.82) {
    glowStroke(1.2, alpha);
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(0,217,255,0.055)';
  ctx.strokeStyle = 'rgba(0,217,255,0.92)';
  ctx.shadowColor = 'rgba(0,217,255,0.65)';
  ctx.shadowBlur = 18;

  // Silhueta torso.
  ctx.beginPath();
  ctx.moveTo(cx - shoulderW, shoulderY);
  ctx.bezierCurveTo(cx - shoulderW * 0.84, shoulderY + bodyH * 0.12, cx - waistW, hipY - bodyH * 0.07, cx - hipW, hipY);
  ctx.bezierCurveTo(cx - hipW * 0.74, hipY + bodyH * 0.08, cx + hipW * 0.74, hipY + bodyH * 0.08, cx + hipW, hipY);
  ctx.bezierCurveTo(cx + waistW, hipY - bodyH * 0.07, cx + shoulderW * 0.84, shoulderY + bodyH * 0.12, cx + shoulderW, shoulderY);
  ctx.bezierCurveTo(cx + shoulderW * 0.45, shoulderY - bodyH * 0.04, cx - shoulderW * 0.45, shoulderY - bodyH * 0.04, cx - shoulderW, shoulderY);
  ctx.closePath();
  ctx.fill();
  glowStroke(1.5, 0.92);
  ctx.stroke();

  // Cabeça e pescoço.
  ellipse(cx, top + headR, headR * 0.78, headR * 1.08, 0.92);
  capsule(cx, top + headR * 1.90, cx, shoulderY - 4, W * 0.018);

  // Membros.
  const leftShoulder = [cx - shoulderW * 0.96, shoulderY + 4];
  const rightShoulder = [cx + shoulderW * 0.96, shoulderY + 4];
  const leftElbow = [cx - shoulderW * 1.22, shoulderY + bodyH * 0.22];
  const rightElbow = [cx + shoulderW * 1.22, shoulderY + bodyH * 0.22];
  const leftHand = [cx - hipW * 1.22, hipY + bodyH * 0.18];
  const rightHand = [cx + hipW * 1.22, hipY + bodyH * 0.18];
  capsule(...leftShoulder, ...leftElbow, armR);
  capsule(...leftElbow, ...leftHand, armR * 0.78);
  capsule(...rightShoulder, ...rightElbow, armR);
  capsule(...rightElbow, ...rightHand, armR * 0.78);
  ellipse(leftHand[0], leftHand[1], armR * 0.72, armR * 1.10, 0.72);
  ellipse(rightHand[0], rightHand[1], armR * 0.72, armR * 1.10, 0.72);

  const leftHip = [cx - hipW * 0.55, hipY + bodyH * 0.04];
  const rightHip = [cx + hipW * 0.55, hipY + bodyH * 0.04];
  const leftKnee = [cx - hipW * 0.42, kneeY];
  const rightKnee = [cx + hipW * 0.42, kneeY];
  const leftAnkle = [cx - hipW * 0.34, ankleY];
  const rightAnkle = [cx + hipW * 0.34, ankleY];
  capsule(...leftHip, ...leftKnee, legR);
  capsule(...leftKnee, ...leftAnkle, legR * 0.82);
  capsule(...rightHip, ...rightKnee, legR);
  capsule(...rightKnee, ...rightAnkle, legR * 0.82);
  ellipse(leftAnkle[0], leftAnkle[1] + legR * 0.5, legR * 1.2, legR * 0.55, 0.62);
  ellipse(rightAnkle[0], rightAnkle[1] + legR * 0.5, legR * 1.2, legR * 0.55, 0.62);

  // Grid premium no tronco.
  for (let i = 1; i <= 11; i += 1) {
    const t = i / 12;
    const y = shoulderY + (hipY - shoulderY) * t;
    const w = t < 0.52 ? shoulderW + (waistW - shoulderW) * (t / 0.52) : waistW + (hipW - waistW) * ((t - 0.52) / 0.48);
    ellipse(cx, y, Math.max(8, w * 0.88), 4 + t * 4, 0.36);
  }
  [-0.66, -0.33, 0, 0.33, 0.66].forEach(k => {
    glowStroke(k === 0 ? 1.4 : 0.9, k === 0 ? 0.70 : 0.42);
    ctx.beginPath();
    ctx.moveTo(cx + shoulderW * k, shoulderY + 3);
    ctx.bezierCurveTo(cx + waistW * k, shoulderY + bodyH * 0.18, cx + waistW * k, hipY - bodyH * 0.12, cx + hipW * k, hipY);
    ctx.stroke();
  });

  // Peito/abdômen como detalhe sutil.
  ellipse(cx - shoulderW * 0.28, shoulderY + bodyH * 0.10, shoulderW * 0.20, bodyH * 0.035, 0.50);
  ellipse(cx + shoulderW * 0.28, shoulderY + bodyH * 0.10, shoulderW * 0.20, bodyH * 0.035, 0.50);
  for (let i = 0; i < 3; i += 1) {
    ellipse(cx, shoulderY + bodyH * (0.22 + i * 0.065), waistW * 0.42, bodyH * 0.022, 0.34);
  }

}

function drawWireframe2D(canvas, landmarks) {
  if (!canvas || !landmarks) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#00AAFF';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(0,255,65,.55)';
  ctx.shadowBlur = 12;
  EDGES.forEach(([a, b]) => {
    const p = landmarks[a], q = landmarks[b];
    if (!p || !q) return;
    ctx.beginPath();
    ctx.moveTo(p.x * canvas.width, p.y * canvas.height);
    ctx.lineTo(q.x * canvas.width, q.y * canvas.height);
    ctx.stroke();
  });
  ctx.fillStyle = '#7DD3FC';
  landmarks.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x * canvas.width, p.y * canvas.height, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function onOpen() {
  disposeBodyTwin3D();
  const el = root();
  if (!el || el.dataset.ready === '1') return;
  el.dataset.ready = '1';
  setStatus(t('bodytwin_capture_hints'));
  loadBodyTwinSettings().catch(err => console.warn('[BodyTwin settings]', err));
  listBodySnapshotsV2().catch(err => console.warn('[BodyTwin list]', err));
}

window.addEventListener('vitalia:bodytwin:open', onOpen);

window.BodyTwin = {
  captureBodyImage,
  preprocessImage,
  detectPoseLandmarks,
  validateCapture,
  computeQualityScore,
  normalizeBodyPose,
  generateWireframeSkeleton,
  renderBodyTwin3D,
  disposeBodyTwin3D,
  saveBodySnapshot,
  listBodySnapshots: listBodySnapshotsV2,
  togglePoseDebugMode,
  compareBodySnapshot,
  deleteBodySnapshot: deleteBodySnapshotV2,
  deleteAllBodyTwinData: deleteAllBodyTwinDataV2,
  analyzeWithCoach,
  getLastResult: () => lastResult
};

export {
  captureBodyImage,
  preprocessImage,
  detectPoseLandmarks,
  validateCapture,
  computeQualityScore,
  normalizeBodyPose,
  generateWireframeSkeleton,
  renderBodyTwin3D,
  saveBodySnapshot,
  listBodySnapshotsV2 as listBodySnapshots,
  togglePoseDebugMode,
  compareBodySnapshot,
  deleteBodySnapshotV2 as deleteBodySnapshot,
  deleteAllBodyTwinDataV2 as deleteAllBodyTwinData,
  analyzeWithCoach
};
