import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import { FullPageSpinner } from '../components/ui/Spinner';

// Lazy-loaded pages
const LoginPage = lazy(() => import('../pages/LoginPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const BillingPage = lazy(() => import('../pages/BillingPage'));
const InvoiceHistoryPage = lazy(() => import('../pages/InvoiceHistoryPage'));
const InvoiceDetailPage = lazy(() => import('../pages/InvoiceDetailPage'));
const KhataBookPage = lazy(() => import('../pages/KhataBookPage'));
const KhataCustomerPage = lazy(() => import('../pages/KhataCustomerPage'));
const CustomersPage = lazy(() => import('../pages/CustomersPage'));
const CustomerDetailPage = lazy(() => import('../pages/CustomerDetailPage'));
const ProductsPage = lazy(() => import('../pages/ProductsPage'));
const ProductFormPage = lazy(() => import('../pages/ProductFormPage'));
const InventoryPage = lazy(() => import('../pages/InventoryPage'));
const OrdersPage = lazy(() => import('../pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('../pages/OrderDetailPage'));
const ReportsPage = lazy(() => import('../pages/ReportsPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const NotificationsPage = lazy(() => import('../pages/NotificationsPage'));
const StorePage = lazy(() => import('../pages/StorePage'));
const StoreProductPage = lazy(() => import('../pages/StoreProductPage'));
const CartPage = lazy(() => import('../pages/CartPage'));
const CheckoutPage = lazy(() => import('../pages/CheckoutPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

function SuspenseWrapper({ children }) {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      {children}
    </Suspense>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<SuspenseWrapper><LoginPage /></SuspenseWrapper>} />

      {/* Staff routes */}
      <Route path="/" element={
        <ProtectedRoute staffOnly>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<SuspenseWrapper><DashboardPage /></SuspenseWrapper>} />
        <Route path="billing" element={
          <ProtectedRoute permission="billing">
            <SuspenseWrapper><BillingPage /></SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="invoices" element={
          <ProtectedRoute permission="invoices">
            <SuspenseWrapper><InvoiceHistoryPage /></SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="invoices/:id" element={
          <ProtectedRoute permission="invoices">
            <SuspenseWrapper><InvoiceDetailPage /></SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="khatabook" element={
          <ProtectedRoute permission="khatabook">
            <SuspenseWrapper><KhataBookPage /></SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="khatabook/:customerId" element={
          <ProtectedRoute permission="khatabook">
            <SuspenseWrapper><KhataCustomerPage /></SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="customers" element={
          <ProtectedRoute permission="customers">
            <SuspenseWrapper><CustomersPage /></SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="customers/:id" element={
          <ProtectedRoute permission="customers">
            <SuspenseWrapper><CustomerDetailPage /></SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="products" element={
          <ProtectedRoute permission="products">
            <SuspenseWrapper><ProductsPage /></SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="products/new" element={
          <ProtectedRoute permission="products">
            <SuspenseWrapper><ProductFormPage /></SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="products/:id/edit" element={
          <ProtectedRoute permission="products">
            <SuspenseWrapper><ProductFormPage /></SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="inventory" element={
          <ProtectedRoute permission="inventory">
            <SuspenseWrapper><InventoryPage /></SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="orders" element={
          <ProtectedRoute permission="orders">
            <SuspenseWrapper><OrdersPage /></SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="orders/:id" element={
          <ProtectedRoute permission="orders">
            <SuspenseWrapper><OrderDetailPage /></SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="reports" element={
          <ProtectedRoute permission="reports">
            <SuspenseWrapper><ReportsPage /></SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute permission="settings">
            <SuspenseWrapper><SettingsPage /></SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="notifications" element={
          <SuspenseWrapper><NotificationsPage /></SuspenseWrapper>
        } />
      </Route>

      {/* E-commerce / Customer routes */}
      <Route path="/store" element={<SuspenseWrapper><StorePage /></SuspenseWrapper>} />
      <Route path="/store/products/:id" element={<SuspenseWrapper><StoreProductPage /></SuspenseWrapper>} />
      <Route path="/store/cart" element={<SuspenseWrapper><CartPage /></SuspenseWrapper>} />
      <Route path="/store/checkout" element={
        <ProtectedRoute>
          <SuspenseWrapper><CheckoutPage /></SuspenseWrapper>
        </ProtectedRoute>
      } />

      {/* 404 */}
      <Route path="*" element={<SuspenseWrapper><NotFoundPage /></SuspenseWrapper>} />
    </Routes>
  );
}
