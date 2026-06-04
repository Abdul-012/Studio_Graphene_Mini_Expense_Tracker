const express = require('express');
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getSummary,
  getMonthly,
  exportCsv,
} = require('../controllers/expenseController');

const router = express.Router();

router.get('/summary', getSummary);
router.get('/monthly', getMonthly);
router.get('/export', exportCsv);

router.route('/').get(getExpenses).post(createExpense);

router.route('/:id').get(getExpenseById).put(updateExpense).delete(deleteExpense);

module.exports = router;
