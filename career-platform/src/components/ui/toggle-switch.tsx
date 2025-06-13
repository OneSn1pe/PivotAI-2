'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
  className?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
  className
}: ToggleSwitchProps) {
  const sizes = {
    sm: {
      track: 'w-8 h-4',
      thumb: 'w-3 h-3',
      translate: 'translate-x-4',
      label: 'text-sm',
      description: 'text-xs'
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-5',
      label: 'text-base',
      description: 'text-sm'
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translate: 'translate-x-7',
      label: 'text-lg',
      description: 'text-base'
    }
  };

  const currentSize = sizes[size];

  return (
    <label className={cn(
      "inline-flex items-start gap-3 cursor-pointer",
      disabled && "cursor-not-allowed opacity-50",
      className
    )}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative inline-flex shrink-0 rounded-full transition-all duration-300 ease-in-out",
          currentSize.track,
          checked ? "bg-gray-900" : "bg-gray-200",
          disabled && "bg-gray-100",
          "focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 rounded-full bg-white shadow-sm",
            "transition-all duration-300 ease-in-out",
            currentSize.thumb,
            checked && currentSize.translate,
            "will-change-transform"
          )}
        >
          {/* Inner dot animation */}
          <span
            className={cn(
              "absolute inset-1 rounded-full transition-all duration-300",
              checked ? "bg-gray-900 scale-100" : "bg-gray-400 scale-0"
            )}
          />
        </span>
      </button>

      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className={cn(
              "font-medium text-gray-900 transition-colors duration-200",
              currentSize.label,
              disabled && "text-gray-500"
            )}>
              {label}
            </span>
          )}
          {description && (
            <span className={cn(
              "text-gray-600 transition-colors duration-200",
              currentSize.description,
              disabled && "text-gray-400"
            )}>
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
}

// Grouped toggle switches component
interface ToggleSwitchGroupProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
}

export function ToggleSwitchGroup({ children, label, className }: ToggleSwitchGroupProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {label && (
        <h3 className="text-sm font-medium text-gray-900 mb-3">{label}</h3>
      )}
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}