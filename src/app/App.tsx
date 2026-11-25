import { Navigate, Route, Routes } from 'react-router-dom'
import { SiteLayout } from '../components/layout/SiteLayout.tsx'
import {
  RequireAdmin,
  RequireApprovedReseller,
  RequireAuth,
  RequireCustomer,
  RequireReseller,
} from '../features/auth/guards.tsx'
import { AccountAddressesPage } from '../pages/account/AccountAddressesPage.tsx'
import { AccountDashboardPage } from '../pages/account/AccountDashboardPage.tsx'
import { AccountLayout } from '../pages/account/AccountLayout.tsx'
import { AccountOrderPage } from '../pages/account/AccountOrderPage.tsx'
import { AccountOrdersPage } from '../pages/account/AccountOrdersPage.tsx'
import { AccountProfilePage } from '../pages/account/AccountProfilePage.tsx'
import { AccountSettingsPage } from '../pages/account/AccountSettingsPage.tsx'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage.tsx'
import { AdminLayout } from '../pages/admin/AdminLayout.tsx'
import { AdminOrderPage } from '../pages/admin/AdminOrderPage.tsx'
import { AdminOrdersPage } from '../pages/admin/AdminOrdersPage.tsx'
import { CollectionsAdmin, ProductEditor, ProductsAdmin } from '../pages/admin/CatalogAdmin.tsx'
import { EventsAdmin } from '../pages/admin/EventsAdmin.tsx'
import { HomepageEditor } from '../pages/admin/HomepageEditor.tsx'
import { InquiriesAdmin } from '../pages/admin/InquiriesAdmin.tsx'
import { AssociationAdmin } from '../pages/admin/AssociationAdmin.tsx'
import { AboutAdmin, ContactAdmin, SettingsAdmin } from '../pages/admin/StorePagesAdmin.tsx'
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage.tsx'
import { LoginPage } from '../pages/auth/LoginPage.tsx'
import { RegisterPage } from '../pages/auth/RegisterPage.tsx'
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage.tsx'
import { CheckoutPage } from '../pages/CheckoutPage.tsx'
import { CollectionsPage } from '../pages/CollectionsPage.tsx'
import { BookPage } from '../pages/BookPage.tsx'
import { EventDetailPage } from '../pages/EventDetailPage.tsx'
import { EventsPage } from '../pages/EventsPage.tsx'
import { AboutPage, AssociationPage, ContactPage } from '../pages/ContentPages.tsx'
import { HomePage } from '../pages/HomePage.tsx'
import { NotFoundPage } from '../pages/NotFoundPage.tsx'
import { ProductDetailPage } from '../pages/ProductDetailPage.tsx'
import { ResellerDashboardPage } from '../pages/reseller/ResellerDashboardPage.tsx'
import { ResellerHomeRedirect } from '../pages/reseller/ResellerHomeRedirect.tsx'
import { ResellerLayout } from '../pages/reseller/ResellerLayout.tsx'
import { ResellerOrderPage } from '../pages/reseller/ResellerOrderPage.tsx'
import { ResellerOrdersPage } from '../pages/reseller/ResellerOrdersPage.tsx'
import { ResellerPendingPage } from '../pages/reseller/ResellerPendingPage.tsx'
import { ResellerRankingPage } from '../pages/reseller/ResellerRankingPage.tsx'
import { ResellerRegisterPage } from '../pages/reseller/ResellerRegisterPage.tsx'
import { ResellerSettingsPage } from '../pages/reseller/ResellerSettingsPage.tsx'
import { ResellersAdmin } from '../pages/admin/ResellersAdmin.tsx'
import { ResellerRankingAdmin } from '../pages/admin/ResellerRankingAdmin.tsx'
import { LegacyWholesalerRedirect } from './LegacyWholesalerRedirect.tsx'

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="collections" element={<CollectionsPage />} />
        <Route path="products/:slug" element={<ProductDetailPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:slug" element={<EventDetailPage />} />
        <Route path="book" element={<BookPage />} />
        <Route path="association" element={<AssociationPage />} />
        <Route path="gallery" element={<Navigate to="/association" replace />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="wholesaler/register" element={<ResellerRegisterPage />} />
        <Route path="reseller/*" element={<LegacyWholesalerRedirect />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<NotFoundPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<RequireCustomer />}>
            <Route path="account" element={<AccountLayout />}>
              <Route index element={<AccountDashboardPage />} />
              <Route path="dashboard" element={<AccountDashboardPage />} />
              <Route path="profile" element={<AccountProfilePage />} />
              <Route path="addresses" element={<AccountAddressesPage />} />
              <Route path="orders" element={<AccountOrdersPage />} />
              <Route path="orders/:orderId" element={<AccountOrderPage />} />
              <Route path="settings" element={<AccountSettingsPage />} />
            </Route>
          </Route>
          <Route element={<RequireReseller />}>
            <Route path="wholesaler" element={<ResellerLayout />}>
              <Route index element={<ResellerHomeRedirect />} />
              <Route path="pending" element={<ResellerPendingPage />} />
              <Route element={<RequireApprovedReseller />}>
                <Route path="dashboard" element={<ResellerDashboardPage />} />
                <Route path="orders" element={<ResellerOrdersPage />} />
                <Route path="orders/:orderId" element={<ResellerOrderPage />} />
                <Route path="ranking" element={<ResellerRankingPage />} />
                <Route path="settings" element={<ResellerSettingsPage />} />
              </Route>
            </Route>
          </Route>
        </Route>
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<RequireAdmin />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="orders/:orderId" element={<AdminOrderPage />} />
            <Route path="products" element={<ProductsAdmin />} />
            <Route path="products/new" element={<ProductEditor />} />
            <Route path="products/:productId" element={<ProductEditor />} />
            <Route path="collections" element={<CollectionsAdmin />} />
            <Route path="homepage" element={<HomepageEditor />} />
            <Route path="events" element={<EventsAdmin />} />
            <Route path="association" element={<AssociationAdmin />} />
            <Route path="gallery" element={<Navigate to="/admin/association" replace />} />
            <Route path="about" element={<AboutAdmin />} />
            <Route path="contact" element={<ContactAdmin />} />
            <Route path="inquiries" element={<InquiriesAdmin />} />
            <Route path="wholesalers" element={<ResellersAdmin />} />
            <Route path="wholesaler-ranking" element={<ResellerRankingAdmin />} />
            <Route path="resellers" element={<Navigate to="/admin/wholesalers" replace />} />
            <Route path="reseller-ranking" element={<Navigate to="/admin/wholesaler-ranking" replace />} />
            <Route path="settings" element={<SettingsAdmin />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}