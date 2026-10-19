import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { KitchenPage } from './KitchenPage';
import { CookPage } from '../../cooking/view/CookPage';
import { CookingFinishedPage } from '../../cooking/view/CookingFinishedPage';
import { RecipeDetailPage } from '../../recipes/view/RecipeDetailPage';
import { appSession } from '../../../shared/api/appSession';
import { clearCounter, addIngredientToCounter } from '../model/kitchen.demo';
import { clearDiscovery } from '../model/kitchen.api';
import type { Recipe } from '../../recipes/model/recipes.types';
import { allIngredients, storeIngredients, pantryIngredients } from '../../../shared/api/dummyData';
import { AppShell } from '../../../shared/components/layout/AppShell';

const recipe: Recipe = {
  id: '52771', name: 'Spicy Arrabiata Penne', emoji: '🍝', category: 'Vegetarian', accent: '#d7a951',
  imageUrl: 'https://www.themealdb.com/images/media/meals/ustsqw1468250014.jpg',
  requirements: [{ ingredientId: 'tomato', amount: 1 }, { ingredientId: 'garlic', amount: 1 }, { ingredientId: 'olive-oil', amount: 1, automatic: true }],
  ingredients: [
    { ingredientId: 'tomato', name: 'Tomato', emoji: '🍅', measure: '2', isPantry: false },
    { ingredientId: 'garlic', name: 'Garlic', emoji: '🧄', measure: '1 clove', isPantry: false },
    { ingredientId: 'olive-oil', name: 'Olive oil', emoji: '🫒', measure: '1 tbsp', isPantry: true },
  ],
  steps: ['Chop the garlic and tomatoes.', 'Simmer the sauce gently for 15 minutes.', 'Toss with pasta and serve warm.'],
};
const inventory = [{ ingredientId: 'tomato', remainingUses: 3 }, { ingredientId: 'garlic', remainingUses: 3 }];
const user = { id: 'kitchen-browser-test', displayName: 'Test cook', email: null, mode: 'guest', createdAt: '' };
const shopping = { id: 1, status: 'active', createdAt: '', wallet: { balanceSek: 500, capSek: 3000, hourlyGrantSek: 100, nextGrantAt: null }, cart: [], inventory };

function Journey({ path = '/kitchen' }: { path?: string }) {
  return <MemoryRouter initialEntries={[path]}><AppShell><Routes>
    <Route path="/kitchen" element={<KitchenPage />} />
    <Route path="/recipes/:recipeId" element={<RecipeDetailPage recipeId="52771" />} />
    <Route path="/cook/52771" element={<CookPage recipeId="52771" />} />
    <Route path="/cooking-finished/7" element={<CookingFinishedPage historyId="7" />} />
  </Routes></AppShell></MemoryRouter>;
}

function dragTo(selector: string, x: number, y: number, releaseOnly = false) {
  cy.get(selector).scrollIntoView({ duration: 0 }).then(($source) => {
    const rect = $source[0].getBoundingClientRect();
    const point = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
    const event = { eventConstructor: 'PointerEvent', pointerId: 1, isPrimary: true, button: 0, buttons: 1 };
    cy.wrap($source).trigger('pointerdown', { ...event, ...point, scrollBehavior: false });
    cy.document().trigger('pointermove', { ...event, clientX: point.clientX + 10, clientY: point.clientY + 10 });
    cy.get('.kitchen-drag-emoji').should('exist');
    if (!releaseOnly) cy.document().trigger('pointermove', { ...event, clientX: x, clientY: y });
    cy.document().trigger('pointerup', { ...event, buttons: 0, clientX: x, clientY: y });
  });
}

function fitsViewport() {
  cy.document().should((doc) => {
    expect(doc.documentElement.scrollHeight).to.be.at.most(doc.documentElement.clientHeight + 2);
    expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth + 2);
  });
}

describe('Kitchen → MealDB recipe → completed meal', () => {
  beforeEach(() => {
    cy.viewport(1280, 1000);
    cy.intercept('POST', '**/api/v1/auth/guest', { user, accessToken: 'test' });
    cy.intercept('GET', '**/api/v1/shopping-sessions/active', shopping);
    cy.intercept('GET', '**/api/v1/recipes/52771', recipe);
    cy.then(async () => { await appSession.guest(); clearCounter(user.id); clearDiscovery(user.id); });
  });

  it('restores the previous Recipe Radar result after returning from Details', () => {
    cy.intercept('POST', '**/api/v1/recipes/discover', [recipe]).as('discover');
    cy.mount(<Journey />);
    cy.get('button[aria-label="Add Tomato to counter"]').click();
    cy.contains('button', 'Find dishes').click();
    cy.wait('@discover');
    cy.contains('.recipe-match-card', recipe.name).within(() => {
      cy.contains('a', 'Details').click();
    });
    cy.contains('h1', recipe.name).should('be.visible');
    cy.contains('a', 'Back to kitchen').click();
    cy.contains('.recipe-match-card', recipe.name).should('be.visible');
    cy.contains('.match-board', '1 ideas').should('be.visible');
  });

  it('finds remote dishes, completes the counter, cooks once and restores the finished page from history', () => {
    cy.intercept('POST', '**/api/v1/recipes/discover', (req) => {
      expect(req.body).to.deep.equal({ ingredientIds: ['tomato'] });
      req.reply([recipe]);
    }).as('discover');
    const completion = cy.stub().as('completionRequest');
    cy.intercept('POST', '**/api/v1/recipes/52771/cook', (req) => {
      completion();
      expect(req.headers['idempotency-key']).to.be.a('string');
      req.reply({ id: 7, recipeId: recipe.id, name: recipe.name, cookedAt: '', completedCount: 2 });
    }).as('finish');
    cy.intercept('GET', '**/api/v1/history', [
      { id: 7, recipeId: recipe.id, name: recipe.name, cookedAt: '' },
      { id: 5, recipeId: '1', name: 'Earlier dish', cookedAt: '' },
    ]);
    cy.mount(<Journey />);
    cy.get('button[aria-label="Add Tomato to counter"]').click();
    cy.contains('button', 'Find dishes').click();
    cy.wait('@discover');
    cy.contains('button', 'Almost ready').should('exist');
    cy.get('.recipe-art img').should('have.attr', 'src', recipe.imageUrl);
    cy.contains('button', 'Add all').click();
    cy.contains('a', 'Cook now').click();
    cy.get('.step-lyrics li.active').should('contain', recipe.steps[0]);
    cy.screenshot('cooking-studio');
    cy.contains('button', 'Finish cooking').click();
    cy.wait('@finish');
    cy.contains('h1', `You made ${recipe.name}!`).should('be.visible');
    cy.get('.finished-count').should('contain', '#2');
    cy.get('.finished-photo').should('have.attr', 'src', recipe.imageUrl);
    cy.get('.finished-ingredients').should('contain', 'Tomato');
    cy.get('@completionRequest').should('have.been.calledOnce');
    cy.screenshot('cooking-finished');
    cy.contains('a', 'Back to kitchen').click();
    cy.get('.counter-emoji').should('not.exist');
    cy.get('.match-board').should('not.exist');
    cy.mount(<Journey path="/cooking-finished/7" />);
    cy.get('.finished-count').should('contain', '#2');
    cy.get('@completionRequest').should('have.been.calledOnce');
  });

  it('shows a discovery error and retries without replacing results with demo recipes', () => {
    cy.intercept('POST', '**/api/v1/recipes/discover', { statusCode: 502, body: { error: { code: 'external_api_error', message: 'Meal service unavailable' } } });
    cy.mount(<Journey />);
    cy.get('button[aria-label="Add Tomato to counter"]').click();
    cy.contains('button', 'Find dishes').click();
    cy.contains('Meal service unavailable').should('be.visible');
    cy.get('.recipe-match-card').should('not.exist');
    cy.intercept('POST', '**/api/v1/recipes/discover', []);
    cy.contains('button', 'Retry loading').click();
    cy.contains('No dishes found for this selection.').should('be.visible');
  });

  it('centers shelf icons on the pointer and preserves an off-center counter grab through release', () => {
    cy.viewport(1280, 720);
    cy.mount(<Journey />);
    cy.get('.pantry-item').first().then(($card) => {
      const rect = $card[0].getBoundingClientRect();
      const startX = rect.right - 65, startY = rect.top + 18;
      cy.wrap($card).trigger('pointerdown', { eventConstructor: 'PointerEvent', pointerId: 1, isPrimary: true, button: 0, buttons: 1, clientX: startX, clientY: startY });
      cy.document().trigger('pointermove', { eventConstructor: 'PointerEvent', pointerId: 1, isPrimary: true, buttons: 1, clientX: startX + 10, clientY: startY + 10 });
      cy.document().trigger('pointermove', { eventConstructor: 'PointerEvent', pointerId: 1, isPrimary: true, buttons: 1, clientX: 650, clientY: 390 });
      cy.get('.kitchen-drag-emoji').should(($icon) => {
        const r = $icon[0].getBoundingClientRect();
        expect(r.x + r.width / 2).to.be.closeTo(650, 2);
        expect(r.y + r.height / 2).to.be.closeTo(390, 2);
      });
      cy.document().trigger('pointerup', { eventConstructor: 'PointerEvent', pointerId: 1, isPrimary: true, button: 0, clientX: 650, clientY: 390 });
    });
    cy.get('.counter-emoji').first().then(($icon) => {
      const r = $icon[0].getBoundingClientRect();
      const x = r.x + 9, y = r.y + 17;
      cy.wrap($icon).trigger('pointerdown', { eventConstructor: 'PointerEvent', pointerId: 2, isPrimary: true, button: 0, buttons: 1, clientX: x, clientY: y });
      cy.document().trigger('pointermove', { eventConstructor: 'PointerEvent', pointerId: 2, isPrimary: true, buttons: 1, clientX: x + 10, clientY: y + 10 });
      cy.document().trigger('pointermove', { eventConstructor: 'PointerEvent', pointerId: 2, isPrimary: true, buttons: 1, clientX: x + 70, clientY: y + 30 });
      cy.get('.kitchen-drag-emoji').should(($overlay) => {
        const next = $overlay[0].getBoundingClientRect();
        expect(next.x).to.be.closeTo(r.x + 70, 2);
        expect(next.y).to.be.closeTo(r.y + 30, 2);
      });
      cy.document().trigger('pointerup', { eventConstructor: 'PointerEvent', pointerId: 2, isPrimary: true, button: 0, clientX: x + 70, clientY: y + 30 });
      cy.get('.counter-emoji').first().should(($landed) => {
        const next = $landed[0].getBoundingClientRect();
        expect(next.x).to.be.closeTo(r.x + 70, 2);
        expect(next.y).to.be.closeTo(r.y + 30, 2);
      });
    });
    cy.screenshot('kitchen-work-surface');
  });

  it('discard leaves inventory untouched and returns to the kitchen', () => {
    cy.then(() => { addIngredientToCounter(user.id, 'tomato', inventory); addIngredientToCounter(user.id, 'garlic', inventory); });
    const cook = cy.stub().as('unexpectedCook');
    cy.intercept('POST', '**/api/v1/recipes/52771/cook', cook);
    cy.mount(<Journey path="/cook/52771" />);
    cy.contains('a', 'Discard').click();
    cy.contains('h2', 'Kitchen counter').should('be.visible');
    cy.get('@unexpectedCook').should('not.have.been.called');
  });

  it('keeps the same completion key after a failed response and renders on mobile', () => {
    cy.viewport(390, 844);
    cy.then(() => { addIngredientToCounter(user.id, 'tomato', inventory); addIngredientToCounter(user.id, 'garlic', inventory); });
    const finishAttempt = cy.stub().as('finishAttempt');
    cy.intercept('POST', '**/api/v1/recipes/52771/cook', (req) => {
      finishAttempt(req.headers['idempotency-key']);
      if (finishAttempt.callCount === 1) {
        req.reply({ statusCode: 502, body: { error: { message: 'Please retry your completion' } } });
      } else {
        expect(req.headers['idempotency-key']).to.equal(finishAttempt.firstCall.args[0]);
        req.reply({ id: 7, recipeId: recipe.id, name: recipe.name, cookedAt: '', completedCount: 1 });
      }
    });
    cy.intercept('GET', '**/api/v1/history', [{ id: 7, recipeId: recipe.id, name: recipe.name, cookedAt: '' }]);
    cy.mount(<Journey path="/cook/52771" />);
    cy.get('.step-lyrics li.active').should('contain', recipe.steps[0]);
    cy.screenshot('cooking-mobile', { disableTimersAndAnimations: false });
    cy.contains('button', 'Finish cooking').click();
    cy.contains('Please retry your completion').should('be.visible');
    cy.contains('button', 'Retry finish cooking').click();
    cy.get('.finished-count').should('contain', '#1');
    cy.get('.finished-photo').should(($img) => { expect($img[0].getBoundingClientRect().width).to.be.lessThan(390); });
    cy.screenshot('finished-mobile', { disableTimersAndAnimations: false });
  });

  it('drags every one of the 80 store and 30 pantry ingredients, including scrolled shelf rows', () => {
    const fullInventory = storeIngredients.map((ingredient) => ({ ingredientId: ingredient.id, remainingUses: 3 }));
    cy.intercept('GET', '**/api/v1/shopping-sessions/active', { ...shopping, inventory: fullInventory });
    cy.then(() => appSession.refresh());
    cy.viewport(1366, 768);
    cy.mount(<Journey />);
    for (const ingredient of allIngredients) {
      if (ingredient.id === pantryIngredients[0].id) cy.contains('button', 'Default pantry').click();
      cy.get('#kitchen-counter').then(($zone) => {
        const r = $zone[0].getBoundingClientRect();
        dragTo(`[aria-label="Drag ${ingredient.name} to counter"]`, r.left + r.width * .5, r.top + r.height * .65);
      });
      cy.get('.counter-emoji').should('have.length', 1).and('have.attr', 'data-name', ingredient.name);
      cy.wait(60); // dnd-kit suppresses synthetic clicks for 50ms after pointer release.
      cy.contains('button', 'Clear').click({ force: true });
      cy.get('.counter-emoji').should('not.exist');
    }
    fitsViewport();
  });

  it('accepts drops outside the dashed inset at every brown edge using the actual release coordinates', () => {
    cy.viewport(1366, 768);
    cy.mount(<Journey />);
    for (const [x, y] of [[.02, .5], [.98, .5], [.2, .02], [.8, .98]]) {
      cy.get('#kitchen-counter').then(($zone) => {
        const r = $zone[0].getBoundingClientRect();
        const target = { x: r.left + r.width * x, y: r.top + r.height * y };
        dragTo('[aria-label="Drag Tomato to counter"]', target.x, target.y, true);
        cy.get('.counter-emoji').should(($icon) => {
          const placed = $icon[0].getBoundingClientRect();
          expect(placed.left + placed.width / 2).to.be.closeTo(target.x, 2);
          expect(placed.top + placed.height / 2).to.be.closeTo(target.y, 2);
        });
      });
      cy.wait(60); // Allow the drag sensor's click-suppression listener to detach.
      cy.contains('button', 'Clear').click();
      cy.get('.counter-emoji').should('not.exist');
    }
  });

  for (const [width, height] of [[1366, 768], [390, 844], [1280, 720], [1600, 1000]]) {
    it(`fits Kitchen, Cooking and finished content inside ${width}×${height} with navigation`, () => {
      cy.viewport(width, height);
      cy.mount(<Journey />);
      fitsViewport();
      cy.get('.kitchen-workspace').should(($workspace) => {
        const doc = $workspace[0].ownerDocument;
        const styles = doc.defaultView!.getComputedStyle(doc.documentElement);
        const nav = parseFloat(styles.getPropertyValue('--bottom-nav-space'));
        expect($workspace[0].getBoundingClientRect().bottom).to.be.closeTo(height - nav - 12, 2);
      });
      cy.get('.counter-topline').should(($line) => {
        expect(getComputedStyle($line[0]).backgroundColor).to.equal('rgba(0, 0, 0, 0)');
      });
      cy.screenshot(`kitchen-viewport-${width}`);
      cy.then(() => { addIngredientToCounter(user.id, 'tomato', inventory); addIngredientToCounter(user.id, 'garlic', inventory); });
      cy.mount(<Journey path="/cook/52771" />);
      cy.get('.step-lyrics li.active').should('exist');
      cy.get('.current-step').should('not.exist');
      fitsViewport();
      cy.contains('button', 'Finish cooking').should('be.visible');
      cy.screenshot(`cooking-viewport-${width}`, { disableTimersAndAnimations: false });
      cy.intercept('GET', '**/api/v1/history', [{ id: 7, recipeId: recipe.id, name: recipe.name, cookedAt: '' }]);
      cy.mount(<Journey path="/cooking-finished/7" />);
      cy.get('.finished-count').should('contain', '#1');
      cy.get('.cooking-bubbles').should('not.exist');
      fitsViewport();
      cy.contains('a', 'My profile').should('be.visible');
      cy.screenshot(`finished-viewport-${width}`, { disableTimersAndAnimations: false });
    });
  }

  it('puts unsupported recipes last and never offers actions for them', () => {
    const unavailable = { ...recipe, id: 'unavailable', name: 'A unavailable dish', unsupportedIngredients: ['Saffron'], requirements: [...recipe.requirements, { ingredientId: 'saffron', amount: 1, automatic: false }] };
    const purchasable = { ...recipe, id: 'purchasable', name: 'Z purchasable dish', requirements: [{ ingredientId: 'beef', amount: 1 }] };
    cy.intercept('POST', '**/api/v1/recipes/discover', [unavailable, purchasable]);
    cy.mount(<Journey />);
    cy.get('[aria-label="Add Tomato to counter"]').click();
    cy.contains('button', 'Find dishes').click();
    cy.contains('button', 'Need shopping').click();
    cy.get('.recipe-match-card h3').then(($titles) => {
      expect([...$titles].map((title) => title.textContent)).to.deep.equal(['Z purchasable dish', 'A unavailable dish']);
    });
    cy.contains('Not available in this kitchen: Saffron').should('be.visible');
    cy.contains('.recipe-match-card', 'A unavailable dish').within(() => {
      cy.contains('button', 'Unavailable ingredients').should('be.disabled');
      cy.contains('a', 'Cook now').should('not.exist');
      cy.contains('a', 'Go shopping').should('not.exist');
    });
    cy.contains('.recipe-match-card', 'Z purchasable dish').find('a').contains('Go shopping').should('exist');
  });

  it('shows the dashed guide only while the counter is empty', () => {
    cy.mount(<Journey />);
    const outline = (expected: string) => cy.get('#kitchen-counter-stage').should(($stage) => {
      const style = $stage[0].ownerDocument.defaultView!.getComputedStyle($stage[0], '::before');
      if (expected === 'none') {
        expect(style.content).to.equal('none');
        expect(style.borderTopWidth).to.equal('0px');
      } else {
        expect(style.borderTopStyle).to.equal(expected);
        expect(style.borderTopWidth).to.equal('2px');
      }
    });
    outline('dashed');
    cy.get('#kitchen-counter').then(($zone) => {
      const r = $zone[0].getBoundingClientRect();
      dragTo('[aria-label="Drag Tomato to counter"]', r.left + r.width / 2, r.top + r.height / 2);
    });
    cy.get('.counter-emoji').should('have.length', 1);
    outline('none');
    cy.wait(60); // dnd-kit click-suppression listener cleanup.
    cy.contains('button', 'Clear').click();
    outline('dashed');
  });
});
