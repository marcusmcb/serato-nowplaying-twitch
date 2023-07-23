const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const { spawn } = require('child_process');

let mainWindow;

app.on('ready', () => {
  // ... Your code for starting the chatbot script ...

  // Start the React development server using create-react-app
  const reactDevServer = spawn('npx', ['create-react-app', '--port', '3000'], {
    cwd: path.join(__dirname, 'client'), // Run the command in the 'client' folder
    shell: true, // Use shell to execute the command with npx
    stdio: 'inherit', // Use stdio 'inherit' to display output in the terminal
  });

  // Add an event listener to handle the closing of the Electron app
  app.on('before-quit', () => {
    // Terminate the React development server when the Electron app is closed
    if (reactDevServer) {
      reactDevServer.kill();
    }
  });

  // Wait for a short delay (e.g., 2000 milliseconds) to ensure the React server has started
  setTimeout(() => {
    // Create a new Electron browser window for the React app
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
      },
    });

    const indexPath = app.isPackaged
      ? path.join(__dirname, 'client', 'build', 'index.html')
      : url.format({
          protocol: 'http:',
          slashes: true,
          hostname: 'localhost',
          port: 3000, // The React app runs on port 3000 by default
          pathname: 'index.html',
        });

    // Load the React app's index.html file
    mainWindow.loadURL(indexPath);

    // ... Your code for handling window events ...
  }, 2000); // Adjust the delay as needed
});
