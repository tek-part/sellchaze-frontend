/**
 * AppErrorBoundary — catches uncaught render errors in the page tree and shows a calm, recoverable
 * error state (keeping the global chrome around it). The engine already isolates section render
 * failures; this is the app-level safety net for pages/routes. Fail-closed, never a white screen.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, Container, ErrorState, Section } from './themes/luxury-fashion/components';

interface State {
  error: Error | null;
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surfaced for diagnostics; a real deployment would forward this to its monitoring sink.
    console.error('[storefront] uncaught render error:', error, info.componentStack);
  }

  private readonly reset = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <Section>
          <Container>
            <ErrorState
              title="Something went wrong"
              description="An unexpected error interrupted this page. Please try again."
              actions={
                <Button onClick={this.reset}>
                  Try again
                </Button>
              }
            />
          </Container>
        </Section>
      );
    }
    return this.props.children;
  }
}
