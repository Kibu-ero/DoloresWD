import React from 'react';
import { FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Reports from './Reports';

const FinanceManagerDashboard = () => {
  const navigate = useNavigate();
  
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-blue-50 to-brand-100 p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-700">Analytics Dashboard</h1>
          <p className="text-sm text-gray-600">Comprehensive reporting for FINANCE OFFICER</p>
        </div>
        <button onClick={logout} className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-lg hover:from-red-600 hover:to-red-800 flex items-center gap-2 transition-all">
          <FiLogOut /> Logout
        </button>
      </div>

      {/* Use the same Reports component as Admin/Cashier */}
      <Reports />
    </div>
  );
};

export default FinanceManagerDashboard;
