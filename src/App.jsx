import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppErrorBoundary from './components/AppErrorBoundary';
import AppLayout from './components/AppLayout';
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
const CommunityGroupsPage = lazy(() => import('./pages/CommunityGroupsPage'));
const CommunityGroupPage = lazy(() => import('./pages/CommunityGroupPage'));
const ReelsPage = lazy(() => import('./pages/ReelsPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const CompanyWorkspacePage = lazy(() => import('./pages/CompanyWorkspacePage'));
const ProcurementWorkspacePage = lazy(() => import('./pages/ProcurementWorkspacePage'));
const FinancingPage = lazy(() => import('./pages/FinancingPage'));
const OpportunitiesPage = lazy(() => import('./pages/OpportunitiesPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const QuotationsPage = lazy(() => import('./pages/QuotationsPage'));
const DealsPage = lazy(() => import('./pages/DealsPage'));
const GatewaysPage = lazy(() => import('./pages/GatewaysPage'));
const GatewayDetailPage = lazy(() => import('./pages/GatewayDetailPage'));
const GatewayFormPage = lazy(() => import('./pages/GatewayFormPage'));
const SuppliersPage = lazy(() => import('./pages/SuppliersPage'));
const SupplierDetailPage = lazy(() => import('./pages/SupplierDetailPage'));
const SupplierFormPage = lazy(() => import('./pages/SupplierFormPage'));
const MerchantsPage = lazy(() => import('./pages/MerchantsPage'));
const MerchantDetailPage = lazy(() => import('./pages/MerchantDetailPage'));
const MerchantFormPage = lazy(() => import('./pages/MerchantFormPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminUserDetailPage = lazy(() => import('./pages/AdminUserDetailPage'));
const AdminUserFormPage = lazy(() => import('./pages/AdminUserFormPage'));
const AdminActivityPage = lazy(() => import('./pages/AdminActivityPage'));
const AdminRolesPage = lazy(() => import('./pages/AdminRolesPage'));
const AdminRoleFormPage = lazy(() => import('./pages/AdminRoleFormPage'));
const ShippingCompaniesPage = lazy(() => import('./pages/ShippingCompaniesPage'));
const ShippingCompanyFormPage = lazy(() => import('./pages/ShippingCompanyFormPage'));
const DeliveriesPage = lazy(() => import('./pages/DeliveriesPage'));
const MonitoringLivePage = lazy(() => import('./pages/MonitoringLivePage'));
const MonitoringSessionsPage = lazy(() => import('./pages/MonitoringSessionsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const EmailSettingsPage = lazy(() => import('./pages/EmailSettingsPage'));
const GoogleSettingsPage = lazy(() => import('./pages/GoogleSettingsPage'));
const WigpleasureSyncSettingsPage = lazy(() => import('./pages/WigpleasureSyncSettingsPage'));
const TicketsPage = lazy(() => import('./pages/TicketsPage'));
const TicketDetailPage = lazy(() => import('./pages/TicketDetailPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const StockTransfersPage = lazy(() => import('./pages/StockTransfersPage'));
const StockTransferFormPage = lazy(() => import('./pages/StockTransferFormPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const BundlesPage = lazy(() => import('./pages/BundlesPage'));
const AttributesPage = lazy(() => import('./pages/AttributesPage'));
const PartnersPage = lazy(() => import('./pages/PartnersPage'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage'));
const LedgerPage = lazy(() => import('./pages/LedgerPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const DirectoryPage = lazy(() => import('./pages/public/DirectoryPage'));
// Public supplier-directory pages are code-split so the marketing/landing entry
// stays lean — they load on demand when a visitor opens /suppliers/*.
const SuppliersDirectoryPage = lazy(() => import('./pages/public/SuppliersDirectoryPage'));
const SectorPage = lazy(() => import('./pages/public/SectorPage'));
const SpecialtyPage = lazy(() => import('./pages/public/SpecialtyPage'));
const CityPage = lazy(() => import('./pages/public/CityPage'));
const PublicProfilePage = lazy(() => import('./pages/public/PublicProfilePage'));
import PublicLayout from './layouts/PublicLayout';
import LandingPage from './pages/public/LandingPage';
const FeaturesPage = lazy(() => import('./pages/public/FeaturesPage'));
const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const TermsPage = lazy(() => import('./pages/public/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/public/PrivacyPage'));
const BlogIndexPage = lazy(() => import('./pages/public/BlogIndexPage'));
const BlogArticlePage = lazy(() => import('./pages/public/BlogArticlePage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const SectorsSettingsPage = lazy(() => import('./pages/SectorsSettingsPage'));
const AdminReportsUsersPage = lazy(() => import('./pages/AdminReportsUsersPage'));
const AdminReportsOrdersPage = lazy(() => import('./pages/AdminReportsOrdersPage'));
const AdminReportsRevenuePage = lazy(() => import('./pages/AdminReportsRevenuePage'));
const AdminReportsTicketsPage = lazy(() => import('./pages/AdminReportsTicketsPage'));
const AdminArticlesPage = lazy(() => import('./pages/AdminArticlesPage'));
const AdminArticleFormPage = lazy(() => import('./pages/AdminArticleFormPage'));
const VerificationRequestPage = lazy(() => import('./pages/VerificationRequestPage'));
const AdminVerificationsPage = lazy(() => import('./pages/AdminVerificationsPage'));
const BalancePage = lazy(() => import('./pages/BalancePage'));
const BundleDetailPage = lazy(() => import('./pages/BundleDetailPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CategoryDetailPage = lazy(() => import('./pages/CategoryDetailPage'));
const ProductFormPage = lazy(() => import('./pages/ProductFormPage'));
const CategoryFormPage = lazy(() => import('./pages/CategoryFormPage'));
const BundleFormPage = lazy(() => import('./pages/BundleFormPage'));
const StoresPage = lazy(() => import('./pages/StoresPage'));
const StoreFormPage = lazy(() => import('./pages/StoreFormPage'));
const StoreSettingsPage = lazy(() => import('./pages/StoreSettingsPage'));
const StoreThemesPage = lazy(() => import('./pages/StoreThemesPage'));
const StoreThemeSettingsPage = lazy(() => import('./pages/StoreThemeSettingsPage'));
const StorePagesPage = lazy(() => import('./pages/StorePagesPage'));
const StoreSetupPage = lazy(() => import('./pages/StoreSetupPage'));
const StorePageBuilderPage = lazy(() => import('./pages/StorePageBuilderPage'));
const StoreContentPageEditor = lazy(() => import('./pages/StoreContentPageEditor'));
const StoreMenusPage = lazy(() => import('./pages/StoreMenusPage'));
// Phase 6H: route-level lazy loading for the heavier commerce/analytics pages
// (keeps chart.js and these screens out of the main bundle).
const StoreCouponsPage = lazy(() => import('./pages/StoreCouponsPage'));
const StoreCouponFormPage = lazy(() => import('./pages/StoreCouponFormPage'));
const StoreOrdersPage = lazy(() => import('./pages/StoreOrdersPage'));
const StoreOrderDetailPage = lazy(() => import('./pages/StoreOrderDetailPage'));
const StoreAnalyticsPage = lazy(() => import('./pages/StoreAnalyticsPage'));
const StoreReviewsPage = lazy(() => import('./pages/StoreReviewsPage'));
// StoreProduct*/StoreCategory* pages removed: catalog is unified onto /products & /categories.
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
                <Route path="/suppliers" element={<SuppliersDirectoryPage />} />
                <Route path="/suppliers/:sector" element={<SectorPage />} />
                {/* City landing pages sit on a reserved `city` segment so they never
                    collide with a specialty slug. Declared before the specialty route. */}
                <Route path="/suppliers/:sector/city/:city" element={<CityPage />} />
                <Route path="/suppliers/:sector/:specialty" element={<SpecialtyPage />} />
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
                {/* The community section lives under /community. /feed is kept
                    as a permanent redirect so older links and bookmarks work. */}
                <Route path="/community" element={<FeedPage />} />
                <Route path="/feed" element={<Navigate to="/community" replace />} />
                <Route path="/community/create" element={<CommunityCreatePage />} />
                <Route path="/community/post/:id" element={<CommunityPostPage />} />
                <Route path="/community/u/:username" element={<CommunityProfilePage />} />
                <Route path="/community/following" element={<FeedPage initialScope="following" titleKey="community_page_following" />} />
                <Route path="/community/saved" element={<FeedPage initialScope="saved" titleKey="community_page_saved" />} />
                <Route path="/community/trending" element={<FeedPage initialScope="trending" titleKey="community_page_trending" />} />
                <Route path="/community/groups" element={<CommunityGroupsPage />} />
                <Route path="/community/groups/:id" element={<CommunityGroupPage />} />
                <Route path="/reels" element={<ReelsPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/company" element={<CompanyWorkspacePage />} />
                <Route path="/procurement" element={<ProcurementWorkspacePage />} />
                <Route path="/financing" element={<FinancingPage />} />
                <Route path="/opportunities" element={<OpportunitiesPage />} />
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
                <Route path="/settings/sectors" element={<SectorsSettingsPage />} />
                <Route path="/admin/verifications" element={<AdminVerificationsPage />} />
                <Route path="/quotations/in" element={<Navigate to="/quotations" replace />} />
                <Route path="/quotations/out" element={<Navigate to="/quotations" replace />} />
                <Route path="/deals/in" element={<DealsPage direction="in" />} />
                <Route path="/deals/out" element={<DealsPage direction="out" />} />
                <Route path="/gateways" element={<GatewaysPage />} />
                <Route path="/gateways/:id" element={<GatewayDetailPage />} />
                <Route path="/gateways/:id/edit" element={<GatewayFormPage />} />
                <Route path="/crm/suppliers" element={<SuppliersPage />} />
                <Route path="/crm/suppliers/new" element={<SupplierFormPage />} />
                <Route path="/crm/suppliers/:id/edit" element={<SupplierFormPage />} />
                <Route path="/crm/suppliers/:id" element={<SupplierDetailPage />} />
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
                <Route path="/store/onboarding" element={<StoreSetupPage />} />
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
                <Route path="/stores/:id/onboarding" element={<StoreSetupPage />} />
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
