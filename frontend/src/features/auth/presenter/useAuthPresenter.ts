import { useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register, continueAsGuest } from '../model/auth.api';
import { appSession } from '../../../shared/api/appSession';
import type { LoginInput, RegisterInput } from '../model/auth.types';

export function useAuthPresenter(mode: 'login' | 'register') {
  const navigate = useNavigate();
  const session = useSyncExternalStore(
    appSession.subscribe,
    appSession.getSnapshot,
    appSession.getServerSnapshot,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setIsSubmitting(true);
    setError(null);
    try {
      await action();
      void navigate('/store', { replace: true });
    } catch (caught) {
      // Auth may have succeeded while loading the shopping snapshot failed.
      // Let the store offer a read retry instead of submitting registration twice.
      if (appSession.getSnapshot().user)
        void navigate('/store', { replace: true });
      else
        setError(
          caught instanceof Error ? caught.message : 'Could not continue.',
        );
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    isSubmitting:
      isSubmitting || session.isAuthenticating || session.status === 'idle',
    error: error ?? session.error,
    submit: (input: LoginInput | RegisterInput) =>
      run(() =>
        mode === 'login' ? login(input) : register(input as RegisterInput),
      ),
    continueAsGuest: () =>
      run(() =>
        session.user?.mode === 'guest'
          ? appSession.refresh()
          : continueAsGuest(),
      ),
  };
}
