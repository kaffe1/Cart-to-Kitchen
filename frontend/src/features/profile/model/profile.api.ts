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
}

type MeResponse = {
  user: MeDto;
};

const toProfile = (me: MeDto): Profile => ({
  displayName: me.displayName,
  email: me.email,
  mode: me.mode,
  avatarUrl: me.avatarUrl ?? null,
  cookingHistory: [], // TODO: Fetch cooking history from backend when frontend is more ready
});

export const getProfile = async (): Promise<Profile> => {
  const resp = await req<MeResponse>("/auth/me");
  return toProfile(resp.user);
}

export const updateDisplayName = async (newDisplayName: string): Promise<void> => {
  await req<MeDto>("/me", {
    method: "PATCH",
    body: JSON.stringify({ display_name: newDisplayName }),
  });
}

// TODO: Update Avatar
export const updateAvatar = async (file: File): Promise<void> => {
  const formData = new FormData();
  formData.append("image", file);
  await req("/me/avatar", {
    method: "PUT",
    body: formData,
  });
}

// TODO: Update Email
export const updateEmail = async (newEmail: string): Promise<void> => {
  await req<MeDto>("/me", {
    method: "PATCH",
    body: JSON.stringify({ email: newEmail }),
  });
}

// TODO: Update Password
export const updatePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  await req("/me", {
    method: "PATCH",
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
}