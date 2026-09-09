# DevStack

DevStack is a modern, responsive, production-ready developer workspace and productivity cockpit built with Vanilla JavaScript, Vite, Firebase, and Google Gemini API. It acts as a unified central ecosystem for software engineers to organize bookmarks, craft and highlight code snippets, draft Markdown engineering notes, and interact with an intelligent AI Assistant via a secure backend proxy.

---

## 🚀 Key Features

- **Personalized Engineering Dashboard**: Real-time overview of active bookmarks, code patterns, technical logs, and quick actions.
- **Bilingual Internationalization (i18n)**: 100% synchronized support for Turkish (Türkçe) and English with zero hardcoded strings and build-time validation.
- **Command Palette & Global Search**: Instant navigation and categorized search across bookmarks, snippets, and notes via `Ctrl + K` / `Cmd + K`.
- **Snippets with Monaco Editor**: Professional code editor with syntax highlighting, line numbers, and language support (JS, TS, Python, Go, Rust, SQL, HTML, CSS, Bash).
- **Markdown Notes with Live Preview**: Technical notes with split/preview modes and sanitized rendering powered by `marked` and `DOMPurify`.
- **Secure Gemini AI Assistant**: Server-side proxy (`/api/ai/chat`) powered by the official `@google/genai` SDK using Google's production stable Flash flagship (`gemini-2.5-flash`) with centralized `AI_MODEL` abstraction and resilient failover. Zero client-side API key exposure.
- **Persistent Notification Center**: Local and Firestore-backed notifications with unread counts and read receipts.
- **Granular Security & Firestore Rules**: User-isolated documents (`request.auth.uid == resource.data.userId`) and unique username reservation transactions.
- **Dark & Light Mode**: Curated HSL color system with glassmorphism, responsive sidebar drawer, and fluid animations.

---

## 🛠️ Architecture & Technology Stack

```
   Browser Client (SPA)
        │
        ├── UI Engine (Vanilla JS, CSS Tokens, Monaco Editor, DOMPurify)
        ├── i18n Engine (Turkish & English dictionaries)
        ├── Centralized Reactive Store (Observer Pattern)
        ├── Firebase Auth & Firestore Client SDK
        │
        ▼ (POST /api/ai/chat with Bearer Token)
   Vercel Serverless Function
        │
        ├── Token & Rate Limit Check
        ├── Centralized AI Model Abstraction (AI_MODEL)
        └── Official @google/genai SDK (GEMINI_API_KEY)
```

- **Frontend**: HTML5, Vanilla JavaScript (ESModules), Custom CSS Design System
- **Code Editor**: Monaco Editor (`@monaco-editor/loader`)
- **Sanitization & Markdown**: `DOMPurify`, `marked`
- **Bundler**: Vite
- **Backend / BaaS**: Firebase (Authentication, Firestore Database, Security Rules)
- **AI Integration**: Google Gemini (`@google/genai`, official stable production Flash model `gemini-2.5-flash` with failover chain)

---

## 📦 Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/haswndemir/DevStack.git
   cd DevStack
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   # Server-side AI Key (Used only by Vercel serverless /api/ai/chat)
   GEMINI_API_KEY=your_gemini_api_key_here

   # Client-side Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Verify Translations & Code Integrity:**
   ```bash
   node scripts/check-translations.js
   ```

5. **Start Local Development Server:**
   ```bash
   npm run dev
   ```

6. **Build for Production:**
   ```bash
   npm run build
   ```

---

## 🔒 Security Architecture

- **No Secrets in Client Bundle**: `GEMINI_API_KEY` is strictly server-side. Production bundle scans verify zero API key presence.
- **XSS Prevention**: Markdown outputs from AI and user notes are strictly sanitized through `DOMPurify`.
- **Firestore Security Rules**: Multi-tenant isolation defined in `firestore.rules`. Cross-user reads and writes are blocked at the database engine level.

---

## 🌐 Localization (i18n)

All user-facing strings are cataloged in `src/i18n/tr.json` and `src/i18n/en.json`. Automated CI verification ensures 100% key synchronization between languages before builds.

---

## 📝 License

This project is open-source and released under the MIT License.
