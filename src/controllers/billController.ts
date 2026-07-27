import { type Request, type Response, type NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { DOCUMENTS_DIR, THUMBNAILS_DIR } from '../constant/config.js';
import { normalizeToPdf, generateThumbnail } from '../services/billAssemblyService.js';
import { normalizePdf, deletePages, appendPages, savePdf } from '../services/pdfService.js';
import { cleanup } from '../services/fileService.js';
import { getCategoryById } from '../services/categoryService.js';
import { getAllBills, getBillById, updateBillPageCount, createBillRecord } from '../services/billService.js';

export async function createBill(req: Request, res: Response, next: NextFunction) {
  try {
    const files = req.files as {
      bill?: Express.Multer.File[];
      checks?: Express.Multer.File[];
    };

    const billFile = files.bill?.[0];
    if (!billFile) {
      res.status(400).json({ error: 'Bill file is required' });
      return;
    }

    const { bill_date, category_id } = req.body;
    if (!bill_date || !category_id) {
      res.status(400).json({ error: 'bill_date and category_id are required' });
      return;
    }

    const category = getCategoryById(Number(category_id));
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const date = new Date(bill_date);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);

    const baseName = `${category.name}_${mm}${yy}`
    const outName = `${baseName}.pdf`;
    const outPath = path.join(DOCUMENTS_DIR, outName);

    const billDoc = await normalizeToPdf(billFile.path, billFile.mimetype);

    const checksEntries = await Promise.all(
      (files.checks || []).map(async (f, i) => ({
        doc: await normalizeToPdf(f.path, f.mimetype),
        meta: f,
        order: i,
      }))
    );

    const checkDocs = checksEntries.map(e => e.doc);
    const merged = await appendPages(billDoc, checkDocs);

    const pdfBytes = await savePdf(merged, outPath);

    const thumbnailBuffer = await generateThumbnail(pdfBytes);
    const thumbName = `thumb-${baseName}.webp`;
    const thumbPath = path.join(THUMBNAILS_DIR, thumbName);
    await fs.writeFile(thumbPath, thumbnailBuffer);

    const docRelPath = `/uploads/documents/${outName}`;
    const thumbRelPath = `/uploads/thumbnails/${thumbName}`;
    const pageCount = merged.getPageCount();

    createBillRecord(category.id, bill_date, docRelPath, thumbRelPath, pageCount);

    const tempPaths = [
      billFile.path,
      ...checksEntries.map(e => e.meta.path),
    ];
    await cleanup(tempPaths);

    res.redirect('/?created=1');
  } catch (err) {
    next(err);
  }
}

export async function addChecksHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const bill = getBillById(Number(req.params.id));
    if (!bill) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }

    const files = (req.files as { checks?: Express.Multer.File[] })?.checks || [];

    const currentDocPath = path.join(process.cwd(), bill.document_path);
    let doc = await normalizePdf(currentDocPath);

    const deletePagesRaw = req.body.delete_pages;
    if (deletePagesRaw) {
      const pageNumbers = (Array.isArray(deletePagesRaw) ? deletePagesRaw : [deletePagesRaw])
        .map(Number)
        .filter((n) => !isNaN(n));
      if (pageNumbers.length > 0) {
        doc = deletePages(doc, pageNumbers);
      }
    }

    if (files.length > 0) {
      const checkDocs = await Promise.all(
        files.map(async (f) => {
          const d = await normalizeToPdf(f.path, f.mimetype);
          return d;
        })
      );
      doc = await appendPages(doc, checkDocs);
    }

    await fs.unlink(currentDocPath);
    await savePdf(doc, currentDocPath);
    updateBillPageCount(bill.id, doc.getPageCount());

    await cleanup(files.map((f) => f.path));

    res.redirect(`/bills/${bill.id}/edit?saved=1`);
  } catch (err) {
    next(err);
  }
}

export function getBillEditHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const bill = getBillById(Number(req.params.id));
    if (!bill) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }

    const checkPageCount = Math.max(0, bill.bill_page_count - 1);

    res.render('edit', {
      bill,
      checkPageCount,
      saved: req.query.saved === '1',
    });
  } catch (err) {
    next(err);
  }
}

export function getAllBillsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Math.max(10, Math.min(30, Number(req.query.limit) || 10));
    const offset = Math.max(0, Number(req.query.offset) || 0);

    const categoryRaw = req.query.category;
    const categories = categoryRaw
      ? (Array.isArray(categoryRaw) ? categoryRaw : [categoryRaw]).map(Number).filter((n) => !isNaN(n))
      : undefined;

    const date = typeof req.query.date === 'string' && req.query.date ? req.query.date : undefined;

    const { bills, total } = getAllBills(offset, limit, { categories, date });
    const totalPages = Math.ceil(total / limit);

    res.render('index', {
      bills,
      offset,
      limit,
      total,
      totalPages,
      created: req.query.created === '1',
      filters: { categories: categories || [], date: date || '' },
    });
  } catch (err) {
    next(err);
  }
}
