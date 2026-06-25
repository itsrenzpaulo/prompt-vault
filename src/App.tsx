import { useEffect, useState } from "react";
import "./App.css";
import {
  Snippet,
  getAllSnippets,
  createSnippet,
} from "./db/queries";

// Clipboard plugin for Tauri v2
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

// Syntax Highlighter
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

function App() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  // const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const fetchedSnippets = await getAllSnippets();
      setSnippets(fetchedSnippets);
    } catch (error) {
      console.error("Failed to load snippets:", error);
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
      await writeText(content);
      showToast("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy text: ", err);
      showToast("Failed to copy!");
    }
  };

  const handleAddSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      await createSnippet(newTitle, newContent, selectedCategory ?? undefined);
      setNewTitle("");
      setNewContent("");
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
          {/* Future dynamic categories will render here */}
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
                onClick={() => handleCopy(snippet.content)}
              >
                <div className="copy-indicator">Click to copy</div>
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
