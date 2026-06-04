# Studio Graphene Mini Expense Tracker

Exercise 2 from the Studio Graphene full-stack assessment. This is a single-user expense tracker where a user can add, view, edit, delete, filter, summarize, chart, set per-category budgets, and export daily spending records without authentication.

## Live Demo Links

- Public repository: <https://github.com/Abdul-012/Studio_Graphene_Mini_Expense_Tracker>
- Frontend live demo: Not deployed yet.
- Backend live API: Not deployed yet.

Hosted deployment is recommended in the brief, but this submission is focused on the complete local full-stack app. Deployment-ready config files are included for Vercel (`frontend/vercel.json`) and Render (`render.yaml`).

## Tech Stack

- Frontend: React with Vite, chosen for a simple component-based UI and fast local dev/build flow.
- Routing: React Router, used for dashboard, transactions, add/edit, analytics, and export views.
- Charts: Recharts, used for category and monthly spending charts without hand-rolling chart logic.
- API Client: Axios, used to keep REST calls centralized and consistent.
- Backend: Node.js and Express, used for a small REST API with straightforward routing and middleware.
- Storage: JSON file persistence at `backend/data/expense-store.json`, created automatically on first run so no external database setup is required.
- Styling: Plain CSS, used to keep the UI lightweight and easy to review.
- Testing: Node's built-in test runner, used for a focused backend API flow test.

## Features

- Add daily expenses with amount, category, date, optional label, and optional note.
- View all expenses in a paginated table sorted by newest date first.
- Edit and delete existing expense records.
- Filter transactions by category, this month, last month, or a custom date range.
- See current-month totals, category totals, highest expense, and recent expenses on the dashboard.
- View spending charts for category breakdown and the last six months.
- Format all amounts consistently in INR.
- Set a budget for each category and see visual warnings when spending exceeds it.
- Export the currently filtered expense list as a CSV file.
- Persist expenses and budget settings to a local JSON file.

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

From the repository root, install both apps:

```bash
npm run install:all
```

Open two terminals from the repository root.

Backend:

```bash
npm run backend:start
```

The backend runs at `http://localhost:5000`.

Frontend:

```bash
npm run frontend:start
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

Run the backend test and frontend production build together:

```bash
npm run verify
```

Or run them separately:

```bash
npm run backend:test
npm run frontend:build
```

## Deployment Notes

Deployment is not required to run the app locally, but the project includes config for common hosts:

- Backend: `render.yaml` deploys the Express API from the `backend` folder. Set `CLIENT_URL` to the deployed frontend URL.
- Frontend: `frontend/vercel.json` supports React Router client-side routing on Vercel.
- Frontend API URL: set `VITE_API_URL` to the deployed backend API base URL, for example `https://your-api.onrender.com/api`.
- Persistence: local JSON persistence is stored at `backend/data/expense-store.json`. On hosted platforms, use a persistent disk or move storage to SQLite/PostgreSQL if data must survive redeploys.

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

Accepts the same filter query parameters as `GET /expenses` and returns a CSV download.

Response:

- `Content-Type`: `text/csv`
- Filename: `expenses.csv`
- Columns: `Date`, `Label`, `Category`, `Amount`, `Note`

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
Studio_Graphene_Mini_Expense_Tracker/
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
