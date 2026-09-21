import { useState } from 'react';
import { login, register } from '../model/auth.api';
import type { LoginInput, RegisterInput } from '../model/auth.types';

export function useAuthPresenter(mode: 'login' | 'register') {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(input: LoginInput | RegisterInput) {
    setIsSubmitting(true);
    setError(null);
    try {
      if (mode === 'login') await login(input);
      else await register(input as RegisterInput);
      window.location.href = '/store';
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not continue.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return { isSubmitting, error, submit };
}
