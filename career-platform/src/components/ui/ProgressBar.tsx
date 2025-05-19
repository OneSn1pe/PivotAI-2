import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  labelFormatter?: (value: number, max: number) => string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'teal' | 'blue' | 'emerald' | 'amber' | 'indigo' | 'violet' | 'red';
  animated?: boolean;
  showValue?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className = '',
  showLabel = false,
  labelFormatter,
  size = 'md',
  color = 'teal',
  animated = false,
  showValue = false,
}) => {
  // Calculate percentage, clamped between 0-100
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  // Default label formatter
  const defaultFormatter = (val: number, maximum: number) => {
    return showValue 
      ? `${val}/${maximum}`
      : `${Math.round(percentage)}%`;
  };
  
  // Use the provided formatter or the default one
  const formatter = labelFormatter || defaultFormatter;
  
  // Define height based on size
  const heightClass = {
    xs: 'h-1',
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }[size];
  
  // Define color based on the prop
  const colorClass = {
    teal: 'bg-teal-600',
    blue: 'bg-blue-600',
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-600',
    indigo: 'bg-indigo-600',
    violet: 'bg-violet-600',
    red: 'bg-red-600',
  }[color];
  
  // Define gradient class if animated
  const gradientClass = animated ? {
    teal: 'bg-gradient-to-r from-teal-500 to-teal-600',
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
    emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
    amber: 'bg-gradient-to-r from-amber-500 to-amber-600',
    indigo: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
    violet: 'bg-gradient-to-r from-violet-500 to-violet-600',
    red: 'bg-gradient-to-r from-red-500 to-red-600',
  }[color] : colorClass;
  
  // Animation class
  const animationClass = animated ? 'animate-pulse' : '';

  return (
    <div className={`${className} w-full`}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-xs font-medium text-slate-700">{formatter(value, max)}</span>
        </div>
      )}
      <div className={`bg-slate-100 rounded-full overflow-hidden ${heightClass}`}>
        <div 
          className={`${gradientClass} ${heightClass} rounded-full ${animationClass}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar; 