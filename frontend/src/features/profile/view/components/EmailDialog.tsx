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
import { ApiError } from "@/shared/api/apiError";

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
  const saveAllowed =
    trimmed.length > 0 && trimmed !== currentEmail && !isSaving;

  const handleSaveCB = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onSave(newEmail);
    } catch (err) {
      const isTakenError =
        err instanceof ApiError &&
        (err.code === "conflict" || err.code === "rule_validation");
      setError(
        isTakenError ? "Email is already taken." : "Failed to update email.",
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
