// DevStack — Global State Store (Observer Pattern with Clean Reset)
import { getCurrentLanguage } from './i18n/index.js';

const getInitialTheme = () => {
  return localStorage.getItem('devstack_theme') || 'dark';
};

const defaultState = {
  user: null,
  bookmarks: [],
  snippets: [],
  notes: [],
  notifications: [
    {
      id: 'welcome-init',
      titleKey: 'notifications.welcomeTitle',
      messageKey: 'notifications.welcomeMessage',
      read: false,
      timestamp: Date.now(),
    },
  ],
  aiMessages: [],
  theme: getInitialTheme(),
  language: getCurrentLanguage(),
  sidebarCollapsed: window.innerWidth < 1024,
  mobileSidebarOpen: false,
  commandPaletteOpen: false,
  currentPage: 'dashboard',
  loading: true,
  initialized: false,
};

let _state = { ...defaultState };
const _listeners = {};

export const store = {
  get(key) {
    return _state[key];
  },

  set(key, value) {
    _state[key] = value;
    this._notify(key, value);
  },

  update(key, updater) {
    const current = _state[key];
    const next = updater(current);
    this.set(key, next);
  },

  getAll() {
    return { ..._state };
  },

  subscribe(key, callback) {
    if (!_listeners[key]) _listeners[key] = [];
    _listeners[key].push(callback);
    return () => {
      _listeners[key] = _listeners[key].filter((cb) => cb !== callback);
    };
  },

  _notify(key, value) {
    if (_listeners[key]) {
      _listeners[key].forEach((cb) => cb(value));
    }
    if (_listeners['*']) {
      _listeners['*'].forEach((cb) => cb(key, value));
    }
  },

  reset() {
    _state = {
      ...defaultState,
      theme: getInitialTheme(),
      language: getCurrentLanguage(),
      loading: false,
      initialized: true,
    };
    Object.keys(_listeners).forEach((key) => {
      this._notify(key, _state[key]);
    });
  },
};
