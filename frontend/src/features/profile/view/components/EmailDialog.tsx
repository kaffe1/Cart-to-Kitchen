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

type EmailDialogProps = {
  open: boolean;
  currentEmail: string;
  onSave: (newEmail: string) => void;
  onClose: () => void;
};

export function EmailDialog({
  open,
  currentEmail,
  onSave,
  onClose,
}: EmailDialogProps) {
  const [newEmail, setNewEmail] = useState(currentEmail);
  const handleSaveCB = () => {
    onSave(newEmail);
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

        <DialogFooter>
          <DialogClose className="border px-4 py-2">Cancel</DialogClose>
          <Button onClick={handleSaveCB}>Save</Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
