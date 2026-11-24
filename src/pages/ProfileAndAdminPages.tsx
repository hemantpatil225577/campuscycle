import { useCallback, useEffect, useState } from 'react';
import { LogOut, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type {
  Branch,
  ImpactStats,
  ItemReport,
  ItemRequest,
  Profile,
  ResourceItem,
  Semester,
} from '../types/campuscycle';

export function ProfilePage() {
  const { user, setSession, logout, navigate, notify } = useApp();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [college, setCollege] = useState(user?.college || '');
  const [branch, setBranch] = useState<Branch>(user?.branch || 'CSE');
  const [semester, setSemester] = useState<Semester>(user?.semester || 3);
  const [contactDetails, setContactDetails] = useState(
    user?.contactDetails || ''
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setCollege(user.college);
      setBranch(user.branch);
      setSemester(user.semester);
      setContactDetails(user.contactDetails);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="sky-glass-canvas min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="sky-glass-panel rounded-2xl max-w-lg w-full p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">
            Sign in to view your profile
          </h1>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-5 px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/20 cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateProfile({
        fullName,
        college,
        branch,
        semester,
        contactDetails,
      });
      const { getAuthToken } = await import('../lib/api');
      setSession(getAuthToken(), res.profile);
      notify('success', 'Student profile updated.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sky-glass-canvas min-h-[calc(100vh-4rem)]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A]">
              Student Profile
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              Role: <span className="font-semibold text-[#0F172A]">{user.role}</span> ·{' '}
              {user.emailVerified ? 'College Email Verified' : 'Email Pending Verification'}
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-red-700 bg-red-50/90 hover:bg-red-100 border border-red-200 rounded-lg cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        <form
          onSubmit={handleSave}
          className="sky-glass-panel rounded-2xl p-6 space-y-4"
        >
          <div>
            <label
              htmlFor="profile-email"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Email (Read-Only)
            </label>
            <input
              id="profile-email"
              type="email"
              disabled
              value={user.email}
              className="w-full px-3.5 py-2.5 text-sm bg-sky-50/70 border border-sky-200/80 rounded-lg text-slate-500"
            />
          </div>

          <div>
            <label
              htmlFor="profile-fullname"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Full Name
            </label>
            <input
              id="profile-fullname"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white/85 border border-sky-200 rounded-lg focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label
              htmlFor="profile-college"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              College
            </label>
            <input
              id="profile-college"
              type="text"
              required
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white/85 border border-sky-200 rounded-lg focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="profile-branch"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Branch
              </label>
              <select
                id="profile-branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value as Branch)}
                className="w-full px-3 py-2.5 text-sm border border-sky-200 rounded-lg bg-white/85 focus:outline-none focus:border-sky-500"
              >
                {['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'Other'].map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="profile-semester"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Semester
              </label>
              <select
                id="profile-semester"
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value) as Semester)}
                className="w-full px-3 py-2.5 text-sm border border-sky-200 rounded-lg bg-white/85 focus:outline-none focus:border-sky-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="profile-contact"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Optional Campus Contact Details
            </label>
            <input
              id="profile-contact"
              type="text"
              value={contactDetails}
              onChange={(e) => setContactDetails(e.target.value)}
              placeholder="Hostel block, lab room, or phone extension"
              className="w-full px-3.5 py-2.5 text-sm bg-white/85 border border-sky-200 rounded-lg focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/20 sky-btn-lift cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminDashboardPage() {
  const { user, navigate, notify } = useApp();
  const [tab, setTab] = useState<'overview' | 'users' | 'items' | 'reports'>(
    'overview'
  );
  const [users, setUsers] = useState<Profile[]>([]);
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [reports, setReports] = useState<ItemReport[]>([]);
  const [impact, setImpact] = useState<ImpactStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmRemoveItem, setConfirmRemoveItem] =
    useState<ResourceItem | null>(null);

  const load = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    setLoading(true);
    try {
      const data = await api.getAdminOverview();
      setUsers(data.users);
      setItems(data.items);
      setRequests(data.requests);
      setReports(data.reports);
      setImpact(data.impact);
    } catch (err) {
      notify(
        'error',
        err instanceof Error ? err.message : 'Unable to load admin console.'
      );
    } finally {
      setLoading(false);
    }
  }, [user, notify]);

  useEffect(() => {
    load();
  }, [load]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="sky-glass-canvas min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="sky-glass-panel rounded-2xl max-w-lg w-full p-8 text-center space-y-4">
          <ShieldAlert className="h-10 w-10 text-red-600 mx-auto" />
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">
            Admin Access Restricted
          </h1>
          <p className="text-sm text-slate-600">
            This area is strictly reserved for CampusCycle administrators.
            Student accounts cannot view or mutate moderation records.
          </p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm font-semibold text-[#0F172A] bg-white/80 hover:bg-white border border-sky-200 hover:border-sky-400 rounded-lg cursor-pointer"
            >
              Back Home
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/20 cursor-pointer"
            >
              Admin Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  const toggleUserActive = async (target: Profile) => {
    try {
      const res = await api.adminUpdateUser(target.id, !target.isActive);
      setUsers((prev) =>
        prev.map((u) => (u.id === target.id ? res.user : u))
      );
      notify(
        'success',
        res.user.isActive ? 'Student reactivated.' : 'Student suspended.'
      );
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Action failed.');
    }
  };

  const moderateItem = async (
    item: ResourceItem,
    status: 'active' | 'flagged' | 'removed'
  ) => {
    try {
      const res = await api.adminModerateItem(item.id, status);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? res.item : i))
      );
      setConfirmRemoveItem(null);
      notify('success', `Listing marked "${status}".`);
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Moderation failed.');
    }
  };

  const resolveReport = async (
    report: ItemReport,
    status: 'Resolved' | 'Dismissed',
    removeItem = false
  ) => {
    try {
      await api.adminResolveReport(report.id, {
        status,
        adminNote: removeItem
          ? 'Removed listing following report review.'
          : `Marked ${status} by admin.`,
        removeItem,
      });
      await load();
      notify('success', `Report ${status.toLowerCase()}.`);
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Update failed.');
    }
  };

  return (
    <div className="sky-glass-canvas min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="sky-glass-panel rounded-2xl p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-sky-700">
              Role-Verified Admin Console
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-[#0F172A]">
              CampusCycle Administration
            </h1>
          </div>

          <div
            role="tablist"
            aria-label="Admin console sections"
            className="flex gap-1 p-1 bg-sky-100/80 border border-sky-200/75 rounded-lg overflow-x-auto"
          >
            {[
              { id: 'overview', label: 'Analytics & Activity' },
              { id: 'users', label: `Students (${users.length})` },
              { id: 'items', label: `Listings (${items.length})` },
              {
                id: 'reports',
                label: `Reports (${reports.filter((r) => r.status === 'Open').length} open)`,
              },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() =>
                  setTab(t.id as 'overview' | 'users' | 'items' | 'reports')
                }
                className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap cursor-pointer transition-all duration-150 ${
                  tab === t.id
                    ? 'bg-white text-[#0F172A] shadow-xs'
                    : 'text-slate-600 hover:text-sky-900 hover:bg-white/60'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="h-64 rounded-2xl bg-white/50 border border-sky-200/70 animate-pulse" />
        ) : (
          <>
            {tab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 sky-glass-tile rounded-2xl">
                    <p className="text-xs text-slate-600">Registered Accounts</p>
                    <p className="mt-1.5 font-mono text-2xl font-bold text-[#0F172A] tabular-nums">
                      {users.length}
                    </p>
                  </div>
                  <div className="p-5 sky-glass-tile rounded-2xl">
                    <p className="text-xs text-slate-600">Total Listings</p>
                    <p className="mt-1.5 font-mono text-2xl font-bold text-[#0F172A] tabular-nums">
                      {items.length}
                    </p>
                  </div>
                  <div className="p-5 sky-glass-tile rounded-2xl">
                    <p className="text-xs text-slate-600">Completed Exchanges</p>
                    <p className="mt-1.5 font-mono text-2xl font-bold text-sky-700 tabular-nums">
                      {impact?.completedExchanges ?? 0}
                    </p>
                  </div>
                  <div className="p-5 sky-glass-tile rounded-2xl">
                    <p className="text-xs text-slate-600">Open Reports</p>
                    <p className="mt-1.5 font-mono text-2xl font-bold text-red-700 tabular-nums">
                      {reports.filter((r) => r.status === 'Open').length}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-8 sky-glass-panel rounded-2xl p-6">
                    <h2 className="font-display text-lg font-bold text-[#0F172A]">
                      Platform Transaction Activity
                    </h2>
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-sky-200/80 text-slate-600">
                          <tr>
                            <th className="py-2.5 pr-4">Item</th>
                            <th className="py-2.5 pr-4">Owner</th>
                            <th className="py-2.5 pr-4">Borrower</th>
                            <th className="py-2.5 pr-4">Status</th>
                            <th className="py-2.5 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-sky-200/55">
                          {requests.map((r) => (
                            <tr key={r.id} className="hover:bg-sky-100/50 transition-colors duration-150">
                              <td className="py-3 pr-4 font-medium text-[#0F172A]">
                                {r.itemTitle}
                              </td>
                              <td className="py-3 pr-4 text-slate-600">
                                {r.ownerName}
                              </td>
                              <td className="py-3 pr-4 text-slate-600">
                                {r.borrowerName}
                              </td>
                              <td className="py-3 pr-4 font-semibold text-sky-900">
                                {r.status}
                              </td>
                              <td className="py-3 text-right font-mono tabular-nums">
                                ₹{r.itemPrice}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="lg:col-span-4 sky-glass-panel rounded-2xl p-6 space-y-4">
                    <h2 className="font-display text-lg font-bold text-[#0F172A]">
                      Listings by Branch
                    </h2>
                    <div className="space-y-3">
                      {(['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'Other'] as const).map(
                        (b) => {
                          const count = items.filter((i) => i.branch === b).length;
                          const pct = items.length
                            ? Math.round((count / items.length) * 100)
                            : 0;
                          return (
                            <div key={b} className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="font-medium text-[#0F172A]">
                                  {b}
                                </span>
                                <span className="font-mono text-slate-600 tabular-nums">
                                  {count} ({pct}%)
                                </span>
                              </div>
                              <div className="h-2 bg-sky-100/90 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-sky-500 to-sky-600"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'users' && (
              <div className="sky-glass-panel rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-sky-50/75 border-b border-sky-200/80 text-slate-600">
                      <tr>
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Branch & Sem</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sky-200/55">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-sky-100/50 transition-colors duration-150">
                          <td className="p-4 font-semibold text-[#0F172A]">
                            {u.fullName}
                          </td>
                          <td className="p-4 text-slate-600">{u.email}</td>
                          <td className="p-4 text-slate-600">
                            {u.branch} · Sem {u.semester}
                          </td>
                          <td className="p-4 font-mono">{u.role}</td>
                          <td className="p-4 font-semibold">
                            <span
                              className={
                                u.isActive ? 'text-emerald-700' : 'text-red-700'
                              }
                            >
                              {u.isActive ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {u.id !== user.id && (
                              <button
                                type="button"
                                onClick={() => toggleUserActive(u)}
                                className="px-3 py-1.5 text-xs font-semibold bg-white/80 hover:border-sky-400 border border-sky-200 rounded-lg hover:bg-white sky-btn-lift cursor-pointer"
                              >
                                {u.isActive ? 'Suspend' : 'Activate'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'items' && (
              <div className="sky-glass-panel rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-sky-50/75 border-b border-sky-200/80 text-slate-600">
                      <tr>
                        <th className="p-4">Listing</th>
                        <th className="p-4">Owner</th>
                        <th className="p-4">Branch / Sem</th>
                        <th className="p-4">Moderation</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sky-200/55">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-sky-100/50 transition-colors duration-150">
                          <td className="p-4 font-semibold text-[#0F172A]">
                            {item.title}
                          </td>
                          <td className="p-4 text-slate-600">{item.ownerName}</td>
                          <td className="p-4 text-slate-600">
                            {item.branch} · Sem {item.semester}
                          </td>
                          <td className="p-4 font-semibold">
                            {item.moderationStatus}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            {item.moderationStatus !== 'active' && (
                              <button
                                type="button"
                                onClick={() => moderateItem(item, 'active')}
                                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-white/75 hover:bg-emerald-50 border border-emerald-200 rounded-md transition-colors cursor-pointer"
                              >
                                Restore
                              </button>
                            )}
                            {item.moderationStatus !== 'removed' && (
                              <button
                                type="button"
                                onClick={() => setConfirmRemoveItem(item)}
                                className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-white/75 hover:bg-red-50 border border-red-200 rounded-md transition-colors cursor-pointer"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'reports' && (
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <div className="sky-glass-panel rounded-2xl p-10 text-center text-sm text-slate-600">
                    No reports submitted.
                  </div>
                ) : (
                  reports.map((rep) => (
                    <div
                      key={rep.id}
                      className="sky-glass-panel-interactive rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <p className="text-xs text-slate-600">
                          Status:{' '}
                          <span className="font-semibold text-[#0F172A]">
                            {rep.status}
                          </span>{' '}
                          · Reported by {rep.reporterName}
                        </p>
                        <h3 className="font-display text-base font-bold text-[#0F172A]">
                          {rep.itemTitle} — {rep.reason}
                        </h3>
                        <p className="text-xs text-slate-600">
                          {rep.details || 'No additional details.'}
                        </p>
                      </div>

                      {rep.status === 'Open' && (
                        <div className="flex flex-wrap gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => resolveReport(rep, 'Dismissed', false)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white/80 hover:bg-white hover:border-sky-400 border border-sky-200 rounded-lg sky-btn-lift cursor-pointer"
                          >
                            Dismiss
                          </button>
                          <button
                            type="button"
                            onClick={() => resolveReport(rep, 'Resolved', true)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg sky-btn-lift cursor-pointer"
                          >
                            Remove Listing & Resolve
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        <ConfirmDialog
          open={Boolean(confirmRemoveItem)}
          title="Remove Listing"
          description={`Remove "${confirmRemoveItem?.title}" from public catalog visibility?`}
          confirmLabel="Remove Listing"
          tone="danger"
          onConfirm={() =>
            confirmRemoveItem && moderateItem(confirmRemoveItem, 'removed')
          }
          onCancel={() => setConfirmRemoveItem(null)}
        />
      </div>
    </div>
  );
}

export function NotFoundPage() {
  const { navigate } = useApp();
  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="sky-glass-panel rounded-2xl p-10 text-center space-y-4">
        <p className="font-mono text-sm font-semibold text-sky-700">404</p>
        <h1 className="font-display text-3xl font-bold text-[#0F172A]">
          Page Not Found
        </h1>
        <p className="text-sm text-slate-600">
          The resource or page you requested could not be found on CampusCycle.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/20 cursor-pointer"
          >
            Go Home
          </button>
          <button
            type="button"
            onClick={() => navigate('/catalog')}
            className="px-5 py-2.5 text-sm font-semibold text-[#0F172A] bg-white/80 hover:bg-white border border-sky-200 hover:border-sky-400 rounded-lg cursor-pointer"
          >
            Browse Catalog
          </button>
        </div>
      </div>
    </div>
  );
}
