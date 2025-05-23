const express = require('express');
const router = express.Router();
const InvestmentHistory = require('../models/investmentHistory');

// GET history for one investment
router.get('/:investmentId', async (req, res) => {
    const history = await InvestmentHistory.find({ investmentId: req.params.investmentId }).sort({ date: -1 });
    res.json(history);
});

// POST new record
router.post('/', async (req, res) => {
    const record = new InvestmentHistory(req.body);
    const saved = await record.save();
    res.status(201).json(saved);
});

module.exports = router;