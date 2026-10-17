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
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import {
  IMAGE_ACCEPT,
  validateImageFile,
  validateReview,
} from "../../model/profile.validation";
import { messageForApiError } from "@/shared/api/errorMessage";
import { TextEditor } from "@/shared/components/ui/TextEditor";

type ReviewDialogProps = {
  open: boolean;
  recipeName: string;
  currentReview?: string;
  currentReviewImageUrl?: string | null; 
  onClose: () => void;
  onSave: (text: string, file: File | null) => Promise<void>;
};

export function ReviewDialog({
  open,
  recipeName,
  currentReview = "",
  currentReviewImageUrl,
  onClose,
  onSave,
}: ReviewDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [html, setHtml] = useState(currentReview);
  const [plainText, setPlainText] = useState("");

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
    const imageValidationError = validateImageFile(chosenFile);
    if (imageValidationError) {
      setError(imageValidationError);
      return;
    }
    setError(null);
    setSelectedFile(chosenFile);
    setPreviewUrl(URL.createObjectURL(chosenFile));
  };

  const textValidationError = validateReview(html, plainText);
  const showTextProblem = plainText.trim().length > 0 && textValidationError;
  const shownUrl = previewUrl ?? currentReviewImageUrl;
  const saveAllowed = !textValidationError && !isSaving;

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    try {
      await onSave(html, selectedFile);
    } catch (err) {
      setError(
        messageForApiError(
          err,
          {
            PROFANITY_REJECTED:
              "The review contains words that are not allowed",
            rule_validation:
              "The image needs to be PNG, JPEG or WebP, and smaller than 2 MB.",
          },
          "Failed to save review.",
        ),
      );
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
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Review for: {recipeName}</DialogTitle>
          <DialogDescription>
            Did you try this recipe? Write your thoughts and share a photo!
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-y-4">
          <TextEditor
            initialHtml={currentReview}
            onChange={(nextHtml, nextText) => {
              setHtml(nextHtml);
              setPlainText(nextText);
              setError(null);
            }}
          />

          {shownUrl && (
            <img
              src={shownUrl}
              alt="Review image preview"
              className="h-24 w-24 object-cover"
            />
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
            onClick={() => fileInputRef.current?.click()}
          >
            Choose image...
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {showTextProblem && (
            <p className="text-sm text-destructive">{textValidationError}</p>
          )}
        </div>

        <DialogFooter>
          <DialogClose className="border px-4 py-2">Cancel</DialogClose>
          <Button onClick={handleSave} disabled={!saveAllowed}>
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
