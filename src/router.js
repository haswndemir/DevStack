// DevStack — SPA Router (Hash-based)
import { store } from './store.js';

const routes = {};
let currentCleanup = null;

export function registerRoute(path, handler) {
  routes[path] = handler;
}

export function navigate(path) {
  window.location.hash = path;
}

export function getCurrentRoute() {
  const hash = window.location.hash.slice(1) || '/dashboard';
  return hash;
}

async function handleRoute() {
  const path = getCurrentRoute();
  const user = store.get('user');

  // Auth guard
  const publicRoutes = ['/login', '/register'];
  if (!user && !publicRoutes.includes(path)) {
    navigate('/login');
    return;
  }
  if (user && publicRoutes.includes(path)) {
    navigate('/dashboard');
    return;
  }

  // Cleanup previous page
  if (currentCleanup && typeof currentCleanup === 'function') {
    currentCleanup();
    currentCleanup = null;
  }

  // Find route handler
  const handler = routes[path];
  if (handler) {
    const pageName = path.slice(1) || 'dashboard';
    store.set('currentPage', pageName);
    // Close mobile sidebar on navigation
    store.set('mobileSidebarOpen', false);
    currentCleanup = await handler();
  } else {
    // 404 — redirect to dashboard
    navigate(user ? '/dashboard' : '/login');
  }
}

export function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  // Don't call handleRoute here — main.js will call it after auth check
}

export function routeAfterAuth() {
  handleRoute();
}
