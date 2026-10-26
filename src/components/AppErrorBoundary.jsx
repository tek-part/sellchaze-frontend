import { Component, lazy, Suspense } from 'react';
import i18n from '../i18n';

// The 500 screen (and its animation library) is only needed once something has already failed,
// so it is a separate chunk instead of part of every first paint.
const ServerErrorPage = lazy(() => import('../pages/ServerErrorPage'));

/** Last resort when even the 500 screen's chunk cannot be fetched (offline, stale deploy). */
class ErrorScreenFallback extends Component {
    constructor(props) {
        super(props);
        this.state = { failed: false };
    }

    static getDerivedStateFromError() {
        return { failed: true };
    }

    render() {
        if (!this.state.failed) return this.props.children;
        return (
            <div role="alert" className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
                <p className="text-lg font-semibold text-slate-900">{i18n.t('error_500_title')}</p>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
                >
                    {i18n.t('error_cta_retry')}
                </button>
            </div>
        );
    }
}

/**
 * Catches render errors in child tree and shows the same visual language as /500 with a soft recovery.
 */
export default class AppErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error('[AppErrorBoundary]', error, info?.componentStack);
    }

    handleRetry = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (this.state.hasError) {
            return (
                <ErrorScreenFallback>
                    <Suspense fallback={null}>
                        <ServerErrorPage onRetry={this.handleRetry} />
                    </Suspense>
                </ErrorScreenFallback>
            );
        }
        return this.props.children;
    }
}
