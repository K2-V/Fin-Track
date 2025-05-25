const { subDays, subMonths, subYears } = require('date-fns');
const HistoricalMarketPrice = require('../models/HistoricalMarketPrice');
const Investment = require('../models/Investment');
const { fetchCryptoHistoricalPrice, getSymbolByName } = require('../services/coinGeckoandyahoo');
const yahooFinance = require('yahoo-finance2').default;

const PERIODS = [
    { label: '1D', date: subDays(new Date(), 1) },
    { label: '1W', date: subDays(new Date(), 7) },
    { label: '1M', date: subMonths(new Date(), 1) },
    { label: '1Y', date: subYears(new Date(), 1) }
];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function fetchAndStoreHistoricalPrices() {
    const investments = await Investment.find().populate('categoryId');
    const seen = new Set();

    for (const inv of investments) {
        const assetName = inv.assetName;
        const key = assetName.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        const isCrypto = inv.categoryId?.name?.toLowerCase().includes('crypto');
        const symbol = isCrypto ? assetName : getSymbolByName(assetName);
        if (!symbol) {
            console.warn(`Missing symbol for ${assetName}`);
            continue;
        }

        for (const { label, date } of PERIODS) {
            const exists = await HistoricalMarketPrice.findOne({ assetName, period: label });
            if (exists) continue;

            let price = null;

            try {
                if (isCrypto) {
                    price = await fetchCryptoHistoricalPrice(symbol, date);
                    await sleep(1200); // zpomal o ~1.2 sekundy po každém volání na CoinGecko
                } else {
                    const history = await yahooFinance.historical(symbol, {
                        period1: Math.floor(date.getTime() / 1000) - 86400 * 5,
                        period2: Math.floor(date.getTime() / 1000) + 86400 * 2,
                        interval: '1d'
                    });
                    const closest = history.find(h => new Date(h.date) <= date);
                    price = closest?.close ?? null;
                }

                if (price !== null) {
                    await HistoricalMarketPrice.create({
                        assetName,
                        price,
                        period: label,
                        date
                    });
                    console.log(`Uložena historická cena pro ${assetName} [${label}] = ${price}`);
                }
            } catch (err) {
                console.warn(`Chyba při ukládání ceny ${assetName} [${label}]: ${err.message}`);
            }
        }
    }
}

module.exports = fetchAndStoreHistoricalPrices;