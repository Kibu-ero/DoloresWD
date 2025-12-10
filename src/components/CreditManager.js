import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiMinus, FiEdit, FiCheckCircle } from 'react-icons/fi';
import apiClient from '../api/client';
import { formatNumber } from '../utils/currencyFormatter';

const CreditManager = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerTransactions, setCustomerTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showAddCreditModal, setShowAddCreditModal] = useState(false);
  const [showDeductCreditModal, setShowDeductCreditModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [creditForm, setCreditForm] = useState({
    amount: '',
    description: '',
    reason: ''
  });

  // Fetch customers with credit balances
  const fetchCustomersWithCredits = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/credits/customers');
      if (response.data.success) {
        setCustomers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setMessage('Error fetching customers with credits');
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer credit details
  const fetchCustomerCredits = async (customerId) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/credits/customer/${customerId}`);
      if (response.data.success) {
        setSelectedCustomer(response.data.data.customer);
        setCustomerTransactions(response.data.data.transactions);
      }
    } catch (error) {
      console.error('Error fetching customer credits:', error);
      setMessage('Error fetching customer credit details');
    } finally {
      setLoading(false);
    }
  };

  // Add credit
  const handleAddCredit = async (e) => {
    e.preventDefault();
    try {
      setMessage('');
      const response = await apiClient.post('/credits/add', {
        customerId: selectedCustomer.id,
        amount: parseFloat(creditForm.amount),
        description: creditForm.description,
        referenceType: 'manual_credit'
      });

      if (response.data.success) {
        setMessage(response.data.message || 'Credit added successfully');
        setShowAddCreditModal(false);
        setCreditForm({ amount: '', description: '', reason: '' });
        await fetchCustomerCredits(selectedCustomer.id);
        await fetchCustomersWithCredits();
      } else {
        setMessage(response.data.message || 'Error adding credit');
      }
    } catch (error) {
      console.error('Error adding credit:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Error adding credit';
      setMessage(errorMessage);
    }
  };

  // Deduct credit
  const handleDeductCredit = async (e) => {
    e.preventDefault();
    try {
      setMessage('');
      const response = await apiClient.post('/credits/deduct', {
        customerId: selectedCustomer.id,
        amount: parseFloat(creditForm.amount),
        description: creditForm.description,
        referenceType: 'manual_deduction'
      });

      if (response.data.success) {
        setMessage(response.data.message || 'Credit deducted successfully');
        setShowDeductCreditModal(false);
        setCreditForm({ amount: '', description: '', reason: '' });
        await fetchCustomerCredits(selectedCustomer.id);
        await fetchCustomersWithCredits();
      } else {
        setMessage(response.data.message || 'Error deducting credit');
      }
    } catch (error) {
      console.error('Error deducting credit:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Error deducting credit';
      setMessage(errorMessage);
    }
  };

  // Adjust credit balance
  const handleAdjustCredit = async (e) => {
    e.preventDefault();
    try {
      setMessage('');
      const response = await apiClient.post('/credits/adjust', {
        customerId: selectedCustomer.id,
        newBalance: parseFloat(creditForm.amount),
        reason: creditForm.reason
      });

      if (response.data.success) {
        setMessage(response.data.message || 'Credit balance adjusted successfully');
        setShowAdjustModal(false);
        setCreditForm({ amount: '', description: '', reason: '' });
        await fetchCustomerCredits(selectedCustomer.id);
        await fetchCustomersWithCredits();
      } else {
        setMessage(response.data.message || 'Error adjusting credit balance');
      }
    } catch (error) {
      console.error('Error adjusting credit:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Error adjusting credit balance';
      setMessage(errorMessage);
    }
  };

  useEffect(() => {
    fetchCustomersWithCredits();
  }, []);


  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Credit Management</h2>
          <p className="text-gray-600">Manage customer credit balances and transactions</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={fetchCustomersWithCredits}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiCheckCircle className="w-4 h-4" />
          Refresh
        </motion.button>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 p-4 border rounded-lg ${
            message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-green-50 border-green-200 text-green-800'
          }`}
        >
          {message}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customers List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Customers with Credits</h3>
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center text-gray-500">Loading customers...</div>
            ) : customers.length === 0 ? (
              <div className="text-center text-gray-500">No customers with credits found</div>
            ) : (
              customers.map((customer) => (
                <motion.div
                  key={customer.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => fetchCustomerCredits(customer.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all mb-2 ${
                    selectedCustomer?.id === customer.id 
                      ? 'bg-blue-100 border-2 border-blue-300' 
                      : 'bg-white border border-gray-200 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-800">{customer.customer_name}</div>
                      <div className="text-sm text-gray-500">Meter: {customer.meter_number}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        {formatNumber(customer.credit_balance)}
                      </div>
                      {customer.credit_limit > 0 && (
                        <div className="text-xs text-gray-500">
                          Limit: {formatNumber(customer.credit_limit)}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Selected Customer Details */}
        <div>
          {selectedCustomer ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {selectedCustomer.customer_name}
                </h3>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddCreditModal(true)}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    <FiPlus className="w-3 h-3" />
                    Add
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowDeductCreditModal(true)}
                    className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    <FiMinus className="w-3 h-3" />
                    Deduct
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAdjustModal(true)}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    <FiEdit className="w-3 h-3" />
                    Adjust
                  </motion.button>
                </div>
              </div>

              {/* Current Balance */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Current Balance</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatNumber(selectedCustomer.credit_balance)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Recent Transactions</h4>
                <div className="max-h-64 overflow-y-auto">
                  {customerTransactions.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">No transactions found</div>
                  ) : (
                    customerTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded mb-2">
                        <div>
                          <div className="font-medium text-gray-800">
                            {transaction.description || `${transaction.transaction_type} transaction`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.transaction_type === 'credit' ? '+' : '-'}{formatNumber(transaction.amount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Balance: {formatNumber(transaction.new_balance)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Select a customer to view credit details
            </div>
          )}
        </div>
      </div>

      {/* Add Credit Modal */}
      {showAddCreditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 w-96"
          >
            <h3 className="text-lg font-semibold mb-4">Add Credit</h3>
            <form onSubmit={handleAddCredit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={creditForm.amount}
                  onChange={(e) => setCreditForm({ ...creditForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={creditForm.description}
                  onChange={(e) => setCreditForm({ ...creditForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddCreditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add Credit
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Deduct Credit Modal */}
      {showDeductCreditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 w-96"
          >
            <h3 className="text-lg font-semibold mb-4">Deduct Credit</h3>
            <form onSubmit={handleDeductCredit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedCustomer?.credit_balance || 0}
                  value={creditForm.amount}
                  onChange={(e) => setCreditForm({ ...creditForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <div className="text-sm text-gray-500 mt-1">
                  Available: {formatNumber(selectedCustomer?.credit_balance || 0)}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={creditForm.description}
                  onChange={(e) => setCreditForm({ ...creditForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeductCreditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Deduct Credit
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Adjust Credit Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 w-96"
          >
            <h3 className="text-lg font-semibold mb-4">Adjust Credit Balance</h3>
            <form onSubmit={handleAdjustCredit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">New Balance</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={creditForm.amount}
                  onChange={(e) => setCreditForm({ ...creditForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <div className="text-sm text-gray-500 mt-1">
                  Current: {formatNumber(selectedCustomer?.credit_balance || 0)}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <textarea
                  value={creditForm.reason}
                  onChange={(e) => setCreditForm({ ...creditForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Reason for adjustment..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Adjust Balance
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CreditManager;


















