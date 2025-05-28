const Investment = require('../models/Investment');
const Category = require('../models/Category');
const MarketPrice = require('../models/marketPrice');
const pluralize = require('pluralize');
const { validationResult } = require('express-validator');
const fetchSingleAssetHistoricalPrices = require('../services/getHistoricalPrices');

function normalizeCategoryName(name) {
    const singular = pluralize.singular(name.trim().toLowerCase());
    return singular;
}

exports.getMergedInvestmentsByCategory = async (req, res) => {
    try {
        const { type } = req.query;

        if (!type) {
            return res.status(400).json({ message: "Missing category type." });
        }
        const normalizedType = normalizeCategoryName(type);
        const categories = await Category.find({
            name: { $regex: `^${normalizedType}$`, $options: 'i' }
        });
        if (categories.length === 0) {
            return res.status(404).json({ message: `No category found for type '${type}'` });
        }
        const categoryIds = categories.map(cat => cat._id);
        const investments = await Investment.find({ categoryId: { $in: categoryIds } });

        if (!investments.length) {
            return res.json([]);
        }
        const latestPrices = await MarketPrice.aggregate([
            { $sort: { date: -1 } },
            { $group: { _id: '$assetName', price: { $first: '$price' } } }
        ]);
        const priceMap = Object.fromEntries(latestPrices.map(p => [p._id, p.price]));
        const merged = {};
        for (const inv of investments) {
            const key = inv.assetName;
            const isBond = inv.couponRate && inv.investmentLength;
            const initialTotal = inv.initialPrice * inv.amount;
            const currentPrice = priceMap[inv.assetName] || null;

            let value = currentPrice ? currentPrice * inv.amount : null;
            let profit = null;

            if (isBond) {
                const now = new Date();
                const purchaseDate = new Date(inv.purchaseDate);
                const monthsHeld = (now - purchaseDate) / (1000 * 60 * 60 * 24 * 30.44); // přesně jako ve druhé části
                const yearsHeld = monthsHeld / 12;

                const principal = initialTotal; // sladění pojmenování proměnné
                const annualCoupon = principal * (inv.couponRate / 100);

                profit = annualCoupon * yearsHeld;
                value = principal + profit;
            } else if (currentPrice) {
                profit = value - initialTotal;
            }
            if (!merged[key]) {
                merged[key] = {
                    asset: key,
                    currentValue: 0,
                    initialValue: 0,
                    profit: 0
                };
            }
            merged[key].currentValue += value || 0;
            merged[key].initialValue += initialTotal;
            merged[key].profit += profit || 0;
        }

        const result = Object.values(merged).map(item => ({
            asset: item.asset,
            currentValue: +item.currentValue.toFixed(2),
            profit: +item.profit.toFixed(2),
            profitPct: +((item.profit / item.initialValue) * 100).toFixed(2)
        }));

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
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
            const normalizedType = normalizeCategoryName(type);
            const matchingCategories = await Category.find({
                name: { $regex: `^${normalizedType}$`, $options: 'i' }
            });

            if (matchingCategories.length === 0) {
                return res.status(400).json({ message: `No matching categories found for type: '${type}'` });
            }

            const categoryIds = matchingCategories.map(cat => cat._id);
            query.categoryId = { $in: categoryIds };
        }

        const investments = await Investment.find(query).populate('categoryId');

        if (investments.length === 0 && assetName) {
            return res.status(404).json({ message: `Asset with name '${assetName}' not found.` });
        }

        // Získat nejnovější ceny pro všechna aktiva kromě dluhopisů
        const latestPrices = await MarketPrice.aggregate([
            { $sort: { date: -1 } },
            { $group: { _id: '$assetName', price: { $first: '$price' } } }
        ]);

        const priceMap = Object.fromEntries(latestPrices.map(p => [p._id, p.price]));

        const now = new Date();

        const result = investments.map(inv => {
            const isBond = inv.categoryId?.name?.toLowerCase() === 'bond';

            const initialTotal = inv.initialPrice * inv.amount;
            let currentPrice = null;
            let change = null;
            let changePct = null;

            if (isBond) {
                const purchaseDate = new Date(inv.purchaseDate);
                const monthsHeld = (now - purchaseDate) / (1000 * 60 * 60 * 24 * 30.44);
                const yearsHeld = monthsHeld / 12;

                const principal = initialTotal;
                const annualCoupon = principal * (inv.couponRate / 100);
                const profit = annualCoupon * yearsHeld;
                const value = principal + profit;

                currentPrice = +(value / inv.amount).toFixed(2);
                change = +profit.toFixed(2);
                changePct = +(profit / principal * 100).toFixed(2);
            } else {
                currentPrice = priceMap[inv.assetName] ?? null;

                if (currentPrice != null) {
                    change = (currentPrice - inv.initialPrice) * inv.amount;
                    changePct = inv.initialPrice > 0
                        ? ((currentPrice - inv.initialPrice) / inv.initialPrice) * 100
                        : null;

                    change = +change.toFixed(2);
                    changePct = changePct != null ? +changePct.toFixed(2) : null;
                }
            }

            return {
                _id: inv._id,
                assetName: inv.assetName,
                amount: inv.amount,
                initialPrice: inv.initialPrice,
                purchaseDate: inv.purchaseDate,
                currentPrice,
                change,
                changePct,
                ...(isBond && { couponRate: inv.couponRate,
                                purchaseDate: inv.purchaseDate,
                                length: inv.investmentLength,}),
                ...(!isBond && {
                    currentValue: currentPrice != null ? +(currentPrice * inv.amount).toFixed(2) : null
                })
            };
        });

        res.json(result);
    } catch (error) {
        console.error('Error fetching investments:', error);
        res.status(500).json({ message: 'Server error' });
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
        const { categoryName, note, ...rest } = req.body; // odstranění "note"
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

        const isBond = rest.couponRate && rest.investmentLength;
        if (!isBond) {
            const isCrypto = category.name.toLowerCase().includes('crypto');
            fetchSingleAssetHistoricalPrices(rest.assetName, isCrypto)
                .then(() => console.log(`Doplněny historické ceny pro ${rest.assetName}`))
                .catch(err => console.warn(`Chyba při doplňování historických cen:`, err));
        }

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
