import sharp from 'sharp';

export async function processImage(input: string | Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
    .grayscale()
    .jpeg({ quality: 80 })
    .toBuffer();
}
