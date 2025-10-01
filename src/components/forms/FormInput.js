import React from 'react';
import { validateForm } from '../../utils/validation';

const FormInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  validation = {},
  placeholder = '',
  className = '',
  disabled = false
}) => {
  const handleChange = (e) => {
    const { value } = e.target;
    let error = '';

    if (required && !value) {
      error = 'This field is required';
    } else if (value) {
      const validationErrors = validateForm({ [name]: value }, { [name]: validation });
      error = validationErrors[name];
    }

    onChange(e, error);
  };

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100' : 'bg-white'}`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default FormInput; 