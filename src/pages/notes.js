// DevStack — Notes Page
import { store } from '../store.js';
import { addNote, updateNote, deleteNote, getNotes } from '../db.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { formatRelativeTime } from '../utils/date.js';

export function renderNotes() {
  const content = document.getElementById('page-content');
  let selectedId = null;

  function render() {
    const notes = store.get('notes') || [];
    const selected = notes.find(n => n.id === selectedId) || notes[0] || null;
    if (selected && !selectedId) selectedId = selected.id;

    content.innerHTML = `
      <div class="notes-page">
        <!-- Left Panel: Notes List -->
        <section class="notes__list">
          <div class="notes__list-header">
            <h2 style="font-size:0.875rem;font-weight:700;display:flex;align-items:center;gap:0.5rem">
              <span class="material-symbols-outlined" style="font-size:1.125rem;color:var(--primary)">folder_open</span>
              <span class="notes__list-title-text">Notlarım</span>
            </h2>
          </div>
          <div class="notes__items no-scrollbar">
            ${notes.length === 0 ? `
              <div class="empty-state" style="padding:2rem">
                <span class="material-symbols-outlined" style="color:var(--outline)">note_add</span>
                <p style="font-size:0.8125rem;color:var(--outline)">Henüz not yok</p>
              </div>
            ` : notes.map(n => `
              <div class="notes__item ${n.id === selectedId ? 'notes__item--active' : ''}" data-id="${n.id}">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.25rem">
                  <span class="badge badge-primary" style="font-size:0.5625rem">#${n.tag || 'not'}</span>
                  <span class="notes__item-date">${formatRelativeTime(n.updatedAt || n.createdAt)}</span>
                </div>
                <h3 class="notes__item-title">${n.title || 'Adsız Not'}</h3>
                <p class="notes__item-preview line-clamp-2">${(n.content || '').replace(/<[^>]*>/g, '').substring(0, 100)}</p>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Right Panel: Editor -->
        <section class="notes__editor">
          ${selected ? `
            <div class="notes__editor-bg"></div>
            <div class="notes__editor-header">
              <div style="max-width:48rem;width:100%">
                <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem">
                  <span class="badge badge-primary" style="font-size:0.6875rem;border:1px solid rgba(192,193,255,0.2)">
                    ${selected.status || 'Fikir Aşamasında'}
                  </span>
                  <span style="font-size:0.75rem;color:var(--outline)">Son düzenleme: ${formatRelativeTime(selected.updatedAt || selected.createdAt)}</span>
                </div>
                <input class="notes__title-input" id="note-title" value="${selected.title || ''}" placeholder="Not başlığını girin..." />
              </div>
              <div style="display:flex;align-items:center;gap:0.5rem">
                <button class="btn-icon" id="note-fav" title="Favorilere Ekle"><span class="material-symbols-outlined">star</span></button>
                <button class="btn-icon" id="note-share" title="Paylaş"><span class="material-symbols-outlined">share</span></button>
                <button class="btn-icon" id="note-delete" title="Sil"><span class="material-symbols-outlined" style="color:var(--error)">delete</span></button>
              </div>
            </div>
            <!-- Toolbar -->
            <div class="notes__toolbar">
              <button class="notes__tool-btn" data-cmd="bold" title="Kalın"><span class="material-symbols-outlined">format_bold</span></button>
              <button class="notes__tool-btn" data-cmd="italic" title="İtalik"><span class="material-symbols-outlined">format_italic</span></button>
              <button class="notes__tool-btn" data-cmd="underline" title="Altı Çizili"><span class="material-symbols-outlined">format_underlined</span></button>
              <div class="notes__tool-divider"></div>
              <button class="notes__tool-btn" data-cmd="insertUnorderedList" title="Sırasız Liste"><span class="material-symbols-outlined">format_list_bulleted</span></button>
              <button class="notes__tool-btn" data-cmd="insertOrderedList" title="Sıralı Liste"><span class="material-symbols-outlined">format_list_numbered</span></button>
              <div class="notes__tool-divider"></div>
              <button class="notes__tool-btn" data-cmd="createLink" title="Link Ekle"><span class="material-symbols-outlined">link</span></button>
              <button class="notes__tool-btn" data-cmd="formatBlock" data-val="pre" title="Kod Bloğu"><span class="material-symbols-outlined">code_blocks</span></button>
            </div>
            <!-- Content -->
            <div class="notes__content no-scrollbar">
              <div class="notes__editor-area" id="note-content" contenteditable="true">${selected.content || '<p>Notunuzu yazmaya başlayın...</p>'}</div>
            </div>
            <!-- Footer -->
            <div class="notes__footer">
              <div style="display:flex;align-items:center;gap:1.5rem">
                <span style="display:flex;align-items:center;gap:0.375rem">
                  <span class="material-symbols-outlined" style="font-size:0.875rem">text_fields</span>
                  <span id="note-word-count">0 kelime</span>
                </span>
                <span style="display:flex;align-items:center;gap:0.375rem">
                  <span class="material-symbols-outlined" style="font-size:0.875rem">schedule</span>
                  <span id="note-read-time">0 dk okuma</span>
                </span>
              </div>
              <div style="display:flex;align-items:center;gap:1rem">
                <span class="notes__save-status" id="note-save-status">
                  <span style="width:0.5rem;height:0.5rem;border-radius:50%;background:var(--secondary);display:inline-block"></span>
                  Kaydedildi
                </span>
              </div>
            </div>
          ` : `
            <div class="empty-state" style="height:100%">
              <span class="material-symbols-outlined" style="font-size:3rem;color:var(--outline)">edit_note</span>
              <p style="color:var(--outline)">Bir not seçin veya yeni oluşturun</p>
              <button class="btn btn-primary btn-sm" id="note-empty-add">Yeni Not Oluştur</button>
            </div>
          `}
        </section>
      </div>
    `;

    // Select note
    content.querySelectorAll('.notes__item').forEach(item => {
      item.addEventListener('click', () => { selectedId = item.dataset.id; render(); });
    });

    // Toolbar commands
    content.querySelectorAll('.notes__tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.dataset.cmd;
        const val = btn.dataset.val || null;
        if (cmd === 'createLink') {
          const url = prompt('URL girin:');
          if (url) document.execCommand(cmd, false, url);
        } else {
          document.execCommand(cmd, false, val);
        }
      });
    });

    // Auto-save
    let saveTimeout;
    const contentEl = document.getElementById('note-content');
    const titleEl = document.getElementById('note-title');

    function autoSave() {
      const statusEl = document.getElementById('note-save-status');
      if (statusEl) statusEl.innerHTML = '<span style="width:0.5rem;height:0.5rem;border-radius:50%;background:var(--tertiary);display:inline-block" class="animate-pulse"></span> Kaydediliyor...';

      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(async () => {
        if (!selectedId) return;
        try {
          await updateNote(selectedId, {
            title: titleEl?.value || 'Adsız Not',
            content: contentEl?.innerHTML || '',
          });
          const updated = await getNotes();
          store.set('notes', updated);
          if (statusEl) statusEl.innerHTML = '<span style="width:0.5rem;height:0.5rem;border-radius:50%;background:var(--secondary);display:inline-block"></span> Kaydedildi';
        } catch (err) { /* silent */ }
        updateStats();
      }, 1000);
    }

    contentEl?.addEventListener('input', autoSave);
    titleEl?.addEventListener('input', autoSave);

    // Word count
    function updateStats() {
      const text = contentEl?.textContent || '';
      const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
      const readTime = Math.max(1, Math.ceil(words / 200));
      const wc = document.getElementById('note-word-count');
      const rt = document.getElementById('note-read-time');
      if (wc) wc.textContent = `${words} kelime`;
      if (rt) rt.textContent = `${readTime} dk okuma`;
    }
    updateStats();

    // Delete
    document.getElementById('note-delete')?.addEventListener('click', () => {
      showModal({
        title: 'Notu Sil',
        message: 'Bu not kalıcı olarak silinecek.',
        confirmText: 'Sil',
        type: 'danger',
        onConfirm: async () => {
          try {
            await deleteNote(selectedId);
            selectedId = null;
            const updated = await getNotes();
            store.set('notes', updated);
            showToast('Not silindi', 'success');
            render();
          } catch (err) { showToast('Hata: ' + err.message, 'error'); }
        }
      });
    });

    // Empty state add
    document.getElementById('note-empty-add')?.addEventListener('click', createNewNote);

    // FAB
    const fab = document.getElementById('fab');
    if (fab) { fab.onclick = createNewNote; fab.title = 'Yeni Not'; }
  }

  async function createNewNote() {
    try {
      const ref = await addNote({ title: 'Yeni Not', content: '<p>Yazmaya başlayın...</p>', tag: 'not', status: 'Fikir Aşamasında' });
      const updated = await getNotes();
      store.set('notes', updated);
      selectedId = ref.id;
      showToast('Yeni not oluşturuldu', 'success');
      render();
    } catch (err) { showToast('Hata: ' + err.message, 'error'); }
  }

  render();
}
