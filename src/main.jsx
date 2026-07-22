import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';
import './i18n';

const lng = localStorage.getItem('sellchase_locale') || 'en';
document.documentElement.setAttribute('dir', lng === 'ar' ? 'rtl' : 'ltr');
document.documentElement.setAttribute('lang', lng);

const el = document.getElementById('root');
if (el) {
    createRoot(el).render(
        <React.StrictMode>
            <BrowserRouter
                future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                }}
            >
                <HelmetProvider>
                <App />
                <Toaster
                    position="top-center"
                    gutter={12}
                    toastOptions={{
                        className: 'text-sm font-medium',
                        duration: 4000,
                        style: {
                            background: '#fff',
                            color: '#0f172a',
                            borderRadius: '12px',
                            border: '1px solid rgba(0, 75, 180, 0.12)',
                            boxShadow: '0 8px 28px -6px rgba(15, 23, 42, 0.12)',
                            maxWidth: '420px',
                        },
                        success: { iconTheme: { primary: '#00C0A9', secondary: '#fff' } },
                        error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
                    }}
                />
                </HelmetProvider>
            </BrowserRouter>
        </React.StrictMode>,
    );
}
