import type { ReactNode } from 'react';
import { Dumbbell, History, LogOut, ShieldCheck } from 'lucide-react';
import { NavLink } from 'react-router';
import { useSession } from '@entities/session';
import { ROUTES_PATH } from '@app/router/routes';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, clearSession } = useSession();

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <Dumbbell size={28} />
          <div>
            <strong>Тренировки</strong>
            <span>{user?.name}</span>
          </div>
        </div>
        <nav>
          <NavLink to={ROUTES_PATH.WORKOUT} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Dumbbell size={18} /> Тренировка
          </NavLink>
          <NavLink to={ROUTES_PATH.HISTORY} className={({ isActive }) => (isActive ? 'active' : '')}>
            <History size={18} /> История
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to={ROUTES_PATH.ADMIN} className={({ isActive }) => (isActive ? 'active' : '')}>
              <ShieldCheck size={18} /> Админка
            </NavLink>
          )}
        </nav>
        <button className="ghost danger" onClick={clearSession}>
          <LogOut size={18} /> Выйти
        </button>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
