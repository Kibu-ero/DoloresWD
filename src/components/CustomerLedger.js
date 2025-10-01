import React, { useState, useEffect } from 'react';
import { FiDownload, FiPrinter, FiRefreshCw } from 'react-icons/fi';
import CustomerService from '../services/customer.service';
import BillingService from '../services/billing.service';

const CustomerLedger = ({ 
  customerId,
  isPrintable = false,
  onClose
}) => {
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

      // Fetch customer data
      const customer = await CustomerService.getCustomerById(customerId);
      
      // Fetch all bills for this customer
      const bills = await BillingService.getBillByCustomerId(customerId);
      
      // Fetch payment history
      const paymentResponse = await fetch(`http://localhost:3001/api/cashier-billing/customer/${customerId}`);
      const paymentData = await paymentResponse.json();
      const payments = paymentData.payments || [];

      // Create ledger entries from bills and payments
      const ledgerEntries = [];
      
      // Add bill entries
      bills.forEach(bill => {
        if (bill.bill_id) {
          ledgerEntries.push({
            date: new Date(bill.created_at).toLocaleDateString('en-US', { 
              month: 'numeric', 
              day: 'numeric', 
              year: '2-digit' 
            }),
            particulars: `${new Date(bill.created_at).toLocaleDateString('en-US', { month: 'long' }).toUpperCase()} ${new Date(bill.created_at).getFullYear()} BILL`,
            reference: bill.bill_id.toString(),
            meterReading: bill.current_reading || '0',
            consumption: bill.consumption || '0',
            drBillings: bill.amount_due || '0.00',
            crCollections: '',
            amount: '',
            balance: bill.amount_due || '0.00'
          });

          // Add penalty row if applicable
          if (bill.penalty && parseFloat(bill.penalty) > 0) {
            ledgerEntries.push({
              date: '',
              particulars: 'PENALTY',
              reference: '',
              meterReading: '',
              consumption: '',
              drBillings: bill.penalty,
              crCollections: '',
              amount: '',
              balance: '0'
            });
          }
        }
      });

      // Add payment entries
      payments.forEach(payment => {
        if (payment.payment_date) {
          ledgerEntries.push({
            date: new Date(payment.payment_date).toLocaleDateString('en-US', { 
              month: 'numeric', 
              day: 'numeric', 
              year: '2-digit' 
            }),
            particulars: 'PAYMENT',
            reference: payment.receipt_number || payment.id.toString(),
            meterReading: '',
            consumption: '',
            drBillings: '',
            crCollections: payment.amount_paid || '0.00',
            amount: payment.amount_paid || '0.00',
            balance: '0'
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
        if (entry.drBillings && parseFloat(entry.drBillings) > 0) {
          runningBalance += parseFloat(entry.drBillings);
          entry.balance = runningBalance.toFixed(2);
        }
        if (entry.crCollections && parseFloat(entry.crCollections) > 0) {
          runningBalance -= parseFloat(entry.crCollections);
          entry.balance = runningBalance.toFixed(2);
        }
      });

      const formattedData = {
        customer: customer,
        ledgerEntries: ledgerEntries,
        totalBillings: ledgerEntries.reduce((sum, entry) => sum + (parseFloat(entry.drBillings) || 0), 0),
        totalCollections: ledgerEntries.reduce((sum, entry) => sum + (parseFloat(entry.crCollections) || 0), 0),
        currentBalance: runningBalance
      };

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

  const handleDownload = () => {
    console.log('Download functionality to be implemented');
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
    <div className={`bg-white ${isPrintable ? 'p-0' : 'p-6'} max-w-7xl mx-auto`}>
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
                <span className="border-b border-gray-400 w-32"></span>
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
                    {entry.drBillings ? `₱ ${entry.drBillings}` : ''}
                  </td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-right font-semibold">
                    {entry.amount ? `₱ ${entry.amount}` : ''}
                  </td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-right font-semibold">
                    {entry.crCollections ? `₱ ${entry.crCollections}` : ''}
                  </td>
                  <td className="border border-gray-800 px-2 py-1 text-xs text-right font-bold">
                    {entry.balance ? `₱ ${entry.balance}` : ''}
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
              <span className="font-bold">Total Billings: ₱ {ledgerData.totalBillings.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="font-bold">Total Collections: ₱ {ledgerData.totalCollections.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-2 text-right">
            <span className="font-bold text-lg">Current Balance: ₱ {ledgerData.currentBalance.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLedger;
