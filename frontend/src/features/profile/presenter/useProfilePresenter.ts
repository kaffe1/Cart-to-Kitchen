import { useState } from "react";
import { getProfilePlaceholder } from "../model/profile.api";

export function useProfilePresenter() {
  const [isUsernameDialogOpen, setUsernameDialogOpen] = useState(false);
  const [isEmailDialogOpen, setEmailDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [isAvatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [profile, setProfile] = useState(getProfilePlaceholder); //TODO: Change placeholder when backend in place
  
  const isGuestUser = profile.mode === "guest";

  const openUsernameDialog = () => {
    setUsernameDialogOpen(true);
  };

  const closeUsernameDialog = () => {
    setUsernameDialogOpen(false);
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
  const handleUsernameSave = (newUsername: string) => {
    setProfile((prev) => ({
      ...prev,
      username: newUsername,
    }));
    closeUsernameDialog();
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
  const handlePasswordSave = async (currentPassword: string, newPassword: string) => {
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
    isUsernameDialogOpen,
    openUsernameDialog,
    closeUsernameDialog,
    isEmailDialogOpen,
    openEmailDialog,
    closeEmailDialog,
    isPasswordDialogOpen,
    openPasswordDialog,
    closePasswordDialog,
    isAvatarDialogOpen,
    openAvatarDialog,
    closeAvatarDialog,
    handleUsernameSave,
    handleEmailSave,
    handlePasswordSave,
    handleAvatarSave,
  };
}
