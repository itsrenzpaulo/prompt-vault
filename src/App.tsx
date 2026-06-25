import { useEffect, useState } from "react";
import "./App.css";
import {
  Snippet,
  Category,
  getAllSnippets,
  getAllCategories,
  createSnippet,
  deleteSnippet,
  createCategory,
} from "./db/queries";

// Clipboard plugin for Tauri v2
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

// Syntax Highlighter
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

function App() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [viewSnippet, setViewSnippet] = useState<Snippet | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSnippetCategory, setNewSnippetCategory] = useState<number | "">("");

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const fetchedSnippets = await getAllSnippets();
      setSnippets(fetchedSnippets);
      const fetchedCategories = await getAllCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      console.error("Failed to load snippets or categories:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000); // matching CSS fadeOut timing
  };

  const handleCopy = async (content: string) => {
    try {
      // Fallback for Chrome web testing or restricted environments
      if ('__TAURI_INTERNALS__' in window) {
        await writeText(content);
      } else {
        await navigator.clipboard.writeText(content);
      }
      showToast("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy text: ", err);
      showToast("Failed to copy!");
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await createCategory(newCategoryName);
      setNewCategoryName("");
      setIsCategoryModalOpen(false);
      showToast("Category created!");
      await loadData();
    } catch (error) {
      console.error("Failed to create category:", error);
      showToast("Failed to create category.");
    }
  };

  const handleDeleteSnippet = async (id: number) => {
    try {
      await deleteSnippet(id);
      setViewSnippet(null);
      showToast("Snippet deleted!");
      await loadData();
    } catch (error) {
      console.error("Failed to delete snippet:", error);
      showToast("Failed to delete snippet.");
    }
  };

  const handleAddSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      const catId = typeof newSnippetCategory === "number" ? newSnippetCategory : undefined;
      await createSnippet(newTitle, newContent, catId);
      setNewTitle("");
      setNewContent("");
      setNewSnippetCategory("");
      setIsModalOpen(false);
      showToast("Snippet saved!");
      await loadData();
    } catch (error) {
      console.error("Failed to create snippet:", error);
      showToast("Failed to save snippet.");
    }
  };

  const displayedSnippets = selectedCategory
    ? snippets.filter((s) => s.category_id === selectedCategory)
    : snippets;

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Prompt Vault</h1>
        </div>
        <ul className="category-list">
          <li
            className={`category-item ${selectedCategory === null ? "active" : ""}`}
            onClick={() => setSelectedCategory(null)}
          >
            <span role="img" aria-label="All">📚</span> All Snippets
          </li>
          {categories.map((category) => (
            <li
              key={category.id}
              className={`category-item ${selectedCategory === category.id ? "active" : ""}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span role="img" aria-label="Folder">📁</span> {category.name}
            </li>
          ))}
          <li className="category-item" style={{ borderStyle: "dashed", marginTop: "1rem" }} onClick={() => setIsCategoryModalOpen(true)}>
            <span role="img" aria-label="Add">+</span> Add Category
          </li>
        </ul>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="top-bar">
          <h2>{selectedCategory === null ? "All Snippets" : "Category"}</h2>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            + New Snippet
          </button>
        </div>

        <div className="snippet-grid">
          {displayedSnippets.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>No snippets found. Create one!</p>
          ) : (
            displayedSnippets.map((snippet) => (
              <div 
                key={snippet.id} 
                className="snippet-card"
                onClick={() => setViewSnippet(snippet)}
              >
                <div className="copy-indicator">View Full Snippet</div>
                <h3>{snippet.title}</h3>
                <div className="snippet-content-preview">
                  <SyntaxHighlighter
                    language="markdown"
                    style={vscDarkPlus}
                    customStyle={{
                      background: "transparent",
                      padding: 0,
                      margin: 0,
                      fontSize: "0.85rem",
                      overflow: "hidden" // Prevent scrolling in preview cards
                    }}
                    wrapLongLines={true}
                  >
                    {snippet.content}
                  </SyntaxHighlighter>
                </div>
                <div className="snippet-meta">
                  <span>ID: {snippet.id}</span>
                  <span>{new Date(snippet.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Add Snippet Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Snippet</h2>
            </div>
            <form onSubmit={handleAddSnippet}>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  id="title"
                  className="form-input"
                  type="text"
                  placeholder="e.g., Rust Error Handling"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="category">Category (Optional)</label>
                <select
                  id="category"
                  className="form-input"
                  value={newSnippetCategory}
                  onChange={(e) => setNewSnippetCategory(e.target.value ? Number(e.target.value) : "")}
                >
                  <option value="">No Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="content">Prompt Content</label>
                <textarea
                  id="content"
                  className="form-input"
                  placeholder="Paste your prompt or code snippet here..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                ></textarea>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Snippet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Snippet Modal */}
      {viewSnippet && (
        <div className="modal-overlay" onClick={() => setViewSnippet(null)}>
          <div className="modal-content view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{viewSnippet.title}</h2>
              <button className="btn-secondary" onClick={() => handleCopy(viewSnippet.content)}>
                📋 Copy
              </button>
            </div>
            <div className="view-snippet-content">
              <SyntaxHighlighter
                language="markdown"
                style={vscDarkPlus}
                customStyle={{
                  background: "rgba(0, 0, 0, 0.3)",
                  padding: "1rem",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  margin: 0
                }}
                wrapLongLines={true}
              >
                {viewSnippet.content}
              </SyntaxHighlighter>
            </div>
            <div className="modal-actions" style={{ marginTop: "1rem", justifyContent: "space-between" }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ borderColor: "var(--text-muted)", color: "var(--text-muted)" }}
                onClick={() => handleDeleteSnippet(viewSnippet.id)}
              >
                🗑️ Delete
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setViewSnippet(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isCategoryModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCategoryModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Category</h2>
            </div>
            <form onSubmit={handleAddCategory}>
              <div className="form-group">
                <label htmlFor="cat-name">Category Name</label>
                <input
                  id="cat-name"
                  className="form-input"
                  type="text"
                  placeholder="e.g., Marketing"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCategoryModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification Overlay */}
      {toastMessage && (
        <div className="toast-container">
          <span role="img" aria-label="Success">✨</span> {toastMessage}
        </div>
      )}
    </div>
  );
}

export default App;
