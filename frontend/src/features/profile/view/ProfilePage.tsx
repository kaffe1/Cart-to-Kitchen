import { useProfilePresenter } from "../presenter/useProfilePresenter";
import { ProfilePanel } from "./components/ProfilePanel";
import { HistoryPanel } from "./components/HistoryPanel";
import { FavoritePanel } from "./components/FavoritePanel";
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
  } = useProfilePresenter();

  return (
    <section className="page-shell placeholder-page">
      <div className="flex flex-col justify-between">
        <ProfilePanel
          profile={profile}
          onUsernameChange={openUsernameDialog}
          onAvatarChange={openAvatarDialog}
          onPasswordChange={openPasswordDialog}
          onEmailChange={openEmailDialog}
          onSignOut={() => {}}
        />

        <div className="flex flex-row m-6">
          <HistoryPanel />
          <FavoritePanel />
        </div>
      </div>

      <AvatarDialog open={isAvatarDialogOpen} onClose={closeAvatarDialog} />

      <UsernameDialog
        open={isUsernameDialogOpen}
        onClose={closeUsernameDialog}
      />
      <EmailDialog open={isEmailDialogOpen} onClose={closeEmailDialog} />
      <PasswordDialog open={isPasswordDialogOpen} onClose={closePasswordDialog} />

      {/*<CircleUserRound size={34} />*/}
      {/*<Badge variant="outline">{profile.mode}</Badge>*/}
      {/*<h1>{profile.displayName}</h1>*/}
      {/*<p>{profile.note}</p>*/}
    </section>
  );
}
