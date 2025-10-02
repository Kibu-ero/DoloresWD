
import React, { useState, useEffect } from 'react';
import { FiRefreshCcw, FiDownload, FiLogOut } from 'react-icons/fi';
import ReportsService from '../services/reports.service';
import { formatCurrency } from '../utils/currencyFormatter';
import { useNavigate } from 'react-router-dom';

const FinanceManagerDashboard = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState('custom');
  const [groupBy, setGroupBy] = useState('daily');
  // Default to last 30 days
  const toIso = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const today = new Date();
  const last30 = new Date();
  last30.setDate(today.getDate() - 30);
  const [fromDate, setFromDate] = useState(toIso(last30));
  const [toDate, setToDate] = useState(toIso(today));
  const [stats, setStats] = useState({ totalCollected: 0, averageAmount: 0, paymentCount: 0 });
  const [tableRows, setTableRows] = useState([]);
  const [activeTab, setActiveTab] = useState('Collection Summary');

  const refresh = async () => {
    try {
      // Load current tab dataset first (also derive KPIs from it)
      if (activeTab === 'Collection Summary') {
        const res = await ReportsService.getCollectionSummary(fromDate, toDate, groupBy);
        const rows = res?.data || res || [];
        setTableRows(rows);
        // derive KPIs
        const totalCollected = rows.reduce((s, r) => s + Number(r.totalcollected || r.totalCollected || 0), 0);
        const paymentCount = rows.reduce((s, r) => s + Number(r.paymentcount || r.paymentCount || 0), 0);
        const averageAmount = rows.length ? rows.reduce((s, r) => s + Number(r.averageamount || r.averageAmount || 0), 0) / rows.length : 0;
        setStats({ totalCollected, paymentCount, averageAmount });
      } else if (activeTab === 'Outstanding Balances') {
        const res = await ReportsService.getOutstanding(fromDate, toDate);
        setTableRows(res || []);
        setStats((prev) => ({ ...prev }));
      } else if (activeTab === 'Revenue Report') {
        const res = await ReportsService.getRevenue(fromDate, toDate);
        setTableRows(res || []);
      } else if (activeTab === 'Monthly Statistics') {
        const res = await ReportsService.getMonthlyStats(fromDate, toDate);
        setTableRows(res || []);
      } else if (activeTab === 'Customer Ledger') {
        const res = await ReportsService.getLedger(fromDate, toDate);
        setTableRows(res || []);
      } else {
        setTableRows([]);
      }
      // Fallback KPIs from overview if collection-summary is not active
      if (activeTab !== 'Collection Summary') {
        const overview = await ReportsService.getOverviewReport(fromDate, toDate);
        setStats({
          totalCollected: Number(overview?.totalRevenue || 0),
          paymentCount: Number(overview?.totalBills || 0),
          averageAmount: 0
        });
      }
    } catch (_) {
      setStats({ totalCollected: 0, averageAmount: 0, paymentCount: 0 });
      setTableRows([]);
    }
  };

  useEffect(() => { refresh(); }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-blue-900">Analytics Dashboard</h1>
          <p className="text-sm text-gray-600">Comprehensive reporting for FINANCE OFFICER</p>
        </div>
        <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Logout</button>
      </div>

      <div className="bg-white rounded-xl shadow p-3 md:p-4 mb-4 flex flex-wrap gap-2">
        {['Collection Summary','Outstanding Balances','Revenue Report','Monthly Statistics','Customer Ledger','Daily Collector Billing Sheet'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'} px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Quick Filters</label>
            <select value={range} onChange={(e)=>setRange(e.target.value)} className="border rounded px-3 py-2">
              <option value="custom">Custom Range</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Group By</label>
            <select value={groupBy} onChange={(e)=>setGroupBy(e.target.value)} className="border rounded px-3 py-2">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">From Date</label>
            <input type="date" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} className="border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">To Date</label>
            <input type="date" value={toDate} onChange={(e)=>setToDate(e.target.value)} className="border rounded px-3 py-2" />
          </div>
          <button onClick={refresh} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><FiRefreshCcw className="w-4 h-4"/> Refresh Data</button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><FiDownload className="w-4 h-4"/> Export PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-gray-500">TotalCollected</p>
            <p className="text-3xl font-bold text-blue-900">{formatCurrency(stats.totalCollected)}</p>
          </div>
          <span className="text-2xl">₱</span>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-gray-500">PaymentCount</p>
            <p className="text-3xl font-bold text-blue-900">₱{stats.paymentCount.toFixed(2)}</p>
          </div>
          <span className="text-2xl">₱</span>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-gray-500">AverageAmount</p>
            <p className="text-3xl font-bold text-blue-900">{formatCurrency(stats.averageAmount)}</p>
      </div>
          <span className="text-2xl">₱</span>
        </div>
      </div>

      {/* Data table */}
      <div className="mt-6 bg-white rounded-xl shadow p-4 overflow-x-auto">
        {tableRows.length === 0 ? (
          <div className="text-gray-500">No data.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {Object.keys(tableRows[0]).map((h) => (
                  <th key={h} className="text-left px-3 py-2 font-medium text-gray-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {tableRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {Object.values(row).map((v, i) => (
                    <td key={i} className="px-3 py-2 whitespace-nowrap">{String(v)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default FinanceManagerDashboard; 
