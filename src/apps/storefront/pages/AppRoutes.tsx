/**
 * AppRoutes — the storefront route table, rendered inside the theme's DefaultLayout so global chrome
 * persists across navigations. Pages are code-split via React.lazy (Phase 9 route splitting); a
 * lightweight Suspense fallback covers the first load of each chunk.
 */
import { lazy, Suspense, type ReactElement } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, Section, Spinner } from '../themes/luxury-fashion/components';

const HomePage = lazy(() => import('./HomePage').then((m) => ({ default: m.HomePage })));
const CategoryPage = lazy(() => import('./CategoryPage').then((m) => ({ default: m.CategoryPage })));
const ProductPage = lazy(() => import('./ProductPage').then((m) => ({ default: m.ProductPage })));
const SearchPage = lazy(() => import('./SearchPage').then((m) => ({ default: m.SearchPage })));
const CartPage = lazy(() => import('./CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const OrderSuccessPage = lazy(() => import('./CheckoutPage').then((m) => ({ default: m.OrderSuccessPage })));
const WishlistPage = lazy(() => import('./WishlistPage').then((m) => ({ default: m.WishlistPage })));
const NotFoundPage = lazy(() => import('./NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const LoginPage = lazy(() => import('./AuthPages').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./AuthPages').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./AuthPages').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./AuthPages').then((m) => ({ default: m.ResetPasswordPage })));
const AccountLayout = lazy(() => import('./AccountPages').then((m) => ({ default: m.AccountLayout })));
const AccountPage = lazy(() => import('./AccountPages').then((m) => ({ default: m.AccountPage })));
const OrdersPage = lazy(() => import('./AccountPages').then((m) => ({ default: m.OrdersPage })));
const OrderDetailPage = lazy(() => import('./AccountPages').then((m) => ({ default: m.OrderDetailPage })));
const AddressesPage = lazy(() => import('./AccountPages').then((m) => ({ default: m.AddressesPage })));
const AboutPage = lazy(() => import('./CompanyPages').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./CompanyPages').then((m) => ({ default: m.ContactPage })));
const FaqPage = lazy(() => import('./StaticPages').then((m) => ({ default: m.FaqPage })));
const BlogPage = lazy(() => import('./BlogPages').then((m) => ({ default: m.BlogPage })));
const BlogDetailPage = lazy(() => import('./BlogPages').then((m) => ({ default: m.BlogDetailPage })));
const PolicyPage = lazy(() => import('./StaticPages').then((m) => ({ default: m.PolicyPage })));
const CategoriesPage = lazy(() => import('./BrowsePages').then((m) => ({ default: m.CategoriesPage })));
const CollectionsPage = lazy(() => import('./BrowsePages').then((m) => ({ default: m.CollectionsPage })));
const BrandsPage = lazy(() => import('./BrowsePages').then((m) => ({ default: m.BrandsPage })));

function PageFallback(): ReactElement {
  const { t } = useTranslation();
  return (
    <Section>
      <Container>
        <div style={{ display: 'grid', placeItems: 'center', minHeight: '40vh' }}>
          <Spinner label={t('common.loading')} />
        </div>
      </Container>
    </Section>
  );
}

export function AppRoutes(): ReactElement {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/*
          `/shop` is the canonical shop-all URL — shorter and more guessable than
          /collections/all, which it renders. CategoryPage treats both as the same curated view.
        */}
        <Route path="/shop" element={<CategoryPage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/collections/:slug" element={<CategoryPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/brands" element={<BrandsPage />} />
        <Route path="/products/:slug" element={<ProductPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order/success" element={<OrderSuccessPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="/account" element={<AccountLayout />}>
          <Route index element={<AccountPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:number" element={<OrderDetailPage />} />
          <Route path="addresses" element={<AddressesPage />} />
        </Route>

        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogDetailPage />} />
        <Route path="/pages/:slug" element={<PolicyPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
