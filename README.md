# Bills — Monthly Bill Administrator

A web application for managing and storing monthly bills (utilities, services, etc.) with PDF processing, thumbnail generation, and document export.

## Tech Stack

- **Runtime:** Node.js with TypeScript (tsx)
- **Framework:** Express
- **Views:** EJS
- **Styling:** Water.css
- **Database:** SQLite via better-sqlite3
- **Package Manager:** pnpm

## Features

- Upload bill documents (PDF or images) with optional check pages
- Automatic image preprocessing (rotation, resize, grayscale) and PDF normalization to Letter format
- PDF merging — bill + checks combined into a single document
- Thumbnail generation (WebP) from the first page of each bill
- Category management (energía, agua, gas, internet, funeraria, sistecrédito)
- Paginated bill listing with thumbnail previews
- Filter bills by category (multi-select) and month/year
- Edit existing bills — delete check pages and add new checks
- Export filtered or all documents as a ZIP archive
- Colombian Spanish date formatting via `Intl.DateTimeFormat`

## Getting Started

```bash
pnpm install
npx tsx src/db/seed.ts   # seed categories
npx tsx src/app.ts        # start server at http://localhost:3000
```

## Project Structure

```
src/
├── constant/          # Path and PDF dimension constants
├── controllers/       # Request handlers (bills, categories)
├── i18n/              # Colombian Spanish date formatting
├── routes/            # Express routers (bills, categories)
├── services/          # Business logic (PDF, image, bill assembly)
├── middleware/         # Multer upload config
├── db/                # SQLite init, schema, seed
└── app.ts             # Entry point
views/                 # EJS templates (index, upload, edit)
uploads/               # Generated PDFs and thumbnails
```

## Routes

| Method | Path | Description |
|---|---|---|
| GET | `/` | Bill listing with pagination & filters |
| GET | `/upload` | Upload form |
| POST | `/bills` | Create bill (upload + merge + save) |
| GET | `/bills/:id/edit` | Edit page (delete/add checks) |
| POST | `/bills/:id/checks` | Delete selected pages + append new checks |
| GET | `/categories` | JSON list of categories |
| GET | `/export` | Download documents as ZIP (`?category=&date=`) |

## License

MIT
