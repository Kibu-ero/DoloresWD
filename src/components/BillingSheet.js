import React, { useState, useEffect } from 'react';
import { FiDownload, FiPrinter, FiRefreshCw } from 'react-icons/fi';
import apiClient from '../api/client';
import { formatCurrency } from '../utils/currencyFormatter';

const BillingSheet = ({ 
  month = 'DECEMBER',
  year = '2024',
  collector = 'DOLORES A',
  isPrintable = false,
  onClose
}) => {
  const [billingData, setBillingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    totalUsed: 0,
    totalBill: 0,
    totalSCD: 0,
    totalAmount: 0,
    totalPenalty: 0,
    totalAfterDue: 0,
    totalSurcharge: 0
  });

  const fetchBillingData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch prepared daily collector rows from backend
      const monthNum = getMonthNumber(month) + 1; // backend expects 1-12
      
      // Build params - only include collector if it's provided and not empty
      const params = { month: monthNum, year };
      if (collector && collector.trim() !== '') {
        params.collector = collector;
      }
      
      console.log('Fetching billing data:', params);
      
      const resp = await apiClient.get(`/reports/daily-collector`, { params });
      
      console.log('Billing data response:', resp.data);
      
      const rows = Array.isArray(resp.data) ? resp.data : [];
      
      if (rows.length === 0) {
        console.warn('No billing data found for the selected period');
        // Don't set error, just show empty table
      }

      const processedData = rows.map((r, idx) => ({
        id: idx + 1,
        zone: r.zone,
        name: r.name,
        address: r.address,
        status1: r.status1,
        status2: r.status2,
        presentReading: Number(r.present_reading) || 0,
        previousReading: Number(r.previous_reading) || 0,
        used: Number(r.used) || 0,
        billAmount: Number(r.bill_amount) || 0,
        scd: Number(r.scd) || 0,
        totalAmount: Number(r.total_amount) || 0,
        orNumber: r.or_number,
        date: r.pay_date,
        penalty: Number(r.penalty) || 0,
        afterDue: Number(r.after_due) || 0,
        surcharge: Number(r.surcharge) || 0,
      }));

      setBillingData(processedData);

      // Calculate summary totals
      const totals = processedData.reduce((acc, item) => ({
        totalUsed: acc.totalUsed + (item.used || 0),
        totalBill: acc.totalBill + (item.billAmount || 0),
        totalSCD: acc.totalSCD + (item.scd || 0),
        totalAmount: acc.totalAmount + (item.totalAmount || 0),
        totalPenalty: acc.totalPenalty + (item.penalty || 0),
        totalAfterDue: acc.totalAfterDue + (item.afterDue || 0),
        totalSurcharge: acc.totalSurcharge + (item.surcharge || 0)
      }), {
        totalUsed: 0,
        totalBill: 0,
        totalSCD: 0,
        totalAmount: 0,
        totalPenalty: 0,
        totalAfterDue: 0,
        totalSurcharge: 0
      });

      setSummary(totals);
    } catch (err) {
      console.error('Error fetching billing data:', err);
      console.error('Full error object:', {
        response: err.response,
        request: err.request,
        message: err.message
      });
      
      let errorMessage = 'Failed to load billing data. Please try again.';
      
      if (err.response) {
        // Server responded with error
        errorMessage = err.response.data?.error || 
                      err.response.data?.message || 
                      `Server error: ${err.response.status} ${err.response.statusText}`;
      } else if (err.request) {
        // Request made but no response
        errorMessage = 'No response from server. Please check if the server is running.';
      } else {
        // Something else happened
        errorMessage = err.message || errorMessage;
      }
      
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [month, year, collector]);

  // Fetch billing data when component mounts
  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  const getMonthNumber = (monthName) => {
    const months = {
      'JANUARY': 0, 'FEBRUARY': 1, 'MARCH': 2, 'APRIL': 3,
      'MAY': 4, 'JUNE': 5, 'JULY': 6, 'AUGUST': 7,
      'SEPTEMBER': 8, 'OCTOBER': 9, 'NOVEMBER': 10, 'DECEMBER': 11
    };
    return months[monthName.toUpperCase()] || 0;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getMonth() + 1}-${date.getDate()}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    console.log('Download functionality to be implemented');
  };

  const handleRefresh = () => {
    fetchBillingData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <FiRefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading billing sheet data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Billing Sheet</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="text-sm text-gray-600 mb-4">
            <p>Please check:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>You are logged in and have proper permissions</li>
              <li>The month, year, and collector parameters are correct</li>
              <li>The server is running and accessible</li>
            </ul>
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiRefreshCw className="w-4 h-4 inline mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white ${isPrintable ? 'p-0' : 'p-6'} max-w-full mx-auto`}>
      {/* Print/Download buttons - hidden when printing */}
      {!isPrintable && (
        <div className="flex justify-end gap-2 mb-4 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPrinter className="w-4 h-4" />
            Print Billing Sheet
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FiDownload className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <FiRefreshCw className="w-4 h-4" />
            Refresh
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      )}

      {/* Billing Sheet Container */}
      <div className="border-2 border-gray-800 bg-white shadow-lg billing-sheet-container">
        {/* Header */}
        <div className="text-center py-4 border-b-2 border-gray-800">
          <h1 className="text-2xl font-bold text-gray-800">DAILY COLLECTOR</h1>
          <h2 className="text-xl font-semibold text-gray-700">
            {collector && collector.trim() !== '' ? collector : 'ALL ZONES'}
          </h2>
        </div>

        {/* Title */}
        <div className="text-center py-2 bg-gray-100 border-b border-gray-300">
          <h3 className="text-lg font-bold text-gray-800">BILLING SHEET - {month} {year}</h3>
        </div>

        {/* Main Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-800 billing-sheet-table">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold" rowSpan="2">BILL NO.</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold" rowSpan="2">CONSUMER ZONE</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold" rowSpan="2">STATUS</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold" rowSpan="2">STATUS</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold" colSpan="3">METER READING</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold" rowSpan="2">AMOUNT OF BILL</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold" rowSpan="2">SCD</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold" rowSpan="2">TOTAL AMOUNT</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold" rowSpan="2">OR NO.</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold" rowSpan="2">DATE</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold" rowSpan="2">PENALTY</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold" rowSpan="2">AMOUNT AFTER DUE SURCHARGE</th>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold">PRESENT</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold">PREVIOUS</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold">USED (CU3m)</th>
              </tr>
            </thead>
            <tbody>
              {billingData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-800 px-2 py-1 text-xs text-center font-semibold">{index + 1}</td>
                  <td className="border border-gray-800 px-2 py-1 text-xs font-semibold">{row.name}</td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-center">{row.status1}</td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-center">{row.status2}</td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-center">{row.presentReading}</td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-center">{row.previousReading}</td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-center font-semibold">{row.used}</td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-right font-semibold">
                    {row.billAmount ? `₱ ${row.billAmount.toFixed(2)}` : ''}
                  </td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-right font-semibold">
                    {row.scd > 0 ? `₱ ${row.scd.toFixed(2)}` : ''}
                  </td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-right font-bold">
                    {row.totalAmount ? `₱ ${row.totalAmount.toFixed(2)}` : ''}
                  </td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-center">{row.orNumber || ''}</td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-center">{row.date || ''}</td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-right font-semibold">
                    {row.penalty > 0 ? `₱ ${row.penalty.toFixed(2)}` : ''}
                  </td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-right font-bold">
                    {row.afterDue ? `₱ ${row.afterDue.toFixed(2)}` : ''}
                  </td>
                </tr>
              ))}
              
              {/* Empty rows to fill up to 42 rows like the original */}
              {Array.from({ length: Math.max(0, 42 - billingData.length) }, (_, i) => (
                <tr key={`empty-${i}`}>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-center">{billingData.length + i + 1}</td>
                  <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                  <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                  <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                  <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                  <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                  <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                  <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                  <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                  <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                  <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                  <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                  <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-4 border-t-2 border-gray-800">
          <table className="w-full border-collapse">
            <tbody>
              <tr className="font-bold text-sm">
                <td className="px-2 text-center border-r border-gray-300">SUB TOTAL</td>
                <td className="px-2 text-center border-r border-gray-300">USED: {summary.totalUsed.toFixed(2)}</td>
                <td className="px-2 text-center border-r border-gray-300">AMOUNT OF BILL: ₱ {summary.totalBill.toFixed(2)}</td>
                <td className="px-2 text-center border-r border-gray-300">SCD: ₱ {summary.totalSCD.toFixed(2)}</td>
                <td className="px-2 text-center border-r border-gray-300">TOTAL AMOUNT: ₱ {summary.totalAmount.toFixed(2)}</td>
                <td className="px-2 text-center border-r border-gray-300">PENALTY: ₱ {summary.totalPenalty.toFixed(2)}</td>
                <td className="px-2 text-center">AMOUNT AFTER DUE SURCHARGE: ₱ {summary.totalAfterDue.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BillingSheet;
