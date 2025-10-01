export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return re.test(password);
};

export const validatePhoneNumber = (phone) => {
  const re = /^\+?[\d\s-]{10,}$/;
  return re.test(phone);
};

export const validateRequired = (value) => {
  return value !== undefined && value !== null && value.trim() !== '';
};

export const validateNumber = (value) => {
  return !isNaN(value) && value > 0;
};

export const validateAmount = (value) => {
  return !isNaN(value) && value >= 0;
};

export const validateDate = (date) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};

export const validateForm = (values, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = values[field];
    const fieldRules = rules[field];
    
    if (fieldRules.required && !validateRequired(value)) {
      errors[field] = 'This field is required';
    }
    
    if (value && fieldRules.email && !validateEmail(value)) {
      errors[field] = 'Invalid email address';
    }
    
    if (value && fieldRules.password && !validatePassword(value)) {
      errors[field] = 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number';
    }
    
    if (value && fieldRules.phone && !validatePhoneNumber(value)) {
      errors[field] = 'Invalid phone number';
    }
    
    if (value && fieldRules.number && !validateNumber(value)) {
      errors[field] = 'Must be a positive number';
    }
    
    if (value && fieldRules.amount && !validateAmount(value)) {
      errors[field] = 'Must be a non-negative number';
    }
    
    if (value && fieldRules.date && !validateDate(value)) {
      errors[field] = 'Invalid date';
    }
  });
  
  return errors;
}; 