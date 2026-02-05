import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import apiClient from '../api/client';
import { formatNumber } from '../utils/currencyFormatter';
import CustomerLedger from '../components/CustomerLedger';
import BillingSheet from '../components/BillingSheet';

// Role-based report definitions
const REPORTS_BY_ROLE = {
  admin: [
    { key: 'collection', label: 'Collection Summary' },
    { key: 'outstanding', label: 'Outstanding Balances' },
    { key: 'revenue', label: 'Revenue Report' },
    { key: 'monthly-stats', label: 'Monthly Statistics' },
    { key: 'audit', label: 'Audit Logs' },
    { key: 'approvals', label: 'Approval Logs' },
    { key: 'transactions', label: 'Transaction Logs' },
    { key: 'ledger', label: 'Customer Ledger' },
    { key: 'billing-sheet', label: 'Daily Collector Billing Sheet' },
  ],
  cashier: [
    { key: 'collection', label: 'Collection Summary' },
    { key: 'outstanding', label: 'Outstanding Balances' },
    { key: 'revenue', label: 'Revenue Report' },
    { key: 'monthly-stats', label: 'Monthly Statistics' },
    { key: 'transactions', label: 'Transaction Logs' },
    { key: 'ledger', label: 'Customer Ledger' },
    { key: 'billing-sheet', label: 'Daily Collector Billing Sheet' },
  ],
  encoder: [
    { key: 'meter-reading', label: 'Meter Reading Input' },
    { key: 'collection', label: 'Collection Summary' },
    { key: 'outstanding', label: 'Outstanding Balances' },
    { key: 'revenue', label: 'Revenue Report' },
    { key: 'monthly-stats', label: 'Monthly Statistics' },
  ],
  finance_officer: [
    { key: 'collection', label: 'Collection Summary' },
    { key: 'outstanding', label: 'Outstanding Balances' },
    { key: 'revenue', label: 'Revenue Report' },
    { key: 'monthly-stats', label: 'Monthly Statistics' },
    { key: 'ledger', label: 'Customer Ledger' },
    { key: 'billing-sheet', label: 'Daily Collector Billing Sheet' },
  ],
  customer: [
    { key: 'personal-billing', label: 'Billing History' },
    { key: 'payment-history', label: 'Payment History' },
    { key: 'outstanding-balance', label: 'Outstanding Balance' },
    { key: 'proof-of-payment', label: 'Proof of Payment' },
  ],
};

const Reports = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  // Normalize role for consistency
  const normalizeRole = (r) => (r || '').toString().trim().toLowerCase().replace(/\s+/g, '_');
  const rawRole = user?.role || localStorage.getItem('role') || 'customer';
  const role = normalizeRole(rawRole);
  const token = localStorage.getItem('token');
  
  console.log('Reports component - User info:', user);
  console.log('Reports component - Token exists:', !!token);
  console.log('Reports component - Raw role:', rawRole);
  console.log('Reports component - Normalized role:', role);
  
  const availableReports = REPORTS_BY_ROLE[role] || REPORTS_BY_ROLE['customer'];
  const [activeTab, setActiveTab] = useState(availableReports[0].key);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [meterReadings, setMeterReadings] = useState([]); // For encoder
  const [error, setError] = useState('');
  const [timePeriod, setTimePeriod] = useState('custom'); // daily, weekly, monthly, yearly, custom
  const [groupBy, setGroupBy] = useState('day'); // day, week, month, year
  const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState('');

  // Helper function to format dates in local time (avoid UTC conversion)
  const formatDateLocal = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [customers, setCustomers] = useState([]);
  const [showLedger, setShowLedger] = useState(false);
  const [selectedMonthForBillingSheet, setSelectedMonthForBillingSheet] = useState('DECEMBER');
  const [selectedYearForBillingSheet, setSelectedYearForBillingSheet] = useState('2024');
  const [selectedCollectorForBillingSheet, setSelectedCollectorForBillingSheet] = useState('ALL');
  const [availableZones, setAvailableZones] = useState([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const [showBillingSheet, setShowBillingSheet] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [previewPDF, setPreviewPDF] = useState(null);

  // Fetch customers when ledger tab is active
  useEffect(() => {
    if (activeTab === 'ledger') {
      fetchCustomers();
    } else {
      // Clear customer selection when switching away from ledger tab
      setSelectedCustomerForLedger('');
    }
  }, [activeTab]);

  // Fetch customers for ledger
  const fetchCustomers = async () => {
    try {
      const res = await apiClient.get('/customers');
      const data = res.data;
      setCustomers(Array.isArray(data) ? data : []);
      console.log('Fetched customers for ledger:', Array.isArray(data) ? data.length : 0);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setCustomers([]);
    }
  };

  // Fetch available zones for billing sheet
  const fetchAvailableZones = useCallback(async () => {
    setLoadingZones(true);
    try {
      const monthNum = getMonthNumber(selectedMonthForBillingSheet) + 1;
      const res = await apiClient.get('/reports/billing-sheet-zones', {
        params: { month: monthNum, year: selectedYearForBillingSheet }
      });
      setAvailableZones(res.data || []);
      // If current selection is not in available zones, reset to 'ALL'
      if (selectedCollectorForBillingSheet !== 'ALL' && 
          !res.data.includes(selectedCollectorForBillingSheet)) {
        setSelectedCollectorForBillingSheet('ALL');
      }
    } catch (err) {
      console.error('Error fetching zones:', err);
      setAvailableZones([]);
    } finally {
      setLoadingZones(false);
    }
  }, [selectedMonthForBillingSheet, selectedYearForBillingSheet, selectedCollectorForBillingSheet]);

  // Fetch available zones when billing sheet tab is active or month/year changes
  useEffect(() => {
    if (activeTab === 'billing-sheet') {
      fetchAvailableZones();
    }
  }, [activeTab, selectedMonthForBillingSheet, selectedYearForBillingSheet, fetchAvailableZones]);

  const getMonthNumber = (monthName) => {
    const months = {
      'JANUARY': 0, 'FEBRUARY': 1, 'MARCH': 2, 'APRIL': 3,
      'MAY': 4, 'JUNE': 5, 'JULY': 6, 'AUGUST': 7,
      'SEPTEMBER': 8, 'OCTOBER': 9, 'NOVEMBER': 10, 'DECEMBER': 11
    };
    return months[monthName.toUpperCase()] || 0;
  };

  // Helper function to get date ranges for predefined periods
  const getDateRange = (period) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const date = today.getDate();

    switch (period) {
      case 'today':
        const todayStr = formatDateLocal(today);
        return { from: todayStr, to: todayStr };
      
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(date - 1);
        const yesterdayStr = formatDateLocal(yesterday);
        return { from: yesterdayStr, to: yesterdayStr };
      
      case 'this-week':
        const weekStart = new Date(today);
        weekStart.setDate(date - today.getDay()); // Start of week (Sunday)
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
        return {
          from: formatDateLocal(weekStart),
          to: formatDateLocal(weekEnd)
        };
      
      case 'last-week':
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(date - today.getDay() - 7); // Last week start
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6); // Last week end
        return {
          from: formatDateLocal(lastWeekStart),
          to: formatDateLocal(lastWeekEnd)
        };
      
      case 'this-month':
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        return {
          from: formatDateLocal(monthStart),
          to: formatDateLocal(monthEnd)
        };
      
      case 'last-month':
        const lastMonthStart = new Date(year, month - 1, 1);
        const lastMonthEnd = new Date(year, month, 0);
        return {
          from: formatDateLocal(lastMonthStart),
          to: formatDateLocal(lastMonthEnd)
        };
      
      case 'this-quarter':
        const quarter = Math.floor(month / 3);
        const quarterStart = new Date(year, quarter * 3, 1);
        const quarterEnd = new Date(year, quarter * 3 + 3, 0);
        return {
          from: formatDateLocal(quarterStart),
          to: formatDateLocal(quarterEnd)
        };
      
      case 'this-year':
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31);
        return {
          from: formatDateLocal(yearStart),
          to: formatDateLocal(yearEnd)
        };
      
      case 'last-year':
        const lastYearStart = new Date(year - 1, 0, 1);
        const lastYearEnd = new Date(year - 1, 11, 31);
        return {
          from: formatDateLocal(lastYearStart),
          to: formatDateLocal(lastYearEnd)
        };
      
      case 'last-30-days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(date - 30);
        return {
          from: formatDateLocal(thirtyDaysAgo),
          to: formatDateLocal(today)
        };
      
      case 'last-90-days':
        const ninetyDaysAgo = new Date(today);
        ninetyDaysAgo.setDate(date - 90);
        return {
          from: formatDateLocal(ninetyDaysAgo),
          to: formatDateLocal(today)
        };
      
      default:
        return { from: '', to: '' };
    }
  };

  // Handle time period change
  const handleTimePeriodChange = (period) => {
    setTimePeriod(period);
    if (period !== 'custom') {
      const dateRange = getDateRange(period);
      setFrom(dateRange.from);
      setTo(dateRange.to);
    }
  };

  useEffect(() => {
    // Check if user is logged in
    if (!user || !token) {
      setError('Please log in to view reports');
      return;
    }
    
    console.log('Reports component - User info:', user);
    console.log('Reports component - Token exists:', !!token);
    console.log('Reports component - Role:', role);
    console.log('Reports component - Available reports:', availableReports);
    console.log('Reports component - activeTab:', activeTab, 'role:', role);
    
    if (activeTab === 'meter-reading') {
      fetchMeterReadings();
    } else if (activeTab === 'billing-sheet' || activeTab === 'ledger') {
      // These tabs render custom components that fetch their own data
      setData([]);
      setError('');
      setLoading(false);
    } else {
      fetchData();
    }
    // eslint-disable-next-line
  }, [activeTab, from, to, timePeriod, groupBy]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    if (!token) {
      setError('Authentication token not found. Please log in again.');
      setLoading(false);
      return;
    }
    
    let url = `/reports/${activeTab}`;
    const params = [];
    if (from) params.push(`startDate=${from}`);
    if (to) params.push(`endDate=${to}`);
    if (activeTab === 'collection' && groupBy !== 'day') params.push(`groupBy=${groupBy}`);
    if (params.length) url += '?' + params.join('&');
    
    console.log('Fetching report data from:', url);
    console.log('User token:', token ? 'Token exists' : 'No token');
    
    try {
      const res = await apiClient.get(url);
      console.log('Report data received:', res.data);
      
      // Handle enhanced collection summary response format
      if (res.data && res.data.data && Array.isArray(res.data.data)) {
        setData(res.data.data);
      } else if (Array.isArray(res.data)) {
        setData(res.data);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('Error fetching report data:', err.response || err);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('Access denied. You do not have permission to view this report.');
      } else {
        setError(`Error loading report: ${err.response?.data?.message || err.message}`);
      }
      
      setData([]);
    }
    setLoading(false);
  };

  // Encoder: fetch customers for meter reading
  const fetchMeterReadings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/customers');
      setMeterReadings(res.data);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setMeterReadings([]);
    }
    setLoading(false);
  };

  // Encoder: submit meter reading
  const submitReading = async (customerId, reading) => {
    try {
      await apiClient.post(`/meter-readings`, { customerId, reading });
      fetchMeterReadings();
    } catch (err) {
      console.error('Error submitting reading:', err);
      alert('Failed to submit reading');
    }
  };

  // Generate PDF content (for both preview and export)
  const generatePDFContent = () => {
    if (!data.length) {
      return null;
    }

    // Use landscape orientation for all reports to give columns more horizontal space
    const isWideReport = true;
    const doc = new jsPDF('l', 'mm', 'a4');
    
    // Find the current report label
    const currentReport = availableReports.find(report => report.key === activeTab);
    const reportTitle = currentReport ? currentReport.label : `${activeTab} Report`;
    
    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(reportTitle, 20, 20);
    
    // Add subtitle with date range
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const dateRange = from && to ? `Period: ${from} to ${to}` : 'All Time';
    doc.text(dateRange, 20, 30);
    
    // Add current date/time
    const currentDate = new Date().toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Generated on: ${currentDate}`, 20, 36);
    
    // Prepare table data
    const columns = Object.keys(data[0]).map(col => {
      // Convert column names to user-friendly labels (remove any currency symbols and underscores)
      let label;
      const normalizedCol = col.toLowerCase();
      switch(normalizedCol) {
        case 'date': label = 'Date'; break;
        case 'paymentcount': label = 'Payment Count'; break;
        case 'averageamount': label = 'Average Amount'; break;
        case 'source': label = 'Payment Source'; break;
        case 'customername': label = 'Customer Name'; break;
        case 'amountdue': label = 'Amount Due'; break;
        case 'due_date': label = 'Due Date'; break;
        case 'daysoverdue': label = 'Days Overdue'; break;
        case 'lastpayment': label = 'Last Payment'; break;
        case 'accountnumber': label = 'Account Number'; break;
        case 'transaction_id': label = 'Transaction ID'; break;
        case 'customer_id': label = 'Customer ID'; break;
        case 'amount_paid': label = 'Amount Paid'; break;
        case 'payment_date': label = 'Payment Date'; break;
        case 'payment_method': label = 'Payment Method'; break;
        case 'receipt_number': label = 'Receipt #'; break;
        case 'customer_name': label = 'Customer Name'; break;
        case 'meter_number': label = 'Meter Number'; break;
        case 'transaction_type': label = 'Transaction Type'; break;
        case 'month': label = 'Month'; break;
        case 'totalrevenue': label = 'Total Revenue'; break;
        case 'collectedamount': label = 'Collected Amount'; break;
        case 'billedamount': label = 'Billed Amount'; break;
        case 'collectionrate': label = 'Collection Rate (%)'; break;
        case 'activecustomers': label = 'Active Customers'; break;
        case 'totalbilled': label = 'Total Billed'; break;
        case 'totalcollected': label = 'Total Collected'; break;
        case 'unpaidbills': label = 'Unpaid Bills'; break;
        case 'averagebillamount': label = 'Average Bill Amount'; break;
        default: 
          // Humanize generic column names:
          // - replace underscores with spaces
          // - insert spaces before capital letters
          // - normalize spacing and capitalize first letter
          label = col
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/^./, str => str.toUpperCase());
          // Remove any currency symbols from the label
          label = label.replace(/\$\s*/g, '').replace(/₱\s*/g, '').trim();
      }
      return label;
    });
    
    const rows = data.map(row => 
      Object.keys(data[0]).map(col => {
        const value = row[col];
        // Format values appropriately
        // Special handling for Audit Log descriptions: inject peso sign into "payment of 407.00" style text
        if (activeTab === 'audit' && col.toLowerCase() === 'description' && typeof value === 'string') {
          return value.replace(/(payment\s+of\s+)([+-]?\d+(?:\.\d+)?)/gi, (match, prefix, numStr) => {
            const num = Number(numStr);
            if (isNaN(num)) return match;
            const formatted = num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return `${prefix}₱${formatted}`;
          });
        }
        if ((col.includes('date') || col.includes('created_at') || col.includes('updated_at') || col.includes('submitted_at') || col.includes('payment_date') || col.includes('due_date') || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value))) && value) {
          try {
            const date = new Date(value);
            return isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
          } catch {
            return value;
          }
        } else if ((col.includes('amount') || col.includes('collected') || col.includes('billed') || col.includes('revenue')) && !col.includes('average')) {
          // Monetary fields – format with commas and 2 decimals, avoid long floating tails
          const num = Number(value);
          if (isNaN(num)) return value;
          return num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else if (col.includes('average') && (col.includes('amount') || col.includes('bill')) && value !== null && value !== undefined && value !== '') {
          // Averages – still monetary, but keep 2 decimals consistent
          const num = Number(value);
          if (isNaN(num)) return value;
          return num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else if ((col.includes('rate') || col.includes('collectionrate')) && value !== null && value !== undefined && value !== '') {
          // Rates as percent, clamp to 2 decimals
          const num = Number(value);
          if (isNaN(num)) return value;
          return `${num.toFixed(2)}%`;
        } else if ((col.includes('count') || col.includes('quantity')) && typeof value === 'number') {
          // Format count as integer (no decimals)
          return Math.round(value).toLocaleString('en-PH');
        } else if ((col.includes('days') && col.includes('overdue')) || col.includes('daysoverdue')) {
          // Format days overdue as integer (no decimals)
          return Math.round(Number(value)).toString();
        } else if (col.includes('account') && col.includes('number')) {
          // Remove commas from account number - ensure clean formatting
          if (value === null || value === undefined || value === '') return '';
          const str = typeof value === 'number' ? value.toString() : String(value);
          return str.replace(/,/g, '').trim();
        } else if (col.includes('account') && col.includes('name')) {
          if (value === null || value === undefined || value === '') return '';
          return String(value).replace(/,/g, '').trim();
        }
        return value;
      })
    );
    
    // Add summary if applicable
    const summary = calculateSummary();
    let startY = 45;
    
    if (summary && Object.keys(summary).length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary:', 20, startY);
      startY += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      Object.entries(summary).forEach(([key, value]) => {
        const label = columns[Object.keys(data[0]).indexOf(key)] || key;
        let formattedValue;
        if (key.includes('count') || key.includes('quantity')) {
          // Format count as integer (no decimals, no currency)
          formattedValue = Math.round(Number(value)).toLocaleString('en-PH');
        } else if (key.includes('amount') || key.includes('total') || key.includes('collected') || key.includes('billed') || key.includes('paid')) {
          // Format amounts with peso currency, reduce unnecessary decimals
          if (typeof value === 'number') {
            const options = value % 1 === 0
              ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
              : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
            formattedValue = `₱${value.toLocaleString('en-PH', options)}`;
          } else {
            formattedValue = value;
          }
        } else {
          formattedValue = value;
        }
        doc.text(`${label}: ${formattedValue}`, 20, startY);
        startY += 6;
      });
      startY += 10;
    }
    
    // Add the table
    doc.autoTable({
      head: [columns],
      body: rows,
      startY: startY,
      styles: {
        fontSize: isWideReport ? 8 : 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [66, 139, 202], // Blue header
        textColor: 255,
        fontStyle: 'bold',
        fontSize: isWideReport ? 8 : 9,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      // Slightly smaller side margins for wide tables
      margin: isWideReport
        ? { top: startY, right: 10, bottom: 20, left: 10 }
        : { top: startY, right: 20, bottom: 20, left: 20 }
    });
    
    // Add page number and footer
    const finalY = doc.internal.pageSize.height - 15;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Dolores Water District - Billing System', 20, finalY);
    doc.text(`Page 1`, doc.internal.pageSize.width - 30, finalY, { align: 'right' });
    
    return doc;
  };

  // Export PDF directly
  const exportPDF = () => {
    const doc = generatePDFContent();
    if (!doc) {
      alert('No data to export');
      return;
    }
    doc.save(`${activeTab}_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Preview PDF
  const previewPDFReport = () => {
    const doc = generatePDFContent();
    if (!doc) {
      alert('No data to preview');
      return;
    }
    
    // Convert PDF to data URL for preview
    const pdfDataUrl = doc.output('datauristring');
    setPreviewPDF(pdfDataUrl);
    setShowPDFPreview(true);
  };

  // Calculate summary statistics for collections
  const calculateSummary = () => {
    if (!data.length) return null;
    
    const totals = data.reduce((acc, row) => {
      // Look for amount-related fields
      Object.entries(row).forEach(([key, value]) => {
        if (/amount|total|balance|revenue|payment|paid|collection/i.test(key) && !isNaN(value)) {
          acc[key] = (acc[key] || 0) + Number(value);
        }
        if (/count|quantity/i.test(key) && !isNaN(value)) {
          acc[key] = (acc[key] || 0) + Number(value);
        }
      });
      return acc;
    }, {});
    
    return totals;
  };

  // Premium Table Renderer
  const renderTable = () => {
    const summary = calculateSummary();
    
    return (
      <div className="space-y-6">
        {/* Premium Summary Cards */}
        {(activeTab === 'collection' || activeTab === 'revenue') && summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Object.entries(summary).map(([key, value]) => (
              <div key={key} className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </h3>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2">
                      {/amount|total|balance|revenue|payment|paid|collection/i.test(key) && !/count/i.test(key)
                        ? formatNumber(Number(value))
                        : /count/i.test(key)
                        ? Math.round(Number(value)).toLocaleString()
                        : Number(value).toLocaleString()
                      }
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {/amount|revenue|payment|paid/i.test(key) ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      )}
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Premium Data Table */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {activeTab.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Data
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {data.length} records
              </span>
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            {data.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Data Available</h3>
                <p className="text-gray-500 mb-4">
                  We couldn't find any data for the selected criteria.
                </p>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>• No data exists in the database yet</p>
                  <p>• The selected date range has no records</p>
                  <p>• There was an error fetching the data</p>
                </div>
                <button 
                  onClick={fetchData}
                  className="mt-6 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    {data[0] && Object.keys(data[0]).map((col, index) => {
                      // Clean column header - remove dollar signs and other currency symbols
                      let headerText = col
                        .replace(/_/g, ' ')
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/\s+/g, ' ')
                        .trim()
                        .replace(/^./, str => str.toUpperCase());
                      headerText = headerText.replace(/\$\s*/g, '').replace(/₱\s*/g, '').trim();
                      return (
                        <th key={col} className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center space-x-1">
                            <span>{headerText}</span>
                            {/amount|revenue|payment/i.test(col) && !/count/i.test(col) && (
                              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {data.map((row, idx) => (
                    <tr key={idx} className={`hover:bg-blue-50 transition-colors duration-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      {Object.entries(row).map(([col, val], i) => (
                        <td key={i} className="px-6 py-4 whitespace-nowrap text-sm">
                          {(/amount|total|balance|revenue|payment|due|paid|fee|charge|price|cost/i.test(col) && !isNaN(val) && !/count/i.test(col)) ? (
                            <div className="flex items-center">
                              <span className="font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                {(() => {
                                  const num = Number(val);
                                  if (isNaN(num)) return val;
                                  // Always show as peso currency in UI summaries
                                  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                })()}
                              </span>
                            </div>
                          ) : (/accountnumber|account.*number/i.test(col)) ? (
                            <div className="flex items-center">
                              <span className="font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                                {(() => {
                                  if (val === null || val === undefined || val === '') return '';
                                  // Remove all commas and ensure it's a clean number string
                                  const str = typeof val === 'number' ? val.toString() : String(val);
                                  return str.replace(/,/g, '').trim();
                                })()}
                              </span>
                            </div>
                          ) : (/accountname|account_name|customername/i.test(col) && typeof val === 'string') ? (
                            <span className="text-gray-700 font-medium">
                              {val.replace(/,/g, '').trim()}
                            </span>
                          ) : (/count|quantity/i.test(col) && !isNaN(val)) ? (
                            <div className="flex items-center">
                              <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                {Math.round(Number(val)).toLocaleString()}
                              </span>
                            </div>
                          ) : (/daysoverdue|days.*overdue/i.test(col) && !isNaN(val)) ? (
                            <div className="flex items-center">
                              <span className="font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                                {Math.round(Number(val))}
                              </span>
                            </div>
                          ) : (/rate|collectionrate/i.test(col) && !isNaN(val)) ? (
                            <div className="flex items-center">
                              <span className="font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                                {Number(val).toFixed(2)}%
                              </span>
                            </div>
                          ) : (/lastpayment/i.test(col) && val) ? (
                            <span className="text-gray-700 font-medium">
                              {(() => {
                                try {
                                  const date = new Date(val);
                                  return isNaN(date.getTime()) ? val : date.toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  });
                                } catch {
                                  return val;
                                }
                              })()}
                            </span>
                          ) : ((/date|created_at|updated_at|submitted_at|payment_date|due_date/i.test(col) || /^\d{4}-\d{2}-\d{2}T/.test(val)) && val) ? (
                            <span className="text-gray-700 font-medium">
                              {(() => {
                                try {
                                  const date = new Date(val);
                                  return isNaN(date.getTime()) ? val : date.toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  });
                                } catch {
                                  return val;
                                }
                              })()}
                            </span>
                          ) : (/status/i.test(col)) ? (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              val === 'Paid' || val === 'Active' || val === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : val === 'Unpaid' || val === 'Pending' 
                                ? 'bg-yellow-100 text-yellow-800'
                                : val === 'Overdue' || val === 'Rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {val}
                            </span>
                          ) : (
                            <span className="text-gray-700 font-medium">{val}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Encoder: Meter reading input UI
  const renderMeterReading = () => (
    <div>
      <h3 className="font-bold mb-2">Input Meter Readings</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 text-xs md:text-sm">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Customer</th>
              <th className="px-4 py-2 border">Current Reading</th>
              <th className="px-4 py-2 border">New Reading</th>
              <th className="px-4 py-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {meterReadings.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-4">No customers</td></tr>
            ) : (
              meterReadings.map((cust, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 border">{cust.name || cust.first_name + ' ' + cust.last_name}</td>
                  <td className="px-4 py-2 border">{cust.current_reading || '-'}</td>
                  <td className="px-4 py-2 border">
                    <input type="number" min="0" className="border rounded px-2 w-24" id={`reading-${cust.id}`} />
                  </td>
                  <td className="px-4 py-2 border">
                    <button className="bg-blue-600 text-white px-2 py-1 rounded" onClick={() => {
                      const val = document.getElementById(`reading-${cust.id}`).value;
                      if (val) submitReading(cust.id, val);
                    }}>Submit</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Customer Ledger UI
  const renderLedger = () => (
    <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Customer Ledger Report
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Customer Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Customer
          </label>
          <select
            value={selectedCustomerForLedger}
            onChange={(e) => setSelectedCustomerForLedger(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2 bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
          >
            <option value="">Choose a customer...</option>
            {customers.length === 0 ? (
              <option value="" disabled>Loading customers...</option>
            ) : (
              customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.first_name} {customer.last_name} {customer.meter_number ? `(Meter: ${customer.meter_number})` : ''}
                </option>
              ))
            )}
          </select>
          {customers.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">No customers available</p>
          )}
        </div>

        {/* Customer Info Display */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Information
          </label>
          {selectedCustomerForLedger ? (
            <div className="p-3 bg-gray-50 rounded-xl border">
              {(() => {
                const customer = customers.find(c => c.id === parseInt(selectedCustomerForLedger));
                return customer ? (
                  <>
                    <p><strong>Name:</strong> {customer.first_name} {customer.last_name}</p>
                    <p><strong>Address:</strong> {customer.street || ''}, {customer.barangay || ''}, {customer.city || ''}, {customer.province || ''}</p>
                    <p><strong>Meter:</strong> {customer.meter_number || 'N/A'}</p>
                  </>
                ) : (
                  <p className="text-gray-500">Customer not found</p>
                );
              })()}
            </div>
          ) : (
            <div className="p-3 bg-gray-50 rounded-xl border text-gray-500">
              Select a customer to see their information
            </div>
          )}
        </div>
      </div>

      {/* Generate Ledger Button */}
      <div className="text-center">
        <button
          onClick={() => setShowLedger(true)}
          disabled={!selectedCustomerForLedger}
          className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
            selectedCustomerForLedger
              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Generate Customer Ledger
        </button>
      </div>

      {/* Ledger Modal */}
      {showLedger && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50 p-4 ledger-modal">
          <div className="bg-white rounded-lg shadow-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Customer Ledger Card</h2>
                <button
                  onClick={() => setShowLedger(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <CustomerLedger
                customerId={parseInt(selectedCustomerForLedger)}
                onClose={() => setShowLedger(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Daily Collector Billing Sheet UI
  const renderBillingSheet = () => (
    <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Daily Collector Billing Sheet Report
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Month Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Month
          </label>
          <select
            value={selectedMonthForBillingSheet}
            onChange={(e) => setSelectedMonthForBillingSheet(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2 bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
          >
            <option value="JANUARY">JANUARY</option>
            <option value="FEBRUARY">FEBRUARY</option>
            <option value="MARCH">MARCH</option>
            <option value="APRIL">APRIL</option>
            <option value="MAY">MAY</option>
            <option value="JUNE">JUNE</option>
            <option value="JULY">JULY</option>
            <option value="AUGUST">AUGUST</option>
            <option value="SEPTEMBER">SEPTEMBER</option>
            <option value="OCTOBER">OCTOBER</option>
            <option value="NOVEMBER">NOVEMBER</option>
            <option value="DECEMBER">DECEMBER</option>
          </select>
        </div>

        {/* Year Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Year
          </label>
          <select
            value={selectedYearForBillingSheet}
            onChange={(e) => setSelectedYearForBillingSheet(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2 bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
          >
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>
        </div>

        {/* Zone/Collector Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Zone/Collector
          </label>
          <select
            value={selectedCollectorForBillingSheet}
            onChange={(e) => setSelectedCollectorForBillingSheet(e.target.value)}
            disabled={loadingZones}
            className="w-full border border-gray-300 rounded-xl px-4 py-2 bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="ALL">All Zones</option>
            {availableZones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
          {loadingZones && (
            <p className="text-xs text-gray-500 mt-1">Loading zones...</p>
          )}
          {!loadingZones && availableZones.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">No zones found for this period</p>
          )}
        </div>
      </div>

      {/* Generate Billing Sheet Button */}
      <div className="text-center">
        <button
          onClick={() => setShowBillingSheet(true)}
          className="px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600"
        >
          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Generate Daily Collector Billing Sheet
        </button>
      </div>

      {/* Billing Sheet Modal */}
      {showBillingSheet && (
        <div className="billing-sheet-modal fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-full w-full max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  Daily Collector Billing Sheet - {selectedMonthForBillingSheet} {selectedYearForBillingSheet}
                </h2>
                <button
                  onClick={() => setShowBillingSheet(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <BillingSheet
                month={selectedMonthForBillingSheet}
                year={selectedYearForBillingSheet}
                collector={selectedCollectorForBillingSheet === 'ALL' ? '' : selectedCollectorForBillingSheet}
                onClose={() => setShowBillingSheet(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Premium Header */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Analytics Dashboard
                </h1>
                <p className="text-gray-600 mt-1">Comprehensive reporting for your account</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-xl shadow-lg">
                  <span className="font-semibold">{availableReports.length}</span>
                  <span className="text-blue-100 ml-1">Reports</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Tab Navigation */}
        <div className="mb-6">
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-2">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
              {availableReports.map(tab => (
                <button
                  key={tab.key}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeTab === tab.key 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105' 
                      : 'text-gray-600 hover:bg-white/60 hover:text-blue-600 hover:shadow-md'
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {activeTab !== 'meter-reading' && (
          <div className="mb-6">
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
                Report Filters
              </h3>
              
              {/* Premium Filter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quick Filters</label>
                  <select 
                    value={timePeriod} 
                    onChange={e => handleTimePeriodChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                  >
                    <option value="custom">Custom Range</option>
                    <optgroup label="Daily">
                      <option value="today">Today</option>
                      <option value="yesterday">Yesterday</option>
                    </optgroup>
                    <optgroup label="Weekly">
                      <option value="this-week">This Week</option>
                      <option value="last-week">Last Week</option>
                    </optgroup>
                    <optgroup label="Monthly">
                      <option value="this-month">This Month</option>
                      <option value="last-month">Last Month</option>
                      <option value="last-30-days">Last 30 Days</option>
                    </optgroup>
                    <optgroup label="Quarterly">
                      <option value="this-quarter">This Quarter</option>
                      <option value="last-90-days">Last 90 Days</option>
                    </optgroup>
                    <optgroup label="Yearly">
                      <option value="this-year">This Year</option>
                      <option value="last-year">Last Year</option>
                    </optgroup>
                  </select>
                </div>
                
                {(activeTab === 'collection' || activeTab === 'revenue') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
                    <select 
                      value={groupBy} 
                      onChange={e => setGroupBy(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2 bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                    >
                      <option value="day">Daily</option>
                      <option value="week">Weekly</option>
                      <option value="month">Monthly</option>
                      <option value="year">Yearly</option>
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                  <input 
                    type="date" 
                    value={from} 
                    onChange={e => {
                      setFrom(e.target.value);
                      setTimePeriod('custom');
                    }} 
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                    disabled={timePeriod !== 'custom'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                  <input 
                    type="date" 
                    value={to} 
                    onChange={e => {
                      setTo(e.target.value);
                      setTimePeriod('custom');
                    }} 
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                    disabled={timePeriod !== 'custom'}
                  />
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={fetchData} 
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center"
                  disabled={loading}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loading ? 'Loading...' : 'Refresh Data'}
                </button>
                
                <button 
                  onClick={previewPDFReport} 
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center"
                  disabled={loading || data.length === 0}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview PDF
                </button>
                
                <button 
                  onClick={exportPDF} 
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center"
                  disabled={loading || data.length === 0}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export PDF
                </button>
              </div>
              
              {timePeriod !== 'custom' && from && to && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div className="text-sm text-blue-800">
                    <span className="font-semibold">Selected Period:</span> {from} to {to}
                    {timePeriod && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 rounded-md text-blue-700 font-medium">
                        {timePeriod.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {loading ? (
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-16 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading report data...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-red-700 font-medium">{error}</span>
                </div>
              </div>
            )}
            {activeTab === 'meter-reading' ? renderMeterReading() : 
             activeTab === 'ledger' ? renderLedger() : 
             activeTab === 'billing-sheet' ? renderBillingSheet() : 
             renderTable()}
          </>
        )}
      </div>

      {/* PDF Preview Modal */}
      {showPDFPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">
                PDF Preview - {availableReports.find(report => report.key === activeTab)?.label || `${activeTab} Report`}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const doc = generatePDFContent();
                    if (doc) {
                      doc.save(`${activeTab}_report_${new Date().toISOString().split('T')[0]}.pdf`);
                    }
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </button>
                <button
                  onClick={() => {
                    setShowPDFPreview(false);
                    setPreviewPDF(null);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Close
                </button>
              </div>
            </div>

            {/* PDF Preview Content */}
            <div className="flex-1 overflow-auto p-4">
              {previewPDF ? (
                <iframe
                  src={previewPDF}
                  className="w-full h-full border-0 rounded-lg shadow-lg"
                  title="PDF Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-4"></div>
                    <p>Loading PDF preview...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="flex justify-end space-x-2">
                <div className="text-sm text-gray-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Preview shows how the PDF will look when downloaded
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
  
