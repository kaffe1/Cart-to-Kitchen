export type AuthMode = 'guest' | 'account';

export interface AppUser {
  id: string;
  displayName: string;
  email: string | null;
  mode: AuthMode;
  createdAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  displayName: string;
}

export interface AuthResult {
  user: AppUser;
  accessToken: string;
}
