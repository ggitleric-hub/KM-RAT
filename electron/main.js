// t.me/SentinelLinks

// Grob Rat RAT - Electron Main Process
const { app, BrowserWindow, ipcMain, shell, Notification } = require("electron")
const path = require("path")
const { spawn } = require("child_process")

let mainWindow = null
let serverProcess = null

const PORT = 3000
const DEV_URL = `http://localhost:${PORT}`

function getAssetPath(subdir, file) {
  return path.join(__dirname, "..", "..", subdir || "", file || "")
}

async function startNextServer() {
  return new Promise((resolve) => {
    const nextPath = path.join(__dirname, "..", "..", "node_modules", ".bin", "next")
    serverProcess = spawn("node", [nextPath, "start", "-p", PORT.toString()], {
      cwd: __dirname,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "production" },
    })

    serverProcess.stdout.on("data", (data) => {
      console.log(`[Next.js]: ${data}`)
      if (data.toString().includes(`ready on ${DEV_URL}`)) {
        resolve(true)
      }
    })

    serverProcess.stderr.on("data", (data) => {
      console.error(`[Next.js Error]: ${data}`)
    })

    // Timeout fallback
    setTimeout(() => resolve(true), 15000)
  })
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    title: "Grob Rat RAT",
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    frame: false,
    transparent: false,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closable: true,
    fullscreenable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      sandbox: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      disableBlinkFeatures: "Auxclick",
    },
    backgroundColor: "#000000",
    show: false,
    icon: path.join(__dirname, "..", "..", "public", "icon.ico"),
  })

  mainWindow.once("ready-to-show", () => {
    mainWindow.show()
    mainWindow.focus()
  })

  mainWindow.on("closed", () => {
    mainWindow = null
  })

  mainWindow.on("unresponsive", () => {
    console.warn("Window became unresponsive")
  })

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL(DEV_URL)
    mainWindow.webContents.openDevTools({ mode: "detach" })
  } else {
    await startNextServer()
    mainWindow.loadURL(DEV_URL)
  }

  // Security headers
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({ requestHeaders: details.requestHeaders })
  })
}

// Window control handlers
ipcMain.handle("window-minimize", () => {
  mainWindow?.minimize()
})

ipcMain.handle("window-maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.handle("window-close", () => {
  mainWindow?.close()
})

// External links handler
ipcMain.handle("open-external", async (_, url) => {
  await shell.openExternal(url)
})

// Notification handler
ipcMain.handle("show-notification", async (_, options) => {
  const notification = new Notification(options)
  notification.show()
  return notification
})

// App lifecycle
app.whenReady().then(async () => {
  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  app.on("window-all-closed", () => {
    if (serverProcess) {
      serverProcess.kill()
    }
    if (process.platform !== "darwin") {
      app.quit()
    }
  })

  app.on("before-quit", () => {
    if (serverProcess) {
      serverProcess.kill()
    }
  })
})

app.on("web-contents-created", (event, contents) => {
  contents.on("will-navigate", (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    if (parsedUrl.origin !== new URL(DEV_URL).origin) {
      event.preventDefault()
      shell.openExternal(navigationUrl)
    }
  })

  contents.on("new-window", async (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    if (parsedUrl.origin !== new URL(DEV_URL).origin) {
      event.preventDefault()
      shell.openExternal(navigationUrl)
    }
  })
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason)
})

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error)
  if (serverProcess) {
    serverProcess.kill()
  }
  app.quit()
})

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
