//! ==========================================================================
//! WebLLM Engine Service & Lifecycle
//! ==========================================================================

import {
  CreateWebWorkerMLCEngine,
  hasModelInCache,
  deleteModelAllInfoInCache,
} from '@mlc-ai/web-llm';
import { getAllModelVariants, resolveModelId } from './models.js';

let engine = null;
let cachedGpuState = null;

export async function detectWebGPUSupport() {
  if (cachedGpuState) return cachedGpuState;

  if (!navigator.gpu) {
    console.warn('[WebLLM] WebGPU not supported.');
    cachedGpuState = {
      supported: false,
      hasF16: false,
      adapterName: 'None',
      error: 'WebGPU is not supported in this browser. Please use Chrome 113+, Edge, or Brave.',
    };
    return cachedGpuState;
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      cachedGpuState = {
        supported: false,
        hasF16: false,
        adapterName: 'None',
        error: 'No compatible WebGPU adapter found on this device.',
      };
      return cachedGpuState;
    }

    const hasF16 = adapter.features.has('shader-f16');
    let adapterName = 'WebGPU Device';
    try {
      const info = adapter.info || (await adapter.requestAdapterInfo?.());
      if (info?.description || info?.device || info?.vendor) {
        adapterName = info.description || `${info.vendor || ''} ${info.device || ''}`.trim();
      }
    } catch {}

    cachedGpuState = {
      supported: true,
      hasF16,
      adapterName,
      error: null,
    };
    return cachedGpuState;
  } catch (err) {
    cachedGpuState = {
      supported: false,
      hasF16: false,
      adapterName: 'None',
      error: err?.message || 'Failed to request WebGPU adapter.',
    };
    return cachedGpuState;
  }
}

export function checkWebGPU() {
  return Boolean(navigator.gpu);
}

export async function checkCachedModels(hasF16 = false) {
  const allVariants = getAllModelVariants(hasF16);
  const compatibleCached = new Set();
  const incompatibleCached = new Set();

  for (const variant of allVariants) {
    try {
      if (variant.id) {
        const cached = await hasModelInCache(variant.id);
        if (cached) {
          if (variant.unsupported) {
            incompatibleCached.add(variant.id);
          } else {
            compatibleCached.add(variant.id);
          }
        }
      }

      // Check if former FP16 variant is still sitting in cache on non-FP16 GPU
      if (!hasF16 && variant.f16Id && variant.f16Id !== variant.id) {
        const cachedF16 = await hasModelInCache(variant.f16Id);
        if (cachedF16) {
          incompatibleCached.add(variant.f16Id);
        }
      }
    } catch (e) {
      console.warn(`[WebLLM] Cache check failed for ${variant.name || variant.id}:`, e);
    }
  }

  return { compatibleCached, incompatibleCached };
}

export async function deleteModelCache(modelId) {
  await deleteModelAllInfoInCache(modelId);
}

export async function loadEngine(modelId, progressCallback, hasF16) {
  const effectiveId = (hasF16 !== undefined) ? resolveModelId(modelId, hasF16) : modelId;

  try {
    if (!engine) {
      const worker = new Worker(new URL('../worker.js', import.meta.url), {
        type: 'module',
      });
      engine = await CreateWebWorkerMLCEngine(worker, effectiveId, {
        initProgressCallback: progressCallback,
      });
    } else {
      if (progressCallback && typeof engine.setInitProgressCallback === 'function') {
        engine.setInitProgressCallback(progressCallback);
      }
      await engine.reload(effectiveId);
    }
    return engine;
  } catch (err) {
    // Reset engine reference on error so subsequent attempts spawn a fresh worker
    engine = null;
    throw err;
  }
}

export function getEngineInstance() {
  return engine;
}

export async function stopCurrentGeneration() {
  if (engine) {
    await engine.interruptGenerate();
  }
}
