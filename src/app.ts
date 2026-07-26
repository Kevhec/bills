import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import './db/index.js';
import billsRouter from './routes/bills.js';
import categoriesRouter from './routes/categories.js';
import { cleanup } from './services/fileService.js';
import { TMP_DIR } from './constant/config.js';
import { getAllBillsHandler } from './controllers/billController.js';

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

app.get('/bills/:id', (req, res) => {
  res.render('detail', { bill: null });
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
