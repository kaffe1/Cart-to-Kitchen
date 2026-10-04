import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";

type ReviewDialogProps = {
  open: boolean;
  recipeName: string;
  onClose: () => void;
};

export function ReviewDialog({ open, recipeName, onClose }: ReviewDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Write a review for: {recipeName}</DialogTitle>
          <DialogDescription>
            {" "}
            Did you try this recipe? Share a photo!
          </DialogDescription>
        </DialogHeader>

        {/* // TODO: Add text box for review (text and profanity check criteria)*/}
        {/* Text input and text should be able to be in italic, bold etc */}

        {/* //TODO: Add image upload functionality */}

        <DialogFooter>
          <DialogClose className="border px-4 py-2">Cancel</DialogClose>
          {/*<Button onClick={handleSave}>Save</Button>*/}
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
