/**
 * Formats a name to show surname first with proper capitalization
 * @param {string} firstName - First name
 * @param {string} lastName - Last name (surname)
 * @returns {string} Formatted name as "LastName, FirstName" with capitalized first letters
 */
export const formatName = (firstName, lastName) => {
  if (!firstName && !lastName) return 'User';
  
  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };
  
  const formattedFirstName = capitalize(firstName || '');
  const formattedLastName = capitalize(lastName || '');
  
  if (formattedLastName && formattedFirstName) {
    return `${formattedLastName}, ${formattedFirstName}`;
  } else if (formattedLastName) {
    return formattedLastName;
  } else if (formattedFirstName) {
    return formattedFirstName;
  }
  
  return 'User';
};

/**
 * Formats a name from an object with firstName and lastName properties
 * @param {Object} user - User object with firstName and lastName
 * @returns {string} Formatted name
 */
export const formatUserName = (user) => {
  if (!user) return 'User';
  return formatName(user.firstName || user.first_name, user.lastName || user.last_name);
};

