import React from 'react';

interface ErrorMessageProps {
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

export default function ErrorMessage({ 
  title, 
  message, 
  actionText, 
  onAction 
}: ErrorMessageProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto">
      <div className="flex items-center mb-4">
        <div className="bg-red-100 p-2 rounded-full mr-3">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6 text-red-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      </div>
      
      <p className="text-gray-600 mb-6">{message}</p>
      
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          {actionText}
        </button>
      )}
    </div>
  );
} 