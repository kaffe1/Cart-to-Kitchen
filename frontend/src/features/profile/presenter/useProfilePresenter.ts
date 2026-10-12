import { useState } from "react";
import { getProfilePlaceholder } from "../model/profile.api";

export function useProfilePresenter() {
  const [isDisplayNameDialogOpen, setDisplayNameDialogOpen] = useState(false);
  const [isEmailDialogOpen, setEmailDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [isAvatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [profile, setProfile] = useState(getProfilePlaceholder); //TODO: Change placeholder when backend in place

  const isGuestUser = profile.mode === "guest";

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

  // TODO: Implement the actual save logic when backend is in place
  const handleDisplayNameSave = (newDisplayName: string) => {
    setProfile((prev) => ({
      ...prev,
      displayName: newDisplayName,
    }));
    closeDisplayNameDialog();
  };

  // TODO: Implement the actual save logic when backend is in place
  const handleEmailSave = (newEmail: string) => {
    setProfile((prev) => ({
      ...prev,
      email: newEmail,
    }));
    closeEmailDialog();
  };

  // TODO:Implement the actual save logic when backend is in place
  const handlePasswordSave = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    void currentPassword;
    void newPassword;
    closePasswordDialog();
  };

  const handleAvatarSave = async (file: File) => {
    setProfile((prev) => ({
      ...prev,
      avatarUrl: URL.createObjectURL(file),
    }));
    closeAvatarDialog();
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
  };
}
