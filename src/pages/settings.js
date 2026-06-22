// DevStack — Settings & Profile Page
import { store } from '../store.js';
import { logoutUser, updateUserProfile, changePassword } from '../auth.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { navigate } from '../router.js';

export function renderSettings() {
  const content = document.getElementById('page-content');
  const user = store.get('user');
  const bookmarks = store.get('bookmarks') || [];
  const snippets = store.get('snippets') || [];
  const notes = store.get('notes') || [];
  
  // Read notifications preference from localStorage (default to true)
  const notifsEnabled = localStorage.getItem('notifications_enabled') !== 'false';

  content.innerHTML = `
    <div class="settings-page animate-fade-in-up" style="max-width:1000px">
      <h2 class="text-display-sm" style="margin-bottom:2rem">Ayarlar & Profil</h2>
      
      <div class="profile__grid">
        <!-- User Card & Stats -->
        <div class="profile__card">
          <div class="profile__avatar-section">
            <div class="profile__avatar-large">${(user?.displayName || 'K').charAt(0).toUpperCase()}</div>
            <div>
              <h3 class="text-headline-md">${user?.displayName || 'Kullanıcı'}</h3>
              <p style="color:var(--outline);font-size:0.875rem">@${user?.username || 'kullanici'} • ${user?.email || ''}</p>
              <span class="badge badge-primary" style="margin-top:0.5rem">Pro Plan</span>
            </div>
          </div>

          <div class="profile__stats">
            <div class="profile__stat">
              <span class="profile__stat-value">${bookmarks.length}</span>
              <span class="profile__stat-label">Yer İmi</span>
            </div>
            <div class="profile__stat">
              <span class="profile__stat-value">${snippets.length}</span>
              <span class="profile__stat-label">Snippet</span>
            </div>
            <div class="profile__stat">
              <span class="profile__stat-value">${notes.length}</span>
              <span class="profile__stat-label">Not</span>
            </div>
          </div>
        </div>

        <!-- Settings Options -->
        <div class="profile__settings">
          
          <!-- General Preferences -->
          <div class="card" style="margin-bottom:1.5rem">
            <h3 class="text-title-md" style="margin-bottom:1.25rem">Uygulama Tercihleri</h3>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <p style="font-weight:600;font-size:0.875rem">Bildirimler</p>
                <p style="font-size:0.75rem;color:var(--outline)">Uygulama içi bildirimleri aç/kapa</p>
              </div>
              <label style="position:relative;width:3rem;height:1.5rem;cursor:pointer">
                <input type="checkbox" style="display:none" id="notif-toggle" ${notifsEnabled ? 'checked' : ''} />
                <span class="toggle-bg" style="position:absolute;inset:0;background:${notifsEnabled ? 'var(--primary)' : 'rgba(255,255,255,0.1)'};border-radius:var(--radius-full);transition:all 0.2s"></span>
                <span class="toggle-knob" style="position:absolute;top:0.125rem;left:0.125rem;width:1.25rem;height:1.25rem;background:white;border-radius:50%;transition:all 0.2s;transform:${notifsEnabled ? 'translateX(1.5rem)' : 'translateX(0)'}"></span>
              </label>
            </div>
          </div>

          <!-- Personal Info -->
          <div class="card" style="margin-bottom:1.5rem">
            <h3 class="text-title-md" style="margin-bottom:1.25rem">Kişisel Bilgiler</h3>
            <form id="profile-name-form" style="display:flex;flex-direction:column;gap:1rem">
              <div class="auth-field">
                <label class="input-label">AD SOYAD</label>
                <input type="text" class="input-field" id="profile-name" value="${user?.displayName || ''}" placeholder="Adınız Soyadınız" />
              </div>
              <div class="auth-field">
                <label class="input-label">KULLANICI ADI</label>
                <input type="text" class="input-field" id="profile-username" value="${user?.username || ''}" placeholder="Kullanıcı Adınız" />
              </div>
              <div class="auth-field">
                <label class="input-label">E-POSTA</label>
                <input type="email" class="input-field" value="${user?.email || ''}" disabled style="opacity:0.5;cursor:not-allowed" />
                <span style="font-size:0.6875rem;color:var(--outline);margin-top:0.25rem">E-posta değişikliği şu an desteklenmiyor</span>
              </div>
              <button type="submit" class="btn btn-primary btn-sm" style="align-self:flex-start">Değişiklikleri Kaydet</button>
            </form>
          </div>

          <!-- Password -->
          <div class="card" style="margin-bottom:1.5rem">
            <h3 class="text-title-md" style="margin-bottom:1.25rem">Şifre Değiştir</h3>
            <form id="profile-pass-form" style="display:flex;flex-direction:column;gap:1rem">
              <div class="auth-field">
                <label class="input-label">MEVCUT ŞİFRE</label>
                <input type="password" class="input-field" id="profile-current-pass" placeholder="••••••••" />
              </div>
              <div class="auth-field">
                <label class="input-label">YENİ ŞİFRE</label>
                <input type="password" class="input-field" id="profile-new-pass" placeholder="En az 6 karakter" />
              </div>
              <button type="submit" class="btn btn-secondary btn-sm" style="align-self:flex-start">Şifreyi Güncelle</button>
            </form>
          </div>

          <!-- Logout -->
          <div class="card" style="border-color:rgba(255,180,171,0.1)">
            <h3 class="text-title-md" style="margin-bottom:0.75rem;color:var(--error)">Tehlikeli Alan</h3>
            <p style="font-size:0.875rem;color:var(--outline);margin-bottom:1.25rem">Oturumu kapatmak tüm yerel önbelleği temizleyecektir.</p>
            <button class="btn btn-danger btn-sm" id="profile-logout">
              <span class="material-symbols-outlined" style="font-size:1.125rem">logout</span>
              Çıkış Yap
            </button>
          </div>
          
        </div>
      </div>
    </div>
  `;

  // Notifications Toggle
  const notifToggle = document.getElementById('notif-toggle');
  notifToggle?.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    localStorage.setItem('notifications_enabled', isChecked);
    
    // Animate the toggle manually since it's custom CSS
    const bg = e.target.parentElement.querySelector('.toggle-bg');
    const knob = e.target.parentElement.querySelector('.toggle-knob');
    if (isChecked) {
      bg.style.background = 'var(--primary)';
      knob.style.transform = 'translateX(1.5rem)';
      showToast('Bildirimler açıldı', 'success');
    } else {
      bg.style.background = 'rgba(255,255,255,0.1)';
      knob.style.transform = 'translateX(0)';
      showToast('Bildirimler kapatıldı', 'info');
    }
  });

  // Profile info update
  document.getElementById('profile-name-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('profile-name').value.trim();
    const username = document.getElementById('profile-username').value.trim();
    if (!name || !username) { showToast('Ad soyad ve kullanıcı adı boş olamaz', 'error'); return; }
    try {
      await updateUserProfile({ displayName: name, username });
      showToast('Profil güncellendi!', 'success');
    } catch (err) {
      showToast(err.message || 'Bir hata oluştu', 'error');
    }
  });

  // Password change
  document.getElementById('profile-pass-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const current = document.getElementById('profile-current-pass').value;
    const newPass = document.getElementById('profile-new-pass').value;
    if (!current || !newPass) { showToast('Tüm alanları doldurun', 'error'); return; }
    if (newPass.length < 6) { showToast('Yeni şifre en az 6 karakter olmalı', 'error'); return; }
    try {
      await changePassword(current, newPass);
      showToast('Şifre başarıyla güncellendi!', 'success');
      document.getElementById('profile-current-pass').value = '';
      document.getElementById('profile-new-pass').value = '';
    } catch (err) {
      showToast('Şifre güncellenemedi. Mevcut şifrenizi kontrol edin.', 'error');
    }
  });

  // Logout
  document.getElementById('profile-logout')?.addEventListener('click', () => {
    showModal({
      title: 'Çıkış Yap',
      message: 'Oturumunuzu kapatmak istediğinize emin misiniz?',
      confirmText: 'Çıkış Yap',
      type: 'danger',
      onConfirm: async () => {
        try {
          await logoutUser();
          store.set('user', null);
          navigate('/login');
          showToast('Başarıyla çıkış yapıldı', 'info');
        } catch (err) {
          showToast('Çıkış hatası', 'error');
        }
      }
    });
  });
}
