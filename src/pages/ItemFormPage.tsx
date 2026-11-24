import { useEffect, useState } from 'react';
import { ArrowLeft, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { ResourceImage } from '../components/ResourceImage';
import type {
  Branch,
  ExchangeType,
  ItemCategory,
  ItemCondition,
  Semester,
} from '../types/campuscycle';

const CATEGORY_PRESET_IMAGES: Record<ItemCategory, string> = {
  Textbooks: '/src/assets/images/item_textbook_clrs_1795440583070.jpg',
  'Lab Equipment': '/src/assets/images/item_lab_coat_1795440584373.jpg',
  'Engineering Tools': '/src/assets/images/item_mini_drafter_1795440583352.jpg',
  Stationery: '/src/assets/images/item_stationery_bundle_1795441174851.jpg',
  Other: '/src/assets/images/item_arduino_kit_1795440583743.jpg',
};

export function ItemFormPage({ editItemId }: { editItemId?: string }) {
  const { user, navigate, notify } = useApp();
  const isEdit = Boolean(editItemId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Textbooks');
  const [branch, setBranch] = useState<Branch>(user?.branch || 'CSE');
  const [semester, setSemester] = useState<Semester>(user?.semester || 3);
  const [condition, setCondition] = useState<ItemCondition>('Good');
  const [exchangeType, setExchangeType] = useState<ExchangeType>('Sell');
  const [price, setPrice] = useState(300);
  const [estimatedRetailPrice, setEstimatedRetailPrice] = useState(1100);
  const [quantity, setQuantity] = useState(1);
  const [imageUrl, setImageUrl] = useState(CATEGORY_PRESET_IMAGES.Textbooks);
  const [isAvailable, setIsAvailable] = useState(true);

  const [loading, setLoading] = useState(isEdit);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (!editItemId) return;
    let mounted = true;
    api
      .getItem(editItemId)
      .then(({ item }) => {
        if (!mounted) return;
        setTitle(item.title);
        setDescription(item.description);
        setCategory(item.category);
        setBranch(item.branch);
        setSemester(item.semester);
        setCondition(item.condition);
        setExchangeType(item.exchangeType);
        setPrice(item.price);
        setEstimatedRetailPrice(item.estimatedRetailPrice);
        setQuantity(item.quantity);
        setImageUrl(item.imageUrl || CATEGORY_PRESET_IMAGES[item.category]);
        setIsAvailable(item.isAvailable);
      })
      .catch((err) => {
        notify('error', err instanceof Error ? err.message : 'Unable to load item.');
        navigate('/my-listings');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [editItemId, navigate, notify]);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="sky-glass-panel rounded-2xl p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">
            Sign in required
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Please sign in with your student account before listing or editing
            an academic resource.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-6 px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/20 cursor-pointer"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setUploadError('Invalid file type. Only JPEG, PNG, or WebP are allowed.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('File exceeds 2 MB size limit.');
      return;
    }

    setUploading(true);
    try {
      const dataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Could not read file.'));
        reader.readAsDataURL(file);
      });
      const res = await api.uploadImage({
        fileName: file.name,
        mimeType: file.type,
        dataBase64,
      });
      setImageUrl(res.url);
      notify('success', 'Image uploaded and verified.');
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Image upload failed.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title,
        description,
        category,
        branch,
        semester,
        condition,
        exchangeType,
        price: exchangeType === 'Donate' ? 0 : Number(price),
        estimatedRetailPrice: Number(estimatedRetailPrice),
        quantity: Number(quantity),
        imageUrl,
        isAvailable,
      };
      if (isEdit && editItemId) {
        await api.updateItem(editItemId, payload);
        notify('success', 'Listing updated.');
        navigate(`/items/${editItemId}`);
      } else {
        const res = await api.createItem(payload);
        notify('success', 'Listing published to CampusCycle catalog!');
        navigate(`/items/${res.item.id}`);
      }
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="h-96 rounded-2xl bg-white/50 border border-sky-200/70 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        type="button"
        onClick={() => navigate(isEdit ? '/my-listings' : '/catalog')}
        className="group inline-flex items-center gap-1.5 text-sm font-medium text-sky-900/80 hover:text-[#0F172A] transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
        <span>{isEdit ? 'Back to My Listings' : 'Back to Catalog'}</span>
      </button>

      <div className="mt-5 sky-glass-panel rounded-2xl p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold text-[#0F172A]">
          {isEdit ? 'Edit Academic Resource' : 'List a Campus Resource'}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Share textbooks, lab gear, drafters, or calculators with fellow
          students.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="item-title"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Item Title * (3–160 chars)
            </label>
            <input
              id="item-title"
              type="text"
              required
              minLength={3}
              maxLength={160}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Data Structures & Algorithms (CLRS 4th Ed)"
              className="w-full px-3.5 py-2.5 text-sm bg-white/80 border border-sky-200 rounded-lg focus:outline-none focus:bg-white focus:border-sky-500"
            />
          </div>

          <div>
            <label
              htmlFor="item-description"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Description * (10–2000 chars)
            </label>
            <textarea
              id="item-description"
              rows={4}
              required
              minLength={10}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe edition, markings, included accessories, or semester suitability..."
              className="w-full px-3.5 py-2.5 text-sm bg-white/80 border border-sky-200 rounded-lg focus:outline-none focus:bg-white focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="item-category"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Category
              </label>
              <select
                id="item-category"
                value={category}
                onChange={(e) => {
                  const next = e.target.value as ItemCategory;
                  setCategory(next);
                  if (
                    Object.values(CATEGORY_PRESET_IMAGES).includes(imageUrl)
                  ) {
                    setImageUrl(CATEGORY_PRESET_IMAGES[next]);
                  }
                }}
                className="w-full px-3 py-2.5 text-sm border border-sky-200 rounded-lg bg-white/80 focus:outline-none focus:border-sky-500"
              >
                <option value="Textbooks">Textbooks</option>
                <option value="Lab Equipment">Lab Equipment</option>
                <option value="Engineering Tools">Engineering Tools</option>
                <option value="Stationery">Stationery</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="item-branch"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Branch
              </label>
              <select
                id="item-branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value as Branch)}
                className="w-full px-3 py-2.5 text-sm border border-sky-200 rounded-lg bg-white/80 focus:outline-none focus:border-sky-500"
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
                htmlFor="item-semester"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Semester
              </label>
              <select
                id="item-semester"
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value) as Semester)}
                className="w-full px-3 py-2.5 text-sm border border-sky-200 rounded-lg bg-white/80 focus:outline-none focus:border-sky-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Sem {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="item-condition"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Condition
              </label>
              <select
                id="item-condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value as ItemCondition)}
                className="w-full px-3 py-2.5 text-sm border border-sky-200 rounded-lg bg-white/80 focus:outline-none focus:border-sky-500"
              >
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="item-exchange-type"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Exchange Type
              </label>
              <select
                id="item-exchange-type"
                value={exchangeType}
                onChange={(e) => {
                  const next = e.target.value as ExchangeType;
                  setExchangeType(next);
                  if (next === 'Donate') setPrice(0);
                }}
                className="w-full px-3 py-2.5 text-sm border border-sky-200 rounded-lg bg-white/80 focus:outline-none focus:border-sky-500"
              >
                <option value="Sell">Sell</option>
                <option value="Lend">Lend</option>
                <option value="Donate">Donate</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="item-price"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                {exchangeType === 'Lend'
                  ? 'Deposit (₹)'
                  : exchangeType === 'Donate'
                    ? 'Price (₹)'
                    : 'Asking Price (₹)'}
              </label>
              <input
                id="item-price"
                type="number"
                min={0}
                max={1000000}
                disabled={exchangeType === 'Donate'}
                value={exchangeType === 'Donate' ? 0 : price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2.5 text-sm font-mono bg-white/80 border border-sky-200 rounded-lg focus:outline-none focus:border-sky-500 disabled:bg-sky-50/70"
              />
            </div>

            <div>
              <label
                htmlFor="item-mrp"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Est. Retail MRP (₹)
              </label>
              <input
                id="item-mrp"
                type="number"
                min={0}
                max={1000000}
                value={estimatedRetailPrice}
                onChange={(e) => setEstimatedRetailPrice(Number(e.target.value))}
                className="w-full px-3 py-2.5 text-sm font-mono bg-white/80 border border-sky-200 rounded-lg focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label
                htmlFor="item-quantity"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Quantity
              </label>
              <input
                id="item-quantity"
                type="number"
                min={1}
                max={50}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2.5 text-sm font-mono bg-white/80 border border-sky-200 rounded-lg focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Image Upload & Preview */}
          <div className="p-4 sky-glass-subtle rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-20 w-28 rounded-lg overflow-hidden border border-sky-200/90 bg-white/80 shrink-0">
                  <ResourceImage
                    src={imageUrl}
                    alt={title || category}
                    category={category}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-[#0F172A]">
                    Item Photograph
                  </p>
                  <p>JPG, PNG, or WebP up to 2 MB (magic-byte verified).</p>
                  {uploadError && (
                    <p className="text-red-600 font-medium">{uploadError}</p>
                  )}
                </div>
              </div>

              <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#0F172A] bg-white/85 hover:bg-white border border-sky-200 hover:border-sky-400 rounded-lg sky-btn-lift cursor-pointer shrink-0">
                <Upload className="h-3.5 w-3.5 text-sky-700" />
                <span>{uploading ? 'Uploading...' : 'Upload Photo'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          <label className="inline-flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="h-4 w-4 rounded border-sky-300 text-sky-600 focus:ring-sky-600"
            />
            <span>Mark as available in campus catalog immediately</span>
          </label>

          <div className="pt-4 border-t border-sky-200/70 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(isEdit ? '/my-listings' : '/catalog')}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-[#0F172A] hover:bg-sky-100/60 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/20 sky-btn-lift cursor-pointer disabled:opacity-50"
            >
              {submitting
                ? 'Saving...'
                : isEdit
                  ? 'Save Changes'
                  : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
