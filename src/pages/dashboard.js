// DevStack — Dashboard Page
import { store } from '../store.js';
import { navigate } from '../router.js';
import { getGreeting } from '../utils/date.js';
import { formatRelativeTime } from '../utils/date.js';

export function renderDashboard() {
  const content = document.getElementById('page-content');
  const user = store.get('user');
  const bookmarks = store.get('bookmarks') || [];
  const snippets = store.get('snippets') || [];
  const notes = store.get('notes') || [];
  const name = user?.displayName?.split(' ')[0] || 'Geliştirici';

  content.innerHTML = `
    <div class="dashboard animate-fade-in-up">
      <!-- Welcome Header -->
      <section class="dashboard__welcome">
        <div class="dashboard__welcome-text">
          <h2 class="text-display-sm">${getGreeting()}, ${name}!</h2>
          <p class="dashboard__welcome-sub">Bugün üretkenlik modun zirvede. Yeni projeler seni bekliyor.</p>
        </div>
        <div class="dashboard__welcome-actions">
          <button class="btn btn-secondary" id="dash-new-note">
            <span class="material-symbols-outlined" style="font-size:1.125rem">add_circle</span>
            Yeni Not
          </button>
          <button class="btn btn-primary" id="dash-new-project">
            <span class="material-symbols-outlined" style="font-size:1.125rem">rocket_launch</span>
            Yeni Proje
          </button>
        </div>
      </section>

      <!-- Stats Bento Grid -->
      <section class="dashboard__stats">
        <div class="stat-card glass-card">
          <div class="stat-card__header">
            <div class="stat-card__icon stat-card__icon--primary">
              <span class="material-symbols-outlined">terminal</span>
            </div>
            <span class="badge badge-primary">aktif</span>
          </div>
          <div class="stat-card__body">
            <p class="stat-card__value">${bookmarks.length}</p>
            <p class="stat-card__label">Yer İmi</p>
          </div>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-card__header">
            <div class="stat-card__icon stat-card__icon--secondary">
              <span class="material-symbols-outlined">data_object</span>
            </div>
            <span class="badge badge-secondary">+${Math.min(snippets.length, 3)} bugün</span>
          </div>
          <div class="stat-card__body">
            <p class="stat-card__value">${snippets.length}</p>
            <p class="stat-card__label">Toplam Snippet</p>
          </div>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-card__header">
            <div class="stat-card__icon stat-card__icon--tertiary">
              <span class="material-symbols-outlined">event_note</span>
            </div>
          </div>
          <div class="stat-card__body">
            <p class="stat-card__value">${notes.length}</p>
            <p class="stat-card__label">Günlük Notlar</p>
          </div>
        </div>
      </section>

      <!-- Main Grid -->
      <div class="dashboard__grid">
        <!-- Latest Bookmarks -->
        <section class="dashboard__bookmarks">
          <div class="dashboard__section-header">
            <h3 class="text-title-lg" style="display:flex;align-items:center;gap:0.5rem">
              <span class="material-symbols-outlined" style="color:var(--primary)">bookmarks</span>
              Son Eklenen Yer İmleri
            </h3>
            <a href="#/bookmarks" class="dashboard__see-all">Tümünü Gör</a>
          </div>
          <div class="dashboard__bookmark-list">
            ${bookmarks.length === 0 ? `
              <div class="empty-state" style="padding:2rem">
                <span class="material-symbols-outlined" style="font-size:2rem;color:var(--outline)">bookmark_border</span>
                <p style="font-size:0.875rem;color:var(--outline)">Henüz yer imi eklenmemiş</p>
                <button class="btn btn-sm btn-primary" onclick="location.hash='#/bookmarks'">İlk Yer İmini Ekle</button>
              </div>
            ` : bookmarks.slice(0, 4).map(bm => `
              <div class="dashboard__bookmark-item" onclick="window.open('${bm.url || '#'}', '_blank')">
                <div class="dashboard__bookmark-info">
                  <div class="dashboard__bookmark-icon">
                    <span class="material-symbols-outlined" style="font-size:1.25rem;color:var(--primary)">link</span>
                  </div>
                  <div>
                    <h4 class="dashboard__bookmark-title">${bm.title}</h4>
                    <p class="dashboard__bookmark-url text-mono">${bm.url || ''}</p>
                  </div>
                </div>
                <div class="dashboard__bookmark-meta">
                  <span class="badge badge-${bm.category === 'Frontend' ? 'primary' : bm.category === 'Backend' ? 'secondary' : 'tertiary'}">${bm.category || 'Genel'}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- AI Assistant Card -->
        <section class="dashboard__ai-card">
          <div class="dashboard__ai-gradient">
            <div class="dashboard__ai-content">
              <div class="dashboard__ai-icon">
                <span class="material-symbols-outlined icon-filled">smart_toy</span>
              </div>
              <h3 class="text-headline-md" style="margin-bottom:0.75rem">AI Asistan Hazır</h3>
              <p style="color:var(--outline);font-size:0.875rem;line-height:1.6;margin-bottom:1.5rem">
                Kod bloklarını analiz etmek, yeni fikirler üretmek veya dökümantasyon özetlemek için hazırım.
              </p>
              <div class="dashboard__ai-prompts">
                <div class="dashboard__ai-prompt">
                  <span class="material-symbols-outlined" style="font-size:0.875rem;color:var(--primary)">chat_bubble</span>
                  <p class="text-mono" style="font-size:0.75rem;color:var(--on-surface-variant)">"Bu React componentini optimize et..."</p>
                </div>
                <div class="dashboard__ai-prompt">
                  <span class="material-symbols-outlined" style="font-size:0.875rem;color:var(--primary)">chat_bubble</span>
                  <p class="text-mono" style="font-size:0.75rem;color:var(--on-surface-variant)">"Bugünkü notlarımı özetle."</p>
                </div>
              </div>
              <button class="btn btn-secondary" style="width:100%;background:var(--on-surface);color:var(--bg);margin-top:1.5rem" id="dash-ai-start">
                Asistanı Başlat
              </button>
            </div>
          </div>
        </section>
      </div>

      <!-- Quick Look Cards -->
      <section class="dashboard__quicklook">
        <h3 class="text-title-lg" style="margin-bottom:1.5rem">Hızlı Bakış</h3>
        <div class="dashboard__quicklook-grid">
          <div class="card" style="cursor:pointer" onclick="location.hash='#/notes'">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:1rem">
              <span class="badge badge-tertiary">Fikir</span>
              <span style="font-size:0.625rem;color:var(--outline);font-family:var(--font-mono)">${notes.length > 0 ? formatRelativeTime(notes[0]?.createdAt) : ''}</span>
            </div>
            <h4 style="font-weight:600;margin-bottom:0.5rem">${notes.length > 0 ? notes[0].title : 'İlk notunuzu oluşturun'}</h4>
            <p class="line-clamp-2" style="font-size:0.75rem;color:var(--outline)">${notes.length > 0 ? (notes[0].content || '').substring(0, 100) : 'Notlar bölümünden yeni bir not oluşturabilirsiniz.'}</p>
          </div>
          <div class="card" style="cursor:pointer" onclick="location.hash='#/snippets'">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:1rem">
              <span class="badge badge-secondary">${snippets.length > 0 ? (snippets[0].language || 'Kod') : 'Kod'}</span>
              <span style="font-size:0.625rem;color:var(--outline);font-family:var(--font-mono)">${snippets.length > 0 ? formatRelativeTime(snippets[0]?.createdAt) : ''}</span>
            </div>
            <h4 style="font-weight:600;margin-bottom:0.5rem">${snippets.length > 0 ? snippets[0].title : 'İlk snippetınızı ekleyin'}</h4>
            <div style="margin-top:0.75rem;padding:0.5rem;background:rgba(0,0,0,0.3);border-radius:var(--radius-md);font-family:var(--font-mono);font-size:0.625rem;color:rgba(78,222,163,0.8);overflow:hidden;max-height:3rem">
              ${snippets.length > 0 ? (snippets[0].code || '').substring(0, 80) : '// Kod parçacıklarınız burada'}
            </div>
          </div>
          <div class="card" style="cursor:pointer" onclick="location.hash='#/bookmarks'">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:1rem">
              <span class="badge badge-primary">Proje</span>
              <span style="font-size:0.625rem;color:var(--outline);font-family:var(--font-mono)">Güncel</span>
            </div>
            <h4 style="font-weight:600;margin-bottom:0.5rem">DevStack Genel Bakış</h4>
            <div style="width:100%;background:var(--surface-container-highest);height:0.375rem;border-radius:var(--radius-full);margin-top:1rem">
              <div style="background:var(--primary);height:100%;border-radius:var(--radius-full);width:${Math.min(100, (bookmarks.length + snippets.length + notes.length) * 5)}%"></div>
            </div>
            <p style="font-size:0.625rem;color:var(--outline);margin-top:0.5rem;font-weight:500">${bookmarks.length + snippets.length + notes.length} öğe toplam</p>
          </div>
        </div>
      </section>
    </div>
  `;

  // Event bindings
  document.getElementById('dash-new-note')?.addEventListener('click', () => navigate('/notes'));
  document.getElementById('dash-new-project')?.addEventListener('click', () => navigate('/bookmarks'));
  document.getElementById('dash-ai-start')?.addEventListener('click', () => navigate('/ai-assistant'));

  // FAB
  const fab = document.getElementById('fab');
  if (fab) {
    fab.onclick = () => navigate('/notes');
    fab.title = 'Yeni Not';
  }
}
