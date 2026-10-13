import { useEffect, useState } from "react";
import { Profile } from "../model/profile.types";
import {
  getProfile,
  updateDisplayName,
  updateEmail,
  getProfilePlaceholder,
  updatePassword,
  updateAvatar,
} from "../model/profile.api";
import { ApiError } from "@/shared/api/apiError";

export function useProfilePresenter() {
  const [isDisplayNameDialogOpen, setDisplayNameDialogOpen] = useState(false);
  const [isEmailDialogOpen, setEmailDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [isAvatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [testProfile, setTestProfile] = useState(getProfilePlaceholder); // only for testing
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch((error: unknown) => {
        if (
          error instanceof ApiError &&
          (error.code === "auth_required" || error.code === "invalid_session")
        ) {
          setLoadError("You must be signed in to view your profile.");
        } else {
          setLoadError("Could not load your profile.");
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

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
    await updateDisplayName(newDisplayName);
    patchProfile({ displayName: newDisplayName });
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
    const me = await updateAvatar(file);
    patchProfile({
      avatarUrl: me.avatarUrl ? `${me.avatarUrl}?v=${Date.now()}` : null,
    });
    closeAvatarDialog();
  };

  return {
    profile,
    testProfile,
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
    isLoading,
    loadError,
  };
}
