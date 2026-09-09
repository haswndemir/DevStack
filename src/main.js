// DevStack — Main Entry Point
import './styles/index.css';
import './styles/sidebar.css';
import './styles/topbar.css';
import './styles/auth.css';
import './styles/dashboard.css';
import './styles/bookmarks.css';
import './styles/snippets.css';
import './styles/notes.css';
import './styles/ai-assistant.css';

import { store } from './store.js';
import { onAuthChange } from './auth.js';
import { registerRoute, initRouter, routeAfterAuth, navigate } from './router.js';
import { getBookmarks, getSnippets, getNotes, getNotifications } from './db.js';
import { renderSidebar } from './components/sidebar.js';
import { renderTopbar } from './components/topbar.js';
import { initCommandPalette, openCommandPalette } from './components/command-palette.js';
import { getCurrentLanguage, t } from './i18n/index.js';
import { initTheme } from './utils/theme.js';

// Pages
import { renderLogin } from './pages/login.js';
import { renderRegister } from './pages/register.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderBookmarks } from './pages/bookmarks.js';
import { renderSnippets } from './pages/snippets.js';
import { renderNotes } from './pages/notes.js';
import { renderAIAssistant } from './pages/ai-assistant.js';
import { renderSettings } from './pages/settings.js';

// Apply initial attributes & theme system
initTheme();
const initialLang = getCurrentLanguage() || 'en';
document.documentElement.setAttribute('lang', initialLang);

// Initialize Command Palette global shortcuts
initCommandPalette();

// ==================== APP SHELL ====================
function renderAppShell() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const { sidebar, overlay, cleanup: sidebarCleanup } = renderSidebar();
  const { topbar, cleanup: topbarCleanup } = renderTopbar();

  const mainEl = document.createElement('main');
  mainEl.className = 'app-main';
  mainEl.id = 'app-main';

  const contentEl = document.createElement('div');
  contentEl.className = 'app-content';
  contentEl.id = 'page-content';

  // FAB (Floating Action Button)
  const fab = document.createElement('button');
  fab.className = 'fab';
  fab.id = 'fab';
  fab.title = t('common.quickAdd');
  fab.innerHTML = '<span class="material-symbols-outlined" style="font-size:1.5rem;font-variation-settings:\'FILL\' 1, \'wght\' 600">add</span>';
  fab.addEventListener('click', () => {
    openCommandPalette();
  });

  mainEl.appendChild(topbar);
  mainEl.appendChild(contentEl);

  app.appendChild(overlay);
  app.appendChild(sidebar);
  app.appendChild(mainEl);
  app.appendChild(fab);

  // Sidebar collapsed margin reactivity
  function updateMainMargin() {
    const collapsed = store.get('sidebarCollapsed');
    if (window.innerWidth > 1024) {
      mainEl.style.marginLeft = collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)';
    } else {
      mainEl.style.marginLeft = '0';
    }
  }
  updateMainMargin();
  store.subscribe('sidebarCollapsed', updateMainMargin);
  window.addEventListener('resize', updateMainMargin);

  return { sidebarCleanup, topbarCleanup };
}

function renderAuthShell() {
  const app = document.getElementById('app');
  app.innerHTML = '<div id="page-content"></div>';
}

// ==================== LOADING SCREEN ====================
function showLoading() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="loading-screen">
      <div style="text-align:center">
        <div style="width:3.5rem;height:3.5rem;border-radius:var(--radius-xl);background:var(--primary);color:var(--on-primary);display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:1.75rem;margin-bottom:1.5rem;box-shadow:var(--shadow-primary)">D</div>
        <h1 style="font-size:1.5rem;font-weight:800;letter-spacing:-0.03em;color:var(--primary)">DevStack</h1>
        <p style="font-size:0.75rem;color:var(--outline);margin-top:0.25rem;text-transform:uppercase;letter-spacing:0.1em;font-weight:600">Developer Cloud Workspace</p>
      </div>
      <div class="loading-spinner"></div>
    </div>
  `;
}

// ==================== REGISTER ROUTES ====================
registerRoute('/login', () => {
  renderAuthShell();
  renderLogin();
});

registerRoute('/register', () => {
  renderAuthShell();
  renderRegister();
});

registerRoute('/dashboard', () => {
  if (!document.getElementById('app-main')) {
    renderAppShell();
  }
  renderDashboard();
});

registerRoute('/bookmarks', () => {
  if (!document.getElementById('app-main')) {
    renderAppShell();
  }
  return renderBookmarks();
});

registerRoute('/snippets', () => {
  if (!document.getElementById('app-main')) {
    renderAppShell();
  }
  renderSnippets();
});

registerRoute('/notes', () => {
  if (!document.getElementById('app-main')) {
    renderAppShell();
  }
  renderNotes();
});

registerRoute('/ai-assistant', () => {
  if (!document.getElementById('app-main')) {
    renderAppShell();
  }
  renderAIAssistant();
});

registerRoute('/settings', () => {
  if (!document.getElementById('app-main')) {
    renderAppShell();
  }
  renderSettings();
});

// Re-render active view on language switch
window.addEventListener('devstack-language-changed', () => {
  const currentRoute = window.location.hash.slice(1) || '/dashboard';
  if (currentRoute === '/dashboard') renderDashboard();
  else if (currentRoute === '/bookmarks') renderBookmarks();
  else if (currentRoute === '/snippets') renderSnippets();
  else if (currentRoute === '/notes') renderNotes();
  else if (currentRoute === '/ai-assistant') renderAIAssistant();
  else if (currentRoute === '/settings') renderSettings();
});

// ==================== INIT ====================
showLoading();
initRouter();

// Auth state listener
onAuthChange(async (user) => {
  if (user) {
    store.set('user', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      username: user.username,
    });

    // Load user data in background
    try {
      const [bookmarks, snippets, notes, notifications] = await Promise.all([
        getBookmarks().catch((err) => { console.warn('Bookmarks fetch error:', err); return []; }),
        getSnippets().catch((err) => { console.warn('Snippets fetch error:', err); return []; }),
        getNotes().catch((err) => { console.warn('Notes fetch error:', err); return []; }),
        getNotifications().catch((err) => { console.warn('Notifications fetch error:', err); return []; }),
      ]);
      store.set('bookmarks', bookmarks || []);
      store.set('snippets', snippets || []);
      store.set('notes', notes || []);
      if (notifications && notifications.length > 0) {
        store.set('notifications', notifications);
      }
    } catch (err) {
      console.warn('Data load error:', err.message);
    }

    store.set('loading', false);
    store.set('initialized', true);

    const currentRoute = window.location.hash.slice(1);
    if (!currentRoute || currentRoute === '/login' || currentRoute === '/register') {
      navigate('/dashboard');
    } else {
      routeAfterAuth();
    }
  } else {
    store.reset();

    const currentRoute = window.location.hash.slice(1);
    if (currentRoute !== '/login' && currentRoute !== '/register') {
      navigate('/login');
    } else {
      routeAfterAuth();
    }
  }
});
