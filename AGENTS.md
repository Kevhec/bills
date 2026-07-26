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
│   │   ├── billController.ts      # createBill, getAllBillsHandler
│   │   └── categoryController.ts  # getCategories
│   ├── routes/
│   │   ├── bills.ts               # POST / (create), POST /:id/checks
│   │   └── categories.ts          # GET / (list categories)
│   ├── services/
│   │   ├── billAssemblyService.ts # normalizeToPdf (routes image vs PDF), generateThumbnail
│   │   ├── billService.ts         # getAllBills (paginated), createBillRecord
│   │   ├── categoryService.ts     # getCategoryById
│   │   ├── fileService.ts         # cleanup (safe-directory-guarded temp file deletion)
│   │   ├── imageService.ts        # processImage (sharp: rotate, resize, grayscale, JPEG)
│   │   └── pdfService.ts          # embedImageAsPage, normalizePdf, appendPages, savePdf
│   ├── middleware/
│   │   └── upload.ts              # multer config (bill + checks fields, file filter)
│   ├── db/
│   │   ├── index.ts               # DB init (better-sqlite3, WAL, foreign keys, schema exec)
│   │   ├── schema.sql             # Table definitions
│   │   ├── seed.ts                # Seed script (6 categories, idempotent)
│   │   └── checkBills.ts          # Utility script to inspect bills table
│   └── app.ts                     # Express entry point (async main, startup tmp cleanup)
├── views/
│   ├── index.ejs                  # Bill listing with pagination (offset/limit), created confirmation
│   ├── upload.ejs                 # Upload form (bill date, category select, file inputs)
│   └── detail.ejs                 # Bill detail (placeholder)
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
| GET | `/` | `getAllBillsHandler` | Bill listing with pagination (`?offset=&limit=`) |
| GET | `/upload` | inline render | Upload form |
| GET | `/categories` | `getCategories` | JSON list of all categories |
| POST | `/bills` | `uploadBill` → `createBill` | Upload bill + checks, normalize, merge, save, redirect to `/?created=1` |
| GET | `/bills/:id` | inline render | Bill detail (placeholder) |

## Upload / PDF Pipeline
1. Multer saves files to `tmp/` (fields: `bill` max 1, `checks` max 5)
2. `normalizeToPdf` routes by mimetype: images → `processImage` + `embedImageAsPage`; PDFs → `normalizePdf`
3. All pages resized to Letter (612×792) via `Math.min` scaling
4. `appendPages` merges bill doc + check docs into single PDF
5. `savePdf` writes merged PDF to `uploads/documents/{category}_{MMYY}.pdf`
6. `generateThumbnail` extracts page 1 via `pdf-to-img`, converts to WebP via sharp (200×200, quality 80)
7. Thumbnail saved to `uploads/thumbnails/{category}_{MMYY}.webp`
8. `createBillRecord` inserts row into `bills` table
9. Temp files cleaned up via `cleanup` (safe-directory guard)

## Progress
- [x] Project scaffold (pnpm, tsx, directory structure)
- [x] Dependencies installed (express, ejs, better-sqlite3, multer, pdf-lib, sharp, pdf-to-img)
- [x] tsconfig.json configured
- [x] .gitignore configured
- [x] Database schema, initialization, seed script
- [x] Express app with async main, startup tmp cleanup
- [x] Upload middleware (multer fields config with file filter)
- [x] Services layer (billAssemblyService, billService, categoryService, fileService, imageService, pdfService)
- [x] Routes (bills CRUD, categories list)
- [x] EJS views with Water.css (index with pagination, upload form, detail placeholder)
- [ ] Full bill detail view
- [ ] Add checks to existing bill endpoint (POST /:id/checks)
- [ ] Error handling middleware

## Conventions
- **Status codes:** Every controller response must include an explicit HTTP status code (e.g. `res.status(200).json(...)`, `res.status(201).json(...)`, `res.status(404).json(...)`). Never rely on Express defaults.
- **File naming:** PDFs saved as `{category_name}_{MMYY}.pdf`, thumbnails as `{category_name}_{MMYY}.webp`
- **Pagination:** Uses `offset` and `limit` query params (default limit 10), not page-based

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
| tsx | TypeScript execution + watch mode |
