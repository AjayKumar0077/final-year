/**
 * FormField Component
 * 
 * A reusable form field wrapper with validation feedback,
 * error messages, and loading states
 * 
 * @component
 * @example
 * <FormField
 *   label="Email"
 *   error={emailError}
 *   required
 * >
 *   <Input
 *     type="email"
 *     value={email}
 *     onChange={(e) => setEmail(e.target.value)}
 *     placeholder="you@example.com"
 *   />
 * </FormField>
 */

import { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface FormFieldProps {
  /** Field label displayed above input */
  label: string;
  /** Form field children (usually Input component) */
  children: ReactNode;
  /** Error message if validation failed */
  error?: string | null;
  /** Warning message (non-blocking) */
  warning?: string | null;
  /** Helper text displayed below field */
  helperText?: string;
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Whether field is showing success state */
  success?: boolean;
  /** Custom className for wrapper */
  className?: string;
}

/**
 * FormField - Wrapper component for form inputs with validation feedback
 */
export function FormField({
  label,
  children,
  error,
  warning,
  helperText,
  required = false,
  disabled = false,
  success = false,
  className = '',
}: FormFieldProps) {
  const hasError = !!error;
  const hasWarning = !!warning && !hasError;
  const showSuccess = success && !hasError && !hasWarning;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <div className="flex items-center gap-1">
        <label className="block text-sm font-semibold text-slate-900">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {disabled && (
          <span className="text-xs text-slate-500 font-medium">(disabled)</span>
        )}
      </div>

      {/* Input Container with border color based on state */}
      <div
        className={`relative rounded-lg border-2 transition-colors ${
          hasError
            ? 'border-red-300 bg-red-50/30'
            : hasWarning
              ? 'border-yellow-300 bg-yellow-50/30'
              : showSuccess
                ? 'border-green-300 bg-green-50/30'
                : 'border-slate-200 bg-slate-50/50'
        }`}
      >
        {/* Child input */}
        <div className="relative">
          {children}

          {/* Status Icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {hasError && <AlertCircle className="w-5 h-5 text-red-500" />}
            {hasWarning && <AlertCircle className="w-5 h-5 text-yellow-500" />}
            {showSuccess && <CheckCircle2 className="w-5 h-5 text-green-500" />}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {hasError && (
        <div className="flex gap-2 text-sm">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Warning Message */}
      {hasWarning && (
        <div className="flex gap-2 text-sm">
          <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <span className="text-yellow-700">{warning}</span>
        </div>
      )}

      {/* Helper Text */}
      {helperText && !hasError && !hasWarning && (
        <div className="flex gap-2 text-xs">
          <Info className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
          <span className="text-slate-600">{helperText}</span>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <p className="text-xs text-green-700">✓ Looks good!</p>
      )}
    </div>
  );
}
