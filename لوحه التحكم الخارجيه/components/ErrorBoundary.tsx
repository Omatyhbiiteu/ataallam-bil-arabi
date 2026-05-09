import React from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren<ErrorBoundaryProps>, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App ErrorBoundary caught an error:', error, info);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
      return;
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0c] flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-[2.5rem] p-8 shadow-2xl text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-6">
            <AlertTriangle size={36} className="text-rose-500" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-3">حدث خطأ غير متوقع</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-6">
            نعتذر، واجهنا مشكلة مفاجئة. يمكنك إعادة تحميل الصفحة أو العودة للواجهة الرئيسية.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-6 py-3 rounded-2xl bg-gray-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-black transition"
            >
              <RefreshCcw size={18} />
              إعادة التحميل
            </button>
            <button
              type="button"
              onClick={() => window.location.assign('/')}
              className="px-6 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold flex items-center justify-center gap-2 hover:border-gray-400 transition"
            >
              <Home size={18} />
              الرئيسية
            </button>
          </div>
          {this.state.error?.message && (
            <div className="mt-6 text-xs text-gray-400 dark:text-gray-500 bg-stone-50 dark:bg-gray-800/60 rounded-2xl p-4">
              {this.state.error.message}
            </div>
          )}
        </div>
      </div>
    );
  }
}
