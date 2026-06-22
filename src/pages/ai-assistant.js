// DevStack — AI Assistant Page
import { store } from '../store.js';
import { showToast } from '../components/toast.js';
import { formatTime } from '../utils/date.js';
import { GoogleGenAI } from '@google/genai';

let aiInstance = null;

export function renderAIAssistant() {
  const content = document.getElementById('page-content');
  let messages = [];

  function render() {
    const user = store.get('user');
    const userName = user?.displayName?.split(' ')[0] || 'Geliştirici';
    const userInitial = userName.charAt(0).toUpperCase();

    content.innerHTML = `
      <div class="ai-page">
        <!-- Chat Area -->
        <section class="ai__chat no-scrollbar" id="ai-chat">
          ${messages.length === 0 ? `
            <!-- Welcome State -->
            <div class="ai__welcome animate-fade-in-up">
              <div class="ai__welcome-icon">
                <span class="material-symbols-outlined icon-filled" style="font-size:2.5rem">smart_toy</span>
              </div>
              <h2 class="text-headline-md">Merhaba ${userName}, sana nasıl yardımcı olabilirim?</h2>
              <p style="color:var(--outline);margin-top:0.5rem">Bugün yeni bir özellik mi geliştiriyoruz yoksa mevcut kodu mu optimize ediyoruz?</p>
              <div class="ai__suggestions">
                <button class="ai__suggestion" data-msg="Bu kodu optimize et">
                  <span class="material-symbols-outlined" style="color:var(--primary)">auto_fix_high</span>
                  <div>
                    <p style="font-size:0.875rem;font-weight:600">Bu kodu optimize et</p>
                    <p style="font-size:0.75rem;color:var(--outline)">Seçili fonksiyonu daha performanslı hale getir.</p>
                  </div>
                </button>
                <button class="ai__suggestion" data-msg="Yeni bir yer imi kategorisi oluştur">
                  <span class="material-symbols-outlined" style="color:var(--tertiary)">folder_zip</span>
                  <div>
                    <p style="font-size:0.875rem;font-weight:600">Yeni bir yer imi kategorisi oluştur</p>
                    <p style="font-size:0.75rem;color:var(--outline)">Frontend frameworklerini organize edelim.</p>
                  </div>
                </button>
                <button class="ai__suggestion" data-msg="Hata ayıklama yardımcısı - stack trace analizi yap">
                  <span class="material-symbols-outlined" style="color:var(--secondary)">bug_report</span>
                  <div>
                    <p style="font-size:0.875rem;font-weight:600">Hata ayıklama yardımcısı</p>
                    <p style="font-size:0.75rem;color:var(--outline)">Stack trace verisini analiz et.</p>
                  </div>
                </button>
                <button class="ai__suggestion" data-msg="JavaScript kodumu TypeScript'e çevir">
                  <span class="material-symbols-outlined" style="color:var(--primary)">translate</span>
                  <div>
                    <p style="font-size:0.875rem;font-weight:600">Dili TypeScript'e çevir</p>
                    <p style="font-size:0.75rem;color:var(--outline)">Vanilla JS kodunu TS'e dönüştür.</p>
                  </div>
                </button>
              </div>
            </div>
          ` : ''}

          <!-- Messages -->
          <div class="ai__messages" id="ai-messages">
            ${messages.map(msg => msg.role === 'user' ? `
              <div class="ai__msg ai__msg--user animate-fade-in">
                <div class="ai__msg-avatar">${userInitial}</div>
                <div class="ai__msg-content">
                  <div class="ai__msg-bubble ai__msg-bubble--user">
                    <p>${msg.text}</p>
                  </div>
                  <span class="ai__msg-time">${msg.time} • Gönderildi</span>
                </div>
              </div>
            ` : `
              <div class="ai__msg ai__msg--ai animate-fade-in">
                <div class="ai__msg-avatar ai__msg-avatar--ai">
                  <span class="material-symbols-outlined icon-filled" style="font-size:1.25rem">smart_toy</span>
                </div>
                <div class="ai__msg-content" style="${msg.isLoading ? 'opacity:0.6;animation:pulse 1.5s infinite' : ''}">
                  <div class="ai__msg-bubble ai__msg-bubble--ai">
                    <p style="font-size:0.875rem;font-weight:600;color:var(--primary);margin-bottom:0.75rem">DevBot • AI Asistan</p>
                    <div class="ai__msg-text">${msg.isLoading ? msg.text : formatAIResponse(msg.text)}</div>
                  </div>
                  <span class="ai__msg-time">${msg.time} • DevBot tarafından oluşturuldu</span>
                  ${msg.isLoading ? '' : `
                  <div class="ai__msg-actions">
                    <button class="btn-icon" title="Kopyala" onclick="navigator.clipboard.writeText(\`${msg.text.replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`)"><span class="material-symbols-outlined" style="font-size:0.875rem">content_copy</span></button>
                    <button class="btn-icon" title="Beğen"><span class="material-symbols-outlined" style="font-size:0.875rem">thumb_up</span></button>
                  </div>
                  `}
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Input Area -->
        <footer class="ai__input-area">
          <div class="ai__input-wrapper">
            <div class="ai__input-box">
              <div class="ai__input-tools">
                <button class="btn-icon" title="Dosya Ekle"><span class="material-symbols-outlined">attach_file</span></button>
              </div>
              <textarea class="ai__input" id="ai-input" rows="1" placeholder="Asistana bir şeyler sor..."></textarea>
              <button class="btn btn-primary ai__send-btn" id="ai-send">
                <span class="ai__send-text">Gönder</span>
                <span class="material-symbols-outlined" style="font-size:1.125rem">send</span>
              </button>
            </div>
            <div class="ai__input-footer">
              <span style="display:flex;align-items:center;gap:0.25rem">
                <span class="material-symbols-outlined" style="font-size:0.75rem">info</span>
                <span class="ai__model-text">AI Asistan Aktif</span>
              </span>
              <span class="ai__shortcut-text">Shift + Enter: Alt Satır</span>
            </div>
          </div>
        </footer>
      </div>
    `;

    // Scroll to bottom
    const chat = document.getElementById('ai-chat');
    if (chat) chat.scrollTop = chat.scrollHeight;

    // Suggestion click
    content.querySelectorAll('.ai__suggestion').forEach(btn => {
      btn.addEventListener('click', () => sendMessage(btn.dataset.msg));
    });

    // Send button
    document.getElementById('ai-send')?.addEventListener('click', () => {
      const input = document.getElementById('ai-input');
      if (input?.value.trim()) sendMessage(input.value.trim());
    });

    // Enter to send
    document.getElementById('ai-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const input = document.getElementById('ai-input');
        if (input?.value.trim()) sendMessage(input.value.trim());
      }
    });

    // Auto-resize textarea
    document.getElementById('ai-input')?.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 192) + 'px';
    });
  }

  async function sendMessage(text) {
    const now = formatTime(new Date());
    messages.push({ role: 'user', text, time: now });
    render();

    // Disable input while generating
    const input = document.getElementById('ai-input');
    const sendBtn = document.getElementById('ai-send');
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
    
    // Add loading placeholder
    messages.push({ role: 'ai', text: 'Düşünüyor...', time: formatTime(new Date()), isLoading: true });
    render();

    try {
      if (!aiInstance) {
        aiInstance = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      }

      // Prepare history
      const contents = messages.filter(m => !m.isLoading).map(m => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const response = await aiInstance.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents
      });

      // Replace loading message with actual response
      messages.pop(); 
      messages.push({ role: 'ai', text: response.text, time: formatTime(new Date()) });

    } catch (error) {
      console.error(error);
      messages.pop();
      messages.push({ role: 'ai', text: 'Bir hata oluştu: ' + error.message, time: formatTime(new Date()) });
    }

    if (input) input.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    if (input) input.focus();
    render();
  }

  function formatAIResponse(text) {
    return text
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<div style="margin:1rem 0;padding:1rem;background:var(--surface-container-highest);border-radius:var(--radius-xl);border:1px solid rgba(255,255,255,0.05);font-family:var(--font-mono);font-size:0.8125rem;overflow-x:auto"><div style="display:flex;justify-content:space-between;margin-bottom:0.5rem"><span style="color:var(--outline);font-size:0.6875rem">$1</span></div><pre style="color:var(--secondary);margin:0;white-space:pre-wrap">$2</pre></div>')
      .replace(/`([^`]+)`/g, '<code style="background:var(--surface-container-highest);padding:0.125rem 0.375rem;border-radius:var(--radius-xs);font-family:var(--font-mono);font-size:0.8125rem;color:var(--primary)">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:var(--on-surface)">$1</strong>')
      .replace(/\n/g, '<br>');
  }

  render();
}
