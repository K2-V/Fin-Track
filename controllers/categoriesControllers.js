const { validationResult } = require('express-validator');
const Category = require('../models/Category');



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
        let inputName = req.body.name.trim();
        // Kontrola na duplicitní název (case-insensitive)
        const existing = await Category.findOne({
            name: { $regex: `^${inputName}$`, $options: 'i' }
        });
        if (existing) {
            return res.status(409).json({ message: 'Category with this name already exists.' });
        }
        // Volitelná normalizace názvu (např. "Akcie")
        const normalizedName = inputName.charAt(0).toUpperCase() + inputName.slice(1).toLowerCase();
        const newCategory = new Category({ name: normalizedName });
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
