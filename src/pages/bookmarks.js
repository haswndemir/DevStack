// DevStack — Bookmarks Page
import { store } from '../store.js';
import { addBookmark, deleteBookmark, getBookmarks } from '../db.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { formatRelativeTime } from '../utils/date.js';
import { validateRequired, validateUrl } from '../utils/validators.js';

const categories = ['Tümü', 'Frontend', 'Backend', 'Araçlar', 'Yapay Zeka'];

export function renderBookmarks() {
  const content = document.getElementById('page-content');
  let activeFilter = 'Tümü';

  function render() {
    const bookmarks = store.get('bookmarks') || [];
    const filtered = activeFilter === 'Tümü' ? bookmarks : bookmarks.filter(b => b.category === activeFilter);

    content.innerHTML = `
      <div class="bookmarks-page animate-fade-in-up">
        <div class="bookmarks__header">
          <div>
            <h2 class="text-display-sm">Küratörlük</h2>
            <p style="color:var(--outline);font-weight:500">Kaydettiğin tüm teknik kaynaklar ve dijital hafızan.</p>
          </div>
          <button class="btn btn-primary" id="bm-add-btn">
            <span class="material-symbols-outlined" style="font-size:1.125rem">add</span>
            Yeni Yer İmi Ekle
          </button>
        </div>

        <!-- Filters -->
        <div class="bookmarks__filters">
          ${categories.map(cat => `
            <button class="bookmarks__filter ${activeFilter === cat ? 'bookmarks__filter--active' : ''}" data-cat="${cat}">${cat}</button>
          `).join('')}
        </div>

        <!-- Grid -->
        <div class="bookmarks__grid">
          ${filtered.length === 0 ? `
            <div class="empty-state" style="grid-column:1/-1">
              <span class="material-symbols-outlined" style="font-size:3rem;color:var(--outline)">bookmark_border</span>
              <p style="color:var(--outline)">Bu kategoride yer imi bulunamadı</p>
            </div>
          ` : filtered.map(bm => `
            <div class="card-glass bookmarks__card" data-id="${bm.id}">
              <div class="bookmarks__card-header">
                <div class="bookmarks__card-icon bookmarks__card-icon--${(bm.category || '').toLowerCase() === 'frontend' ? 'primary' : (bm.category || '').toLowerCase() === 'backend' ? 'secondary' : 'tertiary'}">
                  <span class="material-symbols-outlined">${bm.category === 'Frontend' ? 'web' : bm.category === 'Backend' ? 'database' : bm.category === 'Yapay Zeka' ? 'auto_awesome' : 'construction'}</span>
                </div>
                <span class="badge badge-${bm.category === 'Frontend' ? 'primary' : bm.category === 'Backend' ? 'secondary' : 'tertiary'}">${bm.category || 'Genel'}</span>
              </div>
              <h3 class="bookmarks__card-title">${bm.title}</h3>
              <p class="bookmarks__card-desc">${bm.description || ''}</p>
              <div class="bookmarks__card-footer">
                <span class="text-mono" style="font-size:0.625rem;color:var(--outline)">${bm.url ? new URL(bm.url).hostname : ''}</span>
                <div style="display:flex;align-items:center;gap:0.5rem">
                  ${bm.url ? `<a href="${bm.url}" target="_blank" class="bookmarks__card-link">
                    Git <span class="material-symbols-outlined" style="font-size:0.875rem">open_in_new</span>
                  </a>` : ''}
                  <button class="btn-icon bm-delete" data-id="${bm.id}" title="Sil">
                    <span class="material-symbols-outlined" style="font-size:1rem;color:var(--error)">delete</span>
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Add Form -->
        <div class="bookmarks__form-section" id="bm-form-section">
          <div class="bookmarks__form-header">
            <div style="display:flex;align-items:center;gap:1rem">
              <div style="width:3rem;height:3rem;border-radius:var(--radius-2xl);background:var(--primary);color:var(--on-primary);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <span class="material-symbols-outlined icon-filled">bookmark_add</span>
              </div>
              <div>
                <h3 class="text-title-lg">Yeni Yer İmi Ekle</h3>
                <p style="font-size:0.875rem;color:var(--outline)">Sisteme yeni bir teknik kaynak tanımla.</p>
              </div>
            </div>
          </div>
          <form class="bookmarks__form" id="bm-form">
            <div class="bookmarks__form-grid">
              <div class="auth-field">
                <label class="input-label">BAŞLIK</label>
                <input type="text" class="input-field" id="bm-title" placeholder="Örn: TypeScript Handbook" required />
              </div>
              <div class="auth-field">
                <label class="input-label">URL</label>
                <input type="url" class="input-field" id="bm-url" placeholder="https://..." required />
              </div>
              <div class="auth-field" style="grid-column:1/-1">
                <label class="input-label">KISA AÇIKLAMA</label>
                <textarea class="input-field" id="bm-desc" placeholder="Bu kaynak ne hakkında?" rows="3"></textarea>
              </div>
              <div class="auth-field">
                <label class="input-label">KATEGORİ</label>
                <select class="input-field" id="bm-category">
                  <option>Frontend</option>
                  <option>Backend</option>
                  <option>Araçlar</option>
                  <option>Yapay Zeka</option>
                </select>
              </div>
              <div style="display:flex;align-items:flex-end">
                <button type="submit" class="btn btn-primary" style="width:100%">Kaydet ve Ekle</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;

    // Filter events
    content.querySelectorAll('.bookmarks__filter').forEach(btn => {
      btn.addEventListener('click', () => {
        activeFilter = btn.dataset.cat;
        render();
      });
    });

    // Delete events
    content.querySelectorAll('.bm-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        showModal({
          title: 'Yer İmini Sil',
          message: 'Bu yer imini silmek istediğinize emin misiniz?',
          confirmText: 'Sil',
          type: 'danger',
          onConfirm: async () => {
            try {
              await deleteBookmark(btn.dataset.id);
              const updated = await getBookmarks();
              store.set('bookmarks', updated);
              showToast('Yer imi silindi', 'success');
              render();
            } catch (err) {
              showToast('Silme hatası: ' + err.message, 'error');
            }
          }
        });
      });
    });

    // Form submit
    const form = document.getElementById('bm-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('bm-title').value.trim();
      const url = document.getElementById('bm-url').value.trim();
      const description = document.getElementById('bm-desc').value.trim();
      const category = document.getElementById('bm-category').value;

      if (!validateRequired(title)) { showToast('Başlık gerekli', 'error'); return; }

      try {
        await addBookmark({ title, url, description, category });
        const updated = await getBookmarks();
        store.set('bookmarks', updated);
        showToast('Yer imi başarıyla eklendi!', 'success');
        render();
      } catch (err) {
        showToast('Ekleme hatası: ' + err.message, 'error');
      }
    });

    document.getElementById('bm-add-btn')?.addEventListener('click', () => {
      document.getElementById('bm-form-section')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  render();

  const unsub = store.subscribe('bookmarks', render);
  return () => unsub();
}
