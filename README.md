# Mini Expense Tracker

Exercise 2 from the Studio Graphene full-stack assessment. This is a single-user expense tracker where a user can add, view, edit, delete, filter, summarize, chart, set per-category budgets, and export daily spending records without authentication.

## Live Demo Links

- Public repository: <https://github.com/Abdul-012/Studio-Graphene-Expense-Tracker>
- Frontend live demo: Not deployed yet.
- Backend live API: Not deployed yet.

Hosted deployment is recommended in the brief, but this submission is focused on the complete local full-stack app. Deployment-ready config files are included for Vercel (`frontend/vercel.json`) and Render (`render.yaml`).

## Tech Stack

- Frontend: React with Vite for a fast local dev/build flow.
- Routing: React Router for dashboard, transactions, add/edit, analytics, and export views.
- Charts: Recharts for category and monthly spending charts.
- API Client: Axios for REST calls.
- Backend: Node.js and Express.
- Storage: JSON file persistence at `backend/data/expense-store.json`, created automatically on first run.
- Styling: Plain CSS.
- Testing: Node's built-in test runner for a focused backend API test.

## Requirement Checklist

Must have:

- Add an expense with positive amount, category, date, and optional note.
- View expenses in a table sorted by newest date first.
- Edit and delete existing expenses.
- Filter expenses by category and date range: all dates, this month, last month, or custom dates.
- Summary panel shows this month's total, category totals, and highest single expense.

Should have:

- Category and monthly spending charts with Recharts.
- INR currency formatting with `Intl.NumberFormat`.
- Validation for positive amounts, valid required category, and no future dates.

Bonus:

- CSV export for the current filtered expense set.
- Per-category budget settings with visual over-budget indicators.
- JSON file persistence across local server restarts.

## Current Status

Works end-to-end:

- Expense create, read, update, delete.
- Category and date-range filtering.
- Monthly summary cards, category totals, highest expense, charts, budgets, and CSV export.
- JSON persistence across backend restarts.
- Responsive layout for desktop and mobile.

Not included:

- Hosted frontend/backend deployment.
- Frontend component tests.

## How to Run Locally

Open two terminals from the repository root.

Backend:

```bash
cd backend
npm install
npm start
```

The backend runs at `http://localhost:5000`.

Frontend:

```bash
cd frontend
npm install
npm start
```

The frontend runs at `http://localhost:3000`.

If port `5000` is occupied, start the backend on another port:

```bash
cd backend
PORT=5051 npm start
```

Then create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5051/api
```

Then start the frontend again.

Run the backend test:

```bash
cd backend
npm test
```

Build the frontend:

```bash
cd frontend
npm run build
```

## API Documentation

Base URL: `http://localhost:5000/api`

### Health

`GET /health`

Response:

```json
{ "status": "ok" }
```

### Expenses

`GET /expenses`

Query parameters:

- `page`: page number, default `1`
- `limit`: page size, default `10`, max `100`
- `category`: one of `Food`, `Transport`, `Bills`, `Entertainment`, `Shopping`, `Health`, `Other`
- `startDate`: `YYYY-MM-DD`
- `endDate`: `YYYY-MM-DD`
- `search`: matches label or note

Response:

```json
{
  "expenses": [
    {
      "_id": "uuid",
      "title": "Lunch",
      "amount": 250.5,
      "category": "Food",
      "date": "2026-06-01",
      "note": "Team meal",
      "createdAt": "2026-06-03T10:00:00.000Z",
      "updatedAt": "2026-06-03T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

`POST /expenses`

Request body:

```json
{
  "title": "Lunch",
  "amount": 250.5,
  "category": "Food",
  "date": "2026-06-01",
  "note": "Team meal"
}
```

Validation:

- `amount` must be a positive number.
- `category` is required and must be valid.
- `date` is required, must be `YYYY-MM-DD`, and cannot be in the future.
- `title` is an optional display label.
- `note` is optional.

Response: `201` with the created expense object.

`GET /expenses/:id`

Response: `200` with one expense object, or `404` if not found.

`PUT /expenses/:id`

Request body accepts any editable expense fields:

```json
{
  "title": "Updated lunch",
  "amount": 300,
  "category": "Food",
  "date": "2026-06-01",
  "note": "Updated note"
}
```

Response: `200` with the updated expense object.

`DELETE /expenses/:id`

Response:

```json
{ "message": "Expense deleted successfully" }
```

### Summary

`GET /expenses/summary`

Response:

```json
{
  "total": 1250.5,
  "budget": 5000,
  "categoryBudgets": {
    "Food": 1500,
    "Transport": 1000,
    "Bills": 2000,
    "Entertainment": 500,
    "Shopping": 0,
    "Health": 0,
    "Other": 0
  },
  "exceeded": false,
  "percentUsed": 25,
  "byCategory": [
    {
      "_id": "Food",
      "total": 750.5,
      "budget": 1500,
      "exceeded": false,
      "percentUsed": 50
    }
  ],
  "budgetStatus": [
    {
      "_id": "Food",
      "total": 750.5,
      "budget": 1500,
      "exceeded": false,
      "percentUsed": 50
    }
  ],
  "overBudgetCategories": [],
  "topExpense": {
    "_id": "uuid",
    "title": "Groceries",
    "amount": 500,
    "category": "Food",
    "date": "2026-06-02"
  }
}
```

`GET /expenses/monthly`

Response:

```json
[
  { "month": "Jan 2026", "total": 0 },
  { "month": "Feb 2026", "total": 1200 }
]
```

`GET /expenses/export`

Accepts the same filter query parameters as `GET /expenses` and returns a CSV download with date, label, category, amount, and note.

### Settings

`GET /settings`

Response:

```json
{
  "categoryBudgets": {
    "Food": 1500,
    "Transport": 1000,
    "Bills": 2000,
    "Entertainment": 500,
    "Shopping": 0,
    "Health": 0,
    "Other": 0
  },
  "totalBudget": 5000
}
```

`PUT /settings/category-budgets`

Request body:

```json
{
  "categoryBudgets": {
    "Food": 1500,
    "Transport": 1000,
    "Bills": 2000,
    "Entertainment": 500
  }
}
```

Response:

```json
{
  "message": "Category budgets updated",
  "settings": {
    "categoryBudgets": {
      "Food": 1500,
      "Transport": 1000,
      "Bills": 2000,
      "Entertainment": 500,
      "Shopping": 0,
      "Health": 0,
      "Other": 0
    },
    "totalBudget": 5000
  }
}
```

## Project Structure

```text
expense-tracker/
  backend/
    controllers/       Express request handlers
    routes/            API route definitions
    tests/             Backend API test
    dataStore.js       JSON file read/write helper
    server.js          Express app and server entry
  frontend/
    public/            Static assets copied by Vite
    src/
      api/             Axios client
      components/      Expense form, list, and charts
      pages/Home/      Dashboard, transactions, add/edit, analytics, export
      utils/           Currency and date format helpers
    index.html         Vite HTML entry
    vite.config.js     Vite React config
```

## Next Steps

- Deploy the updated frontend and backend, then add the final public URLs here.
- Add frontend component tests for form validation and filter behavior.
- Add inline table editing or a modal edit flow to reduce navigation.
- Replace the JSON file with SQLite if multi-user support or stronger querying becomes necessary.

## Development Notes

I used AI assistance for refactoring, verification, and documentation, then reviewed the code and tested the flows listed above. No tutorial starter code or copied Stack Overflow snippets were used.
