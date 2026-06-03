import { useNavigate, useOutletContext } from 'react-router-dom';
import ExpenseList from '../../components/ExpenseList';
import { categories } from '../../constants/categories';

function TransactionsPage() {
  const {
    expenses,
    loading,
    deletingId,
    filters,
    page,
    totalPages,
    setPage,
    handleFilterChange,
    clearFilters,
    startEditExpense,
    handleDeleteExpense
  } = useOutletContext();

  const navigate = useNavigate();

  const handleEdit = (expense) => {
    startEditExpense(expense);
    navigate('/add');
  };

  return (
    <section className="page-wrap">
      <div className="page-header">
        <h2>Transactions</h2>
        <p>Filter, edit, and manage all your expense records.</p>
      </div>

      <section className="panel filter-panel">
        <h3>Filters</h3>
        <div className="filter-grid">
          <input
            name="search"
            type="text"
            placeholder="Search by title"
            value={filters.search}
            onChange={handleFilterChange}
          />
          <select name="category" value={filters.category} onChange={handleFilterChange}>
            <option value="">All Categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select name="datePreset" value={filters.datePreset} onChange={handleFilterChange}>
            <option value="all">All Dates</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="custom">Custom Range</option>
          </select>
          <input
            name="startDate"
            type="date"
            value={filters.startDate}
            onChange={handleFilterChange}
            disabled={filters.datePreset !== 'custom'}
          />
          <input
            name="endDate"
            type="date"
            value={filters.endDate}
            onChange={handleFilterChange}
            disabled={filters.datePreset !== 'custom'}
          />
          <button type="button" className="ghost-btn" onClick={clearFilters}>Reset</button>
        </div>
      </section>

      {loading ? (
        <section className="panel"><p>Loading expenses...</p></section>
      ) : (
        <ExpenseList
          expenses={expenses}
          onEdit={handleEdit}
          onDelete={handleDeleteExpense}
          deletingId={deletingId}
        />
      )}

      <footer className="pagination-row">
        <button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page <= 1}>
          Previous
        </button>
        <span>{`Page ${page} of ${totalPages}`}</span>
        <button type="button" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page >= totalPages}>
          Next
        </button>
      </footer>
    </section>
  );
}

export default TransactionsPage;
