/**
 * Centralized error handling and logging
 * Provides consistent error management across the app
 */

import { ERROR_MESSAGES } from './config';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AppError {
  code: string;
  message: string;
  severity: ErrorSeverity;
  details?: Record<string, unknown>;
  timestamp: Date;
  userMessage: string;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  requestId?: string;
}

/**
 * Error logger with context
 */
class AppErrorHandler {
  private context: ErrorContext = {};

  /**
   * Set context for error logging
   */
  setContext(context: Partial<ErrorContext>) {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear context
   */
  clearContext() {
    this.context = {};
  }

  /**
   * Create an AppError
   */
  createError(
    code: string,
    message: string,
    severity: ErrorSeverity = 'error',
    userMessage?: string,
    details?: Record<string, unknown>,
  ): AppError {
    return {
      code,
      message,
      severity,
      details: { ...details, context: this.context },
      timestamp: new Date(),
      userMessage: userMessage || ERROR_MESSAGES.GENERIC,
    };
  }

  /**
   * Log error
   */
  log(error: AppError | Error | string, severity: ErrorSeverity = 'error') {
    let appError: AppError;

    if (typeof error === 'string') {
      appError = this.createError('UNKNOWN', error, severity);
      } else if ('code' in error && 'message' in error && 'severity' in error && 'timestamp' in error && 'userMessage' in error) {
      appError = error;
    } else {
      appError = this.createError(
        'EXCEPTION',
        error.message || 'Unknown error',
        severity,
        undefined,
        {
          name: error.name,
          stack: error.stack,
        },
      );
    }

    // Log based on severity
    switch (appError.severity) {
      case 'critical':
        console.error('🔴 CRITICAL:', appError);
        break;
      case 'error':
        console.error('❌ ERROR:', appError);
        break;
      case 'warning':
        console.warn('⚠️ WARNING:', appError);
        break;
      case 'info':
        console.info('ℹ️ INFO:', appError);
        break;
    }

    return appError;
  }

  /**
   * Handle location errors
   */
  handleLocationError(error: GeolocationPositionError | Error | string): AppError {
    let code = 'GEO_UNKNOWN';
    let message = 'Unknown location error';
    let userMessage = ERROR_MESSAGES.LOCATION_UNAVAILABLE;

    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof GeolocationPositionError) {
      switch (error.code) {
        case GeolocationPositionError.PERMISSION_DENIED:
          code = 'GEO_PERMISSION_DENIED';
          message = 'User denied geolocation';
          userMessage = ERROR_MESSAGES.LOCATION_DENIED;
          break;
        case GeolocationPositionError.POSITION_UNAVAILABLE:
          code = 'GEO_POSITION_UNAVAILABLE';
          message = 'Position unavailable';
          break;
        case GeolocationPositionError.TIMEOUT:
          code = 'GEO_TIMEOUT';
          message = 'Geolocation timeout';
          break;
      }
    } else {
      message = error.message || 'Location error';
    }

    return this.createError(code, message, 'warning', userMessage);
  }

  /**
   * Handle network errors
   */
  handleNetworkError(error: Error | string): AppError {
    const message = typeof error === 'string' ? error : error.message;
    return this.createError('NETWORK_ERROR', message, 'error', ERROR_MESSAGES.NETWORK_ERROR);
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(error: Error | string): AppError {
    const message = typeof error === 'string' ? error : error.message;

    if (message.includes('session') || message.includes('expired')) {
      return this.createError('AUTH_SESSION_EXPIRED', message, 'error', ERROR_MESSAGES.SESSION_EXPIRED);
    }

    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return this.createError('AUTH_UNAUTHORIZED', message, 'error', ERROR_MESSAGES.UNAUTHORIZED);
    }

    return this.createError('AUTH_ERROR', message, 'error');
  }

  /**
   * Handle validation errors
   */
  handleValidationError(fields: Record<string, string>): AppError {
    const fieldList = Object.entries(fields)
      .map(([field, error]) => `${field}: ${error}`)
      .join('; ');

    return this.createError('VALIDATION_ERROR', fieldList, 'warning', `Please check: ${fieldList}`);
  }

  /**
   * Handle image errors
   */
  handleImageError(error: string | Error): AppError {
    const message = typeof error === 'string' ? error : error.message;

    if (message.includes('size') || message.includes('too large')) {
      return this.createError('IMAGE_TOO_LARGE', message, 'warning', ERROR_MESSAGES.IMAGE_TOO_LARGE);
    }

    if (message.includes('type') || message.includes('format')) {
      return this.createError('IMAGE_INVALID_TYPE', message, 'warning', ERROR_MESSAGES.IMAGE_INVALID_TYPE);
    }

    return this.createError('IMAGE_ERROR', message, 'error');
  }

  /**
   * Handle database errors
   */
  handleDatabaseError(error: Error | string): AppError {
    const message = typeof error === 'string' ? error : error.message;
    return this.createError('DATABASE_ERROR', message, 'error', ERROR_MESSAGES.GENERIC);
  }

  /**
   * Retry operation with exponential backoff
   */
  async retry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delayMs: number = 1000,
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
        const delay = delayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries exceeded');
  }
}

// Export singleton instance
export const errorHandler = new AppErrorHandler();

/**
 * Hook for using error handler in React components
 */
export function useErrorHandler() {
  return {
    createError: errorHandler.createError.bind(errorHandler),
    log: errorHandler.log.bind(errorHandler),
    handleLocationError: errorHandler.handleLocationError.bind(errorHandler),
    handleNetworkError: errorHandler.handleNetworkError.bind(errorHandler),
    handleAuthError: errorHandler.handleAuthError.bind(errorHandler),
    handleValidationError: errorHandler.handleValidationError.bind(errorHandler),
    handleImageError: errorHandler.handleImageError.bind(errorHandler),
    handleDatabaseError: errorHandler.handleDatabaseError.bind(errorHandler),
    retry: errorHandler.retry.bind(errorHandler),
    setContext: errorHandler.setContext.bind(errorHandler),
    clearContext: errorHandler.clearContext.bind(errorHandler),
  };
}
