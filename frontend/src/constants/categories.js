export const categories = [
  'Food',
  'Transport',
  'Bills',
  'Entertainment',
  'Shopping',
  'Health',
  'Other',
];

export const emptyCategoryBudgets = categories.reduce(
  (budgets, category) => ({
    ...budgets,
    [category]: '0',
  }),
  {}
);
