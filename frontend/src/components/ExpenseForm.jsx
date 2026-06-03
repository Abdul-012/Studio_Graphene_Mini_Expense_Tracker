import { useEffect, useState } from 'react';
import API from '../api/axios';
import { categories } from '../constants/categories';
import { todayDateOnly } from '../utils/formatters';

const initialState = {
  title: '',
  amount: '',
  category: 'Food',
  date: todayDateOnly(),
  note: ''
};

function ExpenseForm({ editExpense, onSaved, onCancel }) {
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editExpense) {
      setFormData(initialState);
      return;
    }

    setFormData({
      title: editExpense.title || '',
      amount: editExpense.amount || '',
      category: editExpense.category || 'Food',
      date: editExpense.date ? String(editExpense.date).slice(0, 10) : initialState.date,
      note: editExpense.note || ''
    });
  }, [editExpense]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount)
      };

      if (editExpense?._id) {
        await API.put(`/expenses/${editExpense._id}`, payload);
      } else {
        await API.post('/expenses', payload);
      }

      setFormData(initialState);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{editExpense ? 'Edit Expense' : 'Add Expense'}</h3>
        {editExpense ? (
          <button className="ghost-btn" type="button" onClick={onCancel}>
            Cancel Edit
          </button>
        ) : null}
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <form className="expense-form" onSubmit={handleSubmit}>
        <input
          name="title"
          placeholder="Label (optional)"
          value={formData.title}
          onChange={handleChange}
        />
        <input
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Amount"
          value={formData.amount}
          onChange={handleChange}
          required
        />
        <select name="category" value={formData.category} onChange={handleChange}>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <input
          name="date"
          type="date"
          value={formData.date}
          onChange={handleChange}
          max={todayDateOnly()}
          required
        />
        <input
          name="note"
          placeholder="Note (optional)"
          value={formData.note}
          onChange={handleChange}
        />
        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : editExpense ? 'Update Expense' : 'Add Expense'}
        </button>
      </form>
    </section>
  );
}

export default ExpenseForm;
