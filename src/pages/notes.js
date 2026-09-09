// DevStack — Notes Page with Markdown & DOMPurify Sanitization
import { store } from '../store.js';
import { addNote, updateNote, deleteNote } from '../db.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { formatRelativeTime } from '../utils/date.js';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { t } from '../i18n/index.js';

export function renderNotes() {
  const content = document.getElementById('page-content');
  if (!content) return;

  let selectedId = null;
  let viewMode = 'split'; // 'edit', 'preview', 'split'
  let searchQuery = '';
  let saveTimeout = null;
  let pendingSave = null;

  async function flushPendingSave() {
    if (!pendingSave) return;
    const { targetId, data } = pendingSave;
    pendingSave = null;
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }

    const notes = store.get('notes') || [];
    const current = notes.find((n) => n.id === targetId);
    if (!current) return;

    const updated = {
      ...current,
      ...data,
      updatedAt: Date.now(),
    };

    try {
      await updateNote(targetId, updated);
      const list = (store.get('notes') || []).map((n) => (n.id === targetId ? updated : n));
      store.set('notes', list);
      const status = document.getElementById('note-save-status');
      if (status) status.textContent = t('common.saved');
    } catch (err) {
      console.error('Note update error:', err);
      const status = document.getElementById('note-save-status');
      if (status) status.textContent = t('common.errorOccurred');
    }
  }

  function triggerAutosave(targetNoteId, partialData) {
    const status = document.getElementById('note-save-status');
    if (status) status.textContent = t('common.saving');

    pendingSave = {
      targetId: targetNoteId,
      data: {
        ...(pendingSave?.targetId === targetNoteId ? pendingSave.data : {}),
        ...partialData,
      },
    };

    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      await flushPendingSave();
    }, 600);
  }

  function render() {
    const notes = store.get('notes') || [];
    const filtered = notes.filter((n) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (n.title || '').toLowerCase().includes(q) ||
        (n.content || '').toLowerCase().includes(q) ||
        (n.tag || '').toLowerCase().includes(q)
      );
    });

    const selected = notes.find((n) => n.id === selectedId) || filtered[0] || null;
    if (selected && selectedId !== selected.id) {
      selectedId = selected.id;
    }

    const renderedHtml = selected ? DOMPurify.sanitize(marked.parse(selected.content || '')) : '';

    content.innerHTML = `
      <div class="notes-page animate-fade-in-up">
        <!-- Left Panel: Notes List -->
        <section class="notes__list">
          <div class="notes__list-header">
            <div>
              <h2 style="font-size:0.9375rem;font-weight:700;display:flex;align-items:center;gap:0.5rem">
                <span class="material-symbols-outlined" style="font-size:1.125rem;color:var(--primary)">folder_open</span>
                <span>${t('notes.title')}</span>
              </h2>
              <span style="font-size:0.6875rem;color:var(--outline)">${filtered.length} ${t('common.items')}</span>
            </div>
            <button class="btn-icon" id="note-add-btn" title="${t('notes.addNote')}" style="background:rgba(192,193,255,0.1);color:var(--primary);border-radius:var(--radius-md)">
              <span class="material-symbols-outlined" style="font-size:1.125rem">add</span>
            </button>
          </div>

          <!-- Search Filter -->
          <div style="padding:0.5rem 0.75rem">
            <input type="text" class="input-field" id="notes-search-input" value="${escapeHtml(searchQuery)}" placeholder="${t('notes.searchPlaceholder')}" style="font-size:0.75rem;padding:0.4rem 0.75rem;background:var(--surface-container-lowest);border-radius:var(--radius-md)" />
          </div>

          <div class="notes__items no-scrollbar">
            ${filtered.length === 0 ? `
              <div class="empty-state" style="padding:2.5rem 1rem">
                <span class="material-symbols-outlined" style="color:var(--outline);font-size:2rem;opacity:0.5">edit_note</span>
                <p style="font-size:0.8125rem;color:var(--outline)">${t('common.emptyState')}</p>
              </div>
            ` : filtered.map((n) => `
              <div class="notes__item ${n.id === selectedId ? 'notes__item--active' : ''}" data-id="${n.id}">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem">
                  <span class="badge badge-primary" style="font-size:0.625rem">#${escapeHtml(n.tag || 'dev')}</span>
                  <span class="notes__item-date">${formatRelativeTime(n.updatedAt || n.createdAt)}</span>
                </div>
                <h3 class="notes__item-title">${escapeHtml(n.title || 'Untitled Note')}</h3>
                <p class="notes__item-preview line-clamp-2">${escapeHtml((n.content || '').substring(0, 80))}</p>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Right Panel: Markdown Editor & Preview Surface -->
        <section class="notes__editor" style="display:flex;flex-direction:column">
          ${selected ? `
            <div class="notes__editor-header">
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem">
                  <span class="badge badge-primary">${t('notes.markdownBadge')}</span>
                  <span id="note-save-status" style="font-size:0.6875rem;color:var(--outline)">${t('common.saved')}</span>
                </div>
                <input class="notes__title-input" id="note-title-input" value="${escapeHtml(selected.title || '')}" placeholder="${t('notes.noteTitle')}" />
              </div>

              <div style="display:flex;align-items:center;gap:0.5rem">
                <!-- Mode Toggles (Edit / Split / Preview) -->
                <div style="display:flex;background:var(--surface-container-high);border-radius:var(--radius-lg);padding:0.2rem">
                  <button class="btn btn-sm ${viewMode === 'edit' ? 'btn-primary' : 'btn-ghost'}" id="btn-mode-edit" style="padding:0.25rem 0.5rem;font-size:0.75rem">${t('notes.editor')}</button>
                  <button class="btn btn-sm ${viewMode === 'split' ? 'btn-primary' : 'btn-ghost'}" id="btn-mode-split" style="padding:0.25rem 0.5rem;font-size:0.75rem">${t('notes.split')}</button>
                  <button class="btn btn-sm ${viewMode === 'preview' ? 'btn-primary' : 'btn-ghost'}" id="btn-mode-preview" style="padding:0.25rem 0.5rem;font-size:0.75rem">${t('notes.preview')}</button>
                </div>

                <button class="btn-icon" id="note-delete-btn" title="${t('common.delete')}" style="color:var(--error)">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>

            <!-- Workspace Surface -->
            <div style="flex:1;display:flex;overflow:hidden;gap:1px;background:var(--outline-variant);min-height:400px">
              <!-- Editor Textarea -->
              <div style="flex:1;display:${viewMode === 'preview' ? 'none' : 'flex'};flex-direction:column;background:var(--surface-container-lowest);padding:1rem">
                <textarea class="notes__markdown-textarea no-scrollbar" id="note-markdown-input" placeholder="${t('notes.noteContent')}" style="flex:1;width:100%;border:none;background:none;color:var(--on-surface);font-family:var(--font-mono);font-size:0.875rem;resize:none;line-height:1.6;outline:none">${escapeHtml(selected.content || '')}</textarea>
              </div>

              <!-- Sanitized Markdown Preview Container -->
              <div style="flex:1;display:${viewMode === 'edit' ? 'none' : 'block'};background:var(--surface);padding:1.5rem;overflow-y:auto">
                <div class="markdown-body" id="note-preview-pane">
                  ${renderedHtml || `<p style="color:var(--outline);font-style:italic">${t('notes.preview')}...</p>`}
                </div>
              </div>
            </div>
          ` : `
            <div class="empty-state" style="height:100%">
              <span class="material-symbols-outlined" style="font-size:3rem;color:var(--outline);opacity:0.5">description</span>
              <p style="color:var(--outline)">${t('common.emptyState')}</p>
              <button class="btn btn-primary" id="note-create-first-btn" style="margin-top:0.5rem">${t('notes.addNote')}</button>
            </div>
          `}
        </section>
      </div>
    `;

    // Notes item selection (flushes pending save for current note first)
    content.querySelectorAll('.notes__item').forEach((item) => {
      item.addEventListener('click', async () => {
        const newId = item.dataset.id;
        if (newId !== selectedId) {
          await flushPendingSave();
          selectedId = newId;
          render();
        }
      });
    });

    // Search input
    content.querySelector('#notes-search-input')?.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      render();
    });

    // Add note
    const handleAddNote = async () => {
      try {
        await flushPendingSave();
        const newNote = await addNote({
          title: t('notes.defaultNoteTitle'),
          content: t('notes.defaultNoteContent'),
          tag: 'draft',
        });
        const list = store.get('notes') || [];
        store.set('notes', [newNote, ...list]);
        selectedId = newNote.id;
        showToast(t('notes.addedSuccess'), 'success');
        render();
      } catch (err) {
        showToast(err.message || t('common.errorOccurred'), 'error');
      }
    };

    content.querySelector('#note-add-btn')?.addEventListener('click', handleAddNote);
    content.querySelector('#note-create-first-btn')?.addEventListener('click', handleAddNote);

    if (selected) {
      const currentNoteId = selected.id;

      // Mode switch buttons
      content.querySelector('#btn-mode-edit')?.addEventListener('click', () => {
        viewMode = 'edit';
        render();
      });
      content.querySelector('#btn-mode-split')?.addEventListener('click', () => {
        viewMode = 'split';
        render();
      });
      content.querySelector('#btn-mode-preview')?.addEventListener('click', () => {
        viewMode = 'preview';
        render();
      });

      // Title input
      content.querySelector('#note-title-input')?.addEventListener('input', (e) => {
        triggerAutosave(currentNoteId, { title: e.target.value });
      });

      // Markdown textarea input
      const textarea = content.querySelector('#note-markdown-input');
      const previewPane = content.querySelector('#note-preview-pane');

      textarea?.addEventListener('input', (e) => {
        const val = e.target.value;
        if (previewPane) {
          previewPane.innerHTML = DOMPurify.sanitize(marked.parse(val || ''));
        }
        triggerAutosave(currentNoteId, { content: val });
      });

      // Delete note
      content.querySelector('#note-delete-btn')?.addEventListener('click', () => {
        showModal({
          title: t('common.confirmDelete'),
          message: t('common.confirmDelete'),
          confirmText: t('common.delete'),
          cancelText: t('common.cancel'),
          onConfirm: async () => {
            try {
              await deleteNote(selected.id);
              const list = store.get('notes') || [];
              const updated = list.filter((n) => n.id !== selected.id);
              store.set('notes', updated);
              selectedId = updated[0]?.id || null;
              showToast(t('notes.deletedSuccess'), 'success');
              render();
            } catch (err) {
              showToast(err.message, 'error');
            }
          },
        });
      });
    }
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
