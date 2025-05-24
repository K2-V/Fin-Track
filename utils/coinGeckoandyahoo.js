

const axios = require("axios");
const {format} = require("date-fns");
const fs = require("fs");
const path = require("path");
const allStocks = JSON.parse(fs.readFileSync(path.join(__dirname, '../allStocks.json'), 'utf-8'));

async function fetchCryptoPrice(symbol) {
    const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
        params: {
            ids: symbol.toLowerCase(),
            vs_currencies: 'usd'
        }
    });
    return res.data[symbol.toLowerCase()]?.usd || null;
}

async function fetchCryptoHistoricalPrice(symbol, date) {
    await delay(1200);
    const formatted = format(date, 'dd-MM-yyyy'); // CoinGecko expects dd-mm-yyyy
    try {
        const res = await axios.get(`https://api.coingecko.com/api/v3/coins/${symbol.toLowerCase()}/history`, {
            params: { date: formatted }
        });

        return res.data?.market_data?.current_price?.usd || null;
    } catch (err) {
        console.warn(`Chyba při načítání historické ceny pro ${symbol} k datu ${formatted}: ${err.message}`);
        return null;
    }
}
function normalizeName(name) {
    return name
        .toLowerCase()
        .replace(/(inc\.?|corporation|common stock|incorporated|company|corp\.?|co\.?|class [abc]|ads|ordinary shares|\(.*?\))/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function getSymbolByName(name) {
    const target = normalizeName(name);
    const stock = allStocks.find(item => normalizeName(item.name) === target);

    if (!stock) {
        const partial = allStocks.find(item => normalizeName(item.name).includes(target));
        return partial?.display || null;
    }

    return stock.display;
}