const yahooFinance = require('yahoo-finance2').default;
const MarketPrice = require('../models/marketPrice');
const Investment = require('../models/investment');
const { fetchCryptoPrice, getSymbolByName } = require('./coinGeckoandyahoo');

// Kontrola, zda je otevřená burza
function isMarketOpen() {
    const now = new Date();
    const weekday = now.getUTCDay();
    if (weekday === 0 || weekday === 6) return false;

    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    const currentMinutes = hours * 60 + minutes;

    return currentMinutes >= (13 * 60 + 30) && currentMinutes <= (20 * 60);
}

async function fetchStockPrice(assetName) {
    try {
        const symbol = getSymbolByName(assetName);
        if (!symbol) {
            console.warn(`Nenalezen symbol pro "${assetName}" v allStocks.json`);
            return null;
        }

        const quote = await yahooFinance.quote(symbol);
        if (!quote || typeof quote.regularMarketPrice === 'undefined') {
            console.warn(`Yahoo Finance nenašlo cenu pro symbol "${symbol}"`);
            return null;
        }

        return quote.regularMarketPrice;
    } catch (err) {
        console.error(`Chyba při získávání ceny z Yahoo Finance pro "${assetName}":`, err.message);
        return null;
    }
}

async function savePrice(assetName, newPrice) {
    const lastEntry = await MarketPrice.findOne({ assetName }).sort({ date: -1 });

    if (lastEntry && lastEntry.price === newPrice) {
        console.log(`${assetName}: Cena se nezměnila (${newPrice}) – neukládám.`);
        return;
    }

    const entry = new MarketPrice({
        assetName,
        price: newPrice,
        date: new Date()
    });
    await entry.save();
    console.log(`Uložena nová cena pro ${assetName}: ${newPrice}`);
}

async function updatePrices() {
    try {
        const investments = await Investment.find({}).populate('categoryId');

        const uniqueAssets = [];
        const seen = new Set();

        for (const inv of investments) {
            const categoryName = inv.categoryId?.name || 'Neznámá';
            let assetType;

            if (categoryName.toLowerCase().includes('crypto')) {
                assetType = 'crypto';
            } else if (categoryName.toLowerCase().includes('stock')) {
                assetType = 'stock';
            } else {
                assetType = 'unknown';
            }

            const key = `${inv.assetName}-${assetType}`;
            if (!seen.has(key) && assetType !== 'unknown') {
                uniqueAssets.push({
                    name: inv.assetName,
                    type: assetType
                });
                seen.add(key);
            }
        }

        for (const asset of uniqueAssets) {
            if (asset.type === 'stock' && !isMarketOpen()) {
                console.log(`⏸ ${asset.name}: Burza zavřená – přeskočeno.`);
                continue;
            }

            let price = null;

            if (asset.type === 'crypto') {
                price = await fetchCryptoPrice(asset.name);
            } else if (asset.type === 'stock') {
                price = await fetchStockPrice(asset.name);
            }

            if (price !== null) {
                await savePrice(asset.name, price);
            } else {
                console.warn(`Cena nenalezena pro ${asset.name}`);
            }
        }

    } catch (err) {
        console.error('Chyba při aktualizaci cen:', err);
    }
}

module.exports = updatePrices;