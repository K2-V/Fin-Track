const mongoose = require('mongoose');

const InvestmentSchema = new mongoose.Schema({
    assetName: {type: String, required: true,},
    categoryId: {type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true,},
    amount: {type: Number, required: true,},
    initialPrice: {type: Number, required: true,},
    purchaseDate: {type: Date, required: true,},
    couponRate: {type: Number,},
    investmentLength: {type: Number, /* v měsících*/ }
});

module.exports = mongoose.models.Investment || mongoose.model('Investment', InvestmentSchema);