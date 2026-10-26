import { lazy, Suspense } from 'react';
import PlatformReferralCapture from './components/PlatformReferralCapture';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import useStoreScope from './hooks/useStoreScope';
import AppErrorBoundary from './components/AppErrorBoundary';
import AppLayout from './components/AppLayout';
import StoreRedirect from './components/store/StoreRedirect';
import Login from './pages/Login';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PendingApprovalPage from './pages/PendingApprovalPage';
const Dashboard = lazy(() => import('./pages/Dashboard'));
// Route-level lazy loading: the community feed (pulls in the Quill rich-text
// editor) and the pricing page load on demand instead of inflating the main bundle.
const FeedPage = lazy(() => import('./pages/FeedPage'));
const CommunityCreatePage = lazy(() => import('./pages/CommunityCreatePage'));
const CommunityPostPage = lazy(() => import('./pages/CommunityPostPage'));
const CommunityProfilePage = lazy(() => import('./pages/CommunityProfilePage'));
const CommunityConnectionsPage = lazy(() => import('./pages/CommunityConnectionsPage'));
const CommunitySearchPage = lazy(() => import('./pages/CommunitySearchPage'));
const CommunityHashtagPage = lazy(() => import('./pages/CommunityHashtagPage'));
const CommunityGroupsPage = lazy(() => import('./pages/CommunityGroupsPage'));
const CommunityGroupPage = lazy(() => import('./pages/CommunityGroupPage'));
const ReelsPage = lazy(() => import('./pages/ReelsPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const MerchantsPage = lazy(() => import('./pages/MerchantsPage'));
const MerchantDetailPage = lazy(() => import('./pages/MerchantDetailPage'));
const MerchantFormPage = lazy(() => import('./pages/MerchantFormPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminUserDetailPage = lazy(() => import('./pages/AdminUserDetailPage'));
const AdminUserFormPage = lazy(() => import('./pages/AdminUserFormPage'));
const AdminActivityPage = lazy(() => import('./pages/AdminActivityPage'));
const AdminRolesPage = lazy(() => import('./pages/AdminRolesPage'));
const AdminRoleFormPage = lazy(() => import('./pages/AdminRoleFormPage'));
const MonitoringLivePage = lazy(() => import('./pages/MonitoringLivePage'));
const MonitoringSessionsPage = lazy(() => import('./pages/MonitoringSessionsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const EmailSettingsPage = lazy(() => import('./pages/EmailSettingsPage'));
const GoogleSettingsPage = lazy(() => import('./pages/GoogleSettingsPage'));
const CurrencySettingsPage = lazy(() => import('./pages/CurrencySettingsPage'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
import MarketingRedirect from './components/MarketingRedirect';
import BrandLoader from './components/BrandLoader';
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const SupportTicketsPage = lazy(() => import('./features/support/SupportTicketsPage'));
const SupportNewTicketPage = lazy(() => import('./features/support/SupportNewTicketPage'));
const SupportTicketPage = lazy(() => import('./features/support/SupportTicketPage'));
const SectorsSettingsPage = lazy(() => import('./pages/SectorsSettingsPage'));
const AdminReportsUsersPage = lazy(() => import('./pages/AdminReportsUsersPage'));
const AdminReportsOrdersPage = lazy(() => import('./pages/AdminReportsOrdersPage'));
const AdminReportsRevenuePage = lazy(() => import('./pages/AdminReportsRevenuePage'));
const AdminArticlesPage = lazy(() => import('./pages/AdminArticlesPage'));
const AdminThemeMarketplacePage = lazy(() => import('./pages/AdminThemeMarketplacePage'));
const AdminArticleFormPage = lazy(() => import('./pages/AdminArticleFormPage'));
const VerificationRequestPage = lazy(() => import('./pages/VerificationRequestPage'));
const AdminVerificationsPage = lazy(() => import('./pages/AdminVerificationsPage'));
const StoresPage = lazy(() => import('./pages/StoresPage'));
const StoreFormPage = lazy(() => import('./pages/StoreFormPage'));
const loadStoreLayout = () => import('./components/store/StoreLayout');
const StoreLayout = lazy(loadStoreLayout);
// Most merchants land in the store admin: on a direct load, fetch its layout alongside the shell.
if (typeof window !== 'undefined' && /^\/stores?\//.test(window.location.pathname)) void loadStoreLayout();
const StoreOverviewPage = lazy(() => import('./pages/StoreOverviewPage'));
const StoreThemesPage = lazy(() => import('./pages/StoreThemesPage'));
const StoreCustomizePage = lazy(() => import('./pages/StoreCustomizePage'));
const StorePaymentsPage = lazy(() => import('./pages/StorePaymentsPage'));
const EditorLayout = lazy(() => import('./components/editor/EditorLayout'));
const ProductLandingEditorPage = lazy(() => import('./pages/ProductLandingEditorPage'));
const StorePagesPage = lazy(() => import('./pages/StorePagesPage'));
const StoreSimplePageEditor = lazy(() => import('./pages/StoreSimplePageEditor'));
const StoreArticlesPage = lazy(() => import('./pages/StoreArticlesPage'));
const StoreArticleEditorPage = lazy(() => import('./pages/StoreArticleEditorPage'));
const StoreCheckoutFieldsPage = lazy(() => import('./pages/store/settings/StoreCheckoutFieldsPage'));
const StoreDigitalDeliveryPage = lazy(() => import('./pages/store/settings/StoreDigitalDeliveryPage'));
const StoreNotificationsPage = lazy(() => import('./pages/store/settings/StoreNotificationsPage'));
const StoreOrderLimitsPage = lazy(() => import('./pages/store/settings/StoreOrderLimitsPage'));
const StoreThankYouPage = lazy(() => import('./pages/store/settings/StoreThankYouPage'));
const StoreUiBlocksPage = lazy(() => import('./pages/StoreUiBlocksPage'));
const StoreBlockedPhonesPage = lazy(() => import('./pages/store/StoreBlockedPhonesPage'));
const StorePhoneVerificationPage = lazy(() => import('./pages/store/settings/StorePhoneVerificationPage'));
const StoreFunnelsPage = lazy(() => import('./pages/StoreFunnelsPage'));
const StoreFunnelCreatePage = lazy(() => import('./pages/StoreFunnelCreatePage'));
const StoreFunnelEditPage = lazy(() => import('./pages/StoreFunnelEditPage'));
const StoreMediaPage = lazy(() => import('./pages/StoreMediaPage'));
const StoreDesignAssetsPage = lazy(() => import('./pages/StoreDesignAssetsPage'));
const StoreGeneralSettingsPage = lazy(() => import('./pages/store/settings/StoreGeneralSettingsPage'));
const StorePoliciesSettingsPage = lazy(() => import('./pages/store/settings/StorePoliciesSettingsPage'));
const StoreSeoSettingsPage = lazy(() => import('./pages/store/settings/StoreSeoSettingsPage'));
const StoreSocialSettingsPage = lazy(() => import('./pages/store/settings/StoreSocialSettingsPage'));
const StoreOrderPushPage = lazy(() => import('./pages/store/settings/StoreOrderPushPage'));
const StoreHeadCodePage = lazy(() => import('./pages/store/settings/StoreHeadCodePage'));
const StoreWebhooksPage = lazy(() => import('./pages/store/settings/StoreWebhooksPage'));
const StorePublicApiPage = lazy(() => import('./pages/store/settings/StorePublicApiPage'));
const StorePublicApiEditorPage = lazy(() => import('./pages/store/settings/StorePublicApiPage').then(module => ({ default: module.StorePublicApiEditorPage })));
const StorePublicApiDocsPage = lazy(() => import('./pages/store/settings/StorePublicApiPage').then(module => ({ default: module.StorePublicApiDocsPage })));
const StoreWebhookEditorPage = lazy(() => import('./pages/store/settings/StoreWebhooksPage').then(module => ({ default: module.StoreWebhookEditorPage })));
const StoreManagersPage = lazy(() => import('./pages/store/settings/StoreManagersPage'));
const StoreLoginSessionsPage = lazy(() => import('./pages/store/settings/StoreLoginSessionsPage'));
const StoreBotProtectionPage = lazy(() => import('./pages/store/settings/StoreBotProtectionPage'));
const StoreTrackingPage = lazy(() => import('./pages/store/StoreTrackingPage'));
const StoreAppsPage = lazy(() => import('./pages/store/StoreAppsPage'));
const StoreAppDetailPage = lazy(() => import('./pages/store/StoreAppDetailPage'));
const StoreSheetsPage = lazy(() => import('./pages/store/StoreSheetsPage'));
const StoreDownsellPage = lazy(() => import('./pages/store/StoreDownsellPage'));
const StoreAbTestsPage = lazy(() => import('./pages/store/StoreAbTestsPage'));
const StoreProductFeedPage = lazy(() => import('./pages/store/StoreProductFeedPage'));
const StoreGoogleMerchantPage = lazy(() => import('./pages/store/StoreGoogleMerchantPage'));
const StoreCampaignBuilderPage = lazy(() => import('./pages/store/StoreCampaignBuilderPage'));
const StoreReferralBuilderPage = lazy(() => import('./pages/store/StoreReferralBuilderPage'));
const PlatformWalletPage = lazy(() => import('./pages/account/PlatformWalletPage'));
const MerchantSubscriptionsPage = lazy(() => import('./pages/account/MerchantSubscriptionsPage'));
const ServiceMarketplacePage = lazy(() => import('./pages/services/ServiceMarketplacePage'));
const ServiceMarketplaceDetailPage = lazy(() => import('./pages/services/ServiceMarketplaceDetailPage'));
const ServiceMarketplaceManagePage = lazy(() => import('./pages/services/ServiceMarketplaceManagePage'));
const ServiceMarketplaceProviderPage = lazy(() => import('./pages/services/ServiceMarketplaceProviderPage'));
const StoreRetargetingPage = lazy(() => import('./pages/store/StoreRetargetingPage'));
const StoreMarketingServicesPage = lazy(() => import('./pages/store/StoreMarketingServicesPage'));
const StoreShoppingPreferencesPage = lazy(() => import('./pages/store/settings/StoreShoppingPreferencesPage'));
const StoreLocalizationSettingsPage = lazy(() => import('./pages/store/settings/StoreLocalizationSettingsPage'));
const StoreShippingTaxSettingsPage = lazy(() => import('./pages/store/settings/StoreShippingTaxSettingsPage'));
const StoreDomainsPage = lazy(() => import('./pages/store/settings/StoreDomainsPage'));
const StorePublishPage = lazy(() => import('./pages/store/settings/StorePublishPage'));
const StorePageBuilderPage = lazy(() => import('./pages/StorePageBuilderPage'));
const StoreContentPageEditor = lazy(() => import('./pages/StoreContentPageEditor'));
const StoreMenusPage = lazy(() => import('./pages/StoreMenusPage'));
// Phase 6H: route-level lazy loading for the heavier commerce/analytics pages
// (keeps chart.js and these screens out of the main bundle).
const StoreCouponsPage = lazy(() => import('./pages/StoreCouponsPage'));
const StoreInventoryPage = lazy(() => import('./pages/StoreInventoryPage'));
const StoreProductsPage = lazy(() => import('./pages/StoreProductsPage'));
const StoreProductEditorPage = lazy(() => import('./pages/StoreProductEditorPage'));
const StoreCategoriesPage = lazy(() => import('./pages/StoreCategoriesPage'));
const StoreNewsletterPage = lazy(() => import('./pages/StoreNewsletterPage'));
const StoreMissedOrdersPage = lazy(() => import('./pages/StoreMissedOrdersPage'));
const StoreCustomersPage = lazy(() => import('./pages/StoreCustomersPage'));
const StoreCustomerDetailPage = lazy(() => import('./pages/StoreCustomerDetailPage'));
const StoreCategoryEditorPage = lazy(() => import('./pages/StoreCategoryEditorPage'));
const StoreCollectionsPage = lazy(() => import('./pages/StoreCollectionsPage'));
const StoreCollectionEditorPage = lazy(() => import('./pages/StoreCollectionEditorPage'));
const StoreCouponFormPage = lazy(() => import('./pages/StoreCouponFormPage'));
const StoreOrdersPage = lazy(() => import('./pages/StoreOrdersPage'));
const StoreOrdersPrintPage = lazy(() => import('./pages/StoreOrdersPrintPage'));
const StoreManualOrderPage = lazy(() => import('./pages/StoreManualOrderPage'));
const StoreDraftOrdersPage = lazy(() => import('./pages/StoreDraftOrdersPage'));
const StoreDraftOrderEditorPage = lazy(() => import('./pages/StoreDraftOrderEditorPage'));
const StoreOrderDetailPage = lazy(() => import('./pages/StoreOrderDetailPage'));
const StoreAnalyticsPage = lazy(() => import('./pages/StoreAnalyticsPage'));
const StoreReviewsPage = lazy(() => import('./pages/StoreReviewsPage'));
// Merchant catalog pages use the store-scoped API; the operator console retains its taxonomy.
const WavexSettingsPage = lazy(() => import('./pages/wavex/WavexSettingsPage'));
const WavexConnectPage = lazy(() => import('./pages/wavex/WavexConnectPage'));
const WavexChatsPage = lazy(() => import('./pages/wavex/WavexChatsPage'));
const WavexTemplatesPage = lazy(() => import('./pages/wavex/WavexTemplatesPage'));
// Task 7: lazy-load the TipTap-editor pages so the editor bundle loads on demand.
const WavexTemplateCreatePage = lazy(() => import('./pages/wavex/WavexTemplateCreatePage'));
const WavexTemplateShowPage = lazy(() => import('./pages/wavex/WavexTemplateShowPage'));
const WavexTemplateEditPage = lazy(() => import('./pages/wavex/WavexTemplateEditPage'));
const WavexGroupsPage = lazy(() => import('./pages/wavex/WavexGroupsPage'));
const WavexGroupCreatePage = lazy(() => import('./pages/wavex/WavexGroupCreatePage'));
const WavexGroupShowPage = lazy(() => import('./pages/wavex/WavexGroupShowPage'));
const WavexGroupEditPage = lazy(() => import('./pages/wavex/WavexGroupEditPage'));
const WavexCampaignsPage = lazy(() => import('./pages/wavex/WavexCampaignsPage'));
const WavexCampaignNewPage = lazy(() => import('./pages/wavex/WavexCampaignNewPage'));
const WavexCampaignDetailPage = lazy(() => import('./pages/wavex/WavexCampaignDetailPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ForbiddenPage = lazy(() => import('./pages/ForbiddenPage'));
import ServerErrorPage from './pages/ServerErrorPage';
const ServiceUnavailablePage = lazy(() => import('./pages/ServiceUnavailablePage'));
const SessionExpiredPage = lazy(() => import('./pages/SessionExpiredPage'));
const OfflinePage = lazy(() => import('./pages/OfflinePage'));

function RequireAuth({ children }) {
    const { pathname, search } = useLocation();
    const token = localStorage.getItem('sellchase_access_token');
    if (!token) {
        // Login honours ?redirect=, so the visitor lands back where they were headed.
        const target = `${pathname}${search}`;
        return <Navigate to={target === '/' ? '/login' : `/login?redirect=${encodeURIComponent(target)}`} replace />;
    }
    return children;
}

/** app.sellchaze.com/ is the dashboard; the marketing home page lives on sellchaze.com. */
function RootRoute() {
    return (
        <RequireAuth>
            <Navigate to="/dashboard" replace />
        </RequireAuth>
    );
}

// Public pages moved to the marketing site; their old dashboard URLs forward there.
const MARKETING_PATHS = ['/features', '/about', '/contact', '/legal/*', '/blog/*'];
// Retired public pages (the old directory and public profiles) forward to the marketing home.
const MARKETING_HOME_PATHS = ['/directory', '/suppliers/*', '/u/:username'];


/** `/themes/:themeId/settings` (both scopes) → `/customize?tab=theme&theme=:themeId`. */
function ThemeSettingsRedirect() {
    const { themeId } = useParams();
    const { uiBase } = useStoreScope();
    return <Navigate to={`${uiBase}/customize?tab=theme&theme=${encodeURIComponent(themeId)}`} replace />;
}

function joinPath(base, path) {
    return path ? `${base}/${path}` : base;
}

/**
 * Store admin pages, relative to the store base (`/store` or `/stores/:id`).
 * Legacy paths redirect inside the same scope; the catalog stays unified on
 * /products and /categories (see ProductScope).
 */
const STORE_ROUTES = [
    { path: '', element: <StoreRedirect to="overview" /> },
    { path: 'onboarding', element: <StoreRedirect to="overview" /> },
    { path: 'settings', element: <StoreRedirect to="settings/general" /> },
    { path: 'payments', element: <StoreRedirect to="settings/payments" /> },
    { path: 'overview', element: <StoreOverviewPage /> },
    { path: 'orders', element: <StoreOrdersPage /> },
    { path: 'orders/print', element: <StoreOrdersPrintPage /> },
    { path: 'orders/create', element: <StoreManualOrderPage /> },
    { path: 'orders/:orderId', element: <StoreOrderDetailPage /> },
    { path: 'draft-orders', element: <StoreDraftOrdersPage /> },
    { path: 'draft-orders/new', element: <StoreDraftOrderEditorPage key="new" /> },
    { path: 'draft-orders/:draftId', element: <StoreDraftOrderEditorPage /> },
    { path: 'coupons', element: <StoreCouponsPage /> },
    { path: 'inventory', element: <StoreInventoryPage /> },
    { path: 'coupons/new', element: <StoreCouponFormPage /> },
    { path: 'coupons/:couponId/edit', element: <StoreCouponFormPage /> },
    { path: 'reviews', element: <StoreReviewsPage /> },
    { path: 'analytics', element: <StoreAnalyticsPage /> },
    { path: 'themes', element: <StoreThemesPage mode="installed" /> },
    { path: 'themes/marketplace', element: <StoreThemesPage mode="marketplace" /> },
    // Legacy per-theme settings editor → the full-screen editor's Theme settings tab.
    { path: 'themes/:themeId/settings', element: <ThemeSettingsRedirect /> },
    { path: 'pages', element: <StorePagesPage /> },
    { path: 'simple-pages/create', element: <StoreSimplePageEditor /> },
    { path: 'simple-pages/:pageId', element: <StoreSimplePageEditor /> },
    { path: 'articles', element: <StoreArticlesPage /> },
    { path: 'articles/new', element: <StoreArticleEditorPage /> },
    { path: 'articles/:articleId', element: <StoreArticleEditorPage /> },
    { path: 'checkout-fields', element: <StoreCheckoutFieldsPage /> },
    { path: 'thanks-edit', element: <StoreThankYouPage /> },
    { path: 'ui-blocks', element: <StoreUiBlocksPage /> },
    { path: 'settings/digital-delivery', element: <StoreDigitalDeliveryPage /> },
    { path: 'settings/notifications', element: <StoreNotificationsPage /> },
    { path: 'settings/order-limits', element: <StoreOrderLimitsPage /> },
    { path: 'blocked-phone-numbers', element: <StoreBlockedPhonesPage /> },
    { path: 'blocked-phones', element: <StoreBlockedPhonesPage otp /> },
    { path: 'newsletter', element: <StoreNewsletterPage /> },
    { path: 'missed-orders', element: <StoreMissedOrdersPage /> },
    { path: 'customers', element: <StoreCustomersPage /> },
    { path: 'customers/view', element: <StoreCustomerDetailPage /> },
    { path: 'pixels-settings', element: <StoreTrackingPage /> },
    { path: 'pixel-conversion', element: <StoreTrackingPage mode="conversions" /> },
    { path: 'ga', element: <StoreTrackingPage mode="google" /> },
    { path: 'apps', element: <StoreAppsPage /> },
    { path: 'apps/:app', element: <StoreAppDetailPage /> },
    { path: 'sheets', element: <StoreSheetsPage /> },
    { path: 'downsell', element: <StoreDownsellPage /> },
    { path: 'ab-tests', element: <StoreAbTestsPage /> },
    { path: 'product-feed', element: <StoreProductFeedPage /> },
    { path: 'google-merchant', element: <StoreGoogleMerchantPage /> },
    { path: 'utm-builder', element: <StoreCampaignBuilderPage /> },
    { path: 'create-referral-link', element: <StoreReferralBuilderPage /> },
    { path: 'retargeting', element: <StoreRetargetingPage /> },
    { path: 'marketing-services', element: <StoreMarketingServicesPage /> },
    { path: 'settings/phone-verification', element: <StorePhoneVerificationPage /> },
    { path: 'funnels', element: <StoreFunnelsPage /> },
    { path: 'funnels/create', element: <StoreFunnelCreatePage /> },
    { path: 'funnels/:funnelId/edit', element: <StoreFunnelEditPage /> },
    { path: 'pages/:pageId/builder', element: <StorePageBuilderPage /> },
    { path: 'content/:key', element: <StoreContentPageEditor /> },
    { path: 'menus', element: <StoreMenusPage /> },
    { path: 'media', element: <StoreMediaPage /> },
    { path: 'upload-assets', element: <StoreDesignAssetsPage /> },
    { path: 'settings/general', element: <StoreGeneralSettingsPage /> },
    { path: 'settings/store-info', element: <StorePoliciesSettingsPage /> },
    { path: 'settings/seo', element: <StoreSeoSettingsPage /> },
    { path: 'settings/social-links', element: <StoreSocialSettingsPage /> },
    { path: 'settings/order-push', element: <StoreOrderPushPage /> },
    { path: 'settings/head-code', element: <StoreHeadCodePage /> },
    { path: 'settings/webhooks', element: <StoreWebhooksPage /> },
    { path: 'settings/public-api', element: <StorePublicApiPage /> },
    { path: 'settings/public-api/create', element: <StorePublicApiEditorPage /> },
    { path: 'settings/public-api/docs', element: <StorePublicApiDocsPage /> },
    { path: 'settings/public-api/:keyId', element: <StorePublicApiEditorPage /> },
    { path: 'settings/webhooks/create', element: <StoreWebhookEditorPage /> },
    { path: 'settings/webhooks/:webhookId', element: <StoreWebhookEditorPage /> },
    { path: 'settings/managers', element: <StoreManagersPage /> },
    { path: 'settings/login-sessions', element: <StoreLoginSessionsPage /> },
    { path: 'settings/bot-protection', element: <StoreBotProtectionPage /> },
    { path: 'settings/shopping-preferences', element: <StoreShoppingPreferencesPage /> },
    { path: 'settings/localization', element: <StoreLocalizationSettingsPage /> },
    { path: 'settings/payments', element: <StorePaymentsPage /> },
    { path: 'settings/shipping', element: <StoreShippingTaxSettingsPage /> },
    { path: 'settings/domains', element: <StoreDomainsPage /> },
    { path: 'settings/publish', element: <StorePublishPage /> },
    { path: 'products', element: <StoreProductsPage /> },
    { path: 'products/new', element: <StoreProductEditorPage /> },
    { path: 'products/:productId/edit', element: <StoreProductEditorPage /> },
    { path: 'categories', element: <StoreCategoriesPage /> },
    { path: 'categories/new', element: <StoreCategoryEditorPage /> },
    { path: 'categories/:categoryId/edit', element: <StoreCategoryEditorPage /> },
    { path: 'collections', element: <StoreCollectionsPage /> },
    { path: 'collections/new', element: <StoreCollectionEditorPage /> },
    { path: 'collections/:collectionId', element: <StoreCollectionEditorPage /> },
];

export default function App() {
    return (
        <AppErrorBoundary>
        <PlatformReferralCapture />
        <Suspense fallback={<BrandLoader />}>
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/pending-approval" element={<PendingApprovalPage />} />
            <Route path="/" element={<RootRoute />} />
            {MARKETING_PATHS.map((path) => <Route key={path} path={path} element={<MarketingRedirect />} />)}
            {MARKETING_HOME_PATHS.map((path) => <Route key={path} path={path} element={<MarketingRedirect to="/" />} />)}
            <Route
                element={
                    <RequireAuth>
                        <AppLayout />
                    </RequireAuth>
                }
            >
                <Route path="/dashboard" element={<Dashboard />} />
                {/* The community section lives under /community. /feed is kept
                    as a permanent redirect so older links and bookmarks work. */}
                <Route path="/community" element={<FeedPage />} />
                <Route path="/feed" element={<Navigate to="/community" replace />} />
                <Route path="/community/create" element={<CommunityCreatePage />} />
                <Route path="/community/post/:id" element={<CommunityPostPage />} />
                <Route path="/community/u/:username" element={<CommunityProfilePage />} />
                <Route path="/community/connections/:username?" element={<CommunityConnectionsPage />} />
                <Route path="/community/search" element={<CommunitySearchPage />} />
                <Route path="/community/tag/:slug" element={<CommunityHashtagPage />} />
                <Route path="/community/following" element={<FeedPage initialScope="following" titleKey="community_page_following" />} />
                <Route path="/community/saved" element={<FeedPage initialScope="saved" titleKey="community_page_saved" />} />
                <Route path="/community/trending" element={<FeedPage initialScope="trending" titleKey="community_page_trending" />} />
                <Route path="/community/groups" element={<CommunityGroupsPage />} />
                <Route path="/community/groups/:id" element={<CommunityGroupPage />} />
                <Route path="/reels" element={<ReelsPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/support" element={<SupportTicketsPage admin />} />
                <Route path="/admin/support/:id" element={<SupportTicketPage admin />} />
                <Route path="/support" element={<SupportTicketsPage />} />
                <Route path="/support/new" element={<SupportNewTicketPage />} />
                <Route path="/support/:id" element={<SupportTicketPage />} />
                <Route path="/admin/reports/users" element={<AdminReportsUsersPage />} />
                <Route path="/admin/reports/orders" element={<AdminReportsOrdersPage />} />
                <Route path="/admin/reports/revenue" element={<AdminReportsRevenuePage />} />
                <Route path="/admin/articles/new" element={<AdminArticleFormPage />} />
                <Route path="/admin/articles/:id/edit" element={<AdminArticleFormPage />} />
                <Route path="/admin/articles" element={<AdminArticlesPage />} />
                <Route path="/admin/themes" element={<AdminThemeMarketplacePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/employees" element={<EmployeesPage />} />
                <Route path="/settings/verification" element={<VerificationRequestPage />} />
                <Route path="/settings/sectors" element={<SectorsSettingsPage />} />
                <Route path="/admin/verifications" element={<AdminVerificationsPage />} />
                <Route path="/merchants" element={<MerchantsPage />} />
                <Route path="/merchants/new" element={<MerchantFormPage />} />
                <Route path="/merchants/:id/edit" element={<MerchantFormPage />} />
                <Route path="/merchants/:id" element={<MerchantDetailPage />} />
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
                <Route path="/settings/currencies" element={<CurrencySettingsPage />} />
                {/* Store admin — one route table rendered twice under a shared StoreLayout
                    (sidebar + store context): owners at /store/* (no id; useStoreScope resolves
                    the store via /my-store) and admins at /stores/:id/*. Absolute paths keep
                    /stores, /stores/new and /stores/:id/edit outside the layout. */}
                <Route element={<StoreLayout />}>
                    {STORE_ROUTES.map((route) => (
                        <Route key={`store:${route.path}`} path={joinPath('/store', route.path)} element={route.element} />
                    ))}
                    {STORE_ROUTES.map((route) => (
                        <Route key={`stores:${route.path}`} path={joinPath('/stores/:id', route.path)} element={route.element} />
                    ))}
                </Route>
                <Route path="/stores/new" element={<StoreFormPage />} />
                <Route path="/stores/:id/edit" element={<StoreFormPage />} />
                <Route path="/stores" element={<StoresPage />} />
                <Route path="/top-up" element={<PlatformWalletPage key="wallet" />} />
                <Route path="/subscriptions" element={<MerchantSubscriptionsPage />} />
                <Route path="/transactions" element={<PlatformWalletPage key="transactions" mode="transactions" />} />
                <Route path="/referral" element={<PlatformWalletPage key="referral" mode="referral" />} />
                <Route path="/services" element={<ServiceMarketplacePage key="all-services" />} />
                <Route path="/services/manage" element={<ServiceMarketplaceManagePage />} />
                <Route path="/services/service-provider/:provider" element={<ServiceMarketplaceProviderPage />} />
                <Route path="/services/:service" element={<ServiceMarketplaceDetailPage />} />
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
            {/* Store editor — full-screen (no app header, no store sidebar), Shopify/Salla style. */}
            <Route
                element={
                    <RequireAuth>
                        <EditorLayout />
                    </RequireAuth>
                }
            >
                <Route path="/store/customize" element={<StoreCustomizePage />} />
                <Route path="/stores/:id/customize" element={<StoreCustomizePage />} />
            </Route>
            <Route element={<RequireAuth><EditorLayout product /></RequireAuth>}>
                <Route path="/store/products/:productId/landing" element={<ProductLandingEditorPage />} />
                <Route path="/stores/:id/products/:productId/landing" element={<ProductLandingEditorPage />} />
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
