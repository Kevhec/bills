import db from '../db/index.js';

interface Category {
  id: number;
  name: string;
}

export function getCategoryById(id: number): Category | undefined {
  return db.prepare('SELECT id, name FROM categories WHERE id = ?').get(id) as Category | undefined;
}
