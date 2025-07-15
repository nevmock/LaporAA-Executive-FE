'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class SocketErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('🚨 Socket Error Boundary caught error:', error);
    
    // Check if it's a connection-related error
    const isConnectionError = error.message.includes('Could not establish connection') ||
                             error.message.includes('Receiving end does not exist') ||
                             error.message.includes('websocket error');
    
    if (isConnectionError) {
      console.log('🔄 Connection error detected, will attempt recovery');
      return {
        hasError: true,
        errorMessage: 'Connection issue detected. Attempting to reconnect...'
      };
    }
    
    return {
      hasError: true,
      errorMessage: error.message
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Socket Error Boundary details:', error, errorInfo);
    
    // Auto-recovery for connection errors
    if (error.message.includes('Could not establish connection')) {
      console.log('🔄 Attempting auto-recovery from connection error...');
      
      // Reset error state after 2 seconds to trigger re-render
      setTimeout(() => {
        this.setState({ hasError: false, errorMessage: '' });
      }, 2000);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return this.props.fallback || (
        <div className="flex items-center justify-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600 mx-auto mb-2"></div>
            <p className="text-yellow-800 text-sm">{this.state.errorMessage}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SocketErrorBoundary;
