import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Class-style error boundary — React's hooks API doesn't (yet) provide an
// equivalent. Wraps the app so a single render crash falls back to a clear
// recovery UI instead of an empty white screen.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Uncaught render error:', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    const isDev = import.meta.env.DEV;
    return (
      <div className="flex h-svh w-screen flex-col items-center justify-center gap-4 bg-black p-6 text-center text-white">
        <div className="text-5xl">⚠️</div>
        <h1 className="text-lg font-semibold">Something broke</h1>
        <p className="max-w-xs text-sm text-neutral-400">
          The app hit an unexpected error. Your data is safe — reload to try
          again.
        </p>
        {isDev && (
          <pre className="max-h-40 max-w-md overflow-auto rounded bg-neutral-900 p-3 text-left text-xs text-red-400">
            {this.state.error.message}
            {this.state.error.stack && '\n\n' + this.state.error.stack}
          </pre>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={this.handleReset}
            className="rounded-lg bg-neutral-800 px-4 py-2 text-sm"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={this.handleReload}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
