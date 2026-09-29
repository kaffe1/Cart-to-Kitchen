import { ShoppingBasket } from 'lucide-react';
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { Button } from '@/shared/components/ui/button';
import type {
  CartLine,
  Ingredient,
  ShoppingListItem,
  Wallet,
} from '../../model/store.types';
import { isTypingTarget } from '../scene/controls/keyboard';
import { StoreCanvas, type StoreCanvasHandle } from '../scene/StoreCanvas';
import {
  getShoppingShortcut,
  shoppingSessionReducer,
} from '../scene/controls/shoppingSession';
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
  const [mode, dispatch] = useReducer(shoppingSessionReducer, 'entry');
  const canvasRef = useRef<StoreCanvasHandle>(null);
  const isCartOpen = mode === 'paused';

  const handleExplorationChange = useCallback((active: boolean) => {
    dispatch(active ? 'lock' : 'unlock');
  }, []);
  const pauseShopping = useCallback(() => {
    dispatch('pause');
    canvasRef.current?.pauseShopping();
  }, []);
  const resumeShopping = useCallback(
    () => canvasRef.current?.resumeShopping(),
    [],
  );

  useEffect(() => {
    const handleBasketShortcut = (event: KeyboardEvent) => {
      if (event.repeat || isTypingTarget(event.target)) return;
      const action = getShoppingShortcut(mode, event.code);
      if (!action) return;
      event.preventDefault();
      if (action === 'pause') pauseShopping();
      else resumeShopping();
    };

    window.addEventListener('keydown', handleBasketShortcut);
    return () => window.removeEventListener('keydown', handleBasketShortcut);
  }, [mode, pauseShopping, resumeShopping]);

  return (
    <div className="store-3d-experience">
      <StoreCanvas
        ref={canvasRef}
        mode={mode}
        ingredients={ingredients}
        onAdd={onAdd}
        onResume={resumeShopping}
        onExplorationChange={handleExplorationChange}
      />

      <Button
        className="store-3d-cart-toggle"
        variant={isCartOpen ? 'default' : 'secondary'}
        onClick={isCartOpen ? resumeShopping : pauseShopping}
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
        inert={!isCartOpen}
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
