const Investment = require('../models/Investment');
const MarketPrice = require('../models/MarketPrice');
const HistoricalMarketPrice = require('../models/HistoricalMarketPrice');
const { startOfMonth } = require('date-fns');
const PortfolioHistory = require('../models/portfolioHistory');

exports.getPortfolioStats = async (req, res) => {
    try {
        const investments = await Investment.find({});
        if (!investments.length) {
            return res.json({ totalValue: 0, monthlyGain: 0, totalProfit: 0 });
        }

        const now = new Date();
        const startOfThisMonth = startOfMonth(now);

        let totalNow = 0;
        let totalStartOfMonth = 0;
        let totalCost = 0;

        for (const inv of investments) {
            const principal = inv.initialPrice * inv.amount;
            totalCost += principal;

            const isBond = inv.couponRate && inv.investmentLength;

            if (isBond) {
                const purchaseDate = new Date(inv.purchaseDate);
                const monthsHeld = (now - purchaseDate) / (1000 * 60 * 60 * 24 * 30.44);
                const yearsHeld = monthsHeld / 12;
                const annualCoupon = principal * (inv.couponRate / 100);

                const profitNow = annualCoupon * yearsHeld;
                const profitStartOfMonth = annualCoupon * (yearsHeld - 1 / 12);

                totalNow += principal + profitNow;
                totalStartOfMonth += principal + profitStartOfMonth;
                continue;
            }

            const assetName = inv.assetName;

            const latest = await MarketPrice.findOne({ assetName }).sort({ date: -1 });
            const priceNow = latest?.price;

            const startOfMonthEntry = await HistoricalMarketPrice.findOne({
                assetName,
                period: 'CURRENT_MONTH'
            });

            const priceStartOfMonth = startOfMonthEntry?.price;

            if (!priceNow || !priceStartOfMonth) {
                console.warn(`Chybí cena pro ${assetName}`);
                continue;
            }

            totalNow += priceNow * inv.amount;
            totalStartOfMonth += priceStartOfMonth * inv.amount;
        }

        const monthlyGain = ((totalNow - totalStartOfMonth) / totalStartOfMonth) * 100;
        const totalProfit = (totalNow - totalCost) / totalCost * 100;

        const roundedTotalValue = +totalNow.toFixed(2);
        const lastEntry = await PortfolioHistory.findOne().sort({ date: -1 });
        // console.log('Aktuální totalValue:', roundedTotalValue);
        // console.log('Poslední záznam:', lastEntry?.totalValue);
        if (!lastEntry || Math.abs(lastEntry.totalValue - roundedTotalValue) >= 0.01) {
            try {
                await PortfolioHistory.create({ totalValue: roundedTotalValue });
            } catch (err) {
                console.error("Chyba při ukládání do MongoDB:", err);
            }
        }
        res.json({
            totalValue: roundedTotalValue,
            monthlyGain: +monthlyGain.toFixed(2),
            totalProfit: +totalProfit.toFixed(2)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Chyba při výpočtu portfolia' });
    }
};

exports.getPortfolioHistory = async (req, res) => {
    try {
        const history = await PortfolioHistory.find({}).sort({ date: 1 });
        res.json(history);
    } catch (err) {
        console.error('Chyba při načítání historie portfolia:', err);
        res.status(500).json({ error: 'Server error' });
    }
};