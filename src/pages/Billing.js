import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { FiSearch, FiCheckCircle, FiArchive } from "react-icons/fi";
import { formatCurrency } from '../utils/currencyFormatter';
import NotificationModal from '../components/common/NotificationModal';

const Billing = () => {
  // Function to calculate due date (20th of current or next month)
  const calculateDueDate = () => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // If today is past the 20th, set due date to 20th of next month
    // If today is before or on the 20th, set due date to 20th of current month
    let dueMonth = currentMonth;
    let dueYear = currentYear;
    
    if (currentDay > 20) {
      // Move to next month
      dueMonth = currentMonth + 1;
      if (dueMonth > 11) {
        dueMonth = 0;
        dueYear = currentYear + 1;
      }
    }
    
    // Create the due date (20th of the month)
    let dueDate = new Date(dueYear, dueMonth, 20);
    
    // Check if the 20th falls on a weekend (Saturday = 6, Sunday = 0)
    const dayOfWeek = dueDate.getDay();
    
    if (dayOfWeek === 0) { // Sunday
      // Move to Monday (add 1 day)
      dueDate.setDate(dueDate.getDate() + 1);
    } else if (dayOfWeek === 6) { // Saturday
      // Move to Monday (add 2 days)
      dueDate.setDate(dueDate.getDate() + 2);
    }
    // Format as YYYY-MM-DD in LOCAL time to avoid UTC shifting to the 19th
    const yyyy = dueDate.getFullYear();
    const mm = String(dueDate.getMonth() + 1).padStart(2, '0');
    const dd = String(dueDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [bills, setBills] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [newBill, setNewBill] = useState({
    customer_id: "",
    meter_number: "",
    previous_reading: "",
    current_reading: "",
    due_date: calculateDueDate(),
    is_senior: false,
    penalty_applied: false,
  });
  const [showArchivedModal, setShowArchivedModal] = useState(false);

  const [showConfirmAddModal, setShowConfirmAddModal] = useState(false);
  const [pendingBillData, setPendingBillData] = useState(null);
  
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

  // Fetch bills and customers
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [billsRes, customersRes] = await Promise.all([
          apiClient.get("/billing"),
          apiClient.get("/billing/customers")
        ]);
        setBills(billsRes.data);
        setCustomers(customersRes.data);
      } catch (error) {
        console.error("Error details:", error);
        setError(`Failed to fetch data: ${error.response ? 
          `Status: ${error.response.status}, Message: ${error.response.data.message || error.response.statusText}` : 
          error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle customer selection
  const handleCustomerSelect = (customerId) => {
    const selectedCustomer = customers.find(c => c.id === parseInt(customerId));
    setNewBill({
      ...newBill,
      customer_id: customerId,
      meter_number: selectedCustomer?.meter_number || ""
    });
  };

  // Reset form when modal is opened
  const handleOpenAddBillModal = () => {
    setNewBill({
      customer_id: "",
      meter_number: "",
      previous_reading: "",
      current_reading: "",
      due_date: calculateDueDate(),
      is_senior: false,
      penalty_applied: false,
    });
    setShowAddBillModal(true);
  };

  // Recalculate due date
  const handleRecalculateDueDate = () => {
    setNewBill({
      ...newBill,
      due_date: calculateDueDate(),
    });
  };

  // Calculate consumption
  const calculateConsumption = () => {
    const prev = parseFloat(newBill.previous_reading) || 0;
    const curr = parseFloat(newBill.current_reading) || 0;
    return Math.max(0, curr - prev);
  };

  // Calculate base amount (assuming ₱50 per cubic meter)
  const calculateBaseAmount = () => {
    const consumption = calculateConsumption();
    return consumption * 50; // ₱50 per cubic meter
  };

  // Calculate senior discount
  const calculateSeniorDiscount = () => {
    if (!newBill.is_senior) return 0;
    
    const consumption = calculateConsumption();
    const baseAmount = calculateBaseAmount();
    
    // Senior discount: 20% off, but only for first 30 cubic meters
    if (consumption <= 30) {
      return baseAmount * 0.2; // 20% discount
    } else {
      // If consumption exceeds 30 cubic meters, discount is forfeited
      return 0;
    }
  };

  // Calculate penalty (10% of base amount)
  const calculatePenalty = () => {
    if (!newBill.penalty_applied) return 0;
    const baseAmount = calculateBaseAmount();
    return baseAmount * 0.1; // 10% penalty
  };

  // Calculate final amount
  const calculateFinalAmount = () => {
    const baseAmount = calculateBaseAmount();
    const seniorDiscount = calculateSeniorDiscount();
    const penalty = calculatePenalty();
    
    return baseAmount - seniorDiscount + penalty;
  };

  // Handle Bill Status Update
  const handleStatusChange = async (billId, status) => {
    showConfirmation(
      `Are you sure you want to mark Bill ${billId} as ${status}?`,
      async () => {
        try {
          await apiClient.put(`/billing/${billId}`, { status });
          setBills(bills.map(bill => 
            bill.bill_id === billId ? { ...bill, status } : bill
          ));
          showNotification(`Bill ${billId} marked as ${status}.`, 'success', 'Success');
        } catch (error) {
          showNotification("Failed to update bill status.", 'error', 'Error');
        }
      },
      'Confirm Status Update'
    );
  };

  // Add New Bill - Show confirmation first
  const handleAddBill = async (e) => {
    e.preventDefault();
    const selectedCustomer = customers.find(c => c.id === parseInt(newBill.customer_id));
    setPendingBillData({
      customer: selectedCustomer,
      billData: { ...newBill }
    });
    setShowConfirmAddModal(true);
  };

  // Confirm and actually add the bill
  const handleConfirmAddBill = async () => {
    try {
      // Calculate amounts
      const consumption = parseFloat(pendingBillData.billData.current_reading) - parseFloat(pendingBillData.billData.previous_reading);
      const baseAmount = consumption * 50; // ₱50 per cubic meter
      const seniorDiscount = pendingBillData.billData.is_senior && consumption <= 30 ? baseAmount * 0.2 : 0;
      const penalty = pendingBillData.billData.penalty_applied ? baseAmount * 0.1 : 0;
      const finalAmount = baseAmount - seniorDiscount + penalty;

      const response = await apiClient.post("/billing", {
        customer_id: pendingBillData.billData.customer_id,
        meter_number: pendingBillData.billData.meter_number,
        previous_reading: pendingBillData.billData.previous_reading,
        current_reading: pendingBillData.billData.current_reading,
        due_date: pendingBillData.billData.due_date,
        consumption: consumption,
        base_amount: baseAmount,
        senior_discount: seniorDiscount,
        penalty_amount: penalty,
        amount_due: finalAmount,
        is_senior: pendingBillData.billData.is_senior,
        penalty_applied: pendingBillData.billData.penalty_applied
      });
      setBills([response.data.bill, ...bills]);
      showNotification("Bill added successfully!", 'success', 'Success');
      setShowAddBillModal(false);
      setShowConfirmAddModal(false);
      setPendingBillData(null);
      setNewBill({
        customer_id: "",
        meter_number: "",
        previous_reading: "",
        current_reading: "",
        due_date: "",
        is_senior: false,
        penalty_applied: false,
      });
    } catch (error) {
      console.error("Add bill error:", error);
      showNotification(`Failed to add bill: ${error.response?.data?.message || error.message}`, 'error', 'Error');
      setShowConfirmAddModal(false);
      setPendingBillData(null);
    }
  };

  // Archive Bill Handler
  const handleArchiveBill = async (billId) => {
    showConfirmation(
      `Are you sure you want to archive Bill ${billId}?`,
      async () => {
        try {
          await apiClient.put(`/billing/${billId}/archive`);
          setBills(bills.map(bill =>
            bill.bill_id === billId ? { ...bill, archived: true } : bill
          ));
          showNotification(`Bill ${billId} archived successfully.`, 'success', 'Success');
        } catch (error) {
          showNotification("Failed to archive bill.", 'error', 'Error');
        }
      },
      'Confirm Archive'
    );
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

  // Helper: Show confirmation modal
  const showConfirmation = (message, onConfirm, title = 'Confirm Action') => {
    setNotificationModal({
      isOpen: true,
      type: 'warning',
      title,
      message,
      showCancel: true,
      onConfirm,
      onCancel: null
    });
  };

  // Close notification modal
  const closeNotificationModal = () => {
    setNotificationModal(prev => ({ ...prev, isOpen: false }));
  };

  // Filter bills by search term (customer name or bill id) and archive status
  const filteredBills = bills.filter(bill => {
    if (bill.archived) return false;
    let customerName = "";
    if (bill.customer_name) {
      // Try to split and reformat if possible
      const parts = bill.customer_name.split(" ");
      if (parts.length >= 2) {
        customerName = `${parts[1]}, ${parts[0]}`.toLowerCase();
      } else {
        customerName = bill.customer_name.toLowerCase();
      }
    } else if (bill.last_name && bill.first_name) {
      customerName = `${bill.last_name}, ${bill.first_name}`.toLowerCase();
    }
    const billId = String(bill.bill_id);
    return (
      customerName.includes(searchTerm.toLowerCase()) ||
      billId.includes(searchTerm)
    );
  });

  // Group bills by customer to prevent repetition
  const groupedBills = filteredBills.reduce((acc, bill) => {
    const customerId = bill.customer_id;
    if (!acc[customerId]) {
      acc[customerId] = {
        customer_id: bill.customer_id,
        customer_name: bill.customer_name,
        first_name: bill.first_name,
        last_name: bill.last_name,
        meter_number: bill.meter_number,
        bills: []
      };
    }
    acc[customerId].bills.push(bill);
    return acc;
  }, {});

  // Convert grouped bills to array and sort by customer name
  const uniqueCustomers = Object.values(groupedBills).map(customer => {
    // Sort bills by creation date (newest first)
    const sortedBills = customer.bills.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Get the latest bill for display
    const latestBill = sortedBills[0];
    
    // Calculate total outstanding amount
    const totalOutstanding = customer.bills
      .filter(bill => bill.status === 'Unpaid')
      .reduce((sum, bill) => sum + (bill.amount_due || 0), 0);
    
    // Get status based on latest bill and outstanding amount
    let status = latestBill.status;
    if (totalOutstanding > 0 && latestBill.status === 'Paid') {
      status = 'Partially Paid';
    }
    
    return {
      customer_id: customer.customer_id,
      customer_name: customer.customer_name,
      first_name: customer.first_name,
      last_name: customer.last_name,
      meter_number: customer.meter_number,
      latest_bill: latestBill,
      total_bills: customer.bills.length,
      total_outstanding: totalOutstanding,
      status: status,
      all_bills: sortedBills
    };
  }).sort((a, b) => {
    // Sort by customer name (last name, first name)
    const nameA = a.last_name && a.first_name ? `${a.last_name}, ${a.first_name}` : a.customer_name || '';
    const nameB = b.last_name && b.first_name ? `${b.last_name}, ${b.first_name}` : b.customer_name || '';
    return nameA.localeCompare(nameB);
  });

  // Archived bills for modal
  const archivedBills = bills.filter(bill => bill.archived);

  const totalPages = Math.ceil(uniqueCustomers.length / itemsPerPage);
  const paginatedCustomers = uniqueCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="bg-red-900 text-red-200 border-l-4 border-red-500 p-4 rounded-lg shadow-lg">
        <p>{error}</p>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-2 sm:p-4 md:p-8">
      {/* Archive Toggle Button */}
      <button
        onClick={() => setShowArchivedModal(true)}
        className="mb-4 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
      >
        Show Archived
      </button>

      {/* Archived Bills Modal */}
      {showArchivedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-2 sm:p-0">
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 w-full max-w-4xl border border-blue-200 relative overflow-x-auto">
            <button
              onClick={() => setShowArchivedModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              title="Close"
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold text-blue-900 mb-6">Archived Bills</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bill ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Meter Number</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Consumption</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount Due</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white/30 divide-y divide-gray-200">
                  {archivedBills.length > 0 ? (
                    archivedBills.map((bill) => (
                      <tr key={bill.bill_id} className="hover:bg-blue-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bill.bill_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {bill.last_name && bill.first_name
                              ? `${bill.last_name}, ${bill.first_name}`
                              : bill.customer_name
                                ? (() => {
                                    const parts = bill.customer_name.split(" ");
                                    return parts.length >= 2 ? `${parts[1]}, ${parts[0]}` : bill.customer_name;
                                  })()
                                : ""}
                          </div>
                          <div className="text-sm text-gray-500">ID: {bill.customer_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{bill.meter_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{Math.round(bill.consumption)} m³</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(bill.amount_due)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(bill.due_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            bill.status === "Paid" 
                              ? "bg-green-100 text-green-800" 
                              : bill.status === "Overdue" 
                              ? "bg-red-100 text-red-800" 
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {bill.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p>No archived bills found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-blue-900">Billing Management</h2>
            <p className="text-gray-600 mt-1">Manage and track customer bills</p>
          </div>
          <button
            onClick={handleOpenAddBillModal}
            className="bg-blue-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add New Bill
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg shadow-md text-sm font-semibold text-center
          ${notification.startsWith("✅") 
            ? "bg-green-100 text-green-700" 
            : "bg-red-100 text-red-700"
        }`}>
          {notification}
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6 flex items-center max-w-md bg-white/80 rounded-xl px-4 py-2 shadow border border-gray-200">
        <FiSearch className="text-gray-400 text-xl mr-2" />
        <input
          type="text"
          placeholder="Search by customer or bill ID..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="bg-transparent outline-none text-gray-700 w-full placeholder-gray-400"
        />
      </div>

      {/* Bills Table */}
      <div className="bg-white/80 rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs md:text-sm">
            <thead className="bg-white/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Meter Number</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Latest Bill</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Outstanding</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Bill Count</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white/30 divide-y divide-gray-200">
              {uniqueCustomers.length > 0 ? (
                paginatedCustomers.map((customer) => (
                  <tr key={customer.customer_id} className="hover:bg-blue-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {customer.last_name && customer.first_name
                          ? `${customer.last_name}, ${customer.first_name}`.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
                          : customer.customer_name
                            ? (() => {
                                const parts = customer.customer_name.split(" ");
                                if (parts.length >= 2) {
                                  return `${parts[1]}, ${parts[0]}`.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                                }
                                return customer.customer_name.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                              })()
                            : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{customer.meter_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                      <div className="font-medium">#{customer.latest_bill.bill_id}</div>
                      <div className="text-xs text-gray-500">
                        {formatCurrency(customer.latest_bill.amount_due)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Due: {new Date(customer.latest_bill.due_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                      {customer.total_outstanding > 0 ? (
                        <span className="text-red-600 font-semibold">
                          {formatCurrency(customer.total_outstanding)}
                        </span>
                      ) : (
                        <span className="text-green-600">₱0.00</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {customer.total_bills} bill{customer.total_bills !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        customer.status === "Paid" 
                          ? "bg-green-100 text-green-800" 
                          : customer.status === "Overdue" 
                          ? "bg-red-100 text-red-800" 
                          : customer.status === "Partially Paid"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleArchiveBill(customer.latest_bill.bill_id)}
                        className="bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-700 transition-colors duration-200 text-sm font-medium"
                        title="Archive Latest Bill"
                      >
                        <FiArchive />
                      </button>
                      <button
                        onClick={() => setShowAddBillModal(true)}
                        className="ml-2 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
                        title="Add New Bill"
                      >
                        <FiCheckCircle />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>No customers found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Add Bill Modal */}
      {showAddBillModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl p-4 sm:p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Add New Bill</h3>
              <button
                onClick={() => setShowAddBillModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddBill} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <select
                  value={newBill.customer_id}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - Meter: {customer.meter_number}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meter Number</label>
                <input
                  type="text"
                  value={newBill.meter_number}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Previous Reading</label>
                <input
                  type="number"
                  value={newBill.previous_reading}
                  onChange={(e) => setNewBill({ ...newBill, previous_reading: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Reading</label>
                <input
                  type="number"
                  value={newBill.current_reading}
                  onChange={(e) => setNewBill({ ...newBill, current_reading: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  step="0.01"
                  min={newBill.previous_reading || "0"}
                />
              </div>

              {/* Bill Summary Section */}
              {(newBill.previous_reading && newBill.current_reading) && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-semibold text-gray-800 mb-3">Bill Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Consumption:</span>
                      <span className="font-medium">{calculateConsumption()} m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Base Amount:</span>
                      <span className="font-medium">{formatCurrency(calculateBaseAmount())}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Senior Citizen Discount */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="senior-discount"
                  checked={newBill.is_senior}
                  onChange={(e) => setNewBill({ ...newBill, is_senior: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="senior-discount" className="text-sm font-medium text-gray-700">
                  Senior Citizen Discount (20% off, max 30 m³)
                </label>
              </div>
              {newBill.is_senior && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-800">
                    <div className="flex justify-between mb-1">
                      <span>Senior Discount:</span>
                      <span className="font-medium">{formatCurrency(calculateSeniorDiscount())}</span>
                    </div>
                    {calculateConsumption() > 30 && (
                      <div className="text-red-600 text-xs">
                        ⚠️ Discount forfeited: Consumption exceeds 30 m³ limit
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Penalty */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="penalty"
                  checked={newBill.penalty_applied}
                  onChange={(e) => setNewBill({ ...newBill, penalty_applied: e.target.checked })}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="penalty" className="text-sm font-medium text-gray-700">
                  Apply Penalty (10% of base amount)
                </label>
              </div>
              {newBill.penalty_applied && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="text-sm text-red-800">
                    <div className="flex justify-between">
                      <span>Penalty Amount:</span>
                      <span className="font-medium">{formatCurrency(calculatePenalty())}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Final Amount Display */}
              {(newBill.previous_reading && newBill.current_reading) && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-lg font-bold text-green-800">
                    <div className="flex justify-between">
                      <span>Final Amount Due:</span>
                      <span>{formatCurrency(calculateFinalAmount())}</span>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <button
                    type="button"
                    onClick={handleRecalculateDueDate}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Recalculate
                  </button>
                </div>
                <input
                  type="date"
                  value={newBill.due_date}
                  onChange={(e) => setNewBill({ ...newBill, due_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  Due date is automatically set to the 20th of the month (moves to Monday if 20th falls on weekend)
                </p>
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddBillModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Save Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Adding Bill */}
      {showConfirmAddModal && pendingBillData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl p-4 sm:p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Confirm Bill Details</h3>
              <button
                onClick={() => {
                  setShowConfirmAddModal(false);
                  setPendingBillData(null);
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
                <h4 className="font-semibold text-blue-900 mb-2">Bill Information</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Customer:</span> {pendingBillData.customer?.name || 'Unknown'}</div>
                  <div><span className="font-medium">Meter Number:</span> {pendingBillData.billData.meter_number}</div>
                  <div><span className="font-medium">Previous Reading:</span> {pendingBillData.billData.previous_reading}</div>
                  <div><span className="font-medium">Current Reading:</span> {pendingBillData.billData.current_reading}</div>
                  <div><span className="font-medium">Consumption:</span> {parseFloat(pendingBillData.billData.current_reading) - parseFloat(pendingBillData.billData.previous_reading)} m³</div>
                  <div><span className="font-medium">Due Date:</span> {new Date(pendingBillData.billData.due_date).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Amount Breakdown */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Amount Breakdown</h4>
                <div className="space-y-2 text-sm">
                  {(() => {
                    const consumption = parseFloat(pendingBillData.billData.current_reading) - parseFloat(pendingBillData.billData.previous_reading);
                    const baseAmount = consumption * 50;
                    const seniorDiscount = pendingBillData.billData.is_senior && consumption <= 30 ? baseAmount * 0.2 : 0;
                    const penalty = pendingBillData.billData.penalty_applied ? baseAmount * 0.1 : 0;
                    const finalAmount = baseAmount - seniorDiscount + penalty;
                    
                    return (
                      <>
                        <div className="flex justify-between">
                          <span>Base Amount:</span>
                          <span>{formatCurrency(baseAmount)}</span>
                        </div>
                        {pendingBillData.billData.is_senior && (
                          <div className="flex justify-between text-blue-600">
                            <span>Senior Discount:</span>
                            <span>-{formatCurrency(seniorDiscount)}</span>
                          </div>
                        )}
                        {pendingBillData.billData.penalty_applied && (
                          <div className="flex justify-between text-red-600">
                            <span>Penalty:</span>
                            <span>+{formatCurrency(penalty)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-green-800 border-t pt-2">
                          <span>Final Amount:</span>
                          <span>{formatCurrency(finalAmount)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Please confirm:</strong> Are you sure you want to create this bill with the above details? 
                  This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowConfirmAddModal(false);
                  setPendingBillData(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAddBill}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Confirm & Create Bill
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
    </div>
  );
};

export default Billing;
