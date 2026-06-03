import { formatCurrency, formatDate } from '../utils/formatters';

function ExpenseList({ expenses, onEdit, onDelete, deletingId }) {
  if (!expenses.length) {
    return (
      <section className="panel">
        <h3>Expenses</h3>
        <p className="muted">No expenses found for the selected filters.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h3>Expenses</h3>

      <div className="expense-table-wrap">
        <table className="expense-table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Category</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense._id}>
                <td>
                  <div className="expense-title">{expense.title}</div>
                  {expense.note ? <div className="expense-note">{expense.note}</div> : null}
                </td>
                <td>{expense.category}</td>
                <td>{formatDate(expense.date)}</td>
                <td className="amount-cell">{formatCurrency(expense.amount)}</td>
                <td>
                  <div className="row-actions">
                    <button type="button" className="ghost-btn" onClick={() => onEdit(expense)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => onDelete(expense._id)}
                      disabled={deletingId === expense._id}
                    >
                      {deletingId === expense._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ExpenseList;
