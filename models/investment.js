const mongoose = require('mongoose');

const InvestmentSchema = new mongoose.Schema({
    assetName: {type: String, required: true,},
    categoryId: {type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true,},
    quantity: {type: Number, required: true,},
    purchasePrice: {type: Number, required: true,},
    purchaseDate: {type: Date, required: true,},
    note: {type: String,},
    // Jen pro dluhopisy
    couponRate: {type: Number,},
    investmentLength: {type: Number, /* v měsících*/ }
});

module.exports = mongoose.models.Investment || mongoose.model('Investment', InvestmentSchema);