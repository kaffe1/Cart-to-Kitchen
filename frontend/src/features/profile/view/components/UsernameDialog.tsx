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

type UsernameDialogProps = {
  open: boolean;
  currentUsername: string;
  onSave: (newUsername: string) => void;
  onClose: () => void;
};

export function UsernameDialog({
  open,
  currentUsername,
  onSave,
  onClose,
}: UsernameDialogProps) {
  const [newUsername, setNewUsername] = useState(currentUsername);
  const handleSaveCB = () => {
    onSave(newUsername);
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
          <DialogTitle>Change Username</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="New Username"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
        />

        <DialogFooter>
          <DialogClose className="border px-4 py-2">Cancel</DialogClose>
          <Button onClick={handleSaveCB}>Save</Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
