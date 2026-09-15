//! ==========================================================================
//! Model Library Modal Dialog
//! ==========================================================================

import { getAllModelVariants } from '../models.js';

const modelLibraryDialog = document.getElementById('modelLibraryDialog');
const modelLibraryToggle = document.getElementById('modelLibraryToggle');
const libraryDialogClose = document.getElementById('libraryDialogClose');
const downloadedCountBadge = document.getElementById('downloadedCountBadge');
const tabAllModels = document.getElementById('tabAllModels');
const tabDownloadedModels = document.getElementById('tabDownloadedModels');
const modelCardGrid = document.getElementById('modelCardGrid');

const PROVIDER_COLORS = {
  meta: '#1877F2',
  google: '#EA4335',
  alibaba: '#FF6A00',
  microsoft: '#00A4EF',
  mistral: '#7C3AED',
  huggingface: '#FFD21E',
  allenai: '#00C49A',
};

let currentLibraryTab = 'all'; // 'all' | 'downloaded'

function updateTabStyles() {
  if (!tabAllModels || !tabDownloadedModels) return;
  const isAll = (currentLibraryTab === 'all');

  tabAllModels.className = isAll
    ? 'tab-btn font-body text-xs font-semibold px-3 py-1 border-[1.5px] border-ink rounded-full bg-accent-indigo text-white cursor-pointer transition-all'
    : 'tab-btn font-body text-xs font-semibold px-3 py-1 border-[1.5px] border-ink rounded-full bg-paper text-ink cursor-pointer hover:bg-paper-alt transition-all';

  tabDownloadedModels.className = !isAll
    ? 'tab-btn font-body text-xs font-semibold px-3 py-1 border-[1.5px] border-ink rounded-full bg-accent-indigo text-white cursor-pointer transition-all'
    : 'tab-btn font-body text-xs font-semibold px-3 py-1 border-[1.5px] border-ink rounded-full bg-paper text-ink cursor-pointer hover:bg-paper-alt transition-all';
}

export function initModelLibraryDialog({ onOpen, onClose }) {
  if (modelLibraryToggle) {
    modelLibraryToggle.addEventListener('click', onOpen);
  }
  if (libraryDialogClose) {
    libraryDialogClose.addEventListener('click', onClose);
  }
  if (modelLibraryDialog) {
    modelLibraryDialog.addEventListener('click', (event) => {
      if (event.target === modelLibraryDialog) {
        onClose();
      }
    });
  }

  if (tabAllModels && tabDownloadedModels) {
    tabAllModels.addEventListener('click', () => {
      currentLibraryTab = 'all';
      updateTabStyles();
      if (window.__refreshModelLibrary) window.__refreshModelLibrary();
    });

    tabDownloadedModels.addEventListener('click', () => {
      currentLibraryTab = 'downloaded';
      updateTabStyles();
      if (window.__refreshModelLibrary) window.__refreshModelLibrary();
    });
  }
}

export function openModelLibrary() {
  if (modelLibraryDialog) {
    modelLibraryDialog.showModal();
  }
}

export function closeModelLibrary() {
  if (modelLibraryDialog) {
    modelLibraryDialog.close();
  }
}

export function renderModelLibrary({
  downloadedModelIds = new Set(),
  incompatibleModelIds = new Set(),
  downloadingModelId,
  failedModelId,
  activeModelId,
  isEngineReady,
  isLoading,
  gpuState,
  onAction,
}) {
  window.__refreshModelLibrary = () => renderModelLibrary({
    downloadedModelIds,
    incompatibleModelIds,
    downloadingModelId,
    failedModelId,
    activeModelId,
    isEngineReady,
    isLoading,
    gpuState,
    onAction,
  });

  updateTabStyles();

  if (!modelCardGrid) return;
  modelCardGrid.innerHTML = '';

  if (downloadedCountBadge) {
    const readyCount = downloadedModelIds.size;
    const incompCount = incompatibleModelIds?.size || 0;
    downloadedCountBadge.textContent = incompCount > 0
      ? `${readyCount} ready · ${incompCount} incompatible`
      : `${readyCount} downloaded`;
  }

  const hasF16 = gpuState?.hasF16 ?? false;
  const allVariants = getAllModelVariants(hasF16);
  const filtered = currentLibraryTab === 'downloaded'
    ? allVariants.filter(v => downloadedModelIds.has(v.id) || incompatibleModelIds.has(v.f16Id) || incompatibleModelIds.has(v.id))
    : allVariants;

  if (filtered.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'py-7 text-center text-ink-muted text-sm';
    emptyMsg.textContent = currentLibraryTab === 'downloaded'
      ? 'No models downloaded yet. Switch to "All Models" to download one.'
      : 'No models found in registry.';
    modelCardGrid.appendChild(emptyMsg);
    return;
  }

  filtered.forEach(variant => {
    const card = document.createElement('div');
    card.className = 'bg-paper border-[1.5px] border-ink rounded-lg p-3 shadow-brutal-sm flex flex-col gap-2 hover:-translate-x-0.25 hover:-translate-y-0.25 transition-transform';
    card.id = `card-${variant.id}`;

    const isDownloaded = downloadedModelIds.has(variant.id);
    const isIncompatibleCached = incompatibleModelIds?.has(variant.f16Id) || incompatibleModelIds?.has(variant.id);
    const isDownloading = (downloadingModelId === variant.id);
    const isFailed = (failedModelId === variant.id);
    const isActive = (activeModelId === variant.id && isEngineReady);
    const isUnsupported = variant.unsupported;

    let actionsHtml = '';

    if (isDownloading) {
      actionsHtml = `
        <div class="flex flex-col gap-1 w-full">
          <div class="w-full h-1.5 bg-paper-alt border border-ink rounded overflow-hidden">
            <div id="cardProgressFill-${variant.id}" class="h-full bg-accent-teal transition-all duration-200" style="width: 0%"></div>
          </div>
          <span id="cardProgressText-${variant.id}" class="font-mono text-[11px] text-ink-soft truncate">Downloading...</span>
        </div>
      `;
    } else if (isFailed) {
      actionsHtml = `
        <div class="text-xs font-semibold text-danger font-mono">Failed</div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button class="font-body text-xs font-semibold px-3 py-1 border-[1.5px] border-ink rounded-full bg-accent-amber text-ink cursor-pointer hover:shadow-brutal-sm hover:-translate-x-0.25 hover:-translate-y-0.25 active:translate-x-0.25 active:translate-y-0.25 active:shadow-none transition-all whitespace-nowrap" data-action="retry" data-id="${variant.id}">Retry Download</button>
        </div>
      `;
    } else if (isIncompatibleCached) {
      actionsHtml = `
        <div class="text-xs font-semibold text-danger font-mono"> Incompatible (FP16 WebGPU)</div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button class="font-body text-xs font-semibold px-3 py-1 border-[1.5px] border-danger rounded-full bg-paper hover:bg-danger text-danger hover:text-white cursor-pointer hover:shadow-brutal-sm hover:-translate-x-0.25 hover:-translate-y-0.25 active:translate-x-0.25 active:translate-y-0.25 active:shadow-none transition-all whitespace-nowrap" data-action="delete-incompatible" data-id="${variant.f16Id || variant.id}" title="Delete unsupported cached model">Delete</button>
          ${variant.f32Id ? `<button class="font-body text-xs font-semibold px-3 py-1 border-[1.5px] border-ink rounded-full bg-accent-teal hover:bg-accent-teal-hover text-white cursor-pointer hover:shadow-brutal-sm hover:-translate-x-0.25 hover:-translate-y-0.25 active:translate-x-0.25 active:translate-y-0.25 active:shadow-none transition-all whitespace-nowrap" data-action="download" data-id="${variant.id}">Get FP32</button>` : ''}
        </div>
      `;
    } else if (isDownloaded) {
      actionsHtml = `
        <div class="text-xs font-semibold text-accent-teal">Cached locally</div>
        <div class="flex items-center gap-1.5 shrink-0">
          ${isActive
          ? '<span class="font-body text-xs font-semibold px-3 py-1 border-[1.5px] border-ink rounded-full bg-accent-amber text-ink cursor-default whitespace-nowrap">Active</span>'
          : `<button class="font-body text-xs font-semibold px-3 py-1 border-[1.5px] border-ink rounded-full bg-accent-teal hover:bg-accent-teal-hover text-white cursor-pointer hover:shadow-brutal-sm hover:-translate-x-0.25 hover:-translate-y-0.25 active:translate-x-0.25 active:translate-y-0.25 active:shadow-none transition-all whitespace-nowrap" data-action="use" data-id="${variant.id}">Use in Chat</button>`
        }
          <button class="font-body text-xs font-semibold px-3 py-1 border-[1.5px] border-danger rounded-full bg-paper hover:bg-danger text-danger hover:text-white cursor-pointer hover:shadow-brutal-sm hover:-translate-x-0.25 hover:-translate-y-0.25 active:translate-x-0.25 active:translate-y-0.25 active:shadow-none transition-all whitespace-nowrap" data-action="delete" data-id="${variant.id}" title="Delete from cache">Delete</button>
        </div>
      `;
    } else if (isUnsupported) {
      actionsHtml = `
        <div class="text-xs text-ink-muted">Requires WebGPU FP16 shaders</div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button class="font-body text-xs font-semibold px-3 py-1 border-[1.5px] border-ink-muted rounded-full bg-paper-alt text-ink-muted cursor-not-allowed whitespace-nowrap" disabled title="This model requires 16-bit WebGPU float shaders (shader-f16)">Unsupported</button>
        </div>
      `;
    } else {
      actionsHtml = `
        <div class="text-xs text-ink-muted">Ready to download</div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button class="font-body text-xs font-semibold px-3 py-1 border-[1.5px] border-ink rounded-full bg-accent-teal hover:bg-accent-teal-hover text-white cursor-pointer hover:shadow-brutal-sm hover:-translate-x-0.25 hover:-translate-y-0.25 active:translate-x-0.25 active:translate-y-0.25 active:shadow-none disabled:opacity-45 disabled:cursor-not-allowed transition-all whitespace-nowrap" data-action="download" data-id="${variant.id}" ${isLoading ? 'disabled' : ''}>Download</button>
        </div>
      `;
    }

    const dotColor = PROVIDER_COLORS[variant.provider] || '#888';

    card.innerHTML = `
      <div class="flex justify-between items-start gap-2.5">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-ink-soft uppercase">
            <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${dotColor}"></span>
            ${variant.providerLabel}
          </span>
          <span class="font-body text-sm font-bold text-ink">${variant.name}</span>
          <span class="text-[11px] font-semibold px-1.5 py-0.25 rounded-full bg-paper-alt border border-ink text-ink-soft">${variant.note}</span>
        </div>
        <span class="font-mono text-xs text-ink-muted whitespace-nowrap flex items-center gap-1.5">
          ${variant.size}
          <span class="text-[10px] uppercase font-mono px-1 py-0.2 rounded border border-ink/30 bg-paper-alt text-ink-soft">${variant.precision}</span>
        </span>
      </div>
      <div class="flex items-center justify-between gap-2 mt-0.5">
        ${actionsHtml}
      </div>
    `;

    card.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        if (onAction) onAction(action, id);
      });
    });

    modelCardGrid.appendChild(card);
  });
}
