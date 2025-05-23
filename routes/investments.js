const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Investments = require('../models/Investment');

const router = express.Router();

// 🟢 GET all investments
router.get('/', async (req, res) => {
    const data = await Investments.find().populate('categoryId');
    res.json(data);
});

// 🟡 POST new investment
router.post('/', [
        body('assetName').notEmpty().withMessage('Asset name is required'),
        body('categoryId').isMongoId().withMessage('Valid categoryId is required'),
        body('quantity').isFloat({ gt: 0 }).withMessage('Quantity must be a number > 0'),
        body('purchasePrice').isFloat({ gt: 0 }).withMessage('Purchase price must be > 0'),
        body('purchaseDate').isISO8601().withMessage('Purchase date must be a valid date'),
        body('couponRate').optional().isFloat({ gt: 0 }).withMessage('Coupon rate must be > 0'),
        body('investmentLength').optional().isInt({ gt: 0 }).withMessage('Investments length must be a positive integer'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const newItem = new Investments(req.body);
        const saved = await newItem.save();
        res.status(201).json(saved);
    }
);

// 🟠 PUT update investment
router.put('/:id', [
        param('id').isMongoId().withMessage('Valid investment ID required'),
        body('quantity').optional().isFloat({ gt: 0 }),
        body('purchasePrice').optional().isFloat({ gt: 0 }),
        body('purchaseDate').optional().isISO8601(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const updated = await Investments.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    }
);

// 🔴 DELETE investment
router.delete('/:id', [param('id').isMongoId().withMessage('Valid investment ID required')],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        await Investments.findByIdAndDelete(req.params.id);
        res.json({ message: 'Investments deleted' });
    }
);

module.exports = router;