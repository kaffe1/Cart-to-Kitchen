import type { CookedRecipe } from "@/features/profile/model/profile.types";
import { Button } from "@/shared/components/ui/button";
import { useState } from "react";
import { ReviewDialog } from "./ReviewDialog";

type HistoryPanelProps = {
  cookedRecipes: CookedRecipe[];
};

export function HistoryPanel({ cookedRecipes }: HistoryPanelProps) {
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(null);
  const activeRecipe = cookedRecipes.find(
    (recipe) => recipe.recipeId === activeRecipeId,
  );

  return (
    <article className="rounded-2xl border bg-card p-6 shadow-sm flex-auto m-2">
      <h2 className="text-base font-semibold mb-4">History</h2>

      {cookedRecipes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No cooked recipes yet.</p>
      ) : (
        <ul className="flex flex-col gap-2 overflow-y-auto max-h-80">
          {cookedRecipes.map((recipe) => (
            <li
              key={recipe.recipeId}
              className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-medium truncate">
                  {recipe.name}
                </span>
                <Button
                  variant="link"
                  onClick={() => setActiveRecipeId(recipe.recipeId)}
                >
                  my review
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {activeRecipe && (
        <ReviewDialog
          open={!!activeRecipe}
          onClose={() => setActiveRecipeId(null)}
          recipeName={activeRecipe.name}
        />
      )}
    </article>
  );
}

// Scrollable list of cooked recipes
// Name | My review | Mark as favorite
// Write review (not first priority)
