export interface InventoryItem {
  ingredientId: string;
  remainingUses: number | 'infinite';
}

export interface CounterItem {
  ingredientId: string;
  selectedUses: number;
}

export interface KitchenPlaceholder {
  title: string;
  status: string;
  sampleItems: string[];
}
