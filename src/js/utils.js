//! ==========================================================================
//! Text & Markdown Utilities
//! ==========================================================================

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function formatMessageContent(rawText) {
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let formatted = rawText;

  formatted = formatted.replace(codeBlockRegex, (match, language, code) => {
    const langLabel = language || 'code';
    const escapedCode = escapeHtml(code.trim());
    return `
      <div class="my-2 bg-code-bg border-[1.5px] border-ink rounded-lg overflow-hidden">
        <div class="flex justify-between items-center px-3 py-1.5 bg-code-bg border-b border-white/10 text-[11px] font-mono text-ink-muted uppercase tracking-wider">
          <span>${langLabel}</span>
          <button class="copy-code-btn bg-transparent border border-white/20 hover:border-accent-indigo hover:text-accent-indigo text-code-text px-2.5 py-0.5 rounded-full font-mono text-[11px] cursor-pointer transition-colors" type="button" data-code="${encodeURIComponent(code.trim())}">Copy</button>
        </div>
        <pre class="p-3 overflow-x-auto font-mono text-xs text-code-text leading-relaxed"><code>${escapedCode}</code></pre>
      </div>
    `;
  });

  formatted = formatted.replace(/`([^`]+)`/g, (match, inlineCode) => {
    return `<code class="bg-paper-alt border border-ink-muted px-1.5 py-0.5 rounded font-mono text-[0.85em]">${escapeHtml(inlineCode)}</code>`;
  });

  formatted = formatted.replace(/\n/g, '<br>');
  return formatted;
}
