import React from "react";

export const Card = ({ children, className }) => {
  return (
    <div
      className={`bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-lg border-l-4 border-green-500 ${className}`}
    >
      {children}
    </div>
  );
};

export const CardContent = ({ children }) => {
  return <div className="space-y-4 p-2">{children}</div>;
};
