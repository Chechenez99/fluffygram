// src/components/dialog.js
import React from 'react';

export const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-white border-l-4 border-green-500 rounded-lg shadow-xl p-4 sm:p-6 md:p-8 w-full max-w-3xl mx-4">
        {children}
      </div>
    </div>
  );
};

export const DialogTrigger = ({ children }) => (
  <div>{children}</div>
);

export const DialogContent = ({ children, className }) => (
  <div className={`space-y-6 ${className}`}>{children}</div>
);

export const DialogHeader = ({ children }) => (
  <div className="flex items-center justify-between border-b border-green-200 pb-4">{children}</div>
);

export const DialogTitle = ({ children }) => (
  <h3 className="text-2xl font-semibold text-green-700">{children}</h3>
);

export const DialogClose = ({ children, onClick }) => (
  <button 
    onClick={onClick}
    className="text-green-500 hover:text-green-600 transition-colors"
  >
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
);
