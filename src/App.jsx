import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppErrorBoundary from './components/AppErrorBoundary';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PendingApprovalPage from './pages/PendingApprovalPage';
import Dashboard from './pages/Dashboard';
import NotificationsPage from './pages/NotificationsPage';
import OrdersPage from './pages/OrdersPage';
import QuotationsPage from './pages/QuotationsPage';
import DealsPage from './pages/DealsPage';
import GatewaysPage from './pages/GatewaysPage';
import GatewayDetailPage from './pages/GatewayDetailPage';
import GatewayFormPage from './pages/GatewayFormPage';
import SuppliersPage from './pages/SuppliersPage';
import SupplierDetailPage from './pages/SupplierDetailPage';
import SupplierFormPage from './pages/SupplierFormPage';
import MerchantsPage from './pages/MerchantsPage';
import MerchantDetailPage from './pages/MerchantDetailPage';
import MerchantFormPage from './pages/MerchantFormPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminUserDetailPage from './pages/AdminUserDetailPage';
import AdminUserFormPage from './pages/AdminUserFormPage';
import AdminActivityPage from './pages/AdminActivityPage';
import AdminRolesPage from './pages/AdminRolesPage';
import AdminRoleFormPage from './pages/AdminRoleFormPage';
import ShippingCompaniesPage from './pages/ShippingCompaniesPage';
import ShippingCompanyFormPage from './pages/ShippingCompanyFormPage';
import DeliveriesPage from './pages/DeliveriesPage';
import MonitoringLivePage from './pages/MonitoringLivePage';
import MonitoringSessionsPage from './pages/MonitoringSessionsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import EmailSettingsPage from './pages/EmailSettingsPage';
import GoogleSettingsPage from './pages/GoogleSettingsPage';
import WigpleasureSyncSettingsPage from './pages/WigpleasureSyncSettingsPage';
import TicketsPage from './pages/TicketsPage';
import TicketDetailPage from './pages/TicketDetailPage';
import ProductsPage from './pages/ProductsPage';
import InventoryPage from './pages/InventoryPage';
import StockTransfersPage from './pages/StockTransfersPage';
import StockTransferFormPage from './pages/StockTransferFormPage';
import CategoriesPage from './pages/CategoriesPage';
import BundlesPage from './pages/BundlesPage';
import AttributesPage from './pages/AttributesPage';
import PartnersPage from './pages/PartnersPage';
import EmployeesPage from './pages/EmployeesPage';
import LedgerPage from './pages/LedgerPage';
import ChatPage from './pages/ChatPage';
import DirectoryPage from './pages/public/DirectoryPage';
import PublicProfilePage from './pages/public/PublicProfilePage';
import PublicLayout from './layouts/PublicLayout';
import LandingPage from './pages/public/LandingPage';
import FeaturesPage from './pages/public/FeaturesPage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import TermsPage from './pages/public/TermsPage';
import PrivacyPage from './pages/public/PrivacyPage';
import BlogIndexPage from './pages/public/BlogIndexPage';
import BlogArticlePage from './pages/public/BlogArticlePage';
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
import AdminReportsUsersPage from './pages/AdminReportsUsersPage';
import AdminReportsOrdersPage from './pages/AdminReportsOrdersPage';
import AdminReportsRevenuePage from './pages/AdminReportsRevenuePage';
import AdminReportsTicketsPage from './pages/AdminReportsTicketsPage';
import AdminArticlesPage from './pages/AdminArticlesPage';
import AdminArticleFormPage from './pages/AdminArticleFormPage';
import VerificationRequestPage from './pages/VerificationRequestPage';
import AdminVerificationsPage from './pages/AdminVerificationsPage';
import BalancePage from './pages/BalancePage';
import BundleDetailPage from './pages/BundleDetailPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CategoryDetailPage from './pages/CategoryDetailPage';
import ProductFormPage from './pages/ProductFormPage';
import CategoryFormPage from './pages/CategoryFormPage';
import BundleFormPage from './pages/BundleFormPage';
import StoresPage from './pages/StoresPage';
import StoreFormPage from './pages/StoreFormPage';
import StoreSettingsPage from './pages/StoreSettingsPage';
import StoreThemesPage from './pages/StoreThemesPage';
import StoreThemeSettingsPage from './pages/StoreThemeSettingsPage';
import StorePagesPage from './pages/StorePagesPage';
const StorePageBuilderPage = lazy(() => import('./pages/StorePageBuilderPage'));
const StoreContentPageEditor = lazy(() => import('./pages/StoreContentPageEditor'));
import StoreMenusPage from './pages/StoreMenusPage';
// Phase 6H: route-level lazy loading for the heavier commerce/analytics pages
// (keeps chart.js and these screens out of the main bundle).
const StoreCouponsPage = lazy(() => import('./pages/StoreCouponsPage'));
const StoreCouponFormPage = lazy(() => import('./pages/StoreCouponFormPage'));
const StoreOrdersPage = lazy(() => import('./pages/StoreOrdersPage'));
const StoreOrderDetailPage = lazy(() => import('./pages/StoreOrderDetailPage'));
const StoreAnalyticsPage = lazy(() => import('./pages/StoreAnalyticsPage'));
const StoreReviewsPage = lazy(() => import('./pages/StoreReviewsPage'));
// StoreProduct*/StoreCategory* pages removed: catalog is unified onto /products & /categories.
import WavexSettingsPage from './pages/wavex/WavexSettingsPage';
import WavexConnectPage from './pages/wavex/WavexConnectPage';
import WavexChatsPage from './pages/wavex/WavexChatsPage';
import WavexTemplatesPage from './pages/wavex/WavexTemplatesPage';
// Task 7: lazy-load the TipTap-editor pages so the editor bundle loads on demand.
const WavexTemplateCreatePage = lazy(() => import('./pages/wavex/WavexTemplateCreatePage'));
import WavexTemplateShowPage from './pages/wavex/WavexTemplateShowPage';
const WavexTemplateEditPage = lazy(() => import('./pages/wavex/WavexTemplateEditPage'));
import WavexGroupsPage from './pages/wavex/WavexGroupsPage';
import WavexGroupCreatePage from './pages/wavex/WavexGroupCreatePage';
import WavexGroupShowPage from './pages/wavex/WavexGroupShowPage';
import WavexGroupEditPage from './pages/wavex/WavexGroupEditPage';
import WavexCampaignsPage from './pages/wavex/WavexCampaignsPage';
const WavexCampaignNewPage = lazy(() => import('./pages/wavex/WavexCampaignNewPage'));
import WavexCampaignDetailPage from './pages/wavex/WavexCampaignDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import ForbiddenPage from './pages/ForbiddenPage';
import ServerErrorPage from './pages/ServerErrorPage';
import ServiceUnavailablePage from './pages/ServiceUnavailablePage';
import SessionExpiredPage from './pages/SessionExpiredPage';
import OfflinePage from './pages/OfflinePage';

function RequireAuth({ children }) {
    const token = localStorage.getItem('sellchase_access_token');
    if (!token) {
        return <Navigate to="/" replace />;
    }
    return children;
}

function RootRoute() {
    // Public landing is always viewable — logged-in users can browse back to the
    // marketing site (the public header shows a "Dashboard" button to return).
    return <LandingPage />;
}

export default function App() {
    return (
        <AppErrorBoundary>
        <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">…</div>}>
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/pending-approval" element={<PendingApprovalPage />} />
            <Route path="/u/:username" element={<PublicProfilePage />} />
            <Route element={<PublicLayout />}>
                <Route path="/" element={<RootRoute />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/directory" element={<DirectoryPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/legal/terms" element={<TermsPage />} />
                <Route path="/legal/privacy" element={<PrivacyPage />} />
                <Route path="/blog" element={<BlogIndexPage />} />
                <Route path="/blog/:slug" element={<BlogArticlePage />} />
            </Route>
            <Route
                element={
                    <RequireAuth>
                        <AppLayout />
                    </RequireAuth>
                }
            >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/reports/users" element={<AdminReportsUsersPage />} />
                <Route path="/admin/reports/orders" element={<AdminReportsOrdersPage />} />
                <Route path="/admin/reports/revenue" element={<AdminReportsRevenuePage />} />
                <Route path="/admin/reports/tickets" element={<AdminReportsTicketsPage />} />
                <Route path="/admin/articles/new" element={<AdminArticleFormPage />} />
                <Route path="/admin/articles/:id/edit" element={<AdminArticleFormPage />} />
                <Route path="/admin/articles" element={<AdminArticlesPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/orders/in" element={<OrdersPage direction="in" />} />
                <Route path="/orders/out" element={<OrdersPage direction="out" />} />
                <Route path="/orders/:code" element={<OrderDetailPage />} />
                <Route path="/orders" element={<Navigate to="/orders/in" replace />} />
                <Route path="/quotations" element={<QuotationsPage />} />
                <Route path="/partners" element={<PartnersPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/employees" element={<EmployeesPage />} />
                <Route path="/ledger" element={<LedgerPage />} />
                <Route path="/settings/verification" element={<VerificationRequestPage />} />
                <Route path="/admin/verifications" element={<AdminVerificationsPage />} />
                <Route path="/quotations/in" element={<Navigate to="/quotations" replace />} />
                <Route path="/quotations/out" element={<Navigate to="/quotations" replace />} />
                <Route path="/deals/in" element={<DealsPage direction="in" />} />
                <Route path="/deals/out" element={<DealsPage direction="out" />} />
                <Route path="/gateways" element={<GatewaysPage />} />
                <Route path="/gateways/:id" element={<GatewayDetailPage />} />
                <Route path="/gateways/:id/edit" element={<GatewayFormPage />} />
                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/suppliers/new" element={<SupplierFormPage />} />
                <Route path="/suppliers/:id/edit" element={<SupplierFormPage />} />
                <Route path="/suppliers/:id" element={<SupplierDetailPage />} />
                <Route path="/merchants" element={<MerchantsPage />} />
                <Route path="/merchants/new" element={<MerchantFormPage />} />
                <Route path="/merchants/:id/edit" element={<MerchantFormPage />} />
                <Route path="/merchants/:id" element={<MerchantDetailPage />} />
                <Route path="/shipping/deliveries" element={<DeliveriesPage />} />
                <Route path="/shipping/companies/new" element={<ShippingCompanyFormPage />} />
                <Route path="/shipping/companies/:id/edit" element={<ShippingCompanyFormPage />} />
                <Route path="/shipping/companies" element={<ShippingCompaniesPage />} />
                <Route path="/admin/users/new" element={<AdminUserFormPage />} />
                <Route path="/admin/users/:id/edit" element={<AdminUserFormPage />} />
                <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/activity" element={<AdminActivityPage />} />
                <Route path="/admin/monitoring/live" element={<MonitoringLivePage />} />
                <Route path="/admin/monitoring/sessions" element={<MonitoringSessionsPage />} />
                <Route path="/admin/roles/new" element={<AdminRoleFormPage />} />
                <Route path="/admin/roles/:id/edit" element={<AdminRoleFormPage />} />
                <Route path="/admin/roles" element={<AdminRolesPage />} />
                <Route path="/settings/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/email" element={<EmailSettingsPage />} />
                <Route path="/settings/google" element={<GoogleSettingsPage />} />
                <Route path="/settings/wigpleasure-sync" element={<WigpleasureSyncSettingsPage />} />
                <Route path="/tickets" element={<TicketsPage />} />
                <Route path="/tickets/:id" element={<TicketDetailPage />} />
                <Route path="/inventory/transfers/new" element={<StockTransferFormPage />} />
                <Route path="/inventory/transfers" element={<StockTransfersPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/products/new" element={<ProductFormPage />} />
                <Route path="/products/:id/edit" element={<ProductFormPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/categories/new" element={<CategoryFormPage />} />
                <Route path="/categories/:id/edit" element={<CategoryFormPage />} />
                <Route path="/categories/:id" element={<CategoryDetailPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/bundles/new" element={<BundleFormPage />} />
                <Route path="/bundles/:id/edit" element={<BundleFormPage />} />
                <Route path="/bundles/:id" element={<BundleDetailPage />} />
                <Route path="/bundles" element={<BundlesPage />} />
                {/* Owner (Merchant/Supplier) single-store context — no store id in the URL.
                    Same components as the admin /stores/:id/* routes; useStoreScope resolves
                    the owner's store via /my-store. Admin multi-store console stays below. */}
                <Route path="/store" element={<Navigate to="/store/orders" replace />} />
                <Route path="/store/settings" element={<StoreSettingsPage />} />
                <Route path="/store/themes/:themeId/settings" element={<StoreThemeSettingsPage />} />
                <Route path="/store/themes" element={<StoreThemesPage />} />
                <Route path="/store/pages/:pageId/builder" element={<StorePageBuilderPage />} />
                <Route path="/store/content/:key" element={<StoreContentPageEditor />} />
                <Route path="/store/pages" element={<StorePagesPage />} />
                <Route path="/store/menus" element={<StoreMenusPage />} />
                <Route path="/store/coupons/new" element={<StoreCouponFormPage />} />
                <Route path="/store/coupons/:couponId/edit" element={<StoreCouponFormPage />} />
                <Route path="/store/coupons" element={<StoreCouponsPage />} />
                <Route path="/store/orders/:orderId" element={<StoreOrderDetailPage />} />
                <Route path="/store/orders" element={<StoreOrdersPage />} />
                <Route path="/store/analytics" element={<StoreAnalyticsPage />} />
                <Route path="/store/reviews" element={<StoreReviewsPage />} />
                {/* Catalog unified: the old per-store catalog pages now redirect to the
                    single owner catalog (/products, /categories). See ProductScope. */}
                <Route path="/store/products/*" element={<Navigate to="/products" replace />} />
                <Route path="/store/categories/*" element={<Navigate to="/categories" replace />} />
                <Route path="/stores/new" element={<StoreFormPage />} />
                <Route path="/stores/:id/edit" element={<StoreFormPage />} />
                <Route path="/stores/:id/settings" element={<StoreSettingsPage />} />
                <Route path="/stores/:id/themes/:themeId/settings" element={<StoreThemeSettingsPage />} />
                <Route path="/stores/:id/themes" element={<StoreThemesPage />} />
                <Route path="/stores/:id/pages/:pageId/builder" element={<StorePageBuilderPage />} />
                <Route path="/stores/:id/content/:key" element={<StoreContentPageEditor />} />
                <Route path="/stores/:id/pages" element={<StorePagesPage />} />
                <Route path="/stores/:id/menus" element={<StoreMenusPage />} />
                <Route path="/stores/:id/coupons/new" element={<StoreCouponFormPage />} />
                <Route path="/stores/:id/coupons/:couponId/edit" element={<StoreCouponFormPage />} />
                <Route path="/stores/:id/coupons" element={<StoreCouponsPage />} />
                <Route path="/stores/:id/orders/:orderId" element={<StoreOrderDetailPage />} />
                <Route path="/stores/:id/orders" element={<StoreOrdersPage />} />
                <Route path="/stores/:id/analytics" element={<StoreAnalyticsPage />} />
                <Route path="/stores/:id/reviews" element={<StoreReviewsPage />} />
                {/* Catalog unified — admin per-store catalog pages redirect to the shared catalog. */}
                <Route path="/stores/:id/products/*" element={<Navigate to="/products" replace />} />
                <Route path="/stores/:id/categories/*" element={<Navigate to="/categories" replace />} />
                <Route path="/stores" element={<StoresPage />} />
                <Route path="/attributes/groups" element={<AttributesPage />} />
                <Route path="/attributes" element={<AttributesPage />} />
                <Route path="/balance/in" element={<BalancePage />} />
                <Route path="/balance/out" element={<BalancePage />} />
                <Route path="/balance" element={<BalancePage />} />
                <Route path="/wavex/settings" element={<WavexSettingsPage />} />
                <Route path="/wavex/connect" element={<WavexConnectPage />} />
                <Route path="/wavex/chats" element={<WavexChatsPage />} />
                <Route path="/wavex/templates/new" element={<WavexTemplateCreatePage />} />
                <Route path="/wavex/templates/:id/edit" element={<WavexTemplateEditPage />} />
                <Route path="/wavex/templates/:id" element={<WavexTemplateShowPage />} />
                <Route path="/wavex/templates" element={<WavexTemplatesPage />} />
                <Route path="/wavex/groups/new" element={<WavexGroupCreatePage />} />
                <Route path="/wavex/groups/:id/edit" element={<WavexGroupEditPage />} />
                <Route path="/wavex/groups/:id" element={<WavexGroupShowPage />} />
                <Route path="/wavex/groups" element={<WavexGroupsPage />} />
                <Route path="/wavex/campaigns/new" element={<WavexCampaignNewPage />} />
                <Route path="/wavex/campaigns/:id" element={<WavexCampaignDetailPage />} />
                <Route path="/wavex/campaigns" element={<WavexCampaignsPage />} />
            </Route>
            <Route path="/403" element={<ForbiddenPage />} />
            <Route path="/401" element={<SessionExpiredPage />} />
            <Route path="/500" element={<ServerErrorPage />} />
            <Route path="/503" element={<ServiceUnavailablePage />} />
            <Route path="/offline" element={<OfflinePage />} />
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
        </AppErrorBoundary>
    );
}
