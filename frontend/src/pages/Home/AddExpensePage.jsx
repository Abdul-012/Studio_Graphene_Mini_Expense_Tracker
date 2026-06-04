import { useNavigate, useOutletContext } from 'react-router-dom';
import ExpenseForm from '../../components/ExpenseForm';

function AddExpensePage() {
  const { editExpense, clearEditExpense, handleSavedExpense } = useOutletContext();

  const navigate = useNavigate();

  return (
    <section className="page-wrap">
      <div className="page-header">
        <h2>{editExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
        <p>
          {editExpense
            ? 'Update the selected transaction.'
            : 'Fill details and save a new expense record.'}
        </p>
      </div>

      <ExpenseForm
        editExpense={editExpense}
        onSaved={async () => {
          await handleSavedExpense();
          navigate('/dashboard');
        }}
        onCancel={() => {
          clearEditExpense();
          navigate('/transactions');
        }}
      />
    </section>
  );
}

export default AddExpensePage;
