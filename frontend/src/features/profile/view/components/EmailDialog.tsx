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
import { validateEmail } from "../../model/profile.validation";

type EmailDialogProps = {
  open: boolean;
  currentEmail: string;
  onSave: (newEmail: string) => Promise<void>;
  onClose: () => void;
};

export function EmailDialog({
  open,
  currentEmail,
  onSave,
  onClose,
}: EmailDialogProps) {
  const [newEmail, setNewEmail] = useState(currentEmail);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const trimmed = newEmail.trim();
  const wrongEmailFormat = trimmed.length > 0 ? validateEmail(trimmed) : false;
  const saveAllowed =
    trimmed.length > 0 &&
    !wrongEmailFormat &&
    trimmed !== currentEmail &&
    !isSaving;

  const handleSaveCB = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onSave(trimmed);
    } catch (err) {
      setError(
        messageForApiError(
          err,
          {
            conflict: "The email address is already taken.",
            rule_validation: "The email address is already taken.",
          },
          "Failed to change email.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Change email</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="New Email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {wrongEmailFormat && (
          <p className="text-sm text-destructive">{wrongEmailFormat}</p>
        )}

        <DialogFooter>
          <DialogClose className="border px-4 py-2">Cancel</DialogClose>
          <Button onClick={handleSaveCB} disabled={!saveAllowed}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
