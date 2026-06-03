const { randomUUID } = require('crypto');
const { readStore, writeStore } = require('../dataStore');
const { CATEGORIES, MONTH_NAMES, DEFAULT_CATEGORY_BUDGETS } = require('../constants');

const pad = (value) => String(value).padStart(2, '0');

const todayDateOnly = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const dateOnlyFromInput = (value) => {
  if (!value) return null;

  const dateOnly = String(value).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return null;

  const parsed = new Date(`${dateOnly}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== dateOnly) {
    return null;
  }

  return dateOnly;
};

const sortExpenses = (expenses) => expenses.sort((a, b) => {
  const byDate = String(b.date).localeCompare(String(a.date));
  if (byDate !== 0) return byDate;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
});

const validateExpense = (body, { partial = false } = {}) => {
  const next = {};

  if (!partial || body.amount !== undefined) {
    if (body.amount === undefined || body.amount === null || body.amount === '') {
      return { error: 'amount is required' };
    }

    const amount = Number(body.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      return { error: 'amount must be a positive number' };
    }

    next.amount = amount;
  }

  if (!partial || body.category !== undefined) {
    if (!body.category) {
      return { error: 'category is required' };
    }

    if (!CATEGORIES.includes(body.category)) {
      return { error: 'Invalid category' };
    }

    next.category = body.category;
  }

  if (!partial || body.date !== undefined) {
    const date = dateOnlyFromInput(body.date);
    if (!date) {
      return { error: 'date must be a valid YYYY-MM-DD value' };
    }

    if (date > todayDateOnly()) {
      return { error: 'date cannot be in the future' };
    }

    next.date = date;
  }

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (title.length > 100) {
      return { error: 'title cannot exceed 100 characters' };
    }
    next.title = title;
  }

  if (body.note !== undefined) {
    const note = String(body.note).trim();
    if (note.length > 500) {
      return { error: 'note cannot exceed 500 characters' };
    }
    next.note = note;
  }

  return { value: next };
};

const filterExpenses = (expenses, query) => {
  let filtered = [...expenses];
  const { category, startDate, endDate, search } = query;

  if (category) {
    if (!CATEGORIES.includes(category)) {
      return { error: 'Invalid category filter' };
    }
    filtered = filtered.filter((expense) => expense.category === category);
  }

  if (startDate) {
    const start = dateOnlyFromInput(startDate);
    if (!start) return { error: 'startDate must be a valid YYYY-MM-DD value' };
    filtered = filtered.filter((expense) => expense.date >= start);
  }

  if (endDate) {
    const end = dateOnlyFromInput(endDate);
    if (!end) return { error: 'endDate must be a valid YYYY-MM-DD value' };
    filtered = filtered.filter((expense) => expense.date <= end);
  }

  if (startDate && endDate && dateOnlyFromInput(startDate) > dateOnlyFromInput(endDate)) {
    return { error: 'startDate cannot be after endDate' };
  }

  if (search) {
    const needle = String(search).trim().toLowerCase();
    filtered = filtered.filter((expense) => (
      String(expense.title || '').toLowerCase().includes(needle)
      || String(expense.note || '').toLowerCase().includes(needle)
    ));
  }

  return { expenses: sortExpenses(filtered) };
};

const getCategoryBudgets = (settings = {}) => ({
  ...DEFAULT_CATEGORY_BUDGETS,
  ...(settings.categoryBudgets || {})
});

const buildCategoryTotals = (expenses, categoryBudgets = DEFAULT_CATEGORY_BUDGETS) => CATEGORIES
  .map((category) => {
    const total = expenses
      .filter((expense) => expense.category === category)
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const budget = Number(categoryBudgets[category] || 0);

    return {
      _id: category,
      total,
      budget,
      exceeded: budget > 0 && total > budget,
      percentUsed: budget > 0 ? Math.round((total / budget) * 100) : 0
    };
  })
  .filter((item) => item.total > 0 || item.budget > 0)
  .sort((a, b) => b.total - a.total);

const createExpense = async (req, res) => {
  try {
    const validation = validateExpense(req.body);
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const store = await readStore();
    const now = new Date().toISOString();
    const expense = {
      _id: randomUUID(),
      title: validation.value.title || `${validation.value.category} expense`,
      amount: validation.value.amount,
      category: validation.value.category,
      date: validation.value.date,
      note: validation.value.note || '',
      createdAt: now,
      updatedAt: now
    };

    store.expenses.push(expense);
    await writeStore(store);

    return res.status(201).json(expense);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getExpenses = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
    const store = await readStore();
    const result = filterExpenses(store.expenses, req.query);

    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    const total = result.expenses.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;

    return res.status(200).json({
      expenses: result.expenses.slice(start, start + limit),
      total,
      page,
      limit,
      totalPages
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getExpenseById = async (req, res) => {
  try {
    const store = await readStore();
    const expense = store.expenses.find((item) => item._id === req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    return res.status(200).json(expense);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateExpense = async (req, res) => {
  try {
    const validation = validateExpense(req.body, { partial: true });
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const store = await readStore();
    const index = store.expenses.findIndex((item) => item._id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const updated = {
      ...store.expenses[index],
      ...validation.value,
      updatedAt: new Date().toISOString()
    };

    if (!updated.title) {
      updated.title = `${updated.category} expense`;
    }

    store.expenses[index] = updated;
    await writeStore(store);

    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const store = await readStore();
    const initialCount = store.expenses.length;
    store.expenses = store.expenses.filter((item) => item._id !== req.params.id);

    if (store.expenses.length === initialCount) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await writeStore(store);
    return res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getSummary = async (req, res) => {
  try {
    const store = await readStore();
    const now = new Date();
    const startOfMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    const today = todayDateOnly();
    const monthExpenses = store.expenses.filter((expense) => expense.date >= startOfMonth && expense.date <= today);
    const total = monthExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const categoryBudgets = getCategoryBudgets(store.settings);
    const budget = Object.values(categoryBudgets).reduce((sum, value) => sum + Number(value || 0), 0);
    const categoryTotals = buildCategoryTotals(monthExpenses, categoryBudgets);
    const budgetStatus = CATEGORIES.map((category) => {
      const totalForCategory = categoryTotals.find((item) => item._id === category)?.total || 0;
      const budgetForCategory = Number(categoryBudgets[category] || 0);

      return {
        _id: category,
        total: totalForCategory,
        budget: budgetForCategory,
        exceeded: budgetForCategory > 0 && totalForCategory > budgetForCategory,
        percentUsed: budgetForCategory > 0 ? Math.round((totalForCategory / budgetForCategory) * 100) : 0
      };
    });
    const overBudgetCategories = budgetStatus.filter((item) => item.exceeded);
    const topExpense = monthExpenses.reduce((highest, expense) => {
      if (!highest || Number(expense.amount) > Number(highest.amount)) return expense;
      return highest;
    }, null);

    return res.status(200).json({
      total,
      budget,
      categoryBudgets,
      exceeded: overBudgetCategories.length > 0,
      percentUsed: budget > 0 ? Math.round((total / budget) * 100) : 0,
      byCategory: categoryTotals,
      budgetStatus,
      overBudgetCategories,
      topExpense
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getMonthly = async (req, res) => {
  try {
    const store = await readStore();
    const buckets = [];

    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setMonth(date.getMonth() - offset, 1);
      const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
      buckets.push({
        key,
        month: `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`,
        total: 0
      });
    }

    store.expenses.forEach((expense) => {
      const key = String(expense.date).slice(0, 7);
      const bucket = buckets.find((item) => item.key === key);
      if (bucket) {
        bucket.total += Number(expense.amount || 0);
      }
    });

    return res.status(200).json(buckets.map(({ month, total }) => ({ month, total })));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const escapeCsv = (value) => {
  const text = value === undefined || value === null ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const exportCsv = async (req, res) => {
  try {
    const store = await readStore();
    const result = filterExpenses(store.expenses, req.query);

    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    const headers = ['Date', 'Label', 'Category', 'Amount', 'Note'];
    const rows = result.expenses.map((expense) => [
      expense.date,
      expense.title,
      expense.category,
      Number(expense.amount || 0).toFixed(2),
      expense.note
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(','))
      .join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment('expenses.csv');
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  CATEGORIES,
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getSummary,
  getMonthly,
  exportCsv
};
