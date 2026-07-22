import { Component } from 'react';
import ServerErrorPage from '../pages/ServerErrorPage';

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
            return <ServerErrorPage onRetry={this.handleRetry} />;
        }
        return this.props.children;
    }
}
