import { UsernameDialog } from "./UsernameDialog";

describe("<UsernameDialog />", () => {
  it("calls onSave with the entered username when save is clicked", () => {
    const onSave = cy.stub().as("onSave");
    cy.mount(
      <UsernameDialog
        open={true}
        currentUsername="old-name"
        onClose={cy.stub()}
        onSave={onSave}
      />,
    );
    cy.get('input').clear().type('new-name')
    cy.contains('button', 'Save').click()
    cy.get('@onSave').should('have.been.calledWith', 'new-name')
  });
});
