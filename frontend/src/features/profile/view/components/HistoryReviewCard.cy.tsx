import React from "react";
import { HistoryReviewCard } from "./HistoryReviewCard";
import type { CookedRecipe } from "../../model/profile.types";
import { ApiError } from "@/shared/api/apiError";

const testRecipe: CookedRecipe = {
  entryId: "1",
  recipeId: "52772",
  name: "dish 1",
  cookedAt: "2026-10-12T12:00:00",
  review: null,
  reviewImageUrl: null,
};

const reviewRecipe: CookedRecipe = {
  entryId: "1",
  recipeId: "52772",
  name: "dish 1",
  cookedAt: "2026-10-12T12:00:00",
  review: "<p>Very <strong>good</strong></p>",
  reviewImageUrl: null,
};

describe("<HistoryReviewCard />", () => {
  it("keeps save disabled when there is no text", () => {
    const onReviewSave = cy.stub().as("onSave").resolves();
    cy.mount(
      <HistoryReviewCard
        recipe={testRecipe}
        expanded={true}
        onToggle={cy.stub().as("onToggle")}
        onSave={onReviewSave}
      />,
    );
    cy.contains("button", "Add review").click();
    cy.contains("button", "Save review").should("be.disabled");
    cy.contains("A review must contain some text").should("be.visible");
    cy.get('[aria-label="Review text"]').type("entered text");
    cy.contains("button", "Save review").should("be.enabled");
  });

  it("shows error message when saving fails", () => {
    const onReviewSave = cy
      .stub()
      .as("onSave")
      .rejects(new ApiError("x", "PROFANITY_REJECTED", 422));
    cy.mount(
      <HistoryReviewCard
        recipe={testRecipe}
        expanded={true}
        onToggle={cy.stub().as("onToggle")}
        onSave={onReviewSave}
      />,
    );
    cy.contains("button", "Add review").click();
    cy.get('[aria-label="Review text"]').type("damn");
    cy.contains("button", "Save review").click();
    cy.get('[role="alert"]').should("contain", "not allowed");
    cy.contains("button", "Save review").should("exist");
  });

  it("discards entered text when cancel is clicked", () => {
    const onReviewSave = cy.stub().as("onSave").resolves();
    cy.mount(
      <HistoryReviewCard
        recipe={testRecipe}
        expanded={true}
        onToggle={cy.stub().as("onToggle")}
        onSave={onReviewSave}
      />,
    );
    cy.contains("button", "Add review").click();
    cy.get('[aria-label="Review text"]').type("Cancel text");
    cy.contains("button", "Cancel").click();
    cy.get("@onSave").should("not.have.been.called");
    cy.contains("button", "Add review").click();
    cy.get('[aria-label="Review text"]').should("not.contain", "Cancel text");
    cy.contains("button", "Save review").should("be.disabled");
  });

  it("shows saved review as formated text instead of raw html", () => {
    const onReviewSave = cy.stub().as("onSave").resolves();
    cy.mount(
      <HistoryReviewCard
        recipe={reviewRecipe}
        expanded={true}
        onToggle={cy.stub().as("onToggle")}
        onSave={onReviewSave}
      />,
    );
    cy.contains("Very").should("be.visible");
    cy.contains("strong", "good").should("exist");
    cy.contains("<p>").should("not.exist");
  });
});
