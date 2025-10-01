import React, { useState, useEffect } from "react";
import { formatCurrency } from '../utils/currencyFormatter';
import { FiUsers, FiActivity, FiMenu, FiX, FiHome, FiFileText, FiBarChart2, FiEdit, FiShield, FiSettings, FiLogOut, FiAlertTriangle, FiDollarSign } from 'react-icons/fi';
import Billing from "./Billing";
import Customers from "./Customers";
import SystemSettings from "./SystemSettings";
import ManageEmployees from "./ManageEmployees";
import AdminFileReview from "./AdminFileReview";
import AuditLogs from "./AuditLogs";
import Reports from "./Reports";
import PenaltyManager from "../components/PenaltyManager";
import CreditManager from "../components/CreditManager";
import axios from 'axios';

const sidebarLinks = [
  { label: "Dashboard", icon: <FiHome /> },
  { label: "Billing", icon: <FiFileText /> },
  { label: "Customers", icon: <FiUsers /> },
  { label: "Employees", icon: <FiUsers /> },
  { label: "Credit Manager", icon: <FiDollarSign /> },
  { label: "Penalty Manager", icon: <FiAlertTriangle /> },
  { label: "Reports", icon: <FiBarChart2 /> },
  { label: "Proof of Payment", icon: <FiEdit /> },
  { label: "Audit Trail", icon: <FiShield /> },
  { label: "Settings", icon: <FiSettings /> },
];

// Placeholder content components
const DashboardContent = ({ displayName }) => {
  const [stats, setStats] = useState({ employees: 0, revenue: 0, pending: 0 });
  const [openModal, setOpenModal] = useState(null); // 'employees' | 'revenue' | 'pending' | null
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [approveMsg, setApproveMsg] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/api/dashboard/dashboard-stats")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => setStats({ employees: 0, revenue: 0, pending: 0 }));
    // Fetch pending users
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setLoadingPending(true);
    try {
      const res = await axios.get("http://localhost:3001/api/customers");
      setPendingUsers(res.data.filter(u => u.status === 'Pending'));
    } catch (err) {
      setPendingUsers([]);
    } finally {
      setLoadingPending(false);
    }
  };

  const handleApprove = async (userId) => {
    setApproveMsg("");
    try {
      const res = await axios.post("http://localhost:3001/api/auth/approve-registration", { userId });
      setApproveMsg(res.data.message || 'User approved.');
      fetchPendingUsers();
    } catch (err) {
      setApproveMsg(err.response?.data?.message || 'Failed to approve user.');
    }
  };

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
        <button
          className="bg-white/80 p-6 rounded-xl shadow flex items-center hover:shadow-lg transition cursor-pointer"
          onClick={() => setOpenModal('employees')}
        >
          <FiUsers className="text-blue-600 text-3xl mr-4" />
          <div>
            <p className="text-gray-500">Total Employees</p>
            <p className="text-2xl font-bold">{stats.employees}</p>
          </div>
        </button>
        <button
          className="bg-white/80 p-6 rounded-xl shadow flex items-center hover:shadow-lg transition cursor-pointer"
          onClick={() => setOpenModal('revenue')}
        >
          <span className="text-green-600 text-3xl mr-4 font-bold">₱</span>
          <div>
            <p className="text-gray-500">Today's Revenue</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.revenue)}</p>
          </div>
        </button>
        <button
          className="bg-white/80 p-6 rounded-xl shadow flex items-center hover:shadow-lg transition cursor-pointer"
          onClick={() => setOpenModal('pending')}
        >
          <FiActivity className="text-purple-600 text-3xl mr-4" />
          <div>
            <p className="text-gray-500">Pending Approvals</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
        </button>
      </div>
      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2 sm:p-0">
          <div className="bg-white rounded-xl shadow-xl p-4 sm:p-8 max-w-md w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setOpenModal(null)}
              aria-label="Close modal"
            >
              ×
            </button>
            {openModal === 'employees' && (
              <>
                <h2 className="text-xl font-bold mb-4">Employees</h2>
                <p>Total Employees: <span className="font-bold">{stats.employees}</span></p>
                {/* Add more employee details here */}
              </>
            )}
            {openModal === 'revenue' && (
              <>
                <h2 className="text-xl font-bold mb-4">Today's Revenue</h2>
                <p>{formatCurrency(stats.revenue)}</p>
                {/* Add more revenue details here */}
              </>
            )}
            {openModal === 'pending' && (
              <>
                <h2 className="text-xl font-bold mb-4">Pending Approvals</h2>
                <p>Pending Approvals: <span className="font-bold">{stats.pending}</span></p>
                {/* Add more pending details here */}
              </>
            )}
          </div>
        </div>
      )}
      <div className="bg-white/80 rounded-xl shadow p-4 sm:p-8 overflow-x-auto mt-8">
        <h3 className="text-lg font-bold mb-2 text-blue-900">Pending User Registrations</h3>
        {approveMsg && <div className="mb-2 text-green-700 font-semibold">{approveMsg}</div>}
        {loadingPending ? (
          <div>Loading...</div>
        ) : pendingUsers.length === 0 ? (
          <div className="text-gray-500">No pending registrations.</div>
        ) : (
          <table className="min-w-full bg-white border border-gray-200 text-xs md:text-sm">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Phone</th>
                <th className="px-4 py-2 border">Registered</th>
                <th className="px-4 py-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map(user => (
                <tr key={user.id}>
                  <td className="px-4 py-2 border">{user.first_name} {user.last_name}</td>
                  <td className="px-4 py-2 border">{user.email}</td>
                  <td className="px-4 py-2 border">{user.phone_number}</td>
                  <td className="px-4 py-2 border">{new Date(user.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2 border">
                    <button
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      onClick={() => handleApprove(user.id)}
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="bg-white/80 rounded-xl shadow p-4 sm:p-8 overflow-x-auto">
        <h3 className="text-xl font-semibold text-blue-800 mb-4">System Overview</h3>
        <p className="text-gray-700">
          This is your admin dashboard. Use the sidebar to navigate between different management sections.
        </p>
      </div>
    </>
  );
};
const BillingContent = Billing;
const CustomersContent = Customers;
const EmployeesContent = ManageEmployees;
const CreditManagerContent = CreditManager;
const PenaltyManagerContent = PenaltyManager;
const ReportsContent = Reports;
const EditLandingContent = AdminFileReview;
const AuditTrailContent = AuditLogs;
const SettingsContent = SystemSettings;

const contentPanels = {
  Dashboard: DashboardContent,
  Billing: BillingContent,
  Customers: CustomersContent,
  Employees: EmployeesContent,
  "Credit Manager": CreditManagerContent,
  "Penalty Manager": PenaltyManagerContent,
  Reports: ReportsContent,
  "Proof of Payment": EditLandingContent,
  "Audit Trail": AuditTrailContent,
  Settings: SettingsContent,
};

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedTab, setSelectedTab] = useState("Dashboard");
  const user = JSON.parse(localStorage.getItem("user"));
  const displayName = user && user.firstName ? `${user.firstName} ${user.lastName}` : "User";

  const ContentComponent = contentPanels[selectedTab] || (() => <div className="text-white">Not found</div>);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`transition-all duration-300 bg-[#232946] flex flex-col min-h-full px-2 shadow-2xl relative z-10
          ${sidebarOpen ? "w-56 md:w-64" : "w-20 md:w-24"}
        `}
      >
        {/* Centered Sidebar Content */}
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <div className="flex flex-col items-center">
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
              onClick={() => setSelectedTab("Dashboard")}
              aria-label="Go to Dashboard"
            >
              <span
                className="rounded-full flex items-center justify-center border-4 border-white shadow-lg bg-white"
                style={{ width: sidebarOpen ? 64 : 48, height: sidebarOpen ? 64 : 48 }}
              >
                <img
                  src="logodolores.png"
                  alt="Water District Logo"
                  className="rounded-full object-cover"
                  style={{ width: sidebarOpen ? 56 : 40, height: sidebarOpen ? 56 : 40 }}
                />
              </span>
              {sidebarOpen && (
                <span className="text-xs text-white font-bold tracking-wide mt-1">Billink</span>
              )}
            </button>
          </div>
          {/* Sidebar Links */}
          <nav className="flex-1 w-full flex flex-col items-center space-y-2 mt-6">
            {sidebarLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => setSelectedTab(link.label)}
                className={`group flex items-center w-full py-3 px-2 rounded-xl transition-all relative
                  ${selectedTab === link.label ? "bg-blue-600 text-white shadow-lg" : "hover:bg-[#2d3250] text-gray-400"}
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
                {selectedTab === link.label && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-400 rounded-r-lg"></span>
                )}
              </button>
            ))}
          </nav>
        </div>
        {/* Bottom: Logout */}
        <div className="w-full mb-4 px-2">
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
            className={`flex items-center w-full py-3 px-2 text-red-400 hover:bg-red-900 rounded-xl transition-all
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
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col justify-start">
          <ContentComponent displayName={displayName} />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;