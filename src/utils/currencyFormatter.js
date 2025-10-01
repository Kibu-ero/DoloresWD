/**
 * Format currency with proper comma separators
 * @param {number|string} amount - The amount to format
 * @param {string} currency - Currency symbol (default: '₱')
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency string
 * 
 * Examples:
 * formatCurrency(1500) → "₱1,500.00"
 * formatCurrency(1234567.89) → "₱1,234,567.89"
 * formatCurrency(100) → "₱100.00"
 * formatCurrency(0) → "₱0.00"
 */
export const formatCurrency = (amount, currency = '₱', decimals = 2) => {
  if (amount === null || amount === undefined || amount === '') {
    return `${currency}0.00`;
  }

  // Convert to number
  const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount);
  
  if (isNaN(numericAmount)) {
    return `${currency}0.00`;
  }

  // Format with commas and fixed decimal places
  const formattedAmount = numericAmount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return `${currency}${formattedAmount}`;
};

/**
 * Format currency without symbol (just the number with commas)
 * @param {number|string} amount - The amount to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number string
 * 
 * Examples:
 * formatNumber(1500) → "1,500.00"
 * formatNumber(1234567.89) → "1,234,567.89"
 */
export const formatNumber = (amount, decimals = 2) => {
  if (amount === null || amount === undefined || amount === '') {
    return '0.00';
  }

  const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount);
  
  if (isNaN(numericAmount)) {
    return '0.00';
  }

  return numericAmount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}; 