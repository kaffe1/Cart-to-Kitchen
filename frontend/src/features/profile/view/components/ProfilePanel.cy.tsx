import { ProfilePanel } from "./ProfilePanel";
import type { Profile } from "../../model/profile.types";

const testProfile: Profile = {
  displayName: "Test",
  email: "test@example.com",
  mode: "account",
  avatarUrl: null,
  cookingHistory: [],
};

const mountPanel = (profile: Profile = testProfile) =>
  cy.mount(
    <ProfilePanel
      profile={profile}
      onDisplayNameChange={cy.stub().as("onDisplayNameChange")}
      onEmailChange={cy.stub().as("onEmailChange")}
      onPasswordChange={cy.stub().as("onPasswordChange")}
      onAvatarChange={cy.stub().as("onAvatarChange")}
      onSignOut={cy.stub().as("onSignOut")}
    />,
  );

const clickChangeIn = (rowLabel: string) =>
  cy.contains(".profile-setting-row", rowLabel).within(() => {
    cy.contains("button", "Change").click();
  });

describe("<ProfilePanel />", () => {
  it("shows the users current display name and email", () => {
    mountPanel();
    cy.contains("Hello, Test!").should("be.visible");
    cy.contains("test@example.com").should("be.visible");
  });

  it("shows a placeholder when there is no email", () => {
    mountPanel({ ...testProfile, email: null });
    cy.contains("No email address").should("be.visible");
  });

  it("shows initials when there is no avatar image", () => {
    mountPanel();
    cy.contains("TE").should("exist");
  });

  it("calls correct callback for each action", () => {
    mountPanel();
    cy.contains("button", "Change avatar").click();
    cy.get("@onAvatarChange").should("have.been.calledOnce");
    cy.contains("button", "Sign Out").click();
    cy.get("@onSignOut").should("have.been.calledOnce");
    clickChangeIn("Display name");
    cy.get("@onDisplayNameChange").should("have.been.calledOnce");
    clickChangeIn("Email");
    cy.get("@onEmailChange").should("have.been.calledOnce");
    clickChangeIn("Password");
    cy.get("@onPasswordChange").should("have.been.calledOnce");
  });
});
