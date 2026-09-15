//! ==========================================================================
//! Theme Mgmt
//! ==========================================================================

export function initTheme(themeIcon) {
  const stored = localStorage.getItem('webllm-theme');
  if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
  updateThemeIcon(themeIcon);
}

export function toggleTheme(themeIcon) {
  document.documentElement.classList.toggle('dark');
  const isDark = document.documentElement.classList.contains('dark');
  localStorage.setItem('webllm-theme', isDark ? 'dark' : 'light');
  updateThemeIcon(themeIcon);
}

export function updateThemeIcon(themeIcon) {
  if (!themeIcon) return;
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) {
    themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  } else {
    themeIcon.innerHTML = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>';
  }
}
