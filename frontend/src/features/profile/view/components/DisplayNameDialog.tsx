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
import { validateDisplayName } from "../../model/profile.validation";

type DisplayNameDialogProps = {
  open: boolean;
  currentDisplayName: string;
  onSave: (newDisplayName: string) => Promise<void>;
  onClose: () => void;
};

export function DisplayNameDialog({
  open,
  currentDisplayName,
  onSave,
  onClose,
}: DisplayNameDialogProps) {
  const [newDisplayName, setNewDisplayName] = useState(currentDisplayName);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const trimmed = newDisplayName.trim();
  const wrongDisplayNameFormat =
    trimmed.length > 0 ? validateDisplayName(trimmed) : null;
  const saveAllowed =
    trimmed.length > 0 && trimmed !== currentDisplayName && !wrongDisplayNameFormat && !isSaving;

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    try {
      await onSave(trimmed);
    } catch (err) {
      setError(messageForApiError(err, {}, "Failed to change display name."));
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
      <DialogPopup className="profile-edit-dialog">
        <DialogHeader className="profile-dialog-header">
          <DialogTitle className="profile-dialog-title">Change Display Name</DialogTitle>
        </DialogHeader>

        <Input
          className="profile-dialog-input"
          placeholder="New Display Name"
          value={newDisplayName}
          onChange={(e) => setNewDisplayName(e.target.value)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {wrongDisplayNameFormat && (
          <p className="text-sm text-destructive">{wrongDisplayNameFormat}</p>
        )}

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
