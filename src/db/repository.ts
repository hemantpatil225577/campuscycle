import crypto from 'node:crypto';
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  ne,
  or,
  sql,
} from 'drizzle-orm';
import { db } from './index.ts';
import {
  handovers,
  items,
  pickups,
  profiles,
  reports,
  requests,
} from './schema.ts';
import { escapeLikePattern } from '../lib/validation.ts';
import type {
  Branch,
  ExchangeType,
  HandoverRecord,
  HandoverTimelineEvent,
  ImpactStats,
  ItemCategory,
  ItemCondition,
  ItemReport,
  ItemRequest,
  ModerationStatus,
  PickupDetails,
  PickupPointName,
  Profile,
  ReportStatus,
  RequestStatus,
  ResourceItem,
  Semester,
} from '../types/campuscycle.ts';

const DEFAULT_ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL || 'hemantpatil225577@gmail.com'
)
  .trim()
  .toLowerCase();

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function toIso(d: Date | string | null | undefined): string {
  if (!d) return new Date().toISOString();
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

function toIsoOrNull(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

function mapProfile(row: typeof profiles.$inferSelect): Profile {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    college: row.college,
    branch: row.branch as Branch,
    semester: row.semester as Semester,
    contactDetails: row.contactDetails,
    role: row.role === 'admin' ? 'admin' : 'student',
    emailVerified: row.emailVerified,
    isActive: row.isActive,
    isOnboarded: row.isOnboarded,
    createdAt: toIso(row.createdAt),
  };
}

function mapItem(
  row: typeof items.$inferSelect,
  owner?: typeof profiles.$inferSelect | null
): ResourceItem {
  return {
    id: row.id,
    ownerId: row.ownerId,
    ownerName: owner?.fullName ?? 'Campus Student',
    ownerBranch: (owner?.branch ?? row.branch) as Branch,
    ownerSemester: (owner?.semester ?? row.semester) as Semester,
    ownerCollege:
      owner?.college ?? 'National Institute of Engineering & Technology',
    title: row.title,
    description: row.description,
    category: row.category as ItemCategory,
    branch: row.branch as Branch,
    semester: row.semester as Semester,
    condition: row.condition as ItemCondition,
    exchangeType: row.exchangeType as ExchangeType,
    price: row.price,
    estimatedRetailPrice: row.estimatedRetailPrice,
    quantity: row.quantity,
    imageUrl: row.imageUrl,
    isAvailable: row.isAvailable,
    moderationStatus: row.moderationStatus as ModerationStatus,
    isDemo: row.isDemo,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function buildTimelineEvent(
  status: RequestStatus,
  actorName: string,
  note: string
): HandoverTimelineEvent {
  return {
    status,
    actorName,
    note,
    timestamp: new Date().toISOString(),
  };
}

const IMAGE_PRESETS = {
  textbook: '/src/assets/images/item_textbook_clrs_1795440583070.jpg',
  mechanics: '/src/assets/images/item_mechanics_book_1795440586342.jpg',
  drafter: '/src/assets/images/item_mini_drafter_1795440583352.jpg',
  labCoat: '/src/assets/images/item_lab_coat_1795440584373.jpg',
  electronics: '/src/assets/images/item_arduino_kit_1795440583743.jpg',
  calculator: '/src/assets/images/item_scientific_calculator_1795441174905.jpg',
  stationery: '/src/assets/images/item_stationery_bundle_1795441174851.jpg',
};

let seedPromise: Promise<void> | null = null;
let starterReady = false;

export async function ensureStarterData(): Promise<void> {
  if (starterReady) return;
  if (!seedPromise) {
    seedPromise = (async () => {
      try {
        const existingProfiles = await db
          .select({ id: profiles.id })
          .from(profiles)
          .limit(1);
        if (existingProfiles.length > 0) return;

        const now = Date.now();
        const t0 = new Date(now - 1000 * 60 * 60 * 72);
        const t1 = new Date(now - 1000 * 60 * 60 * 48);
        const t2 = new Date(now - 1000 * 60 * 60 * 18);
        const t3 = new Date(now - 1000 * 60 * 60 * 4);

        await db
          .insert(profiles)
          .values([
            {
              id: 'campus-student-aarav',
              fullName: 'Aarav Mehta',
              email: 'aarav.mehta@campus.edu',
              college: 'National Institute of Engineering & Technology',
              branch: 'CSE',
              semester: 3,
              contactDetails: 'Hostel-4, Room 218',
              role: 'student',
              emailVerified: true,
              isActive: true,
              isOnboarded: true,
              createdAt: t0,
              updatedAt: t0,
            },
            {
              id: 'campus-student-priya',
              fullName: 'Priya Nair',
              email: 'priya.nair@campus.edu',
              college: 'National Institute of Engineering & Technology',
              branch: 'ECE',
              semester: 6,
              contactDetails: 'Ganga Hostel, Room 409',
              role: 'student',
              emailVerified: true,
              isActive: true,
              isOnboarded: true,
              createdAt: t0,
              updatedAt: t0,
            },
            {
              id: 'campus-student-rohan',
              fullName: 'Rohan Kulkarni',
              email: 'rohan.kulkarni@campus.edu',
              college: 'National Institute of Engineering & Technology',
              branch: 'ME',
              semester: 5,
              contactDetails: 'Hostel-2, Room 115',
              role: 'student',
              emailVerified: true,
              isActive: true,
              isOnboarded: true,
              createdAt: t0,
              updatedAt: t0,
            },
          ])
          .onConflictDoNothing();

        await db
          .insert(items)
          .values([
            {
              id: 'item-clrs-4e',
              ownerId: 'campus-student-priya',
              title: 'Data Structures & Algorithms (CLRS 4th Ed)',
              description:
                'Hardcover algorithms reference book in clean condition with zero torn pages. Includes handwritten dynamic programming and graph traversal formula sheets.',
              category: 'Textbooks',
              branch: 'CSE',
              semester: 3,
              condition: 'Like New',
              exchangeType: 'Lend',
              price: 250,
              estimatedRetailPrice: 1895,
              quantity: 1,
              imageUrl: IMAGE_PRESETS.textbook,
              isAvailable: true,
              moderationStatus: 'active',
              isDemo: false,
              createdAt: t1,
              updatedAt: t1,
            },
            {
              id: 'item-dbms-korth',
              ownerId: 'campus-student-aarav',
              title: 'Database System Concepts (Silberschatz & Korth)',
              description:
                '7th Edition DBMS textbook covering relational algebra, B+ trees, normalization, and concurrency control. Light pencil notes in Chapter 5.',
              category: 'Textbooks',
              branch: 'IT',
              semester: 4,
              condition: 'Good',
              exchangeType: 'Sell',
              price: 420,
              estimatedRetailPrice: 1290,
              quantity: 1,
              imageUrl: IMAGE_PRESETS.textbook,
              isAvailable: true,
              moderationStatus: 'active',
              isDemo: false,
              createdAt: t2,
              updatedAt: t2,
            },
            {
              id: 'item-grewal-math',
              ownerId: 'campus-student-rohan',
              title: 'Higher Engineering Mathematics (B.S. Grewal)',
              description:
                'Complete textbook for Semesters 1–3 covering Laplace transforms, Fourier series, matrices, and PDEs. Donating to a junior student.',
              category: 'Textbooks',
              branch: 'CSE',
              semester: 2,
              condition: 'Good',
              exchangeType: 'Donate',
              price: 0,
              estimatedRetailPrice: 995,
              quantity: 1,
              imageUrl: IMAGE_PRESETS.mechanics,
              isAvailable: true,
              moderationStatus: 'active',
              isDemo: false,
              createdAt: t2,
              updatedAt: t2,
            },
            {
              id: 'item-chem-labcoat',
              ownerId: 'campus-student-rohan',
              title: '100% Cotton Chemistry Lab Coat (Size M) + Goggles',
              description:
                'Freshly laundered full-sleeve cotton lab coat with anti-fog safety goggles. Mandatory for first-year Chemistry and Civil material labs.',
              category: 'Lab Equipment',
              branch: 'CE',
              semester: 1,
              condition: 'Like New',
              exchangeType: 'Donate',
              price: 0,
              estimatedRetailPrice: 850,
              quantity: 2,
              imageUrl: IMAGE_PRESETS.labCoat,
              isAvailable: true,
              moderationStatus: 'active',
              isDemo: false,
              createdAt: t1,
              updatedAt: t1,
            },
            {
              id: 'item-mini-drafter',
              ownerId: 'campus-student-rohan',
              title: 'Camlin Precision Mini-Drafter + A1 Sheet Holder',
              description:
                'Brushed stainless steel arm drafter with crisp acrylic L-scale, protractor head, and waterproof drawing sheet container.',
              category: 'Engineering Tools',
              branch: 'ME',
              semester: 1,
              condition: 'Like New',
              exchangeType: 'Lend',
              price: 150,
              estimatedRetailPrice: 980,
              quantity: 1,
              imageUrl: IMAGE_PRESETS.drafter,
              isAvailable: false,
              moderationStatus: 'active',
              isDemo: false,
              createdAt: t0,
              updatedAt: t3,
            },
            {
              id: 'item-casio-991ex',
              ownerId: 'campus-student-priya',
              title: 'Casio fx-991EX ClassWiz Scientific Calculator',
              description:
                'Exam-permitted non-programmable scientific calculator with protective slide cover. Supports matrices, complex numbers, and statistics.',
              category: 'Engineering Tools',
              branch: 'ECE',
              semester: 2,
              condition: 'Like New',
              exchangeType: 'Sell',
              price: 580,
              estimatedRetailPrice: 1495,
              quantity: 1,
              imageUrl: IMAGE_PRESETS.calculator,
              isAvailable: true,
              moderationStatus: 'active',
              isDemo: false,
              createdAt: t3,
              updatedAt: t3,
            },
            {
              id: 'item-arduino-kit',
              ownerId: 'campus-student-priya',
              title: 'Arduino Uno R3, Breadboard & Digital Multimeter Lab Kit',
              description:
                'Tested embedded electronics toolkit with 830-pin breadboard, jumper wires, resistor pack, LEDs, and Mastech digital multimeter.',
              category: 'Lab Equipment',
              branch: 'EEE',
              semester: 4,
              condition: 'Good',
              exchangeType: 'Lend',
              price: 300,
              estimatedRetailPrice: 2450,
              quantity: 1,
              imageUrl: IMAGE_PRESETS.electronics,
              isAvailable: true,
              moderationStatus: 'active',
              isDemo: false,
              createdAt: t1,
              updatedAt: t1,
            },
            {
              id: 'item-graph-pack',
              ownerId: 'campus-student-aarav',
              title: 'Engineering Graph Notebooks, Set Squares & Steel Scale Pack',
              description:
                'Unused A4 grid notebooks, 30/60/45 set squares, 30cm stainless steel ruler, and 0.5mm drafting pens.',
              category: 'Stationery',
              branch: 'CE',
              semester: 2,
              condition: 'Like New',
              exchangeType: 'Sell',
              price: 180,
              estimatedRetailPrice: 620,
              quantity: 1,
              imageUrl: IMAGE_PRESETS.stationery,
              isAvailable: true,
              moderationStatus: 'active',
              isDemo: false,
              createdAt: t3,
              updatedAt: t3,
            },
            {
              id: 'item-thermo-bundle',
              ownerId: 'campus-student-rohan',
              title: 'Engineering Thermodynamics (Cengel) + Mechanics (Hibbeler)',
              description:
                'Two-volume mechanical engineering reference bundle with official Steam Tables and Mollier chart insert.',
              category: 'Textbooks',
              branch: 'ME',
              semester: 3,
              condition: 'Good',
              exchangeType: 'Sell',
              price: 490,
              estimatedRetailPrice: 1740,
              quantity: 1,
              imageUrl: IMAGE_PRESETS.mechanics,
              isAvailable: false,
              moderationStatus: 'active',
              isDemo: false,
              createdAt: t0,
              updatedAt: t2,
            },
          ])
          .onConflictDoNothing();

        await db
          .insert(requests)
          .values([
            {
              id: 'req-seed-drafter',
              itemId: 'item-mini-drafter',
              ownerId: 'campus-student-rohan',
              borrowerId: 'campus-student-aarav',
              message:
                'Hi Rohan, can I borrow the drafter for this semester EG lab? Happy to pick it up from Central Library.',
              status: 'Pickup Scheduled',
              isDemo: false,
              createdAt: t2,
              updatedAt: t3,
            },
            {
              id: 'req-seed-thermo',
              itemId: 'item-thermo-bundle',
              ownerId: 'campus-student-rohan',
              borrowerId: 'campus-student-priya',
              message: 'Purchasing for my open elective in thermal systems.',
              status: 'Completed',
              isDemo: false,
              createdAt: t0,
              updatedAt: t2,
            },
          ])
          .onConflictDoNothing();

        await db
          .insert(pickups)
          .values([
            {
              id: 'pickup-seed-drafter',
              requestId: 'req-seed-drafter',
              pickupPoint: 'College Library',
              pickupDate: new Date(now + 86400000).toISOString().slice(0, 10),
              pickupTime: '16:30',
              instructions: 'Meet at the Nalanda Library ground floor reading bench.',
              updatedBy: 'campus-student-rohan',
              updatedAt: t3,
            },
            {
              id: 'pickup-seed-thermo',
              requestId: 'req-seed-thermo',
              pickupPoint: 'Department Office',
              pickupDate: t1.toISOString().slice(0, 10),
              pickupTime: '13:15',
              instructions: 'Outside Mechanical Dept notice board.',
              updatedBy: 'campus-student-priya',
              updatedAt: t1,
            },
          ])
          .onConflictDoNothing();

        await db
          .insert(handovers)
          .values([
            {
              id: 'ho-seed-drafter',
              requestId: 'req-seed-drafter',
              itemId: 'item-mini-drafter',
              ownerId: 'campus-student-rohan',
              borrowerId: 'campus-student-aarav',
              status: 'Pickup Scheduled',
              ownerConfirmed: false,
              borrowerConfirmed: false,
              ownerConfirmedAt: null,
              borrowerConfirmedAt: null,
              completedAt: null,
              timeline: [
                {
                  status: 'Requested',
                  actorName: 'Aarav Mehta',
                  note: 'Requested mini-drafter for Engineering Graphics lab.',
                  timestamp: t2.toISOString(),
                },
                {
                  status: 'Reserved',
                  actorName: 'Rohan Kulkarni',
                  note: 'Accepted request and reserved drafter.',
                  timestamp: t3.toISOString(),
                },
                {
                  status: 'Pickup Scheduled',
                  actorName: 'Rohan Kulkarni',
                  note: 'Scheduled pickup at College Library at 16:30.',
                  timestamp: t3.toISOString(),
                },
              ],
              updatedAt: t3,
            },
            {
              id: 'ho-seed-thermo',
              requestId: 'req-seed-thermo',
              itemId: 'item-thermo-bundle',
              ownerId: 'campus-student-rohan',
              borrowerId: 'campus-student-priya',
              status: 'Completed',
              ownerConfirmed: true,
              borrowerConfirmed: true,
              ownerConfirmedAt: t2,
              borrowerConfirmedAt: t2,
              completedAt: t2,
              timeline: [
                {
                  status: 'Requested',
                  actorName: 'Priya Nair',
                  note: 'Needed Thermodynamics reference for interdisciplinary elective.',
                  timestamp: t0.toISOString(),
                },
                {
                  status: 'Reserved',
                  actorName: 'Rohan Kulkarni',
                  note: 'Accepted request.',
                  timestamp: t1.toISOString(),
                },
                {
                  status: 'Pickup Scheduled',
                  actorName: 'Priya Nair',
                  note: 'Coordinated at Department Office.',
                  timestamp: t1.toISOString(),
                },
                {
                  status: 'Handed Over',
                  actorName: 'Rohan Kulkarni',
                  note: 'Owner confirmed handing over the bundle.',
                  timestamp: t2.toISOString(),
                },
                {
                  status: 'Completed',
                  actorName: 'Priya Nair',
                  note: 'Borrower confirmed receipt. Exchange completed.',
                  timestamp: t2.toISOString(),
                },
              ],
              updatedAt: t2,
            },
          ])
          .onConflictDoNothing();
      } catch (error) {
        seedPromise = null;
        console.error('Starter seed skipped or failed:', error);
        throw new Error('Database initialization failed.', { cause: error });
      }
    })();
  }
  await seedPromise;
  starterReady = true;
}

export async function getOrCreateProfile(input: {
  uid: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
}): Promise<Profile> {
  try {
    await ensureStarterData();
    const cleanEmail = input.email.trim().toLowerCase();
    const isBootstrapAdmin = cleanEmail === DEFAULT_ADMIN_EMAIL;

    const existing = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, input.uid))
      .limit(1);

    if (existing.length > 0) {
      const current = existing[0];
      const nextRole =
        isBootstrapAdmin && current.role !== 'admin' ? 'admin' : current.role;
      const nextVerified = input.emailVerified || current.emailVerified;

      if (
        current.email === cleanEmail &&
        current.emailVerified === nextVerified &&
        current.role === nextRole
      ) {
        return mapProfile(current);
      }

      const [updated] = await db
        .update(profiles)
        .set({
          email: cleanEmail,
          emailVerified: nextVerified,
          role: nextRole,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, input.uid))
        .returning();
      return mapProfile(updated);
    }

    const [inserted] = await db
      .insert(profiles)
      .values({
        id: input.uid,
        fullName: input.fullName.trim() || cleanEmail.split('@')[0],
        email: cleanEmail,
        college: 'National Institute of Engineering & Technology',
        branch: 'CSE',
        semester: 3,
        contactDetails: '',
        role: isBootstrapAdmin ? 'admin' : 'student',
        emailVerified: input.emailVerified,
        isActive: true,
        isOnboarded: false,
      })
      .onConflictDoUpdate({
        target: profiles.id,
        set: {
          email: cleanEmail,
          emailVerified: input.emailVerified,
          updatedAt: new Date(),
        },
      })
      .returning();

    return mapProfile(inserted);
  } catch (error) {
    console.error('getOrCreateProfile failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}

export async function updateProfile(
  userId: string,
  patch: {
    fullName?: string;
    college?: string;
    branch?: Branch;
    semester?: Semester;
    contactDetails?: string;
  }
): Promise<Profile> {
  try {
    const updateSet: Partial<typeof profiles.$inferInsert> = {
      isOnboarded: true,
      updatedAt: new Date(),
    };
    if (patch.fullName !== undefined) updateSet.fullName = patch.fullName;
    if (patch.college !== undefined) updateSet.college = patch.college;
    if (patch.branch !== undefined) updateSet.branch = patch.branch;
    if (patch.semester !== undefined) updateSet.semester = patch.semester;
    if (patch.contactDetails !== undefined) {
      updateSet.contactDetails = patch.contactDetails;
    }

    const [updated] = await db
      .update(profiles)
      .set(updateSet)
      .where(eq(profiles.id, userId))
      .returning();

    if (!updated) throw new HttpError(404, 'Profile not found.');
    return mapProfile(updated);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error('updateProfile failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}

export async function getImpactStats(): Promise<ImpactStats> {
  try {
    await ensureStarterData();

    const completedRows = await db
      .select({
        price: items.price,
        estimatedRetailPrice: items.estimatedRetailPrice,
      })
      .from(requests)
      .innerJoin(items, eq(requests.itemId, items.id))
      .where(eq(requests.status, 'Completed'));

    const estimatedSavingsInr = completedRows.reduce(
      (sum, row) =>
        sum + Math.max(0, row.estimatedRetailPrice - row.price),
      0
    );

    const [{ activeCount }] = await db
      .select({ activeCount: sql<number>`count(*)::int` })
      .from(items)
      .where(
        and(eq(items.isAvailable, true), eq(items.moderationStatus, 'active'))
      );

    const [{ studentCount }] = await db
      .select({ studentCount: sql<number>`count(*)::int` })
      .from(profiles)
      .where(and(eq(profiles.role, 'student'), eq(profiles.isActive, true)));

    return {
      completedExchanges: completedRows.length,
      resourcesReused: completedRows.length,
      estimatedSavingsInr,
      activeListings: activeCount ?? 0,
      registeredStudents: studentCount ?? 0,
      disclaimer:
        'Estimated savings reflect the difference between recorded retail reference prices and peer exchange amounts, not audited financial outcomes.',
    };
  } catch (error) {
    console.error('getImpactStats failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}

export async function listItems(query: {
  q?: string;
  branch?: Branch | 'ALL';
  semester?: Semester | 'ALL';
  category?: ItemCategory | 'ALL';
  condition?: ItemCondition | 'ALL';
  exchangeType?: ExchangeType | 'ALL';
  availableOnly?: boolean;
  sort?: 'newest' | 'price-asc' | 'price-desc';
  ownerId?: string;
  includeModerated?: boolean;
}): Promise<ResourceItem[]> {
  try {
    await ensureStarterData();

    const conditions = [];
    if (!query.includeModerated) {
      conditions.push(eq(items.moderationStatus, 'active'));
    }
    if (query.ownerId) {
      conditions.push(eq(items.ownerId, query.ownerId));
    }
    if (query.branch && query.branch !== 'ALL') {
      conditions.push(eq(items.branch, query.branch));
    }
    if (query.semester && query.semester !== 'ALL') {
      conditions.push(eq(items.semester, query.semester));
    }
    if (query.category && query.category !== 'ALL') {
      conditions.push(eq(items.category, query.category));
    }
    if (query.condition && query.condition !== 'ALL') {
      conditions.push(eq(items.condition, query.condition));
    }
    if (query.exchangeType && query.exchangeType !== 'ALL') {
      conditions.push(eq(items.exchangeType, query.exchangeType));
    }
    if (query.availableOnly) {
      conditions.push(eq(items.isAvailable, true));
    }
    const needle = (query.q ?? '').trim();
    if (needle) {
      const pattern = `%${escapeLikePattern(needle)}%`;
      conditions.push(
        or(
          ilike(items.title, pattern),
          ilike(items.description, pattern),
          ilike(items.category, pattern),
          ilike(items.branch, pattern)
        )!
      );
    }

    const orderExpr =
      query.sort === 'price-asc'
        ? asc(items.price)
        : query.sort === 'price-desc'
          ? desc(items.price)
          : desc(items.createdAt);

    const rows = await db
      .select({
        item: items,
        owner: profiles,
      })
      .from(items)
      .leftJoin(profiles, eq(items.ownerId, profiles.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderExpr, desc(items.createdAt));

    return rows.map((r) => mapItem(r.item, r.owner));
  } catch (error) {
    console.error('listItems failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}

export async function getItemById(id: string): Promise<ResourceItem | null> {
  try {
    await ensureStarterData();
    const rows = await db
      .select({
        item: items,
        owner: profiles,
      })
      .from(items)
      .leftJoin(profiles, eq(items.ownerId, profiles.id))
      .where(eq(items.id, id))
      .limit(1);
    if (rows.length === 0) return null;
    return mapItem(rows[0].item, rows[0].owner);
  } catch (error) {
    console.error('getItemById failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}

export async function createItem(
  owner: Profile,
  input: {
    title: string;
    description: string;
    category: ItemCategory;
    branch: Branch;
    semester: Semester;
    condition: ItemCondition;
    exchangeType: ExchangeType;
    price: number;
    estimatedRetailPrice: number;
    quantity: number;
    imageUrl: string;
    isAvailable: boolean;
  }
): Promise<ResourceItem> {
  try {
    const id = `item-${crypto.randomUUID()}`;
    const now = new Date();
    const [inserted] = await db
      .insert(items)
      .values({
        id,
        ownerId: owner.id,
        title: input.title,
        description: input.description,
        category: input.category,
        branch: input.branch,
        semester: input.semester,
        condition: input.condition,
        exchangeType: input.exchangeType,
        price: input.price,
        estimatedRetailPrice: input.estimatedRetailPrice,
        quantity: input.quantity,
        imageUrl: input.imageUrl,
        isAvailable: input.isAvailable,
        moderationStatus: 'active',
        isDemo: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const full = await getItemById(inserted.id);
    if (!full) throw new HttpError(500, 'Created listing could not be loaded.');
    return full;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error('createItem failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}

const ACTIVE_HOLD_STATUSES = [
  'Accepted',
  'Reserved',
  'Pickup Scheduled',
  'Handed Over',
];

export async function updateItem(
  itemId: string,
  actor: Profile,
  patch: Partial<{
    title: string;
    description: string;
    category: ItemCategory;
    branch: Branch;
    semester: Semester;
    condition: ItemCondition;
    exchangeType: ExchangeType;
    price: number;
    estimatedRetailPrice: number;
    quantity: number;
    imageUrl: string;
    isAvailable: boolean;
  }>
): Promise<ResourceItem> {
  try {
    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(items)
        .where(eq(items.id, itemId))
        .limit(1);

      if (!existing) throw new HttpError(404, 'Listing not found.');
      if (existing.ownerId !== actor.id && actor.role !== 'admin') {
        throw new HttpError(403, 'Only the listing owner can edit this item.');
      }

      if (patch.isAvailable === true) {
        const holds = await tx
          .select({ id: requests.id })
          .from(requests)
          .where(
            and(
              eq(requests.itemId, itemId),
              inArray(requests.status, ACTIVE_HOLD_STATUSES)
            )
          )
          .limit(1);
        if (holds.length > 0) {
          throw new HttpError(
            409,
            'Cannot mark available while an active reservation or handover is in progress.'
          );
        }
      }

      const updateValues: Partial<typeof items.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (patch.title !== undefined) updateValues.title = patch.title;
      if (patch.description !== undefined)
        updateValues.description = patch.description;
      if (patch.category !== undefined) updateValues.category = patch.category;
      if (patch.branch !== undefined) updateValues.branch = patch.branch;
      if (patch.semester !== undefined) updateValues.semester = patch.semester;
      if (patch.condition !== undefined) updateValues.condition = patch.condition;
      if (patch.exchangeType !== undefined) {
        updateValues.exchangeType = patch.exchangeType;
        if (patch.exchangeType === 'Donate') updateValues.price = 0;
      }
      if (
        patch.price !== undefined &&
        (patch.exchangeType ?? existing.exchangeType) !== 'Donate'
      ) {
        updateValues.price = patch.price;
      }
      if (patch.estimatedRetailPrice !== undefined) {
        updateValues.estimatedRetailPrice = patch.estimatedRetailPrice;
      }
      if (patch.quantity !== undefined) updateValues.quantity = patch.quantity;
      if (patch.imageUrl !== undefined) updateValues.imageUrl = patch.imageUrl;
      if (patch.isAvailable !== undefined) {
        updateValues.isAvailable = patch.isAvailable;
      }

      await tx.update(items).set(updateValues).where(eq(items.id, itemId));
    });

    const updated = await getItemById(itemId);
    if (!updated) throw new HttpError(404, 'Listing not found.');
    return updated;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error('updateItem failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}

export async function deleteItem(
  itemId: string,
  actor: Profile
): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(items)
        .where(eq(items.id, itemId))
        .limit(1);

      if (!existing) throw new HttpError(404, 'Listing not found.');
      if (existing.ownerId !== actor.id && actor.role !== 'admin') {
        throw new HttpError(
          403,
          'Only the listing owner or admin can delete this item.'
        );
      }

      const holds = await tx
        .select({ id: requests.id })
        .from(requests)
        .where(
          and(
            eq(requests.itemId, itemId),
            inArray(requests.status, ACTIVE_HOLD_STATUSES)
          )
        )
        .limit(1);
      if (holds.length > 0 && actor.role !== 'admin') {
        throw new HttpError(
          409,
          'Cancel the active reservation or handover before deleting this listing.'
        );
      }

      await tx.delete(items).where(eq(items.id, itemId));
    });
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error('deleteItem failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}

async function hydrateRequests(
  reqRows: (typeof requests.$inferSelect)[]
): Promise<ItemRequest[]> {
  if (reqRows.length === 0) return [];

  const reqIds = reqRows.map((r) => r.id);
  const itemIds = [...new Set(reqRows.map((r) => r.itemId))];
  const userIds = [
    ...new Set(reqRows.flatMap((r) => [r.ownerId, r.borrowerId])),
  ];

  const [itemRows, profileRows, pickupRows, handoverRows] = await Promise.all([
    db.select().from(items).where(inArray(items.id, itemIds)),
    db.select().from(profiles).where(inArray(profiles.id, userIds)),
    db.select().from(pickups).where(inArray(pickups.requestId, reqIds)),
    db.select().from(handovers).where(inArray(handovers.requestId, reqIds)),
  ]);

  const itemMap = new Map(itemRows.map((i) => [i.id, i]));
  const profileMap = new Map(profileRows.map((p) => [p.id, p]));
  const pickupMap = new Map(pickupRows.map((p) => [p.requestId, p]));
  const handoverMap = new Map(handoverRows.map((h) => [h.requestId, h]));

  const extraUpdaterIds = [
    ...new Set(
      pickupRows
        .map((p) => p.updatedBy)
        .filter((uid) => !profileMap.has(uid))
    ),
  ];
  if (extraUpdaterIds.length > 0) {
    const extraProfiles = await db
      .select()
      .from(profiles)
      .where(inArray(profiles.id, extraUpdaterIds));
    for (const p of extraProfiles) profileMap.set(p.id, p);
  }

  return reqRows.map((r) => {
    const item = itemMap.get(r.itemId);
    const owner = profileMap.get(r.ownerId);
    const borrower = profileMap.get(r.borrowerId);
    const pickupRow = pickupMap.get(r.id);
    const hoRow = handoverMap.get(r.id);

    const pickup: PickupDetails | null = pickupRow
      ? {
          id: pickupRow.id,
          requestId: pickupRow.requestId,
          pickupPoint: pickupRow.pickupPoint as PickupPointName,
          pickupDate: pickupRow.pickupDate,
          pickupTime: pickupRow.pickupTime,
          instructions: pickupRow.instructions,
          updatedBy: pickupRow.updatedBy,
          updatedByName:
            profileMap.get(pickupRow.updatedBy)?.fullName ?? 'Participant',
          updatedAt: toIso(pickupRow.updatedAt),
        }
      : null;

    const handover: HandoverRecord | null = hoRow
      ? {
          id: hoRow.id,
          requestId: hoRow.requestId,
          itemId: hoRow.itemId,
          ownerId: hoRow.ownerId,
          borrowerId: hoRow.borrowerId,
          status: hoRow.status as RequestStatus,
          ownerConfirmed: hoRow.ownerConfirmed,
          borrowerConfirmed: hoRow.borrowerConfirmed,
          ownerConfirmedAt: toIsoOrNull(hoRow.ownerConfirmedAt),
          borrowerConfirmedAt: toIsoOrNull(hoRow.borrowerConfirmedAt),
          completedAt: toIsoOrNull(hoRow.completedAt),
          timeline: Array.isArray(hoRow.timeline) ? hoRow.timeline : [],
        }
      : null;

    return {
      id: r.id,
      itemId: r.itemId,
      itemTitle: item?.title ?? 'Academic Resource',
      itemImageUrl: item?.imageUrl ?? '',
      itemCategory: (item?.category ?? 'Other') as ItemCategory,
      itemBranch: (item?.branch ?? 'CSE') as Branch,
      itemSemester: (item?.semester ?? 1) as Semester,
      itemExchangeType: (item?.exchangeType ?? 'Sell') as ExchangeType,
      itemPrice: item?.price ?? 0,
      itemEstimatedRetailPrice: item?.estimatedRetailPrice ?? 0,
      ownerId: r.ownerId,
      ownerName: owner?.fullName ?? 'Listing Owner',
      borrowerId: r.borrowerId,
      borrowerName: borrower?.fullName ?? 'Student',
      borrowerBranch: (borrower?.branch ?? 'CSE') as Branch,
      borrowerSemester: (borrower?.semester ?? 1) as Semester,
      message: r.message,
      status: r.status as RequestStatus,
      isDemo: r.isDemo,
      createdAt: toIso(r.createdAt),
      updatedAt: toIso(r.updatedAt),
      pickup,
      handover,
    };
  });
}

async function getHydratedRequestById(
  requestId: string
): Promise<ItemRequest | null> {
  const rows = await db
    .select()
    .from(requests)
    .where(eq(requests.id, requestId))
    .limit(1);
  if (rows.length === 0) return null;
  const hydrated = await hydrateRequests(rows);
  return hydrated[0] ?? null;
}

export async function listRequestsForUser(
  user: Profile,
  scope: 'mine' | 'incoming' | 'all'
): Promise<ItemRequest[]> {
  try {
    await ensureStarterData();

    let whereClause;
    if (scope === 'mine') {
      whereClause = eq(requests.borrowerId, user.id);
    } else if (scope === 'incoming') {
      whereClause = eq(requests.ownerId, user.id);
    } else if (user.role === 'admin' && scope === 'all') {
      whereClause = undefined;
    } else {
      whereClause = or(
        eq(requests.borrowerId, user.id),
        eq(requests.ownerId, user.id)
      );
    }

    const rows = await db
      .select()
      .from(requests)
      .where(whereClause)
      .orderBy(desc(requests.updatedAt));

    return await hydrateRequests(rows);
  } catch (error) {
    console.error('listRequestsForUser failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}

export async function createRequest(
  borrower: Profile,
  itemId: string,
  message: string
): Promise<ItemRequest> {
  try {
    const reqId = `req-${crypto.randomUUID()}`;
    const hoId = `ho-${crypto.randomUUID()}`;

    await db.transaction(async (tx) => {
      const [item] = await tx
        .select()
        .from(items)
        .where(eq(items.id, itemId))
        .limit(1);

      if (!item || item.moderationStatus !== 'active') {
        throw new HttpError(404, 'Requested item was not found.');
      }
      if (item.ownerId === borrower.id) {
        throw new HttpError(400, 'You cannot request your own listing.');
      }
      if (!item.isAvailable) {
        throw new HttpError(
          409,
          'This item is currently reserved or unavailable.'
        );
      }

      const dup = await tx
        .select({ id: requests.id })
        .from(requests)
        .where(
          and(
            eq(requests.itemId, item.id),
            eq(requests.borrowerId, borrower.id),
            inArray(requests.status, ['Requested', ...ACTIVE_HOLD_STATUSES])
          )
        )
        .limit(1);

      if (dup.length > 0) {
        throw new HttpError(
          409,
          'You already have an active request for this item.'
        );
      }

      const now = new Date();
      await tx.insert(requests).values({
        id: reqId,
        itemId: item.id,
        ownerId: item.ownerId,
        borrowerId: borrower.id,
        message,
        status: 'Requested',
        isDemo: false,
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(handovers).values({
        id: hoId,
        requestId: reqId,
        itemId: item.id,
        ownerId: item.ownerId,
        borrowerId: borrower.id,
        status: 'Requested',
        ownerConfirmed: false,
        borrowerConfirmed: false,
        timeline: [buildTimelineEvent('Requested', borrower.fullName, message)],
        updatedAt: now,
      });
    });

    const created = await getHydratedRequestById(reqId);
    if (!created) throw new HttpError(500, 'Unable to load created request.');
    return created;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error('createRequest failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}

export async function actOnRequest(
  requestId: string,
  user: Profile,
  action: 'accept' | 'reject' | 'cancel'
): Promise<ItemRequest> {
  try {
    await db.transaction(async (tx) => {
      const [target] = await tx
        .select()
        .from(requests)
        .where(eq(requests.id, requestId))
        .for('update')
        .limit(1);

      if (!target) throw new HttpError(404, 'Request not found.');
      if (
        target.ownerId !== user.id &&
        target.borrowerId !== user.id &&
        user.role !== 'admin'
      ) {
        throw new HttpError(403, 'Not authorized to update this request.');
      }

      const [ho] = await tx
        .select()
        .from(handovers)
        .where(eq(handovers.requestId, target.id))
        .for('update')
        .limit(1);

      const now = new Date();

      if (action === 'accept') {
        if (target.ownerId !== user.id && user.role !== 'admin') {
          throw new HttpError(403, 'Only the item owner can accept requests.');
        }
        if (target.status !== 'Requested') {
          throw new HttpError(
            409,
            `Cannot accept a request in status "${target.status}".`
          );
        }

        const [itemRow] = await tx
          .select()
          .from(items)
          .where(eq(items.id, target.itemId))
          .for('update')
          .limit(1);

        const conflicting = await tx
          .select({ id: requests.id })
          .from(requests)
          .where(
            and(
              ne(requests.id, target.id),
              eq(requests.itemId, target.itemId),
              inArray(requests.status, ACTIVE_HOLD_STATUSES)
            )
          )
          .limit(1);

        if (conflicting.length > 0 || (itemRow && !itemRow.isAvailable)) {
          throw new HttpError(
            409,
            'This item is already reserved by another accepted request.'
          );
        }

        await tx
          .update(requests)
          .set({ status: 'Reserved', updatedAt: now })
          .where(eq(requests.id, target.id));

        if (itemRow) {
          await tx
            .update(items)
            .set({ isAvailable: false, updatedAt: now })
            .where(eq(items.id, itemRow.id));
        }

        if (ho) {
          const nextTimeline = [
            ...(Array.isArray(ho.timeline) ? ho.timeline : []),
            buildTimelineEvent(
              'Accepted',
              user.fullName,
              'Owner accepted request.'
            ),
            buildTimelineEvent(
              'Reserved',
              user.fullName,
              'Item reserved for borrower.'
            ),
          ];
          await tx
            .update(handovers)
            .set({
              status: 'Reserved',
              timeline: nextTimeline,
              updatedAt: now,
            })
            .where(eq(handovers.id, ho.id));
        }

        // Safely reject competing open requests for the same listing
        const competingReqs = await tx
          .select()
          .from(requests)
          .where(
            and(
              ne(requests.id, target.id),
              eq(requests.itemId, target.itemId),
              eq(requests.status, 'Requested')
            )
          );

        for (const other of competingReqs) {
          await tx
            .update(requests)
            .set({ status: 'Rejected', updatedAt: now })
            .where(eq(requests.id, other.id));
          const [otherHo] = await tx
            .select()
            .from(handovers)
            .where(eq(handovers.requestId, other.id))
            .limit(1);
          if (otherHo) {
            await tx
              .update(handovers)
              .set({
                status: 'Cancelled',
                timeline: [
                  ...(Array.isArray(otherHo.timeline) ? otherHo.timeline : []),
                  buildTimelineEvent(
                    'Rejected',
                    user.fullName,
                    'Another request for this item was accepted.'
                  ),
                ],
                updatedAt: now,
              })
              .where(eq(handovers.id, otherHo.id));
          }
        }
        return;
      }

      if (action === 'reject') {
        if (target.ownerId !== user.id && user.role !== 'admin') {
          throw new HttpError(403, 'Only the item owner can reject requests.');
        }
        if (target.status !== 'Requested') {
          throw new HttpError(409, 'Only pending requests can be rejected.');
        }

        await tx
          .update(requests)
          .set({ status: 'Rejected', updatedAt: now })
          .where(eq(requests.id, target.id));

        if (ho) {
          await tx
            .update(handovers)
            .set({
              status: 'Cancelled',
              timeline: [
                ...(Array.isArray(ho.timeline) ? ho.timeline : []),
                buildTimelineEvent(
                  'Rejected',
                  user.fullName,
                  'Request declined by owner.'
                ),
              ],
              updatedAt: now,
            })
            .where(eq(handovers.id, ho.id));
        }
        return;
      }

      if (action === 'cancel') {
        if (['Completed', 'Cancelled', 'Rejected'].includes(target.status)) {
          throw new HttpError(409, 'This request is already closed.');
        }
        const wasHoldingReservation = ACTIVE_HOLD_STATUSES.includes(
          target.status
        );

        await tx
          .update(requests)
          .set({ status: 'Cancelled', updatedAt: now })
          .where(eq(requests.id, target.id));

        if (ho) {
          await tx
            .update(handovers)
            .set({
              status: 'Cancelled',
              timeline: [
                ...(Array.isArray(ho.timeline) ? ho.timeline : []),
                buildTimelineEvent(
                  'Cancelled',
                  user.fullName,
                  wasHoldingReservation
                    ? 'Cancelled and reservation safely released.'
                    : 'Request withdrawn.'
                ),
              ],
              updatedAt: now,
            })
            .where(eq(handovers.id, ho.id));
        }

        if (wasHoldingReservation) {
          await tx
            .update(items)
            .set({ isAvailable: true, updatedAt: now })
            .where(eq(items.id, target.itemId));
        }
        return;
      }

      throw new HttpError(400, 'Unsupported action.');
    });

    const updated = await getHydratedRequestById(requestId);
    if (!updated) throw new HttpError(404, 'Request not found.');
    return updated;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error('actOnRequest failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}

export async function upsertPickup(
  requestId: string,
  user: Profile,
  input: {
    pickupPoint: PickupPointName;
    pickupDate: string;
    pickupTime: string;
    instructions: string;
  }
): Promise<ItemRequest> {
  try {
    await db.transaction(async (tx) => {
      const [target] = await tx
        .select()
        .from(requests)
        .where(eq(requests.id, requestId))
        .limit(1);

      if (!target) throw new HttpError(404, 'Request not found.');
      if (
        target.ownerId !== user.id &&
        target.borrowerId !== user.id &&
        user.role !== 'admin'
      ) {
        throw new HttpError(403, 'Only participants can coordinate pickup.');
      }
      if (
        !['Accepted', 'Reserved', 'Pickup Scheduled'].includes(target.status)
      ) {
        throw new HttpError(
          409,
          'Pickup coordination is only available for reserved requests.'
        );
      }

      const now = new Date();
      await tx
        .insert(pickups)
        .values({
          id: `pickup-${crypto.randomUUID()}`,
          requestId: target.id,
          pickupPoint: input.pickupPoint,
          pickupDate: input.pickupDate,
          pickupTime: input.pickupTime,
          instructions: input.instructions,
          updatedBy: user.id,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: pickups.requestId,
          set: {
            pickupPoint: input.pickupPoint,
            pickupDate: input.pickupDate,
            pickupTime: input.pickupTime,
            instructions: input.instructions,
            updatedBy: user.id,
            updatedAt: now,
          },
        });

      await tx
        .update(requests)
        .set({ status: 'Pickup Scheduled', updatedAt: now })
        .where(eq(requests.id, target.id));

      const [ho] = await tx
        .select()
        .from(handovers)
        .where(eq(handovers.requestId, target.id))
        .limit(1);

      if (ho) {
        await tx
          .update(handovers)
          .set({
            status: 'Pickup Scheduled',
            timeline: [
              ...(Array.isArray(ho.timeline) ? ho.timeline : []),
              buildTimelineEvent(
                'Pickup Scheduled',
                user.fullName,
                `${input.pickupPoint} on ${input.pickupDate} at ${input.pickupTime}`
              ),
            ],
            updatedAt: now,
          })
          .where(eq(handovers.id, ho.id));
      }
    });

    const updated = await getHydratedRequestById(requestId);
    if (!updated) throw new HttpError(404, 'Request not found.');
    return updated;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error('upsertPickup failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}

export async function confirmHandover(
  requestId: string,
  user: Profile
): Promise<ItemRequest> {
  try {
    await db.transaction(async (tx) => {
      const [target] = await tx
        .select()
        .from(requests)
        .where(eq(requests.id, requestId))
        .for('update')
        .limit(1);

      const [ho] = await tx
        .select()
        .from(handovers)
        .where(eq(handovers.requestId, requestId))
        .for('update')
        .limit(1);

      if (!target || !ho) {
        throw new HttpError(404, 'Handover record not found.');
      }
      if (target.ownerId !== user.id && target.borrowerId !== user.id) {
        throw new HttpError(
          403,
          'Only transaction participants can confirm handover.'
        );
      }
      if (!ACTIVE_HOLD_STATUSES.includes(target.status)) {
        throw new HttpError(409, 'Handover is not active.');
      }

      const now = new Date();
      let ownerConfirmed = ho.ownerConfirmed;
      let borrowerConfirmed = ho.borrowerConfirmed;
      let ownerConfirmedAt = ho.ownerConfirmedAt;
      let borrowerConfirmedAt = ho.borrowerConfirmedAt;
      let completedAt = ho.completedAt;
      let nextStatus: RequestStatus = target.status as RequestStatus;
      const timeline = [...(Array.isArray(ho.timeline) ? ho.timeline : [])];

      if (user.id === target.ownerId) {
        if (ownerConfirmed) {
          throw new HttpError(409, 'Owner has already confirmed handover.');
        }
        ownerConfirmed = true;
        ownerConfirmedAt = now;
        if (!borrowerConfirmed) {
          nextStatus = 'Handed Over';
          timeline.push(
            buildTimelineEvent(
              'Handed Over',
              user.fullName,
              'Owner confirmed handing over the item. Awaiting borrower receipt confirmation.'
            )
          );
        }
      } else if (user.id === target.borrowerId) {
        if (borrowerConfirmed) {
          throw new HttpError(409, 'Borrower has already confirmed receipt.');
        }
        borrowerConfirmed = true;
        borrowerConfirmedAt = now;
        if (!ownerConfirmed) {
          nextStatus = 'Handed Over';
          timeline.push(
            buildTimelineEvent(
              'Handed Over',
              user.fullName,
              'Borrower confirmed receipt. Awaiting owner handover confirmation to complete.'
            )
          );
        }
      }

      if (ownerConfirmed && borrowerConfirmed) {
        nextStatus = 'Completed';
        completedAt = now;
        timeline.push(
          buildTimelineEvent(
            'Completed',
            user.fullName,
            'Both owner handover and borrower receipt confirmed. Exchange completed.'
          )
        );
      }

      await tx
        .update(handovers)
        .set({
          status: nextStatus,
          ownerConfirmed,
          borrowerConfirmed,
          ownerConfirmedAt,
          borrowerConfirmedAt,
          completedAt,
          timeline,
          updatedAt: now,
        })
        .where(eq(handovers.id, ho.id));

      await tx
        .update(requests)
        .set({ status: nextStatus, updatedAt: now })
        .where(eq(requests.id, target.id));
    });

    const updated = await getHydratedRequestById(requestId);
    if (!updated) throw new HttpError(404, 'Handover record not found.');
    return updated;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error('confirmHandover failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}

export async function createReport(
  reporter: Profile,
  input: { itemId: string; reason: string; details: string }
): Promise<ItemReport> {
  try {
    const [item] = await db
      .select()
      .from(items)
      .where(eq(items.id, input.itemId))
      .limit(1);

    if (!item) throw new HttpError(404, 'Listing not found.');

    const id = `rep-${crypto.randomUUID()}`;
    const now = new Date();
    const [inserted] = await db
      .insert(reports)
      .values({
        id,
        itemId: item.id,
        reporterId: reporter.id,
        reason: input.reason,
        details: input.details,
        status: 'Open',
        adminNote: '',
        createdAt: now,
      })
      .returning();

    return {
      id: inserted.id,
      itemId: inserted.itemId,
      itemTitle: item.title,
      reporterId: inserted.reporterId,
      reporterName: reporter.fullName,
      reason: inserted.reason,
      details: inserted.details,
      status: inserted.status as ReportStatus,
      adminNote: inserted.adminNote,
      createdAt: toIso(inserted.createdAt),
    };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error('createReport failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}

export async function getAdminOverview() {
  try {
    await ensureStarterData();

    const [allProfiles, allItems, allReqs, allReports] = await Promise.all([
      db.select().from(profiles).orderBy(desc(profiles.createdAt)),
      listItems({ includeModerated: true, sort: 'newest' }),
      db.select().from(requests).orderBy(desc(requests.updatedAt)),
      db.select().from(reports).orderBy(desc(reports.createdAt)),
    ]);

    const profileMap = new Map(allProfiles.map((p) => [p.id, p]));
    const itemMap = new Map(allItems.map((i) => [i.id, i]));

    const hydratedReqs = await hydrateRequests(allReqs);
    const hydratedReports: ItemReport[] = allReports.map((r) => ({
      id: r.id,
      itemId: r.itemId,
      itemTitle: itemMap.get(r.itemId)?.title ?? 'Removed Listing',
      reporterId: r.reporterId,
      reporterName: profileMap.get(r.reporterId)?.fullName ?? 'Student',
      reason: r.reason,
      details: r.details,
      status: r.status as ReportStatus,
      adminNote: r.adminNote,
      createdAt: toIso(r.createdAt),
    }));

    const completedReqs = allReqs.filter((r) => r.status === 'Completed');
    const estimatedSavingsInr = completedReqs.reduce((sum, r) => {
      const it = itemMap.get(r.itemId);
      if (!it) return sum;
      return sum + Math.max(0, it.estimatedRetailPrice - it.price);
    }, 0);
    const activeListings = allItems.filter(
      (i) => i.isAvailable && i.moderationStatus === 'active'
    ).length;
    const registeredStudents = allProfiles.filter(
      (p) => p.role === 'student' && p.isActive
    ).length;

    const impact: ImpactStats = {
      completedExchanges: completedReqs.length,
      resourcesReused: completedReqs.length,
      estimatedSavingsInr,
      activeListings,
      registeredStudents,
      disclaimer:
        'Estimated savings reflect the difference between recorded retail reference prices and peer exchange amounts, not audited financial outcomes.',
    };

    return {
      users: allProfiles.map(mapProfile),
      items: allItems,
      requests: hydratedReqs,
      reports: hydratedReports,
      impact,
    };
  } catch (error) {
    console.error('getAdminOverview failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}

export async function adminUpdateUser(
  targetId: string,
  actorId: string,
  isActive: boolean
): Promise<Profile> {
  try {
    if (targetId === actorId) {
      throw new HttpError(
        400,
        'Admins cannot deactivate their own active session.'
      );
    }
    const [updated] = await db
      .update(profiles)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(profiles.id, targetId))
      .returning();

    if (!updated) throw new HttpError(404, 'User not found.');
    return mapProfile(updated);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error('adminUpdateUser failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}

export async function adminModerateItem(
  itemId: string,
  moderationStatus: ModerationStatus
): Promise<ResourceItem> {
  try {
    const updateSet: Partial<typeof items.$inferInsert> = {
      moderationStatus,
      updatedAt: new Date(),
    };
    if (moderationStatus === 'removed') {
      updateSet.isAvailable = false;
    }

    const [updated] = await db
      .update(items)
      .set(updateSet)
      .where(eq(items.id, itemId))
      .returning();

    if (!updated) throw new HttpError(404, 'Item not found.');
    const full = await getItemById(updated.id);
    if (!full) throw new HttpError(404, 'Item not found.');
    return full;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error('adminModerateItem failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}

export async function adminResolveReport(
  reportId: string,
  input: { status: ReportStatus; adminNote: string; removeItem?: boolean }
): Promise<ItemReport> {
  try {
    const result = await db.transaction(async (tx) => {
      const [rep] = await tx
        .update(reports)
        .set({
          status: input.status,
          adminNote: input.adminNote,
        })
        .where(eq(reports.id, reportId))
        .returning();

      if (!rep) throw new HttpError(404, 'Report not found.');

      if (input.removeItem === true) {
        await tx
          .update(items)
          .set({
            moderationStatus: 'removed',
            isAvailable: false,
            updatedAt: new Date(),
          })
          .where(eq(items.id, rep.itemId));
      }

      const [itemRow] = await tx
        .select()
        .from(items)
        .where(eq(items.id, rep.itemId))
        .limit(1);
      const [reporterRow] = await tx
        .select()
        .from(profiles)
        .where(eq(profiles.id, rep.reporterId))
        .limit(1);

      return {
        id: rep.id,
        itemId: rep.itemId,
        itemTitle: itemRow?.title ?? 'Removed Listing',
        reporterId: rep.reporterId,
        reporterName: reporterRow?.fullName ?? 'Student',
        reason: rep.reason,
        details: rep.details,
        status: rep.status as ReportStatus,
        adminNote: rep.adminNote,
        createdAt: toIso(rep.createdAt),
      };
    });

    return result;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error('adminResolveReport failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}
