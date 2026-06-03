import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './pages/Home/Home';
import DashboardPage from './pages/Home/DashboardPage';
import TransactionsPage from './pages/Home/TransactionsPage';
import AddExpensePage from './pages/Home/AddExpensePage';
import AnalyticsPage from './pages/Home/AnalyticsPage';
import ExportPage from './pages/Home/ExportPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="add" element={<AddExpensePage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="export" element={<ExportPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
