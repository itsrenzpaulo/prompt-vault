import Database from '@tauri-apps/plugin-sql';

// Connect to the SQLite database.
// This path corresponds to the `add_migrations` path defined in the Rust backend.
let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = await Database.load('sqlite:prompt_vault.sqlite');
  }
  return dbInstance;
}

// Interfaces
export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Snippet {
  id: number;
  title: string;
  content: string;
  category_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface SnippetTag {
  snippet_id: number;
  tag_id: number;
}

// Queries

/**
 * Creates a new snippet and returns its insert ID.
 */
export async function createSnippet(
  title: string,
  content: string,
  categoryId?: number
): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    'INSERT INTO snippets (title, content, category_id) VALUES ($1, $2, $3)',
    [title, content, categoryId ?? null]
  );
  return result.lastInsertId ?? 0;
}

/**
 * Fetches all snippets from the database.
 */
export async function getAllSnippets(): Promise<Snippet[]> {
  const db = await getDb();
  return await db.select<Snippet[]>('SELECT * FROM snippets ORDER BY created_at DESC');
}

/**
 * Deletes a snippet by ID.
 */
export async function deleteSnippet(id: number): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM snippets WHERE id = $1', [id]);
}

/**
 * Fetches all categories from the database.
 */
export async function getAllCategories(): Promise<Category[]> {
  const db = await getDb();
  return await db.select<Category[]>('SELECT * FROM categories ORDER BY name ASC');
}

/**
 * Creates a new category.
 */
export async function createCategory(name: string): Promise<number> {
  const db = await getDb();
  const result = await db.execute('INSERT INTO categories (name) VALUES ($1)', [name]);
  return result.lastInsertId ?? 0;
}

/**
 * Renames a category.
 */
export async function renameCategory(id: number, newName: string): Promise<void> {
  const db = await getDb();
  await db.execute('UPDATE categories SET name = $1 WHERE id = $2', [newName, id]);
}

/**
 * Deletes a category.
 */
export async function deleteCategory(id: number): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM categories WHERE id = $1', [id]);
}

/**
 * Adds a tag to a specific snippet.
 */
export async function addTagToSnippet(snippetId: number, tagId: number): Promise<void> {
  const db = await getDb();
  await db.execute(
    'INSERT INTO snippet_tags (snippet_id, tag_id) VALUES ($1, $2)',
    [snippetId, tagId]
  );
}
