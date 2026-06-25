# SCCMS Portfolio Project: Prompt & Snippet Vault Build Checklist

## 📋 Phase 1: Project Scaffolding
- [x] Open a clean directory named `prompt-vault` in the Antigravity workspace.
- [x] Run the scaffolding prompt to initialize the framework stack.
  - **Antigravity Prompt:**
    > "Initialize a new Tauri v2 project in this current directory. Use Vite, React, and TypeScript. Use npm as the package manager. Once the scaffolding is complete, run the install command to fetch all dependencies. Do not start the dev server yet. Generate a Walkthrough artifact once complete."
- [x] Verify that `package.json`, `src-tauri/Cargo.toml`, and the `src` folder are correctly generated in the file explorer.

## 🗄️ Phase 2: Embedded Database Integration
- [x] Add the native Tauri SQL engine plugin.
- [x] Write the local relational schema file.
- [x] Inject startup database migrations into the Rust layer.
  - **Antigravity Prompt:**
    > "We need to set up a local SQLite database using Tauri's official SQL plugin. Please do the following:
    > 1. Add `tauri-plugin-sql` to the project. 
    > 2. Create a `schema.sql` file in the `src-tauri` folder with the following tables: `categories`, `snippets`, `tags`, and a pivot table `snippet_tags`. Ensure you use SQLite syntax (e.g., `INTEGER PRIMARY KEY AUTOINCREMENT`).
    > 3. Update `src-tauri/src/main.rs` to register the SQL plugin and execute the migrations from `schema.sql` on startup. Name the local database file `prompt_vault.sqlite`.
    > Generate an Implementation Plan artifact for me to review before you modify the Rust files."
- [x] Confirm that `src-tauri/schema.sql` exists and `main.rs` compiles without errors.

## 🔗 Phase 3: TypeScript Data Access Layer (IPC Bridge)
- [x] Create a dedicated database abstraction directory (`src/db/`).
- [x] Map raw SQLite tables to strict TypeScript interfaces.
- [x] Implement secure frontend query wrappers.
  - **Antigravity Prompt:**
    > "Create a new folder called `src/db`. Inside it, create a file named `queries.ts`. Using the `@tauri-apps/plugin-sql` API, write TypeScript functions to handle the core CRUD operations for our snippets: 
    > - `createSnippet(title, content, categoryId)`
    > - `getAllSnippets()`
    > - `addTagToSnippet(snippetId, tagId)`
    > Make sure to define strict TypeScript interfaces for `Snippet`, `Category`, and `Tag` at the top of the file."

## 🎨 Phase 4: Frontend UI Construction
- [x] Build a modern two-pane responsive workspace layout.
- [x] Connect sidebar categories to filter local database records.
- [x] Bind the snippet entry form to the database insertion script.
  - **Antigravity Prompt:**
    > "Build the main React UI in `src/App.tsx`. I want a modern, two-pane layout using standard CSS or Tailwind (if you install it). 
    > - The left pane should be a sidebar listing the Categories.
    > - The right pane should display a grid or list of Snippets. 
    > - Include a 'New Snippet' button that opens a simple form to insert data. 
    > Wire these components up to use the database functions you created in `queries.ts`. Execute `npm run tauri dev` in the terminal to launch the desktop window when you are done."
- [x] Run the app locally and verify a window opens displaying the UI.

## 🚀 Phase 5: OS Feature Integration & Polish
- [x] Integrate native OS clipboard interactions.
  - **Antigravity Prompt:** `Add a clipboard copy feature. When a user clicks a snippet, use Tauri's clipboard API to copy the content to the OS clipboard, and show a brief success toast.`
- [x] Implement frontend syntax highlighting or markdown styling for prompt blocks.
  - **Antigravity Prompt:** `The database is working, but the UI looks a bit plain. Redesign the snippet cards to look more like code blocks, and add syntax highlighting logic.`
- [x] Build a production installer executable (`.exe` or `.msi`) to verify the asset bundles correctly.

### Phase 6: App Branding
- [x] Change app name to Prompt Vault
- [x] Generate and set custom app icon

