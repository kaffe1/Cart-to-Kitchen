import { useProfilePresenter } from "../presenter/useProfilePresenter";
import { ProfilePanel } from "./components/ProfilePanel";
import { HistoryPanel } from "./components/HistoryPanel";
import { DisplayNameDialog } from "./components/DisplayNameDialog";
import { PasswordDialog } from "./components/PasswordDialog";
import { EmailDialog } from "./components/EmailDialog";
import { AvatarDialog } from "./components/AvatarDialog";
import { Button } from "@/shared/components/ui/button";
import { appRoutes } from "@/app/routes";
import { useNavigate } from "react-router-dom";

export function ProfilePage() {
  const navigate = useNavigate();
  const {
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
  } = useProfilePresenter();

  if (isGuestUser) {
    return (
      <section className="page-shell placeholder-page">
        <h1>Hello, Guest User</h1>
        <p>Please sign up or sign in to access your profile.</p>
        <Button onClick={() => navigate(appRoutes.login)}> Sign In</Button>
        <Button
          variant="secondary"
          onClick={() => navigate(appRoutes.register)}
        >
          Sign Up
        </Button>
      </section>
    );
  }

  return (
    <section className="page-shell placeholder-page">
      <h1>Hello {profile.displayName}!</h1>
      <div className="flex flex-row justify-between">
        <ProfilePanel
          profile={profile}
          onDisplayNameChange={openDisplayNameDialog}
          onAvatarChange={openAvatarDialog}
          onPasswordChange={openPasswordDialog}
          onEmailChange={openEmailDialog}
          onSignOut={() => {}} //TODO: Implement sign out functionality
        />

        <div className="flex flex-row m-6">
          <HistoryPanel cookedRecipes={profile.cookingHistory} />
        </div>
      </div>

      {isAvatarDialogOpen && (
        <AvatarDialog
          open
          currentAvatarUrl={profile.avatarUrl}
          onClose={closeAvatarDialog}
          onSave={handleAvatarSave}
        />
      )}

      {isDisplayNameDialogOpen && (
        <DisplayNameDialog
          open
          currentDisplayName={profile.displayName}
          onClose={closeDisplayNameDialog}
          onSave={handleDisplayNameSave}
        />
      )}

      {isEmailDialogOpen && (
        <EmailDialog
          open
          currentEmail={profile.email ?? ""}
          onSave={handleEmailSave}
          onClose={closeEmailDialog}
        />
      )}

      {isPasswordDialogOpen && (
        <PasswordDialog
          open
          onClose={closePasswordDialog}
          onSave={handlePasswordSave}
        />
      )}
    </section>
  );
}
