'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import Quill from 'quill';
import { MyUploadAdapter } from '@/lib/upload-adapter'; // Adjust path if needed

// Import Quill CSS
import 'quill/dist/quill.snow.css';

// Import quill-better-table
import QuillBetterTable from 'quill-better-table';
import 'quill-better-table/dist/quill-better-table.css';

// Register the module
Quill.register('modules/better-table', QuillBetterTable);

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
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstance = useRef<Quill | null>(null);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const isInitialized = useRef(false);

  // This handles adding a new file from the upload adapter
  const handleFileChange = (file: File) => {
    const newFiles = [...files, file];
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  // Custom image handler for file uploads
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        try {
          // Use your existing upload adapter
          const uploadAdapter = new MyUploadAdapter(
            { file },
            handleFileChange
          );

          // Simulate the upload process
          const uploadPromise = uploadAdapter.upload();
          const result = await uploadPromise;

          // Insert the image into the editor
          const quill = quillInstance.current;
          if (quill) {
            const range = quill.getSelection();
            const index = range ? range.index : quill.getLength();
            quill.insertEmbed(index, 'image', result.default || URL.createObjectURL(file));
          }
        } catch (error) {
          console.error('Upload failed:', error);
          // Fallback to local URL
          const quill = quillInstance.current;
          if (quill) {
            const range = quill.getSelection();
            const index = range ? range.index : quill.getLength();
            quill.insertEmbed(index, 'image', URL.createObjectURL(file));
          }
          handleFileChange(file);
        }
      }
    };
  };

  // Custom video handler
  const videoHandler = () => {
    const url = prompt('Enter video URL:');
    if (url) {
      const quill = quillInstance.current;
      if (quill) {
        const range = quill.getSelection();
        const index = range ? range.index : quill.getLength();
        quill.insertEmbed(index, 'video', url);
      }
    }
  };

  // Custom link handler
  const linkHandler = () => {
    const quill = quillInstance.current;
    if (quill) {
      const range = quill.getSelection();
      if (range && range.length > 0) {
        const url = prompt('Enter link URL:');
        if (url) {
          quill.format('link', url);
        }
      } else {
        const url = prompt('Enter link URL:');
        const text = prompt('Enter link text:');
        if (url && text) {
          const index = range ? range.index : quill.getLength();
          quill.insertText(index, text);
          quill.setSelection(index, text.length);
          quill.format('link', url);
        }
      }
    }
  };

  // Better table handlers
  const insertTable = () => {
    const quill = quillInstance.current;
    if (quill && quill.getModule('better-table')) {
      const tableModule = quill.getModule('better-table');
      tableModule.insertTable(3, 3); // Insert 3x3 table
    }
  };

  const insertTableWithCustomSize = () => {
    const rows = prompt('Enter number of rows:', '3');
    const cols = prompt('Enter number of columns:', '3');

    if (rows && cols) {
      const numRows = parseInt(rows, 10);
      const numCols = parseInt(cols, 10);

      if (numRows > 0 && numCols > 0 && numRows <= 20 && numCols <= 10) {
        const quill = quillInstance.current;
        if (quill && quill.getModule('better-table')) {
          const tableModule = quill.getModule('better-table');
          tableModule.insertTable(numRows, numCols);
        }
      } else {
        alert('Please enter valid numbers (max 20 rows, 10 columns)');
      }
    }
  };

  const toolbarOptions = useMemo(() => [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    [{ 'align': [] }],
    ['link', 'image', 'video'],
    [
      {
        'better-table': [
          'insert-table',
          'insert-row-above',
          'insert-row-below',
          'insert-column-left',
          'insert-column-right',
          'delete-row',
          'delete-column',
          'delete-table'
        ]
      }
    ],
    ['clean']
  ], []);

  useEffect(() => {
    console.log('🔧 Quill useEffect triggered', {
      editorRefExists: !!editorRef.current,
      quillInstanceExists: !!quillInstance.current,
      editorLoaded,
      isInitialized: isInitialized.current
    });

    if (editorRef.current && !quillInstance.current && !isInitialized.current) {
      console.log('🚀 Initializing Quill instance with better-table...');
      isInitialized.current = true;

      // Clear any existing content in the editor div to prevent double initialization
      editorRef.current.innerHTML = '';

      // Initialize Quill with better-table module
      const quill = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder: 'Type or paste your content here!',
        modules: {
          'better-table': {
            operationMenu: {
              items: {
                unmergeCells: {
                  text: 'Another unmerge cells name'
                }
              },
              color: {
                colors: ['#fff', '#000', '#f00'] // Cell background colors
              }
            }
          },
          toolbar: {
            container: toolbarOptions,
            handlers: {
              'image': imageHandler,
              'video': videoHandler,
              'link': linkHandler,
              modules: {
                'better-table': {
                  operationMenu: {
                    items: {
                      unmergeCells: {
                        text: 'Another unmerge cells name'
                      }
                    },
                    color: {
                      colors: ['#fff', '#000', '#f00'] // Cell background colors
                    }
                  }
                },
                toolbar: {
                  container: toolbarOptions,
                  handlers: {
                    'image': imageHandler,
                    'video': videoHandler,
                    'link': linkHandler,
                    // The 'better-table' handler has been removed
                  }
                },
                clipboard: {
                  matchVisual: false
                },
                history: {
                  delay: 2000,
                  maxStack: 500,
                  userOnly: true
                },
                keyboard: {
                  bindings: QuillBetterTable.keyboardBindings
                }
              },
            }
          },
          clipboard: {
            matchVisual: false
          },
          history: {
            delay: 2000,
            maxStack: 500,
            userOnly: true
          },
          keyboard: {
            bindings: QuillBetterTable.keyboardBindings
          }
        },
        formats: [
          'header', 'font', 'size',
          'bold', 'italic', 'underline', 'strike',
          'color', 'background',
          'script',
          'blockquote', 'code-block',
          'list', 'bullet', 'check',
          'indent',
          'align',
          'link', 'image', 'video',
          // Better table formats
          'table', 'table-cell-line', 'table-cell'
        ]
      });

      console.log('✅ Quill instance created successfully with better-table', quill);

      // Set initial content
      if (initialData) {
        console.log('📝 Setting initial data:', initialData.substring(0, 100) + '...');
        quill.clipboard.dangerouslyPasteHTML(initialData);
      }

      // Listen for text changes
      quill.on('text-change', (delta, oldDelta, source) => {
        console.log('📄 Text changed, source:', source);
        // Only trigger onChange for user changes, not programmatic ones
        if (source === 'user') {
          const html = quill.root.innerHTML;
          console.log('🔄 Calling onChange with:', html.substring(0, 100) + '...');
          onChange(html);
        }
      });

      quillInstance.current = quill;
      setEditorLoaded(true);
      console.log('🎉 Editor loaded and ready with table support!');
    } else {
      console.log('⏳ Editor initialization skipped:', {
        noEditorRef: !editorRef.current,
        quillAlreadyExists: !!quillInstance.current,
        alreadyInitialized: isInitialized.current
      });
    }
  }, []); // Removed dependencies to prevent re-initialization

  // Separate useEffect for handling initialData updates
  useEffect(() => {
    console.log('🔄 InitialData update effect triggered', {
      hasQuillInstance: !!quillInstance.current,
      initialDataLength: initialData.length,
      currentContent: quillInstance.current?.root.innerHTML?.substring(0, 100) + '...'
    });

    if (quillInstance.current && initialData && initialData !== quillInstance.current.root.innerHTML) {
      console.log('📝 Updating editor content with new initialData');
      const currentSelection = quillInstance.current.getSelection();
      quillInstance.current.clipboard.dangerouslyPasteHTML(initialData);
      if (currentSelection) {
        quillInstance.current.setSelection(currentSelection);
      }
    }
  }, [initialData]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting - cleaning up Quill instance');
      if (quillInstance.current) {
        quillInstance.current.off('text-change');
        quillInstance.current = null;
      }
      isInitialized.current = false;
    };
  }, []);

  console.log('🔍 RichTextEditor render:', {
    editorLoaded,
    hasEditorRef: !!editorRef.current,
    hasQuillInstance: !!quillInstance.current,
    initialDataLength: initialData.length
  });

  return (
    <div className="quill-wrapper">
      <div ref={editorRef} className="quill-editor" />

      <style jsx global>{`
        .quill-wrapper {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .quill-editor .ql-editor {
          min-height: 350px;
          font-size: 14px;
          line-height: 1.6;
          padding: 15px;
        }
        
        .quill-editor .ql-toolbar {
          border-top: 1px solid #ccc;
          border-left: 1px solid #ccc;
          border-right: 1px solid #ccc;
          border-bottom: none;
          padding: 8px;
        }
        
        .quill-editor .ql-container {
          border-bottom: 1px solid #ccc;
          border-left: 1px solid #ccc;
          border-right: 1px solid #ccc;
          border-top: none;
        }
        
        /* Prevent multiple toolbars */
        .quill-wrapper .ql-toolbar:not(:first-child) {
          display: none !important;
        }
        
        /* Better table styles */
        .quill-editor .ql-editor .ql-better-table {
          border-collapse: collapse;
          margin: 10px 0;
          width: 100%;
        }
        
        .quill-editor .ql-editor .ql-better-table td,
        .quill-editor .ql-editor .ql-better-table th {
          border: 1px solid #ddd;
          padding: 8px;
          min-width: 50px;
          min-height: 20px;
          position: relative;
        }
        
        .quill-editor .ql-editor .ql-better-table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        
        /* Table operation menu styling */
        .ql-better-table-operation-menu {
          background: white;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          z-index: 1000;
        }
        
        .ql-better-table-operation-menu .ql-better-table-operation-menu-item {
          padding: 8px 12px;
          cursor: pointer;
          border-bottom: 1px solid #eee;
        }
        
        .ql-better-table-operation-menu .ql-better-table-operation-menu-item:hover {
          background-color: #f5f5f5;
        }
        
        .ql-better-table-operation-menu .ql-better-table-operation-menu-item:last-child {
          border-bottom: none;
        }
        
        /* Table column tool styling */
        .ql-better-table-col-tool {
          background: #0066cc;
          height: 12px;
          position: absolute;
          z-index: 100;
        }
        
        .ql-better-table-row-tool {
          background: #0066cc;
          width: 12px;
          position: absolute;
          z-index: 100;
        }
        
        /* Custom styles for better appearance */
        .quill-editor .ql-snow .ql-tooltip {
          z-index: 1000;
        }
        
        .quill-editor .ql-snow .ql-picker.ql-font .ql-picker-label::before,
        .quill-editor .ql-snow .ql-picker.ql-font .ql-picker-item::before {
          content: 'Sans Serif';
        }
        
        .quill-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value=serif]::before,
        .quill-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value=serif]::before {
          content: 'Serif';
          font-family: serif;
        }
        
        .quill-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value=monospace]::before,
        .quill-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value=monospace]::before {
          content: 'Monospace';
          font-family: monospace;
        }
        
        /* Size picker labels */
        .quill-editor .ql-snow .ql-picker.ql-size .ql-picker-label::before,
        .quill-editor .ql-snow .ql-picker.ql-size .ql-picker-item::before {
          content: 'Normal';
        }
        
        .quill-editor .ql-snow .ql-picker.ql-size .ql-picker-label[data-value=small]::before,
        .quill-editor .ql-snow .ql-picker.ql-size .ql-picker-item[data-value=small]::before {
          content: 'Small';
        }
        
        .quill-editor .ql-snow .ql-picker.ql-size .ql-picker-label[data-value=large]::before,
        .quill-editor .ql-snow .ql-picker.ql-size .ql-picker-item[data-value=large]::before {
          content: 'Large';
        }
        
        .quill-editor .ql-snow .ql-picker.ql-size .ql-picker-label[data-value=huge]::before,
        .quill-editor .ql-snow .ql-picker.ql-size .ql-picker-item[data-value=huge]::before {
          content: 'Huge';
        }
        
        /* Toolbar button spacing */
        .quill-editor .ql-toolbar .ql-formats:not(:last-child) {
          margin-right: 15px;
        }
        
        /* Enhanced focus styles */
        .quill-editor .ql-editor:focus {
          outline: none;
          border-color: #0066cc;
        }
        
        /* Better blockquote styling */
        .quill-editor .ql-editor blockquote {
          border-left: 4px solid #ccc;
          margin-bottom: 5px;
          margin-top: 5px;
          padding-left: 16px;
        }
        
        /* Code block styling */
        .quill-editor .ql-editor pre.ql-syntax {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 10px;
          margin: 10px 0;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
}