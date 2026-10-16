import type { ProfilePlaceholder, Profile } from "./profile.types";
import { requestJson as req } from "@/shared/api/httpClient";

const profilePlaceholder: ProfilePlaceholder = {
  displayName: "Guest cook",
  email: "guest@example.com",
  //mode: "guest",
  mode: "account",
  avatarUrl: null,
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

type MeDto = {
  id: string;
  displayName: string;
  email: string | null;
  mode: "account" | "guest";
  createdAt: string;
  avatarUrl?: string | null;
};

type MeResponse = {
  user: MeDto;
};

const toProfile = (me: MeDto): Profile => ({
  displayName: me.displayName,
  email: me.email,
  mode: me.mode,
  avatarUrl: me.avatarUrl
    ? `${me.avatarUrl}${me.avatarUrl.includes("?") ? "&" : "?"}v=${Date.now()}`
    : null,
  cookingHistory: [], // TODO: Fetch cooking history from backend when frontend is more ready
});

export const getProfile = async (): Promise<Profile> => {
  const resp = await req<MeResponse>("/auth/me");
  return toProfile(resp.user);
};

export const updateDisplayName = async (
  newDisplayName: string,
): Promise<void> => {
  await req<MeDto>("/me", {
    method: "PATCH",
    body: JSON.stringify({ displayName: newDisplayName }),
  });
};

export const updateAvatar = (file: File) => {
  const formData = new FormData();
  formData.append("image", file);
  return req<MeDto>("/me/avatar", { method: "PUT", body: formData });
};

export const updateCookingReview = async (
  historyId: number,
  text: string,
  image?: File,
) => {
  void historyId;
  void text;
  void image;
  // TODO(BACKEND): Connect review updates to the profile history endpoint.
};

export const updateEmail = async (newEmail: string): Promise<void> => {
  await req<MeDto>("/me", {
    method: "PATCH",
    body: JSON.stringify({ email: newEmail }),
  });
};

export const updatePassword = async (
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  await req("/me", {
    method: "PATCH",
    body: JSON.stringify({
      currentPassword: currentPassword,
      newPassword: newPassword,
    }),
  });
};
