# Bills — Monthly Bill Administrator

> **IMPORTANT:** Update this file after every major change. Keep the project structure, progress checklist, and any new conventions accurate so future sessions don't lose context.

## Tech Stack
- **Runtime:** Node.js with TypeScript (tsx)
- **Framework:** Express
- **Views:** EJS
- **Styling:** Water.css (CDN)
- **Database:** SQLite via better-sqlite3
- **Package Manager:** pnpm

## Project Structure
```
bills/
├── data/                          # SQLite DB (gitignored)
├── tmp/                           # Temp files from multer (gitignored)
├── uploads/
│   ├── documents/                 # Final merged PDFs
│   └── thumbnails/                # Page-1 WebP thumbnails
├── src/
│   ├── constant/
│   │   ├── config.ts              # ROOT, TMP_DIR, UPLOADS_DIR, DOCUMENTS_DIR, THUMBNAILS_DIR, DB_PATH
│   │   └── pdf.ts                 # PDF_PAGE_WIDTH (612), PDF_PAGE_HEIGHT (792) — Letter format
│   ├── controllers/
│   │   ├── billController.ts      # createBill, getAllBillsHandler, getBillEditHandler, addChecksHandler
│   │   └── categoryController.ts  # getCategories
│   ├── i18n/
│   │   ├── index.ts               # Re-exports from es-CO
│   │   └── es-CO.ts               # formatBillDate (Intl.DateTimeFormat es-CO locale)
│   ├── routes/
│   │   ├── bills.ts               # POST / (create), POST /:id/checks (add checks)
│   │   └── categories.ts          # GET / (list categories)
│   ├── services/
│   │   ├── billAssemblyService.ts # normalizeToPdf (routes image vs PDF), generateThumbnail
│   │   ├── billService.ts         # getAllBills (paginated + filtered), getBillById, updateBillPageCount, createBillRecord
│   │   ├── categoryService.ts     # getCategoryById
│   │   ├── fileService.ts         # cleanup (safe-directory-guarded temp file deletion)
│   │   ├── imageService.ts        # processImage (sharp: rotate, resize, grayscale, JPEG)
│   │   └── pdfService.ts          # embedImageAsPage, normalizePdf, appendPages, deletePages, savePdf
│   ├── middleware/
│   │   └── upload.ts              # multer config (uploadBill: bill + checks fields, file filter)
│   ├── db/
│   │   ├── index.ts               # DB init (better-sqlite3, WAL, foreign keys, schema exec)
│   │   ├── schema.sql             # Table definitions
│   │   ├── seed.ts                # Seed script (6 categories, idempotent)
│   │   └── checkBills.ts          # Utility script to inspect bills table
│   └── app.ts                     # Express entry point (async main, startup tmp cleanup, /export route)
├── views/
│   ├── index.ejs                  # Bill listing with pagination, filters (dialog), export button
│   ├── upload.ejs                 # Upload form (bill date, category select, file inputs)
│   └── edit.ejs                   # Bill edit (thumbnail, delete checks checkboxes, add checks upload)
├── .gitignore
├── tsconfig.json
└── package.json
```

## Database Schema
- **categories** — id, name (seeded: energía, agua, gas, internet, funeraria, sistecrédito)
- **bills** — id, category_id (FK), bill_date, document_path, thumbnail_path, bill_page_count (INTEGER, default 0), created_at, updated_at

## Routes
| Method | Path | Handler | Description |
|---|---|---|---|
| GET | `/` | `getAllBillsHandler` | Bill listing with pagination & filters (`?offset=&limit=&category=&date=`) |
| GET | `/upload` | inline render | Upload form |
| GET | `/categories` | `getCategories` | JSON list of all categories |
| POST | `/bills` | `uploadBill` → `createBill` | Upload bill + checks, normalize, merge, save, redirect to `/?created=1` |
| GET | `/bills/:id/edit` | `getBillEditHandler` | Edit page (thumbnail, delete checks, add checks form) |
| POST | `/bills/:id/checks` | `uploadBill` → `addChecksHandler` | Delete selected pages + append new checks, redirect to `?saved=1` |
| GET | `/export` | inline handler | Export documents as ZIP (`?category=&date=`), no filters = full directory |

## Upload / PDF Pipeline
### Create bill
1. Multer saves files to `tmp/` (fields: `bill` max 1, `checks` max 5)
2. `normalizeToPdf` routes by mimetype: images → `processImage` + `embedImageAsPage`; PDFs → `normalizePdf`
3. All pages resized to Letter (612×792) via `Math.min` scaling
4. `appendPages` merges bill doc + check docs into single PDF
5. `savePdf` writes merged PDF to `uploads/documents/{category}_{MMYY}.pdf`
6. `generateThumbnail` extracts page 1 via `pdf-to-img`, converts to WebP via sharp (200×200, quality 80)
7. Thumbnail saved to `uploads/thumbnails/{category}_{MMYY}.webp`
8. `createBillRecord` inserts row into `bills` table
9. Temp files cleaned up via `cleanup` (safe-directory guard)

### Add checks to existing bill
1. Multer saves check files to `tmp/`
2. Existing PDF loaded via `normalizePdf`
3. Selected pages deleted via `deletePages` (1-based, sorted descending to avoid index shifting)
4. New check files preprocessed via `normalizeToPdf`
5. New checks appended via `appendPages`
6. Original PDF deleted, merged PDF saved to same path
7. `updateBillPageCount` updates the database

## Progress
- [x] Project scaffold (pnpm, tsx, directory structure)
- [x] Dependencies installed (express, ejs, better-sqlite3, multer, pdf-lib, sharp, pdf-to-img, archiver)
- [x] tsconfig.json configured
- [x] .gitignore configured
- [x] Database schema, initialization, seed script
- [x] Express app with async main, startup tmp cleanup
- [x] Upload middleware (multer fields config with file filter)
- [x] Services layer (billAssemblyService, billService, categoryService, fileService, imageService, pdfService)
- [x] Routes (bills CRUD, categories list, export)
- [x] EJS views with Water.css (index with pagination & filters, upload form, edit page)
- [x] Edit page (thumbnail, PDF view link, delete checks checkboxes, add checks upload)
- [x] Add checks endpoint (POST /:id/checks) with page deletion + file addition
- [x] i18n module (Colombian Spanish date formatting via Intl.DateTimeFormat)
- [x] Index filters (category multi-checkbox, date month/year match, items per page select)
- [x] Export endpoint (GET /export, ZIP via archiver)
- [ ] Error handling middleware

## Conventions
- **Status codes:** Every controller response must include an explicit HTTP status code (e.g. `res.status(200).json(...)`, `res.status(201).json(...)`, `res.status(404).json(...)`). Never rely on Express defaults.
- **File naming:** PDFs saved as `{category_name}_{MMYY}.pdf`, thumbnails as `{category_name}_{MMYY}.webp`
- **Pagination:** Uses `offset` and `limit` query params (default limit 10), not page-based
- **i18n:** Date formatting uses `Intl.DateTimeFormat('es-CO', ...)` via `src/i18n/es-CO.ts`

## Library Choices
| Library | Purpose |
|---|---|
| express | HTTP server & routing |
| ejs | View engine |
| better-sqlite3 | SQLite database |
| multer | Multipart file upload handling |
| pdf-lib | PDF creation, merging, page manipulation |
| pdf-to-img | PDF page extraction for thumbnails |
| sharp | Image↔PDF conversion + WebP thumbnail generation |
| archiver | ZIP archive creation for document export |
| tsx | TypeScript execution + watch mode |
