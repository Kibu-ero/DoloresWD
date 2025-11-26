import React, { useState, useEffect, useCallback } from 'react';
import { FiDownload, FiPrinter, FiRefreshCw } from 'react-icons/fi';
import CustomerService from '../services/customer.service';
import BillingService from '../services/billing.service';
import apiClient from '../api/client';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const CustomerLedger = ({ 
  customerId,
  isPrintable = false,
  onClose
}) => {
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get current user for "Prepared by"
  const getCurrentUser = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.firstName && user.lastName) {
          return `${user.firstName} ${user.lastName}`;
        } else if (user.name) {
          return user.name;
        } else if (user.username) {
          return user.username;
        }
      }
    } catch (e) {
      console.error('Error getting current user:', e);
    }
    return '';
  };

  // Currency formatting function with commas
  const formatCurrency = (amount) => {
    if (!amount || amount === '' || amount === '0.00') return '';
    const num = parseFloat(amount);
    if (isNaN(num)) return '';
    return num.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const fetchLedgerData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching ledger data for customer:', customerId);

      // Fetch customer data
      const customer = await CustomerService.getCustomerById(customerId);
      console.log('Customer data:', customer);
      console.log('Customer phone_number:', customer.phone_number);
      
      // Fetch all bills for this customer
      const bills = await BillingService.getBillByCustomerId(customerId);
      console.log('Bills data:', bills);
      
      // Fetch payment history
      let payments = [];
      try {
        const paymentResponse = await apiClient.get(`/cashier-billing/customer/${customerId}`);
        const paymentData = paymentResponse.data;
        payments = paymentData.payments || [];
        console.log('Payments data:', payments);
      } catch (paymentError) {
        console.log('No payment data found:', paymentError);
        payments = [];
      }

      // Fetch online payment submissions if any
      try {
        const onlinePaymentsResponse = await apiClient.get(`/payment-submissions/customer/${customerId}`);
        const onlinePayments = onlinePaymentsResponse.data || [];
        console.log('Online payments data:', onlinePayments);
        
        // Merge online payments with cashier payments
        payments = [...payments, ...onlinePayments];
      } catch (onlinePaymentError) {
        console.log('No online payment data found:', onlinePaymentError);
      }

      // Create ledger entries from bills and payments
      const ledgerEntries = [];
      
      // Add bill entries
      bills.forEach(bill => {
        if (bill.bill_id) {
          const billDate = new Date(bill.created_at);
          const consumption = bill.current_reading && bill.previous_reading ? 
            (bill.current_reading - bill.previous_reading) : 0;
          
          ledgerEntries.push({
            date: billDate.toLocaleDateString('en-US', { 
              month: 'numeric', 
              day: 'numeric', 
              year: '2-digit' 
            }),
            particulars: `${billDate.toLocaleDateString('en-US', { month: 'long' }).toUpperCase()} ${billDate.getFullYear()} BILL`,
            reference: bill.bill_id.toString(),
            meterReading: bill.current_reading || '',
            consumption: consumption || '',
            drBillings: parseFloat(bill.amount_due || 0),
            crCollections: 0,
            amount: 0,
            balance: 0
          });

          // Add penalty row if applicable
          if (bill.penalty && parseFloat(bill.penalty) > 0) {
            ledgerEntries.push({
              date: '',
              particulars: 'PENALTY',
              reference: '',
              meterReading: '',
              consumption: '',
              drBillings: parseFloat(bill.penalty),
              crCollections: 0,
              amount: 0,
              balance: 0
            });
          }
        }
      });

      // Add payment entries
      payments.forEach(payment => {
        if (payment.payment_date || payment.created_at) {
          const paymentDate = new Date(payment.payment_date || payment.created_at);
          const amountPaid = parseFloat(payment.amount_paid || payment.amount || 0);
          const penaltyPaid = parseFloat(payment.penalty_paid || 0);
          
          // Create reference string including GCash reference number if available
          let referenceString = payment.receipt_number || payment.id?.toString() || '';
          if (payment.reference_number) {
            referenceString += referenceString ? ` / ${payment.reference_number}` : payment.reference_number;
          }
          
          ledgerEntries.push({
            date: paymentDate.toLocaleDateString('en-US', { 
              month: 'numeric', 
              day: 'numeric', 
              year: '2-digit' 
            }),
            particulars: payment.payment_method ? `PAYMENT (${payment.payment_method.toUpperCase()})` : 'PAYMENT',
            reference: referenceString,
            meterReading: '',
            consumption: '',
            drBillings: 0,
            crCollections: amountPaid,
            amount: penaltyPaid,
            balance: 0
          });
        }
      });

      // Group entries by month and year
      const entriesByMonth = {};
      const entriesWithoutDate = [];
      
      ledgerEntries.forEach(entry => {
        if (entry.date && entry.date.trim() !== '') {
          // Parse date - handle MM/DD/YY format
          let date;
          if (entry.date.includes('/')) {
            const parts = entry.date.split('/');
            if (parts.length === 3) {
              const month = parseInt(parts[0]) - 1;
              const day = parseInt(parts[1]);
              let year = parseInt(parts[2]);
              // Handle 2-digit year
              if (year < 100) {
                year += year < 50 ? 2000 : 1900;
              }
              date = new Date(year, month, day);
            } else {
              date = new Date(entry.date);
            }
          } else {
            date = new Date(entry.date);
          }
          
          if (!isNaN(date.getTime())) {
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!entriesByMonth[monthKey]) {
              entriesByMonth[monthKey] = [];
            }
            entriesByMonth[monthKey].push(entry);
          } else {
            entriesWithoutDate.push(entry);
          }
        } else {
          entriesWithoutDate.push(entry);
        }
      });

      // Create ordered entries for all 12 months of the current year (or year from first entry)
      const currentYear = new Date().getFullYear();
      const orderedEntries = [];
      
      // Get all unique years from entries
      const years = new Set();
      Object.keys(entriesByMonth).forEach(key => {
        years.add(parseInt(key.split('-')[0]));
      });
      const yearToUse = years.size > 0 ? Math.max(...years) : currentYear;
      
      // Create entries for all 12 months, ordered from January to December
      for (let month = 1; month <= 12; month++) {
        const monthKey = `${yearToUse}-${String(month).padStart(2, '0')}`;
        const monthEntries = entriesByMonth[monthKey] || [];
        
        // Sort month entries by date
        monthEntries.sort((a, b) => {
          if (!a.date || !b.date) return 0;
          return new Date(a.date) - new Date(b.date);
        });
        
        // Add entries for this month
        orderedEntries.push(...monthEntries);
        
        // If no entries for this month, add empty placeholder rows
        if (monthEntries.length === 0) {
          const monthName = new Date(yearToUse, month - 1).toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
          orderedEntries.push({
            date: '',
            particulars: `${monthName} ${yearToUse} BILL`,
            reference: '',
            meterReading: '',
            consumption: '',
            drBillings: 0,
            crCollections: 0,
            amount: 0,
            balance: 0,
            isEmpty: true
          });
          orderedEntries.push({
            date: '',
            particulars: 'PENALTY',
            reference: '',
            meterReading: '',
            consumption: '',
            drBillings: 0,
            crCollections: 0,
            amount: 0,
            balance: 0,
            isEmpty: true
          });
          orderedEntries.push({
            date: '',
            particulars: 'PAYMENT',
            reference: '',
            meterReading: '',
            consumption: '',
            drBillings: 0,
            crCollections: 0,
            amount: 0,
            balance: 0,
            isEmpty: true
          });
        }
      }

      // Calculate running balance - need to sort all entries by actual date first
      // Create a combined list of all entries with dates for proper chronological balance calculation
      const allEntriesWithDates = orderedEntries.filter(entry => entry.date && entry.date.trim() !== '');
      
      // Sort by actual date for balance calculation
      allEntriesWithDates.sort((a, b) => {
        if (!a.date || !b.date) return 0;
        // Parse dates for comparison
        let dateA, dateB;
        if (a.date.includes('/')) {
          const partsA = a.date.split('/');
          if (partsA.length === 3) {
            let yearA = parseInt(partsA[2]);
            if (yearA < 100) yearA += yearA < 50 ? 2000 : 1900;
            dateA = new Date(yearA, parseInt(partsA[0]) - 1, parseInt(partsA[1]));
          } else {
            dateA = new Date(a.date);
          }
        } else {
          dateA = new Date(a.date);
        }
        
        if (b.date.includes('/')) {
          const partsB = b.date.split('/');
          if (partsB.length === 3) {
            let yearB = parseInt(partsB[2]);
            if (yearB < 100) yearB += yearB < 50 ? 2000 : 1900;
            dateB = new Date(yearB, parseInt(partsB[0]) - 1, parseInt(partsB[1]));
          } else {
            dateB = new Date(b.date);
          }
        } else {
          dateB = new Date(b.date);
        }
        
        return dateA - dateB;
      });
      
      // Calculate running balance chronologically
      // allEntriesWithDates is already sorted by date, so we can use it directly
      // Create a unique identifier for each entry to track balances
      let entryCounter = 0;
      allEntriesWithDates.forEach(entry => {
        entry._ledgerId = entryCounter++;
      });
      
      // Calculate running balance chronologically
      let runningBalance = 0;
      const balanceMap = new Map(); // Map to store balance for each entry by _ledgerId
      
      allEntriesWithDates.forEach(entry => {
        // Add DR (debit/billings) - increases balance
        const drAmount = parseFloat(entry.drBillings || 0);
        if (drAmount > 0) {
          runningBalance += drAmount;
        }
        // Subtract CR (credit/collections) - decreases balance
        // Note: entry.amount is penalty_paid, which is part of the total payment
        // So we subtract both crCollections (amount_paid) and amount (penalty_paid)
        const crAmount = parseFloat(entry.crCollections || 0);
        const penaltyAmount = parseFloat(entry.amount || 0);
        const totalCredit = crAmount + penaltyAmount;
        if (totalCredit > 0) {
          runningBalance -= totalCredit;
        }
        // Store balance using entry's unique ID
        if (entry._ledgerId !== undefined) {
          balanceMap.set(entry._ledgerId, runningBalance);
        }
      });
      
      // Apply balances to all entries (only for actual transactions, not empty placeholders)
      orderedEntries.forEach(entry => {
        if (entry._ledgerId !== undefined && balanceMap.has(entry._ledgerId)) {
          // This is an actual transaction with a date - use its calculated balance
          entry.balance = balanceMap.get(entry._ledgerId);
        } else if (!entry.isEmpty && entry.date && entry.date.trim() !== '') {
          // For entries with dates but not in balanceMap (shouldn't happen, but just in case)
          entry.balance = runningBalance;
        } else {
          // For empty placeholder entries (BILL, PENALTY, PAYMENT without data), set balance to null/empty
          entry.balance = null;
        }
      });

      // Calculate totals from actual ledger entries (not orderedEntries which may have empty placeholders)
      const totalBillings = ledgerEntries.reduce((sum, entry) => sum + (entry.drBillings || 0), 0);
      const totalCollections = ledgerEntries.reduce((sum, entry) => {
        // Total collections = amount_paid (crCollections) + penalty_paid (amount)
        return sum + (entry.crCollections || 0) + (entry.amount || 0);
      }, 0);
      
      const formattedData = {
        customer: customer,
        ledgerEntries: orderedEntries,
        totalBillings: totalBillings,
        totalCollections: totalCollections,
        currentBalance: runningBalance,
        preparedBy: getCurrentUser()
      };

      console.log('Formatted ledger data:', formattedData);

      setLedgerData(formattedData);
    } catch (err) {
      console.error('Error fetching ledger data:', err);
      setError('FAILED');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  // Fetch ledger data when component mounts
  useEffect(() => {
    if (customerId) {
      fetchLedgerData();
    }
  }, [customerId, fetchLedgerData]);

  const handlePrint = () => {
    try {
      let ledgerNode = document.querySelector('.ledger-wrapper');
      if (!ledgerNode) {
        ledgerNode = document.querySelector('.ledger-container');
      }
      if (!ledgerNode) {
        const modal = document.querySelector('.ledger-modal');
        if (modal) {
          ledgerNode = modal.querySelector('.ledger-wrapper') || modal.querySelector('.ledger-container');
        }
      }

      if (!ledgerNode) {
        console.error('Ledger node not found, using window.print()');
        window.print();
        return;
      }

      const printWindow = window.open('', '_blank', 'width=1200,height=800');
      if (!printWindow) {
        window.print();
        return;
      }

      let stylesheets = '';
      try {
        Array.from(document.styleSheets).forEach((sheet) => {
          try {
            if (sheet.href) {
              stylesheets += `<link rel="stylesheet" href="${sheet.href}">`;
            } else if (sheet.cssRules) {
              let cssText = '';
              Array.from(sheet.cssRules).forEach((rule) => {
                cssText += rule.cssText;
              });
              if (cssText) {
                stylesheets += `<style>${cssText}</style>`;
              }
            }
          } catch {
            /* ignore cross-origin sheet */
          }
        });
      } catch (err) {
        console.warn('Error copying stylesheets:', err);
      }

      const extraStyles = '<style>@page{size:landscape;margin:10mm;} html,body{margin:0;padding:0;background:white !important;} body{-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact;font-family: "Inter", Arial, sans-serif;} *{-webkit-print-color-adjust:exact;print-color-adjust:exact;} .ledger-wrapper{max-width:none !important;width:100% !important;margin:0 !important;padding:24px !important;background:white !important;display:block !important;visibility:visible !important;} .ledger-wrapper *{visibility:visible !important;color:#000 !important;} .ledger-container{width:100% !important;background:white !important;display:block !important;visibility:visible !important;} .ledger-table{width:100% !important;border-collapse:collapse !important;display:table !important;visibility:visible !important;font-size:10px !important;} .ledger-table th,.ledger-table td{border:1px solid #000 !important;padding:4px !important;visibility:visible !important;color:#000 !important;display:table-cell !important;} table{display:table !important;visibility:visible !important;width:100% !important;border-collapse:collapse !important;} tr{display:table-row !important;visibility:visible !important;} td,th{display:table-cell !important;visibility:visible !important;color:#000 !important;border:1px solid #000 !important;padding:4px !important;} div{visibility:visible !important;color:#000 !important;} .grid{display:grid !important;visibility:visible !important;} .flex{display:flex !important;visibility:visible !important;} span{visibility:visible !important;color:#000 !important;} p{visibility:visible !important;color:#000 !important;} h1,h2,h3,h4,h5,h6{visibility:visible !important;color:#000 !important;font-weight:700;} button{display:none !important;} .print\\:hidden{display:none !important;}</style>';

      const doc = printWindow.document;
      doc.open();
      doc.write(`<!doctype html><html><head><meta charset="utf-8"/>${stylesheets}${extraStyles}</head><body></body></html>`);
      doc.close();

      const clonedNode = ledgerNode.cloneNode(true);
      const buttons = clonedNode.querySelectorAll('button');
      buttons.forEach(btn => btn.remove());
      const modalHeaders = clonedNode.querySelectorAll('.sticky, .receipt-modal-header');
      modalHeaders.forEach(header => header.remove());

      doc.body.appendChild(clonedNode);

      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 300);
    } catch (e) {
      console.error('Print error:', e);
      window.print();
    }
  };

  const handleDownload = async () => {
    if (!ledgerData) return;
    
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Add header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('DOLORES WATER DISTRICT', pageWidth / 2, 15, { align: 'center' });
      doc.text('CUSTOMER LEDGER CARD', pageWidth / 2, 25, { align: 'center' });
      
      // Customer information
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Account of: ${ledgerData.customer.first_name} ${ledgerData.customer.last_name}`, 20, 40);
      doc.text(`Address: ${ledgerData.customer.street || ''}, ${ledgerData.customer.barangay || ''}, ${ledgerData.customer.city || ''}, ${ledgerData.customer.province || ''}`, 20, 50);
      doc.text(`Contact Number: ${ledgerData.customer.phone_number || 'N/A'}`, 20, 60);
      doc.text(`Meter Serial No.: ${ledgerData.customer.meter_number || ''}`, 20, 70);
      
      // Prepare table data
      const tableData = ledgerData.ledgerEntries.map(entry => [
        entry.date,
        entry.particulars,
        entry.reference || '',
        entry.meterReading || '',
        entry.consumption || '',
        formatCurrency(entry.drBillings),
        formatCurrency(entry.crCollections + entry.amount),
        formatCurrency(entry.balance)
      ]);
      
      // Add table
      doc.autoTable({
        head: [['Date', 'Particulars', 'Ref.', 'Meter Reading', 'Consumption', 'DR Billings', 'CR Collections', 'Balance']],
        body: tableData,
        startY: 80,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [200, 200, 200] },
        columnStyles: {
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'right' }
        }
      });
      
      // Add summary
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.text(`Total Billings: ${formatCurrency(ledgerData.totalBillings)}`, 20, finalY);
      doc.text(`Total Collections: ${formatCurrency(ledgerData.totalCollections)}`, 20, finalY + 10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Current Balance: ${formatCurrency(ledgerData.currentBalance)}`, 20, finalY + 20);
      
      // Add signatories
      doc.setFont('helvetica', 'normal');
      const preparedBy = ledgerData.preparedBy || '';
      doc.text(`Prepared by: ${preparedBy || '_________________'}`, 20, finalY + 40);
      doc.text('Approved by: Michael Topson', 20, finalY + 60);
      
      // Save the PDF
      doc.save(`customer-ledger-${ledgerData.customer.first_name}-${ledgerData.customer.last_name}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handleRefresh = () => {
    fetchLedgerData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <FiRefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading ledger data...</p>
        </div>
      </div>
    );
  }

  if (ledgerData && ledgerData.ledgerEntries && ledgerData.ledgerEntries.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600 mb-2">No ledger entries for this customer yet.</p>
        <p className="text-gray-400 text-sm mb-4">Create a bill or record a payment to see entries here.</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiRefreshCw className="w-4 h-4 inline mr-2" />
          Refresh
        </button>
      </div>
    );
  }

  if (error && error !== 'FAILED') {
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

  if (!ledgerData) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">No ledger data available</p>
      </div>
    );
  }

  return (
    <div className={`bg-white ledger-wrapper ${isPrintable ? 'p-0' : 'p-6'} max-w-7xl mx-auto print:p-0 print:max-w-none`}>
      {/* Print/Download buttons - hidden when printing */}
      {!isPrintable && (
        <div className="flex justify-end gap-2 mb-4 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPrinter className="w-4 h-4" />
            Print Ledger
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

              {/* Ledger Container */}
        <div className="border-2 border-gray-800 bg-white shadow-lg ledger-container">
        {/* Header Section */}
        <div className="p-4 border-b-2 border-gray-800">
          <div className="grid grid-cols-2 gap-8">
            {/* Left Side - Customer Information */}
            <div className="space-y-3">
              <div className="flex">
                <span className="font-bold w-32">Account of:</span>
                <span className="font-semibold">{ledgerData.customer.first_name} {ledgerData.customer.last_name}</span>
              </div>
              <div className="flex">
                <span className="font-bold w-32">Office/Address:</span>
                <span>{ledgerData.customer.street || ''}, {ledgerData.customer.barangay || ''}, {ledgerData.customer.city || ''}, {ledgerData.customer.province || ''}</span>
              </div>
              <div className="flex">
                <span className="font-bold w-32">Contact Person:</span>
                <span className="border-b border-gray-400 w-32"></span>
              </div>
              <div className="flex">
                <span className="font-bold w-32">Contact Number:</span>
                <span className="font-semibold">{ledgerData.customer.phone_number || 'N/A'}</span>
              </div>
            </div>

            {/* Right Side - Meter Information */}
            <div className="space-y-3">
              <div className="flex">
                <span className="font-bold w-32">Meter Brand & Size:</span>
                <span className="border-b border-gray-400 w-32"></span>
              </div>
              <div className="flex">
                <span className="font-bold w-32">Meter Serial No.:</span>
                <span className="font-semibold">{ledgerData.customer.meter_number || ''}</span>
              </div>
              <div className="flex">
                <span className="font-bold w-32">Classification:</span>
                <span className="border-b border-gray-400 w-32"></span>
              </div>
              <div className="flex">
                <span className="font-bold w-32">No. of Persons using water:</span>
                <span className="border-b border-gray-400 w-32"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center py-2 bg-gray-100 border-b border-gray-300">
          <h1 className="text-2xl font-bold text-gray-800">DOLORES WATER DISTRICT CUSTOMER LEDGER CARD</h1>
        </div>

        {/* Main Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-800 ledger-table">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold">Date</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold">Particulars</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold">Ref.</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold">Meter Reading</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold">Consumption (Cubic Meters)</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold" rowSpan="2">DR Billings</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold" rowSpan="2">CR Collections</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold">Balance</th>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-800 px-2 py-1 text-xs"></th>
                <th className="border border-gray-800 px-2 py-1 text-xs"></th>
                <th className="border border-gray-800 px-2 py-1 text-xs"></th>
                <th className="border border-gray-800 px-2 py-1 text-xs"></th>
                <th className="border border-gray-800 px-2 py-1 text-xs"></th>
                <th className="border border-gray-800 px-2 py-1 text-xs"></th>
              </tr>
            </thead>
            <tbody>
              {ledgerData.ledgerEntries.map((entry, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-800 px-2 py-1 text-xs">{entry.date}</td>
                  <td className="border border-gray-800 px-2 py-1 text-xs font-semibold">{entry.particulars}</td>
                  <td className="border border-gray-800 px-2 py-1 text-xs">{entry.reference}</td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-center">{entry.meterReading}</td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-center">{entry.consumption}</td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-right font-semibold">
                    {entry.drBillings > 0 ? formatCurrency(entry.drBillings) : ''}
                  </td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-right font-semibold">
                    {entry.crCollections > 0 || entry.amount > 0 ? formatCurrency(entry.crCollections + entry.amount) : ''}
                  </td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-right font-bold">
                    {entry.balance !== null && entry.balance !== undefined ? formatCurrency(entry.balance) : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-4 border-t-2 border-gray-800">
          <div className="grid grid-cols-3 gap-8 text-sm">
            <div>
              <span className="font-bold">TOTAL:</span>
            </div>
            <div className="text-right">
              <span className="font-bold">Total Billings: ₱ {formatCurrency(ledgerData.totalBillings)}</span>
            </div>
            <div className="text-right">
              <span className="font-bold">Total Collections: ₱ {formatCurrency(ledgerData.totalCollections)}</span>
            </div>
          </div>
          <div className="mt-2 text-right">
            <span className="font-bold text-lg">Current Balance: ₱ {formatCurrency(ledgerData.currentBalance)}</span>
          </div>
          
          {/* Signatories Section */}
          <div className="mt-8 grid grid-cols-2 gap-8 text-sm">
            <div className="text-center">
              <div className="border-b border-gray-400 w-48 mx-auto mb-2 h-6">
                {ledgerData.preparedBy && (
                  <span className="text-gray-800 font-medium">{ledgerData.preparedBy}</span>
                )}
              </div>
              <span className="font-semibold">Prepared by:</span>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-400 w-48 mx-auto mb-2 h-6">
                <span className="text-gray-800 font-medium">Michael Topson</span>
              </div>
              <span className="font-semibold">Approved by:</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLedger;
