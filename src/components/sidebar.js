// DevStack — Sidebar Component
import { store } from '../store.js';
import { navigate } from '../router.js';
import { logoutUser } from '../auth.js';
import { t } from '../i18n/index.js';

export function renderSidebar() {
  const sidebar = document.createElement('aside');
  sidebar.id = 'sidebar';
  sidebar.className = 'sidebar';

  function getNavItems() {
    return [
      { id: 'dashboard', icon: 'dashboard', label: t('nav.dashboard'), route: '/dashboard' },
      { id: 'bookmarks', icon: 'bookmarks', label: t('nav.bookmarks'), route: '/bookmarks' },
      { id: 'snippets', icon: 'code', label: t('nav.snippets'), route: '/snippets' },
      { id: 'notes', icon: 'description', label: t('nav.notes'), route: '/notes' },
      { id: 'ai-assistant', icon: 'smart_toy', label: t('nav.aiAssistant'), route: '/ai-assistant' },
      { id: 'settings', icon: 'settings', label: t('nav.settings'), route: '/settings' },
    ];
  }

  function update() {
    const collapsed = store.get('sidebarCollapsed');
    const mobileOpen = store.get('mobileSidebarOpen');
    const currentPage = store.get('currentPage');
    const user = store.get('user');

    const userName = user?.displayName || user?.email?.split('@')[0] || 'User';
    const userInitial = userName.charAt(0).toUpperCase();
    const navItems = getNavItems();

    sidebar.className = `sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${mobileOpen ? 'sidebar--mobile-open' : ''}`;

    sidebar.innerHTML = `
      <div class="sidebar__header">
        <div class="sidebar__brand" id="sidebar-logo-home" style="cursor:pointer">
          <div class="sidebar__logo">D</div>
          <div class="sidebar__brand-text">
            <h1 class="sidebar__title">DevStack</h1>
            <p class="sidebar__subtitle">Workspace</p>
          </div>
        </div>
        <button class="sidebar__toggle" id="sidebar-toggle" title="Toggle Sidebar">
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <button class="sidebar__close-mobile" id="sidebar-close-mobile">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <nav class="sidebar__nav">
        ${navItems.map((item) => `
          <a class="sidebar__nav-item ${currentPage === item.id ? 'sidebar__nav-item--active' : ''}" 
             href="#${item.route}" data-page="${item.id}">
            <span class="material-symbols-outlined ${currentPage === item.id ? 'icon-filled' : ''}">${item.icon}</span>
            <span class="sidebar__nav-label">${item.label}</span>
          </a>
        `).join('')}
      </nav>

      <div class="sidebar__footer">
        <div class="sidebar__user" id="sidebar-user-profile">
          <div class="sidebar__avatar">${userInitial}</div>
          <div class="sidebar__user-info">
            <p class="sidebar__user-name">${userName}</p>
            <p class="sidebar__user-handle">@${user?.username || 'user'}</p>
          </div>
          <button class="btn-icon" id="sidebar-logout-btn" title="${t('nav.logout')}" style="color:var(--outline);margin-left:auto">
            <span class="material-symbols-outlined" style="font-size:1.125rem">logout</span>
          </button>
        </div>
      </div>
    `;

    sidebar.querySelector('#sidebar-logo-home')?.addEventListener('click', () => {
      navigate('/dashboard');
      store.set('mobileSidebarOpen', false);
    });

    sidebar.querySelector('#sidebar-toggle')?.addEventListener('click', () => {
      store.set('sidebarCollapsed', !store.get('sidebarCollapsed'));
    });

    sidebar.querySelector('#sidebar-close-mobile')?.addEventListener('click', () => {
      store.set('mobileSidebarOpen', false);
    });

    sidebar.querySelector('#sidebar-user-profile')?.addEventListener('click', (e) => {
      if (e.target.closest('#sidebar-logout-btn')) return;
      navigate('/settings');
      store.set('mobileSidebarOpen', false);
    });

    sidebar.querySelector('#sidebar-logout-btn')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await logoutUser();
        store.reset();
        navigate('/login');
      } catch (err) {
        console.error('Logout error:', err);
      }
    });

    sidebar.querySelectorAll('.sidebar__nav-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        navigate(`/${page}`);
        store.set('mobileSidebarOpen', false);
      });
    });
  }

  update();

  const unsubs = [
    store.subscribe('sidebarCollapsed', update),
    store.subscribe('mobileSidebarOpen', update),
    store.subscribe('currentPage', update),
    store.subscribe('user', update),
    store.subscribe('language', update),
  ];

  window.addEventListener('devstack-language-changed', update);

  const overlay = document.createElement('div');
  overlay.id = 'sidebar-overlay';
  overlay.className = 'sidebar-overlay';
  overlay.addEventListener('click', () => store.set('mobileSidebarOpen', false));

  store.subscribe('mobileSidebarOpen', (open) => {
    overlay.classList.toggle('sidebar-overlay--visible', open);
  });

  return {
    sidebar,
    overlay,
    cleanup: () => {
      unsubs.forEach((u) => u());
      window.removeEventListener('devstack-language-changed', update);
    },
  };
}
