// DevStack — Global State Store (Observer Pattern)

const _state = {
  user: null,
  bookmarks: [],
  snippets: [],
  notes: [],
  aiMessages: [],
  sidebarCollapsed: window.innerWidth < 1024,
  mobileSidebarOpen: false,
  currentPage: 'dashboard',
  loading: true,
  initialized: false,
};

const _listeners = {};

export const store = {
  get(key) {
    return _state[key];
  },

  set(key, value) {
    _state[key] = value;
    this._notify(key, value);
  },

  getAll() {
    return { ..._state };
  },

  subscribe(key, callback) {
    if (!_listeners[key]) _listeners[key] = [];
    _listeners[key].push(callback);
    // Return unsubscribe function
    return () => {
      _listeners[key] = _listeners[key].filter(cb => cb !== callback);
    };
  },

  _notify(key, value) {
    if (_listeners[key]) {
      _listeners[key].forEach(cb => cb(value));
    }
    // Also notify wildcard listeners
    if (_listeners['*']) {
      _listeners['*'].forEach(cb => cb(key, value));
    }
  }
};
