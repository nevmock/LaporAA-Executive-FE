'use client';

import React, { useEffect } from 'react';
import { FiX, FiMaximize2 } from 'react-icons/fi';

interface FullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  controls?: React.ReactNode; // For filter controls
}

const FullscreenModal: React.FC<FullscreenModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  controls
}) => {
  // Close modal with Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open and ensure no margins/padding
      document.body.style.overflow = 'hidden';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.documentElement.style.margin = '0';
      document.documentElement.style.padding = '0';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.documentElement.style.margin = '';
      document.documentElement.style.padding = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed z-[9999999]"
        style={{ 
          position: 'fixed',
          top: '0px',
          left: '0px',
          right: '0px',
          bottom: '0px',
          width: '100vw',
          height: '100vh',
          zIndex: 9999999,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          margin: 0,
          padding: 0
        }}
      />
      
      {/* Modal content */}
      <div 
        className="fixed z-[9999999] bg-white flex flex-col"
        style={{ 
          position: 'fixed',
          top: '0px',
          left: '0px',
          right: '0px',
          bottom: '0px',
          width: '100vw',
          height: '100vh',
          zIndex: 9999999,
          margin: 0,
          padding: 0,
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b border-gray-200 bg-white relative z-[9999999]"
          style={{ 
            position: 'relative',
            zIndex: 9999999,
            backgroundColor: 'white',
            flexShrink: 0
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <FiMaximize2 size={20} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
            title="Close Fullscreen (Esc)"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Controls/Filters */}
        {controls && (
          <div 
            className="px-6 py-4 border-b border-gray-200 bg-gray-50"
            style={{ 
              backgroundColor: '#f9fafb',
              flexShrink: 0
            }}
          >
            {controls}
          </div>
        )}

        {/* Content */}
        <div 
          className="flex-1 overflow-hidden bg-white"
          style={{ 
            backgroundColor: 'white',
            flex: '1 1 0%',
            minHeight: 0
          }}
        >
          <div className="h-full w-full">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default FullscreenModal;
