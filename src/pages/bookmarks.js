// DevStack — Bookmarks Page
import { store } from '../store.js';
import { addBookmark, deleteBookmark, updateBookmark } from '../db.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { validateUrl } from '../utils/validators.js';
import { t } from '../i18n/index.js';

export function renderBookmarks() {
  const content = document.getElementById('page-content');
  if (!content) return;

  let activeCategory = 'all';
  let searchQuery = '';

  const categories = [
    { key: 'all', label: t('common.all') },
    { key: 'Documentation', label: t('bookmarks.categoryDocumentation') },
    { key: 'Tools', label: t('bookmarks.categoryTools') },
    { key: 'Frameworks', label: t('bookmarks.categoryFrameworks') },
    { key: 'Cloud', label: t('bookmarks.categoryCloud') },
    { key: 'General', label: t('bookmarks.categoryGeneral') },
  ];

  function render() {
    const allBookmarks = store.get('bookmarks') || [];
    const filtered = allBookmarks.filter((bm) => {
      const matchesCategory = activeCategory === 'all' || bm.category === activeCategory;
      const matchesSearch =
        !searchQuery ||
        (bm.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bm.url || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bm.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    content.innerHTML = `
      <div class="bookmarks-page animate-fade-in-up">
        <div class="bookmarks__header">
          <div>
            <h2 class="text-display-sm">${t('bookmarks.title')}</h2>
            <p style="color:var(--outline);font-weight:500">${t('bookmarks.subtitle')}</p>
          </div>
          <button class="btn btn-primary" id="bm-open-form-btn">
            <span class="material-symbols-outlined" style="font-size:1.125rem">add</span>
            ${t('bookmarks.addBookmark')}
          </button>
        </div>

        <!-- Filter & Search Bar -->
        <div style="display:flex;flex-wrap:wrap;gap:1rem;margin:1.5rem 0;align-items:center;justify-content:space-between">
          <div class="bookmarks__filters" style="margin:0">
            ${categories.map((c) => `
              <button class="bookmarks__filter ${activeCategory === c.key ? 'bookmarks__filter--active' : ''}" data-cat="${c.key}">
                ${c.label}
              </button>
            `).join('')}
          </div>
          <div style="position:relative;width:100%;max-width:280px">
            <span class="material-symbols-outlined" style="position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);font-size:1.125rem;color:var(--outline)">search</span>
            <input type="text" class="input-field" id="bm-search-input" value="${escapeHtml(searchQuery)}" placeholder="${t('bookmarks.searchPlaceholder')}" style="padding-left:2.25rem;border-radius:var(--radius-full);font-size:0.875rem" />
          </div>
        </div>

        <!-- Bookmarks Grid -->
        <div class="bookmarks__grid">
          ${filtered.length === 0 ? `
            <div class="empty-state" style="grid-column:1/-1;padding:3.5rem 1rem">
              <span class="material-symbols-outlined" style="font-size:3rem;color:var(--outline);opacity:0.4">bookmark_border</span>
              <p style="color:var(--outline)">${t('common.emptyState')}</p>
            </div>
          ` : filtered.map((bm) => {
            let hostname = '';
            try {
              if (bm.url) hostname = new URL(bm.url).hostname;
            } catch (e) {
              hostname = bm.url || '';
            }

            return `
              <div class="card-glass bookmarks__card" data-id="${bm.id}">
                <div class="bookmarks__card-header">
                  <div class="bookmarks__card-icon bookmarks__card-icon--primary">
                    <span class="material-symbols-outlined">link</span>
                  </div>
                  <span class="badge badge-primary">${escapeHtml(bm.category || t('bookmarks.categoryGeneral'))}</span>
                </div>
                <h3 class="bookmarks__card-title">${escapeHtml(bm.title)}</h3>
                <p class="bookmarks__card-desc">${escapeHtml(bm.description || '')}</p>
                <div class="bookmarks__card-footer">
                  <span class="text-mono" style="font-size:0.6875rem;color:var(--outline);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(hostname)}</span>
                  <div style="display:flex;align-items:center;gap:0.35rem">
                    ${bm.url ? `
                      <a href="${escapeHtml(bm.url)}" target="_blank" rel="noopener noreferrer" class="bookmarks__card-link" title="${t('bookmarks.openLink')}">
                        <span class="material-symbols-outlined" style="font-size:1rem">open_in_new</span>
                      </a>
                    ` : ''}
                    <button class="btn-icon bm-delete-btn" data-id="${bm.id}" title="${t('common.delete')}">
                      <span class="material-symbols-outlined" style="font-size:1rem;color:var(--error)">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Add Form Section -->
        <div class="bookmarks__form-section" id="bm-form-section" style="display:none;margin-top:2.5rem">
          <div class="bookmarks__form-header">
            <div style="display:flex;align-items:center;gap:1rem">
              <div style="width:3rem;height:3rem;border-radius:var(--radius-xl);background:var(--primary);color:var(--on-primary);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <span class="material-symbols-outlined">bookmark_add</span>
              </div>
              <div>
                <h3 class="text-title-lg">${t('bookmarks.addBookmark')}</h3>
                <p style="font-size:0.875rem;color:var(--outline)">${t('bookmarks.subtitle')}</p>
              </div>
            </div>
            <button class="btn-icon" id="bm-close-form-btn"><span class="material-symbols-outlined">close</span></button>
          </div>
          <form class="bookmarks__form" id="bm-add-form">
            <div class="bookmarks__form-grid">
              <div class="auth-field">
                <label class="input-label">${t('bookmarks.nameLabel')}</label>
                <input type="text" class="input-field" id="bm-input-title" placeholder="GitHub, MDN, DevDocs..." required />
              </div>
              <div class="auth-field">
                <label class="input-label">${t('bookmarks.urlLabel')}</label>
                <input type="url" class="input-field" id="bm-input-url" placeholder="https://..." required />
              </div>
              <div class="auth-field" style="grid-column:1/-1">
                <label class="input-label">${t('common.description')}</label>
                <textarea class="input-field" id="bm-input-desc" placeholder="${t('common.description')}..." rows="2"></textarea>
              </div>
              <div class="auth-field">
                <label class="input-label">${t('bookmarks.categoryLabel')}</label>
                <select class="input-field" id="bm-input-category" style="background:var(--surface-container-low)">
                  <option value="Documentation">${t('bookmarks.categoryDocumentation')}</option>
                  <option value="Tools">${t('bookmarks.categoryTools')}</option>
                  <option value="Frameworks">${t('bookmarks.categoryFrameworks')}</option>
                  <option value="Cloud">${t('bookmarks.categoryCloud')}</option>
                  <option value="General">${t('bookmarks.categoryGeneral')}</option>
                </select>
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:1.5rem">
              <button type="button" class="btn btn-secondary" id="bm-cancel-btn">${t('common.cancel')}</button>
              <button type="submit" class="btn btn-primary">${t('common.save')}</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Category button clicks
    content.querySelectorAll('.bookmarks__filter').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        render();
      });
    });

    // Search input
    const searchInput = content.querySelector('#bm-search-input');
    searchInput?.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      render();
    });

    // Toggle Form visibility
    const formSection = content.querySelector('#bm-form-section');
    content.querySelector('#bm-open-form-btn')?.addEventListener('click', () => {
      if (formSection) {
        formSection.style.display = 'block';
        formSection.scrollIntoView({ behavior: 'smooth' });
        content.querySelector('#bm-input-title')?.focus();
      }
    });

    content.querySelector('#bm-close-form-btn')?.addEventListener('click', () => {
      if (formSection) formSection.style.display = 'none';
    });
    content.querySelector('#bm-cancel-btn')?.addEventListener('click', () => {
      if (formSection) formSection.style.display = 'none';
    });

    // Submit form
    content.querySelector('#bm-add-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = content.querySelector('#bm-input-title')?.value.trim();
      const url = content.querySelector('#bm-input-url')?.value.trim();
      const description = content.querySelector('#bm-input-desc')?.value.trim();
      const category = content.querySelector('#bm-input-category')?.value;

      if (!title || !url) return;

      if (!validateUrl(url)) {
        showToast(t('bookmarks.invalidUrl'), 'error');
        return;
      }

      try {
        const newBm = await addBookmark({ title, url, description, category });
        const list = store.get('bookmarks') || [];
        store.set('bookmarks', [newBm, ...list]);
        showToast(t('bookmarks.addedSuccess'), 'success');
        if (formSection) formSection.style.display = 'none';
        render();
      } catch (err) {
        showToast(err.message || t('common.errorOccurred'), 'error');
      }
    });

    // Delete bookmark
    content.querySelectorAll('.bm-delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        showModal({
          title: t('common.confirmDelete'),
          message: t('bookmarks.deleteConfirm'),
          confirmText: t('common.delete'),
          cancelText: t('common.cancel'),
          onConfirm: async () => {
            try {
              await deleteBookmark(id);
              const list = store.get('bookmarks') || [];
              store.set('bookmarks', list.filter((b) => b.id !== id));
              showToast(t('bookmarks.deletedSuccess'), 'success');
              render();
            } catch (err) {
              showToast(err.message, 'error');
            }
          },
        });
      });
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
