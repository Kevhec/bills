import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ZipArchive } from 'archiver';
import './db/index.js';
import billsRouter from './routes/bills.js';
import categoriesRouter from './routes/categories.js';
import { cleanup } from './services/fileService.js';
import { TMP_DIR, DOCUMENTS_DIR } from './constant/config.js';
import { getAllBills } from './services/billService.js';
import { getAllBillsHandler, getBillEditHandler } from './controllers/billController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/bills', billsRouter);
app.use('/categories', categoriesRouter);

app.get('/', getAllBillsHandler);

app.get('/upload', (_req, res) => {
  res.render('upload');
});

app.get('/bills/:id/edit', getBillEditHandler);

app.get('/export', (req, res, next) => {
  try {
    const categoryRaw = req.query.category;
    const categories = categoryRaw
      ? (Array.isArray(categoryRaw) ? categoryRaw : [categoryRaw]).map(Number).filter((n) => !isNaN(n))
      : undefined;
    const date = typeof req.query.date === 'string' && req.query.date ? req.query.date : undefined;

    const hasFilters = (categories && categories.length > 0) || !!date;

    res.attachment('bills-export.zip');

    const archive = new ZipArchive({ zlib: { level: 9 } });
    archive.on('error', (err) => next(err));
    archive.pipe(res);

    if (hasFilters) {
      const { bills } = getAllBills(0, Number.MAX_SAFE_INTEGER, { categories, date });
      for (const bill of bills) {
        const filePath = path.join(process.cwd(), bill.document_path);
        archive.file(filePath, { name: path.basename(bill.document_path) });
      }
    } else {
      archive.directory(DOCUMENTS_DIR, false);
    }

    archive.finalize();
  } catch (err) {
    next(err);
  }
});

async function main() {
  const entries = await fs.readdir(TMP_DIR, { withFileTypes: true });
  const tmpPaths = entries
    .filter(e => e.isFile())
    .map(e => path.join(TMP_DIR, e.name));

  if (tmpPaths.length > 0) {
    await cleanup(tmpPaths);
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

main();
