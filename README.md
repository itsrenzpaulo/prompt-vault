<div align="center">
  <img src="public/app-icon.jpg" alt="Prompt Vault Logo" width="128" style="border-radius: 20px;">
  <h1>Prompt Vault</h1>
  <p>A beautiful, lightning-fast desktop application for managing, organizing, and utilizing your AI prompts and code snippets.</p>
</div>

---

## ✨ Features
- 🚀 **Blazing Fast**: Powered by a Rust & Tauri v2 backend for ultra-fast startup and a microscopic memory footprint.
- 🎨 **Glassmorphism UI**: A premium, sleek dark mode aesthetic with dynamic glassmorphism materials and fluid animations.
- 💾 **Local-First Privacy**: All your snippets are saved directly to a secure, local SQLite database on your machine. No cloud, no tracking.
- 📋 **Native Clipboard**: Flawless 1-click clipboard integration that uses OS-native APIs (with dual web-fallback logic) for instant usage.
- 🗂️ **Dynamic Categories**: Organize your prompts cleanly with custom folders and instantly filter your workspace.
- 💻 **Syntax Highlighting**: Beautiful preview formatting for markdown and code inside your prompts.

## 🛠️ Tech Stack
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Vanilla CSS with modern flexbox/grid and glassmorphism styling
- **Backend**: Rust, Tauri v2
- **Database**: SQLite (`@tauri-apps/plugin-sql`)

## 📥 Installation
1. Go to the **[Releases](../../releases)** page.
2. Download the `.msi` or `.exe` installer for Windows.
3. Install and run Prompt Vault!

## 💻 Development
To run this project locally, you need [Node.js](https://nodejs.org/) and [Rust](https://www.rust-lang.org/tools/install) installed.

```bash
# Install dependencies
npm install

# Run the app in development mode
npm run tauri dev

# Build the executable for production
npm run tauri build
```

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
