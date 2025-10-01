
import React, { useState } from "react";
import { formatCurrency } from '../utils/currencyFormatter';
import { FiBarChart2, FiFileText, FiCheckCircle, FiDollarSign } from "react-icons/fi";
import { useNavigate } from 'react-router-dom';

const mockKPIs = {
  revenue: 120000,
  outstanding: 35000,
  recentPayments: 25,
};

const FinanceManagerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('collection');

  const tabs = [
    { id: 'collection', label: 'Collection Summary' },
    { id: 'outstanding', label: 'Outstanding Balances' },
    { id: 'revenue', label: 'Revenue Report' },
    { id: 'monthly', label: 'Monthly Statistics' },
    { id: 'ledger', label: 'Customer Ledger' }
  ];

  const goToReport = (id) => {
    // Route to a generic Reports page with a type param
    navigate(`/reports?type=${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 p-2 sm:p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-4 md:mb-6">Finance Manager Dashboard</h1>
      {/* KPIs (still mock for now) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white/80 p-6 rounded-xl shadow flex items-center">
          <FiDollarSign className="text-green-600 text-3xl mr-4" />
          <div>
            <p className="text-gray-500">Total Revenue</p>
                         <p className="text-2xl font-bold">{formatCurrency(mockKPIs.revenue)}</p>
          </div>
        </div>
        <div className="bg-white/80 p-6 rounded-xl shadow flex items-center">
          <FiFileText className="text-blue-600 text-3xl mr-4" />
          <div>
            <p className="text-gray-500">Outstanding Bills</p>
                         <p className="text-2xl font-bold">{formatCurrency(mockKPIs.outstanding)}</p>
          </div>
        </div>
        <div className="bg-white/80 p-6 rounded-xl shadow flex items-center">
          <FiCheckCircle className="text-purple-600 text-3xl mr-4" />
          <div>
            <p className="text-gray-500">Recent Payments</p>
            <p className="text-2xl font-bold">{mockKPIs.recentPayments}</p>
          </div>
        </div>
      </div>
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 md:gap-4 mb-6 md:mb-8">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-blue-700 transition">
          <FiCheckCircle /> Approve Payments
        </button>
        <button onClick={() => navigate('/reports')} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-green-700 transition">
          <FiBarChart2 /> View Reports
        </button>
      </div>
      {/* Reports Navigation (replaces Audit Logs) */}
      <div className="bg-white/80 rounded-xl shadow p-3 md:p-4">
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); goToReport(tab.id); }}
              className={`${activeTab === tab.id ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' : 'bg-white text-gray-700'} px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:shadow transition`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinanceManagerDashboard; 