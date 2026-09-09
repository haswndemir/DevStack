// DevStack — Topbar Component
import { store } from '../store.js';
import { navigate } from '../router.js';
import { t, changeLanguage, getCurrentLanguage } from '../i18n/index.js';
import { openCommandPalette } from './command-palette.js';
import { renderNotificationCenter } from './notification-center.js';
import { getTheme, toggleTheme } from '../utils/theme.js';

export function renderTopbar() {
  const topbar = document.createElement('header');
  topbar.className = 'topbar';
  topbar.id = 'topbar';

  function update() {
    const user = store.get('user');
    const initial = (user?.displayName || user?.email || 'D').charAt(0).toUpperCase();
    const currentLang = getCurrentLanguage();
    const currentTheme = getTheme();

    topbar.innerHTML = `
      <div class="topbar__left">
        <button class="topbar__menu-btn btn-icon" id="topbar-menu" title="Menu">
          <span class="material-symbols-outlined">menu</span>
        </button>
        <div class="topbar__search" id="topbar-search-trigger" role="button" tabindex="0" title="${t('palette.placeholder')}">
          <span class="material-symbols-outlined topbar__search-icon">search</span>
          <span class="topbar__search-placeholder">${t('common.search')}</span>
          <kbd class="topbar__search-kbd">Ctrl K</kbd>
        </div>
      </div>
      <div class="topbar__right">
        <!-- Language Switcher -->
        <button class="btn-icon topbar__lang-btn" id="topbar-lang-toggle" title="${currentLang === 'tr' ? 'Switch to English' : 'Türkçe\'ye Geç'}">
          <span style="font-size:0.75rem;font-weight:700;letter-spacing:0.05em">${currentLang.toUpperCase()}</span>
        </button>

        <!-- Theme Toggle -->
        <button class="btn-icon topbar__theme-btn" id="topbar-theme-toggle" title="${currentTheme === 'dark' ? t('settings.switchToLight') : t('settings.switchToDark')}">
          <span class="material-symbols-outlined">${currentTheme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
        </button>

        <!-- Notifications Container Slot -->
        <div id="topbar-notifs-slot"></div>

        <div class="topbar__divider"></div>

        <!-- Profile Avatar -->
        <button class="topbar__profile" id="topbar-profile" title="${t('nav.settings')}">
          <div class="topbar__profile-avatar">${initial}</div>
        </button>
      </div>
    `;

    // Mount notification center
    const notifsSlot = topbar.querySelector('#topbar-notifs-slot');
    if (notifsSlot) {
      notifsSlot.appendChild(renderNotificationCenter());
    }

    // Command palette trigger
    topbar.querySelector('#topbar-search-trigger')?.addEventListener('click', () => {
      openCommandPalette();
    });

    // Mobile sidebar toggle
    topbar.querySelector('#topbar-menu')?.addEventListener('click', () => {
      if (window.innerWidth <= 1024) {
        store.set('mobileSidebarOpen', true);
      } else {
        store.set('sidebarCollapsed', !store.get('sidebarCollapsed'));
      }
    });

    // Language toggle
    topbar.querySelector('#topbar-lang-toggle')?.addEventListener('click', async () => {
      const nextLang = currentLang === 'tr' ? 'en' : 'tr';
      await changeLanguage(nextLang);
      store.set('language', nextLang);
      update();
    });

    // Theme toggle
    topbar.querySelector('#topbar-theme-toggle')?.addEventListener('click', () => {
      toggleTheme();
      update();
    });

    // Profile click
    topbar.querySelector('#topbar-profile')?.addEventListener('click', () => navigate('/settings'));
  }

  update();
  const unsubs = [
    store.subscribe('user', update),
    store.subscribe('currentPage', update),
    store.subscribe('language', update),
    store.subscribe('theme', update),
  ];

  window.addEventListener('devstack-language-changed', update);

  return {
    topbar,
    cleanup: () => {
      unsubs.forEach((u) => u());
      window.removeEventListener('devstack-language-changed', update);
    },
  };
}
