const { validationResult } = require('express-validator');
const Category = require('../models/Category');
const fs = require('fs');
const path = require('path');
const allStocks = JSON.parse(fs.readFileSync(path.join(__dirname, '../allStocks.json'), 'utf-8'));

exports.getAllCategories = async (req, res) => {
    try {
        const data = await Category.find();
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.createCategory = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    let input = req.body.name.trim();
    let categoryName;

    const match = allStocks.find(stock =>
        stock.display.toLowerCase() === input.toLowerCase()
    );

    if (match) {
        const fullName = match.name;
        categoryName = fullName
            .replace(/[,.-]/g, '')
            .replace(/\b(Inc|Incorporated|Corporation|Corp|Ltd|Limited|Company|Co)\b.*$/i, '')
            .trim();
    } else {
        categoryName = input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
    }
    const existing = await Category.findOne({
        name: { $regex: `^${categoryName}$`, $options: 'i' }
    });
    if (existing) {
        return res.status(409).json({ message: 'Category with this name already exists.' });
    }
    const newCategory = new Category({ name: categoryName });
    const saved = await newCategory.save();
    res.status(201).json(saved);
};

exports.deleteCategory = async (req, res) => {
    try {
        const deleted = await Category.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Category not found' });

        res.json({ message: 'Category deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
