//! ==========================================================================
//! Local WebLLM Chat - Phase 4: Full UI, Code Blocks, and Test Prints
//! ==========================================================================

import { CreateWebWorkerMLCEngine } from '@mlc-ai/web-llm';

//* UI Elements
const webgpuBanner = document.getElementById('webgpuBanner');
const modelSelect = document.getElementById('modelSelect');
const clearButton = document.getElementById('clearButton');
const systemPromptToggle = document.getElementById('systemPromptToggle');
const systemPromptDrawer = document.getElementById('systemPromptDrawer');
const systemPromptInput = document.getElementById('systemPromptInput');
const savePromptButton = document.getElementById('savePromptButton');
const progressBar = document.getElementById('progressBar');
const statusText = document.getElementById('statusText');
const speedBadge = document.getElementById('speedBadge');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const stopButton = document.getElementById('stopButton');

let engine = null;
let isGenerating = false;
let isEngineReady = false;

//* System instructions and chat history
let systemPrompt = 'You are a helpful and concise AI assistant running locally inside the user\'s browser.';
let messageList = [
  { role: 'system', content: systemPrompt }
];

//! Check WebGPU Availability
function checkWebGPU() {
  console.log('[WebLLM Test] Checking WebGPU browser support...');
  if (!navigator.gpu) {
    console.warn('[WebLLM Test] WebGPU is NOT supported or disabled in this browser.');
    webgpuBanner.style.display = 'block';
    statusText.textContent = 'WebGPU not detected. Please use a compatible browser.';
    return false;
  }
  console.log('[WebLLM Test] WebGPU is supported and available.');
  webgpuBanner.style.display = 'none';
  return true;
}

//! Initialise Background Worker & Engine
async function initEngine(modelId) {
  console.log(`[WebLLM Test] initEngine() called for model: ${modelId}`);
  try {
    isEngineReady = false;
    sendButton.disabled = true;
    modelSelect.disabled = true;
    progressBar.style.width = '0%';
    statusText.textContent = 'Preparing model download...';

    //? Reuse existing engine or create a fresh worker engine
    if (!engine) {
      console.log('[WebLLM Test] Creating fresh Web Worker and engine...');
      const worker = new Worker(new URL('./worker.js', import.meta.url), {
        type: 'module'
      });

      engine = await CreateWebWorkerMLCEngine(worker, modelId, {
        initProgressCallback: handleProgress
      });
      console.log('[WebLLM Test] Web Worker engine created successfully.');
    } else {
      console.log(`[WebLLM Test] Reloading existing engine with new model: ${modelId}...`);
      await engine.reload(modelId, {
        initProgressCallback: handleProgress
      });
      console.log('[WebLLM Test] Model reload finished.');
    }

    isEngineReady = true;
    modelSelect.disabled = false;
    sendButton.disabled = false;
    progressBar.style.width = '100%';
    statusText.textContent = 'Model ready to chat.';
    console.log('[WebLLM Test] Engine is now ready for user queries.');
  } catch (error) {
    statusText.textContent = 'Failed to load model: ' + error.message;
    modelSelect.disabled = false;
    console.error('[WebLLM Test] Error loading model:', error);
  }
}

//! Progress Callback Handler
function handleProgress(report) {
  const percentage = Math.round((report.progress || 0) * 100);
  progressBar.style.width = `${percentage}%`;
  statusText.textContent = report.text || `Loading: ${percentage}%`;
  
  if (percentage === 100 || percentage % 25 === 0) {
    console.log(`[WebLLM Test] Download progress: ${percentage}% - ${report.text}`);
  }
}

//! Escape Raw HTML for Safety
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

//! Render Text with Markdown Code Blocks
function formatMessageContent(rawText) {
  //? Check for code blocks ```language ... ```
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

  //? Check for inline code `code`
  formatted = formatted.replace(/`([^`]+)`/g, (match, inlineCode) => {
    return `<code class="inline-code">${escapeHtml(inlineCode)}</code>`;
  });

  //? Convert newlines outside code blocks to line breaks
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
}

//! Add Message Bubble to UI
function createMessageBubble(role, initialText = '') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;

  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = 'bubble';
  bubbleDiv.innerHTML = formatMessageContent(initialText);

  messageDiv.appendChild(bubbleDiv);
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return bubbleDiv;
}

//! Attach Copy Handler for Code Snippets
chatMessages.addEventListener('click', (event) => {
  if (event.target.classList.contains('copy-code-btn')) {
    const button = event.target;
    const rawCode = decodeURIComponent(button.getAttribute('data-code') || '');
    navigator.clipboard.writeText(rawCode).then(() => {
      console.log('[WebLLM Test] Code snippet copied to clipboard.');
      button.textContent = 'Copied!';
      setTimeout(() => {
        button.textContent = 'Copy';
      }, 1800);
    });
  }
});

//! Switch Model on Change
modelSelect.addEventListener('change', () => {
  const newModel = modelSelect.value;
  console.log(`[WebLLM Test] Model selection changed to: ${newModel}`);
  initEngine(newModel);
});

//! Toggle System Prompt Settings Drawer
systemPromptToggle.addEventListener('click', () => {
  const isHidden = systemPromptDrawer.style.display === 'none';
  systemPromptDrawer.style.display = isHidden ? 'flex' : 'none';
  console.log(`[WebLLM Test] System prompt drawer toggled. Visible: ${isHidden}`);
});

//! Save System Prompt
savePromptButton.addEventListener('click', () => {
  const newPrompt = systemPromptInput.value.trim();
  if (newPrompt) {
    systemPrompt = newPrompt;
    messageList[0] = { role: 'system', content: systemPrompt };
    systemPromptDrawer.style.display = 'none';
    console.log('[WebLLM Test] New system instructions saved:', systemPrompt);
    statusText.textContent = 'Instructions updated.';
  }
});

//! Clear Chat History
clearButton.addEventListener('click', () => {
  console.log('[WebLLM Test] Clear chat requested by user.');
  messageList = [
    { role: 'system', content: systemPrompt }
  ];
  chatMessages.innerHTML = '';
  speedBadge.style.display = 'none';
  createMessageBubble('assistant', 'Chat history cleared. What would you like to discuss?');
});

//! Stop Current Generation
stopButton.addEventListener('click', async () => {
  if (engine && isGenerating) {
    console.log('[WebLLM Test] Stop button clicked. Calling engine.interruptGenerate()...');
    statusText.textContent = 'Stopping response...';
    await engine.interruptGenerate();
    isGenerating = false;
    setGeneratingState(false);
    console.log('[WebLLM Test] Generation successfully stopped.');
  }
});

//! Toggle UI States During Generation
function setGeneratingState(generating) {
  isGenerating = generating;
  if (generating) {
    sendButton.style.display = 'none';
    stopButton.style.display = 'inline-block';
    modelSelect.disabled = true;
    speedBadge.style.display = 'inline-block';
  } else {
    sendButton.style.display = 'inline-block';
    stopButton.style.display = 'none';
    modelSelect.disabled = false;
    sendButton.disabled = !isEngineReady;
  }
}

//! Handle Auto-Resize and Enter Key in Textarea
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

//! Handle Send Form Submit
chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const userText = messageInput.value.trim();
  if (!userText || !isEngineReady || isGenerating) {
    console.log('[WebLLM Test] Submit ignored: empty text or engine not ready.');
    return;
  }

  console.log('[WebLLM Test] Sending message:', userText);

  //* Reset input height and clear text
  messageInput.value = '';
  messageInput.style.height = 'auto';

  //* Append user bubble
  createMessageBubble('user', userText);
  messageList.push({ role: 'user', content: userText });

  setGeneratingState(true);
  statusText.textContent = 'Thinking...';

  //* Create bubble for streaming assistant response
  const assistantBubble = createMessageBubble('assistant', '');
  let fullResponse = '';
  let tokenCount = 0;
  const startTime = performance.now();

  try {
    console.log('[WebLLM Test] Requesting streaming completion from engine...');
    const completionStream = await engine.chat.completions.create({
      messages: messageList,
      stream: true
    });

    for await (const chunk of completionStream) {
      if (!isGenerating) {
        console.log('[WebLLM Test] Generation loop broken because isGenerating is false.');
        break;
      }

      const token = chunk.choices[0]?.delta?.content || '';
      fullResponse += token;
      tokenCount++;

      //* Update speed badge
      const elapsedSeconds = (performance.now() - startTime) / 1000;
      if (elapsedSeconds > 0.5) {
        const tokensPerSec = Math.round(tokenCount / elapsedSeconds);
        speedBadge.textContent = `${tokensPerSec} tok/s`;
      }

      assistantBubble.innerHTML = formatMessageContent(fullResponse);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    if (fullResponse.trim()) {
      messageList.push({ role: 'assistant', content: fullResponse });
      console.log(`[WebLLM Test] Completed generation. Total tokens: ${tokenCount}`);
    }
    statusText.textContent = 'Ready';
  } catch (error) {
    console.error('[WebLLM Test] Error during chat completion:', error);
    assistantBubble.innerHTML = formatMessageContent('Sorry, an error occurred: ' + error.message);
    statusText.textContent = 'Generation error';
  } finally {
    setGeneratingState(false);
  }
});

//! Start Application
console.log('[WebLLM Test] App boot script running...');
checkWebGPU();
initEngine(modelSelect.value);
