import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { formatCurrency } from '../utils/formatters';

const chartColors = ['#2563eb', '#0f766e', '#f59e0b', '#ef4444', '#7c3aed', '#0891b2'];

function CurrencyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const item = payload[0];
  const name = label || item.name;

  return (
    <div className="chart-tooltip">
      <strong>{name}</strong>
      <span>{formatCurrency(item.value)}</span>
    </div>
  );
}

function Charts({ summary, monthly }) {
  const pieData = (summary?.byCategory || []).filter((item) => item.total > 0);

  return (
    <section className="chart-grid">
      <article className="panel chart-card">
        <h3>Spending by Category</h3>
        {pieData.length ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="total"
                nameKey="_id"
                innerRadius={58}
                outerRadius={96}
                paddingAngle={2}
              >
                {pieData.map((_, index) => (
                  <Cell key={`pie-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CurrencyTooltip />} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="muted">No category data yet.</p>
        )}
      </article>

      <article className="panel chart-card">
        <h3>Last 6 Months</h3>
        {monthly.length ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthly}>
              <XAxis dataKey="month" tick={{ fill: '#1f2937', fontSize: 12 }} />
              <YAxis tick={{ fill: '#1f2937', fontSize: 12 }} />
              <Tooltip content={<CurrencyTooltip />} />
              <Bar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="muted">No monthly trend data yet.</p>
        )}
      </article>
    </section>
  );
}

export default Charts;
