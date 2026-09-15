//! ==========================================================================
//! Local WebLLM Chat — App Orchestrator
//! ==========================================================================

import {
  DEFAULT_MODEL_ID,
  findModelVariant,
  getAllModelVariants,
  resolveModelId,
  getDefaultModelId,
  setWebGPUPresence,
} from './js/models.js';
import { initTheme, toggleTheme } from './js/theme.js';
import { escapeHtml, formatMessageContent } from './js/utils.js';
import {
  detectWebGPUSupport,
  checkWebGPU,
  checkCachedModels,
  deleteModelCache,
  loadEngine,
  getEngineInstance,
  stopCurrentGeneration,
} from './js/engine.js';
import {
  createMessageBubble,
  scrollChatToBottom,
  clearChatUI,
  showWelcomeState,
  hideWelcomeState,
  initChatInteractions,
} from './js/ui/chatView.js';
import { renderModelBar, setModelPillsDisabled } from './js/ui/modelBar.js';
import {
  initModelLibraryDialog,
  openModelLibrary,
  closeModelLibrary,
  renderModelLibrary,
} from './js/ui/modelLibrary.js';
import { initErrorBanner, showErrorBanner, hideErrorBanner } from './js/ui/errorBanner.js';

//* ── DOM Elements ──
const statusChip = document.getElementById('statusChip');
const statusChipText = document.getElementById('statusChipText');
const speedBadge = document.getElementById('speedBadge');
const progressBar = document.getElementById('progressBar');
const statusText = document.getElementById('statusText');
const chatMessages = document.getElementById('chatMessages');
const welcomeCard = document.getElementById('welcomeCard');
const welcomeStatus = document.getElementById('welcomeStatus');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const stopButton = document.getElementById('stopButton');
const clearButton = document.getElementById('clearButton');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const systemPromptToggle = document.getElementById('systemPromptToggle');
const systemPromptDialog = document.getElementById('systemPromptDialog');
const dialogClose = document.getElementById('dialogClose');
const systemPromptInput = document.getElementById('systemPromptInput');
const savePromptButton = document.getElementById('savePromptButton');

//* ── State ──
let gpuState = { supported: false, hasF16: false, adapterName: '' };
let isGenerating = false;
let isEngineReady = false;
let isLoading = false;
let activeModelId = null;
let downloadingModelId = null;
let failedModelId = null;
let lastErrorMessage = '';
let downloadedModelIds = new Set();
let incompatibleModelIds = new Set();
let hasMessages = false;

let systemPrompt = "You are a helpful and concise AI assistant running locally inside the user's browser.";
let messageList = [{ role: 'system', content: systemPrompt }];

//* ── UI Refresh Helpers ──
function refreshModelUI() {
  renderModelBar({
    downloadedModelIds,
    activeModelId,
    isEngineReady,
    isLoading,
    hasF16: gpuState.hasF16,
    onSelectModel: (id) => selectModel(id),
    onOpenLibrary: () => openModelLibrary(),
  });

  renderModelLibrary({
    downloadedModelIds,
    incompatibleModelIds,
    downloadingModelId,
    failedModelId,
    activeModelId,
    isEngineReady,
    isLoading,
    gpuState,
    onAction: (action, id) => handleModelAction(action, id),
  });
}

function updateProgress(report, modelId) {
  const percentage = Math.round((report.progress || 0) * 100);
  progressBar.style.width = `${percentage}%`;
  statusText.textContent = report.text || `Loading: ${percentage}%`;

  if (modelId) {
    const cardFill = document.getElementById(`cardProgressFill-${modelId}`);
    const cardText = document.getElementById(`cardProgressText-${modelId}`);
    if (cardFill) cardFill.style.width = `${percentage}%`;
    if (cardText) cardText.textContent = report.text || `Downloading: ${percentage}%`;
  }
}

// * ── Model Engine Management ──
async function initEngine(modelId) {
  if (isLoading) return;
  isLoading = true;

  const effectiveId = resolveModelId(modelId, gpuState.hasF16);
  const variant = findModelVariant(effectiveId);
  const displayName = variant ? `${variant.providerLabel} ${variant.name}` : effectiveId;

  // Validation: ensure model is compatible with this GPU
  if (!gpuState.hasF16 && variant && !variant.f32Id && variant.f16Id === effectiveId) {
    const errText = `${displayName} requires 16-bit WebGPU float shaders (shader-f16), which are unsupported on this GPU. Please select an FP32 model.`;
    showErrorBanner(errText);
    statusText.textContent = 'Unsupported model';
    statusChipText.textContent = 'Error';
    statusChip.classList.add('error');
    isLoading = false;
    setModelPillsDisabled(false);
    return;
  }

  try {
    isEngineReady = false;
    sendButton.disabled = true;
    setModelPillsDisabled(true);
    progressBar.style.width = '0%';
    progressBar.classList.add('downloading-stripes');
    statusText.textContent = `Downloading & loading ${displayName}...`;
    statusChipText.textContent = 'Loading';
    statusChip.classList.remove('error');
    if (welcomeStatus) {
      welcomeStatus.textContent = `Loading ${displayName}...`;
    }

    await loadEngine(effectiveId, (report) => updateProgress(report, effectiveId), gpuState.hasF16);

    // Success
    isEngineReady = true;
    activeModelId = effectiveId;
    downloadingModelId = null;
    failedModelId = null;
    lastErrorMessage = '';
    downloadedModelIds.add(effectiveId);

    sendButton.disabled = false;
    progressBar.style.width = '100%';
    progressBar.classList.remove('downloading-stripes');
    statusText.textContent = 'Ready';
    statusChipText.textContent = gpuState.hasF16 ? 'Ready (FP16)' : 'Ready (FP32)';
    if (welcomeStatus) {
      welcomeStatus.textContent = `Ready with ${displayName}.`;
    }
    hideErrorBanner();

    refreshModelUI();
    messageInput.focus();
  } catch (error) {
    const rawMsg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
    console.error('[WebLLM] Engine error:', error);

    downloadingModelId = null;
    failedModelId = effectiveId;
    lastErrorMessage = rawMsg;
    isEngineReady = false;

    let friendlyMsg = rawMsg;
    if (rawMsg.includes("extension 'f16' is not allowed") || rawMsg.includes('Invalid ShaderModule')) {
      friendlyMsg = `${displayName} failed WebGPU shader validation: your GPU does not support 16-bit float shaders (shader-f16). Please switch to an FP32 model variant.`;
    }

    statusText.textContent = 'Failed: ' + friendlyMsg;
    statusChipText.textContent = 'Error';
    statusChip.classList.add('error');
    progressBar.classList.remove('downloading-stripes');

    showErrorBanner(`Failed to load ${displayName}: ${friendlyMsg}`);

    // If chat has an assistant bubble loading, display error and retry button
    const lastBubble = chatMessages.querySelector('.message.assistant:last-child .bubble');
    if (lastBubble && hasMessages) {
      lastBubble.innerHTML = `
        <div class="p-1">
          <p class="text-danger font-semibold mb-1.5">Failed to load ${escapeHtml(displayName)}</p>
          <p class="text-xs mb-2.5 font-mono text-ink-muted">${escapeHtml(friendlyMsg)}</p>
          <button type="button" class="font-body text-xs font-semibold px-3 py-1 border-[1.5px] border-ink rounded-full bg-accent-amber text-ink cursor-pointer hover:shadow-brutal-sm hover:-translate-x-0.25 hover:-translate-y-0.25 active:translate-x-0.25 active:translate-y-0.25 active:shadow-none transition-all" onclick="window.retryActiveDownload()">Retry Download</button>
        </div>
      `;
    }

    refreshModelUI();
  } finally {
    isLoading = false;
    setModelPillsDisabled(false);
  }
}

function selectModel(modelId) {
  const effectiveId = resolveModelId(modelId, gpuState.hasF16);
  activeModelId = effectiveId;

  // Reset chat on model switch
  messageList = [{ role: 'system', content: systemPrompt }];
  clearChatUI();
  hasMessages = true;
  welcomeCard.style.display = 'none';

  const variant = findModelVariant(effectiveId);
  const name = variant ? `${variant.providerLabel} ${variant.name}` : effectiveId;
  createMessageBubble('assistant', `Loading ${name}...`);

  refreshModelUI();
  initEngine(effectiveId);
}

function startModelDownload(modelId) {
  if (isLoading) return;
  const effectiveId = resolveModelId(modelId, gpuState.hasF16);
  downloadingModelId = effectiveId;
  failedModelId = null;
  lastErrorMessage = '';
  hideErrorBanner();

  refreshModelUI();
  initEngine(effectiveId);
}

function retryDownload(modelId) {
  const targetId = modelId || failedModelId || activeModelId || getDefaultModelId(gpuState.hasF16);
  hideErrorBanner();
  startModelDownload(targetId);
}

window.retryActiveDownload = () => {
  retryDownload(failedModelId);
};

async function handleModelAction(action, modelId) {
  if (action === 'download' || action === 'retry') {
    startModelDownload(modelId);
  } else if (action === 'use') {
    closeModelLibrary();
    selectModel(modelId);
  } else if (action === 'delete' || action === 'delete-incompatible') {
    await handleDeleteModel(modelId);
  }
}

async function handleDeleteModel(modelId) {
  const variant = findModelVariant(modelId);
  const name = variant ? `${variant.providerLabel} ${variant.name}` : modelId;
  const confirmed = confirm(`Delete ${name} from local cache? This will free browser storage space.`);
  if (!confirmed) return;

  try {
    statusText.textContent = `Deleting ${name} from cache...`;
    await deleteModelCache(modelId);
    downloadedModelIds.delete(modelId);
    incompatibleModelIds.delete(modelId);

    if (activeModelId === modelId) {
      activeModelId = null;
      isEngineReady = false;
      sendButton.disabled = true;
    }

    statusText.textContent = `Deleted ${name}.`;
    await syncCachedModels();
  } catch (err) {
    console.error(`[WebLLM] Error deleting ${modelId}:`, err);
    alert('Failed to delete model from cache: ' + (err?.message || err));
  }
}

async function syncCachedModels() {
  const { compatibleCached, incompatibleCached } = await checkCachedModels(gpuState.hasF16);
  downloadedModelIds = compatibleCached;
  incompatibleModelIds = incompatibleCached;
  refreshModelUI();

  if (incompatibleModelIds.size > 0 && downloadedModelIds.size === 0) {
    showErrorBanner(
      `Found previously cached model(s) that require 16-bit WebGPU shaders (shader-f16). Your GPU only supports FP32. Open the Model Library to delete them and download the compatible FP32 version.`
    );
  }

  if (!activeModelId && downloadedModelIds.size > 0) {
    const allVariants = getAllModelVariants(gpuState.hasF16);
    const firstDownloaded = allVariants.find((v) => downloadedModelIds.has(v.id));
    if (firstDownloaded) {
      selectModel(firstDownloaded.id);
    }
  } else if (downloadedModelIds.size === 0) {
    statusChipText.textContent = gpuState.hasF16 ? 'WebGPU (FP16)' : 'WebGPU (FP32)';
    statusText.textContent = 'No local models downloaded yet. Click "Model Library" to download.';
    if (welcomeStatus) {
      welcomeStatus.textContent = 'No models downloaded yet. Use the Model Library to download a model.';
    }
  }
}

//* ── Chat Generation Flow ──
function setGeneratingState(generating) {
  isGenerating = generating;
  sendButton.style.display = generating ? 'none' : 'inline-flex';
  stopButton.style.display = generating ? 'inline-flex' : 'none';
  messageInput.disabled = generating;

  if (generating) {
    speedBadge.style.display = 'inline-flex';
    speedBadge.textContent = '...';
    statusChipText.textContent = 'Generating';
  } else {
    statusChipText.textContent = 'Ready';
  }
}

async function handleStopGeneration() {
  if (isGenerating) {
    statusText.textContent = 'Stopping...';
    await stopCurrentGeneration();
    isGenerating = false;
    setGeneratingState(false);
  }
}

chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const userText = messageInput.value.trim();
  if (!userText) return;

  if (!isEngineReady) {
    if (downloadedModelIds.size === 0) {
      openModelLibrary();
      return;
    }
    if (activeModelId && !isLoading) {
      selectModel(activeModelId);
      return;
    }
    return;
  }

  if (isGenerating) return;

  hideWelcomeState();
  messageInput.value = '';

  createMessageBubble('user', userText);
  messageList.push({ role: 'user', content: userText });

  setGeneratingState(true);
  statusText.textContent = 'Thinking...';

  const assistantBubble = createMessageBubble('assistant', '');
  let fullResponse = '';
  let tokenCount = 0;
  const startTime = performance.now();

  try {
    const engine = getEngineInstance();
    const completionStream = await engine.chat.completions.create({
      messages: messageList,
      stream: true,
    });

    for await (const chunk of completionStream) {
      if (!isGenerating) break;

      const token = chunk.choices[0]?.delta?.content || '';
      fullResponse += token;
      tokenCount++;

      const elapsedSeconds = (performance.now() - startTime) / 1000;
      if (elapsedSeconds > 0.5) {
        const tokensPerSec = Math.round(tokenCount / elapsedSeconds);
        speedBadge.textContent = `${tokensPerSec} tok/s`;
      }

      assistantBubble.innerHTML = formatMessageContent(fullResponse);
      scrollChatToBottom();
    }

    if (fullResponse.trim()) {
      messageList.push({ role: 'assistant', content: fullResponse });
    }
    statusText.textContent = 'Ready';
  } catch (error) {
    console.error('[WebLLM] Chat error:', error);
    assistantBubble.innerHTML = formatMessageContent('Error: ' + error.message);
    statusText.textContent = 'Generation error';
  } finally {
    setGeneratingState(false);
  }
});

//* ── Event Listeners ──
messageInput.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 140) + 'px';
});

messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
  }
});

stopButton.addEventListener('click', handleStopGeneration);

clearButton.addEventListener('click', () => {
  messageList = [{ role: 'system', content: systemPrompt }];
  clearChatUI();
  speedBadge.style.display = 'none';
  showWelcomeState();
  messageInput.focus();
});

themeToggle.addEventListener('click', () => toggleTheme(themeIcon));

systemPromptToggle.addEventListener('click', () => systemPromptDialog.showModal());
dialogClose.addEventListener('click', () => systemPromptDialog.close());
systemPromptDialog.addEventListener('click', (event) => {
  if (event.target === systemPromptDialog) systemPromptDialog.close();
});

savePromptButton.addEventListener('click', () => {
  const newPrompt = systemPromptInput.value.trim();
  if (newPrompt) {
    systemPrompt = newPrompt;
    messageList[0] = { role: 'system', content: systemPrompt };
    systemPromptDialog.close();
    statusText.textContent = 'Instructions updated.';
  }
});

//* ── Boot ──
initTheme(themeIcon);
initErrorBanner(() => retryDownload(failedModelId));
initModelLibraryDialog({
  onOpen: () => {
    refreshModelUI();
    openModelLibrary();
  },
  onClose: () => closeModelLibrary(),
});
initChatInteractions((prompt) => {
  if (!isEngineReady) {
    if (downloadedModelIds.size === 0) openModelLibrary();
    return;
  }
  messageInput.value = prompt;
  chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
});

async function bootApp() {
  const gpu = await detectWebGPUSupport();
  gpuState = gpu;
  setWebGPUPresence(gpu.hasF16);

  if (!gpu.supported) {
    statusChip.classList.add('error');
    statusChipText.textContent = 'No WebGPU';
    statusText.textContent = gpu.error || 'WebGPU not detected. Use Chrome 113+, Edge, or Brave.';
    showErrorBanner(gpu.error || 'WebGPU not detected. Please enable WebGPU in your browser settings.');
  } else {
    statusChipText.textContent = gpu.hasF16 ? 'WebGPU (FP16)' : 'WebGPU (FP32)';
    statusChip.title = `WebGPU on ${gpu.adapterName} · ${gpu.hasF16 ? 'Shader FP16 enabled' : 'FP32 mode (Shader FP16 unsupported)'}`;
    await syncCachedModels();
  }
}

bootApp();
