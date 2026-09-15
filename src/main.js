//! ==========================================================================
//! Local WebLLM Chat - Model Selector, Progress Bar
//! ==========================================================================

import { CreateWebWorkerMLCEngine } from '@mlc-ai/web-llm';

//* Model selection
const selectedModel = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';

//* UI elements
const statusText = document.getElementById('statusText');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

let engine = null;
let isEngineReady = false;

//* Keep track of chat history
const messageList = [
  { role: 'system', content: 'You are a helpful and concise AI assistant.' }
];

//! Initialise Background Worker & Engine
async function initEngine() {
  try {
    statusText.textContent = 'Starting background worker...';
    sendButton.disabled = true;

    //? Spawn Web Worker so UI stays responsive during generation
    const worker = new Worker(new URL('./worker.js', import.meta.url), {
      type: 'module'
    });

    statusText.textContent = 'Downloading model files...';

    //? Create engine attached to the worker
    engine = await CreateWebWorkerMLCEngine(worker, selectedModel, {
      initProgressCallback: (report) => {
        statusText.textContent = report.text;
      }
    });

    isEngineReady = true;
    statusText.textContent = 'Model loaded and ready.';
    sendButton.disabled = false;
  } catch (error) {
    statusText.textContent = 'Failed to load model: ' + error.message;
    console.error(error);
  }
}

//! Add Message Bubble to UI
function createMessageBubble(role, initialText = '') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;

  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = 'bubble';
  bubbleDiv.textContent = initialText;

  messageDiv.appendChild(bubbleDiv);
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return bubbleDiv;
}

//! Handle Send Form Submit
chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const userText = messageInput.value.trim();
  if (!userText || !isEngineReady) return;

  //* Clear input and show user message
  messageInput.value = '';
  createMessageBubble('user', userText);
  messageList.push({ role: 'user', content: userText });

  sendButton.disabled = true;
  statusText.textContent = 'Generating response...';

  //* Create bubble for streaming assistant response
  const assistantBubble = createMessageBubble('assistant', '');
  let fullResponse = '';

  try {
    //? Stream tokens as they arrive
    const completionStream = await engine.chat.completions.create({
      messages: messageList,
      stream: true
    });

    for await (const chunk of completionStream) {
      const token = chunk.choices[0]?.delta?.content || '';
      fullResponse += token;
      assistantBubble.textContent = fullResponse;
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    messageList.push({ role: 'assistant', content: fullResponse });
    statusText.textContent = 'Ready';
  } catch (error) {
    assistantBubble.textContent = 'Error: ' + error.message;
    statusText.textContent = 'Error during generation';
  } finally {
    sendButton.disabled = false;
  }
});

//* Start engine on load
initEngine();
