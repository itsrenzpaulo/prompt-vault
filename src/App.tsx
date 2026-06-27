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
  renameCategory,
  deleteCategory,
  getSetting,
  setSetting,
} from "./db/queries";

import { LockScreen, hashPassword } from "./LockScreen";

// Clipboard plugin for Tauri v2
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

// Syntax Highlighter
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

function App() {
  // Lock state
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const [isSetupMode, setIsSetupMode] = useState(false);

  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [viewSnippet, setViewSnippet] = useState<Snippet | null>(null);
  const [isEditingSnippet, setIsEditingSnippet] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#938f99");
  const [newSnippetCategory, setNewSnippetCategory] = useState<number | "">("");
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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

  const checkAuth = async () => {
    try {
      const storedPassword = await getSetting("master_password");
      if (!storedPassword) {
        setIsSetupMode(true);
      } else {
        setIsSetupMode(false);
      }
    } catch (e) {
      console.error("Failed to check auth:", e);
      setIsSetupMode(true);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleUnlock = async (password: string) => {
    const storedHash = await getSetting("master_password");
    const inputHash = await hashPassword(password);
    if (storedHash === inputHash) {
      await loadData(); // Load data in the background
      // Return true immediately so LockScreen can show success state
      setTimeout(() => {
        setIsLocked(false);
      }, 1000);
      return true;
    }
    return false;
  };

  const handleSetup = async (password: string) => {
    const hash = await hashPassword(password);
    await setSetting("master_password", hash);
    await loadData();
    // Return to let LockScreen show success state
    setTimeout(() => {
      setIsSetupMode(false);
      setIsLocked(false);
    }, 1000);
  };

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
        try {
          await writeText(content);
        } catch (tauriErr) {
          console.warn("Tauri clipboard failed, falling back to web clipboard:", tauriErr);
          await navigator.clipboard.writeText(content);
        }
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
      await createCategory(newCategoryName, newCategoryColor);
      setNewCategoryName("");
      setNewCategoryColor("#938f99");
      setIsCategoryModalOpen(false);
      showToast("Category created!");
      await loadData();
    } catch (error) {
      console.error("Failed to create category:", error);
      showToast("Failed to create category.");
    }
  };

  const handleDeleteCategory = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await deleteCategory(id);
      if (selectedCategory === id) setSelectedCategory(null);
      showToast("Category deleted!");
      await loadData();
    } catch (error) {
      console.error("Failed to delete category:", error);
      showToast("Failed to delete category.");
    }
  };

  const handleRenameCategorySubmit = async (e: React.FormEvent, id: number) => {
    e.preventDefault();
    if (!editingCategoryName.trim()) return;
    try {
      await renameCategory(id, editingCategoryName);
      setEditingCategoryId(null);
      showToast("Category renamed!");
      await loadData();
    } catch (error) {
      console.error("Failed to rename category:", error);
      showToast("Failed to rename category.");
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
      const tagsArray = newTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      await createSnippet(newTitle, newContent, catId, tagsArray);
      setNewTitle("");
      setNewContent("");
      setNewTags("");
      setNewSnippetCategory("");
      setIsModalOpen(false);
      showToast("Snippet saved!");
      await loadData();
    } catch (error) {
      console.error("Failed to create snippet:", error);
      showToast("Failed to save snippet.");
    }
  };

  const handleEditSnippetClick = () => {
    if (!viewSnippet) return;
    setNewTitle(viewSnippet.title);
    setNewContent(viewSnippet.content);
    setNewTags(viewSnippet.tags ? viewSnippet.tags.join(", ") : "");
    setNewSnippetCategory(viewSnippet.category_id ?? "");
    setIsEditingSnippet(true);
  };

  const handleUpdateSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewSnippet || !newTitle.trim() || !newContent.trim()) return;

    try {
      // Import updateSnippet dynamically or assume it was added to the imports at top
      // Wait, we need to add updateSnippet to imports at top of file! We will do that in the next chunk.
      const catId = typeof newSnippetCategory === "number" ? newSnippetCategory : undefined;
      const tagsArray = newTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      
      const { updateSnippet } = await import("./db/queries");
      await updateSnippet(viewSnippet.id, newTitle, newContent, catId, tagsArray);
      
      setIsEditingSnippet(false);
      setNewTitle("");
      setNewContent("");
      setNewTags("");
      setNewSnippetCategory("");
      showToast("Snippet updated!");
      
      // Update local view so modal reflects changes without needing a full reload to show them
      setViewSnippet({
        ...viewSnippet,
        title: newTitle,
        content: newContent,
        category_id: catId,
        tags: tagsArray,
        updated_at: new Date().toISOString()
      });
      
      await loadData();
    } catch (error) {
      console.error("Failed to update snippet:", error);
      showToast("Failed to update snippet.");
    }
  };

  const displayedSnippets = snippets.filter(s => {
    const matchesCategory = selectedCategory ? s.category_id === selectedCategory : true;
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.tags && s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  if (isLoadingAuth) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f13', color: 'white', fontFamily: 'system-ui, sans-serif' }}>Loading...</div>;
  }

  if (isLocked) {
    return <LockScreen isSetupMode={isSetupMode} onUnlock={handleUnlock} onSetup={handleSetup} />;
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Prompt Vault</h1>
        </div>
        <div 
          className={`category-item ${selectedCategory === null ? "active" : ""}`}
          onClick={() => setSelectedCategory(null)}
          style={{ marginBottom: '1rem', flexShrink: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="material-symbols-outlined">home</span> <span className="cat-name">All Snippets</span>
          </div>
        </div>
        
        <ul className="category-list">
          {categories.map((category) => (
            <li
              key={category.id}
              className={`category-item ${selectedCategory === category.id ? "active" : ""}`}
              onClick={() => {
                if (editingCategoryId !== category.id) setSelectedCategory(category.id);
              }}
            >
              {editingCategoryId === category.id ? (
                <form onSubmit={(e) => handleRenameCategorySubmit(e, category.id)} style={{ display: 'flex', width: '100%' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '0.2rem 0.5rem', width: '100%', fontSize: '0.9rem' }}
                    value={editingCategoryName}
                    onChange={(e) => setEditingCategoryName(e.target.value)}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    onBlur={() => setEditingCategoryId(null)}
                  />
                </form>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '4px', height: '20px', borderRadius: '999px', backgroundColor: category.color || '#938f99' }}></div>
                    <span className="cat-name" title={category.name}>{category.name}</span>
                  </div>
                  <div className="category-actions">
                    <button 
                      type="button"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setEditingCategoryId(category.id); 
                        setEditingCategoryName(category.name); 
                      }} 
                      title="Rename"
                    ><span className="material-symbols-outlined" style={{fontSize: '1rem'}}>edit</span></button>
                    <button 
                      type="button"
                      onClick={(e) => handleDeleteCategory(e, category.id)} 
                      title="Delete"
                    ><span className="material-symbols-outlined" style={{fontSize: '1rem'}}>delete</span></button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
        
        <div 
          className="category-item" 
          style={{ borderStyle: "dashed", marginTop: "1rem", flexShrink: 0 }} 
          onClick={() => setIsCategoryModalOpen(true)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="material-symbols-outlined">add</span> <span className="cat-name">Add Category</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="top-bar">
          <h2>{selectedCategory === null ? "All Snippets" : categories.find(c => c.id === selectedCategory)?.name || "Category"}</h2>
          <div className="search-bar">
            <span className="material-symbols-outlined">search</span>
            <input 
              type="text" 
              placeholder="Search title, content, or tags..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={() => { 
            setNewTitle("");
            setNewContent("");
            setNewTags("");
            setNewSnippetCategory(selectedCategory ?? ""); 
            setIsModalOpen(true); 
          }}>
            <span className="material-symbols-outlined">add</span> New Snippet
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
                {snippet.tags && snippet.tags.length > 0 && (
                  <div className="tags-container">
                    {snippet.tags.map(tag => (
                      <span key={tag} className="tag-pill">{tag}</span>
                    ))}
                  </div>
                )}
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
        <div className="modal-overlay">
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
                <label htmlFor="tags">Tags (Comma separated)</label>
                <input
                  id="tags"
                  className="form-input"
                  type="text"
                  placeholder="e.g., rust, api, sql"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
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
                  <span className="material-symbols-outlined">close</span> Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <span className="material-symbols-outlined">save</span> Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View/Edit Snippet Modal */}
      {viewSnippet && (
        <div className="modal-overlay">
          <div className="modal-content view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{viewSnippet.title}</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {!isEditingSnippet ? (
                  <>
                    <button className="btn-secondary" onClick={handleEditSnippetClick} title="Edit Snippet">
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button className="btn-secondary" onClick={() => handleCopy(viewSnippet.content)} title="Copy Snippet">
                      <span className="material-symbols-outlined">content_copy</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn-secondary" onClick={() => setIsEditingSnippet(false)} title="Cancel Edit">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                    <button className="btn-primary" onClick={handleUpdateSnippet} title="Save Snippet">
                      <span className="material-symbols-outlined">save</span>
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="view-snippet-content">
              {!isEditingSnippet ? (
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
              ) : (
                <textarea
                  className="form-input"
                  style={{ 
                    minHeight: '60vh',
                    width: '100%',
                    resize: 'vertical',
                    fontFamily: "'JetBrains Mono', monospace", 
                    fontSize: "0.95rem", 
                    background: "rgba(0, 0, 0, 0.3)", 
                    padding: "1rem",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)"
                  }}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  autoFocus
                />
              )}
            </div>
            
            {viewSnippet.tags && viewSnippet.tags.length > 0 && (
              <div className="tags-container" style={{ marginTop: '1rem' }}>
                {viewSnippet.tags.map(tag => (
                  <span key={tag} className="tag-pill">{tag}</span>
                ))}
              </div>
            )}
            
            {!isEditingSnippet && (
              <div className="modal-actions" style={{ marginTop: "1rem", justifyContent: "space-between" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ borderColor: "#ef4444", color: "#ef4444" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  onClick={() => handleDeleteSnippet(viewSnippet.id)}
                >
                  <span className="material-symbols-outlined">delete</span> Delete
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setViewSnippet(null)}
                >
                  <span className="material-symbols-outlined">close</span> Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isCategoryModalOpen && (
        <div className="modal-overlay">
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
              <div className="form-group">
                <label htmlFor="cat-color">Category Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input
                    id="cat-color"
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    style={{
                      width: '40px',
                      height: '40px',
                      padding: 0,
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      background: 'transparent',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{newCategoryColor}</span>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCategoryModalOpen(false)}
                >
                  <span className="material-symbols-outlined">close</span> Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <span className="material-symbols-outlined">save</span> Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification Overlay */}
      {toastMessage && (
        <div className="toast-container">
          <span className="material-symbols-outlined">check_circle</span> {toastMessage}
        </div>
      )}
    </div>
  );
}

export default App;
