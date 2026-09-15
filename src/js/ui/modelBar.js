//! ==========================================================================
//! Model Pill Bar
//! ==========================================================================

import { getAllModelVariants } from '../models.js';

const modelBar = document.getElementById('modelBar');
const modelVariantsContainer = document.getElementById('modelVariants');

const PROVIDER_COLORS = {
  meta: '#1877F2',
  google: '#EA4335',
  alibaba: '#FF6A00',
  microsoft: '#00A4EF',
  mistral: '#7C3AED',
  huggingface: '#FFD21E',
  allenai: '#00C49A',
};

export function renderModelBar({
  downloadedModelIds,
  activeModelId,
  isEngineReady,
  isLoading,
  hasF16,
  onSelectModel,
  onOpenLibrary,
}) {
  if (!modelBar) return;
  modelBar.innerHTML = '';
  if (modelVariantsContainer) {
    modelVariantsContainer.classList.remove('open');
    modelVariantsContainer.innerHTML = '';
  }

  const allVariants = getAllModelVariants(hasF16);
  const downloadedList = allVariants.filter(v => downloadedModelIds.has(v.id));

  if (downloadedList.length === 0) {
    const emptyContainer = document.createElement('div');
    emptyContainer.className = 'flex items-center justify-between w-full gap-3';
    emptyContainer.innerHTML = `
      <span class="font-hand text-base text-ink-soft whitespace-nowrap">No models downloaded yet</span>
      <button type="button" class="btn-open-library inline-flex items-center gap-1 font-body text-xs font-semibold px-3 py-1 border-[1.5px] border-ink rounded-full bg-accent-indigo text-white cursor-pointer hover:shadow-brutal-sm hover:-translate-x-0.25 hover:-translate-y-0.25 active:translate-x-0.25 active:translate-y-0.25 active:shadow-none transition-all shrink-0">
        Open Model Library &rarr;
      </button>
    `;
    emptyContainer.querySelector('.btn-open-library').addEventListener('click', () => {
      onOpenLibrary();
    });
    modelBar.appendChild(emptyContainer);
    return;
  }

  // Render pills for downloaded models
  downloadedList.forEach(variant => {
    const pill = document.createElement('button');
    pill.type = 'button';
    const isActive = (variant.id === activeModelId);

    pill.className = isActive
      ? 'model-pill inline-flex items-center gap-1.5 font-body text-xs font-semibold px-3.5 py-1.5 border-[1.5px] border-ink rounded-full bg-accent-amber text-ink shadow-brutal-sm cursor-pointer whitespace-nowrap shrink-0 transition-all'
      : 'model-pill inline-flex items-center gap-1.5 font-body text-xs font-medium px-3.5 py-1.5 border-[1.5px] border-ink rounded-full bg-paper text-ink cursor-pointer whitespace-nowrap hover:shadow-brutal-sm hover:-translate-x-0.25 hover:-translate-y-0.25 active:shadow-none active:translate-x-0.25 active:translate-y-0.25 shrink-0 transition-all';

    const dotColor = PROVIDER_COLORS[variant.provider] || '#888';
    pill.innerHTML = `
      <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background-color: ${dotColor}"></span>
      <span>${variant.providerLabel} · ${variant.name}</span>
    `;

    pill.addEventListener('click', () => {
      if (variant.id === activeModelId && isEngineReady) return;
      if (isLoading) return;
      onSelectModel(variant.id);
    });

    modelBar.appendChild(pill);
  });

  // Append "+ Library" button (Accent 3: Electric Indigo)
  const manageBtn = document.createElement('button');
  manageBtn.type = 'button';
  manageBtn.className = 'pill-add-model inline-flex items-center gap-1 font-body text-xs font-semibold px-3 py-1.5 border-[1.5px] border-ink rounded-full bg-accent-indigo text-white cursor-pointer hover:shadow-brutal-sm hover:-translate-x-0.25 hover:-translate-y-0.25 active:shadow-none active:translate-x-0.25 active:translate-y-0.25 transition-all whitespace-nowrap shrink-0';
  manageBtn.innerHTML = `+ Library`;
  manageBtn.title = 'Open Model Library to download or manage models';
  manageBtn.addEventListener('click', () => {
    onOpenLibrary();
  });
  modelBar.appendChild(manageBtn);
}

export function setModelPillsDisabled(disabled) {
  if (!modelBar) return;
  modelBar.querySelectorAll('.model-pill, .pill-add-model, .btn-open-library').forEach(btn => {
    btn.disabled = disabled;
    btn.style.opacity = disabled ? '0.5' : '';
    btn.style.pointerEvents = disabled ? 'none' : '';
  });
}
