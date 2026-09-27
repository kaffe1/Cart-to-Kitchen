import { CircleUserRound } from 'lucide-react';

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

export function ProfilePanel( {
    profile,
    onUsernameChange,
    onAvatarChange,
    onPasswordChange,
    onEmailChange,
    onSignOut,
  }: ProfilePanelProps) {
    return (
    
    <article className="rounded-2xl border bg-card p-6 shadow-sm flex">

        <div className="flex flex-row items-center space-x-4">

            <div className="flex flex-col items-center">

                <CircleUserRound size={34} /> {/* Avatar picture placeholder */}
        
                <Button onClick={onAvatarChange}>Change Avatar</Button>
            </div>

            <Button onClick={onUsernameChange}>Change Username</Button>
            <Button onClick={onPasswordChange}>Change Password</Button>
            <Button onClick={onEmailChange}>Change Email</Button> {/* if this used */}
            <Button onClick={onSignOut}>Sign Out</Button>
        </div>
    </article>

    );
  }