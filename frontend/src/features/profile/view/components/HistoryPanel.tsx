import type { CookedRecipe } from "@/features/profile/model/profile.types";
import { useState } from "react";
import { ChefHat } from "lucide-react";
import { HistoryReviewCard } from "./HistoryReviewCard";

type HistoryPanelProps = {
  cookedRecipes: CookedRecipe[];
  onReviewSave: (entryId: string, text: string, image: File | null) => Promise<void>;
};

export function HistoryPanel({ cookedRecipes, onReviewSave }: HistoryPanelProps) {
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  return (
    <article className="profile-card profile-history-card">
      <header className="profile-section-heading">
        <span className="profile-section-icon" aria-hidden="true">
          <ChefHat />
        </span>
        <div>
          <h2>Cooking history</h2>
        </div>
        <span className="profile-history-count">
          {cookedRecipes.length} cooked
        </span>
      </header>

      {cookedRecipes.length === 0 ? (
        <div className="profile-history-empty">
          <span aria-hidden="true">🍳</span>
          <strong>No cooked recipes yet</strong>
          <p>Your first completed dish will appear here.</p>
        </div>
      ) : (
        <ul className="profile-history-list">
          {cookedRecipes.map((recipe) => (
            <HistoryReviewCard
              key={recipe.entryId}
              recipe={recipe}
              expanded={activeEntryId === recipe.entryId}
              onToggle={() =>
                setActiveEntryId((current) =>
                  current === recipe.entryId ? null : recipe.entryId,
                )
              }
              onSave={async (entryId, text, image) => {
                await onReviewSave(entryId, text, image); 
                setActiveEntryId(null); 
              }}
            />
          ))}
        </ul>
      )}
    </article>
  );
}
