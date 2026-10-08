import { EmailDialog } from "./EmailDialog";

describe("<EmailDialog />", () => {
  it("calls onSave with the entered email when save is clicked", () => {
    const onSave = cy.stub().as("onSave");
    cy.mount(
      <EmailDialog
        open={true}
        currentEmail="oldEmail@example.com"
        onSave={onSave}
        onClose={cy.stub()}
      />,
    );
    cy.get("input").clear().type("newEmail@example.com");
    cy.contains("button", "Save").click();
    cy.get("@onSave").should("have.been.calledWith", "newEmail@example.com");
  });

  it("calls onClose when Cancel is clicked", () => {
    const onClose = cy.stub().as("onClose");
    cy.mount(
      <EmailDialog
        open
        currentEmail="a@b.se"
        onSave={cy.stub()}
        onClose={onClose}
      />,
    );
    cy.contains("button", "Cancel").click();
    cy.get("@onClose").should("have.been.called");
  });
});
