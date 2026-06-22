// DevStack — Topbar Component
import { store } from '../store.js';
import { navigate } from '../router.js';

export function renderTopbar() {
  const topbar = document.createElement('header');
  topbar.className = 'topbar';
  topbar.id = 'topbar';

  function update() {
    const user = store.get('user');
    const currentPage = store.get('currentPage');
    const initial = (user?.displayName || 'K').charAt(0).toUpperCase();
    const notifsRead = localStorage.getItem('notifications_read') === 'true';

    const pageTitles = {
      'dashboard': 'Dashboard',
      'bookmarks': 'Yer İmleri',
      'snippets': 'Snippetlar',
      'notes': 'Notlar',
      'ai-assistant': 'AI Asistan',
      'profile': 'Profil',
      'settings': 'Ayarlar',
    };

    const searchPlaceholders = {
      'dashboard': 'Komut veya kaynak ara...',
      'bookmarks': 'Yer imlerinde ara...',
      'snippets': 'Snippetlarda ara...',
      'notes': 'Notlarda ara...',
      'ai-assistant': 'Komut veya içerik ara...',
    };

    topbar.innerHTML = `
      <div class="topbar__left">
        <button class="topbar__menu-btn" id="topbar-menu" title="Menü">
          <span class="material-symbols-outlined">menu</span>
        </button>
        <div class="topbar__search">
          <span class="material-symbols-outlined topbar__search-icon">search</span>
          <input type="text" class="topbar__search-input" 
                 placeholder="${searchPlaceholders[currentPage] || 'Ara...'}" 
                 id="topbar-search" />
        </div>
      </div>
      <div class="topbar__right">
        <div class="topbar__notifications-wrapper">
          <button class="topbar__icon-btn" title="Bildirimler" id="topbar-notifications">
            <span class="material-symbols-outlined">notifications</span>
            <span class="topbar__badge" id="notifications-badge" style="display:${notifsRead ? 'none' : 'block'}"></span>
          </button>
          <div class="topbar__notifications-popover" id="notifications-popover">
            <div class="topbar__notifications-header">
              <h4 style="font-size:0.875rem;font-weight:700">Bildirimler</h4>
              <button class="btn-ghost" style="font-size:0.75rem;padding:0.25rem 0.5rem" id="mark-all-read">Tümünü okundu işaretle</button>
            </div>
            <div class="topbar__notifications-list">
              <div class="topbar__notification-item ${notifsRead ? '' : 'topbar__notification-item--unread'}">
                <div class="topbar__notification-icon" style="background:rgba(192,193,255,0.15);color:var(--primary)">
                  <span class="material-symbols-outlined" style="font-size:1.125rem">celebration</span>
                </div>
                <div class="topbar__notification-content">
                  <p class="topbar__notification-title">DevStack'e Hoş Geldin!</p>
                  <p class="topbar__notification-desc">Kişisel çalışma alanını kullanmaya hemen başla.</p>
                  <span class="topbar__notification-time">Şimdi</span>
                </div>
              </div>
              <div class="topbar__notification-item">
                <div class="topbar__notification-icon" style="background:rgba(255,185,95,0.15);color:var(--tertiary)">
                  <span class="material-symbols-outlined" style="font-size:1.125rem">person</span>
                </div>
                <div class="topbar__notification-content">
                  <p class="topbar__notification-title">Profilini Tamamla</p>
                  <p class="topbar__notification-desc">Kullanıcı adını ve diğer bilgilerini güncelle.</p>
                  <span class="topbar__notification-time">1 saat önce</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="topbar__divider"></div>
        <button class="topbar__profile" id="topbar-profile" title="Ayarlar & Profil">
          <div class="topbar__profile-avatar">${initial}</div>
        </button>
      </div>
    `;

    // Events
    const notifBtn = topbar.querySelector('#topbar-notifications');
    const notifPopover = topbar.querySelector('#notifications-popover');
    const notifBadge = topbar.querySelector('#notifications-badge');
    const markReadBtn = topbar.querySelector('#mark-all-read');

    notifBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      notifPopover.classList.toggle('topbar__notifications-popover--active');
    });

    markReadBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      localStorage.setItem('notifications_read', 'true');
      topbar.querySelectorAll('.topbar__notification-item--unread').forEach(el => {
        el.classList.remove('topbar__notification-item--unread');
      });
      if (notifBadge) notifBadge.style.display = 'none';
    });

    document.addEventListener('click', (e) => {
      if (!notifPopover?.contains(e.target) && !notifBtn?.contains(e.target)) {
        notifPopover?.classList.remove('topbar__notifications-popover--active');
      }
    });

    topbar.querySelector('#topbar-menu')?.addEventListener('click', () => {
      if (window.innerWidth <= 1024) {
        store.set('mobileSidebarOpen', true);
      } else {
        store.set('sidebarCollapsed', !store.get('sidebarCollapsed'));
      }
    });

    topbar.querySelector('#topbar-profile')?.addEventListener('click', () => navigate('/settings'));
  }

  update();
  const unsubs = [
    store.subscribe('user', update),
    store.subscribe('currentPage', update),
  ];

  return { topbar, cleanup: () => unsubs.forEach(u => u()) };
}
