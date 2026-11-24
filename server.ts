import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { Response } from 'express';
import dotenv from 'dotenv';
import {
  detectImageType,
  isValidBranch,
  isValidCategory,
  isValidCondition,
  isValidExchangeType,
  isValidModerationStatus,
  isValidPickupPoint,
  isValidReportStatus,
  sanitizeImageUrl,
} from './src/lib/validation.ts';
import {
  actOnRequest,
  adminModerateItem,
  adminResolveReport,
  adminUpdateUser,
  confirmHandover,
  createItem,
  createReport,
  createRequest,
  deleteItem,
  getAdminOverview,
  getImpactStats,
  getItemById,
  HttpError,
  listItems,
  listRequestsForUser,
  updateItem,
  updateProfile,
  upsertPickup,
} from './src/db/repository.ts';
import {
  type AuthedRequest,
  requireAdmin,
  requireAuth,
  resolveAuthedProfile,
} from './src/middleware/auth.ts';
import type {
  Branch,
  ExchangeType,
  ItemCategory,
  ItemCondition,
  Semester,
} from './src/types/campuscycle.ts';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const ALLOWED_COLLEGE_DOMAIN = (process.env.ALLOWED_COLLEGE_DOMAIN || '')
  .trim()
  .toLowerCase();

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function handleError(res: Response, err: unknown, fallback: string) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(fallback, err);
  res
    .status(500)
    .json({ error: err instanceof Error ? err.message : fallback });
}

const app = express();
app.disable('x-powered-by');

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
  next();
});

const uploadJsonParser = express.json({ limit: '4mb' });
const standardJsonParser = express.json({ limit: '64kb' });
app.use((req, res, next) => {
  if (req.path === '/api/upload') {
    uploadJsonParser(req, res, next);
    return;
  }
  standardJsonParser(req, res, next);
});

// Confined static upload serving with safe headers and long-lived cache
app.get('/uploads/:filename', (req, res) => {
  const rawName = path.basename(req.params.filename || '');
  if (!/^[a-zA-Z0-9_-]+\.(jpg|png|webp)$/.test(rawName)) {
    res.status(404).end();
    return;
  }
  const resolved = path.resolve(UPLOADS_DIR, rawName);
  if (!resolved.startsWith(UPLOADS_DIR + path.sep) || !fs.existsSync(resolved)) {
    res.status(404).end();
    return;
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(resolved);
});

// ============================================================================
// HEALTH & IMPACT
// ============================================================================
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    mode: 'live',
    authProvider: 'firebase',
    allowedCollegeDomain: ALLOWED_COLLEGE_DOMAIN,
  });
});

app.get('/api/impact', async (_req, res) => {
  try {
    const impact = await getImpactStats();
    res.json(impact);
  } catch (err) {
    handleError(res, err, 'Failed to load impact metrics.');
  }
});

// ============================================================================
// AUTHENTICATION & PROFILE ROUTES (Firebase ID Token + PostgreSQL)
// ============================================================================
app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res) => {
  res.json({ profile: req.user! });
});

app.patch('/api/profile', requireAuth, async (req: AuthedRequest, res) => {
  const user = req.user!;
  const { fullName, college, branch, semester, contactDetails } = req.body ?? {};
  const patch: {
    fullName?: string;
    college?: string;
    branch?: Branch;
    semester?: Semester;
    contactDetails?: string;
  } = {};

  if (fullName !== undefined) {
    const clean = String(fullName).trim();
    if (clean.length < 2 || clean.length > 100) {
      res.status(400).json({ error: 'Full name must be 2–100 characters.' });
      return;
    }
    patch.fullName = clean;
  }
  if (college !== undefined) {
    const clean = String(college).trim();
    if (clean.length < 2 || clean.length > 160) {
      res.status(400).json({ error: 'College name must be 2–160 characters.' });
      return;
    }
    patch.college = clean;
  }
  if (branch !== undefined) {
    if (!isValidBranch(branch)) {
      res.status(400).json({ error: 'Invalid branch.' });
      return;
    }
    patch.branch = branch;
  }
  if (semester !== undefined) {
    const sem = Number(semester);
    if (!Number.isInteger(sem) || sem < 1 || sem > 8) {
      res.status(400).json({ error: 'Semester must be 1–8.' });
      return;
    }
    patch.semester = sem as Semester;
  }
  if (contactDetails !== undefined) {
    patch.contactDetails = String(contactDetails).trim().slice(0, 120);
  }

  try {
    const profile = await updateProfile(user.id, patch);
    res.json({ profile });
  } catch (err) {
    handleError(res, err, 'Failed to update profile.');
  }
});

// ============================================================================
// SECURE IMAGE UPLOAD ROUTE
// ============================================================================
app.post('/api/upload', requireAuth, async (req: AuthedRequest, res) => {
  const { dataBase64, mimeType } = req.body ?? {};
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

  if (typeof dataBase64 !== 'string' || !dataBase64) {
    res.status(400).json({ error: 'Missing image data.' });
    return;
  }
  if (mimeType && !allowedMimes.includes(String(mimeType))) {
    res
      .status(400)
      .json({ error: 'Only JPEG, PNG, and WebP images are permitted.' });
    return;
  }

  const stripped = dataBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
  const buffer = Buffer.from(stripped, 'base64');

  if (buffer.length === 0 || buffer.length > 2 * 1024 * 1024) {
    res.status(400).json({ error: 'Image must be between 1 byte and 2 MB.' });
    return;
  }

  const detected = detectImageType(buffer);
  if (!detected) {
    res.status(400).json({
      error:
        'Invalid image file signature. Upload a genuine JPG, PNG, or WebP.',
    });
    return;
  }

  const fileName = `${req.user!.id.replace(/[^a-zA-Z0-9_-]/g, '')}-${crypto.randomUUID()}.${detected.ext}`;
  const safePath = path.resolve(UPLOADS_DIR, fileName);
  if (!safePath.startsWith(UPLOADS_DIR + path.sep)) {
    res.status(400).json({ error: 'Invalid upload path.' });
    return;
  }
  fs.writeFileSync(safePath, buffer);
  res.status(201).json({ url: `/uploads/${fileName}` });
});

// ============================================================================
// CATALOG & LISTING CRUD ROUTES
// ============================================================================
app.get('/api/items', async (req, res) => {
  const {
    q,
    branch,
    semester,
    category,
    condition,
    exchangeType,
    availableOnly,
    sort,
    ownerId,
  } = req.query;

  const semVal =
    semester && semester !== 'ALL' ? (Number(semester) as Semester) : 'ALL';

  try {
    const result = await listItems({
      q: typeof q === 'string' ? q : '',
      branch:
        typeof branch === 'string' && branch !== 'ALL'
          ? (branch as Branch)
          : 'ALL',
      semester: semVal,
      category:
        typeof category === 'string' && category !== 'ALL'
          ? (category as ItemCategory)
          : 'ALL',
      condition:
        typeof condition === 'string' && condition !== 'ALL'
          ? (condition as ItemCondition)
          : 'ALL',
      exchangeType:
        typeof exchangeType === 'string' && exchangeType !== 'ALL'
          ? (exchangeType as ExchangeType)
          : 'ALL',
      availableOnly: availableOnly === 'true',
      sort: sort === 'price-asc' || sort === 'price-desc' ? sort : 'newest',
      ownerId: typeof ownerId === 'string' ? ownerId : undefined,
    });
    res.json({ items: result });
  } catch (err) {
    handleError(res, err, 'Failed to load catalog items.');
  }
});

app.get('/api/items/:id', async (req, res) => {
  try {
    const [user, item] = await Promise.all([
      resolveAuthedProfile(req),
      getItemById(req.params.id),
    ]);
    if (
      !item ||
      (item.moderationStatus !== 'active' &&
        user?.id !== item.ownerId &&
        user?.role !== 'admin')
    ) {
      res.status(404).json({ error: 'Listing not found.' });
      return;
    }
    res.json({ item });
  } catch (err) {
    handleError(res, err, 'Failed to load listing.');
  }
});

app.post('/api/items', requireAuth, async (req: AuthedRequest, res) => {
  const user = req.user!;
  const {
    title,
    description,
    category,
    branch,
    semester,
    condition,
    exchangeType,
    price,
    estimatedRetailPrice,
    quantity,
    imageUrl,
    isAvailable,
  } = req.body ?? {};

  const cleanTitle = String(title || '').trim();
  const cleanDesc = String(description || '').trim();
  const semNum = Number(semester);
  const qtyNum = Number(quantity ?? 1);
  const rawPrice = exchangeType === 'Donate' ? 0 : Number(price ?? 0);
  const rawMrp = Number(estimatedRetailPrice ?? Math.max(500, rawPrice * 2));

  if (cleanTitle.length < 3 || cleanTitle.length > 160) {
    res.status(400).json({ error: 'Title must be 3–160 characters.' });
    return;
  }
  if (cleanDesc.length < 10 || cleanDesc.length > 2000) {
    res.status(400).json({ error: 'Description must be 10–2000 characters.' });
    return;
  }
  if (!isValidCategory(category)) {
    res.status(400).json({ error: 'Invalid category.' });
    return;
  }
  if (!isValidBranch(branch)) {
    res.status(400).json({ error: 'Invalid branch.' });
    return;
  }
  if (!Number.isInteger(semNum) || semNum < 1 || semNum > 8) {
    res.status(400).json({ error: 'Semester must be 1–8.' });
    return;
  }
  if (!isValidCondition(condition)) {
    res.status(400).json({ error: 'Invalid condition.' });
    return;
  }
  if (!isValidExchangeType(exchangeType)) {
    res.status(400).json({ error: 'Invalid exchange type.' });
    return;
  }
  if (!Number.isFinite(rawPrice) || rawPrice < 0 || rawPrice > 1_000_000) {
    res
      .status(400)
      .json({ error: 'Price must be between 0 and 1,000,000.' });
    return;
  }
  if (!Number.isFinite(rawMrp) || rawMrp < 0 || rawMrp > 1_000_000) {
    res
      .status(400)
      .json({ error: 'Estimated retail price must be between 0 and 1,000,000.' });
    return;
  }
  if (!Number.isInteger(qtyNum) || qtyNum < 1 || qtyNum > 50) {
    res.status(400).json({ error: 'Quantity must be between 1 and 50.' });
    return;
  }

  try {
    const newItem = await createItem(user, {
      title: cleanTitle,
      description: cleanDesc,
      category,
      branch,
      semester: semNum as Semester,
      condition,
      exchangeType,
      price: Math.round(rawPrice),
      estimatedRetailPrice: Math.max(Math.round(rawPrice), Math.round(rawMrp)),
      quantity: qtyNum,
      imageUrl: sanitizeImageUrl(String(imageUrl || '')),
      isAvailable: isAvailable !== false,
    });
    res.status(201).json({ item: newItem });
  } catch (err) {
    handleError(res, err, 'Failed to publish listing.');
  }
});

app.patch('/api/items/:id', requireAuth, async (req: AuthedRequest, res) => {
  const user = req.user!;
  const itemId = String(req.params.id || '');
  const {
    title,
    description,
    category,
    branch,
    semester,
    condition,
    exchangeType,
    price,
    estimatedRetailPrice,
    quantity,
    imageUrl,
    isAvailable,
  } = req.body ?? {};

  const patch: Parameters<typeof updateItem>[2] = {};

  if (title !== undefined) {
    const clean = String(title).trim();
    if (clean.length < 3 || clean.length > 160) {
      res.status(400).json({ error: 'Title must be 3–160 characters.' });
      return;
    }
    patch.title = clean;
  }
  if (description !== undefined) {
    const clean = String(description).trim();
    if (clean.length < 10 || clean.length > 2000) {
      res.status(400).json({ error: 'Description must be 10–2000 characters.' });
      return;
    }
    patch.description = clean;
  }
  if (category !== undefined) {
    if (!isValidCategory(category)) {
      res.status(400).json({ error: 'Invalid category.' });
      return;
    }
    patch.category = category;
  }
  if (branch !== undefined) {
    if (!isValidBranch(branch)) {
      res.status(400).json({ error: 'Invalid branch.' });
      return;
    }
    patch.branch = branch;
  }
  if (semester !== undefined) {
    const semNum = Number(semester);
    if (!Number.isInteger(semNum) || semNum < 1 || semNum > 8) {
      res.status(400).json({ error: 'Semester must be 1–8.' });
      return;
    }
    patch.semester = semNum as Semester;
  }
  if (condition !== undefined) {
    if (!isValidCondition(condition)) {
      res.status(400).json({ error: 'Invalid condition.' });
      return;
    }
    patch.condition = condition;
  }
  if (exchangeType !== undefined) {
    if (!isValidExchangeType(exchangeType)) {
      res.status(400).json({ error: 'Invalid exchange type.' });
      return;
    }
    patch.exchangeType = exchangeType;
  }
  if (price !== undefined) {
    const p = Number(price);
    if (!Number.isFinite(p) || p < 0 || p > 1_000_000) {
      res.status(400).json({ error: 'Invalid price.' });
      return;
    }
    patch.price = Math.round(p);
  }
  if (estimatedRetailPrice !== undefined) {
    const mrp = Number(estimatedRetailPrice);
    if (!Number.isFinite(mrp) || mrp < 0 || mrp > 1_000_000) {
      res.status(400).json({ error: 'Invalid estimated retail price.' });
      return;
    }
    patch.estimatedRetailPrice = Math.round(mrp);
  }
  if (quantity !== undefined) {
    const q = Number(quantity);
    if (!Number.isInteger(q) || q < 1 || q > 50) {
      res.status(400).json({ error: 'Quantity must be 1–50.' });
      return;
    }
    patch.quantity = q;
  }
  if (imageUrl !== undefined) {
    patch.imageUrl = sanitizeImageUrl(String(imageUrl));
  }
  if (isAvailable !== undefined) {
    patch.isAvailable = Boolean(isAvailable);
  }

  try {
    const item = await updateItem(itemId, user, patch);
    res.json({ item });
  } catch (err) {
    handleError(res, err, 'Failed to update listing.');
  }
});

app.delete('/api/items/:id', requireAuth, async (req: AuthedRequest, res) => {
  try {
    await deleteItem(String(req.params.id || ''), req.user!);
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err, 'Failed to delete listing.');
  }
});

// ============================================================================
// ITEM REQUESTS, PICKUP COORDINATION & HANDOVER TRACKER
// ============================================================================
app.get('/api/requests', requireAuth, async (req: AuthedRequest, res) => {
  const scopeRaw = req.query.scope;
  const scope =
    scopeRaw === 'mine' || scopeRaw === 'incoming' || scopeRaw === 'all'
      ? scopeRaw
      : 'all';
  try {
    const reqs = await listRequestsForUser(req.user!, scope);
    res.json({ requests: reqs });
  } catch (err) {
    handleError(res, err, 'Failed to load requests.');
  }
});

app.post('/api/requests', requireAuth, async (req: AuthedRequest, res) => {
  const { itemId, message } = req.body ?? {};
  const cleanMsg = String(message || '').trim();
  const cleanItemId = String(itemId || '').trim();

  if (!cleanItemId) {
    res.status(400).json({ error: 'Missing itemId.' });
    return;
  }
  if (cleanMsg.length < 3 || cleanMsg.length > 1000) {
    res
      .status(400)
      .json({ error: 'Please include a message (3–1000 characters).' });
    return;
  }

  try {
    const request = await createRequest(req.user!, cleanItemId, cleanMsg);
    res.status(201).json({ request });
  } catch (err) {
    handleError(res, err, 'Failed to create request.');
  }
});

app.patch('/api/requests/:id', requireAuth, async (req: AuthedRequest, res) => {
  const { action } = req.body ?? {};
  if (action !== 'accept' && action !== 'reject' && action !== 'cancel') {
    res.status(400).json({ error: 'Unsupported action.' });
    return;
  }
  try {
    const request = await actOnRequest(
      String(req.params.id || ''),
      req.user!,
      action
    );
    res.json({ request });
  } catch (err) {
    handleError(res, err, 'Failed to update request.');
  }
});

app.put('/api/pickups/:requestId', requireAuth, async (req: AuthedRequest, res) => {
  const { pickupPoint, pickupDate, pickupTime, instructions } = req.body ?? {};
  if (!isValidPickupPoint(pickupPoint)) {
    res.status(400).json({ error: 'Invalid pickup point selected.' });
    return;
  }
  const cleanDate = String(pickupDate || '').trim();
  const cleanTime = String(pickupTime || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate) || !cleanTime) {
    res
      .status(400)
      .json({ error: 'Please select a valid pickup date and time.' });
    return;
  }
  const cleanNotes = String(instructions || '').trim().slice(0, 400);

  try {
    const request = await upsertPickup(
      String(req.params.requestId || ''),
      req.user!,
      {
        pickupPoint,
        pickupDate: cleanDate,
        pickupTime: cleanTime,
        instructions: cleanNotes,
      }
    );
    res.json({ request });
  } catch (err) {
    handleError(res, err, 'Failed to save pickup schedule.');
  }
});

app.post(
  '/api/handovers/:requestId/confirm',
  requireAuth,
  async (req: AuthedRequest, res) => {
    try {
      const request = await confirmHandover(
        String(req.params.requestId || ''),
        req.user!
      );
      res.json({ request });
    } catch (err) {
      handleError(res, err, 'Failed to confirm handover.');
    }
  }
);

// ============================================================================
// REPORTS ROUTE
// ============================================================================
app.post('/api/reports', requireAuth, async (req: AuthedRequest, res) => {
  const { itemId, reason, details } = req.body ?? {};
  const cleanItemId = String(itemId || '').trim();
  const cleanReason = String(reason || '').trim();

  if (!cleanItemId) {
    res.status(400).json({ error: 'Missing itemId.' });
    return;
  }
  if (cleanReason.length < 3 || cleanReason.length > 160) {
    res.status(400).json({ error: 'Please provide a brief report reason.' });
    return;
  }

  try {
    const report = await createReport(req.user!, {
      itemId: cleanItemId,
      reason: cleanReason,
      details: String(details || '').trim().slice(0, 600),
    });
    res.status(201).json({ report });
  } catch (err) {
    handleError(res, err, 'Failed to submit report.');
  }
});

// ============================================================================
// ADMIN-ONLY DASHBOARD ROUTES (Server-enforced Role Check)
// ============================================================================
app.get('/api/admin/overview', requireAdmin, async (_req, res) => {
  try {
    const overview = await getAdminOverview();
    res.json(overview);
  } catch (err) {
    handleError(res, err, 'Failed to load admin overview.');
  }
});

app.patch(
  '/api/admin/users/:id',
  requireAdmin,
  async (req: AuthedRequest, res) => {
    const { isActive } = req.body ?? {};
    if (typeof isActive !== 'boolean') {
      res.status(400).json({ error: 'isActive boolean is required.' });
      return;
    }
    try {
      const user = await adminUpdateUser(
        String(req.params.id || ''),
        req.user!.id,
        isActive
      );
      res.json({ user });
    } catch (err) {
      handleError(res, err, 'Failed to update user status.');
    }
  }
);

app.patch('/api/admin/items/:id', requireAdmin, async (req, res) => {
  const { moderationStatus } = req.body ?? {};
  if (!isValidModerationStatus(moderationStatus)) {
    res.status(400).json({ error: 'Invalid moderation status.' });
    return;
  }
  try {
    const item = await adminModerateItem(
      String(req.params.id || ''),
      moderationStatus
    );
    res.json({ item });
  } catch (err) {
    handleError(res, err, 'Failed to moderate listing.');
  }
});

app.patch('/api/admin/reports/:id', requireAdmin, async (req, res) => {
  const { status, adminNote, removeItem } = req.body ?? {};
  if (!isValidReportStatus(status)) {
    res.status(400).json({ error: 'Invalid report status.' });
    return;
  }
  try {
    const report = await adminResolveReport(String(req.params.id || ''), {
      status,
      adminNote: String(adminNote || '').trim().slice(0, 400),
      removeItem: removeItem === true,
    });
    res.json({ report });
  } catch (err) {
    handleError(res, err, 'Failed to resolve report.');
  }
});

// ============================================================================
// SERVER BOOTSTRAP (Vite Middleware in Dev / Dist in Prod)
// ============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CampusCycle server listening on http://localhost:${PORT}`);
  });
}

startServer();
