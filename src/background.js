"use strict";

import { app, protocol, BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'


import { start, getLastWindow, client, consts } from 'astilectron';

const join = require("path").join;
const child_process = require("child_process");
const { SSL_OP_EPHEMERAL_RSA } = require("constants");

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  // Create the browser window.
  /*
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION
    }
  })
  */
 const win = getLastWindow();

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

// edge case when the program is launched without arguments
if (process.argv.length == 1) {
  app.requestSingleInstanceLock();
  app.quit();
}

if (process.argv[3] === "true") {
  // Lock
  const singlesInstanceLock = app.requestSingleInstanceLock();
  if (!singlesInstanceLock) {
    app.quit();
  }

  // Someone tried to run a second instance, we should focus our window.
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    client.write(consts.targetIds.app, consts.eventNames.appEventSecondInstance, {secondInstance: {commandLine: commandLine, workingDirectory: workingDirectory}})
    const lastWindow = getLastWindow()
    if (lastWindow) {
      if (lastWindow.isMinimized()) lastWindow.restore();
      lastWindow.show();
    }
  });
}

// Command line switches
let idx = 4;
for (let i = idx; i < process.argv.length; i++) {
  let s = process.argv[i].replace(/^[\-]+/g, "");
  let v;
  if (
    typeof process.argv[i + 1] !== "undefined" &&
    !process.argv[i + 1].startsWith("-")
  ) {
    v = process.argv[i + 1];
    i++;
  }
  app.commandLine.appendSwitch(s, v);
}

const port = "9090";
// Start go-astilectron
const cmd = child_process.exec(join(__static, "main") + " " + port);
cmd.stdout.pipe(process.stdout);
cmd.stderr.pipe(process.stderr);

start("127.0.0.1:"+port);
