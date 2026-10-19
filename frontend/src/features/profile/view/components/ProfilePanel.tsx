import {
  CircleUserRound,
  ImagePlus,
  KeyRound,
  LogOut,
  Mail,
  Settings2,
  UserRound,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import type { Profile } from "../../model/profile.types";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";

type ProfilePanelProps = {
  profile: Profile;
  onDisplayNameChange: () => void;
  onAvatarChange: () => void;
  onPasswordChange: () => void;
  onEmailChange: () => void;
  onSignOut: () => void;
};

export function ProfilePanel({
  profile,
  onDisplayNameChange,
  onAvatarChange,
  onPasswordChange,
  onEmailChange,
  onSignOut,
}: ProfilePanelProps) {
  const initials = profile.displayName.slice(0, 2).toUpperCase();

  return (
    <>
      <section className="profile-hero">
        <Avatar className="profile-avatar">
          {profile.avatarUrl && (
            <AvatarImage
              src={profile.avatarUrl}
              alt={`${profile.displayName}'s avatar`}
            />
          )}
          <AvatarFallback>{initials || <CircleUserRound />}</AvatarFallback>
        </Avatar>
        <div className="profile-hero-copy">
          <span className="eyebrow">
            <CircleUserRound size={14} /> Your kitchen life
          </span>
          <h1>Hello, {profile.displayName}!</h1>
        </div>
        <Button variant="secondary" onClick={onAvatarChange}>
          <ImagePlus size={17} /> Change avatar
        </Button>
      </section>

      <article className="profile-card profile-settings-card">
        <header className="profile-section-heading">
          <span className="profile-section-icon" aria-hidden="true">
            <Settings2 />
          </span>
          <div>
            <h2>Your details</h2>
          </div>
        </header>

        <div className="profile-setting-list">
          <div className="profile-setting-row">
            <span className="profile-setting-icon" aria-hidden="true">
              <UserRound />
            </span>
            <div>
              <small>Display name</small>
              <strong>{profile.displayName}</strong>
            </div>
            <Button variant="outline" size="sm" onClick={onDisplayNameChange}>
              Change
            </Button>
          </div>

          <div className="profile-setting-row">
            <span className="profile-setting-icon" aria-hidden="true">
              <Mail />
            </span>
            <div>
              <small>Email</small>
              <strong>{profile.email ?? "No email address"}</strong>
            </div>
            <Button variant="outline" size="sm" onClick={onEmailChange}>
              Change
            </Button>
          </div>

          <div className="profile-setting-row">
            <span className="profile-setting-icon" aria-hidden="true">
              <KeyRound />
            </span>
            <div>
              <small>Security</small>
              <strong>Password</strong>
            </div>
            <Button variant="outline" size="sm" onClick={onPasswordChange}>
              Change
            </Button>
          </div>
        </div>

        <footer className="profile-card-footer">
          <Button onClick={onSignOut}>
            <LogOut size={16} /> Sign Out
          </Button>
        </footer>
      </article>
    </>
  );
}
