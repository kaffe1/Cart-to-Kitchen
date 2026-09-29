import {
  Minus,
  Plus,
  ReceiptText,
  ShoppingBasket,
  StickyNote,
} from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { formatSek } from '@/shared/utils/format';
import type {
  CartLine,
  Ingredient,
  ShoppingListItem,
  Wallet,
} from '../../model/store.types';

interface CartPanelProps {
  cart: CartLine[];
  ingredients: Ingredient[];
  shoppingList: ShoppingListItem[];
  wallet: Wallet;
  total: number;
  isCheckingOut: boolean;
  onQuantityChange: (ingredientId: string, quantity: number) => void;
  onCheckout: () => void;
}

export function CartPanel({
  cart,
  ingredients,
  shoppingList,
  wallet,
  total,
  isCheckingOut,
  onQuantityChange,
  onCheckout,
}: CartPanelProps) {
  const remaining = wallet.balanceSek - total;
  const usedPercent =
    wallet.balanceSek === 0 ? 100 : (total / wallet.balanceSek) * 100;

  return (
    <aside className="cart-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Current trip</span>
          <h2>Your cart</h2>
        </div>
        <span className="round-icon">
          <ShoppingBasket size={19} />
        </span>
      </div>

      <div className="budget-card">
        <div className="budget-row">
          <span>Available</span>
          <strong>{formatSek(wallet.balanceSek)}</strong>
        </div>
        <Progress value={Math.min(usedPercent, 100)} />
        <div className="budget-row secondary">
          <span>{formatSek(total)} in cart</span>
          <span>{formatSek(Math.max(remaining, 0))} left</span>
        </div>
        <p>
          +{wallet.hourlyGrantSek} SEK each hour, 09:00–17:00 · cap{' '}
          {wallet.capSek} SEK
        </p>
      </div>

      {shoppingList.length > 0 && (
        <div className="shopping-note">
          <StickyNote size={17} />
          <div>
            <strong>Kitchen note</strong>
            <p>
              {shoppingList.length} missing ingredient(s) are waiting below.
            </p>
          </div>
        </div>
      )}

      <section className="cart-lines" aria-label="Cart items">
        {cart.length === 0 ? (
          <div className="empty-mini">
            <span>🛒</span>
            <strong>Your basket is light</strong>
            <p>Pick something from a shelf to begin.</p>
          </div>
        ) : (
          cart.map((line) => {
            const item = ingredients.find(
              (ingredient) => ingredient.id === line.ingredientId,
            );
            if (!item) return null;
            return (
              <div key={line.ingredientId} className="cart-line">
                <span className="cart-line-emoji">{item.emoji}</span>
                <div className="cart-line-copy">
                  <strong>{item.name}</strong>
                  <small>
                    {formatSek(item.priceSek * line.quantity)} ·{' '}
                    {item.usesPerUnit === 'infinite'
                      ? '∞'
                      : item.usesPerUnit * line.quantity}{' '}
                    uses
                  </small>
                </div>
                <div
                  className="quantity-stepper"
                  aria-label={`${item.name} quantity`}
                >
                  <button
                    type="button"
                    onClick={() => onQuantityChange(item.id, line.quantity - 1)}
                    aria-label={`Remove one ${item.name}`}
                  >
                    <Minus size={14} />
                  </button>
                  <span>{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onQuantityChange(item.id, line.quantity + 1)}
                    aria-label={`Add one ${item.name}`}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
        {shoppingList.length > 0 && (
          <div className="note-items">
            {shoppingList.map((entry) => {
              const item = ingredients.find(
                (ingredient) => ingredient.id === entry.ingredientId,
              );
              return item ? (
                <Badge key={entry.ingredientId} variant="outline">
                  {item.emoji} {item.name}
                </Badge>
              ) : null;
            })}
          </div>
        )}
      </section>

      <Button
        className="cart-checkout w-full"
        size="lg"
        onClick={onCheckout}
        disabled={cart.length === 0 || remaining < 0 || isCheckingOut}
      >
        <ReceiptText size={18} />{' '}
        {isCheckingOut ? 'Checking out…' : `Checkout · ${formatSek(total)}`}
      </Button>
    </aside>
  );
}
