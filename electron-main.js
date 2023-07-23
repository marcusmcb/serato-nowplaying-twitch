const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

let mainWindow;

app.on('ready', () => {
  // ... Your code for starting the chatbot script ...

  // Create a new Electron browser window for the React app
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // Load the React development server URL (not the production build URL)
  mainWindow.loadURL('http://localhost:3000');

  // Uncomment the following line if you want to open the DevTools for debugging
  // mainWindow.webContents.openDevTools();

  // ... Your code for handling window events ...
});

// Handle the closing of the Electron app
app.on('before-quit', () => {
  // Close the Electron window when the app is closed
  if (mainWindow) {
    mainWindow.destroy();
  }
});
