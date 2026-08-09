import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import Button from './ui/Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle size={40} />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h2>
              <p className="text-slate-500">
                We're sorry, but an unexpected error occurred while loading this page.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left bg-slate-50 p-4 rounded-xl overflow-auto text-xs text-slate-700 max-h-48 border border-slate-200">
                <p className="font-bold text-red-600 mb-2">{this.state.error.toString()}</p>
                <pre>{this.state.errorInfo?.componentStack}</pre>
              </div>
            )}

            <Button 
              onClick={() => window.location.reload()} 
              icon={RefreshCcw}
              fullWidth
              size="lg"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}
