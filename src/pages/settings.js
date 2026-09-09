// DevStack — Settings & Profile Page
import { store } from '../store.js';
import { logoutUser, updateUserProfile, changePassword } from '../auth.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { navigate } from '../router.js';
import { t, changeLanguage, getCurrentLanguage } from '../i18n/index.js';
import { getErrorMessage } from '../utils/validators.js';
import { getTheme, applyTheme } from '../utils/theme.js';

export function renderSettings() {
  const content = document.getElementById('page-content');
  if (!content) return;

  function render() {
    const user = store.get('user');
    const bookmarks = store.get('bookmarks') || [];
    const snippets = store.get('snippets') || [];
    const notes = store.get('notes') || [];

    const currentLang = getCurrentLanguage();
    const currentTheme = getTheme();
    const userInitial = (user?.displayName || user?.email || 'D').charAt(0).toUpperCase();

    content.innerHTML = `
      <div class="settings-page animate-fade-in-up" style="max-width:960px;margin:0 auto">
        <div style="margin-bottom:2rem">
          <h2 class="text-display-sm">${t('settings.title')}</h2>
          <p style="color:var(--text-muted);font-size:0.875rem">${t('settings.subtitle')}</p>
        </div>

        <div class="profile__grid" style="display:grid;grid-template-columns:1fr 2fr;gap:2rem">
          <!-- Left Column: User Summary Card -->
          <div>
            <div class="card glass-card" style="padding:1.5rem;text-align:center">
              <div style="width:4.5rem;height:4.5rem;border-radius:var(--radius-full);background:linear-gradient(135deg, var(--primary-container), var(--primary));color:var(--on-primary);display:inline-flex;align-items:center;justify-content:center;font-size:2rem;font-weight:800;margin-bottom:1rem;box-shadow:var(--shadow-md)">
                ${userInitial}
              </div>
              <h3 class="text-title-lg" style="margin-bottom:0.25rem;color:var(--text-primary)">${escapeHtml(user?.displayName || 'Developer')}</h3>
              <p style="color:var(--text-muted);font-size:0.8125rem">@${escapeHtml(user?.username || 'user')}</p>
              <p style="color:var(--text-muted);font-size:0.75rem;margin-top:0.25rem">${escapeHtml(user?.email || '')}</p>

              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem;margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--outline-variant)">
                <div>
                  <p style="font-size:1.25rem;font-weight:700;color:var(--primary)">${bookmarks.length}</p>
                  <p style="font-size:0.6875rem;color:var(--text-muted)">${t('nav.bookmarks')}</p>
                </div>
                <div>
                  <p style="font-size:1.25rem;font-weight:700;color:var(--secondary)">${snippets.length}</p>
                  <p style="font-size:0.6875rem;color:var(--text-muted)">${t('nav.snippets')}</p>
                </div>
                <div>
                  <p style="font-size:1.25rem;font-weight:700;color:var(--tertiary)">${notes.length}</p>
                  <p style="font-size:0.6875rem;color:var(--text-muted)">${t('nav.notes')}</p>
                </div>
              </div>

              <button class="btn btn-outline" id="btn-logout-settings" style="width:100%;margin-top:1.5rem;color:var(--error)">
                <span class="material-symbols-outlined">logout</span>
                ${t('nav.logout')}
              </button>
            </div>
          </div>

          <!-- Right Column: Settings Sections -->
          <div style="display:flex;flex-direction:column;gap:1.5rem">
            <!-- Appearance & Theme Section -->
            <div class="card glass-card" style="padding:1.5rem">
              <h3 class="text-title-md" style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem;color:var(--text-primary)">
                <span class="material-symbols-outlined" style="color:var(--primary)">palette</span>
                ${t('settings.tabAppearance')}
              </h3>
              <div style="display:flex;background:var(--surface-container-high);padding:0.25rem;border-radius:var(--radius-lg);gap:0.25rem;border:1px solid var(--outline-variant)">
                <button class="btn" id="btn-theme-dark" style="flex:1;justify-content:center;padding:0.75rem;border-radius:var(--radius-md);transition:all var(--transition-fast);${currentTheme === 'dark' ? 'background:var(--primary);color:var(--on-primary);font-weight:700;box-shadow:var(--shadow-sm);' : 'background:transparent;color:var(--text-secondary);'}">
                  <span class="material-symbols-outlined" style="font-size:1.25rem">dark_mode</span>
                  ${t('settings.themeDark')}
                </button>
                <button class="btn" id="btn-theme-light" style="flex:1;justify-content:center;padding:0.75rem;border-radius:var(--radius-md);transition:all var(--transition-fast);${currentTheme === 'light' ? 'background:var(--primary);color:var(--on-primary);font-weight:700;box-shadow:var(--shadow-sm);' : 'background:transparent;color:var(--text-secondary);'}">
                  <span class="material-symbols-outlined" style="font-size:1.25rem">light_mode</span>
                  ${t('settings.themeLight')}
                </button>
              </div>
            </div>

            <!-- Language Section (TR / EN only) -->
            <div class="card glass-card" style="padding:1.5rem">
              <h3 class="text-title-md" style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem;color:var(--text-primary)">
                <span class="material-symbols-outlined" style="color:var(--primary)">language</span>
                ${t('settings.tabLanguage')}
              </h3>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
                <button class="btn ${currentLang === 'tr' ? 'btn-primary' : 'btn-outline'}" id="btn-lang-tr" style="justify-content:center;padding:0.875rem;font-weight:700">
                  TR ${t('settings.turkish')}
                </button>
                <button class="btn ${currentLang === 'en' ? 'btn-primary' : 'btn-outline'}" id="btn-lang-en" style="justify-content:center;padding:0.875rem;font-weight:700">
                  EN ${t('settings.english')}
                </button>
              </div>
            </div>

            <!-- Profile Info Form -->
            <div class="card glass-card" style="padding:1.5rem">
              <h3 class="text-title-md" style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem">
                <span class="material-symbols-outlined" style="color:var(--primary)">person</span>
                ${t('settings.tabProfile')}
              </h3>
              <form id="settings-profile-form" style="display:flex;flex-direction:column;gap:1rem">
                <div class="auth-field">
                  <label class="input-label">${t('settings.displayNameLabel')}</label>
                  <input type="text" class="input-field" id="settings-name-input" value="${escapeHtml(user?.displayName || '')}" required />
                </div>
                <div class="auth-field">
                  <label class="input-label">${t('settings.usernameLabel')}</label>
                  <input type="text" class="input-field" id="settings-username-input" value="${escapeHtml(user?.username || '')}" required />
                </div>
                <div class="auth-field">
                  <label class="input-label">${t('settings.emailLabel')}</label>
                  <input type="email" class="input-field" value="${escapeHtml(user?.email || '')}" disabled style="opacity:0.6;cursor:not-allowed" />
                </div>
                <button type="submit" class="btn btn-primary" style="align-self:flex-start">
                  ${t('settings.saveProfile')}
                </button>
              </form>
            </div>

            <!-- Password Change Form -->
            <div class="card glass-card" style="padding:1.5rem">
              <h3 class="text-title-md" style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem">
                <span class="material-symbols-outlined" style="color:var(--primary)">lock</span>
                ${t('settings.tabSecurity')}
              </h3>
              <form id="settings-pass-form" style="display:flex;flex-direction:column;gap:1rem">
                <div class="auth-field">
                  <label class="input-label">${t('settings.currentPassword')}</label>
                  <input type="password" class="input-field" id="settings-current-pass" placeholder="••••••••" required />
                </div>
                <div class="auth-field">
                  <label class="input-label">${t('settings.newPassword')}</label>
                  <input type="password" class="input-field" id="settings-new-pass" placeholder="••••••••" minlength="6" required />
                </div>
                <div class="auth-field">
                  <label class="input-label">${t('settings.confirmNewPassword')}</label>
                  <input type="password" class="input-field" id="settings-confirm-pass" placeholder="••••••••" minlength="6" required />
                </div>
                <button type="submit" class="btn btn-secondary" style="align-self:flex-start">
                  ${t('settings.updatePassword')}
                </button>
              </form>
            </div>

            <!-- Data & Storage Actions -->
            <div class="card glass-card" style="padding:1.5rem">
              <h3 class="text-title-md" style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem">
                <span class="material-symbols-outlined" style="color:var(--primary)">database</span>
                ${t('settings.tabData')}
              </h3>
              <div style="display:flex;flex-wrap:wrap;gap:1rem">
                <button class="btn btn-outline" id="btn-export-json">
                  <span class="material-symbols-outlined">download</span>
                  ${t('settings.exportData')}
                </button>
                <button class="btn btn-outline" id="btn-clear-cache">
                  <span class="material-symbols-outlined">delete_sweep</span>
                  ${t('settings.clearCache')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Theme Switch
    content.querySelector('#btn-theme-dark')?.addEventListener('click', () => {
      applyTheme('dark');
      render();
    });

    content.querySelector('#btn-theme-light')?.addEventListener('click', () => {
      applyTheme('light');
      render();
    });

    // Language Switch
    content.querySelector('#btn-lang-tr')?.addEventListener('click', async () => {
      await changeLanguage('tr');
      store.set('language', 'tr');
      render();
    });

    content.querySelector('#btn-lang-en')?.addEventListener('click', async () => {
      await changeLanguage('en');
      store.set('language', 'en');
      render();
    });

    // Profile Submit
    content.querySelector('#settings-profile-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const displayName = content.querySelector('#settings-name-input')?.value.trim();
      const username = content.querySelector('#settings-username-input')?.value.trim();

      try {
        await updateUserProfile({ displayName, username });
        const current = store.get('user') || {};
        store.set('user', { ...current, displayName, username });
        showToast(t('settings.profileUpdated'), 'success');
        render();
      } catch (err) {
        showToast(err.message || t('common.errorOccurred'), 'error');
      }
    });

    // Password Change Submit
    content.querySelector('#settings-pass-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPass = content.querySelector('#settings-current-pass')?.value || '';
      const newPass = content.querySelector('#settings-new-pass')?.value || '';
      const confirmPass = content.querySelector('#settings-confirm-pass')?.value || '';

      if (!currentPass) {
        showToast(t('settings.currentPasswordRequired'), 'error');
        return;
      }

      if (!newPass || newPass.length < 6) {
        showToast(t('settings.passwordTooShort'), 'error');
        return;
      }

      if (newPass === currentPass) {
        showToast(t('settings.passwordSameAsCurrent'), 'error');
        return;
      }

      if (newPass !== confirmPass) {
        showToast(t('settings.passwordsDoNotMatch'), 'error');
        return;
      }

      try {
        await changePassword(currentPass, newPass);
        showToast(t('settings.passwordUpdated'), 'success');
        content.querySelector('#settings-pass-form')?.reset();
      } catch (err) {
        const errorMsg = getErrorMessage(err, getCurrentLanguage());
        showToast(errorMsg, 'error');
      }
    });

    // Export Data as JSON
    content.querySelector('#btn-export-json')?.addEventListener('click', () => {
      const exportObject = {
        exportedAt: new Date().toISOString(),
        user: store.get('user'),
        bookmarks: store.get('bookmarks'),
        snippets: store.get('snippets'),
        notes: store.get('notes'),
      };
      const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devstack_export_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(t('common.success'), 'success');
    });

    // Clear Cache
    content.querySelector('#btn-clear-cache')?.addEventListener('click', () => {
      localStorage.removeItem('devstack_cache');
      showToast(t('settings.cacheCleared'), 'success');
    });

    // Logout
    content.querySelector('#btn-logout-settings')?.addEventListener('click', async () => {
      try {
        await logoutUser();
        store.reset();
        navigate('/login');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  render();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
