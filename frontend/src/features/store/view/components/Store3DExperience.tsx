import { ShoppingBasket } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import type {
  CartLine,
  Ingredient,
  ShoppingListItem,
  Wallet,
} from '../../model/store.types';
import { isTypingTarget } from '../scene/keyboard';
import { StoreCanvas } from '../scene/StoreCanvas';
import { CartPanel } from './CartPanel';

interface Store3DExperienceProps {
  ingredients: Ingredient[];
  cart: CartLine[];
  shoppingList: ShoppingListItem[];
  wallet: Wallet;
  total: number;
  isCheckingOut: boolean;
  onAdd: (ingredientId: string) => Promise<boolean>;
  onQuantityChange: (ingredientId: string, quantity: number) => void;
  onCheckout: () => void;
}

export function Store3DExperience({
  ingredients,
  cart,
  shoppingList,
  wallet,
  total,
  isCheckingOut,
  onAdd,
  onQuantityChange,
  onCheckout,
}: Store3DExperienceProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isExploring, setIsExploring] = useState(false);

  const handleExplorationChange = useCallback((active: boolean) => {
    setIsExploring(active);
    setIsCartOpen(!active);
  }, []);

  useEffect(() => {
    const handleBasketShortcut = (event: KeyboardEvent) => {
      if (event.code !== 'KeyB' || event.repeat || isTypingTarget(event.target))
        return;
      event.preventDefault();
      setIsCartOpen((current) => !current);
    };

    window.addEventListener('keydown', handleBasketShortcut);
    return () => window.removeEventListener('keydown', handleBasketShortcut);
  }, []);

  return (
    <div className="store-3d-experience">
      <StoreCanvas
        ingredients={ingredients}
        onAdd={onAdd}
        onExplorationChange={handleExplorationChange}
      />

      <Button
        className="store-3d-cart-toggle"
        variant={isCartOpen ? 'default' : 'secondary'}
        onClick={() => setIsCartOpen((current) => !current)}
        disabled={isExploring}
        aria-expanded={isCartOpen}
        aria-controls="store-3d-cart"
      >
        <ShoppingBasket size={17} /> {isCartOpen ? 'Hide basket' : 'Basket'}{' '}
        <kbd>B</kbd>
      </Button>

      <div
        id="store-3d-cart"
        className={
          isCartOpen ? 'store-3d-cart-drawer open' : 'store-3d-cart-drawer'
        }
        aria-hidden={!isCartOpen}
      >
        <CartPanel
          cart={cart}
          ingredients={ingredients}
          shoppingList={shoppingList}
          wallet={wallet}
          total={total}
          isCheckingOut={isCheckingOut}
          onQuantityChange={onQuantityChange}
          onCheckout={onCheckout}
        />
      </div>
    </div>
  );
}
