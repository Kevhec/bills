import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { DB_PATH } from '../constant/config.js';

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db: Database.Database = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf-8');
db.exec(schema);

export default db;
