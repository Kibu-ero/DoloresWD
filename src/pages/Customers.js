import { useState, useEffect } from "react";
import { FiSearch, FiUser, FiUserCheck, FiUserX, FiPlus, FiLoader, FiX, FiEdit2, FiPhone, FiMail, FiHome, FiCalendar, FiClock } from "react-icons/fi";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    street: "",
    barangay: "",
    city: "",
    province: "",
    birthdate: "",
    meterNumber: "",
    email: "",
    phoneNumber: "+63",
    password: "",
    status: "Active"
  });
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showAddConfirmModal, setShowAddConfirmModal] = useState(false);
  const [showUpdateConfirmModal, setShowUpdateConfirmModal] = useState(false);
  const [pendingCustomerData, setPendingCustomerData] = useState(null);

  // Fetch customers from backend API
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:3001/api/customers");
      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }
      const data = await response.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCustomerStatus = async (customerId, newStatus) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`http://localhost:3001/api/customers/${customerId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update customer status");
      }

      const updatedCustomer = await response.json();
      setCustomers(customers.map(customer => 
        customer.id === updatedCustomer.id ? updatedCustomer : customer
      ));
    } catch (error) {
      console.error("Error updating customer status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setPendingCustomerData({
      type: 'add',
      data: { ...newCustomer }
    });
    setShowAddConfirmModal(true);
  };

  const handleConfirmAddCustomer = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:3001/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: pendingCustomerData.data.firstName,
          last_name: pendingCustomerData.data.lastName,
          street: pendingCustomerData.data.street,
          barangay: pendingCustomerData.data.barangay,
          city: pendingCustomerData.data.city,
          province: pendingCustomerData.data.province,
          birthdate: pendingCustomerData.data.birthdate,
          meter_number: pendingCustomerData.data.meterNumber,
          email: pendingCustomerData.data.email,
          phone_number: pendingCustomerData.data.phoneNumber,
          password: pendingCustomerData.data.password,
          status: pendingCustomerData.data.status
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add customer");
      }

      const addedCustomer = await response.json();
      setCustomers([...customers, addedCustomer]);
      setShowAddModal(false);
      setShowAddConfirmModal(false);
      setPendingCustomerData(null);
      resetNewCustomerForm();
    } catch (error) {
      console.error("Error adding customer:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    setPendingCustomerData({
      type: 'update',
      data: { ...editingCustomer }
    });
    setShowUpdateConfirmModal(true);
  };

  const handleConfirmUpdateCustomer = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:3001/api/customers/${pendingCustomerData.data.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: pendingCustomerData.data.firstName,
          last_name: pendingCustomerData.data.lastName,
          street: pendingCustomerData.data.street,
          barangay: pendingCustomerData.data.barangay,
          city: pendingCustomerData.data.city,
          province: pendingCustomerData.data.province,
          birthdate: pendingCustomerData.data.birthdate,
          meter_number: pendingCustomerData.data.meterNumber,
          email: pendingCustomerData.data.email,
          phone_number: pendingCustomerData.data.phoneNumber,
          status: pendingCustomerData.data.status
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update customer");
      }

      const updatedCustomer = await response.json();
      setCustomers(customers.map(customer => 
        customer.id === updatedCustomer.id ? updatedCustomer : customer
      ));
      setEditingCustomer(null);
      setShowUpdateConfirmModal(false);
      setPendingCustomerData(null);
    } catch (error) {
      console.error("Error updating customer:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetNewCustomerForm = () => {
    setNewCustomer({
      firstName: "",
      lastName: "",
      street: "",
      barangay: "",
      city: "",
      province: "",
      birthdate: "",
      meterNumber: "",
      email: "",
      phoneNumber: "",
      password: "",
      status: "Active"
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingCustomer) {
      setEditingCustomer(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setNewCustomer(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleEditClick = (customer) => {
    setEditingCustomer({
      id: customer.id,
      firstName: customer.first_name,
      lastName: customer.last_name,
      street: customer.street,
      barangay: customer.barangay,
      city: customer.city,
      province: customer.province,
      birthdate: customer.birthdate,
      meterNumber: customer.meter_number,
      email: customer.email,
      phoneNumber: customer.phone_number,
      status: customer.status
    });
  };

  const handleViewHistory = async (customer) => {
    setShowHistoryModal(true);
    setHistoryCustomer(customer);
    setHistoryLoading(true);
    setHistoryError("");
    setPaymentHistory([]);
    try {
      const response = await fetch(`http://localhost:3001/api/cashier-billing/customer/${customer.id}`);
      if (!response.ok) throw new Error("Failed to fetch payment history");
      const data = await response.json();
      setPaymentHistory(Array.isArray(data.payments) ? data.payments : []);
    } catch (err) {
      setHistoryError(err.message || "Unknown error");
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    // Handle name - check both possible formats
    let customerName = '';
    if (customer.last_name && customer.first_name) {
      customerName = `${customer.last_name}, ${customer.first_name}`.toLowerCase();
    } else if (customer.name) {
      const parts = customer.name.split(' ');
      customerName = parts.length >= 2 ? `${parts[1]}, ${parts[0]}`.toLowerCase() : customer.name.toLowerCase();
    }
    
    // Handle other fields with null checks
    const customerBarangay = (customer.barangay || '').toLowerCase();
    const customerStatus = customer.status || 'Active';
    
    const matchesSearch = customerName.includes(searchTerm.toLowerCase());
    const matchesBarangay = selectedBarangay === "All" || 
                           customerBarangay === selectedBarangay.toLowerCase();
    const matchesStatus = statusFilter === "All" || 
                         (statusFilter === "Active" ? 
                          customerStatus !== "Inactive" : 
                          customerStatus === "Inactive");
    
    return matchesSearch && matchesBarangay && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBarangay, statusFilter]);

  const barangays = ["All", ...new Set(customers.map(customer => customer.barangay).filter(Boolean))];

  return (
    <div className="w-full max-w-7xl mx-auto p-2 sm:p-4 md:p-8">
      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-4 sm:p-8">
            <div className="flex justify-between items-center border-b border-gray-200 p-4">
              <h3 className="text-xl font-semibold text-gray-900">Add New Customer</h3>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  resetNewCustomerForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name*</label>
                  <input
                    type="text"
                    name="firstName"
                    value={newCustomer.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name*</label>
                  <input
                    type="text"
                    name="lastName"
                    value={newCustomer.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street*</label>
                  <input
                    type="text"
                    name="street"
                    value={newCustomer.street}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barangay*</label>
                  <input
                    type="text"
                    name="barangay"
                    value={newCustomer.barangay}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City*</label>
                  <input
                    type="text"
                    name="city"
                    value={newCustomer.city}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Province*</label>
                  <input
                    type="text"
                    name="province"
                    value={newCustomer.province}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birthdate*</label>
                  <input
                    type="date"
                    name="birthdate"
                    value={newCustomer.birthdate}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meter Number</label>
                  <input
                    type="text"
                    name="meterNumber"
                    value={newCustomer.meterNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                  <input
                    type="email"
                    name="email"
                    value={newCustomer.email}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">+63</span>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={newCustomer.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="9123456789"
                      required
                      className="w-full p-2 pl-12 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password*</label>
                  <input
                    type="password"
                    name="password"
                    value={newCustomer.password}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={newCustomer.status}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetNewCustomerForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <FiLoader className="animate-spin inline" /> : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-4 sm:p-8">
            <div className="flex justify-between items-center border-b border-gray-200 p-4">
              <h3 className="text-xl font-semibold text-gray-900">Edit Customer</h3>
              <button 
                onClick={() => setEditingCustomer(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdateCustomer} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name*</label>
                  <input
                    type="text"
                    name="firstName"
                    value={editingCustomer.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name*</label>
                  <input
                    type="text"
                    name="lastName"
                    value={editingCustomer.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street*</label>
                  <input
                    type="text"
                    name="street"
                    value={editingCustomer.street}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barangay*</label>
                  <input
                    type="text"
                    name="barangay"
                    value={editingCustomer.barangay}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City*</label>
                  <input
                    type="text"
                    name="city"
                    value={editingCustomer.city}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Province*</label>
                  <input
                    type="text"
                    name="province"
                    value={editingCustomer.province}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birthdate*</label>
                  <input
                    type="date"
                    name="birthdate"
                    value={editingCustomer.birthdate}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meter Number*</label>
                  <input
                    type="text"
                    name="meterNumber"
                    value={editingCustomer.meterNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                  <input
                    type="email"
                    name="email"
                    value={editingCustomer.email}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">+63</span>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={editingCustomer.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="9123456789"
                      required
                      className="w-full p-2 pl-12 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={editingCustomer.status}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <FiLoader className="animate-spin inline" /> : "Update Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-4 sm:p-8">
            <div className="flex justify-between items-center border-b border-gray-200 p-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Payment History for {historyCustomer ? `${historyCustomer.first_name} ${historyCustomer.last_name}` : ""}
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={24} />
              </button>
            </div>
            <div className="p-4">
              {historyLoading ? (
                <div className="flex justify-center items-center h-32">
                  <FiLoader className="animate-spin text-3xl text-blue-500" />
                </div>
              ) : historyError ? (
                <div className="text-red-600 text-center">{historyError}</div>
              ) : paymentHistory.length === 0 ? (
                <div className="text-gray-500 text-center">No payment history found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-left">
                        <th className="p-3 font-medium">Date</th>
                        <th className="p-3 font-medium">Amount Paid</th>
                        <th className="p-3 font-medium">Method</th>
                        <th className="p-3 font-medium">Receipt #</th>
                        <th className="p-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paymentHistory.map((p) => (
                        <tr key={p.id || p.bill_id} className="hover:bg-gray-50">
                          <td className="p-3 text-gray-900">{p.payment_date ? new Date(p.payment_date).toLocaleString() : "-"}</td>
                          <td className="p-3 text-gray-900">{p.amount_paid}</td>
                          <td className="p-3 text-gray-900">{p.payment_method}</td>
                          <td className="p-3 text-gray-900">{p.receipt_number}</td>
                          <td className="p-3 text-gray-900">{p.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-blue-900">Customer Management</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg shadow-md hover:shadow-lg transition-all hover:bg-blue-700"
        >
          <FiPlus /> Add New Customer
        </button>
      </div>

      {/* Search & Filter Section */}
      <div className="bg-white/80 p-2 sm:p-6 rounded-xl shadow-md mb-8 grid grid-cols-1 md:grid-cols-4 gap-2 sm:gap-4 border border-gray-200">
        <div className="relative col-span-1 md:col-span-2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 p-3 w-full border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all"
          />
        </div>
        <select
          value={selectedBarangay}
          onChange={(e) => setSelectedBarangay(e.target.value)}
          className="p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-300 transition-all"
        >
          {barangays.map(barangay => (
            <option key={barangay} value={barangay}>{barangay === "All" ? "All Barangays" : barangay}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-300 transition-all"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Customers Table */}
      <div className="bg-white/80 p-2 sm:p-6 rounded-xl shadow-md overflow-hidden border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">Customer Records</h3>
          <div className="text-xs md:text-sm text-gray-500">
            Showing {filteredCustomers.length} of {customers.length} customers
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center h-32 sm:h-64">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-left">
                  <th className="p-4 font-medium">ID</th>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Address</th>
                  <th className="p-4 font-medium">Contact</th>
                  <th className="p-4 font-medium">Meter Number</th>
                  <th className="p-4 font-medium text-center">Senior Citizen</th>
                  <th className="p-4 font-medium text-center">Status</th>
                  <th className="p-4 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.length > 0 ? (
                  paginatedCustomers.map((customer) => (
                    <tr 
                      key={customer.id} 
                      className="hover:bg-gray-50 transition-all"
                    >
                      <td className="p-4 text-gray-900">{customer.id}</td>
                      <td className="p-4 font-medium text-gray-900">
                        <div>{customer.last_name && customer.first_name ? `${customer.last_name}, ${customer.first_name}` : customer.name}</div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <FiCalendar className="mr-1" />
                          {new Date(customer.birthdate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">
                        <div className="flex items-center gap-1">
                          <FiHome className="text-gray-400" />
                          <div>
                            <div>{customer.street}</div>
                            <div>{customer.barangay}, {customer.city}</div>
                            <div>{customer.province}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">
                        <div className="flex items-center gap-1">
                          <FiPhone className="text-gray-400" />
                          {customer.phone_number}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <FiMail className="text-gray-400" />
                          {customer.email}
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{customer.meter_number}</td>
                      <td className="p-4 text-center">
                        <span 
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            customer.senior_citizen 
                              ? "bg-blue-100 text-blue-800" 
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {customer.senior_citizen ? (
                            <>
                              <FiUser className="mr-1" /> Yes
                            </>
                          ) : (
                            <>
                              <FiUser className="mr-1" /> No
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span 
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            customer.status === "Inactive" 
                              ? "bg-red-100 text-red-800" 
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {customer.status === "Inactive" ? (
                            <>
                              <FiUserX className="mr-1" /> Inactive
                            </>
                          ) : (
                            <>
                              <FiUserCheck className="mr-1" /> Active
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-4 text-center space-x-2">
                        <button
                          onClick={() => handleEditClick(customer)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                          title="Edit Customer"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => updateCustomerStatus(customer.id, customer.status === "Inactive" ? "Active" : "Inactive")}
                          disabled={isUpdating}
                          className={`p-2 rounded-md transition-all ${
                            customer.status === "Inactive"
                              ? "text-green-600 hover:bg-green-50"
                              : "text-red-600 hover:bg-red-50"
                          }`}
                          title={customer.status === "Inactive" ? "Activate Customer" : "Deactivate Customer"}
                        >
                          {isUpdating ? <FiLoader className="animate-spin" /> : customer.status === "Inactive" ? <FiUserCheck /> : <FiUserX />}
                        </button>
                        <button
                          onClick={() => handleViewHistory(customer)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-md transition-all"
                          title="View Payment History"
                        >
                          <FiClock />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <FiUser className="text-4xl text-gray-400 mb-2" />
                        No customers found matching your criteria.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center p-2 sm:p-4 gap-2">
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

      {/* Add Customer Confirmation Modal */}
      {showAddConfirmModal && pendingCustomerData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl p-4 sm:p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Confirm New Customer</h3>
              <button
                onClick={() => {
                  setShowAddConfirmModal(false);
                  setPendingCustomerData(null);
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
                <h4 className="font-semibold text-blue-900 mb-2">Customer Information</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Name:</span> {pendingCustomerData.data.firstName} {pendingCustomerData.data.lastName}</div>
                  <div><span className="font-medium">Email:</span> {pendingCustomerData.data.email}</div>
                  <div><span className="font-medium">Phone:</span> {pendingCustomerData.data.phoneNumber}</div>
                  <div><span className="font-medium">Meter Number:</span> {pendingCustomerData.data.meterNumber}</div>
                  <div><span className="font-medium">Address:</span> {pendingCustomerData.data.street}, {pendingCustomerData.data.barangay}</div>
                  <div><span className="font-medium">Status:</span> {pendingCustomerData.data.status}</div>
                  <div><span className="font-medium">Senior Citizen:</span> {pendingCustomerData.data.seniorCitizen ? 'Yes' : 'No'}</div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Please confirm:</strong> Are you sure you want to add this new customer? 
                  This action will create a new customer account in the system.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowAddConfirmModal(false);
                  setPendingCustomerData(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAddCustomer}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Confirm & Add Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Customer Confirmation Modal */}
      {showUpdateConfirmModal && pendingCustomerData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl p-4 sm:p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Confirm Customer Update</h3>
              <button
                onClick={() => {
                  setShowUpdateConfirmModal(false);
                  setPendingCustomerData(null);
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
                <h4 className="font-semibold text-blue-900 mb-2">Updated Information</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Name:</span> {pendingCustomerData.data.firstName} {pendingCustomerData.data.lastName}</div>
                  <div><span className="font-medium">Email:</span> {pendingCustomerData.data.email}</div>
                  <div><span className="font-medium">Phone:</span> {pendingCustomerData.data.phoneNumber}</div>
                  <div><span className="font-medium">Meter Number:</span> {pendingCustomerData.data.meterNumber}</div>
                  <div><span className="font-medium">Address:</span> {pendingCustomerData.data.street}, {pendingCustomerData.data.barangay}</div>
                  <div><span className="font-medium">Status:</span> {pendingCustomerData.data.status}</div>
                  <div><span className="font-medium">Senior Citizen:</span> {pendingCustomerData.data.seniorCitizen ? 'Yes' : 'No'}</div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Please confirm:</strong> Are you sure you want to update this customer's information? 
                  This action will modify the existing customer record.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowUpdateConfirmModal(false);
                  setPendingCustomerData(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpdateCustomer}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Confirm & Update Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;