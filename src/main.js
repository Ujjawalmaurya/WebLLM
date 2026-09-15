//! ==========================================================================
//! Local WebLLM Chat — Notebook UI
//! ==========================================================================

import { CreateWebWorkerMLCEngine } from '@mlc-ai/web-llm';

//* ── Model Registry ──
// Each provider has a name, brand dot colour, and list of model variants.
const MODEL_REGISTRY = [
  {
    provider: 'meta',
    label: 'Llama 3.2',
    variants: [
      { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', name: '1B', size: '~880 MB', note: 'Fast' },
      { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', name: '3B', size: '~2.2 GB', note: 'Quality' },
    ],
  },
  {
    provider: 'google',
    label: 'Gemma',
    variants: [
      { id: 'gemma3-1b-it-q4f16_1-MLC', name: 'Gemma 3 · 1B', size: '~710 MB', note: 'Light' },
      { id: 'gemma-2-2b-it-q4f16_1-MLC', name: 'Gemma 2 · 2B', size: '~1.9 GB', note: 'Reasoning' },
    ],
  },
  {
    provider: 'alibaba',
    label: 'Qwen 2.5',
    variants: [
      { id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', name: '0.5B', size: '~350 MB', note: 'Tiny' },
      { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', name: '1.5B', size: '~1.6 GB', note: 'Chat' },
      { id: 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC', name: 'Coder 1.5B', size: '~1.6 GB', note: 'Code' },
    ],
  },
  {
    provider: 'microsoft',
    label: 'Phi 3.5',
    variants: [
      { id: 'Phi-3.5-mini-instruct-q4f16_1-MLC', name: 'Mini · 3.8B', size: '~3.6 GB', note: 'Reasoning' },
    ],
  },
  {
    provider: 'mistral',
    label: 'Ministral 3',
    variants: [
      { id: 'Ministral-3-3B-Instruct-2512-BF16-q4f16_1-MLC', name: '3B', size: '~2.8 GB', note: 'Compact' },
    ],
  },
  {
    provider: 'huggingface',
    label: 'SmolLM2',
    variants: [
      { id: 'SmolLM2-360M-Instruct-q4f16_1-MLC', name: '360M', size: '~370 MB', note: 'Tiny' },
      { id: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC', name: '1.7B', size: '~1.7 GB', note: 'Balanced' },
    ],
  },
  {
    provider: 'allenai',
    label: 'OLMo 2',
    variants: [
      { id: 'OLMo-2-0425-1B-Instruct-q4f16_1-MLC', name: '1B', size: '~1.7 GB', note: 'Open' },
    ],
  },
];

const DEFAULT_MODEL_ID = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';

//* ── DOM References ──
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
const modelBar = document.getElementById('modelBar');
const modelVariantsContainer = document.getElementById('modelVariants');

//* ── State ──
let engine = null;
let isGenerating = false;
let isEngineReady = false;
let activeModelId = DEFAULT_MODEL_ID;
let activeProviderIndex = 0;
let hasMessages = false;

let systemPrompt = 'You are a helpful and concise AI assistant running locally inside the user\'s browser.';
let messageList = [
  { role: 'system', content: systemPrompt },
];

//* ── Theme ──
function initTheme() {
  const stored = localStorage.getItem('webllm-theme');
  if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
  updateThemeIcon();
}

function toggleTheme() {
  document.documentElement.classList.toggle('dark');
  const isDark = document.documentElement.classList.contains('dark');
  localStorage.setItem('webllm-theme', isDark ? 'dark' : 'light');
  updateThemeIcon();
}

function updateThemeIcon() {
  const isDark = document.documentElement.classList.contains('dark');
  // Moon for dark mode, sun for light mode
  if (isDark) {
    themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  } else {
    themeIcon.innerHTML = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>';
  }
}

themeToggle.addEventListener('click', toggleTheme);

//* ── Model Pill Bar ──
function buildModelBar() {
  modelBar.innerHTML = '';

  MODEL_REGISTRY.forEach((group, index) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'model-pill';
    pill.dataset.provider = group.provider;
    pill.dataset.index = index;
    pill.textContent = group.label;

    // Highlight if this provider contains the active model
    if (group.variants.some(v => v.id === activeModelId)) {
      pill.classList.add('active');
      activeProviderIndex = index;
    }

    pill.addEventListener('click', () => handleProviderClick(index));
    modelBar.appendChild(pill);
  });

  // Show variants for the initial active provider
  showVariants(activeProviderIndex);
}

function handleProviderClick(index) {
  // Toggle: if same provider, just close. If different, switch.
  if (index === activeProviderIndex && modelVariantsContainer.classList.contains('open')) {
    modelVariantsContainer.classList.remove('open');
    return;
  }
  activeProviderIndex = index;
  showVariants(index);
}

function showVariants(index) {
  const group = MODEL_REGISTRY[index];
  modelVariantsContainer.innerHTML = '';
  modelVariantsContainer.classList.add('open');

  group.variants.forEach(variant => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'variant-pill';
    if (variant.id === activeModelId) pill.classList.add('active');

    pill.innerHTML = `${variant.name} <span class="variant-size">${variant.size}</span>`;

    pill.addEventListener('click', () => {
      if (variant.id === activeModelId) return;
      selectModel(variant.id, index);
    });

    modelVariantsContainer.appendChild(pill);
  });
}

function selectModel(modelId, providerIndex) {
  activeModelId = modelId;
  activeProviderIndex = providerIndex;

  // Reset chat on model switch
  messageList = [{ role: 'system', content: systemPrompt }];
  clearChatUI();
  hasMessages = true; // Show the "switching" message, not welcome card
  welcomeCard.style.display = 'none';
  createMessageBubble('assistant', `Loading model...`);

  // Update pill highlights
  updatePillHighlights();
  showVariants(providerIndex);

  initEngine(modelId);
}

function updatePillHighlights() {
  modelBar.querySelectorAll('.model-pill').forEach(pill => {
    const idx = parseInt(pill.dataset.index);
    const group = MODEL_REGISTRY[idx];
    if (group.variants.some(v => v.id === activeModelId)) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });
}

//* ── WebGPU Check ──
function checkWebGPU() {
  if (!navigator.gpu) {
    console.warn('[WebLLM] WebGPU not supported.');
    statusChip.classList.add('error');
    statusChipText.textContent = 'No WebGPU';
    statusText.textContent = 'WebGPU not detected. Use Chrome 113+, Edge, or Brave.';
    return false;
  }
  statusChipText.textContent = 'WebGPU OK';
  return true;
}

//* ── Engine Init ──
async function initEngine(modelId) {
  try {
    isEngineReady = false;
    sendButton.disabled = true;
    progressBar.style.width = '0%';
    progressBar.classList.add('downloading');
    statusText.textContent = 'Preparing model download...';
    statusChipText.textContent = 'Loading';

    if (!engine) {
      const worker = new Worker(new URL('./worker.js', import.meta.url), {
        type: 'module',
      });
      engine = await CreateWebWorkerMLCEngine(worker, modelId, {
        initProgressCallback: handleProgress,
      });
    } else {
      await engine.reload(modelId, {
        initProgressCallback: handleProgress,
      });
    }

    isEngineReady = true;
    sendButton.disabled = false;
    progressBar.style.width = '100%';
    progressBar.classList.remove('downloading');
    statusText.textContent = 'Ready';
    statusChipText.textContent = 'Ready';
    messageInput.focus();
  } catch (error) {
    statusText.textContent = 'Failed: ' + error.message;
    statusChipText.textContent = 'Error';
    statusChip.classList.add('error');
    progressBar.classList.remove('downloading');
    console.error('[WebLLM] Engine error:', error);
  }
}

function handleProgress(report) {
  const percentage = Math.round((report.progress || 0) * 100);
  progressBar.style.width = `${percentage}%`;
  statusText.textContent = report.text || `Loading: ${percentage}%`;
}

//* ── HTML Escaping ──
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

//* ── Markdown Rendering ──
function formatMessageContent(rawText) {
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let formatted = rawText;

  formatted = formatted.replace(codeBlockRegex, (match, language, code) => {
    const langLabel = language || 'code';
    const escapedCode = escapeHtml(code.trim());
    return `
      <div class="code-block">
        <div class="code-header">
          <span>${langLabel}</span>
          <button class="copy-code-btn" type="button" data-code="${encodeURIComponent(code.trim())}">Copy</button>
        </div>
        <pre><code>${escapedCode}</code></pre>
      </div>
    `;
  });

  formatted = formatted.replace(/`([^`]+)`/g, (match, inlineCode) => {
    return `<code class="inline-code">${escapeHtml(inlineCode)}</code>`;
  });

  formatted = formatted.replace(/\n/g, '<br>');
  return formatted;
}

//* ── Chat Bubbles ──
function createMessageBubble(role, initialText = '') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;

  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = 'bubble';
  bubbleDiv.innerHTML = formatMessageContent(initialText);

  messageDiv.appendChild(bubbleDiv);
  chatMessages.appendChild(messageDiv);
  scrollChatToBottom(true);

  return bubbleDiv;
}

function scrollChatToBottom(force = false) {
  const isNearBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 120;
  if (force || isNearBottom) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

function clearChatUI() {
  // Remove everything except the welcome card
  const children = Array.from(chatMessages.children);
  children.forEach(child => {
    if (child.id !== 'welcomeCard') {
      chatMessages.removeChild(child);
    }
  });
}

//* ── Welcome State ──
function showWelcomeState() {
  welcomeCard.style.display = 'flex';
  hasMessages = false;
}

function hideWelcomeState() {
  welcomeCard.style.display = 'none';
  hasMessages = true;
}

//* ── Suggestion Chips ──
document.querySelectorAll('.suggestion-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const prompt = chip.dataset.prompt;
    if (!prompt || !isEngineReady) return;
    messageInput.value = prompt;
    chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
  });
});

//* ── Copy Code Handler ──
chatMessages.addEventListener('click', (event) => {
  if (event.target.classList.contains('copy-code-btn')) {
    const button = event.target;
    const rawCode = decodeURIComponent(button.getAttribute('data-code') || '');
    navigator.clipboard.writeText(rawCode).then(() => {
      button.textContent = 'Copied!';
      setTimeout(() => { button.textContent = 'Copy'; }, 1800);
    });
  }
});

//* ── System Prompt Dialog ──
systemPromptToggle.addEventListener('click', () => {
  systemPromptDialog.showModal();
});

dialogClose.addEventListener('click', () => {
  systemPromptDialog.close();
});

// Close on backdrop click
systemPromptDialog.addEventListener('click', (event) => {
  if (event.target === systemPromptDialog) {
    systemPromptDialog.close();
  }
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

//* ── Clear Chat ──
clearButton.addEventListener('click', () => {
  messageList = [{ role: 'system', content: systemPrompt }];
  clearChatUI();
  speedBadge.style.display = 'none';
  showWelcomeState();
  messageInput.focus();
});

//* ── Stop Generation ──
async function stopGeneration() {
  if (engine && isGenerating) {
    statusText.textContent = 'Stopping...';
    await engine.interruptGenerate();
    isGenerating = false;
    setGeneratingState(false);
  }
}

stopButton.addEventListener('click', stopGeneration);

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && isGenerating) {
    stopGeneration();
  }
});

//* ── UI State Toggle ──
function setGeneratingState(generating) {
  isGenerating = generating;
  if (generating) {
    sendButton.style.display = 'none';
    stopButton.style.display = 'inline-flex';
    speedBadge.style.display = 'inline-block';
  } else {
    sendButton.style.display = 'inline-flex';
    stopButton.style.display = 'none';
    sendButton.disabled = !isEngineReady;
    messageInput.focus();
  }
}

//* ── Textarea Auto-Resize ──
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

//* ── Send Message ──
chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const userText = messageInput.value.trim();
  if (!userText || !isEngineReady || isGenerating) return;

  // Hide welcome card on first message
  if (!hasMessages) {
    hideWelcomeState();
  }

  messageInput.value = '';
  messageInput.style.height = 'auto';

  createMessageBubble('user', userText);
  messageList.push({ role: 'user', content: userText });

  setGeneratingState(true);
  statusText.textContent = 'Thinking...';

  const assistantBubble = createMessageBubble('assistant', '');
  let fullResponse = '';
  let tokenCount = 0;
  const startTime = performance.now();

  try {
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

//* ── Boot ──
initTheme();
buildModelBar();
checkWebGPU();
initEngine(DEFAULT_MODEL_ID);
