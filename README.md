# Bills — Monthly Bill Administrator

A web application for managing and storing monthly bills (utilities, services, etc.) with PDF processing and thumbnail generation.

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
├── controllers/       # Request handlers
├── routes/            # Express routers
├── services/          # Business logic (PDF, image, bill assembly)
├── middleware/         # Multer upload config
├── db/                # SQLite init, schema, seed
└── app.ts             # Entry point
views/                 # EJS templates
uploads/               # Generated PDFs and thumbnails
```

## License

MIT
