const {
    app,
    BrowserWindow,
    TouchBar,
    clipboard,
    ipcMain,
    globalShortcut,
    screen,
} = require("electron")
const { TouchBarButton } = TouchBar
const path = require("path")
const fs = require("fs")

if (require("electron-squirrel-startup")) app.quit()

if (!fs.existsSync(path.join(__dirname, "paste"))) {
    fs.writeFileSync(path.join(__dirname, "paste"), "{}", "utf-8")
}

let clip = JSON.parse(fs.readFileSync(path.join(__dirname, "paste"), "utf8"))
let mainWindow = null

const createWindow = () => {
    const { width } = screen.getPrimaryDisplay().workAreaSize
    mainWindow = new BrowserWindow({
        width: width,
        height: 400,
        x: 0,
        y: 1000,
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

    const touchBar = new TouchBar({
        items: [
            new TouchBarButton({
                label: "✕",
                backgroundColor: "#ff3826",
                click: () => mainWindow.hide(),
            }),
            new TouchBarButton({
                label: "⚙️",
                click: () => settings.show(),
            }),
        ],
    })
    mainWindow.setTouchBar(touchBar)

    settings.setTouchBar(
        new TouchBar({
            items: [
                new TouchBarButton({
                    label: "✕",
                    backgroundColor: "#ff3826",
                    click: () => settings.hide(),
                }),
            ],
        })
    )

    ipcMain.on("settings", (event) => {
        settings.show()
        event.returnValue = ""
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
app.on("ready", () => {
    createWindow()
    mainWindow.show()
})
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit()
})

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
    if (mainWindow) {
        mainWindow.webContents.send("renew")
        mainWindow.show()
    }
})

// if (clipboard.readImage()) console.log(clipboard.readImage().toDataURL())
setInterval(() => {
    if (clipboard.readText()) {
        const id = Date.now()
        const text = clipboard.readText()
        if (text.length > 90000) return

        const data = {
            text,
            time: id,
            id,
        }

        const keys = Object.keys(clip)
        if (clip[keys[keys.length - 1]]?.text == data.text) return

        clip[id] = data
        fs.writeFileSync(path.join(__dirname, "paste"), JSON.stringify(clip), "utf-8")
    }
}, 300)
