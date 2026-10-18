import { AvatarDialog } from "./AvatarDialog";

const file = (name: string, mimeType: string, bytes = 10) => ({
  contents: Cypress.Buffer.alloc(bytes),
  fileName: name,
  mimeType,
});

const choose = (f: ReturnType<typeof file>) =>
  cy.get('input[type="file"]').selectFile(f, { force: true });

describe("<AvatarDialog />", () => {
  it("keeps save button disabled until an image is chosen", () => {
    cy.mount(<AvatarDialog open onClose={cy.stub()} onSave={cy.stub()} />);
    cy.contains("button", "Save").should("be.disabled");
    choose(file("chosen.png", "image/png"));
    cy.contains("button", "Save").should("be.enabled");
  });

  it("calls onSave with chosen file", () => {
    const onSave = cy.stub().as("onSave").resolves();
    cy.mount(<AvatarDialog open onClose={cy.stub()} onSave={onSave} />);
    choose(file("chosen.png", "image/png"));
    cy.contains("button", "Save").click();
    cy.get("@onSave").its("firstCall.args.0.name").should("eq", "chosen.png");
  });

  it("rejects wrong file formats", () => {
    cy.mount(<AvatarDialog open onClose={cy.stub()} onSave={cy.stub()} />);
    choose(file("wrong.gif", "image/gif"));
    cy.contains("valid image file").should("be.visible");
    cy.contains("button", "Save").should("be.disabled");
  });

  it("rejects files over 2 MB", () => {
    cy.mount(<AvatarDialog open onClose={cy.stub()} onSave={cy.stub()} />);
    choose(file("large.png", "image/png", 2 * 1024 * 1024 + 1));
    cy.contains("smaller than 2 MB").should("be.visible");
  });
});
