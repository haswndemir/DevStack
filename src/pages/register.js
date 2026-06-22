// DevStack — Register Page
import { registerUser } from '../auth.js';
import { showToast } from '../components/toast.js';
import { navigate } from '../router.js';
import { validateEmail, validatePassword, validateRequired, getErrorMessage } from '../utils/validators.js';

export function renderRegister() {
  const container = document.getElementById('page-content') || document.getElementById('app');
  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-card animate-scale-in">
        <div class="auth-header">
          <div class="auth-logo">D</div>
          <h1 class="auth-title">DevStack</h1>
          <p class="auth-subtitle">Yeni hesap oluştur</p>
        </div>
        <form class="auth-form" id="register-form">
          <div class="auth-field">
            <label class="input-label">AD SOYAD</label>
            <input type="text" class="input-field" id="reg-name" placeholder="Adınız Soyadınız" required />
            <span class="auth-error" id="name-error"></span>
          </div>
          <div class="auth-field">
            <label class="input-label">KULLANICI ADI</label>
            <input type="text" class="input-field" id="reg-username" placeholder="benzersiz_kullanici" required />
            <span class="auth-error" id="username-error"></span>
          </div>
          <div class="auth-field">
            <label class="input-label">E-POSTA</label>
            <input type="email" class="input-field" id="reg-email" placeholder="ornek@email.com" required />
            <span class="auth-error" id="email-error"></span>
          </div>
          <div class="auth-field">
            <label class="input-label">ŞİFRE</label>
            <input type="password" class="input-field" id="reg-password" placeholder="En az 6 karakter" required />
            <span class="auth-error" id="password-error"></span>
          </div>
          <div class="auth-field">
            <label class="input-label">ŞİFRE TEKRAR</label>
            <input type="password" class="input-field" id="reg-password2" placeholder="Şifrenizi tekrar girin" required />
            <span class="auth-error" id="password2-error"></span>
          </div>
          <button type="submit" class="btn btn-primary auth-submit" id="register-btn">
            <span class="material-symbols-outlined" style="font-size:1.125rem">person_add</span>
            Kayıt Ol
          </button>
          <div class="auth-error-global" id="register-error"></div>
        </form>
        <div class="auth-footer">
          <p>Zaten hesabın var mı? <a href="#/login" class="auth-link">Giriş Yap</a></p>
        </div>
      </div>
      <div class="auth-decorative">
        <div class="auth-glow auth-glow--1"></div>
        <div class="auth-glow auth-glow--2"></div>
      </div>
    </div>
  `;

  const form = document.getElementById('register-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const password2 = document.getElementById('reg-password2').value;
    const btn = document.getElementById('register-btn');
    const errorEl = document.getElementById('register-error');

    errorEl.textContent = '';
    document.querySelectorAll('.auth-error').forEach(el => el.textContent = '');

    let hasError = false;
    if (!validateRequired(name)) { document.getElementById('name-error').textContent = 'Ad soyad gerekli'; hasError = true; }
    if (!validateRequired(username)) { document.getElementById('username-error').textContent = 'Kullanıcı adı gerekli'; hasError = true; }
    if (!validateEmail(email)) { document.getElementById('email-error').textContent = 'Geçerli bir e-posta girin'; hasError = true; }
    if (!validatePassword(password)) { document.getElementById('password-error').textContent = 'Şifre en az 6 karakter olmalı'; hasError = true; }
    if (password !== password2) { document.getElementById('password2-error').textContent = 'Şifreler eşleşmiyor'; hasError = true; }
    if (hasError) return;

    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner" style="width:1.25rem;height:1.25rem;border-width:2px"></span> Kayıt oluşturuluyor...';

    try {
      await registerUser(email, password, name, username);
      showToast('Hesabınız başarıyla oluşturuldu!', 'success');
      navigate('/dashboard');
    } catch (err) {
      errorEl.textContent = getErrorMessage(err.code);
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1.125rem">person_add</span> Kayıt Ol';
    }
  });
}
