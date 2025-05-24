const Investment = require('../models/Investment');
const Category = require('../models/Category');
const MarketPrice = require('../models/marketPrice');
const pluralize = require('pluralize');
const { validationResult } = require('express-validator');

function normalizeCategoryName(name) {
    const singular = pluralize.singular(name.trim().toLowerCase());
    return singular;
}
exports.getOverview = async (req, res) => {
    try {
        const investments = await Investment.find({});

        const latestPrices = await MarketPrice.aggregate([
            { $sort: { date: -1 } },
            { $group: { _id: '$assetName', price: { $first: '$price' } } }
        ]);

        const priceMap = Object.fromEntries(latestPrices.map(p => [p._id, p.price]));

        const overview = investments.map(inv => {
            const initialTotal = inv.initialPrice * inv.amount;
            const isBond = inv.couponRate && inv.investmentLength;

            let currentPrice = priceMap[inv.assetName] || null;
            let value = currentPrice ? currentPrice * inv.amount : null;
            let profit = null;
            let profitPct = null;

            if (isBond) {
                const now = new Date();
                const purchaseDate = new Date(inv.purchaseDate);
                const monthsHeld = Math.floor((now - purchaseDate) / (1000 * 60 * 60 * 24 * 30.44));
                const yearsHeld = monthsHeld / 12;

                const annualCoupon = (inv.initialPrice * inv.amount) * (inv.couponRate / 100);
                profit = annualCoupon * yearsHeld;
                profitPct = (profit / initialTotal) * 100;

                value = initialTotal + profit;
            } else if (currentPrice) {
                profit = value - initialTotal;
                profitPct = (profit / initialTotal) * 100;
            }

            return {
                id: inv._id,
                asset: inv.assetName,
                amount: inv.amount,
                initialPrice: inv.initialPrice,
                currentPrice,
                value: value !== null ? +value.toFixed(2) : null,
                profit: profit !== null ? +profit.toFixed(2) : null,
                profitPct: profitPct !== null ? +profitPct.toFixed(2) : null
            };
        });

        res.json(overview);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Nepodařilo se načíst přehled investic' });
    }
};

// GET all investments
exports.getAllInvestments = async (req, res) => {
    try {
        const investments = await Investment.find()
            .populate({
                path: 'categoryId',
                select: 'name -_id'  // vrací jen název, bez _id
            });

        // Můžeme volitelně transformovat výstup: přejmenovat categoryId → categoryName
        const result = investments.map(inv => ({
            ...inv.toObject(),
            categoryName: inv.categoryId.name,
            categoryId: undefined // nebo smaž úplně
        }));

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST new investment
// POST new investment
exports.createInvestment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { categoryName, ...rest } = req.body;

        // ✅ Normalizace názvu kategorie
        const normalizedCategoryName = normalizeCategoryName(categoryName);

        // ✅ Najdi kategorii podle normalizovaného názvu
        const category = await Category.findOne({
            name: { $regex: `^${normalizedCategoryName}$`, $options: 'i' }
        });

        if (!category) {
            return res.status(400).json({ message: `Category '${normalizedCategoryName}' not found.` });
        }

        // ✅ Vytvoř investici s categoryId
        const newItem = new Investment({
            ...rest,
            categoryId: category._id
        });

        const saved = await newItem.save();
        res.status(201).json(saved);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// PUT update investment
exports.updateInvestment = async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const updated = await Investment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    };

// DELETE investment
exports.deleteInvestment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        const deleted = await Investment.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Investment not found' });
        }
        res.json({ message: 'Investment deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
