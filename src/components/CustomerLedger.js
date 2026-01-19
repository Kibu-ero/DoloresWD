import React, { useState, useEffect, useCallback } from 'react';
import { FiDownload, FiPrinter, FiRefreshCw } from 'react-icons/fi';
import CustomerService from '../services/customer.service';
import BillingService from '../services/billing.service';
import apiClient from '../api/client';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatName } from '../utils/nameFormatter';

const CustomerLedger = ({ 
  customerId,
  isPrintable = false,
  onClose
}) => {
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get current user info (name and role)
  const getCurrentUserInfo = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const name = (user.firstName && user.lastName) 
          ? `${user.firstName} ${user.lastName}` 
          : (user.name || user.username || '');
        const role = user.role || '';
        return { name, role };
      }
    } catch (e) {
      console.error('Error getting current user info:', e);
    }
    return { name: '', role: '' };
  };

  // Format role to job title (convert role to proper job title format)
  const formatJobTitle = (role) => {
    if (!role) return '';
    // Convert role to job title format (e.g., "cashier" -> "CASHIERING ASSISTANT")
    const roleMap = {
      'admin': 'ADMINISTRATOR',
      'cashier': 'CASHIERING ASSISTANT',
      'encoder': 'ENCODING ASSISTANT',
      'finance_manager': 'ACCOUNTING PROCESSOR A',
      'finance': 'ACCOUNTING PROCESSOR A',
      'manager': 'MANAGER'
    };
    const normalizedRole = (role || '').toString().toLowerCase().trim();
    return roleMap[normalizedRole] || role.toUpperCase().replace(/_/g, ' ');
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

      // Fetch online payment submissions (e.g. GCash) if any
      try {
        const onlinePaymentsResponse = await apiClient.get(`/payment-submissions/customer/${customerId}`);
        const rawOnline = onlinePaymentsResponse.data || [];
        console.log('Online payments raw data:', rawOnline);

        // Normalise possible response shapes:
        // - [ {...}, {...} ]
        // - { payments: [ ... ] }
        // - { submissions: [ ... ] }
        // - { data: [ ... ] }
        let onlinePayments = [];
        if (Array.isArray(rawOnline)) {
          onlinePayments = rawOnline;
        } else if (Array.isArray(rawOnline.payments)) {
          onlinePayments = rawOnline.payments;
        } else if (Array.isArray(rawOnline.submissions)) {
          onlinePayments = rawOnline.submissions;
        } else if (Array.isArray(rawOnline.data)) {
          onlinePayments = rawOnline.data;
        }

        // Only include approved / successful online payments if status field exists
        onlinePayments = onlinePayments.filter(p => {
          if (!p) return false;
          if (!p.status) return true;
          const status = String(p.status).toLowerCase();
          return status === 'approved' || status === 'success' || status === 'successful';
        });

        console.log('Online payments normalized:', onlinePayments);
        
        // Merge online payments with cashier payments
        payments = [...payments, ...onlinePayments];
      } catch (onlinePaymentError) {
        console.log('No online payment data found:', onlinePaymentError);
      }

      // Create ledger entries from bills and payments
      const ledgerEntries = [];

      // De‑duplicate payments coming from different sources (e.g. GCash submission + cashier post)
      // so the same payment is not counted twice in the ledger.
      const seenPayments = new Set();
      const uniquePayments = [];

      const makePaymentKey = (p) => {
        const datePart = p.payment_date || p.created_at || p.createdAt || p.approved_at || p.approvedAt || '';
        const amountPart = p.amount_paid ?? p.amount ?? p.paidAmount ?? p.total_amount ?? '';
        const receiptPart = p.receipt_number || p.or_number || '';
        const refPart = p.reference_number || p.referenceNumber || '';
        const idPart = p.id != null ? String(p.id) : '';
        return [datePart, amountPart, receiptPart, refPart, idPart].join('|');
      };

      payments.forEach((p) => {
        if (!p) return;
        const key = makePaymentKey(p);
        if (key && !seenPayments.has(key)) {
          seenPayments.add(key);
          uniquePayments.push(p);
        }
      });

      // Use the de‑duplicated list for all further processing
      payments = uniquePayments;
      
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

      // Add payment entries (cashier + normalized online payments)
      payments.forEach(payment => {
        // Support multiple field name variants from different sources
        const paymentDateRaw =
          payment.payment_date ||
          payment.created_at ||
          payment.createdAt ||
          payment.approved_at ||
          payment.approvedAt;

        if (paymentDateRaw) {
          const paymentDate = new Date(paymentDateRaw);

          const amountPaid = parseFloat(
            payment.amount_paid ??
            payment.amount ??
            payment.paidAmount ??
            payment.total_amount ??
            0
          );

          const penaltyPaid = parseFloat(
            payment.penalty_paid ??
            payment.penalty ??
            0
          );
          
          // Create reference string including GCash reference number if available
          let referenceString =
            payment.receipt_number ||
            payment.or_number ||
            payment.reference ||
            payment.id?.toString() ||
            '';

          const refNo = payment.reference_number || payment.referenceNumber;
          if (refNo) {
            referenceString += referenceString ? ` / ${refNo}` : refNo;
          }
          
          ledgerEntries.push({
            date: paymentDate.toLocaleDateString('en-US', { 
              month: 'numeric', 
              day: 'numeric', 
              year: '2-digit' 
            }),
            particulars: (() => {
              const method =
                payment.payment_method ||
                payment.paymentMethod ||
                payment.method ||
                '';
              return method
                ? `PAYMENT (${String(method).toUpperCase()})`
                : 'PAYMENT';
            })(),
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
      
      // Helper: convert a peso value to integer centavos to avoid floating-point errors
      const toCents = (value) => {
        const num = parseFloat(value || 0);
        if (isNaN(num)) return 0;
        return Math.round(num * 100);
      };
      
      // Calculate running balance chronologically using centavos
      // allEntriesWithDates is already sorted by date, so we can use it directly
      // Create a unique identifier for each entry to track balances
      let entryCounter = 0;
      allEntriesWithDates.forEach(entry => {
        entry._ledgerId = entryCounter++;
      });
      
      let runningBalanceCents = 0;
      const balanceMap = new Map(); // Map to store balance (in pesos) for each entry by _ledgerId
      
      allEntriesWithDates.forEach(entry => {
        // Add DR (debit/billings) - increases balance
        const drCents = toCents(entry.drBillings);
        if (drCents > 0) {
          runningBalanceCents += drCents;
        }
        // Subtract CR (credit/collections) - decreases balance
        // Note: entry.amount is penalty_paid, which is part of the total payment
        // So we subtract both crCollections (amount_paid) and amount (penalty_paid)
        const crCents = toCents(entry.crCollections);
        const penaltyCents = toCents(entry.amount);
        const totalCreditCents = crCents + penaltyCents;
        if (totalCreditCents > 0) {
          runningBalanceCents -= totalCreditCents;
        }
        // Store balance using entry's unique ID, converted back to pesos
        if (entry._ledgerId !== undefined) {
          balanceMap.set(entry._ledgerId, runningBalanceCents / 100);
        }
      });
      
      // Apply balances to all entries (only for actual transactions, not empty placeholders)
      orderedEntries.forEach(entry => {
        if (entry._ledgerId !== undefined && balanceMap.has(entry._ledgerId)) {
          // This is an actual transaction with a date - use its calculated balance
          entry.balance = balanceMap.get(entry._ledgerId);
        } else if (!entry.isEmpty && entry.date && entry.date.trim() !== '') {
          // For entries with dates but not in balanceMap (shouldn't happen, but just in case)
          entry.balance = runningBalanceCents / 100;
        } else {
          // For empty placeholder entries (BILL, PENALTY, PAYMENT without data), set balance to null/empty
          entry.balance = null;
        }
      });

      // Calculate totals from actual ledger entries (not orderedEntries which may have empty placeholders)
      const totalBillingsCents = ledgerEntries.reduce((sum, entry) => {
        return sum + toCents(entry.drBillings);
      }, 0);
      const totalCollectionsCents = ledgerEntries.reduce((sum, entry) => {
        // Total collections = amount_paid (crCollections) + penalty_paid (amount)
        return sum + toCents(entry.crCollections) + toCents(entry.amount);
      }, 0);
      
      const totalBillings = totalBillingsCents / 100;
      const totalCollections = totalCollectionsCents / 100;
      
      const userInfo = getCurrentUserInfo();
      const formattedData = {
        customer: customer,
        ledgerEntries: orderedEntries,
        totalBillings: totalBillings,
        totalCollections: totalCollections,
        currentBalance: runningBalanceCents / 100,
        preparedBy: userInfo.name,
        preparedByRole: userInfo.role
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
      if (!ledgerData) return;

      const customer = ledgerData.customer;
      const formattedCustomerName = formatName(customer.first_name || '', customer.last_name || '');

      const rowsHtml = ledgerData.ledgerEntries
        .map(entry => {
          const dr = entry.drBillings > 0 ? formatCurrency(entry.drBillings) : '';
          const crTotal =
            (entry.crCollections || 0) + (entry.amount || 0);
          const cr = crTotal > 0 ? formatCurrency(crTotal) : '';
          const bal =
            entry.balance !== null && entry.balance !== undefined
              ? formatCurrency(entry.balance)
              : '';

          return `
            <tr>
              <td style="font-size: 12px;">${entry.date || ''}</td>
              <td style="font-size: 12px; font-weight: 600;">${entry.particulars || ''}</td>
              <td style="font-size: 12px;">${entry.reference || ''}</td>
              <td style="text-align: center; font-size: 12px;">${entry.meterReading || ''}</td>
              <td style="text-align: center; font-size: 12px;">${entry.consumption || ''}</td>
              <td style="text-align: right; font-size: 12px; font-weight: 600;">${dr}</td>
              <td style="text-align: right; font-size: 12px; font-weight: 600;">${cr}</td>
              <td style="text-align: right; font-size: 12px; font-weight: bold;">${bal}</td>
            </tr>
          `;
        })
        .join('');

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charSet="utf-8" />
            <title>Customer Ledger - ${formattedCustomerName}</title>
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
              .ledger-container {
                border: 2px solid #000;
                background: white;
                width: 100%;
              }
              .header-section {
                padding: 16px;
                border-bottom: 2px solid #000;
              }
              .header-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 32px;
              }
              .header-item {
                display: flex;
                margin-bottom: 12px;
              }
              .header-label {
                font-weight: bold;
                width: 128px;
                min-width: 128px;
              }
              .title-section {
                text-align: center;
                padding: 8px;
                background: #f3f4f6;
                border-bottom: 1px solid #d1d5d6;
              }
              .title-section h1 {
                font-size: 20px;
                font-weight: bold;
                color: #1f2937;
                margin: 0;
                padding: 0;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                border: 1px solid #000;
              }
              th, td {
                border: 1px solid #000;
                padding: 4px 8px;
                word-wrap: break-word;
                overflow-wrap: break-word;
                font-size: 12px;
              }
              th {
                background: #f3f4f6;
                font-weight: bold;
                text-align: left;
              }
              th.text-center {
                text-align: center;
              }
              th.text-right {
                text-align: right;
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
              .summary-grid {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 32px;
                margin-bottom: 8px;
                font-size: 14px;
              }
              .summary-totals {
                text-align: right;
              }
              .current-balance {
                margin-top: 8px;
                text-align: right;
                font-size: 18px;
                font-weight: bold;
                color: #dc2626;
              }
              .signatories-section {
                margin-top: 32px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 32px;
              }
              .sig-block {
                text-align: center;
              }
              .sig-line {
                border-bottom: 1px solid #9ca3af;
                width: 192px;
                height: 24px;
                margin: 0 auto 8px auto;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .sig-label {
                font-weight: 600;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="ledger-container">
              <!-- Header Section -->
              <div class="header-section">
                <div class="header-grid">
                  <div>
                    <div class="header-item">
                      <span class="header-label">Account of:</span>
                      <span style="font-weight: 600;">${formattedCustomerName}</span>
                    </div>
                    <div class="header-item">
                      <span class="header-label">Office/Address:</span>
                      <span>${(customer.street || '')}, ${(customer.barangay || '')}, ${(customer.city || '')}, ${(customer.province || '')}</span>
                    </div>
                    <div class="header-item">
                      <span class="header-label">Contact Person:</span>
                      <span style="border-bottom: 1px solid #9ca3af; width: 128px; display: inline-block;"></span>
                    </div>
                    <div class="header-item">
                      <span class="header-label">Contact Number:</span>
                      <span style="font-weight: 600;">${customer.phone_number || 'N/A'}</span>
                    </div>
                  </div>
                  <div>
                    <div class="header-item">
                      <span class="header-label">Meter Brand & Size:</span>
                      <span style="border-bottom: 1px solid #9ca3af; width: 128px; display: inline-block;"></span>
                    </div>
                    <div class="header-item">
                      <span class="header-label">Meter Serial No.:</span>
                      <span style="font-weight: 600;">${customer.meter_number || ''}</span>
                    </div>
                    <div class="header-item">
                      <span class="header-label">Classification:</span>
                      <span style="border-bottom: 1px solid #9ca3af; width: 128px; display: inline-block;"></span>
                    </div>
                    <div class="header-item">
                      <span class="header-label">No. of Persons using water:</span>
                      <span style="border-bottom: 1px solid #9ca3af; width: 128px; display: inline-block;"></span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Title -->
              <div class="title-section">
                <h1>DOLORES WATER DISTRICT CUSTOMER LEDGER CARD</h1>
              </div>

              <!-- Main Table -->
              <table>
                <thead>
                  <tr>
                    <th class="text-center">Date</th>
                    <th>Particulars</th>
                    <th>Ref.</th>
                    <th class="text-center">Meter Reading</th>
                    <th class="text-center">Consumption (Cubic Meters)</th>
                    <th class="text-right" rowspan="2">DR Billings</th>
                    <th class="text-right" rowspan="2">CR Collections</th>
                    <th class="text-right">Balance</th>
                  </tr>
                  <tr>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>

              <!-- Footer Summary -->
              <div class="footer-section">
                <div class="summary-grid">
                  <div>
                    <span style="font-weight: bold;">TOTAL:</span>
                  </div>
                  <div class="summary-totals">
                    <span style="font-weight: bold;">Total Billings: ₱ ${formatCurrency(ledgerData.totalBillings)}</span>
                  </div>
                  <div class="summary-totals">
                    <span style="font-weight: bold;">Total Collections: ₱ ${formatCurrency(ledgerData.totalCollections)}</span>
                  </div>
                </div>
                <div class="current-balance">
                  Current Balance: ₱ ${formatCurrency(ledgerData.currentBalance)}
                </div>

                <!-- Signatories Section -->
                <div class="signatories-section">
                  <div class="sig-block">
                    <div class="sig-label" style="margin-bottom: 4px;">Prepared by:</div>
                    <div class="sig-line" style="text-decoration: underline; font-weight: bold; text-transform: uppercase;">ANTONINA C. PURISIMA</div>
                    <div style="font-weight: bold; text-transform: uppercase; margin-top: 4px; font-size: 11px;">CASHIERING ASSISTANT</div>
                  </div>
                  <div class="sig-block">
                    <div class="sig-label" style="margin-bottom: 4px;">Noted by:</div>
                    <div class="sig-line" style="text-decoration: underline; font-weight: bold; text-transform: uppercase;">MARITES E. VILLAREAL</div>
                    <div style="font-weight: bold; text-transform: uppercase; margin-top: 4px; font-size: 11px;">ACCOUNTING PROCESSOR A</div>
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      // Use a hidden iframe inside the same window for reliable printing
      let iframe = document.getElementById('ledger-print-iframe');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'ledger-print-iframe';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
      }

      const iframeDoc =
        iframe.contentWindow || iframe.contentDocument;

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
          console.error('Iframe print error:', err);
        }
      };
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
      
      // Add header - match preview
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('DOLORES WATER DISTRICT', pageWidth / 2, 15, { align: 'center' });
      doc.setFontSize(18);
      doc.text('CUSTOMER LEDGER CARD', pageWidth / 2, 25, { align: 'center' });
      
      // Customer information section - match preview layout
      let currentY = 40;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      // Left column
      doc.text(`Account of: ${formatName(ledgerData.customer.first_name || '', ledgerData.customer.last_name || '')}`, 20, currentY);
      doc.text(`Office/Address: ${ledgerData.customer.street || ''}, ${ledgerData.customer.barangay || ''}, ${ledgerData.customer.city || ''}, ${ledgerData.customer.province || ''}`, 20, currentY + 10);
      doc.text(`Contact Number: ${ledgerData.customer.phone_number || 'N/A'}`, 20, currentY + 20);
      
      // Right column
      doc.text(`Meter Serial No.: ${ledgerData.customer.meter_number || ''}`, pageWidth / 2 + 20, currentY);
      
      // Title section
      currentY = currentY + 35;
      doc.setFillColor(243, 244, 246); // Gray background
      doc.rect(0, currentY - 5, pageWidth, 8, 'F');
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55); // Gray-800
      doc.text('DOLORES WATER DISTRICT CUSTOMER LEDGER CARD', pageWidth / 2, currentY, { align: 'center' });
      doc.setTextColor(0, 0, 0); // Reset to black
      
      // Prepare table data
      const tableData = ledgerData.ledgerEntries.map(entry => [
        entry.date || '',
        entry.particulars || '',
        entry.reference || '',
        entry.meterReading || '',
        entry.consumption || '',
        entry.drBillings > 0 ? formatCurrency(entry.drBillings) : '',
        (entry.crCollections || 0) + (entry.amount || 0) > 0 ? formatCurrency((entry.crCollections || 0) + (entry.amount || 0)) : '',
        entry.balance !== null && entry.balance !== undefined ? formatCurrency(entry.balance) : ''
      ]);
      
      // Add table - match preview styling
      doc.autoTable({
        head: [['Date', 'Particulars', 'Ref.', 'Meter Reading', 'Consumption (Cubic Meters)', 'DR Billings', 'CR Collections', 'Balance']],
        body: tableData,
        startY: currentY + 10,
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
          0: { halign: 'center' },
          1: { halign: 'left', fontStyle: 'bold' },
          2: { halign: 'left' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'right', fontStyle: 'bold' },
          6: { halign: 'right', fontStyle: 'bold' },
          7: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 20, right: 20 }
      });
      
      // Add summary - match preview format
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      
      // Summary grid layout
      const leftX = 20;
      const middleX = pageWidth / 2 - 40;
      const rightX = pageWidth / 2 + 40;
      
      doc.text('TOTAL:', leftX, finalY);
      doc.text(`Total Billings: ₱ ${formatCurrency(ledgerData.totalBillings)}`, middleX, finalY, { align: 'right' });
      doc.text(`Total Collections: ₱ ${formatCurrency(ledgerData.totalCollections)}`, rightX, finalY, { align: 'right' });
      
      // Current balance in red
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(220, 38, 38); // Red
      doc.text(`Current Balance: ₱ ${formatCurrency(ledgerData.currentBalance)}`, rightX, finalY + 10, { align: 'right' });
      doc.setTextColor(0, 0, 0); // Reset to black
      
      // Add signatories - match preview format
      const userInfo = getCurrentUserInfo();
      const preparedByName = (ledgerData.preparedBy || userInfo.name || '').toUpperCase();
      const preparedByRole = formatJobTitle(ledgerData.preparedByRole || userInfo.role || '');
      
      const sigY = finalY + 30;
      const sigLeftX = pageWidth / 4;
      const sigRightX = 3 * pageWidth / 4;
      
      // Prepared by section
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text('Prepared by:', sigLeftX, sigY, { align: 'center' });
      
      // Name with underline (bold, uppercase)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      const nameY = sigY + 8;
      const nameWidth = doc.getTextWidth(preparedByName || '_________________');
      doc.text(preparedByName || '_________________', sigLeftX, nameY, { align: 'center' });
      // Draw underline
      doc.setLineWidth(0.5);
      doc.line(sigLeftX - nameWidth / 2, nameY + 2, sigLeftX + nameWidth / 2, nameY + 2);
      
      // Job title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(preparedByRole || '', sigLeftX, nameY + 10, { align: 'center' });
      
      // Approved by section
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text('Approved by:', sigRightX, sigY, { align: 'center' });
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      const approvedNameY = sigY + 8;
      const approvedName = 'ORLANDO PACAPAC III';
      const approvedNameWidth = doc.getTextWidth(approvedName);
      doc.text(approvedName, sigRightX, approvedNameY, { align: 'center' });
      // Draw underline
      doc.line(sigRightX - approvedNameWidth / 2, approvedNameY + 2, sigRightX + approvedNameWidth / 2, approvedNameY + 2);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('MANAGER', sigRightX, approvedNameY + 10, { align: 'center' });
      
      // Save the PDF
      const formattedFirstName = (ledgerData.customer.first_name || '').toLowerCase().replace(/\s+/g, '-');
      const formattedLastName = (ledgerData.customer.last_name || '').toLowerCase().replace(/\s+/g, '-');
      doc.save(`customer-ledger-${formattedFirstName}-${formattedLastName}.pdf`);
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
                <span className="font-semibold">{formatName(ledgerData.customer.first_name || '', ledgerData.customer.last_name || '')}</span>
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
            <span className="font-bold text-lg text-red-600 ledger-current-balance">
              Current Balance: ₱ {formatCurrency(ledgerData.currentBalance)}
            </span>
          </div>
          
          {/* Signatories Section */}
          <div className="mt-8 grid grid-cols-2 gap-8 text-sm">
            <div className="text-center">
              <div className="font-semibold mb-2">Prepared by:</div>
              <div className="border-b-2 border-gray-800 w-48 mx-auto mb-2 h-6 flex items-center justify-center">
                <span className="text-gray-800 font-bold underline uppercase">ANTONINA C. PURISIMA</span>
              </div>
              <div className="font-bold uppercase text-xs mt-1">CASHIERING ASSISTANT</div>
            </div>
            <div className="text-center">
              <div className="font-semibold mb-2">Noted by:</div>
              <div className="border-b-2 border-gray-800 w-48 mx-auto mb-2 h-6 flex items-center justify-center">
                <span className="text-gray-800 font-bold underline uppercase">MARITES E. VILLAREAL</span>
              </div>
              <div className="font-bold uppercase text-xs mt-1">ACCOUNTING PROCESSOR A</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLedger;
