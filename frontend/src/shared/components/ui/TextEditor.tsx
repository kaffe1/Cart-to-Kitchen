import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@/shared/components/ui/button";

type TextEditorProps = {
  initialHtml?: string;
  onChange: (html: string, plainText: string) => void;
};

export function TextEditor({ initialHtml = "", onChange }: TextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialHtml,
    onCreate: ({ editor }) => onChange(editor.getHTML(), editor.getText()),
    onUpdate: ({ editor }) => onChange(editor.getHTML(), editor.getText()),
    editorProps: {
      attributes: {
        class: "min-h-24 rounded-md border px-3 py-2",
      },
    },
  });

  const format = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold") ?? false,
      italic: editor?.isActive("italic") ?? false,
      underline: editor?.isActive("underline") ?? false,
    }),
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1">
        <Button
          type="button"
          size="sm"
          variant={format.bold ? "default" : "outline"}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </Button>

        <Button
          type="button"
          size="sm"
          variant={format.italic ? "default" : "outline"}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </Button>

        <Button
          type="button"
          size="sm"
          variant={format.underline ? "default" : "outline"}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <u>U</u>
        </Button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
