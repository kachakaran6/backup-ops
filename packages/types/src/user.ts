import { z } from 'zod';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  autoRefreshInterval: number;
}

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  status: UserStatus;
  role: UserRole;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(3).max(50),
  displayName: z.string().min(1).max(100),
  avatarUrl: z.string().url().optional(),
  status: z.nativeEnum(UserStatus),
  role: z.nativeEnum(UserRole),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']),
    language: z.string().default('en'),
    timezone: z.string().default('UTC'),
    autoRefreshInterval: z.number().default(5000),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastLoginAt: z.string().optional(),
});
