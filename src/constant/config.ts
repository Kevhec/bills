import path from 'path';

export const ROOT = process.cwd();

export const TMP_DIR = path.join(ROOT, 'tmp');
export const UPLOADS_DIR = path.join(ROOT, 'uploads');
export const DOCUMENTS_DIR = path.join(UPLOADS_DIR, 'documents');
export const THUMBNAILS_DIR = path.join(UPLOADS_DIR, 'thumbnails');
export const DB_PATH = path.join(ROOT, 'data', 'bills.db');
