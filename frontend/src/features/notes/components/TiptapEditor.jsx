import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';

const TiptapEditor = ({ content, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder || 'Nội dung ghi chú...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'note-editor__content tiptap-editor focus:outline-none min-h-[200px] h-full',
      },
    },
  });

  // Keep content in sync if it changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  return (
    <div className="tiptap-container h-full flex-grow flex flex-col overflow-y-auto">
      <EditorContent editor={editor} className="flex-grow h-full" />
    </div>
  );
};

export default TiptapEditor;
