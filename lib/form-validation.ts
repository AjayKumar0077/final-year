/**
 * Form Validation Utilities
 * 
 * Comprehensive validation functions with clear error messages
 * for all form fields across the application
 * 
 * @module lib/form-validation
 */

export interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Email validation regex pattern
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Phone validation regex (supports multiple formats)
 */
const PHONE_REGEX = /^[\d\s\-\+\(\)]{10,}$/;

/**
 * Strong password requirements:
 * - At least 8 characters
 * - Contains uppercase letter
 * - Contains lowercase letter
 * - Contains number
 * - Contains special character
 */
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Validate email address
 * @param email - Email to validate
 * @returns Validation result with error if invalid
 */
export function validateEmail(email: string): ValidationError | null {
  const trimmed = email.trim();

  if (!trimmed) {
    return {
      field: 'email',
      message: 'Email address is required',
      type: 'error',
    };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return {
      field: 'email',
      message: 'Please enter a valid email address',
      type: 'error',
    };
  }

  return null;
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Validation result with error if weak
 */
export function validatePassword(password: string): ValidationError | null {
  if (!password) {
    return {
      field: 'password',
      message: 'Password is required',
      type: 'error',
    };
  }

  if (password.length < 6) {
    return {
      field: 'password',
      message: 'Password must be at least 6 characters',
      type: 'error',
    };
  }

  if (!STRONG_PASSWORD_REGEX.test(password)) {
    return {
      field: 'password',
      message:
        'Password should contain uppercase, lowercase, number, and special character (@$!%*?&) for better security',
      type: 'warning',
    };
  }

  return null;
}

/**
 * Validate password confirmation
 * @param password - Original password
 * @param confirm - Confirmation password
 * @returns Validation result with error if mismatch
 */
export function validatePasswordConfirm(password: string, confirm: string): ValidationError | null {
  if (!confirm) {
    return {
      field: 'confirmPassword',
      message: 'Please confirm your password',
      type: 'error',
    };
  }

  if (password !== confirm) {
    return {
      field: 'confirmPassword',
      message: 'Passwords do not match',
      type: 'error',
    };
  }

  return null;
}

/**
 * Validate full name
 * @param name - Name to validate
 * @returns Validation result with error if invalid
 */
export function validateFullName(name: string): ValidationError | null {
  const trimmed = name.trim();

  if (!trimmed) {
    return {
      field: 'fullName',
      message: 'Full name is required',
      type: 'error',
    };
  }

  if (trimmed.length < 3) {
    return {
      field: 'fullName',
      message: 'Name must be at least 3 characters',
      type: 'error',
    };
  }

  if (trimmed.length > 100) {
    return {
      field: 'fullName',
      message: 'Name must not exceed 100 characters',
      type: 'error',
    };
  }

  return null;
}

/**
 * Validate phone number
 * @param phone - Phone number to validate
 * @returns Validation result with error if invalid
 */
export function validatePhone(phone: string): ValidationError | null {
  const trimmed = phone.trim();

  if (!trimmed) {
    return {
      field: 'phone',
      message: 'Phone number is required',
      type: 'error',
    };
  }

  if (!PHONE_REGEX.test(trimmed)) {
    return {
      field: 'phone',
      message: 'Please enter a valid phone number (at least 10 digits)',
      type: 'error',
    };
  }

  return null;
}

/**
 * Validate address
 * @param address - Address to validate
 * @returns Validation result with error if invalid
 */
export function validateAddress(address: string): ValidationError | null {
  const trimmed = address.trim();

  if (!trimmed) {
    return {
      field: 'address',
      message: 'Address is required',
      type: 'error',
    };
  }

  if (trimmed.length < 5) {
    return {
      field: 'address',
      message: 'Address must be at least 5 characters',
      type: 'error',
    };
  }

  if (trimmed.length > 500) {
    return {
      field: 'address',
      message: 'Address must not exceed 500 characters',
      type: 'error',
    };
  }

  return null;
}

/**
 * Validate required field
 * @param value - Value to validate
 * @param fieldName - Name of the field for error message
 * @returns Validation result with error if empty
 */
export function validateRequired(value: string, fieldName: string): ValidationError | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
      type: 'error',
    };
  }

  return null;
}

/**
 * Validate checkbox (consent)
 * @param checked - Whether checkbox is checked
 * @param fieldName - Name of the field for error message
 * @returns Validation result with error if not checked
 */
export function validateCheckbox(checked: boolean, fieldName: string): ValidationError | null {
  if (!checked) {
    return {
      field: fieldName,
      message: `You must accept ${fieldName}`,
      type: 'error',
    };
  }

  return null;
}

/**
 * Validate a complete signup form
 * @param data - Form data object
 * @returns ValidationResult with all errors
 */
export function validateSignupForm(data: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}): ValidationResult {
  const errors: ValidationError[] = [];

  const nameError = validateFullName(data.fullName);
  if (nameError) errors.push(nameError);

  const emailError = validateEmail(data.email);
  if (emailError) errors.push(emailError);

  const passwordError = validatePassword(data.password);
  if (passwordError) errors.push(passwordError);

  const confirmError = validatePasswordConfirm(data.password, data.confirmPassword);
  if (confirmError) errors.push(confirmError);

  return {
    isValid: errors.every((e) => e.type !== 'error'),
    errors,
  };
}

/**
 * Validate a complete KYC form
 * @param data - KYC form data object
 * @returns ValidationResult with all errors
 */
export function validateKycForm(data: {
  phone: string;
  address: string;
  city: string;
  country: string;
  idNumber: string;
  consentAccepted: boolean;
}): ValidationResult {
  const errors: ValidationError[] = [];

  const phoneError = validatePhone(data.phone);
  if (phoneError) errors.push(phoneError);

  const addressError = validateAddress(data.address);
  if (addressError) errors.push(addressError);

  const cityError = validateRequired(data.city, 'City');
  if (cityError) errors.push(cityError);

  const countryError = validateRequired(data.country, 'Country');
  if (countryError) errors.push(countryError);

  const idError = validateRequired(data.idNumber, 'ID Number');
  if (idError) errors.push(idError);

  const consentError = validateCheckbox(data.consentAccepted, 'KYC consent');
  if (consentError) errors.push(consentError);

  return {
    isValid: errors.every((e) => e.type !== 'error'),
    errors,
  };
}

/**
 * Get all errors for a specific field
 * @param errors - Array of validation errors
 * @param field - Field name to filter by
 * @returns Array of errors for the specified field
 */
export function getFieldErrors(errors: ValidationError[], field: string): ValidationError[] {
  return errors.filter((e) => e.field === field);
}

/**
 * Check if a field has any errors
 * @param errors - Array of validation errors
 * @param field - Field name to check
 * @returns True if field has errors
 */
export function hasFieldError(errors: ValidationError[], field: string): boolean {
  return errors.some((e) => e.field === field && e.type === 'error');
}

/**
 * Get error message for a field
 * @param errors - Array of validation errors
 * @param field - Field name
 * @returns Error message or null
 */
export function getFieldErrorMessage(errors: ValidationError[], field: string): string | null {
  const error = errors.find((e) => e.field === field && e.type === 'error');
  return error?.message || null;
}
