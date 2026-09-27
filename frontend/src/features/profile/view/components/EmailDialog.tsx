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

type EmailDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function EmailDialog({
  open,
  onClose,
}: EmailDialogProps) {

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
        />

        <DialogFooter>
          <DialogClose className="border px-4 py-2">Cancel</DialogClose>
          {/*<Button onClick={handleSave}>Save</Button>*/}
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}