/**
 * Plant Doctor - Form Input Components
 * Clean, accessible form inputs with consistent styling
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, iconPosition = 'left', type = 'text', ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={cn(
              'w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-base transition-colors placeholder:text-gray-500 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:border-green-400 dark:focus:ring-green-400/20',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              icon && iconPosition === 'left' && 'pl-10',
              icon && iconPosition === 'right' && 'pr-10',
              className
            )}
            {...props}
          />
          {icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {hint && !error && <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  counter?: boolean;
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, hint, counter, maxLength, ...props }, ref) => {
    const [count, setCount] = React.useState(0);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          maxLength={maxLength}
          onChange={(e) => {
            setCount(e.target.value.length);
            props.onChange?.(e);
          }}
          className={cn(
            'w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-base transition-colors placeholder:text-gray-500 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:border-green-400 dark:focus:ring-green-400/20',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        <div className="flex items-center justify-between">
          <div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            {hint && !error && <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>}
          </div>
          {counter && maxLength && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {count} / {maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-base transition-colors bg-white dark:bg-gray-800 dark:border-gray-600 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed dark:focus:border-green-400 dark:focus:ring-green-400/20 dark:text-gray-100',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {hint && !error && <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex items-center gap-3">
        <input
          ref={ref}
          type="checkbox"
          className={cn(
            'h-5 w-5 rounded border-2 border-gray-300 text-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 checked:border-green-600 disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-green-600',
            error && 'border-red-500 checked:border-red-600 checked:bg-red-600',
            className
          )}
          {...props}
        />
        {label && (
          <label className="select-none text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <div className="flex items-center gap-3">
        <input
          ref={ref}
          type="radio"
          className={cn(
            'h-5 w-5 border-2 border-gray-300 text-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 checked:border-green-600 disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-green-600',
            className
          )}
          {...props}
        />
        {label && (
          <label className="select-none text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

export { Input, TextArea, Select, Checkbox, Radio };
export type { InputProps, TextAreaProps, SelectProps, CheckboxProps, RadioProps };
