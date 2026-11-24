import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Check, CheckCircle2, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type {
  ItemRequest,
  PickupPointName,
  RequestStatus,
} from '../types/campuscycle';

const PICKUP_POINTS: PickupPointName[] = [
  'College Library',
  'Canteen',
  'Department Office',
  'Main Gate',
  'Hostel Courtyard',
  'Other',
];

const TIMELINE_STAGES: RequestStatus[] = [
  'Requested',
  'Accepted',
  'Reserved',
  'Pickup Scheduled',
  'Handed Over',
  'Completed',
];

export function PickupCoordinationPage() {
  const { user, navigate, notify } = useApp();
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [pickupPoint, setPickupPoint] =
    useState<PickupPointName>('College Library');
  const [pickupDate, setPickupDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [pickupTime, setPickupTime] = useState('16:30');
  const [instructions, setInstructions] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.listRequests('all');
      setRequests(
        res.requests.filter((r) =>
          ['Accepted', 'Reserved', 'Pickup Scheduled'].includes(r.status)
        )
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (!user) {
    return (
      <div className="sky-glass-canvas min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="sky-glass-panel rounded-2xl max-w-lg w-full p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">
            Sign in required
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

  const startEdit = (req: ItemRequest) => {
    setEditingId(req.id);
    setPickupPoint(req.pickup?.pickupPoint || 'College Library');
    setPickupDate(
      req.pickup?.pickupDate ||
        new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    );
    setPickupTime(req.pickup?.pickupTime || '16:30');
    setInstructions(req.pickup?.instructions || '');
  };

  const handleSave = async (e: React.FormEvent, requestId: string) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.savePickup(requestId, {
        pickupPoint,
        pickupDate,
        pickupTime,
        instructions,
      });
      await load();
      setEditingId(null);
      notify('success', 'Pickup details saved and shared with both parties.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sky-glass-canvas min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A]">
              Pickup Coordination
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Coordinate a shared campus pickup point, date, time, and meeting
              instructions. Both owner and borrower see the exact same schedule.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/handovers')}
            className="px-4 py-2 text-sm font-semibold text-[#0F172A] bg-white/80 hover:bg-white border border-sky-200 hover:border-sky-400 rounded-lg sky-btn-lift cursor-pointer"
          >
            Go to Handover Tracker
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-32 rounded-2xl bg-white/50 border border-sky-200/70 animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="sky-glass-panel rounded-2xl p-12 text-center">
            <p className="font-display text-lg font-bold text-[#0F172A]">
              No active reservations awaiting pickup coordination
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Once an item request is accepted, you can schedule the campus
              meeting spot here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {requests.map((req) => {
              const isEditing = editingId === req.id;
              return (
                <article
                  key={req.id}
                  className="sky-glass-panel-interactive rounded-2xl p-6 space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-600">
                        Status: <span className="font-semibold text-sky-700">{req.status}</span> · Owner: {req.ownerName} · Borrower: {req.borrowerName}
                      </p>
                      <h2 className="mt-1 font-display text-lg font-bold text-[#0F172A]">
                        {req.itemTitle}
                      </h2>
                    </div>

                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => startEdit(req)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/20 sky-btn-lift cursor-pointer self-start"
                      >
                        {req.pickup ? 'Update Pickup Plan' : 'Schedule Pickup'}
                      </button>
                    )}
                  </div>

                  {req.pickup && !isEditing && (
                    <div className="p-4 sky-glass-subtle rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-sky-700 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-slate-600">Campus Pickup Point</p>
                          <p className="font-semibold text-[#0F172A]">
                            {req.pickup.pickupPoint}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CalendarClock className="h-4 w-4 text-sky-700 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-slate-600">Date & Time</p>
                          <p className="font-mono font-semibold text-[#0F172A] tabular-nums">
                            {req.pickup.pickupDate} · {req.pickup.pickupTime}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-600">
                          Instructions (updated by {req.pickup.updatedByName})
                        </p>
                        <p className="font-medium text-[#0F172A]">
                          {req.pickup.instructions || 'No extra notes.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {isEditing && (
                    <form
                      onSubmit={(e) => handleSave(e, req.id)}
                      className="p-4 sky-glass-subtle rounded-xl space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label
                            htmlFor={`pickup-point-${req.id}`}
                            className="block text-xs font-medium text-slate-700 mb-1"
                          >
                            Pickup Point
                          </label>
                          <select
                            id={`pickup-point-${req.id}`}
                            value={pickupPoint}
                            onChange={(e) =>
                              setPickupPoint(e.target.value as PickupPointName)
                            }
                            className="w-full px-3 py-2 text-sm bg-white/90 border border-sky-200 rounded-lg"
                          >
                            {PICKUP_POINTS.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor={`pickup-date-${req.id}`}
                            className="block text-xs font-medium text-slate-700 mb-1"
                          >
                            Date
                          </label>
                          <input
                            id={`pickup-date-${req.id}`}
                            type="date"
                            required
                            value={pickupDate}
                            onChange={(e) => setPickupDate(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white/90 border border-sky-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`pickup-time-${req.id}`}
                            className="block text-xs font-medium text-slate-700 mb-1"
                          >
                            Time
                          </label>
                          <input
                            id={`pickup-time-${req.id}`}
                            type="time"
                            required
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white/90 border border-sky-200 rounded-lg"
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor={`pickup-notes-${req.id}`}
                          className="block text-xs font-medium text-slate-700 mb-1"
                        >
                          Instructions (optional)
                        </label>
                        <input
                          id={`pickup-notes-${req.id}`}
                          type="text"
                          value={instructions}
                          onChange={(e) => setInstructions(e.target.value)}
                          placeholder="e.g., Meet near the ground floor notice board after 4 PM lab."
                          className="w-full px-3 py-2 text-sm bg-white/90 border border-sky-200 rounded-lg"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3.5 py-2 text-xs font-medium text-slate-600 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg cursor-pointer"
                        >
                          {saving ? 'Saving...' : 'Save Pickup Schedule'}
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function HandoverTrackerPage() {
  const { user, navigate, notify } = useApp();
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [cancelTarget, setCancelTarget] = useState<ItemRequest | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.listRequests('all');
      setRequests(res.requests);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (!user) {
    return (
      <div className="sky-glass-canvas min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="sky-glass-panel rounded-2xl max-w-lg w-full p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">
            Sign in to view Handover Tracker
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

  const handleConfirm = async (requestId: string) => {
    setBusy(true);
    try {
      const res = await api.confirmHandover(requestId);
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? res.request : r))
      );
      notify(
        'success',
        res.request.status === 'Completed'
          ? 'Both confirmations complete! Exchange marked Completed.'
          : 'Your confirmation is recorded. Awaiting the other party.'
      );
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Confirmation failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setBusy(true);
    try {
      const res = await api.actOnRequest(cancelTarget.id, 'cancel');
      setRequests((prev) =>
        prev.map((r) => (r.id === cancelTarget.id ? res.request : r))
      );
      notify('info', 'Transaction cancelled and reservation released.');
      setCancelTarget(null);
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Cancel failed.');
    } finally {
      setBusy(false);
    }
  };

  const visible = requests.filter((r) => {
    if (filter === 'active') {
      return !['Completed', 'Cancelled', 'Rejected'].includes(r.status);
    }
    if (filter === 'completed') {
      return r.status === 'Completed';
    }
    return true;
  });

  return (
    <div className="sky-glass-canvas min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A]">
              Handover Tracker
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Visual timeline from Request through Dual-Confirmed Completion.
              Exchanges are marked Completed only after both owner handover and
              borrower receipt confirmations.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filter handover records"
            className="flex items-center gap-1 p-1 bg-sky-100/80 border border-sky-200/75 rounded-lg self-start"
          >
            {
              /* Filter tabs */
              [
                { id: 'all', label: 'All History' },
                { id: 'active', label: 'In Progress' },
                { id: 'completed', label: 'Completed' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === tab.id}
                  onClick={() =>
                    setFilter(tab.id as 'all' | 'active' | 'completed')
                  }
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-all duration-150 ${
                    filter === tab.id
                      ? 'bg-white text-[#0F172A] shadow-xs'
                      : 'text-slate-600 hover:text-sky-900 hover:bg-white/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))
            }
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-44 rounded-2xl bg-white/50 border border-sky-200/70 animate-pulse" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="sky-glass-panel rounded-2xl p-12 text-center">
            <p className="font-display text-lg font-bold text-[#0F172A]">
              No handover records match this filter
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {visible.map((req) => {
              const ho = req.handover;
              const isOwner = user.id === req.ownerId;
              const isBorrower = user.id === req.borrowerId;
              const currentStageIdx = TIMELINE_STAGES.indexOf(req.status);
              const isClosed = ['Completed', 'Cancelled', 'Rejected'].includes(
                req.status
              );
              const canConfirm =
                ['Accepted', 'Reserved', 'Pickup Scheduled', 'Handed Over'].includes(
                  req.status
                ) &&
                ((isOwner && !ho?.ownerConfirmed) ||
                  (isBorrower && !ho?.borrowerConfirmed));

              return (
                <article
                  key={req.id}
                  className="sky-glass-panel-interactive rounded-2xl p-6 space-y-5"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span
                          className={`font-semibold ${
                            req.status === 'Completed'
                              ? 'text-emerald-700'
                              : req.status === 'Cancelled' ||
                                  req.status === 'Rejected'
                                ? 'text-red-700'
                                : 'text-sky-800'
                          }`}
                        >
                          Status: {req.status}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          Owner: {req.ownerName} | Borrower: {req.borrowerName}
                        </span>
                      </div>
                      <h2 className="mt-1 font-display text-lg font-bold text-[#0F172A]">
                        {req.itemTitle}
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      {canConfirm && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleConfirm(req.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg sky-btn-lift cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>
                            {isOwner
                              ? 'Confirm Item Handed Over'
                              : 'Confirm Item Received'}
                          </span>
                        </button>
                      )}

                      {!isClosed && (
                        <button
                          type="button"
                          onClick={() => setCancelTarget(req)}
                          className="px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50/90 rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Visual Stage Stepper */}
                  {req.status !== 'Cancelled' && req.status !== 'Rejected' && (
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                      {TIMELINE_STAGES.map((st, idx) => {
                        const done =
                          req.status === 'Completed' || idx < currentStageIdx;
                        const current =
                          req.status !== 'Completed' && idx === currentStageIdx;
                        return (
                          <div
                            key={st}
                            className={`p-2.5 rounded-xl border text-xs transition-all duration-150 ${
                              current
                                ? 'border-sky-600 bg-sky-100/80 shadow-xs'
                                : done
                                  ? 'border-sky-200 bg-white/75 hover:border-sky-400 hover:bg-white'
                                  : 'border-sky-100/80 bg-white/40 hover:bg-white/60'
                            }`}
                          >
                            <div className="flex items-center justify-between font-mono text-[10px] tabular-nums">
                              <span
                                className={
                                  current || done
                                    ? 'text-sky-700 font-semibold'
                                    : 'text-slate-400'
                                }
                              >
                                0{idx + 1}
                              </span>
                              {done && (
                                <Check className="h-3 w-3 text-emerald-700" />
                              )}
                            </div>
                            <p
                              className={`mt-1 font-semibold truncate ${
                                current || done ? 'text-[#0F172A]' : 'text-slate-400'
                              }`}
                            >
                              {st}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Dual Confirmation Status + Pickup Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-sky-200/60 text-xs">
                    <div>
                      <p className="text-slate-600">Owner Handover Confirmation</p>
                      <p
                        className={`mt-0.5 font-semibold ${
                          ho?.ownerConfirmed ? 'text-emerald-700' : 'text-slate-700'
                        }`}
                      >
                        {ho?.ownerConfirmed ? 'Confirmed' : 'Pending'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600">Borrower Receipt Confirmation</p>
                      <p
                        className={`mt-0.5 font-semibold ${
                          ho?.borrowerConfirmed ? 'text-emerald-700' : 'text-slate-700'
                        }`}
                      >
                        {ho?.borrowerConfirmed ? 'Confirmed' : 'Pending'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600">Pickup Point</p>
                      <p className="mt-0.5 font-semibold text-[#0F172A]">
                        {req.pickup
                          ? `${req.pickup.pickupPoint} (${req.pickup.pickupDate} ${req.pickup.pickupTime})`
                          : 'Not scheduled yet'}
                      </p>
                    </div>
                  </div>

                  {/* Transaction History Timeline */}
                  {ho && ho.timeline.length > 0 && (
                    <div className="pt-3 border-t border-sky-200/60">
                      <p className="text-xs font-semibold text-slate-700 mb-2">
                        Transaction History
                      </p>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        {ho.timeline.map((ev, i) => (
                          <li
                            key={`${ev.timestamp}-${i}`}
                            className="flex flex-wrap items-baseline justify-between gap-2"
                          >
                            <span>
                              <span className="font-semibold text-[#0F172A]">
                                {ev.status}
                              </span>{' '}
                              — {ev.note} ({ev.actorName})
                            </span>
                            <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                              {new Date(ev.timestamp).toLocaleString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <ConfirmDialog
          open={Boolean(cancelTarget)}
          title="Cancel Transaction"
          description="Cancelling this transaction will mark the handover Cancelled and release the item back to Available status."
          confirmLabel="Cancel Transaction"
          tone="danger"
          busy={busy}
          onConfirm={handleCancel}
          onCancel={() => setCancelTarget(null)}
        />
      </div>
    </div>
  );
}
