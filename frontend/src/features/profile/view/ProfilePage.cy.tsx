import { MemoryRouter } from "react-router-dom";
import { ProfilePage } from "./ProfilePage";

describe("<ProfilePage />", () => {
  it("retries after a transient profile load failure", () => {
    let attempts = 0;
    cy.intercept("GET", "**/api/v1/auth/me", (request) => {
      attempts += 1;
      if (attempts === 1) {
        request.reply({ statusCode: 500, body: { error: { message: "Offline" } } });
        return;
      }
      request.reply({
        user: {
          id: "profile-retry-user",
          displayName: "Retry Cook",
          email: "retry@example.com",
          mode: "account",
          createdAt: "2026-10-18T10:00:00Z",
          avatarUrl: null,
        },
      });
    });
    cy.intercept("GET", "**/api/v1/history", []);

    cy.mount(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    cy.contains("Profile unavailable");
    cy.contains("button", "Retry").click();
    cy.contains("h1", "Hello, Retry Cook!");
  });
});
