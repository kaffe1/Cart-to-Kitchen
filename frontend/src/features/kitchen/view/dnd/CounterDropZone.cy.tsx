import { DndContext } from "@dnd-kit/core";
import { CounterDropZone } from "./CounterDropZone";
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

describe("<CounterDropZone />", () => {
  it("shows a message and no clear button when counter is empty", () => {
    cy.mount(
      <DndContext>
        <CounterDropZone items={[]} onClear={cy.stub()} />
      </DndContext>,
    );
    cy.contains("Drop ingredients here").should("be.visible");
    cy.contains("button", "Clear").should("not.exist");
  });

  it("shows the placed ingredients and clears them", () => {
    const onClear = cy.stub().as("onClear");
    cy.mount(
      <DndContext>
        <CounterDropZone
          items={[
            {
              id: "placement-1",
              ingredientId: "tomato",
              x: 0.5,
              y: 0.5,
              ingredient: tomato,
            },
          ]}
          onClear={onClear}
        />
      </DndContext>,
    );
    cy.get('[aria-label^="Move Tomato"]').should("exist");
    cy.contains("button", "Clear").click();
    cy.get("@onClear").should("have.been.calledOnce");
  });
});
