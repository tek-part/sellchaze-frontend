/**
 * Theme Studio entry — a THIRD isolated Vite entry (`theme-studio.html`), independent of the
 * dashboards (`index.html`) and the storefront (`storefront.html`). Its own CSS bundle, so the
 * studio's admin design system never collides with any storefront theme it previews. Mounts the
 * self-contained Multi-Theme Platform management app.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeStudio } from './ui/ThemeStudio';

const rootElement = document.getElementById('theme-studio-root');
if (!rootElement) {
  throw new Error('Theme Studio failed to start: #theme-studio-root element is missing from the document.');
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeStudio />
  </StrictMode>,
);
