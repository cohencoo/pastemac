const { app, BrowserWindow, clipboard, ipcMain, globalShortcut, screen } = require("electron")
const path = require("path")
const fs = require("fs")
const axios = require("axios")
const { exec } = require("child_process")
let mainWindow = null

const checkLocations = {
    "index.css": "https://raw.githubusercontent.com/cohencoo/pastemac/master/src/index.css",
    "app.js": "https://raw.githubusercontent.com/cohencoo/pastemac/master/src/app.js",
    "index.html": "https://raw.githubusercontent.com/cohencoo/pastemac/master/src/index.html",
}

async function checkUpdates() {
    for (const item of Object.keys(checkLocations)) {
        const localFilePath = path.join(__dirname, item)

        try {
            const localContent = fs.readFileSync(localFilePath, "utf-8")
            const response = await axios.get(checkLocations[item])
            const remoteContent = response.data

            if (localContent === remoteContent) {
            } else {
                console.log(`${item} has updates available. Updating...`)
                fs.writeFileSync(localFilePath, remoteContent, "utf-8")
            }
        } catch (error) {}
    }
    return true
}

if (require("electron-squirrel-startup")) app.quit()

if (!fs.existsSync(path.join(__dirname, "images"))) fs.mkdirSync(path.join(__dirname, "images"))
if (!fs.existsSync(path.join(__dirname, "paste")))
    fs.writeFileSync(path.join(__dirname, "paste"), "{}", "utf-8")

let clip = JSON.parse(fs.readFileSync(path.join(__dirname, "paste"), "utf8"))

const createWindow = () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize
    mainWindow = new BrowserWindow({
        width,
        height: 400,
        x: 0,
        y: height,
        transparent: true,
        frame: false,
        resizable: false,
        icon: __dirname + "/logo.png",
        webPreferences: {
            devTools: !app.isPackaged,
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            nodeIntegrationInSubFrames: true,
            enableRemoteModule: true,
            contextIsolation: false,
        },
    })

    const settings = new BrowserWindow({
        width: 500,
        height: 530,
        transparent: true,
        frame: false,
        icon: __dirname + "/logo.png",
        roundedCorners: true,

        webPreferences: {
            devTools: !app.isPackaged,
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            nodeIntegrationInSubFrames: true,
            enableRemoteModule: true,
            contextIsolation: false,
        },
    })
    settings.loadFile(path.join(__dirname, "settings/settings.html"))
    settings.hide()

    mainWindow.setAlwaysOnTop(true, "floating")
    mainWindow.setVisibleOnAllWorkspaces(true)

    ipcMain.on("settings", (event) => {
        settings.show()
        event.returnValue = ""
    })
    ipcMain.on("quit", (event) => {
        event.returnValue = ""
        app.quit()
        process.exit()
    })
    ipcMain.on("done", (event) => {
        mainWindow.hide()
        event.returnValue = ""
    })
    ipcMain.on("closeSettings", (event) => {
        settings.hide()
        event.returnValue = ""
    })
    ipcMain.on("delete", (event, id) => {
        delete clip[id]
        fs.writeFileSync(path.join(__dirname, "paste"), JSON.stringify(clip), "utf-8")
        mainWindow.webContents.send("renew")
        event.returnValue = ""
    })
    globalShortcut.register("Option+V", () => {
        mainWindow.webContents.send("renew")
        mainWindow.show()
    })
    globalShortcut.register("F2", () => {
        exec("pmset displaysleepnow")
    })
    mainWindow.on("close", (e) => {
        e.preventDefault()
        mainWindow.hide()
    })
    settings.on("close", (e) => {
        e.preventDefault()
        settings.hide()
    })
    mainWindow.loadFile(path.join(__dirname, "index.html"))
}
app.on("ready", async () => {
    if (await checkUpdates()) {
        createWindow()
        mainWindow.show()
    }
})
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit()
})

app.on("activate", async () => {
    if (await checkUpdates()) {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
        if (mainWindow) {
            mainWindow.webContents.send("renew")
            mainWindow.show()
        }
    }
})

function clipper(data) {
    const keys = Object.keys(clip)
    if (clip[keys[keys.length - 1]]?.text == data.text) return

    clip[data.id] = data
    fs.writeFileSync(path.join(__dirname, "paste"), JSON.stringify(clip), "utf-8")
}

function onClipboardChange() {
    const id = Date.now()
    const type = clipboard.availableFormats()[clipboard.availableFormats().length - 1]

    if (type?.toString()?.includes("image")) {
        const buffy = clipboard.readImage()?.toPNG()
        const name = id + ".png"

        fs.writeFileSync(path.join(__dirname, "images", name), buffy)
        const img = path.join(__dirname, "images", name)

        clipper({
            text: img,
            image: img,
            time: id,
            type,
            id,
        })
        return
    } else {
        const text = clipboard.readText()
        if (!text || text.length > 90000) return

        clipper({
            text,
            time: id,
            type,
            id,
        })
    }
}

let lastTextValue = null
setInterval(() => {
    const value =
        clipboard.readImage()?.toPNG().length > 200
            ? clipboard.readImage()?.toPNG().length
            : clipboard.readText()

    if (value !== lastTextValue) {
        lastTextValue = value
        onClipboardChange(value)
    }
}, 300)

// wanting to get it to work here, but it's not working.

// setInterval(() => {
//     const value =
//         clipboard.readImage()?.toPNG().length > 200
//             ? clipboard.readImage()?.toPNG().length
//             : clipboard.readText()

//     // only trigger clipboard change if either text value is different, or image value is different
//     if (value !== lastTextValue && clipboard.readImage()?.toPNG().length < 200) {
//         lastTextValue = value
//         onClipboardChange(value)
//     }
//     if (value !== lastImageValue && clipboard.readImage()?.toPNG().length > 200) {
//         lastImageValue = value
//         onClipboardChange(value)
//         lastTextValue = value
//     }
// }, 300)
