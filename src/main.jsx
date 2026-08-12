import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { ConfirmDialogHost } from './components/ui/confirmDialog';
import { PlatformToast } from './components/ui/notify';
import './index.css';
import './i18n';

const lng = localStorage.getItem('sellchase_locale') || 'en';
document.documentElement.setAttribute('dir', lng === 'ar' ? 'rtl' : 'ltr');
document.documentElement.setAttribute('lang', lng);

// A storefront preview used to register its worker for the whole platform
// origin. Remove that legacy registration when the dashboard application is
// loaded so it cannot cache or provide offline fallbacks for admin/marketplace
// routes such as /products.
if ('serviceWorker' in navigator) {
    void navigator.serviceWorker.getRegistrations().then((registrations) => Promise.all(
        registrations
            .filter((registration) => registration.active?.scriptURL.includes('/storefront-sw.js'))
            .map((registration) => registration.unregister()),
    ));
}

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
                <ConfirmDialogHost />
                {/* One renderer for every toast in the app: the render prop
                    means each existing toast.success/error call site across the
                    dashboard gets the platform's action-state design without
                    being rewritten. */}
                <Toaster position="top-center" gutter={12} toastOptions={{ duration: 4000 }}>
                    {(t) => <PlatformToast t={t} />}
                </Toaster>
                </HelmetProvider>
            </BrowserRouter>
        </React.StrictMode>,
    );
}
