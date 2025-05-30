const Investment = require('../models/Investment');
const MarketPrice = require('../models/MarketPrice');
const HistoricalMarketPrice = require('../models/HistoricalMarketPrice');

exports.getPortfolioChange = async (req, res) => {
    try {
        const period = req.query.period || '1M';
        const validPeriods = ['1D', '1W', '1M', '1Y'];

        if (!validPeriods.includes(period)) {
            return res.status(400).json({ error: 'Invalid period. Use one of: 1D, 1W, 1M, 1Y.' });
        }

        const investments = await Investment.find({}).populate('categoryId');
        if (investments.length === 0) {
            return res.json({ period, changePct: 0, totalBefore: 0, totalNow: 0 });
        }

        let totalNow = 0;
        let totalBefore = 0;

        for (const inv of investments) {
            const isBond = inv.couponRate && inv.investmentLength;

            if (isBond) {
                const principal = inv.initialPrice * inv.amount;
                const yearsHeld = (Date.now() - new Date(inv.purchaseDate)) / (1000 * 60 * 60 * 24 * 365.25);
                const profit = principal * (inv.couponRate / 100) * yearsHeld;

                totalNow += principal + profit;
                totalBefore += principal;
                continue;
            }

            const assetName = inv.assetName;

            const latest = await MarketPrice.findOne({ assetName }).sort({ date: -1 });
            const nowPrice = latest?.price;
            const historical = await HistoricalMarketPrice.findOne({ assetName, period });
            const oldPrice = historical?.price;

            if (!nowPrice || !oldPrice) {
                //console.warn(`Chybějící cena pro ${assetName} – now: ${nowPrice}, old: ${oldPrice}`);
                continue;
            }

            totalNow += nowPrice * inv.amount;
            totalBefore += oldPrice * inv.amount;
        }

        if (totalBefore === 0) {
            return res.status(400).json({ error: 'Missing historical data to calculate change.' });
        }

        const changePct = ((totalNow - totalBefore) / totalBefore) * 100;

        res.json({
            period,
            totalBefore: +totalBefore.toFixed(2),
            totalNow: +totalNow.toFixed(2),
            changePct: +changePct.toFixed(2)
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error while calculating portfolio performance' });
    }
};