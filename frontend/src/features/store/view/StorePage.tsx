import { Grid2X2, Search, Sparkles, View } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { FeedbackBanner, FeedbackToast } from '@/shared/components/ui/FeedbackBanner';
import { Input } from '@/shared/components/ui/input';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useStorePresenter } from '../presenter/useStorePresenter';
import type { IngredientCategory } from '../model/store.types';
import { CartPanel } from './components/CartPanel';
import { IngredientCard } from './components/IngredientCard';
import { Store3DExperience } from './components/Store3DExperience';

const categories: Array<IngredientCategory | 'All'> = [
  'All',
  'Vegetables & Fruits',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Grains & Staples',
  'Other Ingredients',
];

export function StorePage() {
  const presenter = useStorePresenter();
  const toastMessage =
    presenter.error ??
    (presenter.viewMode === '3d' && presenter.messageKind === 'cart-add'
      ? null
      : presenter.message);

  if (presenter.catalogError)
    return (
      <section className="page-shell space-y-4" role="alert">
        <FeedbackBanner tone="error">{presenter.catalogError}</FeedbackBanner>
        <Button onClick={presenter.retryCatalogue}>Retry catalogue</Button>
      </section>
    );
  if (!presenter.isReady || !presenter.wallet)
    return (
      <section className="page-shell" aria-busy={presenter.isLoading}>
        <output>
          {presenter.isLoading
            ? 'Loading your store…'
            : 'Refresh your session to continue shopping.'}
        </output>
        {presenter.isLoading && <Skeleton className="h-48 rounded-3xl" />}
      </section>
    );

  return (
    <div
      className={
        presenter.viewMode === '3d'
          ? 'page-shell store-page store-page-3d'
          : 'page-shell store-page'
      }
    >
      <div className="store-view-toggle view-switch" aria-label="Store view">
        <Button
          variant={presenter.viewMode === '3d' ? 'default' : 'outline'}
          size="sm"
          onClick={() => presenter.setViewMode('3d')}
        >
          <View size={16} /> 3D store
        </Button>
        <Button
          variant={presenter.viewMode === 'grid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => presenter.setViewMode('grid')}
        >
          <Grid2X2 size={16} /> 2D list
        </Button>
      </div>

      {toastMessage && (
        <FeedbackToast
          key={`${presenter.error ? 'error' : 'success'}:${toastMessage}`}
          message={toastMessage}
          tone={presenter.error ? 'error' : 'success'}
          onDismiss={presenter.clearFeedback}
        />
      )}

      {presenter.viewMode === '3d' ? (
        <Store3DExperience
          ingredients={presenter.ingredients}
          cart={presenter.cart}
          wallet={presenter.wallet}
          total={presenter.cartTotal}
          isCheckingOut={presenter.isCheckingOut}
          isUpdatingCart={presenter.isUpdatingCart}
          onAdd={presenter.addToCart}
          onQuantityChange={presenter.changeQuantity}
          onCheckout={presenter.completeCheckout}
        />
      ) : (
        <>
          <section className="page-intro store-intro">
            <div>
              <span className="eyebrow">
                <Sparkles size={14} /> Today’s market run
              </span>
              <h1>Choose well. Cook more.</h1>
              {/* <p>
                Shop within your wallet, then turn every choice into
                possibilities in your kitchen.
              </p> */}
            </div>
            <div className="decision-card">
              <span>Wallet rule</span>
              <strong>+100 SEK / hour</strong>
              <small>09:00–17:00 · no category limit</small>
            </div>
          </section>

          <div className="store-workspace">
            <section className="store-main">
              <div className="workspace-toolbar">
                <div className="search-field">
                  <Search size={17} />
                  <Input
                    value={presenter.search}
                    onChange={(event) =>
                      presenter.setSearch(event.target.value)
                    }
                    placeholder="Search the market"
                    aria-label="Search ingredients"
                  />
                </div>
              </div>

              <div
                className="category-strip"
                aria-label="Ingredient categories"
              >
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={
                      presenter.category === item
                        ? 'category-pill active'
                        : 'category-pill'
                    }
                    onClick={() => presenter.setCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="catalog-heading">
                <div>
                  <span className="eyebrow">Aisle catalogue</span>
                  <h2>
                    {presenter.category === 'All'
                      ? 'All ingredients'
                      : presenter.category}
                  </h2>
                </div>
                <Badge variant="outline">
                  {presenter.filteredIngredients.length} products
                </Badge>
              </div>

              {presenter.isLoading ? (
                <div className="ingredient-grid">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <Skeleton key={index} className="h-48 rounded-3xl" />
                  ))}
                </div>
              ) : presenter.filteredIngredients.length === 0 ? (
                <div className="empty-state">
                  <span>🥕</span>
                  <h3>No ingredients found</h3>
                  <p>Try another search or category.</p>
                </div>
              ) : (
                <div className="ingredient-grid">
                  {presenter.filteredIngredients.map((ingredient) => (
                    <IngredientCard
                      key={ingredient.id}
                      ingredient={ingredient}
                      onAdd={presenter.addToCart}
                      disabled={presenter.isCheckingOut}
                      onSelect={presenter.setSelectedIngredientId}
                    />
                  ))}
                </div>
              )}
            </section>

            <CartPanel
              cart={presenter.cart}
              ingredients={presenter.ingredients}
              wallet={presenter.wallet}
              total={presenter.cartTotal}
              isCheckingOut={presenter.isCheckingOut}
              isUpdatingCart={presenter.isUpdatingCart}
              onQuantityChange={presenter.changeQuantity}
              onCheckout={presenter.completeCheckout}
            />
          </div>
        </>
      )}
    </div>
  );
}
