import React, { useState, useEffect, useCallback } from "react";
import { FiFilter, FiCalendar, FiUser, FiFileText, FiActivity, FiRefreshCw, FiDownload } from "react-icons/fi";
import apiClient from '../api/client';

const AuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    user_id: "",
    action: "",
    start_date: "",
    end_date: ""
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.user_id) queryParams.append('user_id', filters.user_id);
      if (filters.action) queryParams.append('action', filters.action);
      if (filters.start_date) queryParams.append('start', filters.start_date);
      if (filters.end_date) queryParams.append('end', filters.end_date);

      const response = await apiClient.get(`/audit-logs?${queryParams}`);
      const data = response.data;
      // Normalize details to object when JSON string
      const normalized = (Array.isArray(data) ? data : []).map(row => ({
        ...row,
        details: (() => {
          if (!row.details) return null;
          if (typeof row.details === 'object') return row.details;
          try { return JSON.parse(row.details); } catch { return { raw: String(row.details) }; }
        })()
      }));
      setAuditLogs(normalized);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      user_id: "",
      action: "",
      start_date: "",
      end_date: ""
    });
    setCurrentPage(1);
  };

  const getActionIcon = (action) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('payment')) {
      return <FiActivity className="text-purple-500" />;
    }
    if (actionLower.includes('bill')) {
      return <FiFileText className="text-green-500" />;
    }
    if (actionLower.includes('login')) {
      return <FiUser className="text-blue-500" />;
    }
    return <FiActivity className="text-gray-500" />;
  };

  const getActionColor = (action) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('payment_processed') || actionLower.includes('payment_approved')) {
      return 'bg-green-100 text-green-800';
    }
    if (actionLower.includes('payment_rejected')) {
      return 'bg-red-100 text-red-800';
    }
    if (actionLower.includes('payment_submitted')) {
      return 'bg-blue-100 text-blue-800';
    }
    if (actionLower.includes('bill_created')) {
      return 'bg-green-100 text-green-800';
    }
    if (actionLower.includes('login')) {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const formatAction = (action) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDetails = (details) => {
    if (!details) return <span className="text-gray-400">—</span>;
    
    if (typeof details === 'string') {
      try {
        details = JSON.parse(details);
      } catch {
        return <span className="text-gray-600">{details}</span>;
      }
    }
    
    const items = [];
    if (details.customer_name) {
      items.push(<div key="customer"><strong>Customer:</strong> {details.customer_name}</div>);
    }
    if (details.amount_paid || details.amount_due || details.amount) {
      const amount = details.amount_paid || details.amount_due || details.amount;
      items.push(<div key="amount"><strong>Amount:</strong> ₱{parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>);
    }
    if (details.payment_method) {
      items.push(<div key="method"><strong>Payment Method:</strong> {details.payment_method}</div>);
    }
    if (details.receipt_number) {
      items.push(<div key="receipt"><strong>Receipt:</strong> {details.receipt_number}</div>);
    }
    if (details.bill_id) {
      items.push(<div key="bill"><strong>Bill ID:</strong> {details.bill_id}</div>);
    }
    if (details.status) {
      items.push(<div key="status"><strong>Status:</strong> {details.status}</div>);
    }
    
    if (items.length === 0) {
      return <span className="text-gray-400">—</span>;
    }
    
    return (
      <div className="text-xs bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 max-w-[28rem] border-2 border-blue-100 text-gray-700 space-y-1.5 shadow-sm">
        {items}
      </div>
    );
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'User ID', 'Action', 'Details'];
    const csvContent = [
      headers.join(','),
      ...auditLogs.map(log => {
        let detailsStr = 'N/A';
        if (log.details) {
          const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
          const parts = [];
          if (details.customer_name) parts.push(`Customer: ${details.customer_name}`);
          if (details.amount_paid || details.amount_due || details.amount) {
            const amount = details.amount_paid || details.amount_due || details.amount;
            parts.push(`Amount: ₱${parseFloat(amount).toFixed(2)}`);
          }
          if (details.payment_method) parts.push(`Method: ${details.payment_method}`);
          if (details.receipt_number) parts.push(`Receipt: ${details.receipt_number}`);
          detailsStr = parts.join('; ') || 'N/A';
        }
        return [
          formatTimestamp(log.timestamp),
          log.user_id || 'N/A',
          log.action,
          detailsStr
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const paginatedLogs = auditLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <FiActivity className="w-8 h-8" />
              Audit Trail
            </h1>
            <p className="text-blue-100">Track all system activities and user actions</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchAuditLogs}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200 shadow-lg hover:shadow-xl border border-white/30"
            >
              <FiRefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200 shadow-lg hover:shadow-xl border border-white/30"
            >
              <FiDownload className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200/50 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FiFilter className="text-blue-600 w-5 h-5" />
          </div>
          <h3 className="font-bold text-xl text-gray-800">Filters</h3>
        </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <input
              type="text"
              name="user_id"
              value={filters.user_id}
              onChange={handleFilterChange}
              placeholder="Enter user ID"
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <input
              type="text"
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              placeholder="e.g., payment, bill"
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
            <FiActivity className="w-5 h-5 text-blue-600" />
            Activity Log
          </h3>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      User ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paginatedLogs.length > 0 ? (
                    paginatedLogs.map((log, index) => (
                      <tr key={index} className="hover:bg-blue-50/50 transition-colors duration-150 border-l-4 border-transparent hover:border-blue-400">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <FiCalendar className="w-4 h-4 text-gray-400 mr-2" />
                            {formatTimestamp(log.timestamp)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.user_id || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getActionIcon(log.action)}
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                              {formatAction(log.action)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">{formatDetails(log.details)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <FiActivity className="w-12 h-12 text-gray-300 mb-2" />
                          <p>No audit logs found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, auditLogs.length)} of {auditLogs.length} results
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLogs; 
