import { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Edit3,
  Inbox,
  LayoutDashboard,
  Leaf,
  MapPin,
  Package,
  Plus,
  Search,
  Send,
  Settings,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { ResourceImage } from '../components/ResourceImage';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type {
  ImpactStats,
  ItemRequest,
  ResourceItem,
} from '../types/campuscycle';

function RequireAuthNotice() {
  const { navigate, signInWithGoogle, notify } = useApp();
  const [signingIn, setSigningIn] = useState(false);
  const [impact, setImpact] = useState<ImpactStats | null>(null);
  const [sampleItems, setSampleItems] = useState<ResourceItem[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([api.getImpact(), api.listItems({ sort: 'newest' })])
      .then(([impRes, itemsRes]) => {
        if (!active) return;
        setImpact(impRes);
        setSampleItems(itemsRes.items.slice(0, 3));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const handleQuickGoogle = async () => {
    setSigningIn(true);
    try {
      const profile = await signInWithGoogle();
      if (profile) {
        if (!profile.isOnboarded) {
          notify('success', 'Signed in! Confirm your branch and semester.');
          navigate('/profile');
        } else {
          notify('success', `Welcome back, ${profile.fullName}`);
        }
      }
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="sky-glass-canvas min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Top Glass Hero Split */}
        <div className="sky-glass-hero rounded-2xl p-7 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-sky-700">
                CampusCycle Student Workspace
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#0F172A] leading-tight text-balance">
                Your campus exchange cockpit for textbooks, pickups, and savings.
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                Sign in with your verified Google account to track active
                listings, respond to incoming borrower requests, schedule
                library or canteen pickups, and confirm handovers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={signingIn}
                onClick={handleQuickGoogle}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/20 sky-btn-lift cursor-pointer disabled:opacity-50"
              >
                {signingIn ? 'Signing In...' : 'Continue with Google'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 text-sm font-semibold text-[#0F172A] bg-white/85 hover:bg-white border border-sky-200 hover:border-sky-400 rounded-lg sky-btn-lift cursor-pointer"
              >
                Email &amp; Password
              </button>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="px-4 py-2.5 text-sm font-medium text-sky-800 hover:text-sky-950 hover:translate-x-0.5 transition-all duration-150 cursor-pointer"
              >
                Create Account →
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 sky-glass-subtle rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3 text-xs text-slate-600">
              <p className="font-display text-sm font-bold text-[#0F172A]">
                What&apos;s Inside Your Workspace
              </p>
              <div className="space-y-2.5 leading-relaxed">
                <p>• Persistent listings synced across devices &amp; sessions</p>
                <p>• Atomic reservation locks preventing double-booking</p>
                <p>• Shared campus pickup hub scheduling &amp; notes</p>
                <p>• Dual-confirmed handover stage timeline</p>
                <p>• Personal reuse &amp; semester savings ledger</p>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Column Real Campus Impact Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sky-glass-tile rounded-2xl p-5">
            <p className="text-xs text-slate-600">Active Campus Listings</p>
            <p className="mt-2 font-mono text-2xl font-bold text-[#0F172A] tabular-nums">
              {impact ? impact.activeListings : '—'}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Across CSE, IT, ECE, ME &amp; CE
            </p>
          </div>
          <div className="sky-glass-tile rounded-2xl p-5">
            <p className="text-xs text-slate-600">Completed Exchanges</p>
            <p className="mt-2 font-mono text-2xl font-bold text-[#0F172A] tabular-nums">
              {impact ? impact.completedExchanges : '—'}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Dual-confirmed handovers
            </p>
          </div>
          <div className="sky-glass-tile rounded-2xl p-5">
            <p className="text-xs text-slate-600">Resources Reused</p>
            <p className="mt-2 font-mono text-2xl font-bold text-[#0F172A] tabular-nums">
              {impact ? impact.resourcesReused : '—'}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Kept circulating on campus
            </p>
          </div>
          <div className="sky-glass-tile rounded-2xl p-5">
            <p className="text-xs text-slate-600">Est. Student Savings</p>
            <p className="mt-2 font-mono text-2xl font-bold text-sky-700 tabular-nums">
              {impact
                ? `₹${impact.estimatedSavingsInr.toLocaleString('en-IN')}`
                : '—'}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Vs retail reference prices
            </p>
          </div>
        </div>

        {/* Recent Campus Shelf Preview */}
        {sampleItems.length > 0 && (
          <div className="sky-glass-panel rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-sky-200/75 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-base font-bold text-[#0F172A]">
                  Recently Shared on Campus
                </h2>
                <p className="text-xs text-slate-600">
                  Live textbooks and lab gear available right now.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/catalog')}
                className="text-xs font-semibold text-sky-700 hover:underline cursor-pointer whitespace-nowrap"
              >
                Open full catalog →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-sky-200/60">
              {sampleItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/items/${item.id}`)}
                  className="group p-5 text-left hover:bg-sky-100/55 transition-colors duration-150 flex items-center gap-3.5 cursor-pointer"
                >
                  <div className="h-14 w-16 rounded-xl overflow-hidden border border-sky-200/80 bg-white/75 shrink-0">
                    <ResourceImage
                      src={item.imageUrl}
                      alt={item.title}
                      category={item.category}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-500 truncate">
                      {item.branch} · Sem {item.semester} · {item.condition}
                    </p>
                    <p className="font-display text-sm font-bold text-[#0F172A] group-hover:text-sky-700 transition-colors truncate">
                      {item.title}
                    </p>
                    <p className="font-mono text-xs font-semibold text-sky-700 tabular-nums">
                      {item.exchangeType === 'Donate'
                        ? 'Free Donation'
                        : `₹${item.price}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user, navigate, notify } = useApp();
  const [myItems, setMyItems] = useState<ResourceItem[]>([]);
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pipelineTab, setPipelineTab] = useState<
    'action' | 'pickups' | 'completed'
  >('action');
  const [queueSearch, setQueueSearch] = useState('');
  const [busyReqId, setBusyReqId] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [itemsRes, reqRes] = await Promise.all([
        api.listItems({ ownerId: user.id }),
        api.listRequests('all'),
      ]);
      setMyItems(itemsRes.items);
      setRequests(reqRes.requests);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (!user) return <RequireAuthNotice />;

  const activeListings = myItems.filter((i) => i.isAvailable).length;
  const incomingPending = requests.filter(
    (r) => r.ownerId === user.id && r.status === 'Requested'
  );
  const outgoingActive = requests.filter(
    (r) =>
      r.borrowerId === user.id &&
      [
        'Requested',
        'Accepted',
        'Reserved',
        'Pickup Scheduled',
        'Handed Over',
      ].includes(r.status)
  );
  const pendingPickups = requests.filter((r) =>
    ['Reserved', 'Accepted', 'Pickup Scheduled', 'Handed Over'].includes(
      r.status
    )
  );
  const completedExchanges = requests.filter((r) => r.status === 'Completed');

  const estimatedMoneySaved = completedExchanges.reduce(
    (acc, r) => acc + Math.max(0, r.itemEstimatedRetailPrice - r.itemPrice),
    0
  );
  const retailBaselineTotal = completedExchanges.reduce(
    (acc, r) => acc + r.itemEstimatedRetailPrice,
    0
  );
  const exchangePaidTotal = completedExchanges.reduce(
    (acc, r) => acc + r.itemPrice,
    0
  );
  const savingsRatio =
    retailBaselineTotal > 0
      ? Math.round((estimatedMoneySaved / retailBaselineTotal) * 100)
      : 0;

  // Stage counts for visual Exchange Pipeline Breakdown
  const stageTotal = Math.max(1, requests.length);
  const stageRows = [
    {
      label: 'Requested / Awaiting Review',
      count: requests.filter((r) => r.status === 'Requested').length,
      barClass: 'bg-amber-500',
    },
    {
      label: 'Reserved & Pickup Scheduled',
      count: requests.filter((r) =>
        ['Accepted', 'Reserved', 'Pickup Scheduled'].includes(r.status)
      ).length,
      barClass: 'bg-sky-600',
    },
    {
      label: 'Handed Over (Awaiting Receipt)',
      count: requests.filter((r) => r.status === 'Handed Over').length,
      barClass: 'bg-cyan-600',
    },
    {
      label: 'Completed Exchanges',
      count: completedExchanges.length,
      barClass: 'bg-emerald-600',
    },
  ];

  // Items needing immediate user action
  const actionQueue = requests.filter((r) => {
    const isIncomingReq = r.ownerId === user.id && r.status === 'Requested';
    const isOutgoingWaiting =
      r.borrowerId === user.id && r.status === 'Requested';
    const needsPickup =
      ['Accepted', 'Reserved'].includes(r.status) && !r.pickup;
    const needsMyConfirm =
      ['Pickup Scheduled', 'Handed Over'].includes(r.status) &&
      ((r.ownerId === user.id && !r.handover?.ownerConfirmed) ||
        (r.borrowerId === user.id && !r.handover?.borrowerConfirmed));
    return isIncomingReq || isOutgoingWaiting || needsPickup || needsMyConfirm;
  });

  const nextScheduledPickup = requests.find(
    (r) =>
      r.pickup &&
      ['Reserved', 'Accepted', 'Pickup Scheduled', 'Handed Over'].includes(
        r.status
      )
  );

  const handleQuickDecision = async (
    reqId: string,
    action: 'accept' | 'reject'
  ) => {
    setBusyReqId(reqId);
    try {
      await api.actOnRequest(reqId, action);
      await loadDashboard();
      notify(
        'success',
        action === 'accept'
          ? 'Request accepted and item reserved!'
          : 'Request declined.'
      );
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusyReqId(null);
    }
  };

  const handleQuickConfirm = async (reqId: string) => {
    setBusyReqId(reqId);
    try {
      const res = await api.confirmHandover(reqId);
      await loadDashboard();
      notify(
        'success',
        res.request.status === 'Completed'
          ? 'Both parties confirmed — exchange marked Completed!'
          : 'Your handover confirmation is saved.'
      );
    } catch (err) {
      notify(
        'error',
        err instanceof Error ? err.message : 'Confirmation failed.'
      );
    } finally {
      setBusyReqId(null);
    }
  };

  const handleToggleItemAvailability = async (item: ResourceItem) => {
    setBusyItemId(item.id);
    try {
      const res = await api.updateItem(item.id, {
        isAvailable: !item.isAvailable,
      });
      setMyItems((prev) =>
        prev.map((x) => (x.id === item.id ? res.item : x))
      );
      notify(
        'success',
        res.item.isAvailable
          ? `"${item.title}" is now available.`
          : `"${item.title}" marked paused.`
      );
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setBusyItemId(null);
    }
  };

  const initials = user.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');

  const railLinks = [
    {
      label: 'Overview',
      to: '/dashboard',
      count: undefined,
      icon: LayoutDashboard,
      active: true,
    },
    {
      label: 'My Listings',
      to: '/my-listings',
      count: myItems.length,
      icon: Package,
      active: false,
    },
    {
      label: 'Incoming Requests',
      to: '/incoming-requests',
      count: incomingPending.length,
      icon: Inbox,
      active: false,
    },
    {
      label: 'My Requests',
      to: '/my-requests',
      count: outgoingActive.length,
      icon: Send,
      active: false,
    },
    {
      label: 'Pickup Schedule',
      to: '/pickups',
      count: pendingPickups.length,
      icon: MapPin,
      active: false,
    },
    {
      label: 'Handover Tracker',
      to: '/handovers',
      count: completedExchanges.length,
      icon: CheckCircle2,
      active: false,
    },
    {
      label: 'Profile Settings',
      to: '/profile',
      count: undefined,
      icon: Settings,
      active: false,
    },
  ];

  const basePipelineList =
    pipelineTab === 'action'
      ? actionQueue
      : pipelineTab === 'pickups'
        ? pendingPickups
        : completedExchanges;

  const trimmedQuery = queueSearch.trim().toLowerCase();
  const pipelineList = trimmedQuery
    ? basePipelineList.filter(
        (r) =>
          r.itemTitle.toLowerCase().includes(trimmedQuery) ||
          r.ownerName.toLowerCase().includes(trimmedQuery) ||
          r.borrowerName.toLowerCase().includes(trimmedQuery)
      )
    : basePipelineList;

  const firstName = user.fullName.split(' ')[0] || user.fullName;

  const priorityHeadline =
    incomingPending.length > 0
      ? `${incomingPending.length} incoming request${incomingPending.length > 1 ? 's' : ''} awaiting your response`
      : nextScheduledPickup?.pickup
        ? `Next pickup: ${nextScheduledPickup.pickup.pickupPoint} on ${nextScheduledPickup.pickup.pickupDate} at ${nextScheduledPickup.pickup.pickupTime}`
        : actionQueue.length > 0
          ? `${actionQueue.length} exchange step${actionQueue.length > 1 ? 's' : ''} waiting in your queue`
          : 'Your shelf is clear and ready for new campus exchanges';

  return (
    <div className="sky-glass-canvas min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Left Workspace Rail */}
          <aside className="lg:col-span-3 lg:sticky lg:top-24 space-y-5">
            {/* Student Identity Block */}
            <div className="sky-glass-panel rounded-2xl p-5">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-white font-display font-bold text-sm flex items-center justify-center shrink-0 shadow-sm shadow-sky-600/25">
                  {initials || 'CC'}
                </div>
                <div className="min-w-0">
                  <p className="font-display text-base font-bold text-[#0F172A] truncate">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-slate-600 truncate">
                    {user.branch} · Semester {user.semester}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3.5 border-t border-sky-200/70 text-xs text-slate-600 space-y-1">
                <p className="truncate font-medium text-[#0F172A]">
                  {user.college}
                </p>
                <p className="text-sky-700 font-medium">
                  {user.emailVerified
                    ? 'Verified Campus Email'
                    : 'Email Unverified'}
                </p>
              </div>
            </div>

            {/* Workspace Navigation */}
            <nav
              aria-label="Dashboard sections"
              className="sky-glass-panel rounded-2xl p-2 space-y-0.5"
            >
              {railLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => navigate(item.to)}
                    className={`group w-full px-3 py-2.5 text-left text-sm font-medium rounded-xl transition-all duration-150 flex items-center justify-between gap-2 cursor-pointer ${
                      item.active
                        ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/25'
                        : 'text-slate-700 hover:text-[#0F172A] hover:bg-sky-100/80 hover:translate-x-0.5'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          item.active
                            ? 'text-sky-100'
                            : 'text-sky-600/80 group-hover:text-sky-700'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {typeof item.count === 'number' && (
                      <span
                        className={`font-mono text-xs tabular-nums ${
                          item.active ? 'text-sky-100' : 'text-sky-800/80'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>



            {/* Compact Sustainability Summary */}
            <div className="sky-glass-panel rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-700">
                <Leaf className="h-4 w-4 text-emerald-600" />
                <span>Your Reuse Impact</span>
              </div>
              <p className="font-mono text-2xl font-bold text-[#0F172A] tabular-nums">
                ₹{estimatedMoneySaved.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Estimated savings across{' '}
                <span className="font-mono font-semibold text-[#0F172A]">
                  {completedExchanges.length}
                </span>{' '}
                completed campus exchanges.
              </p>
            </div>
          </aside>

          {/* Main Dashboard Viewport */}
          <div className="lg:col-span-9 space-y-6">
            {/* Luminous Glass Workspace Hero Header */}
            <div className="sky-glass-hero rounded-2xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-sky-700">
                    Student Exchange Workspace · {user.branch} Semester{' '}
                    {user.semester}
                  </p>
                  <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#0F172A] text-balance">
                    Welcome back, {firstName}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate('/catalog')}
                    className="px-4 py-2.5 text-sm font-semibold text-[#0F172A] bg-white/80 hover:bg-white border border-sky-200 hover:border-sky-400 rounded-lg sky-btn-lift cursor-pointer whitespace-nowrap"
                  >
                    Browse Catalog
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/items/new')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/20 sky-btn-lift cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4" />
                    <span>List an Item</span>
                  </button>
                </div>
              </div>

              {/* Priority Focus Strip */}
              <div className="pt-4 border-t border-sky-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                  <span className="font-medium">{priorityHeadline}</span>
                </div>
                {incomingPending.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => navigate('/incoming-requests')}
                    className="font-semibold text-sky-700 hover:underline self-start sm:self-auto cursor-pointer whitespace-nowrap"
                  >
                    Review requests →
                  </button>
                ) : nextScheduledPickup ? (
                  <button
                    type="button"
                    onClick={() => navigate('/pickups')}
                    className="font-semibold text-sky-700 hover:underline self-start sm:self-auto cursor-pointer whitespace-nowrap"
                  >
                    View pickup plan →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/handovers')}
                    className="font-semibold text-sky-700 hover:underline self-start sm:self-auto cursor-pointer whitespace-nowrap"
                  >
                    Open handover tracker →
                  </button>
                )}
              </div>
            </div>

            {/* 4-Column Frosted Glass KPI Strip */}
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="h-32 rounded-2xl bg-white/50 border border-sky-200/70 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/my-listings')}
                  className="group text-left p-5 sky-glass-tile rounded-2xl cursor-pointer flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-600 group-hover:text-sky-800 transition-colors">
                      Active Listings
                    </span>
                    <span className="h-8 w-8 rounded-lg bg-sky-100/85 border border-sky-200/80 flex items-center justify-center text-sky-700 group-hover:bg-sky-600 group-hover:text-white group-hover:border-sky-600 group-hover:scale-105 transition-all duration-150 shrink-0">
                      <BookOpen className="h-4 w-4" />
                    </span>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-[#0F172A] tabular-nums">
                      {activeListings}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {myItems.length} total on shelf
                    </p>
                  </div>
                  <div className="h-1 w-full bg-sky-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full"
                      style={{
                        width: `${myItems.length ? Math.round((activeListings / myItems.length) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/incoming-requests')}
                  className="group text-left p-5 sky-glass-tile rounded-2xl cursor-pointer flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-600 group-hover:text-sky-800 transition-colors">
                      Incoming Requests
                    </span>
                    <span className="h-8 w-8 rounded-lg bg-sky-100/85 border border-sky-200/80 flex items-center justify-center text-sky-700 group-hover:bg-sky-600 group-hover:text-white group-hover:border-sky-600 group-hover:scale-105 transition-all duration-150 shrink-0">
                      <Inbox className="h-4 w-4" />
                    </span>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-[#0F172A] tabular-nums">
                      {incomingPending.length}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {outgoingActive.length} outgoing active
                    </p>
                  </div>
                  <div className="h-1 w-full bg-sky-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{
                        width: `${incomingPending.length > 0 ? Math.min(100, incomingPending.length * 35) : 12}%`,
                      }}
                    />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/pickups')}
                  className="group text-left p-5 sky-glass-tile rounded-2xl cursor-pointer flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-600 group-hover:text-sky-800 transition-colors">
                      Pending Pickups
                    </span>
                    <span className="h-8 w-8 rounded-lg bg-sky-100/85 border border-sky-200/80 flex items-center justify-center text-sky-700 group-hover:bg-sky-600 group-hover:text-white group-hover:border-sky-600 group-hover:scale-105 transition-all duration-150 shrink-0">
                      <CalendarClock className="h-4 w-4" />
                    </span>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-[#0F172A] tabular-nums">
                      {pendingPickups.length}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      In pickup / handover
                    </p>
                  </div>
                  <div className="h-1 w-full bg-sky-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-600 rounded-full"
                      style={{
                        width: `${pendingPickups.length > 0 ? Math.min(100, pendingPickups.length * 40) : 12}%`,
                      }}
                    />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/handovers')}
                  className="group text-left p-5 sky-glass-tile rounded-2xl cursor-pointer flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-600 group-hover:text-sky-800 transition-colors">
                      Estimated Saved
                    </span>
                    <span className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 group-hover:scale-105 transition-all duration-150 shrink-0">
                      <Leaf className="h-4 w-4" />
                    </span>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-sky-700 tabular-nums">
                      ₹{estimatedMoneySaved.toLocaleString('en-IN')}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {completedExchanges.length} completed
                    </p>
                  </div>
                  <div className="h-1 w-full bg-sky-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full"
                      style={{ width: `${Math.max(10, savingsRatio)}%` }}
                    />
                  </div>
                </button>
              </div>
            )}

            {/* Middle Analytics Row: Exchange Stage Breakdown + Savings Ledger */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
              <div className="xl:col-span-7 sky-glass-panel rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-base font-bold text-[#0F172A]">
                      Exchange Pipeline Stages
                    </h2>
                    <p className="text-xs text-slate-600">
                      Live distribution across your active and completed
                      transactions.
                    </p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-sky-700 tabular-nums shrink-0">
                    {requests.length} total
                  </span>
                </div>

                <div className="space-y-2">
                  {stageRows.map((row) => {
                    const pct = requests.length
                      ? Math.round((row.count / stageTotal) * 100)
                      : 0;
                    return (
                      <div
                        key={row.label}
                        className="space-y-1.5 text-xs rounded-lg px-2 py-1.5 -mx-2 hover:bg-sky-50/85 transition-colors duration-150"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-700">
                            {row.label}
                          </span>
                          <span className="font-mono text-slate-600 tabular-nums">
                            {row.count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-sky-100/90 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${row.barClass}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="xl:col-span-5 sky-glass-panel rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-base font-bold text-[#0F172A]">
                      Savings Breakdown
                    </h2>
                    <p className="text-xs text-slate-600">
                      Completed peer exchanges vs retail price
                    </p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-sky-700 tabular-nums">
                    {savingsRatio}% est. saved
                  </span>
                </div>

                <div className="space-y-3">
                  <p className="font-mono text-3xl font-bold text-[#0F172A] tabular-nums">
                    ₹{estimatedMoneySaved.toLocaleString('en-IN')}
                  </p>
                  <div className="h-2.5 w-full bg-sky-100/90 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, savingsRatio)}%` }}
                    />
                  </div>
                  <div className="pt-1 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Retail Reference Value</span>
                      <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
                        ₹{retailBaselineTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>CampusCycle Exchange Cost</span>
                      <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
                        ₹{exchangePaidTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Estimates use recorded retail reference prices vs exchange
                  amounts on completed transactions.
                </p>
              </div>
            </div>

            {/* Bottom Two-Column Operational Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Left: Live Exchange Pipeline Queue */}
              <div className="xl:col-span-7 sky-glass-panel rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-sky-200/75 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="font-display text-base font-bold text-[#0F172A]">
                        Exchange Activity &amp; Action Queue
                      </h2>
                      <p className="text-xs text-slate-600">
                        Accept requests, schedule pickups, and confirm
                        handovers.
                      </p>
                    </div>

                    <div
                      role="tablist"
                      aria-label="Filter dashboard activity"
                      className="flex items-center gap-1 p-1 bg-sky-100/75 border border-sky-200/70 rounded-lg self-start"
                    >
                      {[
                        {
                          id: 'action',
                          label: `Action (${actionQueue.length})`,
                        },
                        {
                          id: 'pickups',
                          label: `Active (${pendingPickups.length})`,
                        },
                        {
                          id: 'completed',
                          label: `Done (${completedExchanges.length})`,
                        },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          role="tab"
                          aria-selected={pipelineTab === t.id}
                          onClick={() =>
                            setPipelineTab(
                              t.id as 'action' | 'pickups' | 'completed'
                            )
                          }
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md whitespace-nowrap cursor-pointer transition-colors ${
                            pipelineTab === t.id
                              ? 'bg-white text-[#0F172A] shadow-xs'
                              : 'text-slate-600 hover:text-sky-900'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Search Filter */}
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sky-700/70"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={queueSearch}
                      onChange={(e) => setQueueSearch(e.target.value)}
                      placeholder="Filter queue by item title or student name..."
                      aria-label="Filter exchange queue"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white/75 border border-sky-200/90 rounded-lg text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-sky-500"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="p-5 space-y-3">
                    {[1, 2].map((n) => (
                      <div
                        key={n}
                        className="h-24 rounded-xl bg-sky-100/60 animate-pulse"
                      />
                    ))}
                  </div>
                ) : pipelineList.length === 0 ? (
                  <div className="p-10 text-center space-y-3">
                    <p className="font-display text-base font-semibold text-[#0F172A]">
                      {trimmedQuery
                        ? 'No matching exchange items'
                        : pipelineTab === 'action'
                          ? 'You are all caught up'
                          : pipelineTab === 'pickups'
                            ? 'No active pickups scheduled'
                            : 'No completed exchanges yet'}
                    </p>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto">
                      {trimmedQuery
                        ? 'Try clearing your search filter or switching tabs.'
                        : 'Browse available textbooks and lab tools or list an item from your semester shelf to start an exchange.'}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        trimmedQuery ? setQueueSearch('') : navigate('/catalog')
                      }
                      className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg cursor-pointer"
                    >
                      {trimmedQuery ? 'Clear Filter' : 'Explore Catalog'}
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-sky-200/60">
                    {pipelineList.map((req) => {
                      const isOwner = req.ownerId === user.id;
                      const isBorrower = req.borrowerId === user.id;
                      const isBusy = busyReqId === req.id;
                      const needsMyConfirm =
                        ['Pickup Scheduled', 'Handed Over'].includes(
                          req.status
                        ) &&
                        ((isOwner && !req.handover?.ownerConfirmed) ||
                          (isBorrower && !req.handover?.borrowerConfirmed));

                      return (
                        <div
                          key={req.id}
                          className="p-5 hover:bg-sky-100/45 transition-colors duration-150 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3.5 min-w-0">
                              <div className="h-12 w-12 rounded-xl overflow-hidden border border-sky-200/80 bg-white/80 shrink-0">
                                <ResourceImage
                                  src={req.itemImageUrl}
                                  alt={req.itemTitle}
                                  category={req.itemCategory}
                                  className="h-full w-full object-cover"
                                />
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                                  <span
                                    className={`font-semibold ${
                                      req.status === 'Completed'
                                        ? 'text-emerald-700'
                                        : req.status === 'Requested'
                                          ? 'text-amber-700'
                                          : 'text-sky-800'
                                    }`}
                                  >
                                    {req.status}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span>
                                    {isOwner
                                      ? `Requested by ${req.borrowerName}`
                                      : `Owner: ${req.ownerName}`}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(`/items/${req.itemId}`)
                                  }
                                  className="mt-0.5 font-display text-sm font-bold text-[#0F172A] hover:text-sky-700 text-left cursor-pointer"
                                >
                                  {req.itemTitle}
                                </button>
                              </div>
                            </div>

                            <span className="font-mono text-xs font-semibold text-[#0F172A] tabular-nums shrink-0">
                              {req.itemExchangeType === 'Donate'
                                ? 'Free'
                                : `₹${req.itemPrice}`}
                            </span>
                          </div>

                          {req.pickup ? (
                            <p className="text-xs text-slate-600 flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                              <span>
                                {req.pickup.pickupPoint} ·{' '}
                                <span className="font-mono tabular-nums">
                                  {req.pickup.pickupDate}{' '}
                                  {req.pickup.pickupTime}
                                </span>
                              </span>
                            </p>
                          ) : (
                            <p className="text-xs text-slate-600 line-clamp-1">
                              &ldquo;{req.message}&rdquo;
                            </p>
                          )}

                          {req.handover &&
                            ['Pickup Scheduled', 'Handed Over', 'Completed'].includes(
                              req.status
                            ) && (
                              <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                                Owner:{' '}
                                <span
                                  className={
                                    req.handover.ownerConfirmed
                                      ? 'text-emerald-700 font-semibold'
                                      : 'text-slate-600'
                                  }
                                >
                                  {req.handover.ownerConfirmed
                                    ? 'Confirmed'
                                    : 'Pending'}
                                </span>{' '}
                                · Borrower:{' '}
                                <span
                                  className={
                                    req.handover.borrowerConfirmed
                                      ? 'text-emerald-700 font-semibold'
                                      : 'text-slate-600'
                                  }
                                >
                                  {req.handover.borrowerConfirmed
                                    ? 'Confirmed'
                                    : 'Pending'}
                                </span>
                              </p>
                            )}

                          {/* Inline Action Controls */}
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            {isOwner && req.status === 'Requested' && (
                              <>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() =>
                                    handleQuickDecision(req.id, 'accept')
                                  }
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg sky-btn-lift cursor-pointer disabled:opacity-50"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Accept &amp; Reserve</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() =>
                                    handleQuickDecision(req.id, 'reject')
                                  }
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50/90 hover:bg-red-100 border border-red-200/70 rounded-lg sky-btn-lift cursor-pointer disabled:opacity-50"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span>Decline</span>
                                </button>
                              </>
                            )}

                            {['Accepted', 'Reserved'].includes(req.status) && (
                              <button
                                type="button"
                                onClick={() => navigate('/pickups')}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg sky-btn-lift cursor-pointer"
                              >
                                Schedule Pickup
                              </button>
                            )}

                            {needsMyConfirm && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleQuickConfirm(req.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg sky-btn-lift cursor-pointer disabled:opacity-50"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>
                                  {isOwner
                                    ? 'Confirm Handed Over'
                                    : 'Confirm Received'}
                                </span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => navigate('/handovers')}
                              className="px-3 py-1.5 text-xs font-medium text-sky-800 hover:text-sky-950 hover:bg-sky-100/70 rounded-lg transition-colors cursor-pointer"
                            >
                              Timeline →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Upcoming Pickup Spotlight + My Listed Shelf */}
              <div className="xl:col-span-5 space-y-6">
                {nextScheduledPickup?.pickup && (
                  <div className="sky-glass-panel rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-sky-700">
                        <MapPin className="h-4 w-4" />
                        <span>Upcoming Campus Pickup</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/pickups')}
                        className="text-xs font-semibold text-sky-700 hover:underline cursor-pointer"
                      >
                        Manage →
                      </button>
                    </div>
                    <div>
                      <p className="font-display text-sm font-bold text-[#0F172A]">
                        {nextScheduledPickup.itemTitle}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {nextScheduledPickup.pickup.pickupPoint} ·{' '}
                        <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
                          {nextScheduledPickup.pickup.pickupDate} at{' '}
                          {nextScheduledPickup.pickup.pickupTime}
                        </span>
                      </p>
                      {nextScheduledPickup.pickup.instructions && (
                        <p className="mt-2 text-xs text-slate-600 sky-glass-subtle rounded-lg px-3 py-2">
                          &ldquo;{nextScheduledPickup.pickup.instructions}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="sky-glass-panel rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-sky-200/75 flex items-center justify-between">
                    <h2 className="font-display text-base font-bold text-[#0F172A]">
                      My Listed Shelf
                    </h2>
                    <button
                      type="button"
                      onClick={() => navigate('/my-listings')}
                      className="text-xs font-semibold text-sky-700 hover:underline cursor-pointer"
                    >
                      Manage all →
                    </button>
                  </div>

                  {loading ? (
                    <div className="p-5 space-y-3">
                      {[1, 2].map((n) => (
                        <div
                          key={n}
                          className="h-14 rounded-xl bg-sky-100/60 animate-pulse"
                        />
                      ))}
                    </div>
                  ) : myItems.length === 0 ? (
                    <div className="p-8 text-center space-y-3">
                      <p className="text-sm font-semibold text-[#0F172A]">
                        No items listed yet
                      </p>
                      <p className="text-xs text-slate-600">
                        Add unused textbooks, lab coats, or calculators for
                        juniors.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/items/new')}
                        className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg cursor-pointer"
                      >
                        List an Item
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-sky-200/60">
                      {myItems.slice(0, 4).map((item) => (
                        <div
                          key={item.id}
                          className="group p-4 flex items-center justify-between gap-3 hover:bg-sky-100/45 transition-colors duration-150"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-12 w-14 rounded-lg overflow-hidden border border-sky-200/80 bg-white/70 shrink-0">
                              <ResourceImage
                                src={item.imageUrl}
                                alt={item.title}
                                category={item.category}
                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                              />
                            </div>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => navigate(`/items/${item.id}`)}
                                className="text-xs font-semibold text-[#0F172A] hover:text-sky-700 truncate block text-left max-w-[180px] transition-colors cursor-pointer"
                              >
                                {item.title}
                              </button>
                              <p className="text-[11px] text-slate-600 font-mono tabular-nums">
                                {item.exchangeType === 'Donate'
                                  ? 'Donate'
                                  : `₹${item.price}`}{' '}
                                ·{' '}
                                <span
                                  className={
                                    item.isAvailable
                                      ? 'text-emerald-700 font-semibold'
                                      : 'text-amber-700 font-semibold'
                                  }
                                >
                                  {item.isAvailable ? 'Available' : 'Paused'}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={busyItemId === item.id}
                              onClick={() => handleToggleItemAvailability(item)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-sky-800 bg-white/75 hover:bg-white hover:border-sky-400 border border-sky-200 rounded-md transition-all duration-150 cursor-pointer disabled:opacity-50"
                            >
                              {item.isAvailable ? 'Pause' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/items/${item.id}/edit`)}
                              className="p-1.5 text-sky-700/75 hover:text-[#0F172A] hover:bg-sky-100/80 rounded-md transition-colors cursor-pointer"
                              aria-label={`Edit ${item.title}`}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MyListingsPage() {
  const { user, navigate, notify } = useApp();
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ResourceItem | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.listItems({ ownerId: user.id });
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (!user) return <RequireAuthNotice />;

  const toggleAvailability = async (item: ResourceItem) => {
    try {
      const res = await api.updateItem(item.id, {
        isAvailable: !item.isAvailable,
      });
      setItems((prev) =>
        prev.map((x) => (x.id === item.id ? res.item : x))
      );
      notify(
        'success',
        res.item.isAvailable ? 'Marked available.' : 'Marked unavailable.'
      );
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Update failed.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await api.deleteItem(deleteTarget.id);
      setItems((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      notify('success', 'Listing removed.');
      setDeleteTarget(null);
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sky-glass-canvas min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A]">
              My Listings
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Edit, mark unavailable, or remove resources you have listed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/items/new')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Item</span>
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-24 rounded-2xl bg-white/50 border border-sky-200/70 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="sky-glass-panel rounded-2xl p-12 text-center">
            <p className="font-display text-lg font-bold text-[#0F172A]">
              You haven&apos;t listed any items yet
            </p>
            <p className="mt-1 text-sm text-slate-600">
              List unused textbooks, lab coats, or calculators for your campus
              peers.
            </p>
            <button
              type="button"
              onClick={() => navigate('/items/new')}
              className="mt-5 px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg cursor-pointer"
            >
              List Your First Item
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="group sky-glass-panel-interactive rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-16 w-20 rounded-lg overflow-hidden border border-sky-200/80 bg-white/70 shrink-0">
                    <ResourceImage
                      src={item.imageUrl}
                      alt={item.title}
                      category={item.category}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-600">
                      {item.branch} · Sem {item.semester} · {item.exchangeType} ·{' '}
                      <span
                        className={
                          item.isAvailable
                            ? 'text-emerald-700 font-semibold'
                            : 'text-amber-700 font-semibold'
                        }
                      >
                        {item.isAvailable ? 'Available' : 'Reserved / Unavailable'}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate(`/items/${item.id}`)}
                      className="mt-0.5 font-display text-base font-bold text-[#0F172A] hover:text-sky-700 transition-colors text-left truncate block cursor-pointer"
                    >
                      {item.title}
                    </button>
                    <p className="font-mono text-xs text-slate-600 tabular-nums">
                      {item.exchangeType === 'Donate'
                        ? 'Free Donation'
                        : `₹${item.price}`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/items/${item.id}/edit`)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#0F172A] bg-white/75 hover:bg-white border border-sky-200 hover:border-sky-400 rounded-lg sky-btn-lift cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAvailability(item)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg sky-btn-lift cursor-pointer"
                  >
                    {item.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    aria-label={`Delete ${item.title}`}
                    className="p-2 text-red-700 bg-red-50/90 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Delete Listing"
          description={`Delete "${deleteTarget?.title}"? Open pending requests will be cancelled.`}
          confirmLabel="Delete"
          tone="danger"
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </div>
  );
}

export function MyRequestsPage() {
  const { user, navigate, notify } = useApp();
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<ItemRequest | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.listRequests('mine');
      setRequests(res.requests);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (!user) return <RequireAuthNotice />;

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setBusy(true);
    try {
      const res = await api.actOnRequest(cancelTarget.id, 'cancel');
      setRequests((prev) =>
        prev.map((r) => (r.id === cancelTarget.id ? res.request : r))
      );
      notify('info', 'Request cancelled and item reservation released.');
      setCancelTarget(null);
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Cancel failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sky-glass-canvas min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A]">
              My Outgoing Requests
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Track items you requested from seniors, coordinate pickups, or
              withdraw active requests.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/catalog')}
            className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/20 cursor-pointer"
          >
            Browse More Items
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div key={n} className="h-28 rounded-2xl bg-white/50 border border-sky-200/70 animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="sky-glass-panel rounded-2xl p-12 text-center">
            <p className="font-display text-lg font-bold text-[#0F172A]">
              No outgoing requests yet
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Browse the campus catalog and send a request on any available
              resource.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const canCancel = ![
                'Completed',
                'Cancelled',
                'Rejected',
              ].includes(req.status);
              const canCoordinate = [
                'Accepted',
                'Reserved',
                'Pickup Scheduled',
              ].includes(req.status);
              return (
                <div
                  key={req.id}
                  className="sky-glass-panel-interactive rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="font-semibold text-sky-800">
                        Status: {req.status}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Owner: {req.ownerName}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {req.itemExchangeType} · ₹{req.itemPrice}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/items/${req.itemId}`)}
                      className="font-display text-lg font-bold text-[#0F172A] hover:text-sky-700 transition-colors text-left cursor-pointer"
                    >
                      {req.itemTitle}
                    </button>
                    <p className="text-xs text-slate-600">
                      Your note: &ldquo;{req.message}&rdquo;
                    </p>
                    {req.pickup && (
                      <p className="text-xs font-medium text-sky-800">
                        Pickup: {req.pickup.pickupPoint} on{' '}
                        {req.pickup.pickupDate} at {req.pickup.pickupTime}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {canCoordinate && (
                      <button
                        type="button"
                        onClick={() => navigate('/pickups')}
                        className="px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg sky-btn-lift cursor-pointer"
                      >
                        Coordinate Pickup
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate('/handovers')}
                      className="px-3.5 py-2 text-xs font-semibold text-[#0F172A] bg-white/75 hover:bg-white hover:border-sky-400 border border-sky-200 rounded-lg sky-btn-lift cursor-pointer"
                    >
                      Handover Tracker
                    </button>
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => setCancelTarget(req)}
                        className="px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50/90 rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <ConfirmDialog
          open={Boolean(cancelTarget)}
          title="Cancel Request"
          description="Cancel this request? If the item is currently reserved for you, cancelling will release the reservation so other students can request it."
          confirmLabel="Confirm Cancel"
          tone="danger"
          busy={busy}
          onConfirm={handleCancel}
          onCancel={() => setCancelTarget(null)}
        />
      </div>
    </div>
  );
}

export function IncomingRequestsPage() {
  const { user, navigate, notify } = useApp();
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionTarget, setActionTarget] = useState<{
    req: ItemRequest;
    action: 'accept' | 'reject';
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.listRequests('incoming');
      setRequests(res.requests);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (!user) return <RequireAuthNotice />;

  const handleDecision = async () => {
    if (!actionTarget) return;
    setBusy(true);
    try {
      await api.actOnRequest(actionTarget.req.id, actionTarget.action);
      await load();
      notify(
        'success',
        actionTarget.action === 'accept'
          ? 'Request accepted and item reserved! Coordinate pickup next.'
          : 'Request rejected.'
      );
      setActionTarget(null);
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sky-glass-canvas min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A]">
            Incoming Requests
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review student requests for your listings. Accepting a request
            automatically reserves the item and declines conflicting requests.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div key={n} className="h-28 rounded-2xl bg-white/50 border border-sky-200/70 animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="sky-glass-panel rounded-2xl p-12 text-center">
            <p className="font-display text-lg font-bold text-[#0F172A]">
              No incoming requests yet
            </p>
            <p className="mt-1 text-sm text-slate-600">
              When classmates request one of your listed items, it will appear
              here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="sky-glass-panel-interactive rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className="font-semibold text-sky-800">
                      Status: {req.status}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      From: {req.borrowerName} ({req.borrowerBranch} Sem{' '}
                      {req.borrowerSemester})
                    </span>
                  </div>
                  <h2 className="font-display text-lg font-bold text-[#0F172A]">
                    {req.itemTitle}
                  </h2>
                  <p className="text-xs text-slate-600">
                    Message: &ldquo;{req.message}&rdquo;
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {req.status === 'Requested' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setActionTarget({ req, action: 'reject' })}
                        className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50/90 hover:bg-red-100 border border-red-200 rounded-lg sky-btn-lift cursor-pointer"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActionTarget({ req, action: 'accept' })}
                        className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg sky-btn-lift cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Accept & Reserve</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          ['Reserved', 'Accepted'].includes(req.status)
                            ? '/pickups'
                            : '/handovers'
                        )
                      }
                      className="px-3.5 py-2 text-xs font-semibold text-[#0F172A] bg-white/75 hover:bg-white hover:border-sky-400 border border-sky-200 rounded-lg sky-btn-lift cursor-pointer"
                    >
                      {['Reserved', 'Accepted'].includes(req.status)
                        ? 'Coordinate Pickup'
                        : 'View in Handover Tracker'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <ConfirmDialog
          open={Boolean(actionTarget)}
          title={
            actionTarget?.action === 'accept'
              ? 'Accept & Reserve Item'
              : 'Reject Request'
          }
          description={
            actionTarget?.action === 'accept'
              ? `Accept ${actionTarget.req.borrowerName}'s request for "${actionTarget.req.itemTitle}"? This will reserve the item and decline any other open requests for it.`
              : `Reject ${actionTarget?.req.borrowerName}'s request?`
          }
          confirmLabel={
            actionTarget?.action === 'accept' ? 'Accept & Reserve' : 'Reject'
          }
          tone={actionTarget?.action === 'reject' ? 'danger' : 'primary'}
          busy={busy}
          onConfirm={handleDecision}
          onCancel={() => setActionTarget(null)}
        />
      </div>
    </div>
  );
}
