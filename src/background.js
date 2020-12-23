"use strict";

import { app, protocol } from 'electron'
import installExtension from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'


import { start, getLastWindow, client, consts } from 'astilectron';

const join = require("path").join;
const child_process = require("child_process");

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  client.socket.destroy();
  if (process.platform !== 'darwin') {
    app.quit()
  }
})


app.on('web-contents-created', async (event, webContents) => {
  if (isDevelopment && !process.env.IS_TEST) {
    try {
      await installExtension({ id: "ljjemllljcmogpfapbkkighbhhppjdbg", electron: ">=1.2.1" })
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
    await webContents.openDevTools()
  }
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
  let s = process.argv[i].replace(/^[\\-]+/g, "");
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
const cmd = child_process.spawn(
  (isDevelopment ? join(process.cwd(), 'bin', "main") : join(process.resourcesPath, 'bin', 'main')), 
  [port, process.env.WEBPACK_DEV_SERVER_URL ? process.env.WEBPACK_DEV_SERVER_URL : 'app://./index.html']
)
cmd.stdout.pipe(process.stdout);
cmd.stderr.pipe(process.stderr);

cmd.stdout.on("data", (data) => {
  if (data.indexOf('Start') == 0) {
    try {
      start("127.0.0.1:"+port)
    } catch (e) {
      app.quit()
    }
  }
})
