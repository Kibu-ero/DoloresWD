import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/client';
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiDollarSign,
  FiSettings,
  FiActivity,
  FiLogOut,
  FiBarChart2,
  FiCreditCard,
  FiMenu,
  FiEye,
  FiDownload,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import { useReactToPrint } from 'react-to-print';
import AdminFileReview from "./AdminFileReview";
import Reports from "./Reports";
import { formatCurrency } from '../utils/currencyFormatter';
import NotificationModal from '../components/common/NotificationModal';
import CustomerReceipt from '../components/CustomerReceipt';

const sidebarLinks = [
  { label: "Dashboard", icon: <FiHome />, tab: "dashboard" },
  { label: "Receive Payments", icon: <FiCreditCard />, tab: "receive" },
  { label: "Payment Proofs", icon: <FiFileText />, tab: "proofs" },
  { label: "Generate Reports", icon: <FiBarChart2 />, tab: "report" },
  { label: "Update Billing Status", icon: <FiActivity />, tab: "status" },
  { label: "Settings", icon: <FiSettings />, tab: "settings" },
];

const CashierDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [isSenior, setIsSenior] = useState(false);
  const [change, setChange] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptDetails, setReceiptDetails] = useState(null);
  const [showPaymentConfirmModal, setShowPaymentConfirmModal] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [fileActionLoading, setFileActionLoading] = useState(false);
  const [fileNotification, setFileNotification] = useState("");
  const [fileError, setFileError] = useState("");
  const receiptRef = useRef();
  
  // Notification modal state
  const [notificationModal, setNotificationModal] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    showCancel: false,
    onConfirm: null,
    onCancel: null
  });
  const navigate = useNavigate();
  const location = useLocation();
  const [notification, setNotification] = useState("");

  // Get user name from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  const displayName = user && user.firstName ? `${user.firstName} ${user.lastName}` : 'User';

  // Example stats (replace with real data)
  const totalPayments = 42;
  const todaysRevenue = 12450;
  const pendingBills = 8;

  // Helper to check if a link is active
  const isActive = (tab) => activeTab === tab;

  // Helper function to safely get bill amount
  const getBillAmount = (bill) => {
    if (!bill) return 0;
    if (typeof bill.amount === 'number') return bill.amount;
    if (bill.amount) {
      const parsed = parseFloat(bill.amount);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const fetchBills = async (showNotif = false) => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('No token found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get('/cashier-billing/unpaid');
      
      console.log('API Response:', response);
      console.log('Fetched bills from backend:', response.data.bills);

      if (!response.data.bills) {
        console.warn('No bills data in response');
        setBills([]);
        setLoading(false);
        return;
      }

      if (!Array.isArray(response.data.bills)) {
        console.error('Bills data is not an array:', response.data.bills);
        throw new Error('Invalid response format from server: bills is not an array');
      }

      const formattedBills = response.data.bills.map(bill => ({
        ...bill,
        id: bill.id || bill.bill_id,
        amount: getBillAmount(bill)
      }));

      const validBills = formattedBills.filter(bill => 
        bill.id && bill.amount > 0
      );

      const uniqueBills = validBills.filter(
        (bill, index, self) => index === self.findIndex((b) => b.id === bill.id)
      );

      console.log('Normalized and filtered bills:', uniqueBills);
      setBills(uniqueBills);
      if (showNotif) setNotification('Bills refreshed!');
    } catch (error) {
      console.error('Error fetching bills:', error);
      
      let errorMessage = 'Failed to fetch billing data. ';
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
        errorMessage += error.response.data?.message || 
                       `Server returned ${error.response.status} status`;
      } else if (error.request) {
        console.error('No response received:', error.request);
        errorMessage += 'No response received from server. Check your network connection.';
      } else {
        console.error('Error message:', error.message);
        errorMessage += error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
    const interval = setInterval(() => fetchBills(true), 15000);
    return () => clearInterval(interval);
  }, []);

  const openPaymentModal = (bill) => {
    setSelectedBill(bill);
    setAmountPaid('');
    setIsSenior(false);
    setChange(0);
    setShowModal(true);
  };

  const calculateDiscountedAmount = (bill, applySeniorDiscount) => {
    const baseAmount = getBillAmount(bill);
    return applySeniorDiscount ? baseAmount * 0.8 : baseAmount;
  };

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: 'Payment Receipt',
  });

  // File viewing functions
  const fetchPaymentProofs = async () => {
    setFileError("");
    const token = localStorage.getItem('token');
    
    if (!token) {
      setFileError('No token found. Please log in again.');
      return;
    }

    try {
      // Use the same endpoint as admin since we fixed the role middleware
      const response = await apiClient.get('/uploads/all');
      setFiles(response.data);
    } catch (err) {
      console.error('Error fetching payment proofs:', err);
      setFileError("Failed to fetch payment proofs");
    }
  };

  const handleViewFile = (file) => {
    setSelectedFile(file);
    setFileModalOpen(true);
  };

  const handleCloseFileModal = () => {
    setFileModalOpen(false);
    setSelectedFile(null);
  };

  const handleApprovePayment = async () => {
    if (!selectedFile) return;
    setFileActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // First get the bill information for this file
      const billInfo = await apiClient.get(`/uploads/file/${selectedFile.id}/bill`);
      const billId = billInfo.data.bill_id;
      
      await axios.put(`http://localhost:3001/api/cashier-billing/bills/${billId}/status`, 
        { status: "Paid" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFileNotification("Payment approved successfully!");
      setFiles(files.map(f => f.id === selectedFile.id ? { ...f, status: "Paid" } : f));
      handleCloseFileModal();
    } catch (err) {
      console.error('Error approving payment:', err);
      setFileNotification("Failed to approve payment.");
    } finally {
      setFileActionLoading(false);
      setTimeout(() => setFileNotification(""), 3000);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedFile) return;
    setFileActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // First get the bill information for this file
      const billInfo = await apiClient.get(`/uploads/file/${selectedFile.id}/bill`);
      const billId = billInfo.data.bill_id;
      
      await axios.put(`http://localhost:3001/api/cashier-billing/bills/${billId}/status`, 
        { status: "Rejected" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFileNotification("Payment rejected.");
      setFiles(files.map(f => f.id === selectedFile.id ? { ...f, status: "Rejected" } : f));
      handleCloseFileModal();
    } catch (err) {
      console.error('Error rejecting payment:', err);
      setFileNotification("Failed to reject payment.");
    } finally {
      setFileActionLoading(false);
      setTimeout(() => setFileNotification(""), 3000);
    }
  };

  const handlePayment = async () => {
    if (!selectedBill) {
      showNotification('No bill selected.', 'error', 'Error');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      showNotification('No token found. Please log in again.', 'error', 'Error');
      return;
    }

    const numericAmountPaid = parseFloat(amountPaid);
    if (isNaN(numericAmountPaid) || numericAmountPaid <= 0) {
      showNotification('Please enter a valid payment amount.', 'error', 'Error');
      return;
    }

    const discountedAmount = calculateDiscountedAmount(selectedBill, isSenior);
    const calculatedChange = numericAmountPaid - discountedAmount;

    if (calculatedChange < 0) {
      showNotification('Insufficient payment amount. Please enter at least ' + formatCurrency(discountedAmount), 'error', 'Error');
      return;
    }

    // Show confirmation modal first
    const receiptNumber = `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const paymentData = {
      customer_id: selectedBill.customer_id,
      bill_id: selectedBill.id,
      amount_paid: discountedAmount,
      payment_date: new Date().toISOString(),
      payment_method: 'Cash',
      change_given: calculatedChange,
      receipt_number: receiptNumber,
      status: 'Paid',
      penalty_paid: 0
    };

    setPendingPaymentData({
      paymentData,
      change: calculatedChange,
      token
    });
    setShowPaymentConfirmModal(true);
  };

  const handleConfirmPayment = async () => {
    try {
      const { paymentData, change, token } = pendingPaymentData;
      
      console.log('Payment Details:', paymentData);

      const response = await apiClient.post('/cashier-billing/add', paymentData);

      if (response.data.success) {
        showNotification(`Payment recorded successfully! Change: ${formatCurrency(change)}`, 'success', 'Success');
        fetchBills();
        setShowModal(false);
        setShowPaymentConfirmModal(false);
        setPendingPaymentData(null);
        
        // Get the payment ID from the response
        const paymentId = response.data.payment?.id || response.data.payment_id || response.data.id;
        console.log('Payment created with ID:', paymentId);
        console.log('Full response data:', response.data);
        
        // Show receipt modal with details
        setReceiptDetails({
          bill: selectedBill,
          payment: {
            ...paymentData,
            id: paymentId // Use the actual payment ID from the database
          },
          change: change,
          date: new Date().toLocaleString(),
        });
        setShowReceipt(true);
      } else {
        showNotification(`Failed to record payment: ${response.data.message || 'Unknown error'}`, 'error', 'Error');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      
      let errorMessage = 'Failed to record payment: ';
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Unknown error occurred';
      }
      
      showNotification(errorMessage, 'error', 'Error');
    } finally {
      setShowPaymentConfirmModal(false);
      setPendingPaymentData(null);
    }
  };

  // Helper: Show notification modal
  const showNotification = (message, type = 'info', title = '') => {
    setNotificationModal({
      isOpen: true,
      type,
      title,
      message,
      showCancel: false,
      onConfirm: null,
      onCancel: null
    });
  };

  // Close notification modal
  const closeNotificationModal = () => {
    setNotificationModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleManualRefresh = () => {
    setNotification("");
    fetchBills(true);
  };

  // Example content for each tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white/70 rounded-xl shadow p-4 gap-4 md:gap-0">
              <h2 className="text-2xl md:text-3xl font-bold text-blue-900">Welcome, {displayName}</h2>
              <div className="flex items-center space-x-3">
                <span className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold shadow">
                  {displayName.charAt(0)}
                </span>
                <span className="text-blue-900 font-semibold">{displayName}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/80 p-6 rounded-xl shadow flex items-center">
                <FiCreditCard className="text-blue-600 text-3xl mr-4" />
                <div>
                  <p className="text-gray-500">Total Payments</p>
                  <p className="text-2xl font-bold">{totalPayments}</p>
                </div>
              </div>
              <div className="bg-white/80 p-6 rounded-xl shadow flex items-center">
                <svg className="text-green-600 mr-4" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><text x="3" y="21" fontSize="28" fontWeight="bold" fill="currentColor">₱</text></svg>
                <div>
                  <p className="text-gray-500">Today's Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(todaysRevenue)}</p>
                </div>
              </div>
              <div className="bg-white/80 p-6 rounded-xl shadow flex items-center">
                <FiActivity className="text-purple-600 text-3xl mr-4" />
                <div>
                  <p className="text-gray-500">Pending Bills</p>
                  <p className="text-2xl font-bold">{pendingBills}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 rounded-xl shadow p-4 sm:p-8 overflow-x-auto">
              <h3 className="text-xl font-semibold text-blue-800 mb-4">Cashier Overview</h3>
              <p className="text-gray-700">
                Welcome to BillLink Cashier. Use the sidebar to receive payments, generate reports, and update billing status.
              </p>
            </div>
          </>
        );
      case 'receive':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-900">Receive Payments</h2>
              <button 
                className="px-3 py-1 bg-blue-600 text-white rounded flex items-center hover:bg-blue-700"
                onClick={fetchBills}
                disabled={loading}
              >
                <FiBarChart2 className={`mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
            <p className="mb-4 text-gray-600">Handle customer payments and generate receipts here.</p>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {loading ? (
              <div className="flex justify-center items-center py-8 text-gray-600">
                <FiBarChart2 className="animate-spin mr-2" /> Loading billing data...
              </div>
            ) : bills.length === 0 ? (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                No unpaid bills found.
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto w-full">
                {notification && (
                  <div className="bg-green-100 border-l-4 border-green-500 p-2 mb-2 rounded-xl text-green-800 text-center">
                    {notification}
                  </div>
                )}
                <table className="min-w-[700px] w-full bg-white/80 border border-gray-200 rounded-lg text-sm">
                  <thead className="bg-white/50">
                    <tr>
                      <th className="py-2 px-2 sm:px-4 border-b border-gray-200 text-gray-600">Billing ID</th>
                      <th className="py-2 px-2 sm:px-4 border-b border-gray-200 text-gray-600">Customer</th>
                      <th className="py-2 px-2 sm:px-4 border-b border-gray-200 text-gray-600 hidden xs:table-cell">Meter #</th>
                      <th className="py-2 px-2 sm:px-4 border-b border-gray-200 text-gray-600 hidden md:table-cell">Consumption</th>
                      <th className="py-2 px-2 sm:px-4 border-b border-gray-200 text-gray-600">Amount</th>
                      <th className="py-2 px-2 sm:px-4 border-b border-gray-200 text-gray-600 hidden sm:table-cell">Due Date</th>
                      <th className="py-2 px-2 sm:px-4 border-b border-gray-200 text-gray-600">Status</th>
                      <th className="py-2 px-2 sm:px-4 border-b border-gray-200 text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    {bills.map((bill) => {
                      const consumption = bill.current_reading && bill.previous_reading 
                        ? (parseFloat(bill.current_reading) - parseFloat(bill.previous_reading)).toFixed(2)
                        : "N/A";
                        
                      return (
                        <tr key={bill.id} className="hover:bg-[#2d3250]">
                          <td className="py-2 px-2 sm:px-4 border-b border-gray-800">{bill.id}</td>
                          <td className="py-2 px-2 sm:px-4 border-b border-gray-800">
                            <div className="font-medium">{bill.customer_name || 'Unknown'}</div>
                            <div className="text-xs text-gray-400">ID: {bill.customer_id}</div>
                          </td>
                          <td className="py-2 px-2 sm:px-4 border-b border-gray-800 hidden xs:table-cell">{bill.meter_number || 'N/A'}</td>
                          <td className="py-2 px-2 sm:px-4 border-b border-gray-800 hidden md:table-cell">{consumption} units</td>
                          <td className="py-2 px-2 sm:px-4 border-b border-gray-800">{formatCurrency(bill.amount)}</td>
                          <td className="py-2 px-2 sm:px-4 border-b border-gray-800 hidden sm:table-cell">
                            {bill.due_date ? new Date(bill.due_date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-2 px-2 sm:px-4 border-b border-gray-800">
                            <span className={`px-2 py-1 rounded ${
                              bill.status === 'Overdue' 
                                ? 'bg-red-900/50 text-red-200' 
                                : 'bg-yellow-900/50 text-yellow-200'
                            }`}>
                              {bill.status}
                            </span>
                          </td>
                          <td className="py-2 px-2 sm:px-4 border-b border-gray-800">
                            <button
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                              onClick={() => openPaymentModal(bill)}
                            >
                              Pay Now
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      case 'proofs':
        return <AdminFileReview />;
      case 'report':
        return <Reports />;
      case 'status':
        return (
          <div className="bg-white/80 rounded-xl shadow p-8">
            <h3 className="text-xl font-semibold text-blue-800 mb-4">Update Billing Status</h3>
            <p className="text-gray-700">Billing status update functionality coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="bg-white/80 rounded-xl shadow p-8">
            <h3 className="text-xl font-semibold text-blue-800 mb-4">Settings</h3>
            <p className="text-gray-700">Settings functionality coming soon...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`transition-all duration-300 bg-[#232946] flex flex-col items-center py-8 px-2 shadow-2xl rounded-r-3xl relative z-10
          ${sidebarOpen ? "w-56 md:w-64" : "w-20 md:w-24"}
        `}
      >
        {/* Hamburger + Logo Section */}
        <div className="flex flex-col items-center w-full mb-10">
          <button
            className="mb-4 mt-1 self-start text-white focus:outline-none"
            style={{ marginLeft: sidebarOpen ? 8 : 4 }}
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Toggle sidebar"
          >
            <FiMenu className="text-2xl" />
          </button>
          <button
            className="flex flex-col items-center"
            onClick={() => setActiveTab("dashboard")}
            aria-label="Go to Dashboard"
          >
            <span className="bg-blue-500 rounded-2xl flex items-center justify-center mb-2"
              style={{ width: sidebarOpen ? 48 : 40, height: sidebarOpen ? 48 : 40 }}
            >
              <img
                src="logodolores.png"
                alt="Water District Logo"
                className="object-contain"
                style={{ width: sidebarOpen ? 32 : 28, height: sidebarOpen ? 32 : 28 }}
              />
            </span>
            {sidebarOpen && (
              <span className="text-xs text-white font-bold tracking-wide mt-1">Billink</span>
            )}
          </button>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 w-full flex flex-col items-center space-y-2 mt-4">
          {sidebarLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => setActiveTab(link.tab)}
              className={`group flex items-center w-full py-3 px-2 rounded-xl transition-all relative
                ${activeTab === link.tab ? "bg-blue-600 text-white shadow-lg" : "hover:bg-[#2d3250] text-gray-400"}
              `}
              title={link.label}
            >
              <span className="text-2xl mr-0 md:mr-0">{link.icon}</span>
              <span
                className={`ml-4 text-sm font-semibold transition-all duration-200
                  ${sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"}
                  ${sidebarOpen ? "block" : "hidden md:block"}
                `}
              >
                {link.label}
              </span>
              {activeTab === link.tab && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-400 rounded-r-lg"></span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`flex items-center w-full py-3 px-2 text-red-400 hover:bg-red-900 rounded-xl transition-all mt-4
            ${sidebarOpen ? "justify-start" : "justify-center"}
          `}
          title="Logout"
        >
          <FiLogOut className="text-2xl" />
          <span
            className={`ml-4 text-sm font-semibold transition-all duration-200
              ${sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"}
              ${sidebarOpen ? "block" : "hidden md:block"}
            `}
          >
            Logout
          </span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-2 sm:p-4 md:p-8 bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 min-h-screen w-full overflow-x-auto">
        <div className="w-full max-w-full">
          {renderContent()}
        </div>
        {showReceipt && receiptDetails && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50 p-4 receipt-overlay">
            <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto receipt-container">
              {/* Receipt Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10 receipt-modal-header">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Payment Receipt</h2>
                    <p className="text-sm text-gray-600">
                      Payment approved successfully! This receipt is ready for printing.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-500 bg-green-100 px-3 py-1 rounded-full">
                      ✓ Payment Approved
                    </div>
                    <button
                      onClick={() => setShowReceipt(false)}
                      className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
                      title="Close Receipt"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Receipt Content */}
              <div className="p-6">
                {/* Print Instructions Banner */}
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 receipt-modal-instructions">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-blue-800">Ready to Print!</h3>
                      <p className="text-sm text-blue-700">
                        Use the "Print Receipt" button below to print this official receipt. 
                        The receipt is optimized for printing and will look professional on paper.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="receipt-content">
                  <CustomerReceipt
                    customerId={receiptDetails.bill.customer_id}
                    billId={receiptDetails.bill.id}
                    paymentId={receiptDetails.payment?.id}
                    onClose={() => setShowReceipt(false)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {showModal && selectedBill && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2 sm:p-0">
            <div className="bg-white rounded-xl shadow-xl p-4 sm:p-8 max-w-md w-full relative">
              <h2 className="text-xl font-bold mb-4 text-white">Payment Confirmation</h2>
              
              <div className="mb-4 text-gray-300">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Billing ID:</span>
                  <span>{selectedBill.id}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Customer:</span>
                  <span>{selectedBill.customer_name || 'Unknown'} (ID: {selectedBill.customer_id})</span>
                </div>
                {selectedBill.meter_number && (
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Meter Number:</span>
                    <span>{selectedBill.meter_number}</span>
                  </div>
                )}
                {selectedBill.current_reading && selectedBill.previous_reading && (
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Consumption:</span>
                    <span>{(parseFloat(selectedBill.current_reading) - parseFloat(selectedBill.previous_reading)).toFixed(2)} units</span>
                  </div>
                )}
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Amount Due:</span>
                  <span>{formatCurrency(selectedBill.amount)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Due Date:</span>
                  <span>{selectedBill.due_date ? new Date(selectedBill.due_date).toLocaleDateString() : 'N/A'}</span>
                </div>
                
                {isSenior && (
                  <div className="flex justify-between mb-2 text-green-400">
                    <span className="font-medium">With Senior Discount (20%):</span>
                    <span>{formatCurrency(calculateDiscountedAmount(selectedBill, true))}</span>
                  </div>
                )}
              </div>
              
              <label className="block mb-4">
                <span className="block mb-1 font-medium text-gray-300">Amount Paid:</span>
                <input
                  type="number"
                  className="border border-gray-700 bg-[#1a1f2e] text-white p-2 w-full rounded"
                  value={amountPaid}
                  step="0.01"
                  min="0"
                  onChange={(e) => {
                    const paid = parseFloat(e.target.value) || 0;
                    setAmountPaid(paid);
                    const discountedAmount = calculateDiscountedAmount(selectedBill, isSenior);
                    setChange(paid - discountedAmount);
                  }}
                />
              </label>
              
              <label className="flex items-center mb-4 text-gray-300">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={isSenior}
                  onChange={(e) => {
                    setIsSenior(e.target.checked);
                    const paid = parseFloat(amountPaid) || 0;
                    const discountedAmount = calculateDiscountedAmount(selectedBill, e.target.checked);
                    setChange(paid - discountedAmount);
                  }}
                />
                <span>Senior Citizen (20% Discount)</span>
              </label>
              
              <div className="flex justify-between mb-4 font-bold text-gray-300">
                <span>Change:</span>
                <span className={change >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {formatCurrency(change)}
                </span>
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-700"
                  onClick={handlePayment}
                  disabled={change < 0 || isNaN(parseFloat(amountPaid)) || parseFloat(amountPaid) <= 0}
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* File Viewing Modal */}
        {fileModalOpen && selectedFile && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-[#232946] p-6 rounded-lg shadow-lg max-w-2xl w-full border border-gray-800 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Payment Proof for Bill #{selectedFile.bill_id || selectedFile.billId || 'N/A'}</h3>
                <button
                  onClick={handleCloseFileModal}
                  className="text-gray-400 hover:text-white text-2xl font-bold"
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4 flex flex-col items-center">
                <img
                  src={`/api/uploads/payment-proofs/${selectedFile.file_path}`}
                  alt="Payment Proof"
                  className="rounded-lg shadow border-2 border-blue-200 max-h-80 object-contain"
                  style={{ background: '#f8fafc', maxWidth: '100%' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="hidden text-center text-gray-400 mt-4">
                  <FiFileText className="w-16 h-16 mx-auto mb-2" />
                  <p>File preview not available</p>
                  <a
                    href={`/api/uploads/payment-proofs/${selectedFile.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline mt-2 inline-block"
                  >
                    Download to view
                  </a>
                </div>
              </div>
              
              <div className="mb-6 text-gray-300 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="font-semibold">Customer:</span> {selectedFile.first_name} {selectedFile.last_name}</div>
                  <div><span className="font-semibold">Email:</span> {selectedFile.email}</div>
                  <div><span className="font-semibold">Bill ID:</span> {selectedFile.bill_id || selectedFile.billId || 'N/A'}</div>
                  <div><span className="font-semibold">File Name:</span> {selectedFile.file_name}</div>
                  <div><span className="font-semibold">Type:</span> {selectedFile.file_type}</div>
                  <div><span className="font-semibold">Uploaded:</span> {new Date(selectedFile.created_at).toLocaleString()}</div>
                </div>
              </div>
              
              <div className="flex justify-end gap-4">
                <button
                  onClick={handleRejectPayment}
                  disabled={fileActionLoading}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  <FiXCircle className="w-4 h-4 mr-2" />
                  Reject
                </button>
                <button
                  onClick={handleApprovePayment}
                  disabled={fileActionLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  <FiCheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Confirmation Modal */}
        {showPaymentConfirmModal && pendingPaymentData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-xl p-4 sm:p-8 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Confirm Payment</h3>
                <button
                  onClick={() => {
                    setShowPaymentConfirmModal(false);
                    setPendingPaymentData(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Payment Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Customer:</span> {selectedBill?.customer_name || 'Unknown'}</div>
                    <div><span className="font-medium">Bill ID:</span> {selectedBill?.id}</div>
                    <div><span className="font-medium">Amount Due:</span> {formatCurrency(selectedBill?.amount)}</div>
                    <div><span className="font-medium">Amount Paid:</span> {formatCurrency(pendingPaymentData.paymentData.amount_paid)}</div>
                    <div><span className="font-medium">Change:</span> {formatCurrency(pendingPaymentData.change)}</div>
                    <div><span className="font-medium">Receipt #:</span> {pendingPaymentData.paymentData.receipt_number}</div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Please confirm:</strong> Are you sure you want to process this payment? 
                    This action will mark the bill as paid and cannot be undone.
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
                  onClick={handleConfirmPayment}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Modal */}
        <NotificationModal
          isOpen={notificationModal.isOpen}
          onClose={closeNotificationModal}
          type={notificationModal.type}
          title={notificationModal.title}
          message={notificationModal.message}
          showCancel={notificationModal.showCancel}
          onConfirm={notificationModal.onConfirm}
          onCancel={notificationModal.onCancel}
          confirmText="OK"
          cancelText="Cancel"
        />
      </main>
    </div>
  );
};

export default CashierDashboard;
