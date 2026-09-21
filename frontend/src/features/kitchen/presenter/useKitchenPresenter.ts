import { getKitchenPlaceholder } from '../model/kitchen.api';

export function useKitchenPresenter() {
  return { kitchen: getKitchenPlaceholder() };
}
