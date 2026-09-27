import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

type PasswordDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function PasswordDialog({
  open,
  onClose,
}: PasswordDialogProps) {
  
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

        <Input className="mb-2"
            placeholder="Enter new password"
        />
        <Input
            placeholder="Confirm new password"
        />

        <DialogFooter>
          <DialogClose className="border px-4 py-2">Cancel</DialogClose>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}