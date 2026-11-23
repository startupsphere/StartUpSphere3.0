import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', background: '#fff', color: '#dc2626', zIndex: 99999, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', overflow: 'auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          <div style={{ maxWidth: '800px', margin: '40px auto', background: '#ffffff', padding: '32px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', border: '1px solid #fee2e2' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#991b1b', marginBottom: '8px' }}>Something went wrong.</h1>
            <p style={{ color: '#4b5563', fontSize: '14px', marginBottom: '20px' }}>
              An unexpected error occurred in the application view.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{ padding: '10px 20px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = '/'; }}
                style={{ padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
              >
                Go to Home
              </button>
            </div>
            <details open style={{ whiteSpace: 'pre-wrap', background: '#fef2f2', border: '1px solid #fecaca', padding: '16px', borderRadius: '8px', color: '#7f1d1d', fontSize: '13px', lineHeight: '1.5' }}>
              <summary style={{ fontWeight: 'bold', cursor: 'pointer', marginBottom: '8px', color: '#991b1b' }}>Error Details</summary>
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
