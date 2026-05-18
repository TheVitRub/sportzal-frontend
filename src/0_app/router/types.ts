import type { ComponentType, ReactNode } from 'react';
import type { Role } from '@entities/session';

export type RouteVariant = 'public' | 'auth' | 'private';

export interface RouteConfig {
  path: string;
  variant: RouteVariant;
  element: ReactNode;
  allowedRoles?: Role[];
  layout?: ComponentType<{ children: ReactNode }>;
}

