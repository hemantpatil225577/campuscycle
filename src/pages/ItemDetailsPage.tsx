import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Edit3,
  Flag,
  Send,
  ShieldAlert,
  Trash2,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { ResourceImage } from '../components/ResourceImage';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { ResourceItem } from '../types/campuscycle';

export function ItemDetailsPage({ itemId }: { itemId: string }) {
  const { user, navigate, notify } = useApp();
  const [item, setItem] = useState<ResourceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [requestMsg, setRequestMsg] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);

  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [busyAction, setBusyAction] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .getItem(itemId)
      .then((res) => {
        if (mounted) setItem(res.item);
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Item not found.');
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [itemId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-96 rounded-2xl bg-white/50 border border-sky-200/70 animate-pulse" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="sky-glass-panel rounded-2xl p-10 text-center">
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">
            Listing Unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {error || 'Item not found.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/catalog')}
            className="mt-6 px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/20 cursor-pointer"
          >
            Back to Catalog
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === item.ownerId;
  const savings = Math.max(0, item.estimatedRetailPrice - item.price);

  const handleRequestItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      notify('info', 'Please sign in to request an item.');
      navigate('/login');
      return;
    }
    setSubmittingReq(true);
    try {
      await api.createRequest({ itemId: item.id, message: requestMsg });
      notify('success', 'Request sent! Track owner response in My Requests.');
      setRequestMsg('');
      navigate('/my-requests');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setSubmittingReq(false);
    }
  };

  const handleToggleAvailability = async () => {
    setBusyAction(true);
    try {
      const res = await api.updateItem(item.id, {
        isAvailable: !item.isAvailable,
      });
      setItem(res.item);
      notify(
        'success',
        res.item.isAvailable
          ? 'Item marked Available.'
          : 'Item marked Unavailable.'
      );
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleDelete = async () => {
    setBusyAction(true);
    try {
      await api.deleteItem(item.id);
      notify('success', 'Listing deleted.');
      navigate('/my-listings');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Delete failed.');
      setConfirmDeleteOpen(false);
    } finally {
      setBusyAction(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setSubmittingReport(true);
    try {
      await api.createReport({
        itemId: item.id,
        reason: reportReason,
        details: reportDetails,
      });
      notify('success', 'Report submitted to campus administrators.');
      setShowReport(false);
      setReportReason('');
      setReportDetails('');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Report failed.');
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        type="button"
        onClick={() => navigate('/catalog')}
        className="group inline-flex items-center gap-1.5 text-sm font-medium text-sky-900/80 hover:text-[#0F172A] transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
        <span>Back to Catalog</span>
      </button>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Image & Description */}
        <div className="lg:col-span-7 space-y-6">
          <div className="group aspect-[4/3] w-full rounded-2xl overflow-hidden border border-sky-200/90 hover:border-sky-400/80 bg-white/75 shadow-sm hover:shadow-md transition-all duration-200">
            <ResourceImage
              src={item.imageUrl}
              alt={item.title}
              category={item.category}
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            />
          </div>

          <div className="sky-glass-panel rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-[#0F172A]">
              Resource Description
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {item.description}
            </p>

            <dl className="pt-4 border-t border-sky-200/70 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <dt className="text-slate-600">Category</dt>
                <dd className="mt-0.5 font-semibold text-[#0F172A]">
                  {item.category}
                </dd>
              </div>
              <div>
                <dt className="text-slate-600">Branch &amp; Semester</dt>
                <dd className="mt-0.5 font-semibold text-[#0F172A]">
                  {item.branch} · Sem {item.semester}
                </dd>
              </div>
              <div>
                <dt className="text-slate-600">Condition &amp; Qty</dt>
                <dd className="mt-0.5 font-semibold text-[#0F172A]">
                  {item.condition} · Qty {item.quantity}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Right: Pricing, Owner, Request / Owner Actions */}
        <div className="lg:col-span-5 space-y-5">
          <div className="sky-glass-panel rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-slate-600">
                {item.exchangeType} · {item.branch} Sem {item.semester}
              </span>
              <span
                className={`font-semibold ${
                  item.isAvailable ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {item.isAvailable ? 'Available for Request' : 'Currently Reserved / Unavailable'}
              </span>
            </div>

            <h1 className="font-display text-2xl font-bold text-[#0F172A] leading-snug">
              {item.title}
            </h1>

            <div className="p-4 sky-glass-subtle rounded-xl flex items-baseline justify-between gap-4">
              <div>
                <p className="text-xs text-slate-600">Exchange Price</p>
                <p className="font-mono text-2xl font-bold text-[#0F172A] tabular-nums">
                  {item.exchangeType === 'Donate'
                    ? '₹0 (Donate)'
                    : item.exchangeType === 'Lend' && item.price === 0
                      ? '₹0 (Free Lend)'
                      : `₹${item.price.toLocaleString('en-IN')}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-600">Est. Retail MRP</p>
                <p className="font-mono text-sm text-emerald-700 font-semibold tabular-nums">
                  Save ~₹{savings.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Owner Info */}
            <div className="pt-4 border-t border-sky-200/70 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-sky-100 border border-sky-200/80 flex items-center justify-center text-sky-700 shrink-0">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0F172A] truncate">
                  {item.ownerName}
                </p>
                <p className="text-xs text-slate-600 truncate">
                  {item.ownerBranch} · Sem {item.ownerSemester} · {item.ownerCollege}
                </p>
              </div>
            </div>

            {/* Owner Controls OR Borrower Request Form */}
            {isOwner ? (
              <div className="pt-4 border-t border-sky-200/70 space-y-3">
                <p className="text-xs font-medium text-slate-600">
                  You own this listing
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => navigate(`/items/${item.id}/edit`)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-[#0F172A] bg-white/80 hover:bg-white border border-sky-200 hover:border-sky-400 rounded-lg sky-btn-lift cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit Item</span>
                  </button>
                  <button
                    type="button"
                    disabled={busyAction}
                    onClick={handleToggleAvailability}
                    className="flex-1 px-3.5 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg sky-btn-lift cursor-pointer disabled:opacity-50"
                  >
                    {item.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                  </button>
                  <button
                    type="button"
                    disabled={busyAction}
                    onClick={() => setConfirmDeleteOpen(true)}
                    className="px-3.5 py-2.5 text-xs font-semibold text-red-700 bg-red-50/90 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
                    aria-label="Delete listing"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-sky-200/70">
                {item.isAvailable ? (
                  <form onSubmit={handleRequestItem} className="space-y-3">
                    <label
                      htmlFor="req-message"
                      className="block text-xs font-semibold text-[#0F172A]"
                    >
                      Request This Item
                    </label>
                    <textarea
                      id="req-message"
                      rows={3}
                      required
                      minLength={3}
                      value={requestMsg}
                      onChange={(e) => setRequestMsg(e.target.value)}
                      placeholder="Introduce your branch/semester and preferred campus pickup spot..."
                      className="w-full px-3 py-2 text-sm bg-white/80 border border-sky-200 rounded-lg text-[#0F172A] focus:outline-none focus:bg-white focus:border-sky-500"
                    />
                    <button
                      type="submit"
                      disabled={submittingReq}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/20 sky-btn-lift cursor-pointer disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      <span>
                        {submittingReq
                          ? 'Sending Request...'
                          : user
                            ? 'Send Request to Owner'
                            : 'Sign In to Request'}
                      </span>
                    </button>
                  </form>
                ) : (
                  <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-900">
                    This item is currently reserved or marked unavailable by the
                    owner.
                  </div>
                )}
              </div>
            )}

            {/* Report Action */}
            {!isOwner && (
              <div className="pt-3 border-t border-sky-200/70 flex justify-end">
                <button
                  type="button"
                  aria-expanded={showReport}
                  onClick={() => setShowReport((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-red-700 cursor-pointer"
                >
                  <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Report Listing</span>
                </button>
              </div>
            )}
          </div>

          {showReport && (
            <form
              onSubmit={handleReportSubmit}
              className="sky-glass-panel rounded-2xl p-5 space-y-3"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0F172A]">
                <ShieldAlert className="h-4 w-4 text-red-600" aria-hidden="true" />
                <span>Report Suspicious or Incorrect Listing</span>
              </div>
              <div>
                <label htmlFor="report-reason" className="sr-only">
                  Report reason
                </label>
                <input
                  id="report-reason"
                  type="text"
                  required
                  minLength={3}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Reason (e.g., Misleading price, prohibited item)"
                  className="w-full px-3 py-2 text-sm bg-white/85 border border-sky-200 rounded-lg focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label htmlFor="report-details" className="sr-only">
                  Optional context for admin review
                </label>
                <textarea
                  id="report-details"
                  rows={2}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Optional context for admin review..."
                  className="w-full px-3 py-2 text-sm bg-white/85 border border-sky-200 rounded-lg focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReport(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
                >
                  {submittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete Listing"
        description="Are you sure you want to delete this listing? Any open requests on it will be cancelled."
        confirmLabel="Delete Listing"
        tone="danger"
        busy={busyAction}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
