import type { Request } from 'playwright/test';

/** Match Laravel's effective route verb while retaining POST as the actual wire method. */
export function effectiveApiMethod(request: Pick<Request, 'method' | 'headers'>): string {
  const wire = request.method();
  const override = request.headers()['x-http-method-override'];
  if (wire !== 'POST' || override === undefined) return wire;
  const method = override.toUpperCase();
  if (!['PUT', 'PATCH', 'DELETE'].includes(method)) throw new Error('Unexpected API method override in browser fixture.');
  return method;
}
