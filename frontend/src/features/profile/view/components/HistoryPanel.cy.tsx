import { HistoryPanel } from "./HistoryPanel";
import type { CookedRecipe } from "../../model/profile.types";
import { ApiError } from "@/shared/api/apiError";

const testRecipes: CookedRecipe[] = [
  {
    entryId: "1",
    recipeId: "1",
    name: "dish 1",
    cookedAt: "2026-10-12T12:00:00",
    review: null,
    reviewImageUrl: null,
  },
  {
    entryId: "2",
    recipeId: "2",
    name: "dish 2",
    cookedAt: "2026-10-12T12:00:00",
    review: null,
    reviewImageUrl: null,
  },
];

const toggle = (name: string) =>
  cy.contains("li", name).find("button[aria-expanded]");

describe("<HistoryPanel />", () => {
  it("Shows message when user has no cooking history", () => {
    cy.mount(<HistoryPanel cookedRecipes={[]} onReviewSave={cy.stub()} />);
    cy.contains("No cooked recipes yet").should("exist");
  });

  it("Shows the name of the cooked recipes and the history count", () => {
    cy.mount(
      <HistoryPanel cookedRecipes={testRecipes} onReviewSave={cy.stub()} />,
    );
    cy.contains("dish 1").should("be.visible");
    cy.contains("dish 2").should("be.visible");
    cy.contains("2 cooked").should("be.visible");
  });

  it("opens one card at a time", () => {
    cy.mount(
      <HistoryPanel cookedRecipes={testRecipes} onReviewSave={cy.stub()} />,
    );
    toggle("dish 1").click();
    toggle("dish 1").should("have.attr", "aria-expanded", "true");
    toggle("dish 2").click();
    toggle("dish 1").should("have.attr", "aria-expanded", "false");
    toggle("dish 2").should("have.attr", "aria-expanded", "true");
  });

  it("saves against entryId", () => {
    const onReviewSave = cy.stub().as("onReviewSave").resolves();
    cy.mount(
      <HistoryPanel cookedRecipes={testRecipes} onReviewSave={onReviewSave} />,
    );
    toggle("dish 1").click();
    cy.contains("button", "Add review").click();
    cy.get('[aria-label="Review text"]').type("Delicious");
    cy.contains("button", "Save review").click();
    cy.get("@onReviewSave").should(
      "have.been.calledWith",
      "1",
      "<p>Delicious</p>",
      null,
    );
    cy.contains("button", "Save review").should("not.exist");
  });

  it("keeps the card open when saving fails", () => {
    const onReviewSave = cy
      .stub()
      .rejects(new ApiError("x", "PROFANITY_REJECTED", 422));
    cy.mount(
      <HistoryPanel cookedRecipes={testRecipes} onReviewSave={onReviewSave} />,
    );
    toggle("dish 1").click();
    cy.contains("button", "Add review").click();
    cy.get('[aria-label="Review text"]').type("damn");
    cy.contains("button", "Save review").click();
    toggle("dish 1").should("have.attr", "aria-expanded", "true");
  });
});
