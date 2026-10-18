import type { Ingredient } from "../../model/store.types";
import { IngredientCard } from "./IngredientCard";

const tomato: Ingredient = {
  id: "tomato",
  name: "Tomato",
  emoji: "🍅",
  category: "Vegetables & Fruits",
  usesPerUnit: 3,
  priceSek: 18,
  aliases: [],
  isPantry: false,
  color: "#d95c4f",
};

describe("<IngredientCard />", () => {
  it("keeps product information static and exposes only the Add action", () => {
    const onAdd = cy.stub().as("onAdd");
    cy.mount(<IngredientCard ingredient={tomato} onAdd={onAdd} />);

    cy.get("button").should("have.length", 1);
    cy.contains("button", "Add").click();
    cy.get("@onAdd").should("have.been.calledOnceWith", "tomato");
  });
});
