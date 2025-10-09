// src/utils/disableConsole.ts

if (process.env.NODE_ENV === 'production') {
  // Save references to the original methods if you need them later
  // const originalConsoleError = console.error; 

  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
  // 💥 This is what you need for the final removal of warn and error
  console.warn = () => {}; 
  console.error = () => {};
}

// You can add this file to your global layout or _app.tsx entry point.