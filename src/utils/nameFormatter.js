/**
 * Formats a single name string to Title Case (capitalizes first letter of each word)
 * @param {string} name - Name string to format
 * @returns {string} Formatted name in Title Case
 */
export const formatNameToTitleCase = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formats a name to show surname first with proper capitalization
 * @param {string} firstName - First name
 * @param {string} lastName - Last name (surname)
 * @returns {string} Formatted name as "LastName, FirstName" with proper Title Case
 */
export const formatName = (firstName, lastName) => {
  if (!firstName && !lastName) return 'User';
  
  const formattedFirstName = formatNameToTitleCase(firstName || '');
  const formattedLastName = formatNameToTitleCase(lastName || '');
  
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

