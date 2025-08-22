'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useCallback } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Image as ImageIcon } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';

// Custom Image extension to render the specific HTML structure
const CustomImage = Image.extend({
  renderHTML({ HTMLAttributes }) {
    return ['div', { class: 'imgtxt' }, ['img', HTMLAttributes]];
  },
});

const EditorToolbar = ({ editor }: { editor: Editor | null }) => {
  const addImage = useCallback(() => {
    const url = window.prompt('Enter Image URL');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-input bg-transparent rounded-md p-2 flex gap-2 flex-wrap mb-2">
      <Toggle size="sm" pressed={editor.isActive('bold')} onPressedChange={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive('italic')} onPressedChange={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive('underline')} onPressedChange={() => editor.chain().focus().toggleStrike().run()}>
        <Underline className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive('bulletList')} onPressedChange={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive('orderedList')} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" onPressedChange={addImage}>
        <ImageIcon className="h-4 w-4" />
      </Toggle>
    </div>
  );
};


export const RichTextEditor = ({ value, onChange }: { value: string; onChange: (richText: string) => void }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      CustomImage,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'rounded-md border min-h-[250px] border-input bg-background p-4',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="flex flex-col justify-stretch gap-2">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};