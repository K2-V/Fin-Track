const mongoose = require('mongoose');

const InvestmentHistorySchema = new mongoose.Schema({
    investmentId: {type: mongoose.Schema.Types.ObjectId, ref: 'Investment', required: true,},
    date: {type: Date, required: true,},
    quantity: {type: Number, required: true,},
    purchasePrice: {type: Number, required: true,}
});

module.exports = mongoose.model('InvestmentHistory', InvestmentHistorySchema);