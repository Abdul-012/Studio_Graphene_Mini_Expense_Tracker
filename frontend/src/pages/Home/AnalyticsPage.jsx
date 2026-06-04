import { lazy, Suspense } from 'react';
import { useOutletContext } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';

const Charts = lazy(() => import('../../components/Charts'));

function AnalyticsPage() {
  const { summary, monthly, loading } = useOutletContext();

  return (
    <section className="page-wrap">
      <div className="page-header">
        <h2>Analytics</h2>
        <p>Category and monthly trend charts for spending analysis.</p>
      </div>

      {loading ? (
        <section className="panel">
          <p>Loading chart data...</p>
        </section>
      ) : (
        <>
          <Suspense
            fallback={
              <section className="panel">
                <p>Loading charts...</p>
              </section>
            }
          >
            <Charts summary={summary} monthly={monthly} />
          </Suspense>
          <section className="panel stats-list">
            <h3>Category Totals and Budgets</h3>
            {(summary.budgetStatus || []).length ? (
              <ul>
                {summary.budgetStatus.map((item) => (
                  <li key={item._id} className={item.exceeded ? 'stat-exceeded' : ''}>
                    <span>{item._id}</span>
                    <strong>
                      {item.budget > 0
                        ? `${formatCurrency(item.total)} / ${formatCurrency(item.budget)}`
                        : formatCurrency(item.total)}
                    </strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No category data yet.</p>
            )}
          </section>
        </>
      )}
    </section>
  );
}

export default AnalyticsPage;
