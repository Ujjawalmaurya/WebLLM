//! ==========================================================================
//! Error Retry Banner
//! ==========================================================================

const errorRetryBanner = document.getElementById('errorRetryBanner');
const bannerErrorText = document.getElementById('bannerErrorText');
const bannerRetryBtn = document.getElementById('bannerRetryBtn');

let onRetryCallback = null;

export function initErrorBanner(retryHandler) {
  onRetryCallback = retryHandler;
  if (bannerRetryBtn) {
    bannerRetryBtn.addEventListener('click', () => {
      if (onRetryCallback) onRetryCallback();
    });
  }
}

export function showErrorBanner(message) {
  if (!errorRetryBanner || !bannerErrorText) return;
  bannerErrorText.textContent = message;
  errorRetryBanner.style.display = 'flex';
}

export function hideErrorBanner() {
  if (!errorRetryBanner) return;
  errorRetryBanner.style.display = 'none';
}
