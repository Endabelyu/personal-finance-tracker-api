import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, ...props }, ref) => {
    const baseStyles = `
      block w-full rounded-lg border-gray-300
      shadow-sm
      text-gray-900 placeholder:text-gray-400
      focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
      disabled:bg-gray-50 disabled:text-gray-500
      transition-all duration-200 ease-out
    `;
    const errorStyles = error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
      : 'border-gray-300 hover:border-gray-400';
    const sizeStyles = 'px-3 py-2 text-sm h-10';

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={props.id} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`${baseStyles} ${errorStyles} ${sizeStyles} ${className}`}
          {...props}
        />
        {(error || helperText) && (
          <p className={`text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
