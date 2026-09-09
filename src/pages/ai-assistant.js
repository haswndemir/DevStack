// DevStack — AI Assistant Page
import { store } from '../store.js';
import { showToast } from '../components/toast.js';
import { formatTime } from '../utils/date.js';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { t } from '../i18n/index.js';
import { auth } from '../firebase.js';
import { CLIENT_AI_CONFIG } from '../config/ai.js';

export function renderAIAssistant() {
  const content = document.getElementById('page-content');
  if (!content) return;

  let messages = store.get('aiMessages') || [];

  function render() {
    const user = store.get('user');
    const userName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Developer';
    const userInitial = userName.charAt(0).toUpperCase();

    content.innerHTML = `
      <div class="ai-page animate-fade-in-up">
        <!-- Chat Area -->
        <section class="ai__chat no-scrollbar" id="ai-chat">
          ${messages.length === 0 ? `
            <!-- Welcome State -->
            <div class="ai__welcome animate-fade-in-up">
              <div class="ai__welcome-icon">
                <span class="material-symbols-outlined icon-filled" style="font-size:2.5rem">smart_toy</span>
              </div>
              <h2 class="text-headline-md">${t('ai.welcomeTitle', { name: userName })}</h2>
              <p style="color:var(--outline);margin-top:0.5rem">${t('ai.welcomeSubtitle')}</p>
              
              <div class="ai__suggestions">
                <button class="ai__suggestion" data-prompt="${t('ai.suggestion1Title')}: ${t('ai.suggestion1Desc')}">
                  <span class="material-symbols-outlined" style="color:var(--primary)">auto_fix_high</span>
                  <div>
                    <p style="font-size:0.875rem;font-weight:600">${t('ai.suggestion1Title')}</p>
                    <p style="font-size:0.75rem;color:var(--outline)">${t('ai.suggestion1Desc')}</p>
                  </div>
                </button>

                <button class="ai__suggestion" data-prompt="${t('ai.suggestion2Title')}: ${t('ai.suggestion2Desc')}">
                  <span class="material-symbols-outlined" style="color:var(--secondary)">bug_report</span>
                  <div>
                    <p style="font-size:0.875rem;font-weight:600">${t('ai.suggestion2Title')}</p>
                    <p style="font-size:0.75rem;color:var(--outline)">${t('ai.suggestion2Desc')}</p>
                  </div>
                </button>

                <button class="ai__suggestion" data-prompt="${t('ai.suggestion3Title')}: ${t('ai.suggestion3Desc')}">
                  <span class="material-symbols-outlined" style="color:var(--tertiary)">translate</span>
                  <div>
                    <p style="font-size:0.875rem;font-weight:600">${t('ai.suggestion3Title')}</p>
                    <p style="font-size:0.75rem;color:var(--outline)">${t('ai.suggestion3Desc')}</p>
                  </div>
                </button>

                <button class="ai__suggestion" data-prompt="${t('ai.suggestion4Title')}: ${t('ai.suggestion4Desc')}">
                  <span class="material-symbols-outlined" style="color:var(--primary)">rule</span>
                  <div>
                    <p style="font-size:0.875rem;font-weight:600">${t('ai.suggestion4Title')}</p>
                    <p style="font-size:0.75rem;color:var(--outline)">${t('ai.suggestion4Desc')}</p>
                  </div>
                </button>
              </div>
            </div>
          ` : ''}

          <!-- Messages Stream -->
          <div class="ai__messages" id="ai-messages">
            ${messages.map((msg, idx) => msg.role === 'user' ? `
              <div class="ai__msg ai__msg--user animate-fade-in">
                <div class="ai__msg-avatar">${userInitial}</div>
                <div class="ai__msg-content">
                  <div class="ai__msg-bubble ai__msg-bubble--user">
                    <p>${escapeHtml(msg.text)}</p>
                  </div>
                  <span class="ai__msg-time">${msg.time}</span>
                </div>
              </div>
            ` : `
              <div class="ai__msg ai__msg--ai animate-fade-in">
                <div class="ai__msg-avatar ai__msg-avatar--ai">
                  <span class="material-symbols-outlined icon-filled" style="font-size:1.25rem">smart_toy</span>
                </div>
                <div class="ai__msg-content" style="${msg.isLoading ? 'opacity:0.7;animation:pulse 1.5s infinite' : ''}">
                  <div class="ai__msg-bubble ai__msg-bubble--ai">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem">
                      <p style="font-size:0.75rem;font-weight:700;color:var(--primary)">${CLIENT_AI_CONFIG.assistantName} • ${msg.modelDisplay || CLIENT_AI_CONFIG.modelDisplay}</p>
                    </div>
                    <div class="ai__msg-text markdown-body">
                      ${msg.isLoading ? `<p>${t('ai.thinking')}</p>` : DOMPurify.sanitize(marked.parse(msg.text || ''))}
                    </div>
                  </div>
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-top:0.25rem">
                    <span class="ai__msg-time">${msg.time}</span>
                    ${!msg.isLoading ? `
                      <button class="btn-icon ai-copy-msg" data-idx="${idx}" title="${t('common.copy')}">
                        <span class="material-symbols-outlined" style="font-size:0.875rem">content_copy</span>
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Input Box -->
        <footer class="ai__input-area">
          <div class="ai__input-wrapper">
            <div class="ai__input-box">
              <textarea class="ai__input" id="ai-input" rows="1" placeholder="${t('ai.promptPlaceholder')}"></textarea>
              <button class="btn btn-primary ai__send-btn" id="ai-send" title="${t('ai.send')}">
                <span class="ai__send-text">${t('ai.send')}</span>
                <span class="material-symbols-outlined" style="font-size:1.125rem">send</span>
              </button>
            </div>
            <div class="ai__input-footer">
              <span style="display:flex;align-items:center;gap:0.35rem">
                <span class="material-symbols-outlined" style="font-size:0.875rem;color:var(--secondary)">lock</span>
                <span class="ai__model-text">${t('ai.statusOnline')}</span>
              </span>
              <span class="ai__shortcut-text">${t('ai.disclaimer')}</span>
            </div>
          </div>
        </footer>
      </div>
    `;

    // Scroll to bottom
    const chat = document.getElementById('ai-chat');
    if (chat) chat.scrollTop = chat.scrollHeight;

    // Suggestion buttons
    content.querySelectorAll('.ai__suggestion').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = btn.dataset.prompt;
        if (p) sendMessage(p);
      });
    });

    // Copy message buttons
    content.querySelectorAll('.ai-copy-msg').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.dataset.idx, 10);
        const targetMsg = messages[idx];
        if (targetMsg?.text) {
          try {
            await navigator.clipboard.writeText(targetMsg.text);
            showToast(t('common.copied'), 'success');
          } catch (e) {
            showToast(t('common.errorOccurred'), 'error');
          }
        }
      });
    });

    // Send button
    content.querySelector('#ai-send')?.addEventListener('click', () => {
      const input = document.getElementById('ai-input');
      if (input?.value.trim()) sendMessage(input.value.trim());
    });

    // Enter to submit
    content.querySelector('#ai-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const input = document.getElementById('ai-input');
        if (input?.value.trim()) sendMessage(input.value.trim());
      }
    });

    // Auto-resize textarea
    content.querySelector('#ai-input')?.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 180) + 'px';
    });
  }

  async function sendMessage(text) {
    const now = formatTime(new Date());
    messages.push({ role: 'user', text, time: now });
    store.set('aiMessages', messages);
    render();

    const input = document.getElementById('ai-input');
    const sendBtn = document.getElementById('ai-send');
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

    // Loading placeholder
    messages.push({ role: 'ai', text: '', time: formatTime(new Date()), isLoading: true });
    render();

    try {
      // Get valid fresh Firebase ID token from authenticated user
      if (!auth.currentUser) {
        throw new Error(t('ai.authRequired') || 'AI asistanını kullanmak için lütfen giriş yapınız.');
      }
      const idToken = await auth.currentUser.getIdToken(true);

      // History
      const payloadMessages = messages
        .filter((m) => !m.isLoading)
        .map((m) => ({
          role: m.role === 'ai' ? 'model' : 'user',
          text: m.text,
        }));

      const res = await fetch(CLIENT_AI_CONFIG.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ messages: payloadMessages }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      messages.pop(); // Remove loading
      messages.push({
        role: 'ai',
        text: data.reply || t('ai.welcomeSubtitle'),
        modelDisplay: data.modelDisplay || CLIENT_AI_CONFIG.modelDisplay,
        time: formatTime(new Date()),
      });
      store.set('aiMessages', messages);
    } catch (error) {
      console.error('AI chat error:', error);
      messages.pop();
      messages.push({
        role: 'ai',
        text: `${t('ai.errorOccurred', { error: error.message })}`,
        time: formatTime(new Date()),
      });
      store.set('aiMessages', messages);
    }

    if (input) {
      input.disabled = false;
      input.value = '';
      input.style.height = 'auto';
      input.focus();
    }
    if (sendBtn) sendBtn.disabled = false;
    render();
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
