// DevStack — Toast Notification Component

let toastContainer = null;

function ensureContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function showToast(message, type = 'info', duration = 3000) {
  const container = ensureContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = { success: 'check_circle', error: 'error', info: 'info' };
  toast.innerHTML = `
    <span class="material-symbols-outlined" style="font-size:1.25rem">${icons[type] || 'info'}</span>
    <span style="flex:1">${message}</span>
    <button onclick="this.parentElement.remove()" style="opacity:0.6;padding:2px">
      <span class="material-symbols-outlined" style="font-size:1rem">close</span>
    </button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
