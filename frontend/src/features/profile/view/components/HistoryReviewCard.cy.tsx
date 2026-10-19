import React from 'react'
import { HistoryReviewCard } from './HistoryReviewCard'
import type { CookedRecipe } from '../../model/profile.types'

const recipe: CookedRecipe = {
  entryId: '1',
  recipeId: '52770',
  name: 'Spaghetti Bolognese',
  cookedAt: '2026-10-19T12:00:00.000Z',
  review: null,
  reviewImageUrl: null,
}

describe('<HistoryReviewCard />', () => {
  it('renders', () => {
    cy.mount(
      <HistoryReviewCard
        recipe={recipe}
        expanded={false}
        onToggle={() => {}}
        onSave={async () => {}}
      />,
    )
  })
})
