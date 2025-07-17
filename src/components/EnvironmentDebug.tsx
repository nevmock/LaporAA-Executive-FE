/**
 * Debug component untuk environment variables
 */
'use client';

import React from 'react';

export const EnvironmentDebug: React.FC = () => {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const apiUrl = process.env.NEXT_PUBLIC_BE_BASE_URL;
  
  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-3 rounded text-xs max-w-xs z-50">
      <div className="font-bold mb-1">Environment Debug:</div>
      <div>NODE_ENV: {process.env.NODE_ENV}</div>
      <div>API_URL: {apiUrl || '<UNDEFINED>'}</div>
      <div>Valid URL: {apiUrl ? (
        (() => {
          try {
            new URL(apiUrl);
            return '✓';
          } catch {
            return '✗';
          }
        })()
      ) : '✗'}</div>
    </div>
  );
};

export default EnvironmentDebug;
