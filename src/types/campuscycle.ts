export type UserRole = 'student' | 'admin';

export type Branch = 'CSE' | 'IT' | 'ECE' | 'EEE' | 'ME' | 'CE' | 'Other';

export type Semester = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type ItemCategory =
  | 'Textbooks'
  | 'Lab Equipment'
  | 'Engineering Tools'
  | 'Stationery'
  | 'Other';

export type ItemCondition = 'Like New' | 'Good' | 'Fair';

export type ExchangeType = 'Sell' | 'Lend' | 'Donate';

export type RequestStatus =
  | 'Requested'
  | 'Accepted'
  | 'Reserved'
  | 'Pickup Scheduled'
  | 'Handed Over'
  | 'Completed'
  | 'Cancelled'
  | 'Rejected';

export type PickupPointName =
  | 'College Library'
  | 'Canteen'
  | 'Department Office'
  | 'Main Gate'
  | 'Hostel Courtyard'
  | 'Other';

export type ModerationStatus = 'active' | 'flagged' | 'removed';

export type ReportStatus = 'Open' | 'Reviewed' | 'Resolved' | 'Dismissed';

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  college: string;
  branch: Branch;
  semester: Semester;
  contactDetails: string;
  role: UserRole;
  emailVerified: boolean;
  isActive: boolean;
  isOnboarded?: boolean;
  createdAt: string;
}

export interface ResourceItem {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerBranch: Branch;
  ownerSemester: Semester;
  ownerCollege: string;
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
  moderationStatus: ModerationStatus;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PickupDetails {
  id: string;
  requestId: string;
  pickupPoint: PickupPointName;
  pickupDate: string;
  pickupTime: string;
  instructions: string;
  updatedBy: string;
  updatedByName: string;
  updatedAt: string;
}

export interface HandoverTimelineEvent {
  status: RequestStatus;
  actorName: string;
  note: string;
  timestamp: string;
}

export interface HandoverRecord {
  id: string;
  requestId: string;
  itemId: string;
  ownerId: string;
  borrowerId: string;
  status: RequestStatus;
  ownerConfirmed: boolean;
  borrowerConfirmed: boolean;
  ownerConfirmedAt: string | null;
  borrowerConfirmedAt: string | null;
  completedAt: string | null;
  timeline: HandoverTimelineEvent[];
}

export interface ItemRequest {
  id: string;
  itemId: string;
  itemTitle: string;
  itemImageUrl: string;
  itemCategory: ItemCategory;
  itemBranch: Branch;
  itemSemester: Semester;
  itemExchangeType: ExchangeType;
  itemPrice: number;
  itemEstimatedRetailPrice: number;
  ownerId: string;
  ownerName: string;
  borrowerId: string;
  borrowerName: string;
  borrowerBranch: Branch;
  borrowerSemester: Semester;
  message: string;
  status: RequestStatus;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  pickup: PickupDetails | null;
  handover: HandoverRecord | null;
}

export interface ItemReport {
  id: string;
  itemId: string;
  itemTitle: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  details: string;
  status: ReportStatus;
  adminNote: string;
  createdAt: string;
}

export interface ImpactStats {
  completedExchanges: number;
  resourcesReused: number;
  estimatedSavingsInr: number;
  activeListings: number;
  registeredStudents: number;
  disclaimer: string;
}

export interface HealthStatus {
  ok: boolean;
  mode: 'live';
  authProvider: 'firebase' | 'google';
  allowedCollegeDomain: string;
}
