// DevStack — Login Page
import { loginUser } from '../auth.js';
import { showToast } from '../components/toast.js';
import { navigate } from '../router.js';
import { validateEmail, validatePassword, getErrorMessage } from '../utils/validators.js';

export function renderLogin() {
  const container = document.getElementById('page-content') || document.getElementById('app');
  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-card animate-scale-in">
        <div class="auth-header">
          <div class="auth-logo">D</div>
          <h1 class="auth-title">DevStack</h1>
          <p class="auth-subtitle">Geliştirici paneline giriş yap</p>
        </div>
        <form class="auth-form" id="login-form">
          <div class="auth-field">
            <label class="input-label">E-POSTA</label>
            <input type="email" class="input-field" id="login-email" placeholder="ornek@email.com" required />
            <span class="auth-error" id="email-error"></span>
          </div>
          <div class="auth-field">
            <label class="input-label">ŞİFRE</label>
            <input type="password" class="input-field" id="login-password" placeholder="••••••••" required />
            <span class="auth-error" id="password-error"></span>
          </div>
          <button type="submit" class="btn btn-primary auth-submit" id="login-btn">
            <span class="material-symbols-outlined" style="font-size:1.125rem">login</span>
            Giriş Yap
          </button>
          <div class="auth-error-global" id="login-error"></div>
        </form>
        <div class="auth-footer">
          <p>Hesabın yok mu? <a href="#/register" class="auth-link">Kayıt Ol</a></p>
        </div>
      </div>
      <div class="auth-decorative">
        <div class="auth-glow auth-glow--1"></div>
        <div class="auth-glow auth-glow--2"></div>
      </div>
    </div>
  `;

  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');
    const errorEl = document.getElementById('login-error');

    errorEl.textContent = '';

    if (!validateEmail(email)) {
      document.getElementById('email-error').textContent = 'Geçerli bir e-posta girin';
      return;
    }
    if (!validatePassword(password)) {
      document.getElementById('password-error').textContent = 'Şifre en az 6 karakter olmalı';
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner" style="width:1.25rem;height:1.25rem;border-width:2px"></span> Giriş yapılıyor...';

    try {
      await loginUser(email, password);
      showToast('Başarıyla giriş yapıldı!', 'success');
      navigate('/dashboard');
    } catch (err) {
      errorEl.textContent = getErrorMessage(err.code);
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1.125rem">login</span> Giriş Yap';
    }
  });

  // Clear field errors on input
  document.getElementById('login-email').addEventListener('input', () => {
    document.getElementById('email-error').textContent = '';
  });
  document.getElementById('login-password').addEventListener('input', () => {
    document.getElementById('password-error').textContent = '';
  });
}
