import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, action }) => {
  return (
    <div className={`bg-neutral-900 border border-neutral-800 rounded-lg p-6 shadow-xl backdrop-blur-sm ${className}`}>
      {(title || action) && (
        <div className="flex justify-between items-center mb-6">
          {title && (
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
              {title}
            </h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};