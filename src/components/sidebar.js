// DevStack — Sidebar Component
import { store } from '../store.js';
import { navigate } from '../router.js';
import { logoutUser } from '../auth.js';

const navItems = [
  { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
  { id: 'bookmarks', icon: 'bookmarks', label: 'Yer İmleri', route: '/bookmarks' },
  { id: 'snippets', icon: 'code', label: 'Snippetlar', route: '/snippets' },
  { id: 'notes', icon: 'description', label: 'Notlar', route: '/notes' },
  { id: 'ai-assistant', icon: 'smart_toy', label: 'AI Asistan', route: '/ai-assistant' },
];

export function renderSidebar() {
  const sidebar = document.createElement('aside');
  sidebar.id = 'sidebar';
  sidebar.className = 'sidebar';

  function update() {
    const collapsed = store.get('sidebarCollapsed');
    const mobileOpen = store.get('mobileSidebarOpen');
    const currentPage = store.get('currentPage');
    const user = store.get('user');

    const userName = user?.displayName || 'Kullanıcı';
    const userInitial = userName.charAt(0).toUpperCase();

    sidebar.className = `sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${mobileOpen ? 'sidebar--mobile-open' : ''}`;

    sidebar.innerHTML = `
      <div class="sidebar__header">
        <div class="sidebar__brand">
          <div class="sidebar__logo">D</div>
          <div class="sidebar__brand-text">
            <h1 class="sidebar__title">DevStack</h1>
            <p class="sidebar__subtitle">Geliştirici Paneli</p>
          </div>
        </div>
        <button class="sidebar__toggle" id="sidebar-toggle" title="Menüyü daralt">
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <button class="sidebar__close-mobile" id="sidebar-close-mobile">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <nav class="sidebar__nav">
        ${navItems.map(item => `
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
            <p class="sidebar__user-name">${user?.displayName || 'Geliştirici'}</p>
            <p class="sidebar__user-plan">@${user?.username || 'kullanici'}</p>
          </div>
        </div>
      </div>
    `;

    // Event listeners
    sidebar.querySelector('#sidebar-toggle')?.addEventListener('click', () => {
      store.set('sidebarCollapsed', !store.get('sidebarCollapsed'));
    });

    sidebar.querySelector('#sidebar-close-mobile')?.addEventListener('click', () => {
      store.set('mobileSidebarOpen', false);
    });

    sidebar.querySelector('#sidebar-user-profile')?.addEventListener('click', () => {
      navigate('/settings');
      store.set('mobileSidebarOpen', false);
    });

    sidebar.querySelectorAll('.sidebar__nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        navigate(`/${page}`);
        store.set('mobileSidebarOpen', false);
      });
    });
  }

  update();

  // Subscribe to state changes
  const unsubs = [
    store.subscribe('sidebarCollapsed', update),
    store.subscribe('mobileSidebarOpen', update),
    store.subscribe('currentPage', update),
    store.subscribe('user', update),
  ];

  // Mobile overlay
  const overlay = document.createElement('div');
  overlay.id = 'sidebar-overlay';
  overlay.className = 'sidebar-overlay';
  overlay.addEventListener('click', () => store.set('mobileSidebarOpen', false));

  store.subscribe('mobileSidebarOpen', (open) => {
    overlay.classList.toggle('sidebar-overlay--visible', open);
  });

  return { sidebar, overlay, cleanup: () => unsubs.forEach(u => u()) };
}
