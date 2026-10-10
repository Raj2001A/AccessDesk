import { Router } from 'express';
import { getRecords } from '../controllers/RecordController';

const router = Router();

// GET /api/records
router.get('/', getRecords);

export default router;
