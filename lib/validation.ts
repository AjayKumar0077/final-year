/**
 * Centralized input validation utilities
 * Provides consistent validation across all forms
 */

import { DONATION_CONFIG, CASE_CONFIG, USER_CONFIG, URGENCY_CONFIG } from './config';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface ValidationRules {
  [field: string]: ((value: any) => string | null)[];
}

/**
 * Generic validator that runs a set of rules
 */
export function validate(data: Record<string, any>, rules: ValidationRules): ValidationResult {
  const errors: Record<string, string> = {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    for (const rule of fieldRules) {
      const error = rule(data[field]);
      if (error) {
        errors[field] = error;
        break; // Stop at first error for this field
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Common validators
export const validators = {
  /**
   * Required field validator
   */
  required: (fieldName: string = 'This field') => (value: any): string | null => {
    if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      return `${fieldName} is required`;
    }
    return null;
  },

  /**
   * Min length validator
   */
  minLength: (min: number, fieldName: string = 'This field') => (value: any): string | null => {
    if (!value) return null;
    if (String(value).length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  /**
   * Max length validator
   */
  maxLength: (max: number, fieldName: string = 'This field') => (value: any): string | null => {
    if (!value) return null;
    if (String(value).length > max) {
      return `${fieldName} must be at most ${max} characters`;
    }
    return null;
  },

  /**
   * Email validator
   */
  email: (fieldName: string = 'Email') => (value: any): string | null => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(value))) {
      return `${fieldName} must be a valid email address`;
    }
    return null;
  },

  /**
   * Password validator
   */
  password: (minLength: number = USER_CONFIG.MIN_PASSWORD_LENGTH) => (value: any): string | null => {
    if (!value) return null;
    if (String(value).length < minLength) {
      return `Password must be at least ${minLength} characters`;
    }
    return null;
  },

  /**
   * Phone validator
   */
  phone: (fieldName: string = 'Phone') => (value: any): string | null => {
    if (!value) return null;
    const cleaned = String(value).replace(/\D/g, '');
    if (cleaned.length < 10) {
      return `${fieldName} must be at least 10 digits`;
    }
    return null;
  },

  /**
   * Number range validator
   */
  numberRange: (min: number, max: number, fieldName: string = 'Value') => (value: any): string | null => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    if (isNaN(num) || num < min || num > max) {
      return `${fieldName} must be between ${min} and ${max}`;
    }
    return null;
  },

  /**
   * URL validator
   */
  url: (fieldName: string = 'URL') => (value: any): string | null => {
    if (!value) return null;
    try {
      new URL(String(value));
      return null;
    } catch {
      return `${fieldName} must be a valid URL`;
    }
  },

  /**
   * Custom regex validator
   */
  pattern: (pattern: RegExp, fieldName: string = 'This field', message?: string) => (value: any): string | null => {
    if (!value) return null;
    if (!pattern.test(String(value))) {
      return message || `${fieldName} format is invalid`;
    }
    return null;
  },

  /**
   * Enum validator
   */
  enum: (allowedValues: any[], fieldName: string = 'This field') => (value: any): string | null => {
    if (!value) return null;
    if (!allowedValues.includes(value)) {
      return `${fieldName} must be one of: ${allowedValues.join(', ')}`;
    }
    return null;
  },

  /**
   * Match validator (for confirming values, like password confirmation)
   */
  match: (matchValue: any, fieldName: string = 'This field') => (value: any): string | null => {
    if (value !== matchValue) {
      return `${fieldName} must match`;
    }
    return null;
  },

  /**
   * Custom validator function
   */
  custom: (fn: (value: any) => boolean, message: string = 'Invalid value') => (value: any): string | null => {
    if (!fn(value)) {
      return message;
    }
    return null;
  },
};

// Domain-specific validators
export const donationValidators = {
  description: [
    validators.required('Description'),
    validators.maxLength(DONATION_CONFIG.MAX_DESCRIPTION_LENGTH, 'Description'),
  ],
  quantity: [
    validators.required('Quantity'),
    validators.numberRange(DONATION_CONFIG.MIN_QUANTITY, DONATION_CONFIG.MAX_QUANTITY, 'Quantity'),
  ],
  location: [
    validators.required('Location'),
    validators.maxLength(DONATION_CONFIG.MAX_LOCATION_LENGTH, 'Location'),
  ],
  packagingImageDataUrl: [
    validators.required('Packaging image'),
  ],
};

export const caseValidators = {
  title: [
    validators.required('Title'),
    validators.maxLength(CASE_CONFIG.MAX_TITLE_LENGTH, 'Title'),
  ],
  description: [
    validators.maxLength(CASE_CONFIG.MAX_DESCRIPTION_LENGTH, 'Description'),
  ],
  peopleCount: [
    validators.required('People count'),
    validators.numberRange(CASE_CONFIG.MIN_PEOPLE_COUNT, CASE_CONFIG.MAX_PEOPLE_COUNT, 'People count'),
  ],
  location: [
    validators.required('Location'),
  ],
};

export const userValidators = {
  email: [
    validators.required('Email'),
    validators.email('Email'),
  ],
  password: [
    validators.required('Password'),
    validators.password(),
  ],
  confirmPassword: (password: string) => [
    validators.required('Confirm password'),
    validators.match(password, 'Passwords'),
  ],
  fullName: [
    validators.required('Full name'),
    validators.maxLength(USER_CONFIG.MAX_NAME_LENGTH, 'Full name'),
  ],
  phone: [
    validators.phone('Phone'),
  ],
};

/**
 * Validates a donation form submission
 */
export function validateDonationForm(data: {
  description?: string;
  quantity?: number;
  location?: string;
  packagingImageDataUrl?: string;
}): ValidationResult {
  return validate(data, {
    description: donationValidators.description,
    quantity: donationValidators.quantity,
    location: donationValidators.location,
    packagingImageDataUrl: donationValidators.packagingImageDataUrl,
  });
}

/**
 * Validates a case report form submission
 */
export function validateCaseForm(data: {
  title?: string;
  description?: string;
  peopleCount?: number;
  location?: string;
}): ValidationResult {
  return validate(data, {
    title: caseValidators.title,
    description: caseValidators.description,
    peopleCount: caseValidators.peopleCount,
    location: caseValidators.location,
  });
}

/**
 * Validates a signup form submission
 */
export function validateSignupForm(data: {
  email?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
}): ValidationResult {
  return validate(data, {
    email: userValidators.email,
    password: userValidators.password,
    confirmPassword: userValidators.confirmPassword(data.password || ''),
    fullName: userValidators.fullName,
  });
}

/**
 * Validates a login form submission
 */
export function validateLoginForm(data: {
  email?: string;
  password?: string;
}): ValidationResult {
  return validate(data, {
    email: userValidators.email,
    password: userValidators.password,
  });
}
