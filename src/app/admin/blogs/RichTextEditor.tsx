'use client';

import React, { useEffect, useState, useRef } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { MyUploadAdapter } from '@/lib/upload-adapter'; // Adjust path if needed


interface RichTextEditorProps {
  initialData?: string;
  onChange: (data: string) => void;
  onFilesChange: (files: File[]) => void;
}

export default function RichTextEditor({
  initialData = '',
  onChange,
  onFilesChange,
}: RichTextEditorProps) {
  const editorRef = useRef<any>(null);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  // This handles adding a new file from the upload adapter
  const handleFileChange = (file: File) => {
    const newFiles = [...files, file];
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  useEffect(() => {
    setEditorLoaded(true);
  }, []);

  if (!editorLoaded) {
    return <div>Loading Editor...</div>;
  }

  return (
    <CKEditor
      editor={ClassicEditor}
      data={initialData}
      onReady={(editor) => {
        editorRef.current = editor;
        // Custom Upload Adapter integration
        editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
          return new MyUploadAdapter(loader, handleFileChange);
        };
      }}
      onChange={(event, editor) => {
        const data = editor.getData();
        onChange(data);
      }}
      config={{
        // Add any other CKEditor config here
        toolbar: {
          items: [
            'heading', '|',
            'bold', 'italic', 'underline', 'link', 'bulletedList', 'numberedList', '|',
            'alignment', 'outdent', 'indent', '|',
            'imageUpload', 'blockQuote', 'insertTable', 'mediaEmbed', 'undo', 'redo',
          ],
        },
        table: {
          contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
        }
      }}
    />
  );
}