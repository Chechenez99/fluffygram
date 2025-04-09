import React from 'react';
import Button from "./Button";

export const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-[#f3e6f5] border-l-4 border-[#c084cf] rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-3xl mx-4">
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
  <div className="flex items-center justify-between border-b border-[#c084cf] pb-4 mb-4">
    {children}
  </div>
);

export const DialogTitle = ({ children }) => (
  <h3 className="text-2xl font-semibold text-[#4b3f4e]">{children}</h3>
);

export const DialogClose = ({ children, onClick }) => (
  <button 
    onClick={onClick}
    className="text-[#c084cf] hover:text-[#b46db6] transition-colors"
  >
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
);
