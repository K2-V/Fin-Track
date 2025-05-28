const express = require('express');
const router = express.Router();
const { getPortfolioStats } = require('../controllers/getPortfolioStatus');

router.get('/portfolio', getPortfolioStats);

module.exports = router;