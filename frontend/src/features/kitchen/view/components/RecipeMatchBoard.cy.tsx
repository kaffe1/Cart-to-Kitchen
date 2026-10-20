import { MemoryRouter } from "react-router-dom";
import { appRoutes } from "@/app/routes";
import { RecipeMatchBoard } from "./RecipeMatchBoard";
import type { Ingredient } from "@/features/store/model/store.types";
import type { RecipeMatch, RecipeMatchGroups } from "../../model/kitchen.types";

const tomato: Ingredient = {
  id: "tomato",
  name: "Tomato",
  emoji: "🍅",
  category: "Vegetables & Fruits",
  usesPerUnit: 3,
  priceSek: 18,
  aliases: ["tomato", "tomatoes"],
  isPantry: false,
  color: "#e84b2c",
};

const match = (
  id: string,
  name: string,
  overrides: Partial<RecipeMatch> = {},
): RecipeMatch =>
  ({
    recipe: {
      id,
      name,
      emoji: "🍝",
      accent: "#d7a951",
      category: "",
      requirements: [],
      steps: [],
    },
    availability: "ready_now",
    matchedCount: 3,
    requiredCount: 3,
    missingFromCounter: [],
    missingFromInventory: [],
    ...overrides,
  }) as RecipeMatch;

const empty: RecipeMatchGroups = {
  readyNow: [],
  almostReady: [],
  needShopping: [],
};

describe("<RecipeMatchBoard />", () => {
  it("sends to cooking page when recipe is ready", () => {
    cy.mount(
      <MemoryRouter>
        <RecipeMatchBoard
          matches={{
            ...empty,
            readyNow: [match("1", "Tomato Pasta")],
          }}
          ingredients={[tomato]}
          disabled={false}
          onCompleteCounter={cy.stub()}
        />
      </MemoryRouter>,
    );
    cy.contains("Tomato Pasta").should("be.visible");
    cy.contains("a", "Cook now").should(
      "have.attr",
      "href",
      appRoutes.cook("1"),
    );
  });

  it("adds the missing ingredients to the counter for an almost ready recipe", () => {
    const onCompleteCounter = cy.stub();

    cy.mount(
      <MemoryRouter>
        <RecipeMatchBoard
          matches={{
            ...empty,
            almostReady: [
              match("2", "Tomato Soup", {
                availability: "almost_ready",
                matchedCount: 2,
                missingFromCounter: ["tomato"],
              }),
            ],
          }}
          ingredients={[tomato]}
          disabled={false}
          onCompleteCounter={onCompleteCounter}
        />
      </MemoryRouter>,
    );
    cy.contains("In kitchen: Tomato").should("be.visible");
    cy.contains("button", "Add all").click();
    cy.wrap(onCompleteCounter).should("have.been.calledOnceWith", ["tomato"]);
  });

  it("sends to store when recipe needs shopping", () => {
    cy.mount(
      <MemoryRouter>
        <RecipeMatchBoard
          matches={{
            ...empty,
            needShopping: [
              match("3", "Tomato Salad", {
                availability: "need_shopping",
                matchedCount: 1,
                missingFromInventory: ["tomato"],
              }),
            ],
          }}
          ingredients={[tomato]}
          disabled={false}
          onCompleteCounter={cy.stub()}
        />
      </MemoryRouter>,
    );
    cy.contains("Need: Tomato").should("be.visible");
    cy.contains("a", "Go shopping").should(
      "have.attr",
      "href",
      appRoutes.store,
    );
  });

  it("displays message when nothing matches", () => {
    cy.mount(
      <MemoryRouter>
        <RecipeMatchBoard
          matches={empty}
          ingredients={[tomato]}
          disabled={false}
          onCompleteCounter={cy.stub()}
        />
      </MemoryRouter>,
    );
    cy.contains("No dishes found for this selection").should("be.visible");
  });
});
