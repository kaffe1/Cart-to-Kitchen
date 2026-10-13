import { useEffect, useState } from "react";
import { Profile } from "../model/profile.types";
import { getProfile, updateDisplayName, getProfilePlaceholder, updateEmail, updatePassword, updateAvatar } from "../model/profile.api";


export function useProfilePresenter() {
  const [isDisplayNameDialogOpen, setDisplayNameDialogOpen] = useState(false);
  const [isEmailDialogOpen, setEmailDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [isAvatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [testProfile, setTestProfile] = useState(getProfilePlaceholder); // only for testing 
  const [profile, setProfile] = useState<Profile | null>(null); //TODO: Change placeholder when backend in place
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);


  useEffect(() => {
  getProfile()
    .then(setProfile)
    .catch((error) => {
      setLoadError(error.message);
    })
    .finally(() => {
      setIsLoading(false);
    });
}, []);

  const isGuestUser = profile?.mode === "guest";

  const patchProfile = (patch: Partial<Profile>) => setProfile((prev) => (prev ? { ...prev, ...patch } : prev));

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

  // TODO: Implement the actual save logic when backend is in place
  const handleEmailSave = async (newEmail: string) => {
    await updateEmail(newEmail);
    patchProfile({ email: newEmail });
    closeEmailDialog();
  };

  // TODO:Implement the actual save logic when backend is in place
  const handlePasswordSave = async (
    currentPassword: string,
    newPassword: string
  ) => {
    await updatePassword(currentPassword, newPassword);
    closePasswordDialog();
  };

  const handleAvatarSave = async (file: File) => {
    await updateAvatar(file);
    const updatedProfile = await getProfile();
    setProfile(updatedProfile);
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
  };
}
