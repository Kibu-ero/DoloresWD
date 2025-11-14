import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiDownload, FiPrinter, FiRefreshCw } from 'react-icons/fi';
import CustomerService from '../services/customer.service';
import BillingService from '../services/billing.service';
import apiClient from '../api/client';
import jsPDF from 'jspdf';

const CustomerReceipt = ({ 
  customerId,
  billId,
  paymentId,
  isPrintable = false,
  onClose
}) => {
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const receiptRef = useRef(null);

  // Convert number to words (simplified version)
  const numberToWords = useCallback((num) => {
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    
    if (num === 0) return 'zero';
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
      if (num % 10 === 0) return tens[Math.floor(num / 10)];
      return tens[Math.floor(num / 10)] + ' ' + ones[num % 10];
    }
    if (num < 1000) {
      if (num % 100 === 0) return ones[Math.floor(num / 100)] + ' hundred';
      return ones[Math.floor(num / 100)] + ' hundred ' + numberToWords(num % 100);
    }
    
    // For larger numbers, return a simplified version
    return Math.floor(num).toString() + ' pesos';
  }, []);

  const fetchReceiptData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching receipt data for customerId:', customerId, 'billId:', billId, 'paymentId:', paymentId);

      // Fetch customer data
      let customer = null;
      try {
        console.log('🔍 Fetching customer data for ID:', customerId);
        const customerResponse = await CustomerService.getCustomerById(customerId);
        customer = customerResponse;
        console.log('✅ Customer data fetched successfully:', customer);
      } catch (err) {
        console.error('❌ Error fetching customer data:', err);
        console.error('Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          statusText: err.response?.statusText
        });
        throw new Error('Failed to fetch customer information');
      }

      // Fetch bill data
      let bill = null;
      try {
        console.log('🔍 Fetching bill data for ID:', billId);
        const billResponse = await BillingService.getBillById(billId);
        bill = billResponse;
        console.log('✅ Bill data fetched successfully:', bill);
      } catch (err) {
        console.error('❌ Error fetching bill data:', err);
        console.error('Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          statusText: err.response?.statusText
        });
        throw new Error('Failed to fetch bill information');
      }

      // Fetch payment data if paymentId is provided
      let payment = null;
      if (paymentId && paymentId !== null) {
        try {
          const paymentResponse = await apiClient.get(`/cashier-billing/customer/${customerId}`);
          const paymentData = paymentResponse.data;
          const payments = paymentData.payments || [];
          payment = payments.find(p => p.id === parseInt(paymentId)) || payments[0];
        } catch (err) {
          console.log('Could not fetch payment data:', err);
        }
      }

      // Validate required data
      if (!customer) {
        throw new Error('Customer information not found');
      }
      if (!bill) {
        throw new Error('Bill information not found');
      }

      // Format the receipt data
      const formattedData = {
        receiptNumber: payment?.receipt_number || `RCPT-${Date.now()}`,
        date: new Date().toLocaleDateString('en-US', { 
          month: 'numeric', 
          day: 'numeric', 
          year: '2-digit' 
        }),
        customerName: `${customer.first_name} ${customer.last_name}`,
        customerAddress: `${customer.street || ''}, ${customer.barangay || ''}, ${customer.city || ''}, ${customer.province || ''}`.replace(/^,\s*/, '').replace(/,\s*,/g, ','),
        businessStyle: customer.business_style || 'Individual',
        customerTIN: customer.tin || '',
        customerBusiness: customer.business_type || '',
        meterNumber: customer.meter_number || '',
        
        // Bill details
        totalSales: bill?.amount || bill?.amount_due || '0.00',
        scpwdDiscount: customer.senior_citizen ? ((bill?.amount || bill?.amount_due || 0) * 0.20).toFixed(2) : '0.00', // 20% discount for senior citizens
        adDue: bill?.amount || bill?.amount_due || '0.00',
        penalty: bill?.penalty || '0.00',
        totalAmountDue: bill?.amount || bill?.amount_due || '0.00',
        salesSubjectToPT: '0.00',
        exemptSales: '0.00',
        
        // Payment details
        amountReceived: payment?.amount_paid || bill?.amount || bill?.amount_due || '0.00',
        paymentMethod: payment?.payment_method || 'Cash',
        changeGiven: payment?.change_given || '0.00',
        
        // Convert amount to words
        amountInWords: numberToWords(payment?.amount_paid || bill?.amount || bill?.amount_due || 0),
        
        // Additional details
        previousReading: bill?.previous_reading || '0',
        currentReading: bill?.current_reading || '0',
        consumption: bill?.consumption || '0',
        dueDate: bill?.due_date ? new Date(bill.due_date).toLocaleDateString() : '',
        billingDate: bill?.created_at ? new Date(bill.created_at).toLocaleDateString() : ''
      };

      setReceiptData(formattedData);
    } catch (err) {
      console.error('Error fetching receipt data:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load receipt data. ';
      if (err.response) {
        // Server responded with error status
        if (err.response.status === 401) {
          errorMessage += 'Authentication required. Please log in again.';
        } else if (err.response.status === 404) {
          errorMessage += 'Customer or bill not found.';
        } else if (err.response.status === 403) {
          errorMessage += 'Access denied.';
        } else {
          errorMessage += `Server error (${err.response.status}).`;
        }
      } else if (err.request) {
        // Network error
        errorMessage += 'Network error. Please check your connection.';
      } else {
        // Other error
        errorMessage += err.message || 'Unknown error occurred.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [customerId, billId, paymentId, numberToWords]);

  // Fetch receipt data when component mounts
  useEffect(() => {
    console.log('CustomerReceipt props:', { customerId, billId, paymentId, isPrintable });
    console.log('Props types:', { 
      customerId: typeof customerId, 
      billId: typeof billId, 
      paymentId: typeof paymentId 
    });
    
    if (customerId && billId) {
      console.log('✅ Valid props, fetching receipt data...');
      fetchReceiptData();
    } else {
      console.warn('❌ Missing required props:', { customerId, billId });
      setError('Missing customer or bill information');
      setLoading(false);
    }
  }, [customerId, billId, paymentId, isPrintable, fetchReceiptData]);

  const handlePrint = () => {
    // Get the receipt HTML
    const receiptElement = receiptRef.current;
    if (!receiptElement) {
      // Fallback to standard print
      window.print();
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      // Fallback if popup is blocked
      window.print();
      return;
    }

    // Create print HTML with inline styles
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${receiptData?.receiptNumber || 'Print'}</title>
          <style>
            @page {
              margin: 10mm;
              size: A4;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              background: white;
            }
            .print-hidden {
              display: none !important;
            }
            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          </style>
        </head>
        <body>
          ${receiptElement.outerHTML}
        </body>
      </html>
    `;

    printWindow.document.write(printHTML);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      
      // Close window after printing (with delay to allow print dialog to show)
      setTimeout(() => {
        printWindow.close();
      }, 500);
    }, 250);
  };

  const handleDownload = () => {
    if (!receiptData) return;

    try {
      // Create a new PDF document
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 15;
      const margin = 15;

      // Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('DOLORES WATER DISTRICT', pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('POBLACION 2801 DOLORES ABRA PHILIPPINES', pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
      doc.text('NON VAT Reg. TIN-000-609-549-00000', pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;

      // Acknowledgement Receipt Title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ACKNOWLEDGEMENT RECEIPT', pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;

      // Receipt Number and Date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Receipt No.: ${receiptData.receiptNumber}`, margin, yPos);
      doc.text(`Date: ${receiptData.date}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 10;

      // Draw a line
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;

      // Left Column - Settlement Details
      const leftX = margin;
      const rightX = pageWidth / 2 + 5;
      const columnWidth = (pageWidth - margin * 2 - 10) / 2;

      doc.setFont('helvetica', 'bold');
      doc.text('In settlement of the following:', leftX, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Meter No.: ${receiptData.meterNumber}`, leftX, yPos);
      yPos += 5;
      doc.text(`Billing Date: ${receiptData.billingDate}`, leftX, yPos);
      yPos += 5;
      doc.text(`Due Date: ${receiptData.dueDate}`, leftX, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'bold');
      doc.text('Line Items:', leftX, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'normal');
      doc.text(`Previous Reading: ${receiptData.previousReading}`, leftX, yPos);
      yPos += 5;
      doc.text(`Current Reading: ${receiptData.currentReading}`, leftX, yPos);
      yPos += 5;
      doc.text(`Consumption (cu.m.): ${receiptData.consumption}`, leftX, yPos);
      yPos += 5;
      doc.text(`Total Sales: ₱ ${parseFloat(receiptData.totalSales).toFixed(2)}`, leftX, yPos);
      yPos += 5;

      if (parseFloat(receiptData.scpwdDiscount) > 0) {
        doc.setTextColor(0, 128, 0); // Green
        doc.text(`SCPWD Discount (20%): -₱ ${parseFloat(receiptData.scpwdDiscount).toFixed(2)}`, leftX, yPos);
        doc.setTextColor(0, 0, 0); // Black
        yPos += 5;
      }

      doc.text(`AD Due: ₱ ${parseFloat(receiptData.adDue).toFixed(2)}`, leftX, yPos);
      yPos += 5;

      if (parseFloat(receiptData.penalty) > 0) {
        doc.setTextColor(220, 38, 38); // Red
        doc.text(`Penalty (10%): ₱ ${parseFloat(receiptData.penalty).toFixed(2)}`, leftX, yPos);
        doc.setTextColor(0, 0, 0); // Black
        yPos += 5;
      }

      doc.setFont('helvetica', 'bold');
      doc.line(leftX, yPos, leftX + columnWidth, yPos);
      yPos += 6;
      doc.text(`TOTAL AMOUNT DUE: ₱ ${parseFloat(receiptData.totalAmountDue).toFixed(2)}`, leftX, yPos);
      yPos += 8;

      // Payment Method
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Method:', leftX, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(`✓ ${receiptData.paymentMethod}`, leftX, yPos);
      yPos += 10;

      // Right Column - Customer Information
      yPos = 50; // Reset to start of right column
      doc.setFont('helvetica', 'bold');
      doc.text('Customer Information:', rightX, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'normal');
      doc.text(`Received from: ${receiptData.customerName}`, rightX, yPos);
      yPos += 5;
      const addressLines = doc.splitTextToSize(`and address at: ${receiptData.customerAddress}`, columnWidth);
      doc.text(addressLines, rightX, yPos);
      yPos += addressLines.length * 5;
      doc.text(`the business style of: ${receiptData.businessStyle}`, rightX, yPos);
      yPos += 5;

      if (receiptData.customerTIN) {
        doc.text(`with TIN: ${receiptData.customerTIN}`, rightX, yPos);
        yPos += 5;
      }

      if (receiptData.customerBusiness) {
        doc.text(`engaged in: ${receiptData.customerBusiness}`, rightX, yPos);
        yPos += 5;
      }

      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Amount Paid:', rightX, yPos);
      yPos += 6;
      doc.setFontSize(14);
      doc.setTextColor(0, 128, 0); // Green
      doc.text(`₱ ${parseFloat(receiptData.amountReceived).toFixed(2)}`, rightX, yPos);
      doc.setTextColor(0, 0, 0); // Black
      yPos += 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('in partial/full payment of:', rightX, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'italic');
      doc.text(`${receiptData.amountInWords}`, rightX, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.text('the sum of:', rightX, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'italic');
      doc.text(`${receiptData.amountInWords} pesos`, rightX, yPos);
      yPos += 10;

      // Footer
      const footerY = pageHeight - 40;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Printer\'s Details:', margin, footerY);
      doc.text('(x3) 125001-150000', margin, footerY + 4);
      doc.text('Authority to Print No. 007AL20230000000715', margin, footerY + 8);
      doc.text('Issued: 02272023', margin, footerY + 12);
      doc.setFont('helvetica', 'bold');
      doc.text('ATHY\'S PRINTING PRESS', margin, footerY + 16);
      doc.setFont('helvetica', 'normal');
      doc.text('Real St., Zone 1, Bantay, Ilocos Sur', margin, footerY + 20);
      doc.text('TIN-945-005-299-000-NVAT', margin, footerY + 24);

      doc.text('Printer\'s Accreditation:', pageWidth / 2 + 5, footerY);
      doc.text('No. 002MP20200000000001', pageWidth / 2 + 5, footerY + 4);
      doc.text('Date Issued-05-18-2020', pageWidth / 2 + 5, footerY + 8);

      // Signature lines
      const signatureY = pageHeight - 15;
      doc.text('By: _________________', margin, signatureY);
      doc.text('Cashier/Authorized Representative: _________________', pageWidth / 2, signatureY, { align: 'center' });

      // Disclaimer
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38); // Red
      doc.text('THIS DOCUMENT IS NOT VALID FOR CLAIMING INPUT TAXES', pageWidth / 2, pageHeight - 5, { align: 'center' });

      // Save the PDF
      const fileName = `Receipt_${receiptData.receiptNumber}_${receiptData.date.replace(/\//g, '-')}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleRefresh = () => {
    fetchReceiptData();
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
        
        {/* Debug information in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left text-sm">
            <h4 className="font-semibold mb-2">Debug Information:</h4>
            <p><strong>Customer ID:</strong> {customerId}</p>
            <p><strong>Bill ID:</strong> {billId}</p>
            <p><strong>Payment ID:</strong> {paymentId || 'None'}</p>
            <p><strong>Is Printable:</strong> {isPrintable ? 'Yes' : 'No'}</p>
          </div>
        )}
        
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

  if (!receiptData) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">No receipt data available</p>
      </div>
    );
  }

  return (
    <div className={`bg-white ${isPrintable ? 'p-0' : 'p-6'} max-w-4xl mx-auto`}>
      {/* Print/Download buttons - hidden when printing */}
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

      {/* Receipt Container */}
      <div ref={receiptRef} className="border-2 border-gray-800 bg-white shadow-lg receipt-container">
        {/* Header with Logo */}
        <div className="text-center py-4 border-b-2 border-gray-800">
          <div className="flex items-center justify-center mb-2">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-3">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">DOLORES WATER DISTRICT</h1>
          </div>
          <p className="text-sm text-gray-600">POBLACION 2801 DOLORES ABRA PHILIPPINES</p>
          <p className="text-sm text-gray-600">NON VAT Reg. TIN-000-609-549-00000</p>
        </div>

        {/* Acknowledgement Receipt Title */}
        <div className="text-center py-2 bg-gray-100 border-b border-gray-300">
          <h2 className="text-xl font-bold text-gray-800">ACKNOWLEDGEMENT RECEIPT</h2>
        </div>

        {/* Receipt Number and Date */}
        <div className="flex justify-between items-center px-6 py-3 border-b border-gray-300">
          <div>
            <span className="font-semibold">Receipt No.:</span>
            <span className="ml-2 text-red-600 font-bold text-lg">{receiptData.receiptNumber}</span>
          </div>
          <div>
            <span className="font-semibold">Date:</span>
            <span className="ml-2">{receiptData.date}</span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-2 gap-0">
          {/* Left Column - Settlement Details */}
          <div className="border-r border-gray-300 p-4">
            <h3 className="font-bold text-gray-800 mb-3">In settlement of the following:</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Meter No.:</span>
                <span className="font-semibold">{receiptData.meterNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Billing Date:</span>
                <span>{receiptData.billingDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Due Date:</span>
                <span>{receiptData.dueDate}</span>
              </div>
            </div>

            <h4 className="font-bold text-gray-800 mt-4 mb-2">Line Items:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Previous Reading:</span>
                <span>{receiptData.previousReading}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Reading:</span>
                <span>{receiptData.currentReading}</span>
              </div>
              <div className="flex justify-between">
                <span>Consumption (cu.m.):</span>
                <span>{receiptData.consumption}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Sales:</span>
                <span className="font-semibold">₱ {receiptData.totalSales}</span>
              </div>
              {parseFloat(receiptData.scpwdDiscount) > 0 && (
                <div className="flex justify-between">
                  <span>SCPWD Discount (20%):</span>
                  <span className="font-semibold text-green-600">-₱ {receiptData.scpwdDiscount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>AD Due:</span>
                <span className="font-semibold">₱ {receiptData.adDue}</span>
              </div>
              {parseFloat(receiptData.penalty) > 0 && (
                <div className="flex justify-between">
                  <span>Penalty (10%):</span>
                  <span className="font-semibold text-red-600">₱ {receiptData.penalty}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t pt-2">
                <span>TOTAL AMOUNT DUE:</span>
                <span className="border-b-2 border-gray-800">₱ {receiptData.totalAmountDue}</span>
              </div>
            </div>

            <div className="mt-4">
              <p className="font-semibold mb-2">Payment Method:</p>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2" 
                    checked={receiptData.paymentMethod === 'Cash'}
                    readOnly
                  />
                  <span>Cash</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2" 
                    checked={receiptData.paymentMethod === 'Check'}
                    readOnly
                  />
                  <span>Check</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2" 
                    checked={receiptData.paymentMethod === 'Card'}
                    readOnly
                  />
                  <span>Card</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Customer and Payment Details */}
          <div className="p-4">
            <h3 className="font-bold text-gray-800 mb-3">Customer Information:</h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold">Received from:</span>
                <span className="ml-2 font-semibold">{receiptData.customerName}</span>
              </div>
              <div>
                <span className="font-semibold">and address at:</span>
                <span className="ml-2">{receiptData.customerAddress}</span>
              </div>
              <div>
                <span className="font-semibold">the business style of:</span>
                <span className="ml-2">{receiptData.businessStyle}</span>
              </div>
              {receiptData.customerTIN && (
                <div>
                  <span className="font-semibold">with TIN:</span>
                  <span className="ml-2">{receiptData.customerTIN}</span>
                </div>
              )}
              {receiptData.customerBusiness && (
                <div>
                  <span className="font-semibold">engaged in:</span>
                  <span className="ml-2">{receiptData.customerBusiness}</span>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <div className="text-center p-3 bg-gray-100 rounded border">
                <div className="font-bold text-lg">Amount Paid:</div>
                <div className="text-2xl font-bold text-green-700">₱ {receiptData.amountReceived}</div>
              </div>
              
              
              <div className="text-sm">
                <div className="font-semibold">in partial/full payment of:</div>
                <div className="italic">{receiptData.amountInWords}</div>
              </div>
              
              <div className="text-sm">
                <div className="font-semibold">the sum of:</div>
                <div className="italic">{receiptData.amountInWords} pesos</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Information */}
        <div className="border-t-2 border-gray-800 p-4 text-xs text-gray-600">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold">Printer's Details:</p>
              <p>(x3) 125001-150000</p>
              <p>Authority to Print No. 007AL20230000000715</p>
              <p>Issued: 02272023</p>
              <p className="font-semibold">ATHY'S PRINTING PRESS</p>
              <p>Real St., Zone 1, Bantay, Ilocos Sur</p>
              <p>TIN-945-005-299-000-NVAT</p>
            </div>
            <div>
              <p className="font-semibold">Printer's Accreditation:</p>
              <p>No. 002MP20200000000001</p>
              <p>Date Issued-05-18-2020</p>
              
              <div className="mt-4 space-y-2">
                <div>
                  <span className="font-semibold">Sr. Citizen TIN:</span>
                  <span className="ml-2 border-b border-gray-400 w-20"></span>
                </div>
                <div>
                  <span className="font-semibold">OSCA/PWD ID No:</span>
                  <span className="ml-2 border-b border-gray-400 w-20"></span>
                </div>
                <div>
                  <span className="font-semibold">Signature:</span>
                  <span className="ml-2 border-b border-gray-400 w-20"></span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-semibold">By:</span>
                <span className="ml-2 border-b border-gray-400 w-24"></span>
              </div>
              <div>
                <span className="font-semibold">Cashier/Authorized Representative:</span>
                <span className="ml-2 border-b border-gray-400 w-24"></span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center font-semibold text-red-600">
            THIS DOCUMENT IS NOT VALID FOR CLAIMING INPUT TAXES
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerReceipt;
