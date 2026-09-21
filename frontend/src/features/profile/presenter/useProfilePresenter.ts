import { getProfilePlaceholder } from '../model/profile.api';

export function useProfilePresenter() {
  return { profile: getProfilePlaceholder() };
}
