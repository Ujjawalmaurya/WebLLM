//! ==========================================================================
//! Chat Messages View
//! ==========================================================================

import { formatMessageContent } from '../utils.js';

const chatMessages = document.getElementById('chatMessages');
const welcomeCard = document.getElementById('welcomeCard');

export function createMessageBubble(role, initialText = '') {
  const messageDiv = document.createElement('div');
  const isUser = (role === 'user');

  messageDiv.className = isUser
    ? 'message user flex self-end max-w-[88%] sm:max-w-[82%]'
    : 'message assistant flex self-start max-w-[94%] sm:max-w-[88%]';

  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = isUser
    ? 'bubble px-4 py-2.5 text-sm leading-relaxed rounded-2xl rounded-br-xs bg-accent-teal text-white shadow-brutal-sm break-words'
    : 'bubble px-4 py-2.5 text-sm leading-relaxed rounded-2xl rounded-bl-xs bg-paper border-[1.5px] border-ink text-ink shadow-brutal-sm break-words';

  bubbleDiv.innerHTML = formatMessageContent(initialText);

  messageDiv.appendChild(bubbleDiv);
  chatMessages.appendChild(messageDiv);
  scrollChatToBottom(true);

  return bubbleDiv;
}

export function scrollChatToBottom(force = false) {
  if (!chatMessages) return;
  const isNearBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 120;
  if (force || isNearBottom) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

export function clearChatUI() {
  if (!chatMessages) return;
  const children = Array.from(chatMessages.children);
  children.forEach(child => {
    if (child.id !== 'welcomeCard') {
      chatMessages.removeChild(child);
    }
  });
}

export function showWelcomeState() {
  if (welcomeCard) welcomeCard.style.display = 'flex';
}

export function hideWelcomeState() {
  if (welcomeCard) welcomeCard.style.display = 'none';
}

export function initChatInteractions(onPromptSelect) {
  // Suggestion chips
  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.dataset.prompt;
      if (prompt && onPromptSelect) {
        onPromptSelect(prompt);
      }
    });
  });

  // Copy code blocks
  if (chatMessages) {
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
  }
}
