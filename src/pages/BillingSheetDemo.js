import React, { useState } from 'react';
import BillingSheet from '../components/BillingSheet';

const BillingSheetDemo = () => {
  const [showBillingSheet, setShowBillingSheet] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('DECEMBER');
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedCollector, setSelectedCollector] = useState('DOLORES A');

  const months = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const years = ['2023', '2024', '2025'];
  const collectors = ['DOLORES A', 'DOLORES B', 'DOLORES C', 'COLLECTOR 1', 'COLLECTOR 2'];

  const handleShowBillingSheet = () => {
    setShowBillingSheet(true);
  };

  const handleCloseBillingSheet = () => {
    setShowBillingSheet(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Daily Collector Billing Sheet Demo</h1>
          <p className="text-gray-600 mb-6">
            This demo shows the Daily Collector Billing Sheet component that matches the exact format of the scanned document.
            Select month, year, and collector to generate the billing sheet.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Month Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {months.map(month => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Collector Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Collector
              </label>
              <select
                value={selectedCollector}
                onChange={(e) => setSelectedCollector(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {collectors.map(collector => (
                  <option key={collector} value={collector}>
                    {collector}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Generate Billing Sheet Button */}
          <div className="text-center">
            <button
              onClick={handleShowBillingSheet}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Generate Daily Collector Billing Sheet
            </button>
          </div>
        </div>

        {/* Component Information */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Billing Sheet Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Header Section</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• "DAILY COLLECTOR" title</li>
                <li>• Collector name (e.g., "DOLORES A")</li>
                <li>• Month and year billing period</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Main Table Columns</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Consumer zone and name</li>
                <li>• Status (ACTIVE/SC for Senior Citizen)</li>
                <li>• Meter readings (Present/Previous/Used)</li>
                <li>• Amount breakdown (Bill/SCD/Total)</li>
                <li>• Payment details (OR No./Date/Penalty/After Due/Surcharge)</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="font-semibold text-gray-700 mb-2">Summary Section</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Total consumption (USED)</li>
              <li>• Total bill amounts (OF BILL)</li>
              <li>• Senior citizen discounts (SCD)</li>
              <li>• Penalties and surcharges</li>
              <li>• Final amounts after due</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Billing Sheet Modal */}
      {showBillingSheet && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-full w-full max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  Daily Collector Billing Sheet - {selectedMonth} {selectedYear}
                </h2>
                <button
                  onClick={handleCloseBillingSheet}
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
                month={selectedMonth}
                year={selectedYear}
                collector={selectedCollector}
                onClose={handleCloseBillingSheet}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingSheetDemo;









