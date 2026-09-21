import type { ProfilePlaceholder } from './profile.types';

const profilePlaceholder: ProfilePlaceholder = {
  displayName: 'Guest cook',
  mode: 'Guest mode',
  note: 'Profile features will be implemented in a later development phase.',
};

// TODO(BACKEND): Replace this placeholder with the current-user endpoint.
export function getProfilePlaceholder(): ProfilePlaceholder {
  return profilePlaceholder;
}
