import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSessionMonitor } from "../hooks/useSessionMonitor";
import ErrorBoundary from "./shared/ErrorBoundary";
import { useAuth } from "../contexts/AuthContext";
import { hasAnyPermission, hasPermission } from "../lib/rbac";

// Public Pages
import Index from "../pages/Index";
import About from "../pages/About";
import Blog from "../pages/Blog";
import Contact from "../pages/Contact";
import Login from "../pages/Login";
import Register from "../pages/Register";
import NotFound from "../pages/NotFound";

// Bot Marketplace Pages
import BotMarketplace from "../pages/BotMarketplace";
import BotDetail from "../pages/BotDetail";

// Creator Pages
import CreatorLayout from "./creator/CreatorLayout";
import CreatorDashboard from "../pages/creator/CreatorDashboard";
import BotBuilder from "./bot/BotBuilder";

// User Pages
import Account from "../pages/Account";

// Admin Pages
import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "../pages/admin/Dashboard";
import AdminSupportChat from "../pages/admin/SupportChat";
import AdminMyBots from "../pages/admin/MyBots";
import BotAnalytics from "../pages/admin/BotAnalytics";
import UsersManagement from "../pages/admin/Users";
import BotsManagement from "../pages/admin/BotsManagement";
import CategoriesManagement from "../pages/admin/CategoriesManagement";
import AuditLogs from "../pages/admin/AuditLogs";

// E-commerce Pages (Legacy - can be removed or repurposed)
// import Shop from "../pages/Shop";
// import ProductDetails from "../pages/ProductDetails";
// import Cart from "../pages/Cart";
// import Checkout from "../pages/Checkout";
// import OrderSuccess from "../pages/OrderSuccess";
// import ProductList from "../pages/admin/ProductList";
// import ProductForm from "../pages/admin/ProductForm";

// Route guards are defined here at module scope — NOT inside AppContent.
// Defining them inside the component body creates a new function reference on
// every render, causing React to treat each guard as a brand-new component
// type and remount it. That forces React Router to dispatch a navigation action
// against an uninitialised router state, producing the
// "Cannot read properties of undefined (reading 'payload')" TypeError in core.js.
const RequirePermission = ({ permission, children }: { permission: string; children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!hasPermission(user as any, permission)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const RequireAnyPermission = ({ permissions, children }: { permissions: string[]; children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!hasAnyPermission(user as any, permissions)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default function AppContent() {
  // Monitor session for auto-logout
  useSessionMonitor();

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/resources" element={<Blog />} />
          <Route path="/blog" element={<Navigate to="/resources" replace />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/support-chat" element={<Navigate to="/account?tab=help-center" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Bot Marketplace Routes */}
          <Route path="/marketplace" element={<BotMarketplace />} />
          <Route path="/bots/:id" element={<BotDetail />} />

          {/* User Account Routes */}
          <Route path="/account" element={<Account />} />

          {/* Creator Routes - Bot Management */}
          <Route path="/creator" element={<CreatorLayout />}>
            <Route index element={<CreatorDashboard />} />
            <Route path="dashboard" element={<CreatorDashboard />} />
            <Route path="bots" element={<AdminMyBots />} />
            <Route path="bots/create" element={<BotBuilder />} />
            <Route path="bots/:id/edit" element={<BotBuilder />} />
            <Route path="bots/:id/analytics" element={<BotAnalytics />} />
            <Route path="conversations" element={<div className="p-8">Conversations coming soon</div>} />
            <Route path="analytics" element={<div className="p-8">Creator Analytics coming soon</div>} />
            <Route path="settings" element={<div className="p-8">Creator Settings coming soon</div>} />
          </Route>

          {/* Admin Routes - Platform Management */}
          <Route
            path="/admin"
            element={
              <RequireAnyPermission permissions={[
                'admin.access',
                'analytics.read',
                'support.manage',
                'users.read',
                'bots.manage',
                'products.manage',
              ]}>
                <AdminLayout />
              </RequireAnyPermission>
            }
          >
            <Route index element={<RequirePermission permission="analytics.read"><AdminDashboard /></RequirePermission>} />
            <Route path="bots" element={<RequirePermission permission="bots.manage"><BotsManagement /></RequirePermission>} />
            <Route path="bots/create" element={<RequirePermission permission="bots.manage"><BotBuilder /></RequirePermission>} />
            <Route path="bots/:id/analytics" element={<RequirePermission permission="analytics.read"><BotAnalytics /></RequirePermission>} />
            <Route path="users" element={<RequirePermission permission="users.read"><UsersManagement /></RequirePermission>} />
            <Route path="categories" element={<RequirePermission permission="bots.manage"><CategoriesManagement /></RequirePermission>} />
            <Route path="support-chat" element={<RequirePermission permission="support.manage"><AdminSupportChat /></RequirePermission>} />
            <Route path="audit-logs" element={<RequirePermission permission="system.manage"><AuditLogs /></RequirePermission>} />
            <Route path="revenue" element={<RequirePermission permission="analytics.read"><div className="p-8">Revenue Dashboard coming soon</div></RequirePermission>} />
            <Route path="analytics" element={<RequirePermission permission="analytics.read"><div className="p-8">Platform Analytics coming soon</div></RequirePermission>} />
            <Route path="settings" element={<RequirePermission permission="system.manage"><div className="p-8">Platform Settings coming soon</div></RequirePermission>} />
          </Route>

          {/* Legacy E-commerce Routes (Commented out - can be removed) */}
          {/* <Route path="/shop" element={<Shop />} /> */}
          {/* <Route path="/product/:id" element={<ProductDetails />} /> */}
          {/* <Route path="/cart" element={<Cart />} /> */}
          {/* <Route path="/checkout" element={<Checkout />} /> */}
          {/* <Route path="/order-success" element={<OrderSuccess />} /> */}

          {/* Catch-all 404 Route - MUST BE LAST */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

