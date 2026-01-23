import React, { useState, useEffect } from 'react';
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
  onClose
}) => {
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReceiptData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch customer data
      const customer = await CustomerService.getCustomerById(customerId);
      
      // Fetch bill data
      const bill = await BillingService.getBillById(billId);
      
      // Fetch payment data if paymentId is provided
      let payment = null;
      if (paymentId) {
        try {
          const paymentResponse = await apiClient.get(`/cashier-billing/customer/${customerId}`);
          const paymentData = paymentResponse.data;
          if (paymentData.payments && paymentData.payments.length > 0) {
            payment = paymentData.payments.find(p => p.id === paymentId) || paymentData.payments[0];
          }
        } catch (paymentError) {
          console.log('Payment data not found:', paymentError);
        }
      } else {
        // Try to get the latest payment for this bill
        try {
          const paymentResponse = await apiClient.get(`/cashier-billing/customer/${customerId}`);
          const paymentData = paymentResponse.data;
          if (paymentData.payments && paymentData.payments.length > 0) {
            // Find payment for this bill
            payment = paymentData.payments.find(p => p.bill_id === billId) || paymentData.payments[0];
          }
        } catch (paymentError) {
          console.log('Payment data not found:', paymentError);
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
      setError('Failed to load receipt data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId && billId) {
      fetchReceiptData();
    }
  }, [customerId, billId, paymentId]);

  const handlePrint = () => {
    window.print();
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
  const amountPaid = payment ? (parseFloat(payment.amount_paid || payment.amount || 0) + parseFloat(payment.penalty_paid || payment.penalty || 0)) : 0;
  const billAmount = parseFloat(bill.amount_due || bill.total_amount || 0);
  const penalty = parseFloat(bill.penalty || 0);
  const totalDue = billAmount + penalty;
  const change = amountPaid > totalDue ? amountPaid - totalDue : 0;

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
      <div className="border-2 border-gray-800 bg-white shadow-lg receipt-container print:shadow-none">
        {/* Header Section */}
        <div className="text-center py-4 border-b-2 border-gray-800">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">DOLORES WATER DISTRICT</h1>
          <p className="text-lg font-semibold text-gray-700">OFFICIAL RECEIPT</p>
        </div>

        {/* Receipt Details */}
        <div className="p-4 border-b border-gray-300">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Receipt No.:</span> {receiptNumber}
            </div>
            <div className="text-right">
              <span className="font-semibold">Date:</span> {new Date(paymentDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4">
          {/* Left Column - Settlement Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <h3 className="font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">SETTLEMENT</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Bill Amount:</span>
                  <span className="font-semibold">{formatCurrency(billAmount)}</span>
                </div>
                {penalty > 0 && (
                  <div className="flex justify-between">
                    <span>Penalty:</span>
                    <span className="font-semibold">{formatCurrency(penalty)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t border-gray-300 pt-1 mt-1">
                  <span>Total Due:</span>
                  <span>{formatCurrency(totalDue)}</span>
                </div>
                {payment && (
                  <>
                    <div className="flex justify-between mt-2">
                      <span>Amount Paid:</span>
                      <span className="font-semibold text-green-600">{formatCurrency(amountPaid)}</span>
                    </div>
                    {change > 0 && (
                      <div className="flex justify-between">
                        <span>Change:</span>
                        <span className="font-semibold">{formatCurrency(change)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Right Column - Customer & Payment Info */}
            <div>
              <h3 className="font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">BILLING DETAILS</h3>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-semibold">Customer:</span> {formattedCustomerName}
                </div>
                <div>
                  <span className="font-semibold">Address:</span> {[
                    customer.street,
                    customer.barangay,
                    customer.city,
                    customer.province
                  ].filter(Boolean).join(', ')}
                </div>
                <div>
                  <span className="font-semibold">Meter No.:</span> {customer.meter_number || 'N/A'}
                </div>
                {bill.current_reading && (
                  <div>
                    <span className="font-semibold">Current Reading:</span> {bill.current_reading}
                  </div>
                )}
                {bill.previous_reading && (
                  <div>
                    <span className="font-semibold">Previous Reading:</span> {bill.previous_reading}
                  </div>
                )}
                {bill.current_reading && bill.previous_reading && (
                  <div>
                    <span className="font-semibold">Consumption:</span> {bill.current_reading - bill.previous_reading} cu.m.
                  </div>
                )}
                {payment && (
                  <div className="mt-2 pt-2 border-t border-gray-300">
                    <div>
                      <span className="font-semibold">Payment Method:</span> {payment.payment_method || 'Cash'}
                    </div>
                    {payment.reference_number && (
                      <div>
                        <span className="font-semibold">Reference:</span> {payment.reference_number}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-gray-800 bg-gray-50">
          <div className="text-center text-xs text-gray-600">
            <p className="mb-1">Thank you for your payment!</p>
            <p>This is an official receipt from Dolores Water District</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerReceipt;
