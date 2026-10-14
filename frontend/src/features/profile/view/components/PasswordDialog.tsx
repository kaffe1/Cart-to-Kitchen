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
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Input
            type="password"
            placeholder="Enter current password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => {
              (setCurrentPassword(e.target.value), setError(null));
            }}
          />
          <Input
            type="password"
            placeholder="Enter new password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
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

        <DialogFooter>
          <DialogClose className="border px-4 py-2">Cancel</DialogClose>
          <Button onClick={handleSave} disabled={!saveAllowed}>
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
