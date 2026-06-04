import { useOutletContext } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';

function ExportPage() {
  const { summary, totalRecords, handleCsvExport } = useOutletContext();

  return (
    <section className="page-wrap">
      <div className="page-header">
        <h2>Export</h2>
        <p>Download your current data as CSV for reports or submissions.</p>
      </div>

      <section className="panel export-panel">
        <p>{`Current month total: ${formatCurrency(summary.total)}`}</p>
        <p>{`Records matching current filters: ${totalRecords}`}</p>
        <button type="button" onClick={handleCsvExport}>
          Download CSV
        </button>
      </section>

      <section className="panel">
        <h3>What gets exported?</h3>
        <ul className="simple-list">
          <li>Records matching the active transaction filters</li>
          <li>Date</li>
          <li>Label</li>
          <li>Category</li>
          <li>Amount</li>
          <li>Note</li>
        </ul>
      </section>
    </section>
  );
}

export default ExportPage;
