const express = require('express')
const app = express();
const port = 3000
const connectDB = require('./config/db');

app.use(express.json());
connectDB();

const marketPriceRoutes = require('./routes/marketPrices');
const investmentRoutes = require('./routes/investments');
const categoryRoutes = require('./routes/categories');
const getHistoricalPrices = require('./services/getHistoricalPrices');

app.use('/api/marketprices', marketPriceRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/categories', categoryRoutes );

const updatePrices = require('./services/priceUpdater');

(async () => {
    await getHistoricalPrices();
})();
setInterval(() => {
    // console.log(`Spouštím updatePrices() v ${new Date().toLocaleTimeString()}`);
    updatePrices();
}, 1000 * 60);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
module.exports = app;