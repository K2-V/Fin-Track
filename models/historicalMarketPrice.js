const mongoose = require('mongoose');

const historicalMarketPriceSchema = new mongoose.Schema({
    assetName: { type: String, required: true },
    price: { type: Number, required: true },
    period: {
        type: String,
        enum: ['1D', '1W', '1M', '1Y', 'CURRENT_MONTH'],
        required: true
    },
    date: { type: Date, required: true },
    fetchedAt: { type: Date, default: Date.now }
});

historicalMarketPriceSchema.index({ assetName: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('HistoricalMarketPrice', historicalMarketPriceSchema);