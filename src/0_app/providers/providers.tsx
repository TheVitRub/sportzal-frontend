import type { PropsWithChildren } from 'react';
import { SessionProvider } from '@entities/session';

export default function Providers({ children }: PropsWithChildren) {
  return <SessionProvider>{children}</SessionProvider>;
}

