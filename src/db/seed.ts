import db from './index.js';

const categories = ['energía', 'agua', 'gas', 'internet', 'funeraria', 'sistecrédito'];

const existing = db.prepare('SELECT COUNT(*) AS count FROM categories').get() as { count: number };

if (existing.count === 0) {
  const insert = db.prepare('INSERT INTO categories (name) VALUES (?)');
  const insertMany = db.transaction((names: string[]) => {
    for (const name of names) {
      insert.run(name);
    }
  });
  insertMany(categories);
  console.log(`Seeded ${categories.length} categories.`);
} else {
  console.log('Categories already seeded, skipping.');
}
