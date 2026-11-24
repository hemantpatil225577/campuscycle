import test from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import {
  detectImageType,
  escapeLikePattern,
  isValidBranch,
  isValidCategory,
  isValidCondition,
  isValidExchangeType,
  isValidModerationStatus,
  isValidPickupPoint,
  isValidReportStatus,
  sanitizeImageUrl,
} from '../src/lib/validation.ts';
import {
  extractBearer,
  requireAdmin,
  requireAuth,
  type AuthedRequest,
} from '../src/middleware/auth.ts';

function createMockRes() {
  const state: { statusCode: number; body: unknown; headersSent: boolean } = {
    statusCode: 200,
    body: null,
    headersSent: false,
  };
  const res = {
    get headersSent() {
      return state.headersSent;
    },
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      state.body = payload;
      state.headersSent = true;
      return res;
    },
  } as unknown as Response;

  return { res, state };
}

test('sanitizeImageUrl allows safe relative uploads, assets, and https URLs only', () => {
  assert.equal(
    sanitizeImageUrl('/uploads/user1-abc.jpg'),
    '/uploads/user1-abc.jpg'
  );
  assert.equal(
    sanitizeImageUrl('/src/assets/images/item_textbook_clrs_1795440583070.jpg'),
    '/src/assets/images/item_textbook_clrs_1795440583070.jpg'
  );
  assert.equal(
    sanitizeImageUrl('https://cdn.example.com/book.webp'),
    'https://cdn.example.com/book.webp'
  );

  // Reject unsafe schemes, plaintext HTTP, traversal, and embedded credentials
  assert.equal(sanitizeImageUrl('javascript:alert(1)'), '');
  assert.equal(sanitizeImageUrl('data:text/html,<script>alert(1)</script>'), '');
  assert.equal(sanitizeImageUrl('http://169.254.169.254/latest/meta-data/'), '');
  assert.equal(sanitizeImageUrl('/uploads/../../etc/passwd'), '');
  assert.equal(sanitizeImageUrl('https://user:pass@evil.example.com/x.png'), '');
});

test('detectImageType validates magic bytes for JPG, PNG, and WebP only', () => {
  const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const webp = Buffer.concat([
    Buffer.from('RIFF'),
    Buffer.from([0, 0, 0, 0]),
    Buffer.from('WEBP'),
  ]);
  const htmlSpoof = Buffer.from('<script>alert(1)</script>');

  assert.deepEqual(detectImageType(jpg), { ext: 'jpg', mime: 'image/jpeg' });
  assert.deepEqual(detectImageType(png), { ext: 'png', mime: 'image/png' });
  assert.deepEqual(detectImageType(webp), { ext: 'webp', mime: 'image/webp' });
  assert.equal(detectImageType(htmlSpoof), null);
  assert.equal(detectImageType(Buffer.from([0xff, 0xd8])), null);
});

test('enum validators and SQL LIKE pattern escaping enforce domain constraints', () => {
  assert.equal(isValidBranch('CSE'), true);
  assert.equal(isValidBranch('HACK'), false);
  assert.equal(isValidCategory('Textbooks'), true);
  assert.equal(isValidCategory('Weapons'), false);
  assert.equal(isValidCondition('Like New'), true);
  assert.equal(isValidExchangeType('Donate'), true);
  assert.equal(isValidPickupPoint('College Library'), true);
  assert.equal(isValidPickupPoint('Unknown Alley'), false);
  assert.equal(isValidModerationStatus('removed'), true);
  assert.equal(isValidReportStatus('Resolved'), true);
  assert.equal(escapeLikePattern('100%_test\\'), '100\\%\\_test\\\\');
});

test('auth middleware rejects missing tokens and enforces admin role boundary', async () => {
  assert.equal(
    extractBearer({ headers: {} } as unknown as Request),
    null
  );
  assert.equal(
    extractBearer({
      headers: { authorization: 'Bearer tok-123' },
    } as unknown as Request),
    'tok-123'
  );

  const req = { headers: {} } as AuthedRequest;
  const { res, state } = createMockRes();
  let nextCalled = false;

  await requireAuth(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(state.statusCode, 401);

  const adminReq = { headers: {} } as AuthedRequest;
  const adminMock = createMockRes();
  await requireAdmin(adminReq, adminMock.res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(adminMock.state.statusCode, 401);
});

test('live HTTP security & API contract checks against local server', async (t) => {
  const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
  let reachable = false;
  try {
    const probe = await fetch(`${baseUrl}/api/health`);
    reachable = probe.ok;
  } catch {
    reachable = false;
  }

  if (!reachable) {
    t.skip('Local server is not running on port 3000');
    return;
  }

  const healthRes = await fetch(`${baseUrl}/api/health`);
  assert.equal(healthRes.status, 200);
  assert.equal(healthRes.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(healthRes.headers.get('x-powered-by'), null);
  const health = (await healthRes.json()) as { ok: boolean; authProvider: string };
  assert.equal(health.ok, true);
  assert.equal(health.authProvider, 'firebase');

  // Unauthenticated access to protected endpoints must return 401
  const protectedEndpoints: Array<[string, RequestInit]> = [
    ['/api/auth/me', { method: 'GET' }],
    ['/api/admin/overview', { method: 'GET' }],
    [
      '/api/items',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test' }),
      },
    ],
    [
      '/api/upload',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataBase64: 'abc' }),
      },
    ],
  ];

  for (const [endpoint, init] of protectedEndpoints) {
    const res = await fetch(`${baseUrl}${endpoint}`, init);
    assert.equal(res.status, 401, `${endpoint} should reject unauthenticated access`);
  }

  // Catalog search with SQL-injection payload must safely return 200 and empty/safe array
  const sqliRes = await fetch(
    `${baseUrl}/api/items?q=${encodeURIComponent("' OR '1'='1'; DROP TABLE items;--")}`
  );
  assert.equal(sqliRes.status, 200);
  const sqliJson = (await sqliRes.json()) as { items: unknown[] };
  assert.ok(Array.isArray(sqliJson.items));

  // Path traversal on /uploads must return 404
  const traversalRes = await fetch(`${baseUrl}/uploads/..%2F..%2Fpackage.json`);
  assert.equal(traversalRes.status, 404);

  // Oversized payload (>64kb) on non-upload route must be rejected with 413
  const bigBody = JSON.stringify({ title: 'x'.repeat(80 * 1024) });
  const bigRes = await fetch(`${baseUrl}/api/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: bigBody,
  });
  assert.equal(bigRes.status, 413);
});
