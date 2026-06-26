import Database from '@tauri-apps/plugin-sql';

// Connect to the SQLite database.
// This path corresponds to the `add_migrations` path defined in the Rust backend.
let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = await Database.load('sqlite:prompt_vault.sqlite');
    try {
      await dbInstance.execute("ALTER TABLE categories ADD COLUMN color TEXT DEFAULT '#938f99'");
    } catch (e) {
      // Column already exists, ignore
    }
  }
  return dbInstance;
}

// Interfaces
export interface Category {
  id: number;
  name: string;
  description?: string;
  color?: string;
}

export interface Snippet {
  id: number;
  title: string;
  content: string;
  category_id?: number;
  created_at: string;
  updated_at: string;
  tags_string?: string;
  tags?: string[];
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
  categoryId?: number,
  tags?: string[]
): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    'INSERT INTO snippets (title, content, category_id) VALUES ($1, $2, $3)',
    [title, content, categoryId ?? null]
  );
  const snippetId = result.lastInsertId ?? 0;

  if (snippetId > 0 && tags && tags.length > 0) {
    for (const tag of tags) {
      const t = tag.trim();
      if (!t) continue;
      await db.execute('INSERT OR IGNORE INTO tags (name) VALUES ($1)', [t]);
      const tagRecords = await db.select<{id: number}[]>('SELECT id FROM tags WHERE name = $1', [t]);
      if (tagRecords.length > 0) {
        await db.execute('INSERT OR IGNORE INTO snippet_tags (snippet_id, tag_id) VALUES ($1, $2)', [snippetId, tagRecords[0].id]);
      }
    }
  }

  return snippetId;
}

/**
 * Fetches all snippets from the database.
 */
export async function getAllSnippets(): Promise<Snippet[]> {
  const db = await getDb();
  const query = `
    SELECT 
      snippets.*, 
      GROUP_CONCAT(tags.name) as tags_string 
    FROM snippets 
    LEFT JOIN snippet_tags ON snippet_tags.snippet_id = snippets.id 
    LEFT JOIN tags ON tags.id = snippet_tags.tag_id 
    GROUP BY snippets.id 
    ORDER BY snippets.created_at DESC
  `;
  const results = await db.select<Snippet[]>(query);
  return results.map(s => ({
    ...s,
    tags: s.tags_string ? s.tags_string.split(',') : []
  }));
}

/**
 * Deletes a snippet by ID.
 */
export async function deleteSnippet(id: number): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM snippets WHERE id = $1', [id]);
}

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  // Use a softer pastel palette by ensuring values are high
  for (let i = 0; i < 3; i++) {
    const value = ((hash >> (i * 8)) & 0x7F) + 0x60; // 0x60 to 0xDF ensures soft visible colors
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}

/**
 * Fetches all categories from the database.
 */
export async function getAllCategories(): Promise<Category[]> {
  const db = await getDb();
  const categories = await db.select<Category[]>('SELECT * FROM categories ORDER BY name ASC');
  return categories.map(c => ({
    ...c,
    color: (!c.color || c.color === '#938f99') ? stringToColor(c.name) : c.color
  }));
}

/**
 * Creates a new category.
 */
export async function createCategory(name: string, color?: string): Promise<number> {
  const db = await getDb();
  const result = await db.execute('INSERT INTO categories (name, color) VALUES ($1, $2)', [name, color ?? '#938f99']);
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

/**
 * Updates an existing snippet.
 */
export async function updateSnippet(
  id: number,
  title: string,
  content: string,
  categoryId?: number,
  tags?: string[]
): Promise<void> {
  const db = await getDb();
  await db.execute(
    'UPDATE snippets SET title = $1, content = $2, category_id = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
    [title, content, categoryId ?? null, id]
  );
  
  await db.execute('DELETE FROM snippet_tags WHERE snippet_id = $1', [id]);

  if (tags && tags.length > 0) {
    for (const tag of tags) {
      const t = tag.trim();
      if (!t) continue;
      await db.execute('INSERT OR IGNORE INTO tags (name) VALUES ($1)', [t]);
      const tagRecords = await db.select<{id: number}[]>('SELECT id FROM tags WHERE name = $1', [t]);
      if (tagRecords.length > 0) {
        await db.execute('INSERT OR IGNORE INTO snippet_tags (snippet_id, tag_id) VALUES ($1, $2)', [id, tagRecords[0].id]);
      }
    }
  }
}
