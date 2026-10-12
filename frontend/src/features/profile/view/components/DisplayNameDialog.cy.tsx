import { DisplayNameDialog } from "./DisplayNameDialog";

describe("<DisplayNameDialog />", () => {
  it("calls onSave with the entered display name when save is clicked", () => {
    const onSave = cy.stub().as("onSave");
    cy.mount(
      <DisplayNameDialog
        open={true}
        currentDisplayName="old-name"
        onClose={cy.stub()}
        onSave={onSave}
      />,
    );
    cy.get("input").clear().type("new-name");
    cy.contains("button", "Save").click();
    cy.get("@onSave").should("have.been.calledWith", "new-name");
  });

  it("calls onClose when Cancel is clicked", () => {
    const onClose = cy.stub().as("onClose");
    cy.mount(
      <DisplayNameDialog
        open
        currentDisplayName="old-name"
        onSave={cy.stub()}
        onClose={onClose}
      />,
    );
    cy.contains("button", "Cancel").click();
    cy.get("@onClose").should("have.been.called");
  });
});
