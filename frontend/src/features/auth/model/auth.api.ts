import { demoDelay, getDemoState, updateDemoState } from '../../../shared/api/demoBackend';
import type { AuthResult, LoginInput, RegisterInput } from './auth.types';

// TODO(BACKEND): Replace demo mutations with POST /api/v1/auth/login.
export async function login(input: LoginInput): Promise<AuthResult> {
  await demoDelay();
  const displayName = input.email.split('@')[0] || 'Kitchen player';
  const user = {
    id: 'demo-account',
    displayName,
    email: input.email,
    mode: 'account' as const,
    createdAt: new Date().toISOString(),
  };
  updateDemoState((current) => ({ ...current, user }));
  return { user, accessToken: 'TODO_BACKEND_DEMO_TOKEN' };
}

// TODO(BACKEND): Replace demo mutations with POST /api/v1/auth/register.
export async function register(input: RegisterInput): Promise<AuthResult> {
  await demoDelay();
  const user = {
    id: 'demo-account',
    displayName: input.displayName,
    email: input.email,
    mode: 'account' as const,
    createdAt: new Date().toISOString(),
  };
  updateDemoState((current) => ({ ...current, user }));
  return { user, accessToken: 'TODO_BACKEND_DEMO_TOKEN' };
}

// TODO(BACKEND): Replace with POST /api/v1/auth/logout and token revocation.
export async function logout(): Promise<void> {
  await demoDelay(120);
  updateDemoState((current) => ({
    ...current,
    user: { ...getDemoState().user, id: 'guest-session', displayName: 'Guest cook', email: null, mode: 'guest' },
  }));
}
