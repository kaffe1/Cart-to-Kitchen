import { useState } from "react";
import { getProfilePlaceholder } from "../model/profile.api";

export function useProfilePresenter() {
  const [isUsernameDialogOpen, setUsernameDialogOpen] = useState(false);
  const [isEmailDialogOpen, setEmailDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [isAvatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [profile, setProfile] = useState(getProfilePlaceholder); //TODO: Change placeholder when backend in place

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

  return {
    profile,
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
  };
}
