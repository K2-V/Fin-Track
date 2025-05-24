const express = require('express');
const { body, param } = require('express-validator');
const {
    getAllCategories,
    createCategory,
    deleteCategory
} = require('../controllers/categoriesControllers');

const router = express.Router();

router.get('/', getAllCategories);

router.post('/', [
    body('name').notEmpty().withMessage('Category name is required')
], createCategory);

router.delete('/:id', [
    param('id').isMongoId().withMessage('Valid category ID required')
], deleteCategory);

module.exports = router;