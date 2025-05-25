const express = require('express');
const router = express.Router();
const MarketPrice = require('../models/MarketPrice');
const { getPortfolioChange } = require('../controllers/getPortfolioChange');
const { query } = require('express-validator');

router.get('/portfolio-change', [
    query('period')
        .optional()
        .isIn(['1D', '1W', '1M', '1Y'])
        .withMessage('Period must be one of: 1D, 1W, 1M, 1Y')
], getPortfolioChange);

router.get('/:assetName', async (req, res) => {
    const prices = await MarketPrice.find({ assetName: req.params.assetName }).sort({ date: -1 });
    res.json(prices);
});

module.exports = router;