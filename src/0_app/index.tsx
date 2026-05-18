import { createRoot } from 'react-dom/client';
import Providers from './providers/providers';
import AppRouter from './router/app-router';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <Providers>
    <AppRouter />
  </Providers>
);

