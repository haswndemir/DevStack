// DevStack — Snippets Page with Monaco Code Editor & Full IDE Controls
import { store } from '../store.js';
import { addSnippet, updateSnippet, deleteSnippet } from '../db.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { formatRelativeTime } from '../utils/date.js';
import { initCodeEditor } from '../components/editor.js';
import { t } from '../i18n/index.js';

const supportedLanguages = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'python', name: 'Python' },
  { id: 'html', name: 'HTML' },
  { id: 'css', name: 'CSS' },
  { id: 'json', name: 'JSON' },
  { id: 'go', name: 'Go' },
  { id: 'rust', name: 'Rust' },
  { id: 'sql', name: 'SQL' },
  { id: 'shell', name: 'Bash / Shell' },
  { id: 'markdown', name: 'Markdown' },
];

function normalizeLanguage(lang) {
  if (!lang) return 'javascript';
  const l = String(lang).toLowerCase().trim();
  if (l === 'js') return 'javascript';
  if (l === 'ts') return 'typescript';
  if (l === 'py') return 'python';
  if (l === 'bash' || l === 'sh' || l === 'zsh') return 'shell';
  if (l === 'htm') return 'html';
  if (supportedLanguages.some((item) => item.id === l)) return l;
  return 'javascript';
}

export function renderSnippets() {
  const content = document.getElementById('page-content');
  if (!content) return;

  let selectedId = null;
  let searchQuery = '';
  let filterLanguage = 'all';
  let onlyFavorites = false;
  let isFullscreen = false;
  let activeEditor = null;
  let saveTimer = null;
  let pendingSave = null;

  async function flushPendingSave() {
    if (!pendingSave) return;
    const { targetId, data } = pendingSave;
    pendingSave = null;
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }

    const snippets = store.get('snippets') || [];
    const current = snippets.find((s) => s.id === targetId);
    if (!current) return;

    const updated = {
      ...current,
      ...data,
      updatedAt: Date.now(),
    };

    try {
      await updateSnippet(targetId, updated);
      const list = (store.get('snippets') || []).map((s) => (s.id === targetId ? updated : s));
      store.set('snippets', list);
      const indicator = document.getElementById('snip-save-indicator');
      if (indicator) indicator.textContent = t('common.saved');
    } catch (err) {
      console.error('Snippet update error:', err);
      const indicator = document.getElementById('snip-save-indicator');
      if (indicator) indicator.textContent = t('common.errorOccurred');
    }
  }

  function triggerAutosave(targetSnippetId, partialData) {
    const indicator = document.getElementById('snip-save-indicator');
    if (indicator) indicator.textContent = t('common.saving');

    pendingSave = {
      targetId: targetSnippetId,
      data: {
        ...(pendingSave?.targetId === targetSnippetId ? pendingSave.data : {}),
        ...partialData,
      },
    };

    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      await flushPendingSave();
    }, 600);
  }

  function render() {
    if (activeEditor) {
      activeEditor.dispose();
      activeEditor = null;
    }

    const snippets = store.get('snippets') || [];
    const filtered = snippets.filter((s) => {
      if (onlyFavorites && !s.isFavorite) return false;
      if (filterLanguage !== 'all' && normalizeLanguage(s.language) !== filterLanguage) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (s.title || '').toLowerCase().includes(q) ||
        (s.language || '').toLowerCase().includes(q) ||
        (s.code || '').toLowerCase().includes(q) ||
        (s.tags || '').toLowerCase().includes(q)
      );
    });

    const selected = snippets.find((s) => s.id === selectedId) || filtered[0] || null;
    if (selected && selectedId !== selected.id) {
      selectedId = selected.id;
    }

    content.innerHTML = `
      <div class="snippets-page animate-fade-in-up">
        <!-- Left Panel: Snippets List -->
        <section class="snippets__list">
          <div class="snippets__list-header">
            <div>
              <h2 style="font-size:0.9375rem;font-weight:700;letter-spacing:-0.01em">${t('snippets.title')}</h2>
              <p style="font-size:0.6875rem;color:var(--outline)">${filtered.length} ${t('common.items')}</p>
            </div>
            <button class="btn-icon" style="background:rgba(192,193,255,0.1);color:var(--primary);border-radius:var(--radius-md)" id="snip-add-btn" title="${t('snippets.addSnippet')}">
              <span class="material-symbols-outlined" style="font-size:1.125rem">add</span>
            </button>
          </div>

          <!-- Snippet Search & Filters -->
          <div style="padding:0.75rem 0.75rem 0.5rem 0.75rem;display:flex;flex-direction:column;gap:0.5rem">
            <input type="text" class="input-field" id="snip-search" value="${escapeHtml(searchQuery)}" placeholder="${t('snippets.searchPlaceholder')}" style="font-size:0.75rem;padding:0.4rem 0.75rem;background:var(--surface-container-lowest);border-radius:var(--radius-md)" />
            
            <div style="display:flex;gap:0.35rem;align-items:center">
              <select class="input-field" id="snip-filter-lang" style="flex:1;font-size:0.6875rem;padding:0.25rem 1.5rem 0.25rem 0.5rem;background:var(--surface-container-lowest);border-radius:var(--radius-md)">
                <option value="all" ${filterLanguage === 'all' ? 'selected' : ''}>${t('snippets.filterAll')}</option>
                ${supportedLanguages.map((l) => `<option value="${l.id}" ${filterLanguage === l.id ? 'selected' : ''}>${l.name}</option>`).join('')}
              </select>

              <button class="btn-icon ${onlyFavorites ? 'btn-primary' : 'btn-outline'}" id="snip-filter-fav-btn" title="${t('snippets.onlyFavorites')}" style="width:1.875rem;height:1.875rem;border-radius:var(--radius-md);flex-shrink:0;color:${onlyFavorites ? 'var(--tertiary)' : 'var(--outline)'}">
                <span class="material-symbols-outlined ${onlyFavorites ? 'icon-filled' : ''}" style="font-size:1rem">star</span>
              </button>
            </div>
          </div>

          <div class="snippets__items no-scrollbar">
            ${filtered.length === 0 ? `
              <div class="empty-state" style="padding:2.5rem 1rem">
                <span class="material-symbols-outlined" style="color:var(--outline);font-size:2rem;opacity:0.5">code_off</span>
                <p style="font-size:0.8125rem;color:var(--outline)">${t('common.emptyState')}</p>
              </div>
            ` : filtered.map((s) => `
              <div class="snippets__item ${s.id === selectedId ? 'snippets__item--active' : ''}" data-id="${s.id}">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem">
                  <span class="badge badge-primary" style="font-size:0.625rem;text-transform:uppercase">${escapeHtml(s.language || 'code')}</span>
                  <div style="display:flex;align-items:center;gap:0.35rem">
                    ${s.isFavorite ? `<span class="material-symbols-outlined icon-filled" style="font-size:0.75rem;color:var(--tertiary)">star</span>` : ''}
                    <span style="font-size:0.6875rem;color:var(--outline)">${formatRelativeTime(s.updatedAt || s.createdAt)}</span>
                  </div>
                </div>
                <h3 style="font-size:0.875rem;font-weight:600;color:var(--on-surface);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(s.title || 'Untitled Snippet')}</h3>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Right Panel: Monaco Editor Surface -->
        <section class="snippets__editor ${isFullscreen ? 'snippets__editor--fullscreen' : ''}" id="snippets-editor-section">
          ${selected ? `
            <div class="snippets__editor-header">
              <div style="flex:1;min-width:0;display:flex;align-items:center;gap:0.75rem">
                <div style="width:2.25rem;height:2.25rem;border-radius:var(--radius-lg);background:var(--surface-container-high);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <span class="material-symbols-outlined" style="color:var(--primary);font-size:1.25rem">terminal</span>
                </div>
                <div style="flex:1;min-width:0">
                  <input class="snippets__title-input" id="snip-title-input" value="${escapeHtml(selected.title)}" placeholder="${t('snippets.snippetTitle')}" style="font-weight:700;font-size:1.125rem" />
                  <span id="snip-save-indicator" style="font-size:0.6875rem;color:var(--outline)">${t('common.saved')}</span>
                </div>
              </div>

              <div style="display:flex;align-items:center;gap:0.35rem;flex-wrap:wrap">
                <!-- Language Selector -->
                <select class="input-field" id="snip-lang-select" style="width:auto;padding:0.35rem 1.75rem 0.35rem 0.6rem;font-size:0.75rem;font-family:var(--font-mono);border-radius:var(--radius-md);background:var(--surface-container-low)">
                  ${supportedLanguages.map((l) => `<option value="${l.id}" ${l.id === normalizeLanguage(selected.language) ? 'selected' : ''}>${l.name}</option>`).join('')}
                </select>

                <!-- Favorite Toggle -->
                <button class="btn-icon" id="snip-fav-btn" title="${t('snippets.toggleFavorite')}" style="color:${selected.isFavorite ? 'var(--tertiary)' : 'var(--outline)'}">
                  <span class="material-symbols-outlined ${selected.isFavorite ? 'icon-filled' : ''}" style="font-size:1.125rem">star</span>
                </button>

                <!-- Find & Replace in Editor -->
                <button class="btn-icon" id="snip-find-btn" title="${t('snippets.find')}">
                  <span class="material-symbols-outlined" style="font-size:1.125rem">search</span>
                </button>

                <button class="btn-icon" id="snip-replace-btn" title="${t('snippets.replace')}">
                  <span class="material-symbols-outlined" style="font-size:1.125rem">find_replace</span>
                </button>

                <!-- Fullscreen Toggle -->
                <button class="btn-icon" id="snip-fullscreen-btn" title="${t('snippets.fullscreen')}">
                  <span class="material-symbols-outlined" style="font-size:1.125rem">${isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
                </button>

                <!-- Manual Save Button -->
                <button class="btn btn-outline btn-sm" id="snip-save-btn" title="${t('common.save')}">
                  <span class="material-symbols-outlined" style="font-size:0.875rem">save</span>
                  <span>${t('common.save')}</span>
                </button>

                <!-- Copy Code Button -->
                <button class="btn btn-primary btn-sm" id="snip-copy-btn" title="${t('common.copy')}">
                  <span class="material-symbols-outlined" style="font-size:0.875rem">content_copy</span>
                  <span>${t('common.copy')}</span>
                </button>

                <!-- Delete Snippet Button -->
                <button class="btn-icon" id="snip-delete-btn" title="${t('common.delete')}" style="color:var(--error)">
                  <span class="material-symbols-outlined" style="font-size:1.125rem">delete</span>
                </button>
              </div>
            </div>

            <!-- Monaco Host Container -->
            <div class="snippets__code-surface" style="flex:1;display:flex;flex-direction:column;position:relative;min-height:380px">
              <div id="monaco-container" style="flex:1;width:100%;height:100%;min-height:380px"></div>
            </div>
          ` : `
            <div class="empty-state" style="height:100%">
              <span class="material-symbols-outlined" style="font-size:3rem;color:var(--outline);opacity:0.5">code</span>
              <p style="color:var(--outline)">${t('common.emptyState')}</p>
              <button class="btn btn-primary" id="snip-create-first-btn" style="margin-top:0.5rem">${t('snippets.addSnippet')}</button>
            </div>
          `}
        </section>
      </div>
    `;

    // Select Snippet Item (flushes pending save for current snippet first to prevent overwrite)
    content.querySelectorAll('.snippets__item').forEach((item) => {
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
    content.querySelector('#snip-search')?.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      render();
    });

    // Language Filter dropdown
    content.querySelector('#snip-filter-lang')?.addEventListener('change', (e) => {
      filterLanguage = e.target.value;
      render();
    });

    // Only Favorites toggle
    content.querySelector('#snip-filter-fav-btn')?.addEventListener('click', () => {
      onlyFavorites = !onlyFavorites;
      render();
    });

    // Add new snippet
    const handleAddSnippet = async () => {
      try {
        await flushPendingSave();
        const newSnippet = await addSnippet({
          title: 'Untitled Snippet',
          language: 'javascript',
          code: '// DevStack snippet\nfunction solution() {\n  return true;\n}',
          isFavorite: false,
        });
        const list = store.get('snippets') || [];
        store.set('snippets', [newSnippet, ...list]);
        selectedId = newSnippet.id;
        showToast(t('snippets.addedSuccess'), 'success');
        render();
      } catch (err) {
        showToast(err.message || t('common.errorOccurred'), 'error');
      }
    };

    content.querySelector('#snip-add-btn')?.addEventListener('click', handleAddSnippet);
    content.querySelector('#snip-create-first-btn')?.addEventListener('click', handleAddSnippet);

    if (selected) {
      const currentSnippetId = selected.id;

      // Mount Monaco Editor
      const monacoContainer = content.querySelector('#monaco-container');
      if (monacoContainer) {
        initCodeEditor(monacoContainer, {
          value: selected.code || '',
          language: normalizeLanguage(selected.language),
          onChange: (newCode) => {
            triggerAutosave(currentSnippetId, { code: newCode });
          },
        }).then((instance) => {
          activeEditor = instance;
        });
      }

      // Title input change
      content.querySelector('#snip-title-input')?.addEventListener('input', (e) => {
        triggerAutosave(currentSnippetId, { title: e.target.value });
      });

      // Language select change
      content.querySelector('#snip-lang-select')?.addEventListener('change', (e) => {
        const lang = e.target.value;
        if (activeEditor) activeEditor.setLanguage(lang);
        triggerAutosave(currentSnippetId, { language: lang });
      });

      // Favorite button
      content.querySelector('#snip-fav-btn')?.addEventListener('click', async () => {
        const newFav = !selected.isFavorite;
        triggerAutosave(currentSnippetId, { isFavorite: newFav });
        selected.isFavorite = newFav;
        await flushPendingSave();
        render();
      });

      // Find in Editor button
      content.querySelector('#snip-find-btn')?.addEventListener('click', () => {
        if (activeEditor) activeEditor.find();
      });

      // Replace in Editor button
      content.querySelector('#snip-replace-btn')?.addEventListener('click', () => {
        if (activeEditor) activeEditor.replace();
      });

      // Fullscreen toggle button
      content.querySelector('#snip-fullscreen-btn')?.addEventListener('click', () => {
        isFullscreen = !isFullscreen;
        const editorSection = document.getElementById('snippets-editor-section');
        if (editorSection) {
          editorSection.classList.toggle('snippets__editor--fullscreen', isFullscreen);
        }
        if (activeEditor) {
          setTimeout(() => activeEditor.layout(), 50);
        }
      });

      // Manual Save button
      content.querySelector('#snip-save-btn')?.addEventListener('click', async () => {
        const code = activeEditor ? activeEditor.getValue() : selected.code || '';
        const title = content.querySelector('#snip-title-input')?.value || selected.title;
        const lang = content.querySelector('#snip-lang-select')?.value || selected.language;
        await flushPendingSave();
        try {
          await updateSnippet(currentSnippetId, { code, title, language: lang, updatedAt: Date.now() });
          showToast(t('snippets.updatedSuccess'), 'success');
          const indicator = document.getElementById('snip-save-indicator');
          if (indicator) indicator.textContent = t('common.saved');
        } catch (err) {
          showToast(err.message || t('common.errorOccurred'), 'error');
        }
      });

      // Copy button
      content.querySelector('#snip-copy-btn')?.addEventListener('click', async () => {
        const codeToCopy = activeEditor ? activeEditor.getValue() : selected.code || '';
        try {
          await navigator.clipboard.writeText(codeToCopy);
          showToast(t('common.copied'), 'success');
        } catch (err) {
          showToast(t('common.errorOccurred'), 'error');
        }
      });

      // Delete button
      content.querySelector('#snip-delete-btn')?.addEventListener('click', () => {
        showModal({
          title: t('common.confirmDelete'),
          message: t('common.confirmDelete'),
          confirmText: t('common.delete'),
          cancelText: t('common.cancel'),
          onConfirm: async () => {
            try {
              await deleteSnippet(selected.id);
              const list = store.get('snippets') || [];
              const updated = list.filter((s) => s.id !== selected.id);
              store.set('snippets', updated);
              selectedId = updated[0]?.id || null;
              showToast(t('snippets.deletedSuccess'), 'success');
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
