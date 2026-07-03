import React from 'react';

// Catches render errors and failed lazy-chunk loads so a thrown error shows a
// friendly fallback instead of a blank white screen.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // Best-effort telemetry; never throw from the error handler itself.
    try {
      if (typeof window !== 'undefined' && window.plausible) {
        window.plausible('Error', { props: { message: String(error?.message || error) } });
      }
    } catch {
      /* noop */
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="card w-full max-w-md text-center">
            <div className="card-content space-y-4 py-8">
              <div className="text-4xl">😬</div>
              <h1 className="text-xl font-semibold">Noget gik galt</h1>
              <p className="text-sm text-muted-foreground">
                Der opstod en uventet fejl. Prøv at genindlæse siden.
              </p>
              <button onClick={this.handleReload} className="btn btn-primary">
                Genindlæs siden
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
