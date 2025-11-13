import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign, FiCreditCard, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
import apiClient from '../api';
import { formatCurrency } from '../utils/currencyFormatter';

const CustomerCreditDisplay = ({ customerId }) => {
  const [creditInfo, setCreditInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCreditInfo = useCallback(async () => {
    if (!customerId) return;
    
    try {
      setLoading(true);
      const response = await apiClient.get(`/credits/customer/${customerId}`);
      
      if (response.data.success) {
        setCreditInfo(response.data.data);
        setError('');
      } else {
        setError('Failed to load credit information');
      }
    } catch (err) {
      console.error('Error fetching credit info:', err);
      setError('Error loading credit information');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCreditInfo();
  }, [fetchCreditInfo]);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
        <div className="h-6 bg-gray-300 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center text-red-700">
          <FiAlertCircle className="w-4 h-4 mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (!creditInfo || !creditInfo.customer) {
    return null;
  }

  const { customer, transactions } = creditInfo;
  const creditBalance = parseFloat(customer.credit_balance) || 0;
  const creditLimit = parseFloat(customer.credit_limit) || 0;

  // Get recent transactions (last 3)
  const recentTransactions = transactions?.slice(0, 3) || [];

  const getCreditStatusColor = () => {
    if (creditBalance > 0) return 'text-green-600 bg-green-50 border-green-200';
    if (creditBalance === 0) return 'text-gray-600 bg-gray-50 border-gray-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getCreditStatusIcon = () => {
    if (creditBalance > 0) return <FiCreditCard className="w-5 h-5" />;
    return <FiDollarSign className="w-5 h-5" />;
  };

  return (
    <div className="space-y-4">
      {/* Credit Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border rounded-lg p-4 ${getCreditStatusColor()}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getCreditStatusIcon()}
            <div>
              <h3 className="font-semibold text-lg">Credit Balance</h3>
              <p className="text-sm opacity-75">Available for bill payments</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {formatCurrency(creditBalance)}
            </div>
            {creditLimit > 0 && (
              <div className="text-xs opacity-75">
                Limit: {formatCurrency(creditLimit)}
              </div>
            )}
          </div>
        </div>
        
        {/* Credit Usage Bar */}
        {creditLimit > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span>Credit Usage</span>
              <span>{Math.round((creditBalance / creditLimit) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((creditBalance / creditLimit) * 100, 100)}%` }}
                transition={{ duration: 0.5 }}
                className="bg-blue-500 h-2 rounded-full"
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-gray-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2 mb-3">
            <FiTrendingUp className="w-4 h-4 text-gray-600" />
            <h4 className="font-medium text-gray-800">Recent Credit Activity</h4>
          </div>
          
          <div className="space-y-2">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    {transaction.description || `${transaction.transaction_type} transaction`}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className={`text-sm font-semibold ${
                  transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.transaction_type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Credit Tips */}
      {creditBalance > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-start space-x-2">
            <FiCreditCard className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <h5 className="font-medium text-blue-800 text-sm">Credit Available</h5>
              <p className="text-xs text-blue-700 mt-1">
                Your credit will be automatically applied to new bills. 
                You have {formatCurrency(creditBalance)} available for future payments.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {creditBalance === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-50 border border-gray-200 rounded-lg p-4"
        >
          <div className="flex items-start space-x-2">
            <FiDollarSign className="w-4 h-4 text-gray-600 mt-0.5" />
            <div>
              <h5 className="font-medium text-gray-800 text-sm">No Credit Balance</h5>
              <p className="text-xs text-gray-600 mt-1">
                You don't have any credit balance. Contact the office to add credit to your account.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CustomerCreditDisplay;


















