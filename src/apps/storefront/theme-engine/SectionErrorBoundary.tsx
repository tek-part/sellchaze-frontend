/**
 * Per-section error isolation (fail-closed, docs I2). A section that throws while rendering is
 * caught here, logged, and replaced by an optional inert fallback — sibling sections and the
 * rest of the page still render. Theme-agnostic.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';

export interface SectionErrorBoundaryProps {
  readonly sectionType: string;
  readonly fallback?: ReactNode;
  readonly onError?: (error: Error, info: ErrorInfo) => void;
  readonly children: ReactNode;
}

interface SectionErrorBoundaryState {
  readonly hasError: boolean;
}

export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  override state: SectionErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): SectionErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[theme-engine] section "${this.props.sectionType}" failed to render:`, error);
    this.props.onError?.(error, info);
  }

  override render(): ReactNode {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}
