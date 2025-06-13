'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
}

export function AnimatedInput({ 
  label, 
  error, 
  success,
  className,
  ...props 
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(!!e.target.value);
    props.onChange?.(e);
  };

  return (
    <div className="relative">
      <input
        {...props}
        onChange={handleChange}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        className={cn(
          "peer w-full px-4 pt-6 pb-2 text-gray-900 bg-white rounded-lg border",
          "transition-all duration-200 ease-out",
          "focus:outline-none focus:ring-2",
          isFocused && "shadow-sm",
          error ? "border-red-500 focus:ring-red-200" : success ? "border-green-500 focus:ring-green-200" : "border-gray-300 focus:ring-gray-200 focus:border-gray-400",
          className
        )}
        placeholder=" "
      />
      {label && (
        <label
          className={cn(
            "absolute left-4 text-gray-600 transition-all duration-200 ease-out pointer-events-none",
            "peer-placeholder-shown:top-4 peer-placeholder-shown:text-base",
            "peer-focus:top-1.5 peer-focus:text-xs",
            (isFocused || hasValue) ? "top-1.5 text-xs" : "top-4 text-base",
            error && "text-red-600",
            success && "text-green-600"
          )}
        >
          {label}
        </label>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600 animate-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
}

interface AnimatedTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: boolean;
}

export function AnimatedTextArea({ 
  label, 
  error, 
  success,
  className,
  ...props 
}: AnimatedTextAreaProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHasValue(!!e.target.value);
    props.onChange?.(e);
  };

  return (
    <div className="relative">
      <textarea
        {...props}
        onChange={handleChange}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        className={cn(
          "peer w-full px-4 pt-6 pb-2 text-gray-900 bg-white rounded-lg border",
          "transition-all duration-200 ease-out resize-none",
          "focus:outline-none focus:ring-2",
          isFocused && "shadow-sm",
          error ? "border-red-500 focus:ring-red-200" : success ? "border-green-500 focus:ring-green-200" : "border-gray-300 focus:ring-gray-200 focus:border-gray-400",
          className
        )}
        placeholder=" "
      />
      {label && (
        <label
          className={cn(
            "absolute left-4 text-gray-600 transition-all duration-200 ease-out pointer-events-none",
            "peer-placeholder-shown:top-4 peer-placeholder-shown:text-base",
            "peer-focus:top-1.5 peer-focus:text-xs",
            (isFocused || hasValue) ? "top-1.5 text-xs" : "top-4 text-base",
            error && "text-red-600",
            success && "text-green-600"
          )}
        >
          {label}
        </label>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600 animate-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
}

interface AnimatedCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function AnimatedCheckbox({ label, className, ...props }: AnimatedCheckboxProps) {
  return (
    <label className={cn("relative flex items-center gap-3 cursor-pointer group", className)}>
      <input
        type="checkbox"
        className="sr-only peer"
        {...props}
      />
      <div className="relative w-5 h-5">
        <div className={cn(
          "absolute inset-0 bg-white border-2 rounded transition-all duration-200",
          "peer-checked:bg-gray-900 peer-checked:border-gray-900",
          "peer-focus:ring-2 peer-focus:ring-gray-200 peer-focus:ring-offset-2",
          "group-hover:border-gray-400"
        )} />
        <svg
          className={cn(
            "absolute inset-0 w-5 h-5 text-white pointer-events-none",
            "transition-all duration-200",
            "scale-0 peer-checked:scale-100"
          )}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      {label && (
        <span className="text-gray-900 select-none group-hover:text-gray-700 transition-colors duration-200">
          {label}
        </span>
      )}
    </label>
  );
}

interface AnimatedRadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function AnimatedRadio({ label, className, ...props }: AnimatedRadioProps) {
  return (
    <label className={cn("relative flex items-center gap-3 cursor-pointer group", className)}>
      <input
        type="radio"
        className="sr-only peer"
        {...props}
      />
      <div className="relative w-5 h-5">
        <div className={cn(
          "absolute inset-0 bg-white border-2 rounded-full transition-all duration-200",
          "peer-checked:border-gray-900",
          "peer-focus:ring-2 peer-focus:ring-gray-200 peer-focus:ring-offset-2",
          "group-hover:border-gray-400"
        )} />
        <div className={cn(
          "absolute inset-1.5 bg-gray-900 rounded-full",
          "transition-all duration-200",
          "scale-0 peer-checked:scale-100"
        )} />
      </div>
      {label && (
        <span className="text-gray-900 select-none group-hover:text-gray-700 transition-colors duration-200">
          {label}
        </span>
      )}
    </label>
  );
}

interface AnimatedSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function AnimatedSelect({ 
  label, 
  error, 
  options,
  className,
  ...props 
}: AnimatedSelectProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

  return (
    <div className="relative">
      <select
        {...props}
        onChange={(e) => {
          setHasValue(!!e.target.value);
          props.onChange?.(e);
        }}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        className={cn(
          "peer w-full px-4 pt-6 pb-2 text-gray-900 bg-white rounded-lg border appearance-none",
          "transition-all duration-200 ease-out",
          "focus:outline-none focus:ring-2",
          isFocused && "shadow-sm",
          error ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-gray-200 focus:border-gray-400",
          className
        )}
      >
        <option value="">{label ? `Select ${label}` : 'Select option'}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {label && (
        <label
          className={cn(
            "absolute left-4 text-gray-600 transition-all duration-200 ease-out pointer-events-none",
            "top-1.5 text-xs",
            error && "text-red-600"
          )}
        >
          {label}
        </label>
      )}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600 animate-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
}