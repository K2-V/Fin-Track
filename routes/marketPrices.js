const express = require('express');
const router = express.Router();
const MarketPrice = require('../models/MarketPrice');
const { getPortfolioChange } = require('../controllers/getPortfolioChange');

router.get('/portfolio-change', getPortfolioChange);

router.get('/:assetName', async (req, res) => {
    const prices = await MarketPrice.find({ assetName: req.params.assetName }).sort({ date: -1 });
    res.json(prices);
});

module.exports = router;