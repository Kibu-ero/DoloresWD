import React, { useState, useEffect } from 'react';
import { FiDownload, FiPrinter, FiRefreshCw } from 'react-icons/fi';
import apiClient from '../api/client';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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


  const handlePrint = () => {
    try {
      if (!billingData || billingData.length === 0) {
        alert('No billing data to print');
        return;
      }

      const collectorText = collector && collector.trim() !== '' ? collector : 'ALL ZONES';

      // Build table rows HTML
      const rowsHtml = billingData
        .map((row, index) => {
          return `
            <tr>
              <td style="text-align: center; font-size: 12px; font-weight: 600;">${index + 1}</td>
              <td style="font-size: 12px; font-weight: 600;">${row.name || ''}</td>
              <td style="text-align: center; font-size: 12px;">${row.status1 || ''}</td>
              <td style="text-align: center; font-size: 12px;">${row.status2 || ''}</td>
              <td style="text-align: center; font-size: 12px;">${row.presentReading || ''}</td>
              <td style="text-align: center; font-size: 12px;">${row.previousReading || ''}</td>
              <td style="text-align: center; font-size: 12px; font-weight: 600;">${row.used || ''}</td>
              <td style="text-align: right; font-size: 12px; font-weight: 600;">${row.billAmount ? `₱ ${row.billAmount.toFixed(2)}` : ''}</td>
              <td style="text-align: right; font-size: 12px; font-weight: 600;">${row.scd > 0 ? `₱ ${row.scd.toFixed(2)}` : ''}</td>
              <td style="text-align: right; font-size: 12px; font-weight: bold;">${row.totalAmount ? `₱ ${row.totalAmount.toFixed(2)}` : ''}</td>
              <td style="text-align: center; font-size: 12px;">${row.orNumber || ''}</td>
              <td style="text-align: center; font-size: 12px;">${row.date || ''}</td>
              <td style="text-align: right; font-size: 12px; font-weight: 600;">${row.penalty > 0 ? `₱ ${row.penalty.toFixed(2)}` : ''}</td>
              <td style="text-align: right; font-size: 12px; font-weight: bold;">${row.afterDue ? `₱ ${row.afterDue.toFixed(2)}` : ''}</td>
            </tr>
          `;
        })
        .join('');

      // Add empty rows to fill up to 42 rows
      let emptyRowsHtml = '';
      for (let i = billingData.length; i < 42; i++) {
        emptyRowsHtml += `
          <tr>
            <td style="text-align: center; font-size: 12px;">${i + 1}</td>
            <td style="font-size: 12px;"></td>
            <td style="text-align: center; font-size: 12px;"></td>
            <td style="text-align: center; font-size: 12px;"></td>
            <td style="text-align: center; font-size: 12px;"></td>
            <td style="text-align: center; font-size: 12px;"></td>
            <td style="text-align: center; font-size: 12px;"></td>
            <td style="text-align: right; font-size: 12px;"></td>
            <td style="text-align: right; font-size: 12px;"></td>
            <td style="text-align: right; font-size: 12px;"></td>
            <td style="text-align: center; font-size: 12px;"></td>
            <td style="text-align: center; font-size: 12px;"></td>
            <td style="text-align: right; font-size: 12px;"></td>
            <td style="text-align: right; font-size: 12px;"></td>
          </tr>
        `;
      }

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charSet="utf-8" />
            <title>Daily Collector Billing Sheet - ${month} ${year}</title>
            <style>
              @page {
                margin: 10mm;
                size: landscape;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                color: #000;
                margin: 0;
                padding: 0;
                background: #ffffff;
              }
              .billing-sheet-container {
                border: 2px solid #000;
                background: white;
                width: 100%;
              }
              .header-section {
                text-align: center;
                padding: 16px;
                border-bottom: 2px solid #000;
              }
              .header-section h1 {
                font-size: 24px;
                font-weight: bold;
                margin: 0 0 4px 0;
                color: #1f2937;
              }
              .header-section h2 {
                font-size: 20px;
                font-weight: 600;
                margin: 0 0 8px 0;
                color: #374151;
              }
              .title-section {
                text-align: center;
                padding: 8px;
                background: #f3f4f6;
                border-bottom: 1px solid #d1d5d6;
              }
              .title-section h3 {
                font-size: 18px;
                font-weight: bold;
                margin: 0;
                color: #1f2937;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                border: 1px solid #000;
              }
              th {
                background-color: #f3f4f6;
                font-weight: bold;
                border: 1px solid #000;
                padding: 4px 8px;
                text-align: center;
                font-size: 12px;
                color: #000;
              }
              td {
                border: 1px solid #000;
                padding: 4px 8px;
                font-size: 12px;
                color: #000;
              }
              td.text-center {
                text-align: center;
              }
              td.text-right {
                text-align: right;
              }
              td.font-semibold {
                font-weight: 600;
              }
              td.font-bold {
                font-weight: bold;
              }
              .footer-section {
                padding: 16px;
                border-top: 2px solid #000;
              }
              .summary-table {
                width: 100%;
                border-collapse: collapse;
              }
              .summary-table td {
                border: none;
                border-right: 1px solid #d1d5d6;
                padding: 8px;
                text-align: center;
                font-weight: bold;
                font-size: 14px;
              }
              .summary-table td:first-child {
                text-align: center;
              }
              .summary-table td:last-child {
                border-right: none;
              }
            </style>
          </head>
          <body>
            <div class="billing-sheet-container">
              <!-- Header -->
              <div class="header-section">
                <h1>DAILY COLLECTOR</h1>
                <h2>${collectorText}</h2>
              </div>

              <!-- Title -->
              <div class="title-section">
                <h3>BILLING SHEET - ${month} ${year}</h3>
              </div>

              <!-- Main Table -->
              <table>
                <thead>
                  <tr>
                    <th rowspan="2">BILL NO.</th>
                    <th rowspan="2">CONSUMER ZONE</th>
                    <th rowspan="2">STATUS</th>
                    <th rowspan="2">STATUS</th>
                    <th colspan="3">METER READING</th>
                    <th rowspan="2">AMOUNT OF BILL</th>
                    <th rowspan="2">SCD</th>
                    <th rowspan="2">TOTAL AMOUNT</th>
                    <th rowspan="2">OR NO.</th>
                    <th rowspan="2">DATE</th>
                    <th rowspan="2">PENALTY</th>
                    <th rowspan="2">AMOUNT AFTER DUE SURCHARGE</th>
                  </tr>
                  <tr>
                    <th>PRESENT</th>
                    <th>PREVIOUS</th>
                    <th>USED (CU3m)</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                  ${emptyRowsHtml}
                </tbody>
              </table>

              <!-- Footer Summary -->
              <div class="footer-section">
                <table class="summary-table">
                  <tr>
                    <td>SUB TOTAL</td>
                    <td>USED: ${summary.totalUsed.toFixed(2)}</td>
                    <td>AMOUNT OF BILL: ₱ ${summary.totalBill.toFixed(2)}</td>
                    <td>SCD: ₱ ${summary.totalSCD.toFixed(2)}</td>
                    <td>TOTAL AMOUNT: ₱ ${summary.totalAmount.toFixed(2)}</td>
                    <td>PENALTY: ₱ ${summary.totalPenalty.toFixed(2)}</td>
                    <td>AMOUNT AFTER DUE SURCHARGE: ₱ ${summary.totalAfterDue.toFixed(2)}</td>
                  </tr>
                </table>
              </div>
            </div>
          </body>
        </html>
      `;

      // Use a hidden iframe inside the same window for reliable printing
      let iframe = document.getElementById('billing-sheet-print-iframe');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'billing-sheet-print-iframe';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
      }

      const iframeDoc = iframe.contentWindow || iframe.contentDocument;

      if (!iframeDoc) {
        console.error('Unable to access print iframe document');
        return;
      }

      const doc = iframeDoc.document || iframeDoc;
      doc.open();
      doc.write(html);
      doc.close();

      iframe.onload = () => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (err) {
          console.error('Print error:', err);
        }
      };

      // Fallback if onload doesn't fire
      setTimeout(() => {
        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          }
        } catch (err) {
          console.error('Print error:', err);
        }
      }, 500);
    } catch (e) {
      console.error('Billing sheet print error:', e);
      alert('Failed to print billing sheet. Please try again.');
    }
  };

  const handleDownload = () => {
    try {
      // Create a new PDF document in landscape orientation
      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header section - match preview
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('DAILY COLLECTOR', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(20);
      doc.setFont('helvetica', 'normal');
      const collectorText = collector && collector.trim() !== '' ? collector : 'ALL ZONES';
      doc.text(collectorText, pageWidth / 2, 22, { align: 'center' });
      
      // Title section with background
      let titleY = 29;
      doc.setFillColor(243, 244, 246); // Gray background
      doc.rect(0, titleY - 5, pageWidth, 8, 'F');
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55); // Gray-800
      doc.text(`BILLING SHEET - ${month} ${year}`, pageWidth / 2, titleY, { align: 'center' });
      doc.setTextColor(0, 0, 0); // Reset to black
      
      // Prepare table data
      const tableData = billingData.map((row, index) => [
        index + 1,
        row.name || '',
        row.status1 || '',
        row.status2 || '',
        row.presentReading || 0,
        row.previousReading || 0,
        row.used || 0,
        row.billAmount ? `₱ ${row.billAmount.toFixed(2)}` : '',
        row.scd > 0 ? `₱ ${row.scd.toFixed(2)}` : '',
        row.totalAmount ? `₱ ${row.totalAmount.toFixed(2)}` : '',
        row.orNumber || '',
        row.date || '',
        row.penalty > 0 ? `₱ ${row.penalty.toFixed(2)}` : '',
        row.afterDue ? `₱ ${row.afterDue.toFixed(2)}` : ''
      ]);
      
      // Add empty rows if needed
      for (let i = billingData.length; i < 42; i++) {
        tableData.push([
          i + 1,
          '', '', '', '', '', '', '', '', '', '', '', '', ''
        ]);
      }
      
      // Generate table - match preview styling
      doc.autoTable({
        head: [[
          'BILL NO.',
          'CONSUMER ZONE',
          'STATUS',
          'STATUS',
          'PRESENT',
          'PREVIOUS',
          'USED (CU3m)',
          'AMOUNT OF BILL',
          'SCD',
          'TOTAL AMOUNT',
          'OR NO.',
          'DATE',
          'PENALTY',
          'AMOUNT AFTER DUE SURCHARGE'
        ]],
        body: tableData,
        startY: titleY + 10,
        styles: { 
          fontSize: 12,
          cellPadding: 2,
          lineColor: [0, 0, 0],
          lineWidth: 0.5
        },
        headStyles: { 
          fillColor: [243, 244, 246],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 12
        },
        columnStyles: {
          0: { halign: 'center', fontStyle: 'bold' },
          1: { halign: 'left', fontStyle: 'bold' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center' },
          6: { halign: 'center', fontStyle: 'bold' },
          7: { halign: 'right', fontStyle: 'bold' },
          8: { halign: 'right', fontStyle: 'bold' },
          9: { halign: 'right', fontStyle: 'bold' },
          10: { halign: 'center' },
          11: { halign: 'center' },
          12: { halign: 'right', fontStyle: 'bold' },
          13: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { top: titleY + 10, left: 20, right: 20 }
      });
      
      // Add summary at the bottom - match preview format
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      
      // Summary table format
      const summaryText = `SUB TOTAL | USED: ${summary.totalUsed.toFixed(2)} | AMOUNT OF BILL: ₱ ${summary.totalBill.toFixed(2)} | SCD: ₱ ${summary.totalSCD.toFixed(2)} | TOTAL AMOUNT: ₱ ${summary.totalAmount.toFixed(2)} | PENALTY: ₱ ${summary.totalPenalty.toFixed(2)} | AMOUNT AFTER DUE SURCHARGE: ₱ ${summary.totalAfterDue.toFixed(2)}`;
      doc.text(summaryText, 20, finalY);
      
      // Save the PDF
      const fileName = `Billing_Sheet_${month}_${year}_${collector && collector.trim() !== '' ? collector.replace(/\s+/g, '_') : 'ALL_ZONES'}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
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
