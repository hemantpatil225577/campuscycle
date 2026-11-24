import { useApp } from '../context/AppContext';

export function Footer() {
  const { navigate } = useApp();

  return (
    <footer className="bg-sky-100/55 backdrop-blur-xl border-t border-sky-200/80 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-2">
            <p className="font-display text-lg font-bold text-[#0F172A]">
              CampusCycle
            </p>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed">
              A college-only peer-to-peer academic resource exchange platform
              helping students save money and reduce textbook and lab-gear waste
              across batches.
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold text-[#0F172A]">Marketplace</p>
            <ul className="space-y-1.5 text-slate-600">
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/catalog')}
                  className="hover:text-sky-700 hover:translate-x-0.5 hover:underline underline-offset-4 transition-all duration-150 cursor-pointer"
                >
                  Browse Resources
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/items/new')}
                  className="hover:text-sky-700 hover:translate-x-0.5 hover:underline underline-offset-4 transition-all duration-150 cursor-pointer"
                >
                  List an Item
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/pickups')}
                  className="hover:text-sky-700 hover:translate-x-0.5 hover:underline underline-offset-4 transition-all duration-150 cursor-pointer"
                >
                  Pickup Coordination
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/handovers')}
                  className="hover:text-sky-700 hover:translate-x-0.5 hover:underline underline-offset-4 transition-all duration-150 cursor-pointer"
                >
                  Handover Tracker
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold text-[#0F172A]">Account &amp; Admin</p>
            <ul className="space-y-1.5 text-slate-600">
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="hover:text-sky-700 hover:translate-x-0.5 hover:underline underline-offset-4 transition-all duration-150 cursor-pointer"
                >
                  Student Dashboard
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/my-listings')}
                  className="hover:text-sky-700 hover:translate-x-0.5 hover:underline underline-offset-4 transition-all duration-150 cursor-pointer"
                >
                  My Listings
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="hover:text-sky-700 hover:translate-x-0.5 hover:underline underline-offset-4 transition-all duration-150 cursor-pointer"
                >
                  Profile Settings
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="hover:text-sky-700 hover:translate-x-0.5 hover:underline underline-offset-4 transition-all duration-150 cursor-pointer"
                >
                  Admin Console
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-sky-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
          <p>
            CampusCycle Sustainability Notice: Reported student savings are
            estimates calculated from recorded listing retail prices minus
            exchange amounts, not verified financial outcomes.
          </p>
          <p className="shrink-0">© {new Date().getFullYear()} CampusCycle</p>
        </div>
      </div>
    </footer>
  );
}
