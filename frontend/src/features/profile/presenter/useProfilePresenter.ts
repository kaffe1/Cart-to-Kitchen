import { useEffect, useState } from "react";
import type { Profile } from "../model/profile.types";
import {
  getProfile,
  updateDisplayName,
  updateEmail,
  updatePassword,
  updateAvatar,
  saveReview,
} from "../model/profile.api";
import { ApiError } from "@/shared/api/apiError";
import { appSession } from "@/shared/api/appSession";

export function useProfilePresenter() {
  const [isDisplayNameDialogOpen, setDisplayNameDialogOpen] = useState(false);
  const [isEmailDialogOpen, setEmailDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [isAvatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getProfile()
      .then((loadedProfile) => {
        if (active) setProfile(loadedProfile);
      })
      .catch((error: unknown) => {
        if (!active) return;
        const isSessionError =
          error instanceof ApiError &&
          (error.code === "invalid_session" || error.code === "auth_required");
        if (!isSessionError) {
          setLoadError("Could not load your profile.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadAttempt]);

  const isGuestUser =
    !isLoading && !loadError && (profile === null || profile.mode === "guest");

  const patchProfile = (patch: Partial<Profile>) =>
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));

  const openDisplayNameDialog = () => {
    setDisplayNameDialogOpen(true);
  };

  const closeDisplayNameDialog = () => {
    setDisplayNameDialogOpen(false);
  };

  const openEmailDialog = () => {
    setEmailDialogOpen(true);
  };

  const closeEmailDialog = () => {
    setEmailDialogOpen(false);
  };

  const openPasswordDialog = () => {
    setPasswordDialogOpen(true);
  };

  const closePasswordDialog = () => {
    setPasswordDialogOpen(false);
  };

  const openAvatarDialog = () => {
    setAvatarDialogOpen(true);
  };

  const closeAvatarDialog = () => {
    setAvatarDialogOpen(false);
  };

  const handleDisplayNameSave = async (newDisplayName: string) => {
    const userId = appSession.getSnapshot().user?.id;
    await updateDisplayName(newDisplayName);
    patchProfile({ displayName: newDisplayName });
    if (userId) appSession.patchUser(userId, { displayName: newDisplayName });
    closeDisplayNameDialog();
  };

  const handleEmailSave = async (newEmail: string) => {
    await updateEmail(newEmail);
    patchProfile({ email: newEmail });
    closeEmailDialog();
  };

  const handlePasswordSave = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    await updatePassword(currentPassword, newPassword);
    closePasswordDialog();
  };

  const handleAvatarSave = async (file: File) => {
    const avatarUrl = await updateAvatar(file);
    patchProfile({
      avatarUrl: avatarUrl ? `${avatarUrl}?v=${Date.now()}` : null,
    });
    closeAvatarDialog();
  };

  const handleReviewSave = async (entryId: string, text: string, file: File | null) => {
    const savedReview = await saveReview(entryId, text, file);
    const updated = savedReview.reviewImageUrl ? {...savedReview, reviewImageUrl: `${savedReview.reviewImageUrl}?v=${Date.now()}`}: savedReview;
    setProfile((prev) => prev ? {...prev,
          cookingHistory: prev.cookingHistory.map((recipe) =>
            recipe.entryId === updated.entryId ? updated : recipe,
          ),} : prev,);
  };

  const retryProfile = () => {
    setIsLoading(true);
    setLoadError(null);
    setLoadAttempt((attempt) => attempt + 1);
  };

  return {
    profile,
    isGuestUser,
    isDisplayNameDialogOpen,
    openDisplayNameDialog,
    closeDisplayNameDialog,
    isEmailDialogOpen,
    openEmailDialog,
    closeEmailDialog,
    isPasswordDialogOpen,
    openPasswordDialog,
    closePasswordDialog,
    isAvatarDialogOpen,
    openAvatarDialog,
    closeAvatarDialog,
    handleDisplayNameSave,
    handleEmailSave,
    handlePasswordSave,
    handleAvatarSave,
    handleReviewSave,
    isLoading,
    loadError,
    retryProfile,
  };
}
