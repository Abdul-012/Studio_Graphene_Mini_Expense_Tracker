const CATEGORIES = ['Food', 'Transport', 'Bills', 'Entertainment', 'Shopping', 'Health', 'Other'];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DEFAULT_CATEGORY_BUDGETS = CATEGORIES.reduce((budgets, category) => ({
  ...budgets,
  [category]: 0
}), {});

module.exports = {
  CATEGORIES,
  MONTH_NAMES,
  DEFAULT_CATEGORY_BUDGETS
};
