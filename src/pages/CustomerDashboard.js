// Bills in this dashboard are fetched from the backend endpoint:
//   GET /api/bills/:customerId
// This endpoint queries the 'billing' table in the database using:
//   SELECT bill_id AS "billId", customer_id AS "customerId", meter_number, previous_reading, current_reading, consumption, amount_due AS "amount", due_date, status, created_at, updated_at
//   FROM billing
//   WHERE customer_id = $1
//   ORDER BY due_date ASC

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';
import { formatCurrency } from '../utils/currencyFormatter';
import { FiLogOut, FiRefreshCw, FiChevronDown, FiChevronUp, FiFileText, FiX, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import CustomerCreditDisplay from '../components/CustomerCreditDisplay';

const CustomerDashboard = () => {
  const [bills, setBills] = useState([]);
  const [error, setError] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('GCash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = React.useRef(null);
  const customer = JSON.parse(localStorage.getItem('user'));
  const customerId = customer?.userId;
  const displayName = customer ? `${customer.firstName} ${customer.lastName}` : 'User';
  const avatarUrl = customer?.avatarUrl || 'https://randomuser.me/api/portraits/women/44.jpg'; // fallback avatar
  const displayInitial = customer && customer.firstName ? customer.firstName.charAt(0).toUpperCase() : 'U';
  const [viewMode, setViewMode] = useState('current'); // 'current' or 'past'
  const [expandedBillId, setExpandedBillId] = useState(null);
  const [showProofHelp, setShowProofHelp] = useState(false);

  const [showPaymentConfirmModal, setShowPaymentConfirmModal] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState(null);

  const fetchBills = useCallback(async (showNotif = false) => {
    try {
      if (!customerId) {
        setError('Please log in to view your bills');
        return;
      }
      const response = await apiClient.get(`/bills/${customerId}`);
      const data = response.data;
      if (data.success) {
        const formattedBills = (data.bills || []).map(bill => ({
          ...bill,
          amount: typeof bill.amount === 'string' ? parseFloat(bill.amount) : bill.amount
        }));
        setBills(formattedBills);

      } else {
        setError(data.message || 'No bills found');
      }
    } catch (err) {
      setError(err.message);
    }
  }, [customerId]);

  useEffect(() => {
    fetchBills();
    const interval = setInterval(() => fetchBills(true), 15000);
    return () => clearInterval(interval);
  }, [fetchBills]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const billAmount = typeof selectedBill.amount === 'number' 
      ? selectedBill.amount 
      : parseFloat(selectedBill.amount);
    
    setPendingPaymentData({
      billId: selectedBill.billId || selectedBill.id,
      customerId: customerId,
      amount: billAmount,
      paymentMethod: paymentMethod,
      paymentProof: paymentProof,
      referenceNumber: referenceNumber
    });
    setShowPaymentConfirmModal(true);
  };

  const handleConfirmPaymentSubmit = async () => {
    setIsSubmitting(true);
    try {
      console.log('Submitting payment for bill:', selectedBill);
      const formData = new FormData();
      formData.append('billId', pendingPaymentData.billId);
      formData.append('customerId', pendingPaymentData.customerId);
      formData.append('amount', pendingPaymentData.amount);
      formData.append('paymentMethod', pendingPaymentData.paymentMethod);
      formData.append('referenceNumber', pendingPaymentData.referenceNumber);
      formData.append('paymentProof', pendingPaymentData.paymentProof);
      const response = await apiClient.post('/payment-submissions/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const data = response.data;
      if (!data.success) throw new Error(data.message);
      alert('Payment proof submitted successfully!');
      setSelectedBill(null);
      setPaymentProof(null);
      setReferenceNumber('');
      setPreviewImage(null);
      setShowPaymentConfirmModal(false);
      setPendingPaymentData(null);
    } catch (err) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaymentProof(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper to format date in 'Month Day, Year' format
  const formatLongDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleManualRefresh = () => {
    fetchBills(true);
  };

  return (
    <div className="min-h-screen">
      {/* Top Bar - keeping existing dark theme */}
      <div className="bg-[#232946] flex items-center justify-between px-4 pt-8 pb-4">
        {/* Welcome */}
        <div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">Welcome, <span className="text-blue-400">{displayName}</span>!</h1>
        </div>
        {/* User Bar */}
        <div className="flex items-center space-x-6 relative">
          {/* Notification Bell */}
          <button className="relative focus:outline-none">
            <FiRefreshCw className="text-2xl text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#232946] animate-pulse"></span>
          </button>
          {/* Avatar & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center focus:outline-none"
              onClick={() => setDropdownOpen((open) => !open)}
            >
              <span className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold border-2 border-blue-400 shadow-md hover:shadow-lg transition-all">
                {displayInitial}
              </span>
              <svg className="w-5 h-5 ml-2 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 bg-[#232946] rounded-xl shadow-2xl py-2 z-50 border border-gray-800"
                >
                  <div className="px-4 py-2 flex items-center space-x-3 border-b border-gray-700">
                    <span className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg font-bold border-2 border-blue-400">{displayInitial}</span>
                    <div>
                      <div className="text-white font-semibold text-base">{displayName}</div>
                      <div className="text-xs text-gray-400">Customer</div>
                    </div>
                  </div>
                  <button
                    className="flex items-center w-full px-4 py-2 text-red-400 hover:bg-red-900 transition-all"
                    onClick={() => {
                      localStorage.clear();
                      window.location.href = '/login';
                    }}
                  >
                    <FiLogOut className="mr-3" /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Content - updated to light theme */}
      <div className="bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 min-h-screen">
        {/* Main Content */}
        <div className="max-w-6xl mx-auto py-8">
          {/* Credit Balance Display */}
          {customerId && (
            <div className="mb-6">
              <CustomerCreditDisplay customerId={customerId} />
            </div>
          )}
          
          <div className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden border border-blue-100 mt-6">
            {/* Bills Table Header and Tabs */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between px-6 pt-6 pb-2 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 border-b border-blue-800 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white drop-shadow">Your Water Bills</h2>
              <div className="mt-4 md:mt-0 flex space-x-2 bg-white/20 rounded-full p-1 shadow-inner">
                <button
                  className={`px-4 py-1 rounded-full font-semibold transition-all text-sm focus:outline-none bg-blue-400 text-white shadow`}
                  onClick={handleManualRefresh}
                >
                  Refresh
                </button>
                <button
                  className={`px-4 py-1 rounded-full font-semibold transition-all text-sm focus:outline-none ${viewMode === 'current' ? 'bg-blue-400 text-white shadow' : 'text-blue-100 hover:bg-blue-900/30'}`}
                  onClick={() => setViewMode('current')}
                >
                  Current Bills & Payment
                </button>
                <button
                  className={`px-4 py-1 rounded-full font-semibold transition-all text-sm focus:outline-none ${viewMode === 'past' ? 'bg-blue-400 text-white shadow' : 'text-blue-100 hover:bg-blue-900/30'}`}
                  onClick={() => setViewMode('past')}
                >
                  Paid / Past Bills
                </button>
              </div>
            </div>
            {/* Content */}
            <div className="px-6 pb-6 pt-4">
              {error ? (
                <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6 rounded-xl">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FiX className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              ) : bills.length === 0 ? (
                <div className="text-center py-12">
                  <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-600">No bills found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You don't have any bills to pay at this time.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white/50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date Issued</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/30 divide-y divide-gray-200">
                      {bills
                        .filter(bill => viewMode === 'current' ? bill.status !== 'Paid' : bill.status === 'Paid')
                        .map((bill) => (
                          <React.Fragment key={bill.billId}>
                            <tr className="hover:bg-blue-900/20 transition-all">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 flex items-center gap-2">
                                <button
                                  className="focus:outline-none"
                                  onClick={() => setExpandedBillId(expandedBillId === bill.billId ? null : bill.billId)}
                                  aria-label={expandedBillId === bill.billId ? 'Collapse details' : 'Expand details'}
                                >
                                  {expandedBillId === bill.billId ? (
                                    <FiChevronUp className="text-blue-300" />
                                  ) : (
                                    <FiChevronDown className="text-blue-300" />
                                  )}
                                </button>
                                {formatLongDate(bill.created_at || bill.createdAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900 font-bold">{formatCurrency(bill.amount)}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col space-y-1">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    bill.status === 'Paid' 
                                      ? 'bg-green-200 text-green-900' 
                                      : bill.status === 'Partially Paid'
                                      ? 'bg-yellow-200 text-yellow-900'
                                      : 'bg-red-200 text-red-900'
                                  }`}>
                                    {bill.status}
                                  </span>
                                  {bill.status === 'Paid' && (
                                    <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                                      💳 Paid with Credit
                                    </span>
                                  )}
                                  {bill.status === 'Partially Paid' && (
                                    <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                                      💳 Partial Credit Applied
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-700">
                                {viewMode === 'current' ? (
                                  <button
                                    onClick={() => setSelectedBill(bill)}
                                    className="text-blue-600 hover:text-blue-800 font-bold transition-all"
                                  >
                                    Pay Now
                                  </button>
                                ) : (
                                  <span className="text-gray-400 italic">Paid</span>
                                )}
                              </td>
                            </tr>
                            {expandedBillId === bill.billId && (
                              <tr>
                                <td colSpan={4} className="bg-[#232946] px-8 py-4 text-white rounded-b-xl border-t border-gray-800 animate-fade-in">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <div className="font-semibold text-blue-200">Water Consumed:</div>
                                      <div className="text-lg font-bold text-white">{bill.consumption} m³</div>
                                    </div>
                                    <div>
                                      <div className="font-semibold text-blue-200">Previous Reading:</div>
                                      <div className="text-lg text-white">{bill.previous_reading}</div>
                                    </div>
                                    <div>
                                      <div className="font-semibold text-blue-200">Current Reading:</div>
                                      <div className="text-lg text-white">{bill.current_reading}</div>
                                    </div>
                                    <div>
                                      <div className="font-semibold text-blue-200">Due Date:</div>
                                      <div className="text-lg text-white">{bill.dueDate || (bill.due_date ? (typeof bill.due_date === 'string' ? bill.due_date : new Date(bill.due_date).toLocaleDateString()) : 'N/A')}</div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedBill && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
                <h3 className="text-xl leading-6 font-bold text-blue-900 mb-4">
                  Payment for Bill #{selectedBill?.billId || selectedBill?.id || 'N/A'}
                </h3>
                {/* GCash Info Section */}
                <div className="mb-6 flex flex-col items-center justify-center bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <span className="text-blue-800 font-bold text-lg mb-1">Pay via GCash</span>
                  <span className="text-blue-700 font-semibold text-base mb-2">GCash Number: 09481128717</span>
                  <img
                    src="/gcash main.jpg"
                    alt="GCash QR Code"
                    className="w-48 h-48 object-contain rounded-xl shadow border-2 border-blue-200"
                    style={{ background: '#fff' }}
                  />
                  <span className="text-xs text-gray-500 mt-2">Scan this QR code or use the number above to pay</span>
                </div>
                <form onSubmit={handlePaymentSubmit}>
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                      <label className="block text-sm font-medium text-gray-700">
                        Amount Due
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="text"
                          readOnly
                          value={formatCurrency(selectedBill.amount)}
                          className="block w-full pr-12 sm:text-sm border-gray-300 rounded-lg bg-gray-100 p-2"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                        Payment Method
                      </label>
                      <select
                        id="paymentMethod"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                        disabled
                      >
                        <option value="GCash">GCash</option>
                      </select>
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700">
                        GCash Reference Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="referenceNumber"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter GCash transaction reference number"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Enter the reference number from your GCash transaction receipt
                      </p>
                    </div>

                    <div className="sm:col-span-6">
                      <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                        Payment Proof (Screenshot)
                        <button
                          type="button"
                          className="ml-1 text-blue-500 hover:text-blue-700 focus:outline-none"
                          onClick={() => setShowProofHelp(true)}
                          aria-label="How to upload a file"
                        >
                          <FiChevronDown className="inline text-lg" />
                        </button>
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          {previewImage ? (
                            <div className="mt-2">
                              <img 
                                src={previewImage} 
                                alt="Payment proof preview" 
                                className="mx-auto h-32 object-contain"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewImage(null);
                                  setPaymentProof(null);
                                }}
                                className="mt-2 text-sm text-red-600 hover:text-red-500"
                              >
                                Remove Image
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex text-sm text-gray-600">
                                <label
                                  htmlFor="file-upload"
                                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                                >
                                  <span>Upload a file</span>
                                  <input
                                    id="file-upload"
                                    name="file-upload"
                                    type="file"
                                    className="sr-only"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    required
                                  />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">
                                PNG, JPG up to 5MB
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBill(null);
                        setPaymentProof(null);
                        setPreviewImage(null);
                      }}
                      className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full inline-flex justify-center rounded-lg border border-transparent shadow px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm ${
                        isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <FiCheck className="-ml-1 mr-2 h-5 w-5" />
                          Submit Payment
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal for Payment Proof */}
      <AnimatePresence>
        {showProofHelp && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowProofHelp(false)}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full relative"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold focus:outline-none"
                onClick={() => setShowProofHelp(false)}
                aria-label="Close tutorial"
              >
                ×
              </button>
              <h2 className="text-lg font-bold mb-2 text-blue-700 flex items-center gap-2">
                <FiChevronDown className="inline" /> How to Upload Payment Proof
              </h2>
              <ol className="list-decimal list-inside text-gray-700 space-y-2 text-base">
                <li>Take a screenshot or photo of your payment confirmation from GCash.</li>
                <li>Click <span className="font-semibold text-blue-600">Upload a file</span> or drag and drop your image into the upload area.</li>
                <li>Make sure your file is a PNG or JPG and less than 5MB.</li>
                <li>Once uploaded, you will see a preview of your image.</li>
                <li>Click <span className="font-semibold text-blue-600">Submit Payment</span> to finish.</li>
              </ol>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Confirmation Modal */}
      {showPaymentConfirmModal && pendingPaymentData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Confirm Payment Submission</h3>
              <button
                onClick={() => {
                  setShowPaymentConfirmModal(false);
                  setPendingPaymentData(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Payment Details</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Bill ID:</span> {pendingPaymentData.billId}</div>
                  <div><span className="font-medium">Amount:</span> {formatCurrency(pendingPaymentData.amount)}</div>
                  <div><span className="font-medium">Payment Method:</span> {pendingPaymentData.paymentMethod}</div>
                  <div><span className="font-medium">Reference Number:</span> {pendingPaymentData.referenceNumber}</div>
                  <div><span className="font-medium">Proof File:</span> {pendingPaymentData.paymentProof?.name || 'Uploaded'}</div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Please confirm:</strong> Are you sure you want to submit this payment proof? 
                  This will send your payment verification to the water district for review.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowPaymentConfirmModal(false);
                  setPendingPaymentData(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPaymentSubmit}
                disabled={isSubmitting}
                className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 ${
                  isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FiCheck className="-ml-1 mr-2 h-5 w-5" />
                    Confirm & Submit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
