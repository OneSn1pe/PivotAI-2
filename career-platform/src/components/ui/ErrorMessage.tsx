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
    <div className="bg-white/80 backdrop-filter backdrop-blur-md p-6 rounded-2xl shadow-xl shadow-sky-200/50 max-w-lg mx-auto border border-slate-100">
      <div className="flex items-center mb-4">
        <div className="bg-amber-100 p-3 rounded-full mr-3 relative">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6 text-amber-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01M12 3c-.5 0-1 .5-1 1.5L9.5 12h5l-1.5-7.5C13 3.5 12.5 3 12 3z" 
            />
          </svg>
          
          {/* Cloud with lightning icon overlay */}
          <div className="absolute -bottom-1 -right-1 text-amber-600">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 16.9C19 18.5 17.6 20 16 20H6C3.8 20 2 18.2 2 16C2 13.9 3.6 12.1 5.7 12C5.6 11.7 5.5 11.3 5.5 11C5.5 9.3 7 8 8.5 8C9.1 8 9.7 8.2 10.2 8.4C10.9 6.4 12.9 5 15 5C17.8 5 20 7.2 20 10C20 10.2 20 10.4 20 10.7C21.2 11.4 22 12.6 22 14C22 15.7 20.7 17 19 17V16.9Z" fill="currentColor"/>
              <path d="M10 15L7 18H11L10 21L13 18H9L10 15Z" fill="white"/>
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
      </div>
      
      <p className="text-slate-600 mb-6">{message}</p>
      
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white px-6 py-3 rounded-full w-full font-medium shadow-md shadow-sky-500/30 transition-all duration-300"
        >
          {actionText}
        </button>
      )}
    </div>
  );
} 