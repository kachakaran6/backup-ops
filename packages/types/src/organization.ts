import { z } from 'zod';

export enum OrganizationRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  OPERATOR = 'operator',
  MEMBER = 'member',
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMembership {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  createdAt: string;
  updatedAt: string;
}

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
