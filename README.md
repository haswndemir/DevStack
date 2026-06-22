# DevStack

DevStack is a modern, responsive, dark-themed personal developer dashboard built with Vanilla JavaScript, Vite, Firebase, and Gemini API. It acts as a central hub for developers to store bookmarks, snippets, notes, and utilize an intelligent AI Assistant for code generation and refactoring.

## 🚀 Features

- **Responsive & Modern UI**: Built with pure CSS featuring a glassmorphic design and sleek animations.
- **Authentication**: Secure email/password login and registration using Firebase Auth.
- **Cloud Database**: Real-time CRUD operations for Bookmarks, Code Snippets, and Notes via Firestore.
- **AI Assistant**: Deep integration with Google's `@google/genai` SDK using `gemini-2.5-flash` model for intelligent coding assistance.
- **Personalized Dashboard**: A quick look at your saved resources, notifications, and profile settings.
- **State Management**: Custom lightweight reactive store handling UI state and data binding.

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla JavaScript (ESModules), Custom CSS
- **Bundler**: Vite
- **Backend/BaaS**: Firebase (Authentication, Firestore)
- **AI Integration**: Google Gemini API (`@google/genai`)

## 📦 Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/DevStack.git
   cd DevStack
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root of your project and add your Gemini API Key:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Firebase Configuration:**
   Ensure your Firebase details are populated inside `src/firebase.js`. You will need to create a project in Firebase Console, enable Authentication (Email/Password), and create a Firestore Database.

5. **Start Development Server:**
   ```bash
   npm run dev
   ```

6. **Build for Production:**
   ```bash
   npm run build
   ```

## 📝 License

This project is open-source and available under the MIT License.
