// DevStack — Register Page
import { registerUser } from '../auth.js';
import { showToast } from '../components/toast.js';
import { validateEmail, validatePassword, validateRequired, getErrorMessage } from '../utils/validators.js';
import { t, getCurrentLanguage } from '../i18n/index.js';

export function renderRegister() {
  const container = document.getElementById('page-content') || document.getElementById('app');
  if (!container) return;

  container.innerHTML = `
    <div class="auth-page animate-fade-in">
      <div class="auth-card animate-scale-in">
        <div class="auth-header">
          <div class="auth-logo">D</div>
          <h1 class="auth-title">DevStack</h1>
          <p class="auth-subtitle">${t('auth.registerSubtitle')}</p>
        </div>
        <form class="auth-form" id="register-form">
          <div class="auth-field">
            <label class="input-label">${t('auth.displayName')}</label>
            <input type="text" class="input-field" id="reg-name" placeholder="Alex Morgan" required />
            <span class="auth-error" id="name-error"></span>
          </div>
          <div class="auth-field">
            <label class="input-label">${t('auth.username')}</label>
            <input type="text" class="input-field" id="reg-username" placeholder="alexm" required />
            <span class="auth-error" id="username-error"></span>
          </div>
          <div class="auth-field">
            <label class="input-label">${t('auth.email')}</label>
            <input type="email" class="input-field" id="reg-email" placeholder="alex@developer.io" required />
            <span class="auth-error" id="email-error"></span>
          </div>
          <div class="auth-field">
            <label class="input-label">${t('auth.password')}</label>
            <input type="password" class="input-field" id="reg-password" placeholder="••••••••" required />
            <span class="auth-error" id="password-error"></span>
          </div>
          <div class="auth-field">
            <label class="input-label">${t('auth.confirmPassword')}</label>
            <input type="password" class="input-field" id="reg-password2" placeholder="••••••••" required />
            <span class="auth-error" id="password2-error"></span>
          </div>
          <button type="submit" class="btn btn-primary auth-submit" id="register-btn">
            <span class="material-symbols-outlined" style="font-size:1.125rem">person_add</span>
            ${t('auth.registerButton')}
          </button>
          <div class="auth-error-global" id="register-error"></div>
        </form>
        <div class="auth-footer">
          <p>${t('auth.haveAccount')} <a href="#/login" class="auth-link">${t('auth.loginLink')}</a></p>
        </div>
      </div>
      <div class="auth-decorative">
        <div class="auth-glow auth-glow--1"></div>
        <div class="auth-glow auth-glow--2"></div>
      </div>
    </div>
  `;

  const form = document.getElementById('register-form');
  let isSubmitting = false;

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const name = document.getElementById('reg-name')?.value.trim();
    const username = document.getElementById('reg-username')?.value.trim();
    const email = document.getElementById('reg-email')?.value.trim();
    const password = document.getElementById('reg-password')?.value;
    const password2 = document.getElementById('reg-password2')?.value;
    const btn = document.getElementById('register-btn');
    const errorEl = document.getElementById('register-error');

    if (errorEl) errorEl.textContent = '';
    document.querySelectorAll('.auth-error').forEach((el) => (el.textContent = ''));

    let hasError = false;
    if (!validateRequired(name)) {
      document.getElementById('name-error').textContent = t('common.requiredField');
      hasError = true;
    }
    if (!validateRequired(username) || username.length < 3) {
      document.getElementById('username-error').textContent = t('auth.usernameRequired');
      hasError = true;
    }
    if (!validateEmail(email)) {
      document.getElementById('email-error').textContent = t('auth.email');
      hasError = true;
    }
    if (!validatePassword(password)) {
      document.getElementById('password-error').textContent = t('auth.password');
      hasError = true;
    }
    if (password !== password2) {
      document.getElementById('password2-error').textContent = t('auth.passwordsDoNotMatch');
      hasError = true;
    }
    if (hasError) return;

    isSubmitting = true;
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="loading-spinner" style="width:1.25rem;height:1.25rem;border-width:2px"></span> ${t('common.loading')}`;
    }

    try {
      await registerUser(email, password, name, username);
      showToast(t('auth.registerSuccess'), 'success');
    } catch (err) {
      isSubmitting = false;
      if (errorEl) errorEl.textContent = getErrorMessage(err, getCurrentLanguage());
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:1.125rem">person_add</span> ${t('auth.registerButton')}`;
      }
    }
  });
}
