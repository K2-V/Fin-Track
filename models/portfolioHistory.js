const mongoose = require('mongoose');

const portfolioHistorySchema = new mongoose.Schema({
    totalValue: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('PortfolioHistory', portfolioHistorySchema);