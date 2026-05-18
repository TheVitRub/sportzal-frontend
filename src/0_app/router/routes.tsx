import { AppShell } from '@widgets/app-shell';
import Authorization from '@pages/authorization';
import WorkoutPage from '@pages/workout';
import HistoryPage from '@pages/history';
import AdminPage from '@pages/admin';
import PublicWorkoutPage from '@pages/public-workout';
import NotFoundPage from '@pages/not-found';
import type { RouteConfig } from './types';

export const ROUTES_PATH = {
  LOGIN: '/login',
  WORKOUT: '/',
  HISTORY: '/history',
  ADMIN: '/admin',
  PUBLIC_WORKOUT: '/public/:token',
  NOT_FOUND: '*'
} as const;

export const ROUTES: RouteConfig[] = [
  {
    path: ROUTES_PATH.LOGIN,
    variant: 'auth',
    element: <Authorization />
  },
  {
    path: ROUTES_PATH.WORKOUT,
    variant: 'private',
    element: <WorkoutPage />,
    layout: AppShell
  },
  {
    path: ROUTES_PATH.HISTORY,
    variant: 'private',
    element: <HistoryPage />,
    layout: AppShell
  },
  {
    path: ROUTES_PATH.ADMIN,
    variant: 'private',
    allowedRoles: ['admin'],
    element: <AdminPage />,
    layout: AppShell
  },
  {
    path: ROUTES_PATH.PUBLIC_WORKOUT,
    variant: 'public',
    element: <PublicWorkoutPage />
  },
  {
    path: ROUTES_PATH.NOT_FOUND,
    variant: 'public',
    element: <NotFoundPage />
  }
];

