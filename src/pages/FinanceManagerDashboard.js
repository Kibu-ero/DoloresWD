
import React, { useState, useEffect } from 'react';
import { FiRefreshCcw, FiDownload, FiLogOut } from 'react-icons/fi';
import apiClient from '../api/client';
import { formatCurrency } from '../utils/currencyFormatter';
import { useNavigate } from 'react-router-dom';

const FinanceManagerDashboard = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState('custom');
  const [groupBy, setGroupBy] = useState('daily');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [stats, setStats] = useState({ totalCollected: 0, averageAmount: 0, paymentCount: 0 });

  const refresh = async () => {
    // Placeholder: wire to your reports API
    setStats({ totalCollected: 32672, averageAmount: 17314.83, paymentCount: 34 });
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
        {['Collection Summary','Outstanding Balances','Revenue Report','Monthly Statistics','Approval Logs','Transaction Logs','Customer Ledger','Daily Collector Billing Sheet'].map((tab) => (
          <span key={tab} className="px-3 py-2 rounded-lg bg-blue-100 text-blue-800 text-sm font-medium">{tab}</span>
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
    </div>
  );
};

export default FinanceManagerDashboard; 
