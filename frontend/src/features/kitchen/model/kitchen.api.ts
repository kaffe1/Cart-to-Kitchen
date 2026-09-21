import type { KitchenPlaceholder } from './kitchen.types';

const kitchenPlaceholder: KitchenPlaceholder = {
  title: 'Kitchen workspace',
  status: 'Planned for a later development phase',
  sampleItems: ['Tomato', 'Egg', 'Bread'],
};

// TODO(BACKEND): Replace this placeholder with the inventory endpoint.
export function getKitchenPlaceholder(): KitchenPlaceholder {
  return kitchenPlaceholder;
}
