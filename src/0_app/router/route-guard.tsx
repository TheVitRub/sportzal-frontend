import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useSession } from '@entities/session';
import { FullScreenMessage } from '@shared/ui';
import { ROUTES_PATH } from './routes';
import type { RouteVariant } from './types';
import type { Role } from '@entities/session';

interface RouteGuardProps {
  variant: RouteVariant;
  allowedRoles?: Role[];
  children: ReactNode;
}

export default function RouteGuard({ variant, allowedRoles, children }: RouteGuardProps) {
  const { user, loading } = useSession();

  if (loading && variant !== 'public') {
    return <FullScreenMessage title="Загрузка" text="Проверяем сессию" />;
  }

  if (variant === 'public') {
    return <>{children}</>;
  }

  if (variant === 'auth') {
    return user ? <Navigate to={ROUTES_PATH.WORKOUT} replace /> : <>{children}</>;
  }

  if (!user) {
    return <Navigate to={ROUTES_PATH.LOGIN} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES_PATH.WORKOUT} replace />;
  }

  return <>{children}</>;
}

