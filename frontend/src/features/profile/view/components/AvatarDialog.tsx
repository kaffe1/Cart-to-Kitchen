import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from "@/shared/components/ui/dialog";
import { useEffect, useRef, useState, ChangeEvent } from "react";
import { Button } from "@/shared/components/ui/button";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

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
    if (!chosenFile) {
      return;
    }
    if (!chosenFile.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (chosenFile.size > MAX_SIZE_BYTES) {
      setError("The image must be smaller than 5 MB.");
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
    } catch {
      setError("Failed to upload image.");
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
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Change Avatar</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {shownUrl && (
            <img
              src={shownUrl}
              alt="Avatar preview"
              className="h-24 w-24 rounded-full object-cover"
            />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose image...
          </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <DialogClose className="border px-4 py-2">Cancel</DialogClose>
          <Button onClick={handleSave} disabled={!selectedFile || isSaving}>
            {isSaving ? "Uploading…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
