import { CircleUserRound } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { ProfilePlaceholder } from "../../model/profile.types";

type ProfilePanelProps = {
  profile: ProfilePlaceholder; // ProfilePlaceholder
  onUsernameChange: () => void;
  onAvatarChange: () => void;
  onPasswordChange: () => void;
  onEmailChange: () => void;
  onSignOut: () => void;
};

export function ProfilePanel({
  profile,
  onUsernameChange,
  onAvatarChange,
  onPasswordChange,
  onEmailChange,
  onSignOut,
}: ProfilePanelProps) {
  return (
    <article className="rounded-2xl border bg-card p-6 shadow-sm flex">
      <div className="flex flex-col items-center space-y-4">
        <div className="flex flex-row items-center gap-2">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={`${profile.username}'s avatar`}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <CircleUserRound size={64}/>
          )}
          <Button onClick={onAvatarChange}>Change Avatar</Button>
        </div>
        <Button onClick={onUsernameChange}>Change Username</Button>
        <Button onClick={onPasswordChange}>Change Password</Button>
        <Button onClick={onEmailChange}>Change Email</Button>
        <Button variant="outline" onClick={onSignOut}>
          Sign Out
        </Button>
      </div>
    </article>
  );
}
