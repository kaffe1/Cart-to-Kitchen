import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

type RichTextProps = {
  html: string;
  className?: string;
};

export function RichText({ html, className = "" }: RichTextProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: html,
    editable: false,
    editorProps: {
      attributes: {
        "aria-label": "Saved review",
        class: ["rich-text", className].filter(Boolean).join(" "),
      },
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== html) {
      editor.commands.setContent(html, { emitUpdate: false });
    }
  }, [editor, html]);

  return <EditorContent editor={editor} />;
}
