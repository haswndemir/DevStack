// src/components/editor.js - Monaco Code Editor Integration with Resilient Fallback
import loader from '@monaco-editor/loader';

// Configure CDN for Monaco loader
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs',
  },
});

export async function initCodeEditor(container, { value = '', language = 'javascript', readOnly = false, onChange = null } = {}) {
  const currentTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'vs' : 'vs-dark';

  try {
    const monaco = await loader.init();
    // Clear container
    container.innerHTML = '';
    const editorInstance = monaco.editor.create(container, {
      value,
      language,
      theme: currentTheme,
      readOnly,
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
      lineNumbers: 'on',
      tabSize: 2,
      wordWrap: 'on',
      padding: { top: 12, bottom: 12 },
    });

    if (onChange) {
      editorInstance.onDidChangeModelContent(() => {
        onChange(editorInstance.getValue());
      });
    }

    const themeChangeHandler = (e) => {
      const nextTheme = e.detail?.theme === 'light' ? 'vs' : 'vs-dark';
      monaco.editor.setTheme(nextTheme);
    };
    window.addEventListener('devstack-theme-changed', themeChangeHandler);

    return {
      getValue: () => editorInstance.getValue(),
      setValue: (val) => editorInstance.setValue(val || ''),
      setLanguage: (lang) => {
        const model = editorInstance.getModel();
        if (model) monaco.editor.setModelLanguage(model, lang);
      },
      setTheme: (themeName) => {
        monaco.editor.setTheme(themeName === 'light' ? 'vs' : 'vs-dark');
      },
      find: () => {
        editorInstance.focus();
        editorInstance.getAction('actions.find')?.run();
      },
      replace: () => {
        editorInstance.focus();
        editorInstance.getAction('editor.action.startFindReplaceAction')?.run();
      },
      format: () => {
        editorInstance.getAction('editor.action.formatDocument')?.run();
      },
      layout: () => editorInstance.layout(),
      dispose: () => {
        window.removeEventListener('devstack-theme-changed', themeChangeHandler);
        editorInstance.dispose();
      },
      editor: editorInstance,
    };
  } catch (err) {
    console.warn('Monaco editor could not be loaded via CDN, falling back to native styled editor:', err);
    // Graceful fallback: high-end native code textarea
    container.innerHTML = '';
    const textarea = document.createElement('textarea');
    textarea.className = 'native-code-fallback';
    textarea.style.width = '100%';
    textarea.style.height = '100%';
    textarea.style.minHeight = '240px';
    textarea.style.background = 'var(--surface-container-highest)';
    textarea.style.color = 'var(--on-surface)';
    textarea.style.fontFamily = "'JetBrains Mono', monospace";
    textarea.style.fontSize = '0.875rem';
    textarea.style.border = '1px solid var(--outline-variant)';
    textarea.style.borderRadius = 'var(--radius-md)';
    textarea.style.padding = '1rem';
    textarea.style.resize = 'vertical';
    textarea.spellcheck = false;
    textarea.value = value;
    if (readOnly) textarea.readOnly = true;

    if (onChange) {
      textarea.addEventListener('input', () => onChange(textarea.value));
    }
    container.appendChild(textarea);

    return {
      getValue: () => textarea.value,
      setValue: (val) => { textarea.value = val || ''; },
      setLanguage: () => {},
      setTheme: () => {},
      find: () => textarea.focus(),
      replace: () => textarea.focus(),
      format: () => {},
      layout: () => {},
      dispose: () => {},
      editor: textarea,
    };
  }
}
