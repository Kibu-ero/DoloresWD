import React, { useState, useEffect, useCallback } from 'react';
import { FiPrinter, FiRefreshCw, FiX } from 'react-icons/fi';
import CustomerService from '../services/customer.service';
import BillingService from '../services/billing.service';
import apiClient from '../api/client';
import { formatCurrency } from '../utils/currencyFormatter';
import { formatName } from '../utils/nameFormatter';

const CustomerReceipt = ({ 
  customerId,
  billId,
  paymentId = null,
  isPrintable = false,
  onClose,
  change: propChange = null // Accept change as prop
}) => {
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReceiptData = useCallback(async () => {
    if (!customerId || !billId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use Promise.allSettled to prevent blocking - fetch all data in parallel
      const [customerResult, billResult, paymentResult] = await Promise.allSettled([
        CustomerService.getCustomerById(customerId),
        BillingService.getBillById(billId).catch(() => {
          // Fallback: try getting bills by customer
          return BillingService.getBillByCustomerId(customerId).then(bills => {
            const foundBill = bills.find(b => b.bill_id === billId || b.id === billId);
            if (!foundBill) throw new Error('Bill not found');
            return foundBill;
          });
        }),
        paymentId 
          ? apiClient.get(`/cashier-billing/customer/${customerId}`).catch(() => ({ data: { payments: [] } }))
          : apiClient.get(`/cashier-billing/customer/${customerId}`).catch(() => ({ data: { payments: [] } }))
      ]);

      // Handle customer data
      if (customerResult.status === 'rejected') {
        throw new Error('Failed to load customer data');
      }
      const customer = customerResult.value;

      // Handle bill data
      if (billResult.status === 'rejected') {
        throw new Error('Failed to load bill data');
      }
      const bill = billResult.value;

      // Handle payment data
      let payment = null;
      if (paymentResult.status === 'fulfilled') {
        const paymentData = paymentResult.value.data;
        if (paymentData.payments && paymentData.payments.length > 0) {
          if (paymentId) {
            payment = paymentData.payments.find(p => 
              p.id === paymentId || 
              p.payment_id === paymentId ||
              (p.bill_id && (p.bill_id === billId || p.bill_id === bill.bill_id || p.bill_id === bill.id))
            );
          } else {
            // Find payment for this bill
            payment = paymentData.payments.find(p => 
              p.bill_id === billId || 
              p.bill_id === bill.bill_id ||
              p.bill_id === bill.id
            );
          }
          // If not found, use the most recent payment
          if (!payment && paymentData.payments.length > 0) {
            payment = paymentData.payments[0];
          }
        }
      }

      const formattedData = {
        customer,
        bill,
        payment
      };

      setReceiptData(formattedData);
    } catch (err) {
      console.error('Error fetching receipt data:', err);
      setError('Failed to load receipt data: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [customerId, billId, paymentId]);

  useEffect(() => {
    fetchReceiptData();
  }, [fetchReceiptData]);

  const handlePrint = () => {
    window.print();
  };

  // Convert number to words (English)
  const numberToWords = (num) => {
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    
    if (num === 0) return 'zero';
    if (num < 20) return ones[num];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const one = num % 10;
      return tens[ten] + (one > 0 ? ' ' + ones[one] : '');
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const remainder = num % 100;
      return ones[hundred] + ' hundred' + (remainder > 0 ? ' ' + numberToWords(remainder) : '');
    }
    if (num < 1000000) {
      const thousand = Math.floor(num / 1000);
      const remainder = num % 1000;
      return numberToWords(thousand) + ' thousand' + (remainder > 0 ? ' ' + numberToWords(remainder) : '');
    }
    return num.toString();
  };

  const amountInWords = (amount) => {
    const wholePart = Math.floor(amount);
    const decimalPart = Math.round((amount - wholePart) * 100);
    let words = numberToWords(wholePart);
    if (decimalPart > 0) {
      words += ' and ' + numberToWords(decimalPart) + ' centavos';
    }
    return words + ' pesos';
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <FiRefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading receipt data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchReceiptData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiRefreshCw className="w-4 h-4 inline mr-2" />
          Retry
        </button>
      </div>
    );
  }

  if (!receiptData) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">No receipt data available</p>
      </div>
    );
  }

  const { customer, bill, payment } = receiptData;
  const formattedCustomerName = formatName(customer.first_name || '', customer.last_name || '');
  const receiptNumber = payment?.receipt_number || payment?.or_number || `RCPT-${billId}-${Date.now()}`;
  const paymentDate = payment?.payment_date || payment?.created_at || new Date().toISOString();

  // Amount that was actually applied to the bill (excluding change)
  const appliedAmount = payment
    ? (parseFloat(payment.amount_paid || payment.amount || 0) +
       parseFloat(payment.penalty_paid || payment.penalty || 0))
    : 0;

  // Change that was given back to the customer (if any)
  const storedChange = payment ? parseFloat(payment.change_given || 0) : 0;

  // Actual cash the customer handed over = applied amount + change
  const tenderedAmount = appliedAmount + (isNaN(storedChange) ? 0 : storedChange);

  const billAmount = parseFloat(bill.amount_due || bill.total_amount || 0);
  const penalty = parseFloat(bill.penalty || 0);
  const totalDue = billAmount + penalty;

  // Use prop change if provided, otherwise prefer stored change from payment,
  // and finally fall back to calculating from tendered amount vs total due
  const change = propChange !== null
    ? parseFloat(propChange)
    : (storedChange || (tenderedAmount > totalDue ? tenderedAmount - totalDue : 0));

  return (
    <div className={`bg-white receipt-wrapper ${isPrintable ? 'p-0' : 'p-6'} max-w-4xl mx-auto print:p-0 print:max-w-none`}>
      {/* Print/Refresh buttons - hidden when printing */}
      {!isPrintable && (
        <div className="flex justify-end gap-2 mb-4 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPrinter className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            onClick={fetchReceiptData}
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
              <FiX className="w-4 h-4" />
              Close
            </button>
          )}
        </div>
      )}

      {/* Receipt Container */}
      <div className="border-2 border-gray-800 bg-white shadow-lg receipt-container print:shadow-none max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="text-center py-3 border-b-2 border-gray-800">
          <h1 className="text-xl font-bold text-gray-800 uppercase">ACKNOWLEDGEMENT RECEIPT</h1>
        </div>

        {/* Receipt Number and Date */}
        <div className="p-3 border-b border-gray-300">
          <div className="flex justify-between text-sm">
            <div>
              <span className="font-semibold">Receipt No.:</span> <span className="font-bold text-red-600">{receiptNumber}</span>
            </div>
            <div>
              <span className="font-semibold">Date:</span> {new Date(paymentDate).toLocaleDateString('en-US', { 
                year: '2-digit', 
                month: 'numeric', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Settlement */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">In settlement of the following:</h3>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Meter No.:</span> {customer.meter_number || 'N/A'}
                </div>
                <div>
                  <span className="font-semibold">Billing Date:</span> {bill.created_at ? new Date(bill.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'numeric', 
                    day: 'numeric' 
                  }) : 'N/A'}
                </div>
                <div>
                  <span className="font-semibold">Due Date:</span> {bill.due_date ? new Date(bill.due_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'numeric', 
                    day: 'numeric' 
                  }) : 'N/A'}
                </div>
                
                <div className="border-t border-gray-300 pt-2 mt-2">
                  {bill.previous_reading && (
                    <div>
                      <span className="font-semibold">Previous Reading:</span> {parseFloat(bill.previous_reading).toFixed(2)}
                    </div>
                  )}
                  {bill.current_reading && (
                    <div>
                      <span className="font-semibold">Current Reading:</span> {parseFloat(bill.current_reading).toFixed(2)}
                    </div>
                  )}
                  {bill.current_reading && bill.previous_reading && (
                    <div>
                      <span className="font-semibold">Consumption (cu.m.):</span> {(bill.current_reading - bill.previous_reading).toFixed(2)}
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total Sales:</span>
                    <span>{formatCurrency(billAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">AD Due:</span>
                    <span>{formatCurrency(totalDue)}</span>
                  </div>
                </div>
                
                <div className="border-t-2 border-gray-800 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-bold underline">TOTAL AMOUNT DUE:</span>
                    <span className="font-bold underline">{formatCurrency(totalDue)}</span>
                  </div>
                </div>
                
                {/* Payment Method */}
                <div className="mt-4">
                  <div className="font-semibold mb-2">Payment Method:</div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1">
                      <input 
                        type="checkbox" 
                        checked={payment?.payment_method?.toLowerCase() === 'cash' || !payment?.payment_method}
                        readOnly
                        className="w-4 h-4"
                      />
                      <span>Cash</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input 
                        type="checkbox" 
                        checked={payment?.payment_method?.toLowerCase() === 'check'}
                        readOnly
                        className="w-4 h-4"
                      />
                      <span>Check</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input 
                        type="checkbox" 
                        checked={payment?.payment_method?.toLowerCase() === 'card'}
                        readOnly
                        className="w-4 h-4"
                      />
                      <span>Card</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Customer Information */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Customer Information:</h3>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Received from:</span> {formattedCustomerName}
                </div>
                <div>
                  <span className="font-semibold">and address at:</span> {[
                    customer.street,
                    customer.barangay,
                    customer.city,
                    customer.province
                  ].filter(Boolean).join(', ')}
                </div>
                <div>
                  <span className="font-semibold">the business style of:</span> Individual
                </div>
                
                {/* Amount Paid Box */}
                {payment && (
                  <>
                    <div className="mt-4 p-3 bg-green-100 border-2 border-green-500 rounded">
                      <div className="font-semibold text-green-800 mb-1">Amount Paid:</div>
                      <div className="text-2xl font-bold text-green-700">
                        {formatCurrency(tenderedAmount || appliedAmount)}
                      </div>
                    </div>
                    
                    {/* Change Box - Always show if payment exists */}
                    {payment && (
                      <div className="mt-2 p-3 bg-yellow-100 border-2 border-yellow-500 rounded">
                        <div className="font-semibold text-yellow-800 mb-1">Change:</div>
                        <div className="text-2xl font-bold text-orange-600">{formatCurrency(change)}</div>
                      </div>
                    )}
                    
                    {/* Amount in Words */}
                    <div className="mt-4 space-y-1 text-sm">
                      <div className="font-semibold">in partial/full payment of:</div>
                      <div className="italic">{amountInWords(tenderedAmount || appliedAmount)}</div>
                      <div className="font-semibold mt-2">the sum of:</div>
                      <div className="italic">{amountInWords(tenderedAmount || appliedAmount)}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t-2 border-gray-800 bg-gray-50">
          <div className="text-center text-xs text-gray-600">
            <p className="mb-1">Thank you for your payment!</p>
            <p>This is an acknowledgement receipt from Dolores Water District</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerReceipt;
