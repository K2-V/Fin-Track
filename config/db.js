const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/fintrack', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB připojeno');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};