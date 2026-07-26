import fs from 'fs/promises';
import { PDFDocument } from 'pdf-lib';
import { PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT } from '../constant/pdf.js';

export async function embedImageAsPage(imageBuffer: Buffer): Promise<PDFDocument> {
  const doc = await PDFDocument.create();
  const image = await doc.embedJpg(imageBuffer);

  const scale = Math.min(PDF_PAGE_WIDTH / image.width, PDF_PAGE_HEIGHT / image.height);

  const page = doc.addPage([PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT]);
  page.drawImage(image, {
    x: (PDF_PAGE_WIDTH - image.width * scale) / 2,
    y: (PDF_PAGE_HEIGHT - image.height * scale) / 2,
    width: image.width * scale,
    height: image.height * scale,
  });

  return doc;
}

export async function normalizePdf(filePath: string): Promise<PDFDocument> {
  const pdfBytes = await fs.readFile(filePath);
  const srcDoc = await PDFDocument.load(pdfBytes);
  const doc = await PDFDocument.create();

  const copiedPages = await doc.copyPages(srcDoc, srcDoc.getPageIndices());

  for (const page of copiedPages) {
    const { width, height } = page.getSize();
    const scaleW = PDF_PAGE_WIDTH / width;
    const scaleH = PDF_PAGE_HEIGHT / height;
    const scale = Math.min(scaleW, scaleH);

    page.scale(scale, scale);
    page.setSize(PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT);
    doc.addPage(page);
  }

  return doc;
}

export async function appendPages(target: PDFDocument, sources: PDFDocument[]): Promise<PDFDocument> {
  for (const source of sources) {
    const pages = await target.copyPages(source, source.getPageIndices());
    for (const page of pages) {
      target.addPage(page);
    }
  }
  return target;
}

export async function savePdf(doc: PDFDocument, savePath: string): Promise<Uint8Array> {
  const pdfBytes = await doc.save();
  await fs.writeFile(savePath, pdfBytes);
  return pdfBytes;
}
