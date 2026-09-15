//! ==========================================================================
//! Model reg & definitions
//! ==========================================================================

export const MODEL_REGISTRY = [
  {
    provider: 'meta',
    label: 'Llama 3.2',
    variants: [
      {
        id: 'Llama-3.2-1B-Instruct',
        name: '1B',
        note: 'Fast',
        f16Id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
        f32Id: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
        sizeF16: '~880 MB',
        sizeF32: '~1.1 GB',
      },
      {
        id: 'Llama-3.2-3B-Instruct',
        name: '3B',
        note: 'Quality',
        f16Id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
        f32Id: 'Llama-3.2-3B-Instruct-q4f32_1-MLC',
        sizeF16: '~2.2 GB',
        sizeF32: '~2.9 GB',
      },
    ],
  },
  {
    provider: 'google',
    label: 'Gemma',
    variants: [
      {
        id: 'gemma3-1b-it',
        name: 'Gemma 3 · 1B',
        note: 'Light',
        f16Id: 'gemma3-1b-it-q4f16_1-MLC',
        f32Id: null, // FP16 only in WebLLM
        sizeF16: '~710 MB',
        sizeF32: 'N/A',
      },
      {
        id: 'gemma-2-2b-it',
        name: 'Gemma 2 · 2B',
        note: 'Reasoning',
        f16Id: 'gemma-2-2b-it-q4f16_1-MLC',
        f32Id: 'gemma-2-2b-it-q4f32_1-MLC',
        sizeF16: '~1.9 GB',
        sizeF32: '~2.5 GB',
      },
    ],
  },
  {
    provider: 'alibaba',
    label: 'Qwen 2.5',
    variants: [
      {
        id: 'Qwen2.5-0.5B-Instruct',
        name: '0.5B',
        note: 'Tiny',
        f16Id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
        f32Id: 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC',
        sizeF16: '~350 MB',
        sizeF32: '~450 MB',
      },
      {
        id: 'Qwen2.5-1.5B-Instruct',
        name: '1.5B',
        note: 'Chat',
        f16Id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
        f32Id: 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC',
        sizeF16: '~1.6 GB',
        sizeF32: '~1.9 GB',
      },
      {
        id: 'Qwen2.5-Coder-1.5B-Instruct',
        name: 'Coder 1.5B',
        note: 'Code',
        f16Id: 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC',
        f32Id: 'Qwen2.5-Coder-1.5B-Instruct-q4f32_1-MLC',
        sizeF16: '~1.6 GB',
        sizeF32: '~1.9 GB',
      },
    ],
  },
  {
    provider: 'microsoft',
    label: 'Phi 3.5',
    variants: [
      {
        id: 'Phi-3.5-mini-instruct',
        name: 'Mini · 3.8B',
        note: 'Reasoning',
        f16Id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
        f32Id: 'Phi-3.5-mini-instruct-q4f32_1-MLC',
        sizeF16: '~3.6 GB',
        sizeF32: '~5.5 GB',
      },
    ],
  },
  {
    provider: 'mistral',
    label: 'Ministral 3',
    variants: [
      {
        id: 'Ministral-3-3B-Instruct-2512-BF16',
        name: '3B',
        note: 'Compact',
        f16Id: 'Ministral-3-3B-Instruct-2512-BF16-q4f16_1-MLC',
        f32Id: 'Ministral-3-3B-Instruct-2512-BF16-q4f32_1-MLC',
        sizeF16: '~2.8 GB',
        sizeF32: '~3.5 GB',
      },
    ],
  },
  {
    provider: 'huggingface',
    label: 'SmolLM2',
    variants: [
      {
        id: 'SmolLM2-360M-Instruct',
        name: '360M',
        note: 'Tiny',
        f16Id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
        f32Id: 'SmolLM2-360M-Instruct-q4f32_1-MLC',
        sizeF16: '~370 MB',
        sizeF32: '~580 MB',
      },
      {
        id: 'SmolLM2-1.7B-Instruct',
        name: '1.7B',
        note: 'Balanced',
        f16Id: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC',
        f32Id: 'SmolLM2-1.7B-Instruct-q4f32_1-MLC',
        sizeF16: '~1.7 GB',
        sizeF32: '~2.7 GB',
      },
    ],
  },
  {
    provider: 'allenai',
    label: 'OLMo 2',
    variants: [
      {
        id: 'OLMo-2-0425-1B-Instruct',
        name: '1B',
        note: 'Open',
        f16Id: 'OLMo-2-0425-1B-Instruct-q4f16_1-MLC',
        f32Id: 'OLMo-2-0425-1B-Instruct-q4f32_1-MLC',
        sizeF16: '~1.7 GB',
        sizeF32: '~2.5 GB',
      },
    ],
  },
];

let globalHasF16 = false;

export function setWebGPUPresence(hasF16) {
  globalHasF16 = Boolean(hasF16);
}

export function getWebGPUPresence() {
  return globalHasF16;
}

export function getDefaultModelId(hasF16 = globalHasF16) {
  return hasF16
    ? 'Llama-3.2-1B-Instruct-q4f16_1-MLC'
    : 'Llama-3.2-1B-Instruct-q4f32_1-MLC';
}

export const DEFAULT_MODEL_ID = 'Llama-3.2-1B-Instruct-q4f32_1-MLC';

export function findModelVariant(modelId) {
  if (!modelId) return null;
  for (const group of MODEL_REGISTRY) {
    for (const v of group.variants) {
      if (
        v.id === modelId ||
        v.f16Id === modelId ||
        v.f32Id === modelId ||
        modelId.startsWith(v.id)
      ) {
        return {
          ...v,
          provider: group.provider,
          providerLabel: group.label,
        };
      }
    }
  }
  return null;
}

export function resolveModelId(modelId, hasF16 = globalHasF16) {
  if (!modelId) return getDefaultModelId(hasF16);

  const variant = findModelVariant(modelId);
  if (variant) {
    if (hasF16) {
      return variant.f16Id || variant.f32Id;
    }
    return variant.f32Id || variant.f16Id;
  }

  // Fallback string replacement if id follows MLC convention
  if (!hasF16 && modelId.includes('-q4f16_1-MLC')) {
    return modelId.replace('-q4f16_1-MLC', '-q4f32_1-MLC');
  }
  if (hasF16 && modelId.includes('-q4f32_1-MLC')) {
    return modelId.replace('-q4f32_1-MLC', '-q4f16_1-MLC');
  }

  return modelId;
}

export function getAllModelVariants(hasF16 = globalHasF16) {
  const list = [];
  for (const group of MODEL_REGISTRY) {
    for (const v of group.variants) {
      const activeId = hasF16 ? (v.f16Id || v.f32Id) : (v.f32Id || v.f16Id);
      const isUnsupported = !hasF16 && !v.f32Id;
      const size = hasF16 ? (v.sizeF16 || v.size) : (v.sizeF32 || v.sizeF16 || v.size);
      list.push({
        ...v,
        id: activeId,
        provider: group.provider,
        providerLabel: group.label,
        size,
        unsupported: isUnsupported,
        precision: hasF16 ? 'FP16' : (v.f32Id ? 'FP32' : 'FP16 only'),
      });
    }
  }
  return list;
}
