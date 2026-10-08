import { useProfilePresenter } from "../presenter/useProfilePresenter";
import { ProfilePanel } from "./components/ProfilePanel";
import { HistoryPanel } from "./components/HistoryPanel";
import { UsernameDialog } from "./components/UsernameDialog";
import { PasswordDialog } from "./components/PasswordDialog";
import { EmailDialog } from "./components/EmailDialog";
import { AvatarDialog } from "./components/AvatarDialog";

export function ProfilePage() {
  const {
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
    handleUsernameSave,
    handleEmailSave,
  } = useProfilePresenter();

  return (
    <section className="page-shell placeholder-page">
      <h1>Hello {profile.username}!</h1>
      <div className="flex flex-row justify-between">
        <ProfilePanel
          profile={profile}
          onUsernameChange={openUsernameDialog}
          onAvatarChange={openAvatarDialog}
          onPasswordChange={openPasswordDialog}
          onEmailChange={openEmailDialog}
          onSignOut={() => {}} //TODO: Implement sign out functionality
        />

        <div className="flex flex-row m-6">
          <HistoryPanel cookedRecipes={profile.cookingHistory} />
        </div>
      </div>

      {isAvatarDialogOpen && <AvatarDialog open onClose={closeAvatarDialog} />}

      {isUsernameDialogOpen && (
        <UsernameDialog
          open
          currentUsername={profile.username}
          onClose={closeUsernameDialog}
          onSave={handleUsernameSave}
        />
      )}

      {isEmailDialogOpen && (
        <EmailDialog
          open
          currentEmail={profile.email}
          onSave={handleEmailSave}
          onClose={closeEmailDialog}
        />
      )}

      {isPasswordDialogOpen && (
        <PasswordDialog open onClose={closePasswordDialog} />
      )}
    </section>
  );
}
