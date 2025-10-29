import React, { useState, useEffect } from 'react';
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

  // Fetch ledger data when component mounts
  useEffect(() => {
    if (customerId) {
      fetchLedgerData();
    }
  }, [customerId]);

  const fetchLedgerData = async () => {
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

      // Sort entries by date
      ledgerEntries.sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return new Date(a.date) - new Date(b.date);
      });

      // Calculate running balance
      let runningBalance = 0;
      ledgerEntries.forEach(entry => {
        if (entry.drBillings > 0) {
          runningBalance += entry.drBillings;
        }
        if (entry.crCollections > 0) {
          runningBalance -= entry.crCollections;
        }
        if (entry.amount > 0) {
          runningBalance -= entry.amount; // penalty payments
        }
        entry.balance = runningBalance;
      });

      const formattedData = {
        customer: customer,
        ledgerEntries: ledgerEntries,
        totalBillings: ledgerEntries.reduce((sum, entry) => sum + entry.drBillings, 0),
        totalCollections: ledgerEntries.reduce((sum, entry) => sum + entry.crCollections + entry.amount, 0),
        currentBalance: runningBalance
      };

      console.log('Formatted ledger data:', formattedData);

      setLedgerData(formattedData);
    } catch (err) {
      console.error('Error fetching ledger data:', err);
      setError('FAILED');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
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
        formatCurrency(entry.crCollections),
        formatCurrency(entry.amount),
        formatCurrency(entry.balance)
      ]);
      
      // Add table
      doc.autoTable({
        head: [['Date', 'Particulars', 'Ref.', 'Meter Reading', 'Consumption', 'DR Billings', 'CR Collections', 'Amount', 'Balance']],
        body: tableData,
        startY: 80,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [200, 200, 200] },
        columnStyles: {
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'right' },
          8: { halign: 'right' }
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
      doc.text('Prepared by: _________________', 20, finalY + 40);
      doc.text('Approved by: _________________', 20, finalY + 60);
      
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
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold">DR Billings</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold" colSpan="2">CR Collections</th>
                <th className="border border-gray-800 px-2 py-1 text-xs font-bold">Balance</th>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-800 px-2 py-1 text-xs"></th>
                <th className="border border-gray-800 px-2 py-1 text-xs"></th>
                <th className="border border-gray-800 px-2 py-1 text-xs"></th>
                <th className="border border-gray-800 px-2 py-1 text-xs"></th>
                <th className="border border-gray-800 px-2 py-1 text-xs"></th>
                <th className="border border-gray-800 px-2 py-1 text-xs"></th>
                <th className="border border-gray-800 px-2 py-1 text-xs">Amount</th>
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
                    {entry.amount > 0 ? formatCurrency(entry.amount) : ''}
                  </td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-right font-semibold">
                    {entry.crCollections > 0 ? formatCurrency(entry.crCollections) : ''}
                  </td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-right font-bold">
                    {entry.balance !== 0 ? formatCurrency(entry.balance) : ''}
                  </td>
                </tr>
              ))}
              
              {/* Empty rows for remaining months */}
              {Array.from({ length: Math.max(0, 12 - Math.ceil(ledgerData.ledgerEntries.length / 3)) }, (_, i) => {
                const month = new Date().getMonth() + i + 1;
                const monthName = new Date(2025, month - 1).toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
                return (
                  <React.Fragment key={`empty-${i}`}>
                    <tr>
                      <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                      <td className="border border-gray-800 px-2 py-1 text-xs font-semibold">{monthName} 2025 BILL</td>
                      <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                      <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                      <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                      <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                      <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                      <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                      <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                    </tr>
                    <tr>
                      <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                      <td className="border border-gray-800 px-2 py-1 text-xs font-semibold">PENALTY</td>
                      <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                      <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                      <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                      <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                      <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                      <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                      <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                    </tr>
                    <tr>
                      <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                      <td className="border border-gray-800 px-2 py-1 text-xs font-semibold">PAYMENT</td>
                      <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                      <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                      <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                      <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                      <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                      <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                      <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                    </tr>
                  </React.Fragment>
                );
              })}
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
              <div className="border-b border-gray-400 w-32 mx-auto mb-2"></div>
              <span className="font-semibold">Prepared by:</span>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-400 w-32 mx-auto mb-2"></div>
              <span className="font-semibold">Approved by:</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLedger;
