'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Log specific URL construction errors
    if (error.message.includes('Failed to construct \'URL\'') || error.message.includes('Invalid URL')) {
      console.error('URL Construction Error Details:', {
        message: error.message,
        stack: error.stack,
        component: errorInfo.componentStack,
        apiUrl: process.env.NEXT_PUBLIC_BE_BASE_URL
      });
    }
  }

  public render() {
    if (this.state.hasError) {
      // Special handling for URL errors
      const isUrlError = this.state.error?.message.includes('Failed to construct \'URL\'') || 
                        this.state.error?.message.includes('Invalid URL');
      
      if (isUrlError) {
        return this.props.fallback || (
          <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200 text-yellow-800">
            <h2 className="text-xl font-bold mb-2">Konfigurasi Server Bermasalah</h2>
            <p className="mb-4">
              Terjadi kesalahan pada konfigurasi URL server. 
              {process.env.NODE_ENV === 'development' && (
                <><br/>Error: {this.state.error?.message}</>
              )}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Muat Ulang Halaman
            </button>
          </div>
        );
      }
      
      // General error fallback
      return this.props.fallback || (
        <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-red-700">
          <h2 className="text-xl font-bold mb-2">Terjadi Kesalahan</h2>
          <p className="mb-4">
            Terjadi kesalahan saat memuat komponen ini.
            {process.env.NODE_ENV === 'development' && (
              <><br/>Error: {this.state.error?.message}</>
            )}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Coba Lagi
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
