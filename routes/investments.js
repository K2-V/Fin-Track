const express = require('express');
const { body, param } = require('express-validator');
const {
    getAllInvestments,
    getInvestmentById,
    createInvestment,
    updateInvestment,
    deleteInvestment,
    getMergedInvestmentsByCategory
} = require('../controllers/investmentsControllers');

const router = express.Router();

router.get('/', getAllInvestments);
router.get('/merged', getMergedInvestmentsByCategory);
router.get('/:id', [
    param('id').isMongoId().withMessage('Valid investment ID required')
], getInvestmentById);
router.post('/', [
    body('assetName').notEmpty().withMessage('Asset name is required'),
    body('categoryName').notEmpty().withMessage('Category name is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a number > 0'),
    body('initialPrice').isFloat({ gt: 0 }).withMessage('Initial price must be > 0'),
    body('purchaseDate').isISO8601().withMessage('Purchase date must be a valid date'),
    body('couponRate').optional().isFloat({ gt: 0 }),
    body('investmentLength').optional().isInt({ gt: 0 })
], createInvestment);

router.put('/:id', [
    param('id').isMongoId().withMessage('Valid investment ID required'),
    body('amount').optional().isFloat({ gt: 0 }),
    body('initialPrice').optional().isFloat({ gt: 0 }),
    body('purchaseDate').optional().isISO8601()
], updateInvestment);

router.delete('/:id', [
    param('id').isMongoId().withMessage('Valid investment ID required')
], deleteInvestment);

module.exports = router;