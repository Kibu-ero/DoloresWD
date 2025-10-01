# CustomerReceipt Component

## Overview
The `CustomerReceipt` component is a dynamic, professional receipt generator that creates official-looking receipts for the Dolores Water District billing system. It fetches real customer and billing data from the database and displays it in a format that matches the official receipt design.

## Features

### 🎯 Dynamic Data Loading
- **Customer Information**: Automatically fetches customer details (name, address, meter number, etc.)
- **Billing Details**: Retrieves actual bill amounts, readings, consumption, and due dates
- **Payment Information**: Includes payment method, amount paid, and change given
- **Senior Citizen Discounts**: Automatically calculates 20% SCPWD discounts for eligible customers

### 🖨️ Professional Layout
- **Official Design**: Matches the scanned receipt format from Dolores Water District
- **Print-Friendly**: Optimized for printing with proper page breaks and styling
- **Responsive**: Works on different screen sizes
- **Professional Typography**: Clear, readable text with proper spacing

### 🔧 Interactive Features
- **Print Functionality**: One-click printing with browser print dialog
- **Download Support**: Ready for PDF/image download implementation
- **Refresh Data**: Reload receipt data if needed
- **Error Handling**: Graceful error states with retry options

## Usage

### Basic Implementation
```jsx
import CustomerReceipt from '../components/CustomerReceipt';

// Simple usage with required props
<CustomerReceipt
  customerId={123}
  billId={456}
/>
```

### Full Implementation with Payment
```jsx
<CustomerReceipt
  customerId={123}
  billId={456}
  paymentId={789}
  onClose={() => setShowReceipt(false)}
/>
```

### In a Modal
```jsx
import Modal from '../components/common/Modal';

<Modal
  isOpen={showReceipt}
  onClose={() => setShowReceipt(false)}
  title="Customer Receipt"
  size="xlarge"
>
  <CustomerReceipt
    customerId={customerId}
    billId={billId}
    paymentId={paymentId}
    onClose={() => setShowReceipt(false)}
  />
</Modal>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `customerId` | number | ✅ | Customer ID from the database |
| `billId` | number | ✅ | Bill ID from the billing table |
| `paymentId` | number | ❌ | Optional payment ID for payment details |
| `isPrintable` | boolean | ❌ | Set to true when printing (default: false) |
| `onClose` | function | ❌ | Callback function to close the receipt |

## Data Structure

The component automatically fetches and formats the following data:

### Customer Data
- First and last name
- Complete address (street, barangay, city, province)
- Meter number
- Business information (if applicable)
- Senior citizen status

### Billing Data
- Bill amount
- Previous and current meter readings
- Water consumption
- Due date and billing date
- Penalty amounts (if any)

### Payment Data (if available)
- Amount paid
- Payment method (Cash, Check, Card)
- Receipt number
- Change given
- Payment date

## API Endpoints Used

The component uses these services to fetch data:

```jsx
import CustomerService from '../services/customer.service';
import BillingService from '../services/billing.service';

// Fetches customer data
const customer = await CustomerService.getCustomerById(customerId);

// Fetches bill data
const bill = await BillingService.getBillById(billId);

// Fetches payment data (optional)
const payment = await fetch(`/api/cashier-billing/customer/${customerId}`);
```

## Styling

### Print Styles
The component includes comprehensive print styles in `src/index.css`:
- Proper page margins and sizing
- Color preservation for important elements
- Page break prevention
- Optimized spacing for printed output

### Tailwind Classes
Uses Tailwind CSS for responsive design:
- Grid layouts for receipt sections
- Responsive text sizing
- Professional color scheme
- Proper spacing and borders

## Integration Examples

### Cashier Dashboard
```jsx
// In CashierDashboard.js
const [showReceipt, setShowReceipt] = useState(false);
const [receiptDetails, setReceiptDetails] = useState(null);

// After successful payment
setReceiptDetails({
  bill: selectedBill,
  payment: paymentData,
  change: change
});
setShowReceipt(true);

// In render
{showReceipt && receiptDetails && (
  <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
      <CustomerReceipt
        customerId={receiptDetails.bill.customer_id}
        billId={receiptDetails.bill.id}
        paymentId={receiptDetails.payment?.id}
        onClose={() => setShowReceipt(false)}
      />
    </div>
  </div>
)}
```

### Customer Dashboard
```jsx
// In CustomerDashboard.js
<CustomerReceipt
  customerId={currentCustomer.id}
  billId={selectedBill.id}
  isPrintable={true}
/>
```

## Customization

### Modifying Receipt Layout
The receipt layout is structured in sections:
1. **Header**: Company logo and information
2. **Receipt Title**: Official receipt designation
3. **Receipt Details**: Number and date
4. **Left Column**: Settlement and billing details
5. **Right Column**: Customer and payment information
6. **Footer**: Printer details and disclaimers

### Adding New Fields
To add new fields, modify the `fetchReceiptData` function and add the corresponding display elements in the JSX.

### Styling Changes
Modify the Tailwind classes or add custom CSS in `src/index.css` for print-specific styling.

## Error Handling

The component includes comprehensive error handling:
- **Loading States**: Shows spinner while fetching data
- **Error States**: Displays error messages with retry options
- **Data Validation**: Checks for required data before rendering
- **Graceful Degradation**: Falls back to default values when data is missing

## Performance Considerations

- **Data Fetching**: Only fetches data when component mounts or refreshes
- **Conditional Rendering**: Only shows sections when data is available
- **Print Optimization**: Hides unnecessary elements during printing
- **Memory Management**: Properly cleans up state and effects

## Future Enhancements

- **PDF Generation**: Implement actual PDF download functionality
- **Email Integration**: Send receipts via email
- **Digital Signatures**: Add digital signature support
- **Multi-language**: Support for different languages
- **Receipt Templates**: Multiple receipt design options

## Troubleshooting

### Common Issues

1. **Data Not Loading**
   - Check if customerId and billId are valid
   - Verify API endpoints are accessible
   - Check browser console for errors

2. **Print Issues**
   - Ensure print styles are loaded
   - Check browser print settings
   - Verify page margins are appropriate

3. **Styling Problems**
   - Check Tailwind CSS is properly configured
   - Verify custom CSS is loaded
   - Check for CSS conflicts

### Debug Mode
Add console logs in the `fetchReceiptData` function to debug data fetching issues.

## Support

For issues or questions about the CustomerReceipt component:
1. Check the browser console for error messages
2. Verify all required props are passed correctly
3. Ensure API services are working properly
4. Check the network tab for failed requests
