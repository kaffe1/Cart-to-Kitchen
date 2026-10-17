import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from "@/shared/components/ui/dialog";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import {
  IMAGE_ACCEPT,
  validateImageFile,
} from "../../model/profile.validation";
import { messageForApiError } from "@/shared/api/errorMessage";

type AvatarDialogProps = {
  open: boolean;
  currentAvatarUrl?: string | null;
  onClose: () => void;
  onSave: (file: File) => Promise<void>;
};

export function AvatarDialog({
  open,
  currentAvatarUrl,
  onClose,
  onSave,
}: AvatarDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const chosenFile = event.target.files?.[0];
    event.target.value = "";
    if (!chosenFile) {
      return;
    }
    const validationError = validateImageFile(chosenFile);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSelectedFile(chosenFile);
    setPreviewUrl(URL.createObjectURL(chosenFile));
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    setError(null);
    setIsSaving(true);
    try {
      await onSave(selectedFile);
    } catch (err) {
      setError(
        messageForApiError(
          err,
          {
            rule_validation:
              "The image needs to be PNG, JPEG or WebP, and smaller than 2 MB.",
          },
          "Failed to upload image.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const shownUrl = previewUrl ?? currentAvatarUrl;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogPopup className="profile-edit-dialog">
        <DialogHeader className="profile-dialog-header">
          <DialogTitle className="profile-dialog-title">Change Avatar</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 profile-avatar-dialog-body">
          {shownUrl && (
            <Avatar className="h-24 w-24 profile-dialog-avatar">
              <AvatarImage src={shownUrl} alt="Avatar preview" />
              <AvatarFallback>Preview</AvatarFallback>
            </Avatar>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            className="profile-avatar-choose"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose image...
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="profile-dialog-footer">
          <DialogClose className="profile-dialog-cancel">Cancel</DialogClose>
          <Button
            className="profile-dialog-save"
            onClick={handleSave}
            disabled={!selectedFile || isSaving}
          >
            {isSaving ? "Uploading…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
