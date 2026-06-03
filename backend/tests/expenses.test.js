const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const test = require('node:test');

process.env.EXPENSE_STORE_FILE = path.join(os.tmpdir(), `expense-store-${Date.now()}.json`);

const app = require('../server');

const todayDateOnly = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

const request = async (server, pathName, options = {}) => {
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}${pathName}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  return {
    status: response.status,
    body
  };
};

test('expense API creates, lists, summarizes, and validates expenses', async (t) => {
  const server = app.listen(0);
  const today = todayDateOnly();

  t.after(async () => {
    server.close();
    await fs.rm(process.env.EXPENSE_STORE_FILE, { force: true });
  });

  const createResponse = await request(server, '/api/expenses', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Lunch',
      amount: 250.5,
      category: 'Food',
      date: today,
      note: 'Team meal'
    })
  });

  assert.equal(createResponse.status, 201);
  assert.equal(createResponse.body.category, 'Food');
  assert.equal(createResponse.body.amount, 250.5);

  const listResponse = await request(server, '/api/expenses?category=Food');
  assert.equal(listResponse.status, 200);
  assert.equal(listResponse.body.total, 1);
  assert.equal(listResponse.body.expenses[0].title, 'Lunch');

  const summaryResponse = await request(server, '/api/expenses/summary');
  assert.equal(summaryResponse.status, 200);
  assert.equal(summaryResponse.body.total, 250.5);
  assert.equal(summaryResponse.body.byCategory[0]._id, 'Food');

  const budgetResponse = await request(server, '/api/settings/category-budgets', {
    method: 'PUT',
    body: JSON.stringify({
      categoryBudgets: {
        Food: 200
      }
    })
  });

  assert.equal(budgetResponse.status, 200);
  assert.equal(budgetResponse.body.settings.categoryBudgets.Food, 200);

  const exceededSummaryResponse = await request(server, '/api/expenses/summary');
  assert.equal(exceededSummaryResponse.status, 200);
  assert.equal(exceededSummaryResponse.body.exceeded, true);
  assert.equal(exceededSummaryResponse.body.overBudgetCategories[0]._id, 'Food');

  const invalidResponse = await request(server, '/api/expenses', {
    method: 'POST',
    body: JSON.stringify({
      amount: -1,
      category: 'Food',
      date: today
    })
  });

  assert.equal(invalidResponse.status, 400);
  assert.match(invalidResponse.body.message, /positive number/);
});
