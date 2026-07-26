import multer from 'multer';
import path from 'path';
import { RequestHandler } from 'express';
import { TMP_DIR } from '../constant/config.js';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, TMP_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/tiff',
    'image/bmp'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and image files are allowed'));
  }
}

const upload = multer({ storage, fileFilter });

export const uploadBill: RequestHandler = upload.fields([
  { name: 'bill', maxCount: 1 },
  { name: 'checks', maxCount: 5 }
]);

export default upload;
