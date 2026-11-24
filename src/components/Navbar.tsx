import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Navbar() {
  const { path, navigate, user } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const basePath = path.split('?')[0];

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/catalog', label: 'Browse Catalog' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/handovers', label: 'Handover Tracker' },
    { to: '/items/new', label: 'List an Item' },
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  const go = (to: string) => {
    setMobileOpen(false);
    navigate(to);
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-sky-50/75 border-b border-sky-200/80 shadow-[0_4px_20px_-8px_rgba(2,132,199,0.12)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line brand wordmark */}
        <button
          type="button"
          onClick={() => go('/')}
          className="font-display text-xl font-bold tracking-tight text-[#0F172A] hover:text-sky-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-sm"
        >
          CampusCycle
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="Main navigation"
          className="hidden md:flex items-center gap-6"
        >
          {navLinks.map((link) => {
            const active =
              link.to === '/'
                ? basePath === '/'
                : basePath.startsWith(link.to);
            return (
              <button
                key={link.to}
                type="button"
                onClick={() => go(link.to)}
                data-active={active}
                aria-current={active ? 'page' : undefined}
                className={`sky-nav-link py-5 text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-sm ${
                  active
                    ? 'text-[#0F172A]'
                    : 'text-slate-600 hover:text-sky-800'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <button
              type="button"
              onClick={() => go('/profile')}
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-semibold text-white rounded-lg bg-sky-700 hover:bg-sky-800 shadow-sm shadow-sky-700/20 sky-btn-lift whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2"
            >
              {user.role === 'admin'
                ? `${user.fullName.split(' ')[0]} · Admin`
                : user.fullName.split(' ')[0]}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => go('/login')}
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-semibold text-white rounded-lg bg-sky-600 hover:bg-sky-700 shadow-sm shadow-sky-600/20 sky-btn-lift whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2"
            >
              Sign In
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-menu"
            className="md:hidden p-2 text-slate-700 hover:bg-sky-100/80 hover:text-sky-900 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          id="mobile-nav-menu"
          className="md:hidden border-t border-sky-200/80 bg-sky-50/95 backdrop-blur-xl px-4 py-3 space-y-1"
        >
          {navLinks.map((link) => {
            const active =
              link.to === '/'
                ? basePath === '/'
                : basePath.startsWith(link.to);
            return (
              <button
                key={link.to}
                type="button"
                onClick={() => go(link.to)}
                aria-current={active ? 'page' : undefined}
                className={`block w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 cursor-pointer ${
                  active
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-700 hover:bg-sky-100/80 hover:text-sky-900 hover:translate-x-0.5'
                }`}
              >
                {link.label}
              </button>
            );
          })}
          <div className="pt-2 border-t border-sky-200/60">
            {user ? (
              <button
                type="button"
                onClick={() => go('/profile')}
                className="block w-full text-left px-3 py-2.5 text-sm font-semibold text-[#0F172A] hover:bg-sky-100/80 rounded-lg transition-colors cursor-pointer"
              >
                Profile ({user.fullName})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => go('/login')}
                className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg sky-btn-lift cursor-pointer"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
