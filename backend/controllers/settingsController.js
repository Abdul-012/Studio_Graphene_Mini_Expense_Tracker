const { readStore, writeStore } = require('../dataStore');
const { CATEGORIES, DEFAULT_CATEGORY_BUDGETS } = require('../constants');

const totalBudget = (categoryBudgets) =>
  Object.values(categoryBudgets).reduce((sum, value) => sum + Number(value || 0), 0);

const validateCategoryBudgets = (incoming = {}, existing = DEFAULT_CATEGORY_BUDGETS) => {
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    return { error: 'categoryBudgets must be an object keyed by category' };
  }

  const next = {
    ...DEFAULT_CATEGORY_BUDGETS,
    ...existing,
  };

  for (const [category, rawValue] of Object.entries(incoming)) {
    if (!CATEGORIES.includes(category)) {
      return { error: `Invalid budget category: ${category}` };
    }

    if (rawValue === '' || rawValue === null || rawValue === undefined) {
      next[category] = 0;
      continue;
    }

    const value = Number(rawValue);
    if (Number.isNaN(value) || value < 0) {
      return { error: `${category} budget must be a non-negative number` };
    }

    next[category] = value;
  }

  return { value: next };
};

const getSettings = async (req, res) => {
  try {
    const store = await readStore();
    return res.status(200).json({
      categoryBudgets: store.settings.categoryBudgets,
      totalBudget: totalBudget(store.settings.categoryBudgets),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateCategoryBudgets = async (req, res) => {
  try {
    const store = await readStore();
    const validation = validateCategoryBudgets(
      req.body.categoryBudgets,
      store.settings.categoryBudgets
    );

    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    store.settings.categoryBudgets = validation.value;
    await writeStore(store);

    return res.status(200).json({
      message: 'Category budgets updated',
      settings: {
        categoryBudgets: store.settings.categoryBudgets,
        totalBudget: totalBudget(store.settings.categoryBudgets),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSettings,
  updateCategoryBudgets,
};
