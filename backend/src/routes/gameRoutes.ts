import { Router } from 'express';
import { submitCoordinate } from '../controllers/submissionController.js';

const router = Router();

router.post('/submit', submitCoordinate);

export default router;
