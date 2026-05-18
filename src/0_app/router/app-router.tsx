import { BrowserRouter, Route, Routes } from 'react-router';
import RouteGuard from './route-guard';
import { ROUTES } from './routes';

const routerBaseName = import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '');

export default function AppRouter() {
  return (
    <BrowserRouter basename={routerBaseName}>
      <Routes>
        {ROUTES.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <RouteGuard variant={route.variant} allowedRoles={route.allowedRoles}>
                {route.layout ? <route.layout>{route.element}</route.layout> : route.element}
              </RouteGuard>
            }
          />
        ))}
      </Routes>
    </BrowserRouter>
  );
}
