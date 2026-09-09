// src/components/notification-center.js - Persistent Notification Center
import { store } from '../store.js';
import { t } from '../i18n/index.js';
import { markNotificationAsRead, deleteNotification } from '../db.js';

let notificationDropdown = null;

export function renderNotificationCenter() {
  const container = document.createElement('div');
  container.className = 'notif-center-wrapper';
  container.id = 'notif-center';

  function update() {
    const notifs = store.get('notifications') || [];
    const unreadCount = notifs.filter((n) => !n.read).length;

    container.innerHTML = `
      <button class="btn-icon notif-bell-btn" id="notif-bell" title="${t('notifications.title')}" aria-label="${t('notifications.title')}">
        <span class="material-symbols-outlined">notifications</span>
        ${unreadCount > 0 ? `<span class="notif-badge">${unreadCount > 9 ? '9+' : unreadCount}</span>` : ''}
      </button>
    `;

    container.querySelector('#notif-bell').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleNotificationDropdown();
    });
  }

  update();
  store.subscribe('notifications', update);

  return container;
}

export function toggleNotificationDropdown() {
  if (notificationDropdown) {
    closeNotificationDropdown();
  } else {
    openNotificationDropdown();
  }
}

export function openNotificationDropdown() {
  closeNotificationDropdown();

  const bell = document.getElementById('notif-bell');
  if (!bell) return;

  notificationDropdown = document.createElement('div');
  notificationDropdown.className = 'notif-dropdown animate-fade-in-down';

  const notifs = store.get('notifications') || [];

  function renderList() {
    const list = store.get('notifications') || [];
    const unread = list.filter((n) => !n.read);

    notificationDropdown.innerHTML = `
      <div class="notif-dropdown-header">
        <span class="notif-dropdown-title">${t('notifications.title')}</span>
        ${unread.length > 0 ? `<button class="btn-text notif-mark-all" id="notif-mark-all">${t('notifications.markAllRead')}</button>` : ''}
      </div>
      <div class="notif-dropdown-list no-scrollbar">
        ${list.length === 0 ? `
          <div class="notif-empty">
            <span class="material-symbols-outlined" style="font-size:2rem;color:var(--outline);opacity:0.6">notifications_off</span>
            <p>${t('notifications.noNotifications')}</p>
          </div>
        ` : list.map((item) => {
          const title = item.titleKey ? t(item.titleKey) : item.title || t('notifications.title');
          const message = item.messageKey ? t(item.messageKey) : item.message || '';
          return `
            <div class="notif-item ${item.read ? 'read' : 'unread'}" data-id="${item.id}">
              <div class="notif-item-dot"></div>
              <div class="notif-item-body">
                <span class="notif-item-title">${title}</span>
                <span class="notif-item-msg">${message}</span>
                <span class="notif-item-time">${formatDate(item.timestamp)}</span>
              </div>
              <button class="btn-icon notif-item-del" data-id="${item.id}" title="${t('common.delete')}">
                <span class="material-symbols-outlined" style="font-size:0.875rem">close</span>
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Mark all read event
    notificationDropdown.querySelector('#notif-mark-all')?.addEventListener('click', async () => {
      const updated = list.map((n) => ({ ...n, read: true }));
      store.set('notifications', updated);
      list.forEach((n) => {
        if (!n.read && n.id && !n.id.startsWith('welcome')) {
          markNotificationAsRead(n.id);
        }
      });
      renderList();
    });

    // Item click (mark single as read)
    notificationDropdown.querySelectorAll('.notif-item').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.notif-item-del')) return;
        const id = el.dataset.id;
        const updated = (store.get('notifications') || []).map((n) => (n.id === id ? { ...n, read: true } : n));
        store.set('notifications', updated);
        if (id && !id.startsWith('welcome')) markNotificationAsRead(id);
        renderList();
      });
    });

    // Delete item
    notificationDropdown.querySelectorAll('.notif-item-del').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const updated = (store.get('notifications') || []).filter((n) => n.id !== id);
        store.set('notifications', updated);
        if (id && !id.startsWith('welcome')) deleteNotification(id);
        renderList();
      });
    });
  }

  renderList();
  document.body.appendChild(notificationDropdown);

  // Position relative to bell
  const rect = bell.getBoundingClientRect();
  notificationDropdown.style.position = 'fixed';
  notificationDropdown.style.top = `${rect.bottom + 8}px`;
  notificationDropdown.style.right = `${Math.max(16, window.innerWidth - rect.right)}px`;

  // Close when clicking outside
  const closeListener = (e) => {
    if (!notificationDropdown.contains(e.target) && !bell.contains(e.target)) {
      closeNotificationDropdown();
      document.removeEventListener('click', closeListener);
    }
  };
  setTimeout(() => document.addEventListener('click', closeListener), 10);
}

export function closeNotificationDropdown() {
  if (notificationDropdown) {
    notificationDropdown.remove();
    notificationDropdown = null;
  }
}

function formatDate(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('common.recent');
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
