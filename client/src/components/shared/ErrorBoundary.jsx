import React from 'react';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4 text-slate-100">
          <div className="w-full max-w-md rounded-xl border border-red-900/50 bg-red-950/20 p-6 text-center shadow-2xl backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-900/30">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-white">Something went wrong</h2>
            <p className="mb-6 text-sm text-slate-400">
              {this.state.error?.message || "An unexpected error occurred in this module."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
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

export default ErrorBoundary;
