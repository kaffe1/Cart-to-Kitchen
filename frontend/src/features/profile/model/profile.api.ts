import type { CookedRecipe, Profile } from "./profile.types";
import { requestJson as req } from "@/shared/api/httpClient";

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

const toProfile = (me: MeDto, history: CookedRecipe[] = []): Profile => ({
  displayName: me.displayName,
  email: me.email,
  mode: me.mode,
  avatarUrl: me.avatarUrl ?? null,
  cookingHistory: history,
});

type HistoryDto = {
  id: number;
  recipeId: string;
  name: string;
  cookedAt: string;
  review: string | null;
  reviewImageUrl: string | null;
};

const toCookedRecipe = (history: HistoryDto): CookedRecipe => ({
  entryId: String(history.id),
  recipeId: history.recipeId,
  name: history.name,
  cookedAt: history.cookedAt,
  review: history.review,
  reviewImageUrl: history.reviewImageUrl,
});

const newestFirst = (a: CookedRecipe, b: CookedRecipe) =>
  b.cookedAt.localeCompare(a.cookedAt);

export const getProfile = async (): Promise<Profile> => {
  const resp = await req<MeResponse>("/auth/me");
  const basicProfile = toProfile(resp.user);
  if (basicProfile.mode === "guest") return basicProfile;
  const history = await req<HistoryDto[]>("/history");
  return {
    ...basicProfile,
    cookingHistory: history.map(toCookedRecipe).toSorted(newestFirst),
  };
};

export const updateDisplayName = async (
  newDisplayName: string,
): Promise<void> => {
  await req<MeDto>("/me", {
    method: "PATCH",
    body: JSON.stringify({ displayName: newDisplayName }),
  });
};

export const updateAvatar = async (file: File): Promise<string | null> => {
  const formData = new FormData();
  formData.append("image", file);
  const me = await req<MeDto>("/me/avatar", { method: "PUT", body: formData });
  return me.avatarUrl ?? null;
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

export const saveReview = async (
  entryId: string,
  text: string,
  image: File | null,
): Promise<CookedRecipe> => {
  const formData = new FormData();
  formData.append("text", text);
  if (image) formData.append("image", image);
  const saved = await req<HistoryDto>(`/history/${entryId}/review`, {
    method: "PUT",
    body: formData,
  });
  return toCookedRecipe(saved);
};
