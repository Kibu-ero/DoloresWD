import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiAlertTriangle, FiCheckCircle, FiClock } from 'react-icons/fi';
import apiClient from '../api';

const PenaltyManager = () => {
  const [overdueBills, setOverdueBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [lastProcessed, setLastProcessed] = useState(null);

  // Fetch overdue bills
  const fetchOverdueBills = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/penalties/overdue');
      if (response.data.success) {
        setOverdueBills(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching overdue bills:', error);
      setMessage('Error fetching overdue bills');
    } finally {
      setLoading(false);
    }
  };

  // Process penalties
  const processPenalties = async () => {
    try {
      setProcessing(true);
      const response = await apiClient.get('/penalties/process');
      if (response.data.success) {
        setMessage(response.data.message);
        setLastProcessed(new Date().toLocaleString());
        await fetchOverdueBills(); // Refresh the list
      }
    } catch (error) {
      console.error('Error processing penalties:', error);
      setMessage('Error processing penalties');
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchOverdueBills();
  }, []);

  const getPenaltyColor = (daysOverdue) => {
    if (daysOverdue <= 7) return 'text-yellow-600 bg-yellow-50';
    if (daysOverdue <= 30) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Overdue': return 'text-red-600 bg-red-50';
      case 'Unpaid': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Penalty Management</h2>
          <p className="text-gray-600">Manage automatic penalty calculations for overdue bills</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchOverdueBills}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={processPenalties}
            disabled={processing}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <FiCheckCircle className={`w-4 h-4 ${processing ? 'animate-spin' : ''}`} />
            {processing ? 'Processing...' : 'Process Penalties'}
          </motion.button>
        </div>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800"
        >
          {message}
        </motion.div>
      )}

      {lastProcessed && (
        <div className="mb-4 text-sm text-gray-600">
          Last processed: {lastProcessed}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FiClock className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-yellow-600 font-medium">Total Overdue</p>
              <p className="text-2xl font-bold text-yellow-800">{overdueBills.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-orange-600 font-medium">With Penalties</p>
              <p className="text-2xl font-bold text-orange-800">
                {overdueBills.filter(bill => bill.penalty > 0).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm text-red-600 font-medium">Total Penalty Amount</p>
              <p className="text-2xl font-bold text-red-800">
                ₱{Number(overdueBills.reduce((sum, bill) => sum + (parseFloat(bill.penalty) || 0), 0)).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Bills Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Days Overdue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Base Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Penalty
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  Loading overdue bills...
                </td>
              </tr>
            ) : overdueBills.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No overdue bills found
                </td>
              </tr>
            ) : (
              overdueBills.map((bill) => (
                <motion.tr
                  key={bill.bill_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {bill.customer_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Meter: {bill.meter_number}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(bill.due_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPenaltyColor(bill.days_overdue)}`}>
                      {bill.days_overdue} days
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₱{Number(bill.amount_due).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${Number(bill.penalty) > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        ₱{Number(bill.penalty || 0).toFixed(2)}
                      </span>
                      {bill.should_update_penalty && (
                        <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                          Update needed
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₱{Number(bill.total_amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bill.status)}`}>
                      {bill.status}
                    </span>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Penalty Rules Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Penalty Rules</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 10% penalty applied after 1 day overdue</li>
          <li>• Additional 2% for every 30 days overdue (compound)</li>
          <li>• Maximum penalty capped at 50% of base amount</li>
          <li>• Bills automatically marked as "Overdue" when past due date</li>
        </ul>
      </div>
    </div>
  );
};

export default PenaltyManager;
