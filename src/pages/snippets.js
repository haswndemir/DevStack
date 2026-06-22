// DevStack — Snippets Page
import { store } from '../store.js';
import { addSnippet, updateSnippet, deleteSnippet, getSnippets } from '../db.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { formatRelativeTime } from '../utils/date.js';

const languages = ['JavaScript', 'TypeScript', 'Python', 'CSS', 'HTML', 'Go', 'Rust', 'SQL', 'Shell'];

export function renderSnippets() {
  const content = document.getElementById('page-content');
  let selectedId = null;

  function render() {
    const snippets = store.get('snippets') || [];
    const selected = snippets.find(s => s.id === selectedId) || snippets[0] || null;
    if (selected && !selectedId) selectedId = selected.id;

    content.innerHTML = `
      <div class="snippets-page">
        <!-- Left Panel: List -->
        <section class="snippets__list">
          <div class="snippets__list-header">
            <h2 style="font-size:0.875rem;font-weight:700;letter-spacing:-0.01em">Snippet Arşivi</h2>
            <button class="btn-icon" style="background:rgba(192,193,255,0.1);color:var(--primary);border-radius:var(--radius-md)" id="snip-add">
              <span class="material-symbols-outlined" style="font-size:1rem;font-variation-settings:'wght' 600">add</span>
            </button>
          </div>
          <div class="snippets__items">
            ${snippets.length === 0 ? `
              <div class="empty-state" style="padding:2rem">
                <span class="material-symbols-outlined" style="color:var(--outline)">code_off</span>
                <p style="font-size:0.8125rem;color:var(--outline)">Henüz snippet yok</p>
              </div>
            ` : snippets.map(s => `
              <div class="snippets__item ${s.id === selectedId ? 'snippets__item--active' : ''}" data-id="${s.id}">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.5rem">
                  <span class="badge badge-${s.language === 'JavaScript' || s.language === 'TypeScript' ? 'secondary' : s.language === 'Python' ? 'tertiary' : 'primary'}">${s.language || 'Kod'}</span>
                </div>
                <h3 style="font-size:0.875rem;font-weight:600;color:${s.id === selectedId ? 'var(--on-surface)' : 'var(--on-surface-variant)'};line-height:1.3;margin-bottom:0.25rem">${s.title}</h3>
                <p style="font-size:0.75rem;color:var(--outline)">${formatRelativeTime(s.updatedAt || s.createdAt)}</p>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Right Panel: Editor -->
        <section class="snippets__editor">
          ${selected ? `
            <div class="snippets__editor-header">
              <div style="display:flex;align-items:center;gap:1rem">
                <div style="width:2.5rem;height:2.5rem;border-radius:var(--radius-xl);background:var(--surface-container-high);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <span class="material-symbols-outlined" style="color:var(--primary)">terminal</span>
                </div>
                <div>
                  <input class="snippets__title-input" id="snip-title" value="${selected.title}" placeholder="Snippet başlığı..." />
                  <p style="font-size:0.75rem;color:var(--outline);margin-top:0.125rem">${formatRelativeTime(selected.updatedAt || selected.createdAt)}</p>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:0.75rem">
                <select class="input-field" style="width:auto;padding:0.5rem 2rem 0.5rem 0.75rem;font-size:0.75rem;font-family:var(--font-mono);border-radius:var(--radius-lg)" id="snip-lang">
                  ${languages.map(l => `<option ${l === selected.language ? 'selected' : ''}>${l}</option>`).join('')}
                </select>
                <button class="btn btn-primary btn-sm" id="snip-copy">
                  <span class="material-symbols-outlined" style="font-size:0.875rem">content_copy</span>
                  <span class="snippets__copy-text">Kodu Kopyala</span>
                </button>
                <button class="btn-icon" id="snip-delete" title="Sil" style="color:var(--error)">
                  <span class="material-symbols-outlined" style="font-size:1.125rem">delete</span>
                </button>
              </div>
            </div>
            <!-- Code Editor Surface -->
            <div class="snippets__code-surface">
              <div class="snippets__tab-bar">
                <div class="snippets__tab snippets__tab--active">
                  <span class="material-symbols-outlined" style="font-size:0.875rem">code</span>
                  ${selected.title?.toLowerCase().replace(/\s+/g, '_') || 'snippet'}.${(selected.language || 'js').toLowerCase().slice(0, 2)}
                </div>
              </div>
              <div class="snippets__code-area">
                <div class="snippets__line-numbers" id="snip-lines"></div>
                <textarea class="snippets__code-input" id="snip-code" spellcheck="false" placeholder="Kodunuzu buraya yazın...">${selected.code || ''}</textarea>
              </div>
              <div class="snippets__status-bar">
                <div style="display:flex;gap:1rem">
                  <span>UTF-8</span>
                  <span id="snip-cursor">Satır 1, Sütun 1</span>
                </div>
                <div style="display:flex;gap:1rem;align-items:center">
                  <span style="display:flex;align-items:center;gap:0.25rem"><span style="width:0.5rem;height:0.5rem;border-radius:50%;background:var(--secondary)"></span> Live</span>
                  <span style="color:var(--primary)">${selected.language || 'JavaScript'}</span>
                </div>
              </div>
            </div>
          ` : `
            <div class="empty-state" style="height:100%">
              <span class="material-symbols-outlined" style="font-size:3rem;color:var(--outline)">code</span>
              <p style="color:var(--outline)">Bir snippet seçin veya yeni oluşturun</p>
            </div>
          `}
        </section>
      </div>
    `;

    // Update line numbers
    updateLineNumbers();

    // Events
    content.querySelectorAll('.snippets__item').forEach(item => {
      item.addEventListener('click', () => {
        selectedId = item.dataset.id;
        render();
      });
    });

    document.getElementById('snip-add')?.addEventListener('click', async () => {
      try {
        const ref = await addSnippet({ title: 'Yeni Snippet', language: 'JavaScript', code: '// Yeni kod bloğu\n' });
        const updated = await getSnippets();
        store.set('snippets', updated);
        selectedId = ref.id;
        showToast('Yeni snippet oluşturuldu', 'success');
        render();
      } catch (err) {
        showToast('Hata: ' + err.message, 'error');
      }
    });

    // Auto-save on code change
    let saveTimeout;
    const codeInput = document.getElementById('snip-code');
    const titleInput = document.getElementById('snip-title');
    const langSelect = document.getElementById('snip-lang');

    function autoSave() {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(async () => {
        if (!selectedId) return;
        try {
          await updateSnippet(selectedId, {
            title: titleInput?.value || 'Adsız',
            code: codeInput?.value || '',
            language: langSelect?.value || 'JavaScript',
          });
          const updated = await getSnippets();
          store.set('snippets', updated);
        } catch (err) { /* silent */ }
      }, 1000);
    }

    codeInput?.addEventListener('input', () => { autoSave(); updateLineNumbers(); });
    titleInput?.addEventListener('input', autoSave);
    langSelect?.addEventListener('change', autoSave);

    codeInput?.addEventListener('keyup', updateCursor);
    codeInput?.addEventListener('click', updateCursor);

    // Tab support in textarea
    codeInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = codeInput.selectionStart;
        const end = codeInput.selectionEnd;
        codeInput.value = codeInput.value.substring(0, start) + '  ' + codeInput.value.substring(end);
        codeInput.selectionStart = codeInput.selectionEnd = start + 2;
        autoSave();
        updateLineNumbers();
      }
    });

    // Copy
    document.getElementById('snip-copy')?.addEventListener('click', () => {
      if (codeInput) {
        navigator.clipboard.writeText(codeInput.value);
        showToast('Kod panoya kopyalandı!', 'success');
      }
    });

    // Delete
    document.getElementById('snip-delete')?.addEventListener('click', () => {
      showModal({
        title: 'Snippet Sil',
        message: 'Bu snippet silinecek. Emin misiniz?',
        confirmText: 'Sil',
        type: 'danger',
        onConfirm: async () => {
          try {
            await deleteSnippet(selectedId);
            selectedId = null;
            const updated = await getSnippets();
            store.set('snippets', updated);
            showToast('Snippet silindi', 'success');
            render();
          } catch (err) { showToast('Hata: ' + err.message, 'error'); }
        }
      });
    });
  }

  function updateLineNumbers() {
    const code = document.getElementById('snip-code');
    const lines = document.getElementById('snip-lines');
    if (!code || !lines) return;
    const count = (code.value.match(/\n/g) || []).length + 1;
    lines.innerHTML = Array.from({ length: Math.max(count, 15) }, (_, i) => `<span>${i + 1}</span>`).join('');
  }

  function updateCursor() {
    const code = document.getElementById('snip-code');
    const cursor = document.getElementById('snip-cursor');
    if (!code || !cursor) return;
    const val = code.value.substring(0, code.selectionStart);
    const line = (val.match(/\n/g) || []).length + 1;
    const col = val.length - val.lastIndexOf('\n');
    cursor.textContent = `Satır ${line}, Sütun ${col}`;
  }

  render();
}
