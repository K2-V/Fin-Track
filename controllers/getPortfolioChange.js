const Investment = require('../models/Investment');
const yahooFinance = require('yahoo-finance2').default;
const MarketPrice = require('../models/MarketPrice');
const { endOfMonth, endOfYear, subDays, subMonths, subYears } = require('date-fns');
const { fetchCryptoHistoricalPrice, getSymbolByName } = require('../utils/coinGeckoandyahoo');

exports.getPortfolioChange = async (req, res) => {
    try {
        const period = req.query.period || '1M';
        const now = new Date();

        let past;
        if (period === '1D') {
            past = subDays(now, 1);
        } else if (period === '1W') {
            const day = now.getDay();
            const daysSinceFriday = (day >= 5) ? day - 5 : 7 + day - 5;
            past = subDays(now, daysSinceFriday + 7);
        } else if (period === '1M') {
            past = endOfMonth(subMonths(now, 1));
        } else if (period === '1Y') {
            past = endOfYear(subYears(now, 1));
        } else {
            return res.status(400).json({ error: 'Invalid period' });
        }

        const investments = await Investment.find({}).populate('categoryId');
        if (investments.length === 0) return res.json({ changePct: 0 });

        let totalNow = 0;
        let totalBefore = 0;

        for (const inv of investments) {
            const isCrypto = inv.categoryId?.name?.toLowerCase().includes('crypto');
            const isBond = inv.couponRate && inv.investmentLength;

            if (isBond) {
                const principal = inv.initialPrice * inv.amount;
                const yearsHeld = (now - new Date(inv.purchaseDate)) / (1000 * 60 * 60 * 24 * 365.25);
                const profit = principal * (inv.couponRate / 100) * yearsHeld;
                totalNow += principal + profit;
                totalBefore += principal;
                continue;
            }

            const assetName = inv.assetName;
            const symbol = isCrypto ? assetName : getSymbolByName(assetName);
            if (!symbol) {
                console.warn(`Symbol not found for ${assetName}`);
                continue;
            }

            // ✅ Aktuální cena z MongoDB
            const latestPriceDoc = await MarketPrice.findOne({ assetName }).sort({ date: -1 });
            const nowPrice = latestPriceDoc?.price || null;

            // 📉 Historická cena z API
            let oldPrice = null;

            if (isCrypto) {
                oldPrice = await fetchCryptoHistoricalPrice(symbol, past);
            } else {
                const pastTimestamp = Math.floor(past.getTime() / 1000);
                const history = await yahooFinance.historical(symbol, {
                    period1: pastTimestamp - (5 * 86400),
                    period2: pastTimestamp + (2 * 86400),
                    interval: '1d'
                });
                const closest = history.find(h => new Date(h.date) <= past);
                oldPrice = closest?.close || 0;
            }

            console.log(`Zpracovávám: ${assetName} | Now: ${nowPrice} | Old: ${oldPrice}`);

            if (nowPrice && oldPrice) {
                totalNow += nowPrice * inv.amount;
                totalBefore += oldPrice * inv.amount;
            }
        }

        if (totalBefore === 0) return res.status(400).json({ error: 'Missing historical data to compare.' });

        const changePct = ((totalNow - totalBefore) / totalBefore) * 100;

        res.json({
            period,
            totalBefore: +totalBefore.toFixed(2),
            totalNow: +totalNow.toFixed(2),
            changePct: +changePct.toFixed(2)
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Chyba při výpočtu zhodnocení portfolia' });
    }
};