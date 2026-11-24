/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ItemDetailsPage } from './pages/ItemDetailsPage';
import { ItemFormPage } from './pages/ItemFormPage';
import {
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
} from './pages/AuthPages';
import {
  DashboardPage,
  IncomingRequestsPage,
  MyListingsPage,
  MyRequestsPage,
} from './pages/DashboardPages';
import {
  HandoverTrackerPage,
  PickupCoordinationPage,
} from './pages/CoordinationPages';
import {
  AdminDashboardPage,
  NotFoundPage,
  ProfilePage,
} from './pages/ProfileAndAdminPages';

function CampusCycleShell() {
  const { path, authReady, toasts, dismissToast } = useApp();
  const basePath = path.split('?')[0];

  const renderRoute = () => {
    if (!authReady && !['/', '/catalog'].includes(basePath)) {
      return (
        <div className="max-w-5xl mx-auto px-4 py-16">
          <div className="h-64 rounded-2xl bg-white/55 border border-sky-200/75 animate-pulse" />
        </div>
      );
    }

    if (basePath === '/') return <HomePage />;
    if (basePath === '/login') return <LoginPage />;
    if (basePath === '/register') return <RegisterPage />;
    if (basePath === '/reset-password') return <ResetPasswordPage />;
    if (basePath === '/catalog') return <CatalogPage />;
    if (basePath === '/items/new') return <ItemFormPage />;
    if (basePath === '/dashboard') return <DashboardPage />;
    if (basePath === '/my-listings') return <MyListingsPage />;
    if (basePath === '/my-requests') return <MyRequestsPage />;
    if (basePath === '/incoming-requests') return <IncomingRequestsPage />;
    if (basePath === '/pickups') return <PickupCoordinationPage />;
    if (basePath === '/handovers') return <HandoverTrackerPage />;
    if (basePath === '/profile') return <ProfilePage />;
    if (basePath === '/admin') return <AdminDashboardPage />;

    const editMatch = basePath.match(/^\/items\/([^/]+)\/edit$/);
    if (editMatch) return <ItemFormPage editItemId={editMatch[1]} />;

    const detailMatch = basePath.match(/^\/items\/([^/]+)$/);
    if (detailMatch) return <ItemDetailsPage itemId={detailMatch[1]} />;

    return <NotFoundPage />;
  };

  return (
    <div className="min-h-screen flex flex-col sky-glass-canvas text-[#0F172A]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-white focus:bg-sky-700 focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {renderRoute()}
      </main>

      <Footer />

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className={`px-4 py-3 rounded-xl shadow-lg backdrop-blur-xl border text-xs font-medium flex items-center justify-between gap-3 ${
                t.type === 'error'
                  ? 'bg-red-950/90 text-white border-red-700/80'
                  : t.type === 'success'
                    ? 'bg-sky-950/90 text-white border-sky-400/50'
                    : 'bg-slate-900/90 text-white border-sky-300/30'
              }`}
            >
              <span>{t.message}</span>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="Dismiss notification"
                className="text-white/75 hover:text-white cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <CampusCycleShell />
    </AppProvider>
  );
}
