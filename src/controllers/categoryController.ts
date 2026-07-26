import { type Request, type Response, type NextFunction } from 'express';
import db from '../db/index.js';

export function getCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = db.prepare('SELECT id, name FROM categories ORDER BY name').all();
    res.status(200).json(categories);
  } catch (err) {
    next(err);
  }
}
