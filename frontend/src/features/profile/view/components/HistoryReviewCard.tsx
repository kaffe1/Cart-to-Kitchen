import {
  ChevronDown,
  ChevronUp,
  ChefHat,
  ImagePlus,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { CookedRecipe } from "../../model/profile.types";
import {
  IMAGE_ACCEPT,
  MAX_REVIEW_TEXT_LENGTH,
  validateImageFile,
  validateReview,
} from "../../model/profile.validation";
import { messageForApiError } from "@/shared/api/errorMessage";
import { Button } from "@/shared/components/ui/button";
import { formatShortDate } from "@/shared/utils/format";
import { TextEditor } from "@/shared/components/ui/TextEditor";
import { RichText } from "@/shared/components/ui/RichText";

type HistoryReviewCardProps = {
  recipe: CookedRecipe & { cookedAt?: string };
  expanded: boolean;
  onToggle: () => void;
  onSave: (entryId: string, text: string, image?: File) => Promise<void>;
};

export function HistoryReviewCard({
  recipe,
  expanded,
  onToggle,
  onSave,
}: HistoryReviewCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftHtml, setDraftHtml] = useState(recipe.review ?? "");
  const [draftText, setDraftText] = useState(recipe.review ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const reviewValidationError = validateReview(draftHtml, draftText);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const resetEditor = () => {
    setDraftHtml(recipe.review ?? "");
    setDraftText(recipe.review ?? "");
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setIsEditing(false);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // File inputs expose reset as an imperative DOM operation; clearing it
    // allows the same file to trigger a later change event.
    event.target.value = "";
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    const validationError = validateReview(draftHtml, draftText);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await onSave(recipe.entryId, draftHtml, selectedFile ?? undefined);
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsEditing(false);
    } catch (err) {
      setError(
        messageForApiError(
          err,
          {
            PROFANITY_REJECTED:
              "The review contains words that are not allowed",
            REVIEW_EMPTY: "Write a short review before saving.",
            REVIEW_TOO_LONG: `The review must be ${MAX_REVIEW_TEXT_LENGTH} characters or fewer`,
            rule_validation:
              "Check the review text and make sure the image is PNG, JPEG or WebP and under 2 MB.",
          },
          "Could not save your review.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const shownImage = previewUrl ?? recipe.reviewImageUrl;

  return (
    <li
      className={
        expanded ? "profile-history-row expanded" : "profile-history-row"
      }
    >
      <div className="profile-history-summary">
        <span className="profile-recipe-mark" aria-hidden="true">
          <ChefHat />
        </span>
        <div className="profile-history-copy">
          <strong>{recipe.name}</strong>
          <small>
            {recipe.cookedAt
              ? `Cooked ${formatShortDate(recipe.cookedAt)}`
              : "Cooked"}
          </small>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          aria-expanded={expanded}
        >
          My review
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
      </div>

      {expanded && (
        <div className="profile-review-panel">
          <div className="profile-review-layout">
            <div className="profile-review-media">
              {shownImage ? (
                <figure
                  className="profile-review-photo"
                  style={{ backgroundImage: `url(${shownImage})` }}
                >
                  <figcaption className="sr-only">
                    Review for {recipe.name}
                  </figcaption>
                </figure>
              ) : (
                <div className="profile-review-photo-placeholder">
                  <ImagePlus aria-hidden="true" />
                  <span>No review photo yet</span>
                </div>
              )}
              {isEditing && (
                <>
                  <input
                    ref={fileInputRef}
                    className="sr-only"
                    type="file"
                    accept={IMAGE_ACCEPT}
                    onChange={handleFileChange}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus size={15} />
                    {shownImage ? "Change photo" : "Add photo"}
                  </Button>
                </>
              )}
            </div>

            <div className="profile-review-copy">
              {isEditing ? (
                <>
                  <label htmlFor={`review-${recipe.entryId}`}>
                    Your review
                  </label>
                  <TextEditor
                    initialHtml={draftHtml}
                    onChange={(html, plainText) => {
                      setDraftHtml(html);
                      setDraftText(plainText);
                    }}
                  />
                  <small>
                    {draftText.length}/{MAX_REVIEW_TEXT_LENGTH}
                  </small>
                </>
              ) : recipe.review ? (
                <RichText
                  html={recipe.review}
                  className="profile-review-rich-text"
                />
              ) : (
                <div className="profile-review-placeholder">
                  <strong>No review written yet</strong>
                  <p>Add a note and an optional photo from your cooking.</p>
                </div>
              )}
            </div>
          </div>

          {(error || (isEditing && reviewValidationError)) && (
            <p className="profile-review-error" role="alert">
              {error ?? reviewValidationError}
            </p>
          )}

          <div className="profile-review-actions">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetEditor}
                  disabled={isSaving}
                >
                  <X size={16} /> Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleSave()}
                  disabled={!!reviewValidationError || isSaving}
                >
                  <Save size={16} /> {isSaving ? "Saving…" : "Save review"}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Pencil size={16} />
                {recipe.review || recipe.reviewImageUrl
                  ? "Edit review"
                  : "Add review"}
              </Button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
