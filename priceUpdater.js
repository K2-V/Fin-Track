const yahooFinance = require('yahoo-finance2').default;
const MarketPrice = require('./models/marketPrice');
const Investment = require('./models/investment');
const { fetchCryptoPrice,getSymbolByName } = require('./utils/coinGeckoandyahoo');




/** Aktualizace ceny akcie z Yahoo Finance */
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

/** Uložení ceny do databáze */
async function savePrice(assetName, price) {
    const entry = new MarketPrice({
        assetName,
        price,
        date: new Date()
    });
    await entry.save();
}

/** Aktualizační funkce pro seznam aktiv */
async function updatePrices() {
    try {
        // 1. Získat investice s připojenou kategorií
        const investments = await Investment.find({}).populate('categoryId');
        // console.log(`Načteno ${investments.length} investic z databáze`);

        const uniqueAssets = [];
        const seen = new Set();

        for (const inv of investments) {
            const categoryName = inv.categoryId?.name || 'Neznámá';
            let assetType;

            // 2. Určit typ podle názvu kategorie
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

        // 3. Získání cen
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