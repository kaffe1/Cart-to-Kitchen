import type { ProfilePlaceholder } from "./profile.types";

const profilePlaceholder: ProfilePlaceholder = {
  username: "Guest cook",
  mode: "Guest mode",
  note: "Profile features will be implemented in a later development phase.",
  cookingHistory: [
    {
      recipeId: "1",
      name: "Spaghetti Bolognese",
      review: "Delicious and easy to make!",
      reviewImageUrl: "https://example.com/spaghetti.jpg",
    },
    {
      recipeId: "2",
      name: "Chicken Curry",
      review: "A bit too spicy for my taste.",
      reviewImageUrl: "https://example.com/chicken-curry.jpg",
    },
  ],
};

// TODO(BACKEND): Replace this placeholder with the current-user endpoint.
export function getProfilePlaceholder(): ProfilePlaceholder {
  return profilePlaceholder;
}
