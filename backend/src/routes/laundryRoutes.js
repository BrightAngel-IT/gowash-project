import express from 'express';
import {
    getAllLaundries,
    getLaundriesWithSalesStats,
    getLaundryById,
    createLaundry,
    updateLaundry,
    deleteLaundry
} from '../controllers/laundryController.js';

const router = express.Router();

router.get('/', getAllLaundries);
router.get('/sales-stats', getLaundriesWithSalesStats);
router.get('/:id', getLaundryById);
router.post('/', createLaundry);
router.put('/:id', updateLaundry);
router.delete('/:id', deleteLaundry);

export default router;
