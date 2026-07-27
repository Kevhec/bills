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

interface BillFilterOptions {
  categories?: number[];
  date?: string;
}

export function getAllBills(offset: number, limit: number, options?: BillFilterOptions): PaginatedBills {
  const where: string[] = [];
  const params: (number | string)[] = [];

  if (options?.categories && options.categories.length > 0) {
    const placeholders = options.categories.map(() => '?').join(', ');
    where.push(`b.category_id IN (${placeholders})`);
    params.push(...options.categories);
  }

  if (options?.date) {
    where.push(`strftime('%Y-%m', b.bill_date) = strftime('%Y-%m', ?)`);
    params.push(options.date);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const bills = db.prepare(`
    SELECT b.id, b.category_id, c.name AS category_name, b.bill_date,
           b.document_path, b.thumbnail_path, b.bill_page_count,
           b.created_at, b.updated_at
    FROM bills b
    JOIN categories c ON c.id = b.category_id
    ${whereClause}
    ORDER BY b.bill_date DESC, b.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as BillRow[];

  const { total } = db.prepare(`
    SELECT COUNT(*) AS total
    FROM bills b
    JOIN categories c ON c.id = b.category_id
    ${whereClause}
  `).get(...params) as { total: number };

  return { bills, total };
}

export function getBillById(id: number): BillRow | undefined {
  return db.prepare(`
    SELECT b.id, b.category_id, c.name AS category_name, b.bill_date,
           b.document_path, b.thumbnail_path, b.bill_page_count,
           b.created_at, b.updated_at
    FROM bills b
    JOIN categories c ON c.id = b.category_id
    WHERE b.id = ?
  `).get(id) as BillRow | undefined;
}

export function updateBillPageCount(id: number, pageCount: number): void {
  db.prepare('UPDATE bills SET bill_page_count = ?, updated_at = datetime(\'now\') WHERE id = ?').run(pageCount, id);
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
