// DevStack — Dashboard Page
import { store } from '../store.js';
import { navigate } from '../router.js';
import { t } from '../i18n/index.js';

export function renderDashboard() {
  const content = document.getElementById('page-content');
  if (!content) return;

  const user = store.get('user');
  const bookmarks = store.get('bookmarks') || [];
  const snippets = store.get('snippets') || [];
  const notes = store.get('notes') || [];
  const name = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Developer';

  content.innerHTML = `
    <div class="dashboard animate-fade-in-up">
      <!-- Welcome Header -->
      <section class="dashboard__welcome">
        <div class="dashboard__welcome-text">
          <h2 class="text-display-sm">${t('dashboard.greeting', { name })}</h2>
          <p class="dashboard__welcome-sub">${t('dashboard.subtitle')}</p>
        </div>
        <div class="dashboard__welcome-actions">
          <button class="btn btn-secondary" id="dash-new-note">
            <span class="material-symbols-outlined" style="font-size:1.125rem">edit_note</span>
            ${t('dashboard.newNote')}
          </button>
          <button class="btn btn-primary" id="dash-ask-ai">
            <span class="material-symbols-outlined" style="font-size:1.125rem">smart_toy</span>
            ${t('dashboard.askAI')}
          </button>
        </div>
      </section>

      <!-- Stats Bento Grid -->
      <section class="dashboard__stats">
        <div class="stat-card glass-card" id="card-stat-bookmarks" style="cursor:pointer">
          <div class="stat-card__header">
            <div class="stat-card__icon stat-card__icon--primary">
              <span class="material-symbols-outlined">bookmarks</span>
            </div>
            <span class="badge badge-primary">${t('common.all')}</span>
          </div>
          <div class="stat-card__body">
            <p class="stat-card__value">${bookmarks.length}</p>
            <p class="stat-card__label">${t('dashboard.statBookmarks')}</p>
          </div>
        </div>

        <div class="stat-card glass-card" id="card-stat-snippets" style="cursor:pointer">
          <div class="stat-card__header">
            <div class="stat-card__icon stat-card__icon--secondary">
              <span class="material-symbols-outlined">code</span>
            </div>
            <span class="badge badge-secondary">${snippets.length} ${t('common.items')}</span>
          </div>
          <div class="stat-card__body">
            <p class="stat-card__value">${snippets.length}</p>
            <p class="stat-card__label">${t('dashboard.statSnippets')}</p>
          </div>
        </div>

        <div class="stat-card glass-card" id="card-stat-notes" style="cursor:pointer">
          <div class="stat-card__header">
            <div class="stat-card__icon stat-card__icon--tertiary">
              <span class="material-symbols-outlined">description</span>
            </div>
            <span class="badge badge-primary">${t('notes.markdownBadge')}</span>
          </div>
          <div class="stat-card__body">
            <p class="stat-card__value">${notes.length}</p>
            <p class="stat-card__label">${t('dashboard.statNotes')}</p>
          </div>
        </div>
      </section>

      <!-- Main Grid -->
      <div class="dashboard__grid">
        <!-- Recent Bookmarks -->
        <section class="dashboard__bookmarks">
          <div class="dashboard__section-header">
            <h3 class="text-title-lg" style="display:flex;align-items:center;gap:0.5rem">
              <span class="material-symbols-outlined" style="color:var(--primary)">bookmarks</span>
              ${t('dashboard.recentBookmarks')}
            </h3>
            <button class="btn-text dashboard__see-all" id="dash-see-all-bookmarks">${t('dashboard.viewAll')}</button>
          </div>
          <div class="dashboard__bookmark-list">
            ${bookmarks.length === 0 ? `
              <div class="empty-state" style="padding:2.5rem 1rem">
                <span class="material-symbols-outlined" style="font-size:2.5rem;color:var(--outline);opacity:0.5">bookmark_border</span>
                <p style="font-size:0.875rem;color:var(--outline)">${t('common.emptyState')}</p>
                <button class="btn btn-sm btn-primary" id="dash-add-first-bookmark" style="margin-top:0.5rem">${t('bookmarks.addBookmark')}</button>
              </div>
            ` : bookmarks.slice(0, 5).map((bm, i) => `
              <div class="dashboard__bookmark-item" data-idx="${i}">
                <div class="dashboard__bookmark-info">
                  <div class="dashboard__bookmark-icon">
                    <span class="material-symbols-outlined" style="font-size:1.25rem;color:var(--primary)">link</span>
                  </div>
                  <div style="min-width:0">
                    <h4 class="dashboard__bookmark-title">${escapeHtml(bm.title || bm.url)}</h4>
                    <p class="dashboard__bookmark-url text-mono">${escapeHtml(bm.url || '')}</p>
                  </div>
                </div>
                <button class="btn-icon" data-url="${bm.url}" title="${t('bookmarks.openLink')}">
                  <span class="material-symbols-outlined" style="font-size:1.125rem">open_in_new</span>
                </button>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Recent Snippets & Notes Bento -->
        <section class="dashboard__side-col">
          <!-- Recent Snippets -->
          <div class="glass-card" style="padding:1.25rem;margin-bottom:1.5rem">
            <div class="dashboard__section-header">
              <h3 class="text-title-lg" style="display:flex;align-items:center;gap:0.5rem">
                <span class="material-symbols-outlined" style="color:var(--secondary)">code</span>
                ${t('dashboard.recentSnippets')}
              </h3>
              <button class="btn-text dashboard__see-all" id="dash-see-all-snippets">${t('dashboard.viewAll')}</button>
            </div>
            <div class="dashboard__snippet-list">
              ${snippets.length === 0 ? `
                <p style="font-size:0.8125rem;color:var(--outline);text-align:center;padding:1.5rem 0">${t('common.emptyState')}</p>
              ` : snippets.slice(0, 3).map((sn) => `
                <div class="dashboard__snippet-preview" data-id="${sn.id}" style="cursor:pointer;padding:0.75rem;border-radius:var(--radius-md);background:var(--surface-container-low);margin-bottom:0.5rem;display:flex;align-items:center;justify-content:space-between">
                  <div>
                    <p style="font-size:0.875rem;font-weight:600;color:var(--on-surface)">${escapeHtml(sn.title)}</p>
                    <span style="font-size:0.6875rem;color:var(--primary);font-family:var(--font-mono)">${escapeHtml(sn.language || 'code')}</span>
                  </div>
                  <span class="material-symbols-outlined" style="font-size:1rem;color:var(--outline)">chevron_right</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Quick Actions Panel -->
          <div class="glass-card" style="padding:1.25rem">
            <h3 class="text-title-lg" style="margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem">
              <span class="material-symbols-outlined" style="color:var(--tertiary)">bolt</span>
              ${t('dashboard.quickActions')}
            </h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
              <button class="btn btn-outline" id="dash-quick-bm" style="justify-content:flex-start;padding:0.75rem">
                <span class="material-symbols-outlined" style="color:var(--primary)">bookmark_add</span>
                <span style="font-size:0.8125rem">${t('dashboard.newBookmark')}</span>
              </button>
              <button class="btn btn-outline" id="dash-quick-sn" style="justify-content:flex-start;padding:0.75rem">
                <span class="material-symbols-outlined" style="color:var(--secondary)">add_code</span>
                <span style="font-size:0.8125rem">${t('dashboard.newSnippet')}</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  `;

  // Attach Event Handlers
  content.querySelector('#dash-new-note')?.addEventListener('click', () => navigate('/notes'));
  content.querySelector('#dash-ask-ai')?.addEventListener('click', () => navigate('/ai-assistant'));
  content.querySelector('#card-stat-bookmarks')?.addEventListener('click', () => navigate('/bookmarks'));
  content.querySelector('#card-stat-snippets')?.addEventListener('click', () => navigate('/snippets'));
  content.querySelector('#card-stat-notes')?.addEventListener('click', () => navigate('/notes'));
  content.querySelector('#dash-see-all-bookmarks')?.addEventListener('click', () => navigate('/bookmarks'));
  content.querySelector('#dash-see-all-snippets')?.addEventListener('click', () => navigate('/snippets'));
  content.querySelector('#dash-add-first-bookmark')?.addEventListener('click', () => navigate('/bookmarks'));
  content.querySelector('#dash-quick-bm')?.addEventListener('click', () => navigate('/bookmarks'));
  content.querySelector('#dash-quick-sn')?.addEventListener('click', () => navigate('/snippets'));

  content.querySelectorAll('.dashboard__bookmark-item').forEach((item) => {
    const btn = item.querySelector('button[data-url]');
    btn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const url = btn.dataset.url;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    });
    item.addEventListener('click', () => {
      const url = btn?.dataset.url;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    });
  });

  content.querySelectorAll('.dashboard__snippet-preview').forEach((item) => {
    item.addEventListener('click', () => navigate('/snippets'));
  });
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
