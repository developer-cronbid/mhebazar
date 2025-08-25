// lib/upload-adapter.ts

export class MyUploadAdapter {
  private loader: any;
  private onFileChange: (file: File) => void;

  constructor(loader: any, onFileChange: (file: File) => void) {
    this.loader = loader;
    this.onFileChange = onFileChange;
  }

  upload() {
    return this.loader.file.then((file: File) => {
      // Pass the file to the parent component to be stored in state
      this.onFileChange(file);

      // Return a temporary local URL for preview inside the editor
      return {
        default: URL.createObjectURL(file),
      };
    });
  }

  abort() {
    // This method is called if the upload is aborted.
    console.log('Upload aborted');
  }
}