export type UserRole = 'Faculty' | 'Admin';

export type AppPortal = 'selector' | 'admin-auth' | 'admin-app' | 'user-auth' | 'user-app';

export type MobileTab = 
  | 'dashboard' 
  | 'live' 
  | 'alerts' 
  | 'captured' 
  | 'saved' 
  | 'search' 
  | 'profile' 
  | 'settings' 
  | 'chat' 
  | 'incident';

export interface CameraNode {
  id: string;
  number: string;
  dept: string;
  type: string;
  status: 'Online' | 'Offline' | 'Maintenance' | 'In Session' | 'Available' | 'Exam In Progress';
  resolution?: string;
  fps?: number;
  ipAddress?: string;
  streamUrl?: string;
  lastActive?: string;
  room?: string;
  instructor?: string;
  students?: number;
  feedUrl?: string;
}

export interface UserRecord {
  id: number | string;
  google_uid?: string;
  name: string;
  email: string;
  role: UserRole;
  photo_url?: string;
  last_login?: string;
  status?: 'Active' | 'Suspended';
  department?: string;
  facultyId?: string;
}

export interface AuditLog {
  id: number | string;
  uid?: string;
  email: string;
  action?: string;
  ip_address: string;
  user_agent?: string;
  login_time: string;
  status?: 'Success' | 'Warning' | 'Failed';
}

export interface IncidentReport {
  id: string;
  title: string;
  location: string;
  reportedBy: string;
  severity: 'Low' | 'Medium' | 'Critical';
  description: string;
  timestamp: string;
  status: 'Pending' | 'Investigating' | 'Resolved';
}

export interface CapturedPicture {
  id: number | string;
  loc: string;
  dept: string;
  type: string;
  time: string;
  imageUrl?: string;
  image_url?: string;
  detection?: string;
  confidence?: string | number;
  isSaved?: boolean;
}

export interface SavedPicture {
  id: number | string;
  picture_id?: string | number;
  loc: string;
  dept: string;
  type: string;
  time: string;
  imageUrl?: string;
  image_url?: string;
  created_at?: string;
}

export interface AlertRecord {
  id: number | string;
  room: string;
  detection: string;
  confidence: string | number;
  timestamp: string;
  imageUrl?: string;
  image_url?: string;
  created_at?: string;
  severity?: 'Low' | 'Medium' | 'Critical' | 'High';
  status?: 'Active' | 'Resolved' | 'Investigating';
  dept?: string;
}

export interface Feature {
  id: string;
  title: string;
  icon: string;
  description: string;
}

export interface Announcement {
  id: string;
  title: string;
  date: string;
  link?: string;
  priority?: 'Normal' | 'Urgent';
}

export interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: string | number;
  subItems?: NavItem[];
}
