import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';


type AvatarDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function AvatarDialog({
  open,
  onClose,
}: AvatarDialogProps) {

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Change Avatar</DialogTitle>
        </DialogHeader>

        {/*//TODO: Add avatar selection (Media upload criteria)*/}

        <DialogFooter>
          <DialogClose className="border px-4 py-2">Cancel</DialogClose>
          {/*<Button onClick={handleSave}>Save</Button>*/}
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}