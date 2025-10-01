import React, { useState, useEffect } from 'react';
import { FiDownload, FiPrinter, FiRefreshCw } from 'react-icons/fi';
import axios from 'axios';
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
    totalPenalty: 0,
    totalAfterDue: 0,
    totalSurcharge: 0
  });

  // Fetch billing data when component mounts
  useEffect(() => {
    fetchBillingData();
  }, [month, year]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all bills for the specified month/year
      const response = await axios.get(`http://localhost:3001/api/billing`);
      const allBills = response.data;

      console.log('Fetched bills:', allBills);

      // Filter bills for the specified month/year and process data
      const processedData = allBills
        .filter(bill => {
          const billDate = new Date(bill.created_at);
          return billDate.getMonth() === getMonthNumber(month) && 
                 billDate.getFullYear() === parseInt(year);
        })
        .map((bill, index) => {
          const consumption = bill.current_reading - bill.previous_reading;
          
          // Check if customer is senior citizen (age >= 60)
          const customerBirthdate = new Date(bill.birthdate || '1900-01-01');
          const today = new Date();
          const age = today.getFullYear() - customerBirthdate.getFullYear();
          const isSeniorCitizen = age >= 60;
          
          const scd = isSeniorCitizen ? (bill.amount_due * 0.05) : 0;
          const penalty = bill.penalty || 0;
          const surcharge = bill.surcharge || 0;
          const afterDue = bill.amount_due + penalty + surcharge - scd;

          return {
            id: index + 1,
            zone: bill.zone || '',
            name: bill.customer_name || `${bill.first_name} ${bill.last_name}`,
            status1: isSeniorCitizen ? 'SC' : 'ACTIVE',
            status2: bill.business_type || '',
            presentReading: bill.current_reading,
            previousReading: bill.previous_reading,
            used: consumption,
            billAmount: bill.amount_due,
            scd: scd,
            totalAmount: bill.amount_due - scd,
            orNumber: bill.receipt_number || '',
            date: formatDate(bill.payment_date || bill.due_date),
            penalty: bill.penalty_paid || penalty,
            afterDue: afterDue,
            surcharge: surcharge
          };
        });

      setBillingData(processedData);

      // Calculate summary totals
      const totals = processedData.reduce((acc, item) => ({
        totalUsed: acc.totalUsed + (item.used || 0),
        totalBill: acc.totalBill + (item.billAmount || 0),
        totalSCD: acc.totalSCD + (item.scd || 0),
        totalPenalty: acc.totalPenalty + (item.penalty || 0),
        totalAfterDue: acc.totalAfterDue + (item.afterDue || 0),
        totalSurcharge: acc.totalSurcharge + (item.surcharge || 0)
      }), {
        totalUsed: 0,
        totalBill: 0,
        totalSCD: 0,
        totalPenalty: 0,
        totalAfterDue: 0,
        totalSurcharge: 0
      });

      setSummary(totals);
    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError('Failed to load billing data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiRefreshCw className="w-4 h-4 inline mr-2" />
          Retry
        </button>
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
          <h2 className="text-xl font-semibold text-gray-700">{collector}</h2>
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
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold" rowSpan="2">CONSUMER</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold" rowSpan="2">STATUS</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold" rowSpan="2">STATUS</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold" colSpan="3">METER READING</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold" colSpan="2">AMOUNT</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold" rowSpan="2">TOTAL AMOUNT</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold" colSpan="5">AMOUNT</th>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold">ZONE I</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold">NAME</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold"></th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold">PRESENT</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold">PREVIOUS</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold">USED</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold">OF BILL</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold">SCD</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold"></th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold">OR NO.</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold">DATE</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold">PENALTY</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold">AFTER DUE</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold">SURCHARGE</th>
              </tr>
            </thead>
            <tbody>
              {billingData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-800 px-2 py-1 text-xs text-center">{row.zone}</td>
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
                  <td className="border border-gray-800 px-2 py-1 text-xs text-center">{row.orNumber}</td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-center">{row.date}</td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-right font-semibold">
                    {row.penalty > 0 ? `₱ ${row.penalty.toFixed(2)}` : ''}
                  </td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-right font-bold">
                    {row.afterDue ? `₱ ${row.afterDue.toFixed(2)}` : ''}
                  </td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-right font-semibold">
                    {row.surcharge > 0 ? `₱ ${row.surcharge.toFixed(2)}` : ''}
                  </td>
                </tr>
              ))}
              
              {/* Empty rows to fill up to 42 rows like the original */}
              {Array.from({ length: Math.max(0, 42 - billingData.length) }, (_, i) => (
                <tr key={`empty-${i}`}>
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
          <div className="grid grid-cols-6 gap-4 text-sm">
            <div className="text-center">
              <span className="font-bold">SUB TOTAL</span>
            </div>
            <div className="text-center">
              <span className="font-bold">USED: {summary.totalUsed.toFixed(2)}</span>
            </div>
            <div className="text-center">
              <span className="font-bold">OF BILL: ₱ {summary.totalBill.toFixed(2)}</span>
            </div>
            <div className="text-center">
              <span className="font-bold">SCD: ₱ {summary.totalSCD.toFixed(2)}</span>
            </div>
            <div className="text-center">
              <span className="font-bold">PENALTY: ₱ {summary.totalPenalty.toFixed(2)}</span>
            </div>
            <div className="text-center">
              <span className="font-bold">AFTER DUE: ₱ {summary.totalAfterDue.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-2 text-center">
            <span className="font-bold">SURCHARGE: ₱ {summary.totalSurcharge.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSheet;
