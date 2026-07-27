import { Router } from 'express';
import { uploadBill } from '../middleware/upload.js';
import { createBill, addChecksHandler } from '../controllers/billController.js';

const router = Router();

router.post('/', uploadBill, createBill);
router.post('/:id/checks', uploadBill, addChecksHandler);

export default router;
