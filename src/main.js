//! ==========================================================================
//! Local WebLLM Chat - Main Thread Setup
//! ==========================================================================

import { CreateMLCEngine } from '@mlc-ai/web-llm';

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

//! Initialise Engine
async function initEngine() {
  try {
    statusText.textContent = 'Downloading and loading model files...';
    sendButton.disabled = true;

    //? Load engine directly on main thread
    engine = await CreateMLCEngine(selectedModel, {
      initProgressCallback: (report) => {
        statusText.textContent = report.text;
      }
    });

    isEngineReady = true;
    statusText.textContent = 'Model loaded and ready.';
    sendButton.disabled = false;
  } catch (error) {
    statusText.textContent = 'Error loading model: ' + error.message;
    console.error(error);
  }
}

//! Add Message Bubble to UI
function appendMessage(role, text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;

  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = 'bubble';
  bubbleDiv.textContent = text;

  messageDiv.appendChild(bubbleDiv);
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

//! Handle Send Form Submit
chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const userText = messageInput.value.trim();
  if (!userText || !isEngineReady) return;

  //* Clear input and show user message
  messageInput.value = '';
  appendMessage('user', userText);
  messageList.push({ role: 'user', content: userText });

  sendButton.disabled = true;
  statusText.textContent = 'Thinking...';

  try {
    //* Non-streaming completion
    const reply = await engine.chat.completions.create({
      messages: messageList
    });

    const assistantText = reply.choices[0].message.content || '';
    appendMessage('assistant', assistantText);
    messageList.push({ role: 'assistant', content: assistantText });

    statusText.textContent = 'Ready';
  } catch (error) {
    appendMessage('assistant', 'Sorry, an error occurred: ' + error.message);
    statusText.textContent = 'Error during generation';
  } finally {
    sendButton.disabled = false;
  }
});

//* Start engine on load
initEngine();
