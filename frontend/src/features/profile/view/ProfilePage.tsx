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
import { CircleUserRound } from "lucide-react";
import { appSession } from "@/shared/api/appSession";

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
    handleReviewSave,
    isLoading,
    loadError,
  } = useProfilePresenter();

  const handleSignOut = async () => {
    try {
      await appSession.logout();
      void navigate(appRoutes.login, { replace: true });
    } catch {
      // AppShell displays session errors without leaving the current page.
    }
  };

  if (isLoading) {
    return (
      <section className="page-shell profile-page" aria-busy="true">
        <div className="profile-status-card">
          <span className="profile-status-icon" aria-hidden="true">
            <CircleUserRound />
          </span>
          <div>
            <span className="eyebrow">Your kitchen life</span>
            <h1>Loading profile…</h1>
          </div>
        </div>
      </section>
    );
  }
  if (loadError) {
    return (
      <section className="page-shell profile-page" role="alert">
        <div className="profile-status-card profile-status-error">
          <span className="profile-status-icon" aria-hidden="true">
            <CircleUserRound />
          </span>
          <div>
            <span className="eyebrow">Profile unavailable</span>
            <h1>{loadError}</h1>
          </div>
        </div>
      </section>
    );
  }

  if (isGuestUser || !profile) {
    return (
      <section className="page-shell profile-page">
        <div className="profile-guest-card">
          <span className="profile-guest-avatar" aria-hidden="true">
            <CircleUserRound />
          </span>
          <div className="profile-guest-copy">
            <span className="eyebrow">Your kitchen life</span>
            <h1>Hello, Guest User</h1>
            <p>Please sign up or sign in to access your profile.</p>
          </div>
          <div className="profile-guest-actions">
            <Button onClick={() => navigate(appRoutes.login)}>Sign In</Button>
            <Button
              variant="secondary"
              onClick={() => navigate(appRoutes.register)}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page-shell profile-page">
      <div className="profile-dashboard">
        <ProfilePanel
          profile={profile}
          onDisplayNameChange={openDisplayNameDialog}
          onAvatarChange={openAvatarDialog}
          onPasswordChange={openPasswordDialog}
          onEmailChange={openEmailDialog}
          onSignOut={() => void handleSignOut()}
        />
        <HistoryPanel
          cookedRecipes={profile.cookingHistory}
          onReviewSave={handleReviewSave}
        />
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
