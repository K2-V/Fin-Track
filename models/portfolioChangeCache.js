const mongoose = require('mongoose');

const cacheSchema = new mongoose.Schema({
    period: { type: String, enum: ['1D', '1W', '1M', '1Y'], required: true },
    data: {
        totalBefore: Number,
        totalNow: Number,
        changePct: Number
    },
    createdAt: { type: Date, default: Date.now, expires: 3600 } // platnost: 1 hodina
});

module.exports = mongoose.model('PortfolioChangeCache', cacheSchema);