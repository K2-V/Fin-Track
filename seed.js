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
        { name: 'stock' },
        { name: 'crypto' },
        { name: 'bond' }
    ]);
    console.log('📦 Categories seeded');

    const appleStock = await Investment.create({
        assetName: 'Apple',
        categoryId: categories.find(c => c.name === 'stock')._id,
        amount: 10,
        initialPrice: 145,
        purchaseDate: new Date('2024-01-15'),
        note: 'Dlouhodobá investice'
    });

    const bitcoin = await Investment.create({
        assetName: 'Bitcoin',
        categoryId: categories.find(c => c.name === 'crypto')._id,
        amount: 0.5,
        initialPrice: 28000,
        purchaseDate: new Date('2024-03-10')
    });

    const bond = await Investment.create({
        assetName: 'Státní dluhopis 2030',
        categoryId: categories.find(c => c.name === 'bond')._id,
        amount: 10000, // investovaná částka
        initialPrice: 1, // může být 1:1
        purchaseDate: new Date('2024-05-01'),
        couponRate: 3.5,
        investmentLength: 72, // měsíců
        note: 'Bezpečná investice'
    });
    const teslaStock = await Investment.create({
        assetName: 'Tesla',
        categoryId: categories.find(c => c.name === 'stock')._id,
        amount: 5,
        initialPrice: 400,
        purchaseDate: new Date('2022-01-15'),
        note: 'Dlouhodobá investice'
    });
    const microsoftStock = await Investment.create({
        assetName: 'Microsoft',
        categoryId: categories.find(c => c.name === 'stock')._id,
        amount: 20,
        initialPrice: 200,
        purchaseDate: new Date('2020-01-15'),
        note: 'Dlouhodobá investice'
    });
    const ethereum = await Investment.create({
        assetName: 'Ethereum',
        categoryId: categories.find(c => c.name === 'crypto')._id,
        amount: 0.9,
        initialPrice: 1000,
        purchaseDate: new Date('2023-03-10')
    });
    const vystavbaStrakonice = await Investment.create({
        assetName: 'Vystavba Strakonice',
        categoryId: categories.find(c => c.name === 'bond')._id,
        amount: 10000, // investovaná částka
        initialPrice: 1, // může být 1:1
        purchaseDate: new Date('2024-05-01'),
        couponRate: 10,
        investmentLength: 28, // měsíců
        note: 'Bezpečná investice'
    });

    console.log('💰 Investments and prices seeded');

    const allInvestments = await Investment.find().populate('categoryId');
    // console.log('📄 All seeded investments:');
    // console.log(JSON.stringify(allInvestments, null, 2));

    await mongoose.disconnect();
    console.log('🔴 Disconnected from MongoDB');

}

seed().catch(console.error);