// DevStack — Modal Component

export function showModal({ title, message, confirmText = 'Onayla', cancelText = 'İptal', onConfirm, type = 'default' }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-overlay';

  const iconMap = {
    danger: '<span class="material-symbols-outlined" style="font-size:2.5rem;color:var(--error)">warning</span>',
    success: '<span class="material-symbols-outlined" style="font-size:2.5rem;color:var(--secondary)">check_circle</span>',
    default: '<span class="material-symbols-outlined" style="font-size:2.5rem;color:var(--primary)">info</span>',
  };

  overlay.innerHTML = `
    <div class="modal-content">
      <div style="text-align:center;margin-bottom:1.5rem">
        ${iconMap[type] || iconMap.default}
      </div>
      <h3 style="font-size:1.125rem;font-weight:700;text-align:center;margin-bottom:0.5rem">${title}</h3>
      <p style="font-size:0.875rem;color:var(--on-surface-variant);text-align:center;margin-bottom:1.75rem">${message}</p>
      <div style="display:flex;gap:0.75rem">
        <button class="btn btn-secondary" style="flex:1" id="modal-cancel">${cancelText}</button>
        <button class="btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}" style="flex:1" id="modal-confirm">${confirmText}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#modal-cancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#modal-confirm').addEventListener('click', () => {
    if (onConfirm) onConfirm();
    overlay.remove();
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}
