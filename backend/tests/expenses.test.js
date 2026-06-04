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

const dateOnlyWithOffset = (daysOffset) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
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

test('expense API covers the assessment expense flow', async (t) => {
  const server = app.listen(0);
  const today = todayDateOnly();
  const yesterday = dateOnlyWithOffset(-1);
  const tomorrow = dateOnlyWithOffset(1);

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

  const travelResponse = await request(server, '/api/expenses', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Metro',
      amount: 75,
      category: 'Transport',
      date: yesterday
    })
  });

  assert.equal(travelResponse.status, 201);
  assert.equal(travelResponse.body.note, '');

  const stored = JSON.parse(await fs.readFile(process.env.EXPENSE_STORE_FILE, 'utf8'));
  assert.equal(stored.expenses.length, 2);

  const listResponse = await request(server, '/api/expenses');
  assert.equal(listResponse.status, 200);
  assert.equal(listResponse.body.total, 2);
  assert.equal(listResponse.body.expenses[0].title, 'Lunch');
  assert.equal(listResponse.body.expenses[1].title, 'Metro');

  const categoryFilterResponse = await request(server, '/api/expenses?category=Food');
  assert.equal(categoryFilterResponse.status, 200);
  assert.equal(categoryFilterResponse.body.total, 1);
  assert.equal(categoryFilterResponse.body.expenses[0].category, 'Food');

  const dateFilterResponse = await request(server, `/api/expenses?startDate=${today}&endDate=${today}`);
  assert.equal(dateFilterResponse.status, 200);
  assert.equal(dateFilterResponse.body.total, 1);
  assert.equal(dateFilterResponse.body.expenses[0].date, today);

  const updateResponse = await request(server, `/api/expenses/${travelResponse.body._id}`, {
    method: 'PUT',
    body: JSON.stringify({
      amount: 95,
      category: 'Bills',
      note: 'Updated bill'
    })
  });

  assert.equal(updateResponse.status, 200);
  assert.equal(updateResponse.body.amount, 95);
  assert.equal(updateResponse.body.category, 'Bills');
  assert.equal(updateResponse.body.note, 'Updated bill');

  const summaryResponse = await request(server, '/api/expenses/summary');
  assert.equal(summaryResponse.status, 200);
  assert.equal(summaryResponse.body.total, 345.5);
  assert.equal(summaryResponse.body.topExpense.title, 'Lunch');
  assert.equal(summaryResponse.body.byCategory.find((item) => item._id === 'Food').total, 250.5);
  assert.equal(summaryResponse.body.byCategory.find((item) => item._id === 'Bills').total, 95);

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

  const csvResponse = await fetch(`http://127.0.0.1:${server.address().port}/api/expenses/export?category=Food`);
  const csv = await csvResponse.text();
  assert.equal(csvResponse.status, 200);
  assert.match(csv, /^Date,Label,Category,Amount,Note/);
  assert.match(csv, /Lunch/);

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

  const futureDateResponse = await request(server, '/api/expenses', {
    method: 'POST',
    body: JSON.stringify({
      amount: 10,
      category: 'Food',
      date: tomorrow
    })
  });

  assert.equal(futureDateResponse.status, 400);
  assert.match(futureDateResponse.body.message, /future/);

  const missingCategoryResponse = await request(server, '/api/expenses', {
    method: 'POST',
    body: JSON.stringify({
      amount: 10,
      date: today
    })
  });

  assert.equal(missingCategoryResponse.status, 400);
  assert.match(missingCategoryResponse.body.message, /category is required/);

  const deleteResponse = await request(server, `/api/expenses/${travelResponse.body._id}`, {
    method: 'DELETE'
  });

  assert.equal(deleteResponse.status, 200);

  const deletedLookupResponse = await request(server, `/api/expenses/${travelResponse.body._id}`);
  assert.equal(deletedLookupResponse.status, 404);
});
