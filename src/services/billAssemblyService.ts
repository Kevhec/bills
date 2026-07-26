import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { pdf } from 'pdf-to-img';
import { processImage } from './imageService.js';
import { embedImageAsPage, normalizePdf } from './pdfService.js';

const PDF_MIME = 'application/pdf';

export async function normalizeToPdf(filePath: string, mimetype: string): Promise<PDFDocument> {
  if (mimetype === PDF_MIME) {
    return normalizePdf(filePath);
  }

  const imageBuffer = await processImage(filePath);
  return embedImageAsPage(imageBuffer);
}

export async function generateThumbnail(pdfBytes: Uint8Array): Promise<Buffer> {
  const doc = await pdf(pdfBytes, { scale: 1 });
  const firstPage = await doc.getPage(1);
  await doc.destroy();

  return sharp(firstPage)
    .resize({ width: 200, height: 200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}
