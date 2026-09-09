// DevStack — Login Page
import { loginUser } from '../auth.js';
import { showToast } from '../components/toast.js';
import { validateEmail, validatePassword, getErrorMessage } from '../utils/validators.js';
import { t, getCurrentLanguage } from '../i18n/index.js';

export function renderLogin() {
  const container = document.getElementById('page-content') || document.getElementById('app');
  if (!container) return;

  container.innerHTML = `
    <div class="auth-page animate-fade-in">
      <div class="auth-card animate-scale-in">
        <div class="auth-header">
          <div class="auth-logo">D</div>
          <h1 class="auth-title">DevStack</h1>
          <p class="auth-subtitle">${t('auth.loginSubtitle')}</p>
        </div>
        <form class="auth-form" id="login-form">
          <div class="auth-field">
            <label class="input-label">${t('auth.email')}</label>
            <input type="email" class="input-field" id="login-email" placeholder="alex@developer.io" required />
            <span class="auth-error" id="email-error"></span>
          </div>
          <div class="auth-field">
            <label class="input-label">${t('auth.password')}</label>
            <input type="password" class="input-field" id="login-password" placeholder="••••••••" required />
            <span class="auth-error" id="password-error"></span>
          </div>
          <button type="submit" class="btn btn-primary auth-submit" id="login-btn">
            <span class="material-symbols-outlined" style="font-size:1.125rem">login</span>
            ${t('auth.loginButton')}
          </button>
          <div class="auth-error-global" id="login-error"></div>
        </form>
        <div class="auth-footer">
          <p>${t('auth.noAccount')} <a href="#/register" class="auth-link">${t('auth.registerLink')}</a></p>
        </div>
      </div>
      <div class="auth-decorative">
        <div class="auth-glow auth-glow--1"></div>
        <div class="auth-glow auth-glow--2"></div>
      </div>
    </div>
  `;

  const form = document.getElementById('login-form');
  let isSubmitting = false;

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    const btn = document.getElementById('login-btn');
    const errorEl = document.getElementById('login-error');

    if (errorEl) errorEl.textContent = '';

    if (!validateEmail(email)) {
      const el = document.getElementById('email-error');
      if (el) el.textContent = t('auth.email');
      return;
    }
    if (!validatePassword(password)) {
      const el = document.getElementById('password-error');
      if (el) el.textContent = t('auth.password');
      return;
    }

    isSubmitting = true;
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="loading-spinner" style="width:1.25rem;height:1.25rem;border-width:2px"></span> ${t('common.loading')}`;
    }

    try {
      await loginUser(email, password);
      showToast(t('auth.loginSuccess'), 'success');
    } catch (err) {
      isSubmitting = false;
      if (errorEl) errorEl.textContent = getErrorMessage(err, getCurrentLanguage());
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:1.125rem">login</span> ${t('auth.loginButton')}`;
      }
    }
  });

  document.getElementById('login-email')?.addEventListener('input', () => {
    const el = document.getElementById('email-error');
    if (el) el.textContent = '';
  });
  document.getElementById('login-password')?.addEventListener('input', () => {
    const el = document.getElementById('password-error');
    if (el) el.textContent = '';
  });
}
