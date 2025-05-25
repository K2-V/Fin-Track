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

exports.getAllInvestments = async (req, res) => {
    try {
        const { type, assetName } = req.query;

        const query = {};

        if (assetName) {
            query.assetName = { $regex: assetName, $options: 'i' };
        }

        if (type) {
            const normalizedType = normalizeCategoryName(type);  // např. "stocks" → "stock"

            const matchingCategories = await Category.find({
                name: { $regex: `^${normalizedType}$`, $options: 'i' }
            });

            if (matchingCategories.length > 0) {
                const categoryIds = matchingCategories.map(cat => cat._id);
                query.categoryId = { $in: categoryIds };
            } else {
                return res.status(400).json({ message: `No matching categories found for type: '${type}'` });
            }
        }

        const investments = await Investment.find(query)
            .populate({
                path: 'categoryId',
                select: 'name -_id'
            });

        if (investments.length === 0 && assetName) {
            return res.status(404).json({ message: `Asset with name '${assetName}' not found.` });
        }

        const result = investments.map(inv => ({
            ...inv.toObject(),
            categoryName: inv.categoryId.name,
            categoryId: undefined
        }));

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.getInvestmentById = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const investment = await Investment.findById(req.params.id)
            .populate({
                path: 'categoryId',
                select: 'name -_id'
            });

        if (!investment) {
            return res.status(404).json({ message: 'Investment not found' });
        }

        const result = {
            ...investment.toObject(),
            categoryName: investment.categoryId.name,
            categoryId: undefined
        };

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.createInvestment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { categoryName, ...rest } = req.body;
        const normalizedCategoryName = normalizeCategoryName(categoryName);
        const category = await Category.findOne({
            name: { $regex: `^${normalizedCategoryName}$`, $options: 'i' }
        });

        if (!category) {
            return res.status(400).json({ message: `Category '${normalizedCategoryName}' not found.` });
        }
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

exports.updateInvestment = async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        const updated = await Investment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    };


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
