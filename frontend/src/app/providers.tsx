import { useEffect, type ReactNode } from 'react';
import { appSession } from '../shared/api/appSession';

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Shared promise survives StrictMode's development effect replay.
    void appSession.initialize().catch(() => undefined);
  }, []);
  return children;
}
