import type {
  Branch,
  ExchangeType,
  ItemCategory,
  ItemCondition,
  ModerationStatus,
  PickupPointName,
  ReportStatus,
} from '../types/campuscycle.ts';

export function isValidBranch(v: unknown): v is Branch {
  return ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'Other'].includes(String(v));
}

export function isValidCategory(v: unknown): v is ItemCategory {
  return [
    'Textbooks',
    'Lab Equipment',
    'Engineering Tools',
    'Stationery',
    'Other',
  ].includes(String(v));
}

export function isValidCondition(v: unknown): v is ItemCondition {
  return ['Like New', 'Good', 'Fair'].includes(String(v));
}

export function isValidExchangeType(v: unknown): v is ExchangeType {
  return ['Sell', 'Lend', 'Donate'].includes(String(v));
}

export function isValidPickupPoint(v: unknown): v is PickupPointName {
  return [
    'College Library',
    'Canteen',
    'Department Office',
    'Main Gate',
    'Hostel Courtyard',
    'Other',
  ].includes(String(v));
}

export function isValidModerationStatus(v: unknown): v is ModerationStatus {
  return ['active', 'flagged', 'removed'].includes(String(v));
}

export function isValidReportStatus(v: unknown): v is ReportStatus {
  return ['Open', 'Reviewed', 'Resolved', 'Dismissed'].includes(String(v));
}

export function sanitizeImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 512) return '';

  if (/^[a-zA-Z0-9/_.-]+$/.test(trimmed)) {
    if (trimmed.includes('..')) return '';
    if (
      trimmed.startsWith('/uploads/') ||
      trimmed.startsWith('/src/assets/images/')
    ) {
      return trimmed;
    }
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.username || parsed.password) return '';
    if (parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    return '';
  }
  return '';
}

export function detectImageType(
  buf: Buffer
): { ext: 'jpg' | 'png' | 'webp'; mime: string } | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return { ext: 'png', mime: 'image/png' };
  }
  if (
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { ext: 'webp', mime: 'image/webp' };
  }
  return null;
}

export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}
