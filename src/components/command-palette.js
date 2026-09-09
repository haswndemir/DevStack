// src/components/command-palette.js - Global Command Palette (Ctrl+K)
import { store } from '../store.js';
import { navigate } from '../router.js';
import { t, changeLanguage, getCurrentLanguage } from '../i18n/index.js';
import { showToast } from './toast.js';

let paletteContainer = null;
let selectedIndex = 0;
let currentItems = [];

export function initCommandPalette() {
  // Global keyboard shortcut: Ctrl+K or Cmd+K
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      toggleCommandPalette();
    }
  });

  // Re-render when language changes
  window.addEventListener('devstack-language-changed', () => {
    if (paletteContainer) {
      closeCommandPalette();
    }
  });
}

export function openCommandPalette() {
  if (paletteContainer) return;
  selectedIndex = 0;
  renderPalette();
}

export function closeCommandPalette() {
  if (paletteContainer) {
    paletteContainer.remove();
    paletteContainer = null;
  }
}

export function toggleCommandPalette() {
  if (paletteContainer) {
    closeCommandPalette();
  } else {
    openCommandPalette();
  }
}

function getBaseCommands() {
  const currentLang = getCurrentLanguage();
  const currentTheme = store.get('theme') || 'dark';

  return [
    {
      id: 'nav-dashboard',
      type: 'nav',
      title: t('nav.dashboard'),
      icon: 'dashboard',
      action: () => navigate('/dashboard'),
    },
    {
      id: 'nav-bookmarks',
      type: 'nav',
      title: t('nav.bookmarks'),
      icon: 'bookmark',
      action: () => navigate('/bookmarks'),
    },
    {
      id: 'nav-snippets',
      type: 'nav',
      title: t('nav.snippets'),
      icon: 'code',
      action: () => navigate('/snippets'),
    },
    {
      id: 'nav-notes',
      type: 'nav',
      title: t('nav.notes'),
      icon: 'edit_note',
      action: () => navigate('/notes'),
    },
    {
      id: 'nav-ai',
      type: 'nav',
      title: t('nav.aiAssistant'),
      icon: 'smart_toy',
      action: () => navigate('/ai-assistant'),
    },
    {
      id: 'nav-settings',
      type: 'nav',
      title: t('nav.settings'),
      icon: 'settings',
      action: () => navigate('/settings'),
    },
    {
      id: 'action-switch-lang',
      type: 'action',
      title: currentLang === 'tr' ? 'Switch Language to English' : "Dili Türkçe'ye Değiştir",
      icon: 'language',
      action: async () => {
        const next = currentLang === 'tr' ? 'en' : 'tr';
        await changeLanguage(next);
        store.set('language', next);
        showToast(t('common.success'));
      },
    },
    {
      id: 'action-toggle-theme',
      type: 'action',
      title: currentTheme === 'dark' ? t('settings.themeLight') : t('settings.themeDark'),
      icon: currentTheme === 'dark' ? 'light_mode' : 'dark_mode',
      action: () => {
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        store.set('theme', nextTheme);
        localStorage.setItem('devstack_theme', nextTheme);
        document.documentElement.setAttribute('data-theme', nextTheme);
      },
    },
  ];
}

function searchItems(query) {
  const base = getBaseCommands();
  if (!query) return base;

  const q = query.toLowerCase().trim();
  const matchedBase = base.filter((cmd) => cmd.title.toLowerCase().includes(q));

  const bookmarks = (store.get('bookmarks') || []).filter(
    (b) => (b.title || '').toLowerCase().includes(q) || (b.url || '').toLowerCase().includes(q) || (b.category || '').toLowerCase().includes(q)
  ).map((b) => ({
    id: `bm-${b.id}`,
    type: 'bookmark',
    title: b.title || b.url,
    subtitle: b.url,
    icon: 'bookmark',
    action: () => {
      navigate('/bookmarks');
      if (b.url) window.open(b.url, '_blank', 'noopener,noreferrer');
    },
  }));

  const snippets = (store.get('snippets') || []).filter(
    (s) => (s.title || '').toLowerCase().includes(q) || (s.language || '').toLowerCase().includes(q) || (s.code || '').toLowerCase().includes(q)
  ).map((s) => ({
    id: `sn-${s.id}`,
    type: 'snippet',
    title: s.title,
    subtitle: `${s.language || 'code'} • ${t('nav.snippets')}`,
    icon: 'code',
    action: () => navigate('/snippets'),
  }));

  const notes = (store.get('notes') || []).filter(
    (n) => (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q)
  ).map((n) => ({
    id: `nt-${n.id}`,
    type: 'note',
    title: n.title,
    subtitle: t('nav.notes'),
    icon: 'edit_note',
    action: () => navigate('/notes'),
  }));

  return [...matchedBase, ...bookmarks, ...snippets, ...notes];
}

function renderPalette() {
  paletteContainer = document.createElement('div');
  paletteContainer.className = 'cmd-palette-backdrop animate-fade-in';

  paletteContainer.innerHTML = `
    <div class="cmd-palette" role="dialog" aria-modal="true">
      <div class="cmd-palette-header">
        <span class="material-symbols-outlined cmd-palette-icon">search</span>
        <input type="text" class="cmd-palette-input" id="cmd-palette-input" placeholder="${t('palette.placeholder')}" autofocus autocomplete="off" />
        <span class="cmd-palette-badge">ESC</span>
      </div>
      <div class="cmd-palette-list no-scrollbar" id="cmd-palette-list"></div>
    </div>
  `;

  document.body.appendChild(paletteContainer);

  const input = document.getElementById('cmd-palette-input');
  const list = document.getElementById('cmd-palette-list');

  function updateList(q = '') {
    currentItems = searchItems(q);
    if (selectedIndex >= currentItems.length) selectedIndex = 0;

    if (currentItems.length === 0) {
      list.innerHTML = `<div class="cmd-palette-empty">${t('palette.noResults')}</div>`;
      return;
    }

    list.innerHTML = currentItems.map((item, idx) => `
      <div class="cmd-palette-item ${idx === selectedIndex ? 'selected' : ''}" data-idx="${idx}">
        <span class="material-symbols-outlined cmd-item-icon">${item.icon}</span>
        <div class="cmd-item-text">
          <span class="cmd-item-title">${item.title}</span>
          ${item.subtitle ? `<span class="cmd-item-subtitle">${item.subtitle}</span>` : ''}
        </div>
        <span class="material-symbols-outlined cmd-item-arrow">subdirectory_arrow_left</span>
      </div>
    `).join('');

    list.querySelectorAll('.cmd-palette-item').forEach((el) => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.idx, 10);
        executeItem(idx);
      });
      el.addEventListener('mouseenter', () => {
        selectedIndex = parseInt(el.dataset.idx, 10);
        updateSelectionHighlight();
      });
    });
  }

  function updateSelectionHighlight() {
    list.querySelectorAll('.cmd-palette-item').forEach((el, idx) => {
      el.classList.toggle('selected', idx === selectedIndex);
    });
    const selectedEl = list.querySelector('.cmd-palette-item.selected');
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }

  function executeItem(idx) {
    const item = currentItems[idx];
    if (item && item.action) {
      closeCommandPalette();
      item.action();
    }
  }

  input.addEventListener('input', (e) => {
    selectedIndex = 0;
    updateList(e.target.value);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentItems.length > 0) {
        selectedIndex = (selectedIndex + 1) % currentItems.length;
        updateSelectionHighlight();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentItems.length > 0) {
        selectedIndex = (selectedIndex - 1 + currentItems.length) % currentItems.length;
        updateSelectionHighlight();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentItems.length > 0) {
        executeItem(selectedIndex);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeCommandPalette();
    }
  });

  paletteContainer.addEventListener('click', (e) => {
    if (e.target === paletteContainer) {
      closeCommandPalette();
    }
  });

  updateList();
  input.focus();
}
