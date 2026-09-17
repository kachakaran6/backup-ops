export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  scope: RoleScope;
}

export enum RoleScope {
  GLOBAL = 'global',
  ORGANIZATION = 'organization',
  RESOURCE = 'resource',
}

export interface Permission {
  action: string;
  resource: string;
  scope: 'global' | 'organization' | 'resource' | 'self';
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'high-contrast';
  language: string;
  timezone: string;
  notificationSettings: NotificationSettings;
  accessibility: AccessibilitySettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
}

export interface AccessibilitySettings {
  highContrast: boolean;
  screenReader: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
}