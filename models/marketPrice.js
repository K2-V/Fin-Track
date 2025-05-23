const mongoose = require('mongoose');

const MarketPriceSchema = new mongoose.Schema({
    assetName: {type: String, required: true,},
    date: {type: Date, required: true,},
    price: {type: Number, required: true,}
});

MarketPriceSchema.index({ assetName: 1, date: -1 }); // rychlé vyhledání poslední ceny

module.exports = mongoose.model('MarketPrice', MarketPriceSchema);