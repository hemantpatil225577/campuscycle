import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { HandoverTimelineEvent } from '../types/campuscycle.ts';

export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(), // Firebase Auth UID or seeded profile ID
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  college: text('college')
    .notNull()
    .default('National Institute of Engineering & Technology'),
  branch: text('branch').notNull().default('CSE'),
  semester: integer('semester').notNull().default(3),
  contactDetails: text('contact_details').notNull().default(''),
  role: text('role').notNull().default('student'), // 'student' | 'admin'
  emailVerified: boolean('email_verified').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  isOnboarded: boolean('is_onboarded').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const items = pgTable('items', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  branch: text('branch').notNull(),
  semester: integer('semester').notNull(),
  condition: text('condition').notNull(),
  exchangeType: text('exchange_type').notNull(),
  price: integer('price').notNull().default(0),
  estimatedRetailPrice: integer('estimated_retail_price').notNull().default(0),
  quantity: integer('quantity').notNull().default(1),
  imageUrl: text('image_url').notNull().default(''),
  isAvailable: boolean('is_available').notNull().default(true),
  moderationStatus: text('moderation_status').notNull().default('active'),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const requests = pgTable('requests', {
  id: text('id').primaryKey(),
  itemId: text('item_id')
    .notNull()
    .references(() => items.id, { onDelete: 'cascade' }),
  ownerId: text('owner_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  borrowerId: text('borrower_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  status: text('status').notNull().default('Requested'),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const pickups = pgTable('pickups', {
  id: text('id').primaryKey(),
  requestId: text('request_id')
    .notNull()
    .unique()
    .references(() => requests.id, { onDelete: 'cascade' }),
  pickupPoint: text('pickup_point').notNull(),
  pickupDate: text('pickup_date').notNull(),
  pickupTime: text('pickup_time').notNull(),
  instructions: text('instructions').notNull().default(''),
  updatedBy: text('updated_by')
    .notNull()
    .references(() => profiles.id),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const handovers = pgTable('handovers', {
  id: text('id').primaryKey(),
  requestId: text('request_id')
    .notNull()
    .unique()
    .references(() => requests.id, { onDelete: 'cascade' }),
  itemId: text('item_id')
    .notNull()
    .references(() => items.id, { onDelete: 'cascade' }),
  ownerId: text('owner_id')
    .notNull()
    .references(() => profiles.id),
  borrowerId: text('borrower_id')
    .notNull()
    .references(() => profiles.id),
  status: text('status').notNull().default('Requested'),
  ownerConfirmed: boolean('owner_confirmed').notNull().default(false),
  borrowerConfirmed: boolean('borrower_confirmed').notNull().default(false),
  ownerConfirmedAt: timestamp('owner_confirmed_at', { withTimezone: true }),
  borrowerConfirmedAt: timestamp('borrower_confirmed_at', {
    withTimezone: true,
  }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  timeline: jsonb('timeline')
    .$type<HandoverTimelineEvent[]>()
    .notNull()
    .default([]),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const reports = pgTable('reports', {
  id: text('id').primaryKey(),
  itemId: text('item_id')
    .notNull()
    .references(() => items.id, { onDelete: 'cascade' }),
  reporterId: text('reporter_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(),
  details: text('details').notNull().default(''),
  status: text('status').notNull().default('Open'),
  adminNote: text('admin_note').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const profilesRelations = relations(profiles, ({ many }) => ({
  items: many(items),
  outgoingRequests: many(requests, { relationName: 'borrowerRequests' }),
  incomingRequests: many(requests, { relationName: 'ownerRequests' }),
  reports: many(reports),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [items.ownerId],
    references: [profiles.id],
  }),
  requests: many(requests),
  reports: many(reports),
}));

export const requestsRelations = relations(requests, ({ one }) => ({
  item: one(items, {
    fields: [requests.itemId],
    references: [items.id],
  }),
  owner: one(profiles, {
    fields: [requests.ownerId],
    references: [profiles.id],
    relationName: 'ownerRequests',
  }),
  borrower: one(profiles, {
    fields: [requests.borrowerId],
    references: [profiles.id],
    relationName: 'borrowerRequests',
  }),
  pickup: one(pickups, {
    fields: [requests.id],
    references: [pickups.requestId],
  }),
  handover: one(handovers, {
    fields: [requests.id],
    references: [handovers.requestId],
  }),
}));

export const pickupsRelations = relations(pickups, ({ one }) => ({
  request: one(requests, {
    fields: [pickups.requestId],
    references: [requests.id],
  }),
  updater: one(profiles, {
    fields: [pickups.updatedBy],
    references: [profiles.id],
  }),
}));

export const handoversRelations = relations(handovers, ({ one }) => ({
  request: one(requests, {
    fields: [handovers.requestId],
    references: [requests.id],
  }),
  item: one(items, {
    fields: [handovers.itemId],
    references: [items.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  item: one(items, {
    fields: [reports.itemId],
    references: [items.id],
  }),
  reporter: one(profiles, {
    fields: [reports.reporterId],
    references: [profiles.id],
  }),
}));
