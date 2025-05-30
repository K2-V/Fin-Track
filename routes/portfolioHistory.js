const express = require('express');
const router = express.Router();
const { getPortfolioStats, getPortfolioHistory } = require('../controllers/getPortfolioStatus');

router.get('/stats', getPortfolioStats);
router.get('/history', getPortfolioHistory);

module.exports = router;