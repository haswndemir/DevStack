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
import { getBookmarks, getSnippets, getNotes } from './db.js';
import { renderSidebar } from './components/sidebar.js';
import { renderTopbar } from './components/topbar.js';

// Pages
import { renderLogin } from './pages/login.js';
import { renderRegister } from './pages/register.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderBookmarks } from './pages/bookmarks.js';
import { renderSnippets } from './pages/snippets.js';
import { renderNotes } from './pages/notes.js';
import { renderAIAssistant } from './pages/ai-assistant.js';
import { renderSettings } from './pages/settings.js';

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

  // FAB
  const fab = document.createElement('button');
  fab.className = 'fab';
  fab.id = 'fab';
  fab.title = 'Yeni Ekle';
  fab.innerHTML = '<span class="material-symbols-outlined" style="font-size:1.5rem;font-variation-settings:\'FILL\' 1, \'wght\' 600">add</span>';

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
        <div style="width:3.5rem;height:3.5rem;border-radius:var(--radius-xl);background:var(--primary);color:var(--on-primary);display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:1.75rem;margin-bottom:1.5rem;box-shadow:0 0 30px rgba(192,193,255,0.3)">D</div>
        <h1 style="font-size:1.5rem;font-weight:800;letter-spacing:-0.03em;color:var(--primary)">DevStack</h1>
        <p style="font-size:0.75rem;color:var(--outline);margin-top:0.25rem;text-transform:uppercase;letter-spacing:0.1em;font-weight:600">Geliştirici Paneli</p>
      </div>
      <div class="loading-spinner"></div>
    </div>
  `;
}

// ==================== REGISTER ROUTES ====================
let shellCleanups = null;

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
    shellCleanups = renderAppShell();
  }
  renderDashboard();
});

registerRoute('/bookmarks', () => {
  if (!document.getElementById('app-main')) {
    shellCleanups = renderAppShell();
  }
  return renderBookmarks();
});

registerRoute('/snippets', () => {
  if (!document.getElementById('app-main')) {
    shellCleanups = renderAppShell();
  }
  renderSnippets();
});

registerRoute('/notes', () => {
  if (!document.getElementById('app-main')) {
    shellCleanups = renderAppShell();
  }
  renderNotes();
});

registerRoute('/ai-assistant', () => {
  if (!document.getElementById('app-main')) {
    shellCleanups = renderAppShell();
  }
  renderAIAssistant();
});

registerRoute('/settings', () => {
  if (!document.getElementById('app-main')) {
    shellCleanups = renderAppShell();
  }
  renderSettings();
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

    // Load user data
    try {
      const [bookmarks, snippets, notes] = await Promise.all([
        getBookmarks(),
        getSnippets(),
        getNotes(),
      ]);
      store.set('bookmarks', bookmarks);
      store.set('snippets', snippets);
      store.set('notes', notes);
    } catch (err) {
      console.warn('Veri yükleme hatası:', err.message);
    }

    store.set('loading', false);
    store.set('initialized', true);
    routeAfterAuth();
  } else {
    store.set('user', null);
    store.set('bookmarks', []);
    store.set('snippets', []);
    store.set('notes', []);
    store.set('loading', false);
    store.set('initialized', true);
    routeAfterAuth();
  }
});
