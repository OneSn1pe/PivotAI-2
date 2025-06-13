import React from 'react';
import { cn } from '@/lib/utils';
import { EmptyStateIllustrations, EmptyStateType } from './empty-state-illustrations';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  illustration?: EmptyStateType;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  illustration,
  className
}: EmptyStateProps) {
  const IllustrationComponent = illustration ? EmptyStateIllustrations[illustration] : null;
  
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-6 text-center",
      "animate-in fade-in-0 duration-500",
      className
    )}>
      {(icon || IllustrationComponent) && (
        <div className="mb-6 text-gray-400 animate-in zoom-in-50 duration-700 delay-200">
          {icon || (IllustrationComponent && <IllustrationComponent />)}
        </div>
      )}
      
      <h3 className="text-lg font-medium text-gray-900 mb-1">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-gray-600 max-w-sm mx-auto mb-6">
          {description}
        </p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className="text-sm font-medium text-accent hover:text-accent-dark transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}