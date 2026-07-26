import { Router } from 'express';
import { uploadBill } from '../middleware/upload.js';
import { createBill } from '../controllers/billController.js';

const router = Router();

// router.get('/:id');
router.post('/', uploadBill, createBill);
router.post('/:id/checks', uploadBill);

export default router;
