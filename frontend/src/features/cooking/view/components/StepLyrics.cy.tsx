import { StepLyrics, STEP_INTERVAL_MS } from './StepLyrics';

describe('StepLyrics', () => {
  it('auto-plays every two seconds and yields control after user interaction', () => {
    cy.clock();
    cy.mount(<StepLyrics steps={['Chop vegetables.', 'Simmer gently.', 'Serve warm.']} />);
    cy.get('.step-lyrics li.active').should('contain', 'Chop vegetables.');
    expect(STEP_INTERVAL_MS).to.equal(2000);
    cy.tick(STEP_INTERVAL_MS);
    cy.get('.step-lyrics li.active').should('contain', 'Simmer gently.');
    cy.tick(1);
    cy.tick(STEP_INTERVAL_MS);
    cy.get('.step-lyrics li.active').should('contain', 'Serve warm.');
    cy.contains('button', /Replay|Pause|Play/).should('not.exist');
  });

  it('pauses for user scrolling, then resumes when the pointer leaves', () => {
    cy.clock();
    cy.mount(<StepLyrics steps={['Chop vegetables.', 'Simmer gently.', 'Serve warm.']} />);
    cy.get('.step-lyrics').trigger('wheel', { deltaY: 120 });
    cy.tick(STEP_INTERVAL_MS * 2);
    cy.get('.step-lyrics li.active').should('contain', 'Chop vegetables.');
    cy.get('.step-lyrics').trigger('mouseout', { relatedTarget: document.body });
    cy.tick(STEP_INTERVAL_MS);
    cy.get('.step-lyrics li.active').should('contain', 'Simmer gently.');
    cy.tick(1);
    cy.tick(STEP_INTERVAL_MS);
    cy.get('.step-lyrics li.active').should('contain', 'Serve warm.');
  });
});
