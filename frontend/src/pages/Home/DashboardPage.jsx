import { lazy, Suspense } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { categories } from '../../constants/categories';
import { formatCurrency, formatDate } from '../../utils/formatters';

const Charts = lazy(() => import('../../components/Charts'));

function DashboardPage() {
  const {
    summary,
    expenses,
    monthly,
    loading,
    budgetInputs,
    savingBudget,
    handleBudgetInputChange,
    handleUpdateBudget
  } = useOutletContext();
  const overBudgetNames = (summary.overBudgetCategories || []).map((item) => item._id).join(', ');
  const budgetStatusByCategory = Object.fromEntries(
    (summary.budgetStatus || []).map((item) => [item._id, item])
  );

  return (
    <section className="page-wrap">
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Quick overview of your current month spending.</p>
      </div>

      {summary.exceeded ? (
        <div className="alert danger">
          {`Budget exceeded in ${overBudgetNames}.`}
        </div>
      ) : summary.percentUsed > 80 ? (
        <div className="alert warning">
          {`Warning: ${summary.percentUsed}% of total category budget already used.`}
        </div>
      ) : null}

      <div className="summary-grid">
        <article className="summary-card">
          <p>This Month</p>
          <h3>{formatCurrency(summary.total)}</h3>
        </article>
        <article className="summary-card">
          <p>Budget</p>
          <h3>{formatCurrency(summary.budget)}</h3>
        </article>
        <article className="summary-card">
          <p>Used</p>
          <h3>{summary.percentUsed || 0}%</h3>
        </article>
        <article className="summary-card">
          <p>Top Expense</p>
          <h3>{summary.topExpense ? formatCurrency(summary.topExpense.amount) : '--'}</h3>
          <small>{summary.topExpense?.title || 'No record this month'}</small>
        </article>
      </div>

      <div className="dashboard-top-actions">
        <Link to="/add" className="action-link">Add New Expense</Link>
      </div>

      <Suspense fallback={<section className="panel"><p>Loading charts...</p></section>}>
        <Charts summary={summary} monthly={monthly} />
      </Suspense>

      <section className="panel">
        <h3>Category Budgets</h3>
        <form className="category-budget-form" onSubmit={handleUpdateBudget}>
          <div className="category-budget-grid">
            {categories.map((category) => {
              const status = budgetStatusByCategory[category] || { total: 0, budget: 0, exceeded: false, percentUsed: 0 };

              return (
                <label key={category} className={status.exceeded ? 'budget-item exceeded' : 'budget-item'}>
                  <span>{category}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={budgetInputs[category] ?? '0'}
                    onChange={(event) => handleBudgetInputChange(category, event.target.value)}
                    placeholder="0.00"
                  />
                  <small>
                    {status.budget > 0
                      ? `${formatCurrency(status.total)} spent, ${status.percentUsed}% used`
                      : `${formatCurrency(status.total)} spent`}
                  </small>
                </label>
              );
            })}
          </div>
          <button type="submit" disabled={savingBudget}>
            {savingBudget ? 'Saving...' : 'Save Budgets'}
          </button>
        </form>
      </section>

      <section className="panel">
        <h3>Recent Expenses</h3>
        {loading ? (
          <p>Loading recent expenses...</p>
        ) : expenses.length === 0 ? (
          <p>No expenses yet.</p>
        ) : (
          <div className="expense-table-wrap">
            <table className="expense-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Label</th>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.slice(0, 5).map((item) => (
                  <tr key={item._id}>
                    <td>{formatDate(item.date)}</td>
                    <td>{item.title}</td>
                    <td>{item.category}</td>
                    <td className="amount-cell">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

export default DashboardPage;
