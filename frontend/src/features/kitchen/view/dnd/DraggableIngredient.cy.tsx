import { DndContext } from "@dnd-kit/core";
import { DraggableIngredient } from "./DraggableIngredient";
import type { Ingredient } from "@/features/store/model/store.types";

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

describe("<DraggableIngredient />", () => {
  it("adds ingredient to counter when plus button is clicked", () => {
    cy.mount(
      <DndContext>
        <DraggableIngredient
          ingredient={tomato}
          remainingUses={2}
          onAdd={cy.stub().as("onAdd")}
        />
      </DndContext>,
    );
    cy.get('[aria-label="Add Tomato to counter"]').click();
    cy.get("@onAdd").should("have.been.calledOnceWith", "tomato");
  });

  it("shows remaining uses, or that it is always available", () => {
    cy.mount(
      <DndContext>
        <DraggableIngredient
          ingredient={tomato}
          remainingUses={2}
          onAdd={cy.stub().as("onAdd")}
        />
      </DndContext>,
    );
    cy.contains("2 uses left").should("be.visible");
    cy.mount(
      <DndContext>
        <DraggableIngredient
          ingredient={tomato}
          remainingUses={"infinite"}
          onAdd={cy.stub().as("onAdd")}
        />
      </DndContext>,
    );
    cy.contains("Always available").should("be.visible");
  });

  it("cannot add ingredient with no uses are left", () => {
    cy.mount(
      <DndContext>
        <DraggableIngredient
          ingredient={tomato}
          remainingUses={0}
          onAdd={cy.stub().as("onAdd")}
        />
      </DndContext>,
    );
    cy.get('[aria-label="Add Tomato to counter"]').should("be.disabled");
  });
});
