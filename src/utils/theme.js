// src/utils/theme.js - Central Theme Management System
import { store } from '../store.js';

export function getTheme() {
  return store.get('theme') || localStorage.getItem('devstack_theme') || 'dark';
}

export function applyTheme(theme) {
  const targetTheme = theme === 'light' ? 'light' : 'dark';
  store.set('theme', targetTheme);
  localStorage.setItem('devstack_theme', targetTheme);
  document.documentElement.setAttribute('data-theme', targetTheme);
  document.documentElement.classList.remove('theme-dark', 'theme-light', 'dark', 'light');
  document.documentElement.classList.add(`theme-${targetTheme}`, targetTheme);

  // Dispatch global event for Monaco, Topbar, Settings, etc.
  window.dispatchEvent(
    new CustomEvent('devstack-theme-changed', {
      detail: { theme: targetTheme },
    })
  );
  return targetTheme;
}

export function toggleTheme() {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  return applyTheme(next);
}

export function initTheme() {
  const theme = getTheme();
  applyTheme(theme);
}
