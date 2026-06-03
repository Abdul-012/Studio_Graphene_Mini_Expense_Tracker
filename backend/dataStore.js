const fs = require('fs/promises');
const path = require('path');
const { DEFAULT_CATEGORY_BUDGETS } = require('./constants');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = process.env.EXPENSE_STORE_FILE
  ? path.resolve(process.env.EXPENSE_STORE_FILE)
  : path.join(DATA_DIR, 'expense-store.json');

const DEFAULT_STORE = {
  expenses: [],
  settings: {
    categoryBudgets: DEFAULT_CATEGORY_BUDGETS
  }
};

const normalizeCategoryBudgets = (budgets = {}) => Object.keys(DEFAULT_CATEGORY_BUDGETS).reduce((normalized, category) => {
  const value = Number(budgets?.[category]);
  return {
    ...normalized,
    [category]: Number.isNaN(value) || value < 0 ? 0 : value
  };
}, {});

const normalizeStore = (store) => ({
  expenses: Array.isArray(store?.expenses) ? store.expenses : [],
  settings: {
    categoryBudgets: normalizeCategoryBudgets(store?.settings?.categoryBudgets)
  }
});

const ensureStore = async () => {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(DEFAULT_STORE, null, 2));
  }
};

const readStore = async () => {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  return normalizeStore(JSON.parse(raw));
};

const writeStore = async (store) => {
  const normalized = normalizeStore(store);
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(normalized, null, 2));
  return normalized;
};

module.exports = {
  readStore,
  writeStore
};
