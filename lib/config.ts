/**
 * Centralized application configuration
 * Single source of truth for constants, limits, and settings
 */

// Image constraints
export const IMAGE_CONSTRAINTS = {
  MAX_SIZE_BYTES: 3 * 1024 * 1024, // 3MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  DEFAULT_QUALITY: 0.8,
};

// Donation constraints
export const DONATION_CONFIG = {
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 500,
  DEFAULT_QUANTITY: 1,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_LOCATION_LENGTH: 200,
  SEARCH_RADIUS_KM: 50,
};

// Mission constraints
export const MISSION_CONFIG = {
  STATUSES: ['pending', 'in_progress', 'completed', 'cancelled'] as const,
  PRIORITIES: ['low', 'normal', 'high', 'urgent'] as const,
  DEFAULT_PRIORITY: 'normal' as const,
};

// Case report constraints
export const CASE_CONFIG = {
  STATUSES: ['unverified', 'verified', 'in_progress', 'completed'] as const,
  MIN_PEOPLE_COUNT: 1,
  MAX_PEOPLE_COUNT: 1000,
  DEFAULT_PEOPLE_COUNT: 1,
  MAX_TITLE_LENGTH: 150,
  MAX_DESCRIPTION_LENGTH: 1000,
};

// User constraints
export const USER_CONFIG = {
  ROLES: ['donor', 'reporter', 'ngo', 'volunteer', 'admin'] as const,
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 100,
  MAX_BIO_LENGTH: 500,
};

// API and data fetching
export const DATA_FETCH_CONFIG = {
  DONATION_LIMIT: 10,
  CASE_LIMIT: 20,
  MISSION_LIMIT: 15,
  VOLUNTEER_LIMIT: 50,
  REFETCH_INTERVAL_MS: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
};

// Geolocation
export const GEO_CONFIG = {
  DEFAULT_LOCATION: {
    latitude: 10.4747,
    longitude: 77.75,
    label: 'Oddanchatram, Dindigul, Tamil Nadu, India',
  },
  DEMO_DONATION_ZONES: [
    {
      id: 'demo-donor-oddanchatram-central',
      label: 'Demo Donor - Oddanchatram Central',
      latitude: 10.4747,
      longitude: 77.75,
      description: 'Fresh produce and packaged meals demo drop-off',
      color: '#16a34a',
    },
    {
      id: 'demo-donor-oddanchatram-east',
      label: 'Demo Donor - Oddanchatram East',
      latitude: 10.4996,
      longitude: 77.7625,
      description: 'Bakery goods and dry staples demo drop-off',
      color: '#2563eb',
    },
    {
      id: 'demo-donor-oddanchatram-south',
      label: 'Demo Donor - Oddanchatram South',
      latitude: 10.4749,
      longitude: 77.7314,
      description: 'Community meals demo drop-off',
      color: '#f59e0b',
    },
  ],
  INDIA_BOUNDS: {
    NORTH: 35.5,
    SOUTH: 8.4,
    EAST: 97.25,
    WEST: 68.7,
  },
  DEFAULT_ZOOM: 12,
  ANIMATION_DURATION_MS: 1500,
};

// Urgency scoring
export const URGENCY_CONFIG = {
  SCORE_RANGES: {
    CRITICAL: { min: 80, max: 100, label: 'Critical' },
    HIGH: { min: 60, max: 79, label: 'High' },
    MEDIUM: { min: 40, max: 59, label: 'Medium' },
    LOW: { min: 0, max: 39, label: 'Low' },
  },
};

// UI/UX
export const UI_CONFIG = {
  ANIMATION_DURATION_MS: 300,
  TOAST_DURATION_MS: 5000,
  DEBOUNCE_DELAY_MS: 300,
  SPINNER_SIZE: 'w-12 h-12',
};

// Feature flags
export const FEATURES = {
  ENABLE_SATELLITE_MAPS: true,
  ENABLE_LIVE_TRACKING: true,
  ENABLE_AUDIT_LOGGING: true,
  ENABLE_TEXT_CLASSIFICATION: true,
  ENABLE_GEO_VALIDATION: true,
};

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  LOCATION_DENIED: 'Location permission denied. Enable it in browser settings.',
  LOCATION_UNAVAILABLE: 'Unable to get your location. Please check your internet.',
  IMAGE_TOO_LARGE: `Image must be under ${IMAGE_CONSTRAINTS.MAX_SIZE_BYTES / (1024 * 1024)}MB`,
  IMAGE_INVALID_TYPE: `Only ${IMAGE_CONSTRAINTS.ALLOWED_TYPES.join(', ')} are allowed`,
  INVALID_LOCATION: 'Location must be within India',
  NETWORK_ERROR: 'Network error. Check your internet connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  DONATION_CREATED: 'Donation published successfully!',
  CASE_REPORTED: 'Case reported successfully!',
  MISSION_ASSIGNED: 'Mission assigned successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  LOGOUT_SUCCESS: 'Logged out successfully!',
};

export type ImageType = (typeof IMAGE_CONSTRAINTS.ALLOWED_TYPES)[number];
export type MissionStatus = (typeof MISSION_CONFIG.STATUSES)[number];
export type MissionPriority = (typeof MISSION_CONFIG.PRIORITIES)[number];
export type CaseStatus = (typeof CASE_CONFIG.STATUSES)[number];
export type UserRole = (typeof USER_CONFIG.ROLES)[number];
