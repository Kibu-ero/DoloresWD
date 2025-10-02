import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "../api/client";
import { formatCurrency } from '../utils/currencyFormatter';
import Reports from "./Reports";
import { FiHome, FiEdit, FiFileText, FiBarChart2, FiSettings, FiLogOut } from 'react-icons/fi';

console.log("EncoderDashboard loaded, user:", JSON.parse(localStorage.getItem('user')));

// Sidebar links for Encoder
const sidebarLinks = [
  { label: "Dashboard", icon: <FiHome />, tab: "dashboard" },
  { label: "Input Readings", icon: <FiEdit />, tab: "input" },
  { label: "Generate Bills", icon: <FiFileText />, tab: "bills" },
  { label: "Reports", icon: <FiBarChart2 />, tab: "reports" },
  { label: "Settings", icon: <FiSettings />, tab: "settings" },
];

const EncoderDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));
  const displayName = user && user.firstName ? `${user.firstName} ${user.lastName}` : 'User';

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
    
    // Format as YYYY-MM-DD using local time to avoid UTC shifting to the 19th
    const yyyy = dueDate.getFullYear();
    const mm = String(dueDate.getMonth() + 1).padStart(2, '0');
    const dd = String(dueDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [customers, setCustomers] = useState([]);
  const [bills, setBills] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [previousReading, setPreviousReading] = useState('');
  const [currentReading, setCurrentReading] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notification, setNotification] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastBill, setLastBill] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingBill, setPendingBill] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedBarangay, setSelectedBarangay] = useState("All");

  // Compute unique barangays from customers
  const barangays = ["All", ...Array.from(new Set(customers.map(c => c.barangay).filter(Boolean)))];

  // Filter customers by barangay and search
  const filteredCustomers = customers.filter(c => {
    const matchesBrgy = selectedBarangay === "All" || c.barangay === selectedBarangay;
    const search = customerSearch.toLowerCase();
    const name = (c.last_name && c.first_name ? `${c.last_name}, ${c.first_name}` : c.name || "").toLowerCase();
    const meter = (c.meter_number || "").toLowerCase();
    return matchesBrgy && (name.includes(search) || meter.includes(search));
  });

  // Helper to check if a link is active
  const isActive = (tab) => activeTab === tab;

  // Fetch customers and bills on mount
  useEffect(() => {
    fetchCustomers();
    fetchBills();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await apiClient.get("/billing/customers");
      setCustomers(res.data);
    } catch (err) {
      setNotification("Failed to fetch customers");
    }
  };

  const fetchBills = async () => {
    try {
      const res = await apiClient.get("/billing");
      setBills(res.data);
    } catch (err) {
      setNotification("Failed to fetch bills");
    }
  };

  // When customer is selected, fetch their previous reading and last bill
  useEffect(() => {
    if (selectedCustomer) {
      fetchPreviousReading(selectedCustomer);
      fetchLastBill(selectedCustomer);
    } else {
      setPreviousReading('');
      setLastBill(null);
    }
  }, [selectedCustomer]);

  const fetchPreviousReading = async (customerId) => {
    try {
      const res = await apiClient.get(`/billing/customer/${customerId}`);
      if (res.data && res.data.length > 0) {
        // Get the latest bill for this customer
        const latestBill = res.data[0];
        setPreviousReading(latestBill.current_reading);
      } else {
        setPreviousReading('');
      }
    } catch (err) {
      setPreviousReading('');
    }
  };

  const fetchLastBill = async (customerId) => {
    try {
      const res = await apiClient.get(`/billing/customer/${customerId}`);
      if (res.data && res.data.length > 0) {
        setLastBill(res.data[0]);
      } else {
        setLastBill(null);
      }
    } catch (err) {
      setLastBill(null);
    }
  };

  const handleInputSubmit = async (e) => {
    e.preventDefault();
    setNotification("");
    const customer = customers.find(c => c.id === parseInt(selectedCustomer));
    if (!customer) {
      setNotification("Customer not found");
      return;
    }
    setPendingBill({
      customer,
      previousReading,
      currentReading,
      dueDate: dueDate || calculateDueDate()
    });
    setShowConfirmModal(true);
  };

  const handleConfirmGenerate = async () => {
    setLoading(true);
    setShowConfirmModal(false);
    try {
      const { customer, previousReading, currentReading, dueDate } = pendingBill;
      const payload = {
        customer_id: customer.id,
        meter_number: customer.meter_number,
        previous_reading: previousReading || 0,
        current_reading: currentReading,
        due_date: dueDate || calculateDueDate()
      };
      const res = await apiClient.post("/billing", payload);
      setNotification("Bill generated successfully!");
      setCurrentReading("");
      setDueDate("");
      fetchBills();
      if (selectedCustomer) {
        await fetchLastBill(selectedCustomer);
        // Refresh previous reading from the database to get the latest bill
        await fetchPreviousReading(selectedCustomer);
      }
    } catch (err) {
      setNotification("Failed to generate bill: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
      setPendingBill(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            {/* Header only for dashboard */}
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
                <FiEdit className="text-blue-600 text-3xl mr-4" />
                <div>
                  <p className="text-gray-500">Readings Entered</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
              </div>
              <div className="bg-white/80 p-6 rounded-xl shadow flex items-center">
                <FiFileText className="text-green-600 text-3xl mr-4" />
                <div>
                  <p className="text-gray-500">Bills Generated</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
              </div>
              <div className="bg-white/80 p-6 rounded-xl shadow flex items-center">
                <FiBarChart2 className="text-purple-600 text-3xl mr-4" />
                <div>
                  <p className="text-gray-500">Reports</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 rounded-xl shadow p-4 sm:p-8 overflow-x-auto">
              <h3 className="text-xl font-semibold text-blue-800 mb-4">Encoder Overview</h3>
              <p className="text-gray-700">
                Welcome to BillLink Encoder. Use the sidebar to input readings, generate bills, and view reports.
              </p>
            </div>
          </>
        );
      case 'input':
        return (
          <div className="bg-white rounded-lg shadow p-6 max-w-xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Input Monthly Reading</h2>
            <form onSubmit={handleInputSubmit} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 mb-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
                  <select
                    value={selectedBarangay}
                    onChange={e => setSelectedBarangay(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {barangays.map(brgy => (
                      <option key={brgy} value={brgy}>{brgy}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search Customer</label>
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={e => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    placeholder="Type name or meter number..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {showCustomerDropdown && customerSearch && filteredCustomers.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                      {filteredCustomers.map(c => (
                        <div
                          key={c.id}
                          className={`px-4 py-2 cursor-pointer hover:bg-blue-100 ${selectedCustomer == c.id ? 'bg-blue-50' : ''}`}
                          onClick={() => {
                            setSelectedCustomer(c.id);
                            setCustomerSearch(c.last_name && c.first_name ? `${c.last_name}, ${c.first_name}` : c.name);
                            setShowCustomerDropdown(false);
                          }}
                        >
                          <div className="font-medium">{c.last_name && c.first_name ? `${c.last_name}, ${c.first_name}` : c.name}</div>
                          <div className="text-xs text-gray-500">Meter: {c.meter_number} | Brgy: {c.barangay}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {lastBill && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="font-semibold text-blue-900 mb-2">Last Bill Details</div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-blue-900 mb-2">
                    <div className="col-span-2 font-medium text-blue-800">
                      Previous Reading for New Bill: <span className="font-bold">{lastBill.current_reading}</span>
                    </div>
                    <div><span className="font-medium">Last Bill's Previous Reading:</span> {lastBill.previous_reading}</div>
                    <div><span className="font-medium">Last Bill's Current Reading:</span> {lastBill.current_reading}</div>
                    <div><span className="font-medium">Due Date:</span> {lastBill.due_date ? new Date(lastBill.due_date).toLocaleDateString() : '-'}</div>
                    <div><span className="font-medium">Amount Due:</span> {formatCurrency(lastBill.amount_due)}</div>
                    <div><span className="font-medium">Status:</span> {lastBill.status}</div>
                  </div>
                  <div className="text-xs text-blue-700 mt-2">
                    <span className="font-semibold">Note:</span> The previous reading for the new bill is based on the last bill's current reading.
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Previous Reading</label>
                <input
                  type="number"
                  value={previousReading}
                  onChange={e => setPreviousReading(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Reading</label>
                <input
                  type="number"
                  value={currentReading}
                  onChange={e => setCurrentReading(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  min={previousReading || 0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate || calculateDueDate()}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  Due date is automatically set to the 20th of the month (moves to Monday if 20th falls on weekend)
                </p>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
                disabled={loading}
              >
                {loading ? 'Generating Bill...' : 'Generate Bill'}
              </button>
            </form>
          </div>
        );
      case 'bills':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Bills</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bill ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Meter</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Consumption</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount Due</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bills.length > 0 ? (
                    bills.slice(0, 20).map(bill => (
                      <tr key={bill.bill_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bill.bill_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {bill.last_name && bill.first_name
                              ? `${bill.last_name}, ${bill.first_name}`
                              : bill.customer_name}
                          </div>
                          <div className="text-sm text-gray-500">ID: {bill.customer_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bill.meter_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bill.current_reading - bill.previous_reading} units</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(bill.amount_due)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(bill.due_date).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No bills found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'reports':
        return <Reports />;
      case 'settings':
        return <div className="bg-white/80 rounded-xl shadow p-8">Settings Content</div>;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-blue-800 to-blue-600 shadow-lg flex flex-col rounded-r-3xl">
        <div className="p-6 border-b border-blue-700">
          <h1 className="text-2xl font-bold text-white tracking-wide">BillLink Encoder</h1>
        </div>
        <nav className="flex-1 py-4">
          {sidebarLinks.map(link => (
            <button
              key={link.label}
              onClick={() => setActiveTab(link.tab)}
              className={`w-full flex items-center px-6 py-3 my-1 rounded-l-full transition-all
                ${isActive(link.tab)
                  ? "bg-white text-blue-800 shadow font-bold"
                  : "text-blue-100 hover:bg-blue-700 hover:text-white"}
              `}
            >
              <span className="mr-3 text-lg">{link.icon}</span>
              {link.label}
            </button>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center px-6 py-3 text-red-200 hover:bg-red-600 border-t border-blue-700"
        >
          <FiLogOut className="mr-3" /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {renderContent()}
        {/* Premium Confirmation Modal */}
        {showConfirmModal && pendingBill && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2 sm:p-0">
            <div className="bg-white rounded-xl shadow-xl p-4 sm:p-8 max-w-md w-full relative">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Confirm Bill Generation</h3>
              <div className="mb-4 space-y-2 text-gray-800">
                <div><span className="font-semibold">Customer:</span> {pendingBill.customer.last_name && pendingBill.customer.first_name ? `${pendingBill.customer.last_name}, ${pendingBill.customer.first_name}` : pendingBill.customer.name}</div>
                <div><span className="font-semibold">Meter Number:</span> {pendingBill.customer.meter_number}</div>
                <div><span className="font-semibold">Previous Reading:</span> {pendingBill.previousReading}</div>
                <div><span className="font-semibold">Current Reading:</span> {pendingBill.currentReading}</div>
                <div><span className="font-semibold">Due Date:</span> {pendingBill.dueDate ? new Date(pendingBill.dueDate).toLocaleDateString() : '-'}</div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => { setShowConfirmModal(false); setPendingBill(null); }}
                  className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmGenerate}
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default EncoderDashboard; 
