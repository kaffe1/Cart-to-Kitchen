import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useState } from "react";
import { messageForApiError } from "@/shared/api/errorMessage";
import { validatePassword } from "../../model/profile.validation";

type PasswordDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (currentPassword: string, newPassword: string) => Promise<void>;
};

export function PasswordDialog({ open, onClose, onSave }: PasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    try {
      await onSave(currentPassword, newPassword);
    } catch (err) {
      setError(
        messageForApiError(
          err,
          { invalid_credentials: "Your current password is incorrect." },
          "Failed to change password.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const passwordsMatch = newPassword === confirmPassword;
  const passwordsMismatch = !passwordsMatch && confirmPassword.length > 0;
  const passwordValidationError =
    newPassword.length > 0 ? validatePassword(newPassword) : null;
  const saveAllowed =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    passwordsMatch &&
    !passwordValidationError &&
    !isSaving;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogPopup className="profile-edit-dialog">
        <DialogHeader className="profile-dialog-header">
          <DialogTitle className="profile-dialog-title">Change password</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 profile-dialog-fields">
          <Input
            className="profile-dialog-input"
            type="password"
            placeholder="Enter current password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setError(null);
            }}
          />
          <Input
            className="profile-dialog-input"
            type="password"
            placeholder="Enter new password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            className="profile-dialog-input"
            type="password"
            placeholder="Confirm new password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {passwordsMismatch && (
            <p className="text-sm text-destructive">Passwords do not match.</p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {passwordValidationError && (
            <p className="text-sm text-destructive">
              {passwordValidationError}
            </p>
          )}
        </div>

        <DialogFooter className="profile-dialog-footer">
          <DialogClose className="profile-dialog-cancel">Cancel</DialogClose>
          <Button className="profile-dialog-save" onClick={handleSave} disabled={!saveAllowed}>
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
