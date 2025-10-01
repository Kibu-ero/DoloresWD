import React, { useState } from 'react';
import CustomerReceipt from '../components/CustomerReceipt';
import Modal from '../components/common/Modal';

const ReceiptDemo = () => {
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedBill, setSelectedBill] = useState('');
  const [selectedPayment, setSelectedPayment] = '';

  // Sample data for demonstration
  const sampleCustomers = [
    { id: 1, name: 'John Doe', meter: 'MTR-1001', address: '123 Main St, Poblacion, Dolores, Abra' },
    { id: 2, name: 'Jane Smith', meter: 'MTR-1002', address: '456 Oak Ave, Poblacion, Dolores, Abra' },
    { id: 3, name: 'Bob Johnson', meter: 'MTR-1003', address: '789 Pine Rd, Poblacion, Dolores, Abra' }
  ];

  const sampleBills = [
    { id: 1, amount: '450.00', status: 'Unpaid', dueDate: '2024-02-20' },
    { id: 2, amount: '320.50', status: 'Paid', dueDate: '2024-01-20' },
    { id: 3, amount: '675.25', status: 'Unpaid', dueDate: '2024-03-20' }
  ];

  const samplePayments = [
    { id: 1, amount: '320.50', method: 'Cash', receipt: 'RCPT-001' },
    { id: 2, amount: '450.00', method: 'Check', receipt: 'RCPT-002' },
    { id: 3, amount: '675.25', method: 'Card', receipt: 'RCPT-003' }
  ];

  const handleShowReceipt = () => {
    if (selectedCustomer && selectedBill) {
      setShowReceipt(true);
    }
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Customer Receipt Demo</h1>
          <p className="text-gray-600 mb-6">
            This demo shows how the CustomerReceipt component works with real data. 
            Select a customer and bill to generate a receipt.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Customer
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a customer...</option>
                {sampleCustomers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.meter}
                  </option>
                ))}
              </select>
              {selectedCustomer && (
                <div className="mt-2 text-sm text-gray-600">
                  <p><strong>Address:</strong> {sampleCustomers.find(c => c.id === parseInt(selectedCustomer))?.address}</p>
                </div>
              )}
            </div>

            {/* Bill Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Bill
              </label>
              <select
                value={selectedBill}
                onChange={(e) => setSelectedBill(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a bill...</option>
                {sampleBills.map(bill => (
                  <option key={bill.id} value={bill.id}>
                    Bill #{bill.id} - ₱{bill.amount} ({bill.status})
                  </option>
                ))}
              </select>
              {selectedBill && (
                <div className="mt-2 text-sm text-gray-600">
                  <p><strong>Amount:</strong> ₱{sampleBills.find(b => b.id === parseInt(selectedBill))?.amount}</p>
                  <p><strong>Due Date:</strong> {sampleBills.find(b => b.id === parseInt(selectedBill))?.dueDate}</p>
                </div>
              )}
            </div>

            {/* Payment Selection (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Payment (Optional)
              </label>
              <select
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No payment selected</option>
                {samplePayments.map(payment => (
                  <option key={payment.id} value={payment.id}>
                    {payment.receipt} - ₱{payment.amount} ({payment.method})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Generate Receipt Button */}
          <div className="text-center">
            <button
              onClick={handleShowReceipt}
              disabled={!selectedCustomer || !selectedBill}
              className={`px-8 py-3 rounded-lg font-semibold text-white transition-colors ${
                selectedCustomer && selectedBill
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Generate Receipt
            </button>
            {(!selectedCustomer || !selectedBill) && (
              <p className="text-sm text-gray-500 mt-2">
                Please select both a customer and a bill to generate a receipt
              </p>
            )}
          </div>
        </div>

        {/* Receipt Display */}
        {showReceipt && (
          <Modal
            isOpen={showReceipt}
            onClose={handleCloseReceipt}
            title="Customer Receipt"
            size="xlarge"
            showCloseButton={true}
          >
            <CustomerReceipt
              customerId={parseInt(selectedCustomer)}
              billId={parseInt(selectedBill)}
              paymentId={selectedPayment ? parseInt(selectedPayment) : null}
              onClose={handleCloseReceipt}
            />
          </Modal>
        )}

        {/* Component Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Component Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Dynamic Data Loading</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Fetches real customer data from database</li>
                <li>• Retrieves actual billing information</li>
                <li>• Includes payment details when available</li>
                <li>• Automatically calculates senior citizen discounts</li>
                <li>• Shows meter readings and consumption</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Receipt Features</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Professional receipt layout matching official format</li>
                <li>• Print-friendly design with proper styling</li>
                <li>• Download functionality (to be implemented)</li>
                <li>• Responsive design for different screen sizes</li>
                <li>• Error handling and loading states</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Usage Instructions</h3>
            <p className="text-sm text-blue-700">
              To use this component in your application, pass the required props: <code>customerId</code>, <code>billId</code>, 
              and optionally <code>paymentId</code>. The component will automatically fetch and display the receipt data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptDemo;
