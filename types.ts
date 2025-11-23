
export interface User {
  id: string;
  name: string;
  avatar: string;
  karma: number;
  rating: number; // General/Legacy rating
  collectorRating?: number; // Specific rating as collector
  requesterRating?: number; // Specific rating as requester
  phone?: string;
  bio?: string;
  city: string;
  community: string;
  isCollectorMode: boolean;
  isUniversalCollector: boolean;
  hasCompletedOnboarding?: boolean;
}

export const CITIES = ['מיתר', 'באר שבע', 'תל אביב', 'עומר', 'להבים'];

// Map Cities to their default communities
export const DEFAULT_COMMUNITIES: Record<string, string[]> = {
  'מיתר': ['כרמית', 'מרכז', 'שכונה דרומית', 'נופים'],
  'באר שבע': ['רמות', 'נווה זאב', 'שכונה ד׳', 'העיר העתיקה'],
  'תל אביב': ['פלורנטין', 'לב העיר', 'רמת אביב'],
  'עומר': ['הותיקה', 'ההרחבה'],
  'להבים': ['להבים מזרח', 'להבים מערב']
};

export enum PackageType {
  SMALL = 'מעטפה קטנה',
  MEDIUM = 'קופסת נעליים',
  LARGE = 'חבילה גדולה'
}

export enum RequestStatus {
  PENDING = 'ממתין לאיסוף',
  ACCEPTED = 'בטיפול',
  COMPLETED = 'נמסר'
}

export interface PackageRequest {
  id: string;
  requester: User;
  location: string; // e.g., "Post Office Meitar Center"
  distance: string;
  reward: number; // NIS
  deadline: string;
  type: PackageType;
  status: RequestStatus;
  isHidden?: boolean; // If true, tracking number is hidden until deal
  trackingNumber?: string;
  isAiVerified?: boolean; // New: Flag for requests from high-trust users
  completedAt?: number; // Timestamp for deletion logic
}

export interface ScanResult {
  trackingNumber: string | null;
  location: string | null;
  recipientName: string | null;
  deadline: string | null;
}

export interface AiRecommendation {
  suggestedPrice: number;
  reason: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}