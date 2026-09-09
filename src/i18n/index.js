// src/i18n/index.js - Internationalization Engine for DevStack
import i18next from 'i18next';
import tr from './tr.json';
import en from './en.json';

const savedLang = localStorage.getItem('devstack_language') || (navigator.language?.startsWith('tr') ? 'tr' : 'en');

i18next.init({
  lng: savedLang,
  fallbackLng: 'en',
  resources: {
    tr: { translation: tr },
    en: { translation: en },
  },
  interpolation: {
    escapeValue: false,
  },
});

export function t(key, params = {}) {
  return i18next.t(key, params);
}

export async function changeLanguage(lang) {
  if (lang !== 'tr' && lang !== 'en') lang = 'en';
  await i18next.changeLanguage(lang);
  localStorage.setItem('devstack_language', lang);
  document.documentElement.lang = lang;
  window.dispatchEvent(new CustomEvent('devstack-language-changed', { detail: { lang } }));
}

export function getCurrentLanguage() {
  return i18next.language || 'en';
}

export default i18next;
