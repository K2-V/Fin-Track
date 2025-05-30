const express = require('express')
const app = express();
const port = 3000
const connectDB = require('./config/db');
const cors = require('cors');
app.use(cors());
app.use(express.json());
connectDB();

const marketPriceRoutes = require('./routes/marketPrices');
const investmentRoutes = require('./routes/investments');
const categoryRoutes = require('./routes/categories');
const getHistoricalPrices = require('./services/getHistoricalPrices');
const portfolioRoutes = require('./routes/portfolioHistory');


app.use('/api/marketprices', marketPriceRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/categories', categoryRoutes );
app.use('/api/portfolio', portfolioRoutes);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

const path = require('path');
app.use(express.static(path.resolve(__dirname, 'client/build')));
app.get('/', function (req, res) {
    res.sendFile(path.resolve(__dirname, 'client/build', 'index.html'));
});

const updatePrices = require('./services/priceUpdater');

(async () => {
    await getHistoricalPrices();
})();
setInterval(() => {
    // console.log(`Spouštím updatePrices() v ${new Date().toLocaleTimeString()}`);
    updatePrices();
}, 1000 * 60);



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
module.exports = app;