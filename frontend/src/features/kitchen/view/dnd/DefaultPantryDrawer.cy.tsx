import { DndContext } from "@dnd-kit/core";
import { DefaultPantryDrawer } from "./DefaultPantryDrawer";

describe("<DefaultPantryDrawer />", () => {
  it("opens and closes with handle, and only allow items when open", () => {
    cy.mount(
      <DndContext>
        <DefaultPantryDrawer
          ingredients={[
            {
              id: "salt",
              name: "Salt",
              emoji: "🧂",
              color: "",
              category: "Essential Seasonings & Oils",
              usesPerUnit: "infinite",
              priceSek: 0,
              aliases: [""],
              isPantry: true,
            },
          ]}
        />
      </DndContext>,
    );
    cy.contains("button", "Default pantry").should(
      "have.attr",
      "aria-expanded",
      "false",
    );
    cy.get('[aria-label="Drag Salt to counter"]').should("be.disabled");
    cy.contains("button", "Default pantry").click();
    cy.contains("button", "Default pantry").should(
      "have.attr",
      "aria-expanded",
      "true",
    );
    cy.get('[aria-label="Drag Salt to counter"]').should("be.enabled");
  });
});
