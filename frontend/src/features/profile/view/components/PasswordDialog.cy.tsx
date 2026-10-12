import { PasswordDialog } from "./PasswordDialog";

describe("<PasswordDialog />", () => {
  const typeHelper = (placeholder: string, text: string) =>
    cy.get(`input[placeholder="${placeholder}"]`).type(text);

  const fillForm = (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) => {
    typeHelper("Enter current password", currentPassword);
    typeHelper("Enter new password", newPassword);
    typeHelper("Confirm new password", confirmPassword);
  };

  it("calls onSave with current password and new password, when new password and confirm password match", () => {
    const onSave = cy.stub().as("onSave");
    cy.mount(
      <PasswordDialog open={true} onSave={onSave} onClose={cy.stub()} />,
    );
    fillForm("old-password", "match-password", "match-password");
    cy.contains("button", "Save").click();
    cy.get("@onSave").should(
      "have.been.calledWith",
      "old-password",
      "match-password",
    );
  });

  it("disables save button and shows error message when new password and confirm password does not match", () => {
    cy.mount(
      <PasswordDialog open={true} onSave={cy.stub()} onClose={cy.stub()} />,
    );
    fillForm("old-password", "new-password", "no-match-password");
    cy.contains("button", "Save").should("be.disabled");
    cy.contains("Passwords do not match").should("exist");
  });

  it("shows error message when onSave fails", () => {
    const onSave = cy.stub().as("onSave").rejects(new Error("error"));
    cy.mount(
      <PasswordDialog open={true} onSave={onSave} onClose={cy.stub()} />,
    );
    fillForm("old-password", "new-password", "new-password");
    cy.contains("button", "Save").click();
    cy.get("@onSave").should("have.been.called");
    cy.contains("Failed to change password").should("exist");
  });

  it("calls onClose when Cancel is clicked", () => {
    const onClose = cy.stub().as("onClose");
    cy.mount(
      <PasswordDialog open={true} onSave={cy.stub()} onClose={onClose} />,
    );
    cy.contains("button", "Cancel").click();
    cy.get("@onClose").should("have.been.called");
  });
});
