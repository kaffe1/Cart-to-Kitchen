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

type DisplayNameDialogProps = {
  open: boolean;
  currentDisplayName: string;
  onSave: (newDisplayName: string) => void;
  onClose: () => void;
};

export function DisplayNameDialog({
  open,
  currentDisplayName,
  onSave,
  onClose,
}: DisplayNameDialogProps) {
  const [newDisplayName, setNewDisplayName] = useState(currentDisplayName);
  const handleSave = () => {
    onSave(newDisplayName);
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
          <DialogTitle>Change Display Name</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="New Display Name"
          value={newDisplayName}
          onChange={(e) => setNewDisplayName(e.target.value)}
        />

        <DialogFooter>
          <DialogClose className="border px-4 py-2">Cancel</DialogClose>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
