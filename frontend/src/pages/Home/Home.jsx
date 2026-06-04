import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import API from '../../api/axios';
import { emptyCategoryBudgets } from '../../constants/categories';

const toDateOnly = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const emptyFilters = {
  search: '',
  category: '',
  datePreset: 'all',
  startDate: '',
  endDate: ''
};

const getPresetRange = (preset) => {
  const now = new Date();

  if (preset === 'thisMonth') {
    return {
      startDate: toDateOnly(new Date(now.getFullYear(), now.getMonth(), 1)),
      endDate: toDateOnly(now)
    };
  }

  if (preset === 'lastMonth') {
    return {
      startDate: toDateOnly(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      endDate: toDateOnly(new Date(now.getFullYear(), now.getMonth(), 0))
    };
  }

  return {
    startDate: '',
    endDate: ''
  };
};

function Home() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    budget: 0,
    categoryBudgets: {},
    percentUsed: 0,
    byCategory: [],
    budgetStatus: [],
    overBudgetCategories: [],
    topExpense: null
  });
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editExpense, setEditExpense] = useState(null);
  const [deletingId, setDeletingId] = useState('');
  const [savingBudget, setSavingBudget] = useState(false);
  const [budgetInputs, setBudgetInputs] = useState(emptyCategoryBudgets);

  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = { page, limit: 10 };
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const [expenseRes, summaryRes, monthlyRes] = await Promise.all([
        API.get('/expenses', { params }),
        API.get('/expenses/summary'),
        API.get('/expenses/monthly')
      ]);

      setExpenses(expenseRes.data.expenses || []);
      setTotalRecords(expenseRes.data.total || 0);
      setTotalPages(expenseRes.data.totalPages || 1);
      setSummary(summaryRes.data || {});
      setMonthly(monthlyRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load data');
    } finally {
      setLoading(false);
    }
  }, [page, filters.search, filters.category, filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  useEffect(() => {
    setBudgetInputs({
      ...emptyCategoryBudgets,
      ...Object.fromEntries(
        Object.entries(summary.categoryBudgets || {}).map(([category, value]) => [category, String(value || 0)])
      )
    });
  }, [summary.categoryBudgets]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    if (name === 'datePreset') {
      setFilters((prev) => ({
        ...prev,
        datePreset: value,
        ...getPresetRange(value)
      }));
      setPage(1);
      return;
    }

    setFilters((prev) => ({
      ...prev,
      [name]: value,
      datePreset: name === 'startDate' || name === 'endDate' ? 'custom' : prev.datePreset
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setPage(1);
  };

  const startEditExpense = (expense) => {
    setEditExpense(expense);
  };

  const clearEditExpense = () => {
    setEditExpense(null);
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;

    setDeletingId(id);
    setError('');
    try {
      await API.delete(`/expenses/${id}`);
      if (editExpense?._id === id) {
        setEditExpense(null);
      }
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete expense');
    } finally {
      setDeletingId('');
    }
  };

  const handleSavedExpense = async () => {
    setEditExpense(null);
    setFilters(emptyFilters);
    setPage(1);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCsvExport = async () => {
    setError('');
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await API.get('/expenses/export', { params, responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'expenses.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not export CSV');
    }
  };

  const handleUpdateBudget = async (event) => {
    event.preventDefault();
    const categoryBudgets = {};

    for (const [category, rawValue] of Object.entries(budgetInputs)) {
      const value = Number(rawValue || 0);

      if (Number.isNaN(value) || value < 0) {
        setError(`${category} budget must be a non-negative number`);
        return;
      }

      categoryBudgets[category] = value;
    }

    setSavingBudget(true);
    setError('');

    try {
      await API.put('/settings/category-budgets', { categoryBudgets });
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update budgets');
    } finally {
      setSavingBudget(false);
    }
  };

  const handleBudgetInputChange = (category, value) => {
    setBudgetInputs((prev) => ({
      ...prev,
      [category]: value
    }));
  };

  const contextValue = {
    expenses,
    summary,
    monthly,
    loading,
    error,
    filters,
    page,
    totalPages,
    totalRecords,
    editExpense,
    deletingId,
    budgetInputs,
    savingBudget,
    setPage,
    handleBudgetInputChange,
    handleFilterChange,
    clearFilters,
    startEditExpense,
    clearEditExpense,
    handleDeleteExpense,
    handleSavedExpense,
    handleCsvExport,
    handleUpdateBudget,
    refreshData: fetchData
  };

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="brand">
          <h1>Studio Graphene Mini Expense Tracker</h1>
          <p>Single-user spending dashboard</p>
        </div>

        <nav className="nav-links">
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Dashboard
          </NavLink>
          <NavLink to="/transactions" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Transactions
          </NavLink>
          <NavLink to="/add" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Add New Expense
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Analytics
          </NavLink>
          <NavLink to="/export" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Export CSV
          </NavLink>
        </nav>

      </header>

      {error ? <p className="error-text global-error">{error}</p> : null}

      <main className="shell-content">
        <Outlet context={contextValue} />
      </main>
    </div>
  );
}

export default Home;
