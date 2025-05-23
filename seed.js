const mongoose = require('mongoose');
const Category = require('./models/category');
const Investment = require('./models/investment.js');
const MarketPrice = require('./models/marketPrice');

async function seed() {
    await mongoose.connect('mongodb://localhost:27017/fintrack');

    console.log('🟢 Connected to MongoDB');

    await Category.deleteMany({});
    await Investment.deleteMany({});
    await MarketPrice.deleteMany({});

    const categories = await Category.insertMany([
        { name: 'Akcie' },
        { name: 'Kryptoměny' },
        { name: 'Dluhopisy' }
    ]);
    console.log('📦 Categories seeded');

    const appleStock = await Investment.create({
        assetName: 'Apple',
        categoryId: categories.find(c => c.name === 'Akcie')._id,
        quantity: 10,
        purchasePrice: 145,
        purchaseDate: new Date('2024-01-15'),
        note: 'Dlouhodobá investice'
    });

    const bitcoin = await Investment.create({
        assetName: 'Bitcoin',
        categoryId: categories.find(c => c.name === 'Kryptoměny')._id,
        quantity: 0.5,
        purchasePrice: 28000,
        purchaseDate: new Date('2024-03-10')
    });

    const bond = await Investment.create({
        assetName: 'Státní dluhopis 2030',
        categoryId: categories.find(c => c.name === 'Dluhopisy')._id,
        quantity: 10000, // investovaná částka
        purchasePrice: 1, // může být 1:1
        purchaseDate: new Date('2024-05-01'),
        couponRate: 3.5,
        investmentLength: 72, // měsíců
        note: 'Bezpečná investice'
    });

    await MarketPrice.insertMany([
        { assetName: 'Apple', date: new Date(), price: 170 },
        { assetName: 'Bitcoin', date: new Date(), price: 39000 },
        { assetName: 'Státní dluhopis 2030', date: new Date(), price: 1.03 }
    ]);

    console.log('💰 Investments and prices seeded');

    const allInvestments = await Investment.find().populate('categoryId');
    console.log('📄 All seeded investments:');
    console.log(JSON.stringify(allInvestments, null, 2));

    // await mongoose.disconnect();
    // console.log('🔴 Disconnected from MongoDB');

}

seed().catch(console.error);