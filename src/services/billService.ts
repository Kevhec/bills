import db from '../db/index.js';

interface BillRow {
  id: number;
  category_id: number;
  category_name: string;
  bill_date: string;
  document_path: string;
  thumbnail_path: string;
  bill_page_count: number;
  created_at: string;
  updated_at: string;
}

interface PaginatedBills {
  bills: BillRow[];
  total: number;
}

export function getAllBills(offset: number, limit: number): PaginatedBills {
  const bills = db.prepare(`
    SELECT b.id, b.category_id, c.name AS category_name, b.bill_date,
           b.document_path, b.thumbnail_path, b.bill_page_count,
           b.created_at, b.updated_at
    FROM bills b
    JOIN categories c ON c.id = b.category_id
    ORDER BY b.bill_date DESC, b.id DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset) as BillRow[];

  const { total } = db.prepare('SELECT COUNT(*) AS total FROM bills').get() as { total: number };

  return { bills, total };
}

export function createBillRecord(
  categoryId: number,
  billDate: string,
  documentPath: string,
  thumbnailPath: string,
  billPageCount: number
): BillRow {
  const stmt = db.prepare(`
    INSERT INTO bills (category_id, bill_date, document_path, thumbnail_path, bill_page_count)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(categoryId, billDate, documentPath, thumbnailPath, billPageCount);

  return db.prepare('SELECT * FROM bills WHERE id = ?').get(result.lastInsertRowid) as BillRow;
}
