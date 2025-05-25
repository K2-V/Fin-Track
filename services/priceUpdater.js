const yahooFinance = require('yahoo-finance2').default;
const MarketPrice = require('../models/marketPrice');
const Investment = require('../models/investment');
const { fetchCryptoPrice,getSymbolByName } = require('./coinGeckoandyahoo');

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

async function savePrice(assetName, price) {
    const entry = new MarketPrice({
        assetName,
        price,
        date: new Date()
    });
    await entry.save();
}

async function updatePrices() {
    try {
        const investments = await Investment.find({}).populate('categoryId');
        // console.log(`Načteno ${investments.length} investic z databáze`);

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
            // console.log(`Aktivum: ${inv.assetName}, Typ: ${assetType}`);
            const key = `${inv.assetName}-${assetType}`;
            if (!seen.has(key) && assetType !== 'unknown') {
                uniqueAssets.push({
                    name: inv.assetName,
                    type: assetType,
                    display: inv.assetName
                });
                seen.add(key);
            }
        }

        for (const asset of uniqueAssets) {
            let price = null;

            if (asset.type === 'crypto') {
                price = await fetchCryptoPrice(asset.name);
            } else if (asset.type === 'stock') {
                price = await fetchStockPrice(asset.name);
            }

            if (price !== null) {
                await savePrice(asset.name, price);
                // console.log(`Uložena cena pro ${asset.name}: ${price}`);
            } else {
                // console.warn(`Cena nenalezena pro ${asset.name}`);
            }
        }

    } catch (err) {
        console.error('Chyba při aktualizaci cen:', err);
    }
}
module.exports = updatePrices;