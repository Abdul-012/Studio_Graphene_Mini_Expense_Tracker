const express = require('express');
const {
  getSettings,
  updateCategoryBudgets
} = require('../controllers/settingsController');

const router = express.Router();

router.get('/', getSettings);
router.put('/category-budgets', updateCategoryBudgets);

module.exports = router;
