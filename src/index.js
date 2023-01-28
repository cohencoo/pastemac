const { app, BrowserWindow, TouchBar, clipboard, ipcMain, globalShortcut, screen } = require('electron');
const { TouchBarButton } = TouchBar
const path = require('path');
const fs = require('fs');
let clip = fs.readFileSync(path.join(__dirname, 'paste'), 'utf8').split("<NEXTPASTE>")
if (require('electron-squirrel-startup')) app.quit();

let mainWindow = null;

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
    icon: __dirname + '/logo.png',
    webPreferences: { 
      devTools: !app.isPackaged,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      nodeIntegrationInSubFrames: true,
      enableRemoteModule: true,
      contextIsolation: false,
    }
  });

  const settings = new BrowserWindow({
    width: 500,
    height: 530,
    transparent: true,
    frame: false,
    icon: __dirname + '/logo.png',
    roundedCorners: true,
    
    webPreferences: { 
      devTools: !app.isPackaged,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      nodeIntegrationInSubFrames: true,
      enableRemoteModule: true,
      contextIsolation: false,
    }
  })
  settings.loadFile(path.join(__dirname, 'settings/settings.html'));
  settings.hide();

  const touchBar = new TouchBar({
    items: [
      new TouchBarButton({
        label: '✕',
        backgroundColor: '#ff3826',
        click: () => mainWindow.hide()
      }),
      new TouchBarButton({
        label: '⚙️',
        click: () => settings.show()
      })
    ]
  })
  mainWindow.setTouchBar(touchBar)

  settings.setTouchBar(new TouchBar({
    items: [
      new TouchBarButton({
        label: '✕',
        backgroundColor: '#ff3826',
        click: () => settings.hide()
      })
    ]
  }))

  ipcMain.on('settings', (event) => {
      settings.show()
      event.returnValue = ""
    })
  ipcMain.on('showWindow', (event) => {
    if (mainWindow == null) createWindow()
    mainWindow.show();
    event.returnValue = ""
  })
  ipcMain.on('done', (event) => {
    mainWindow.hide();
    event.returnValue = ""
  })
  ipcMain.on('closeSettings', (event) => {
    settings.hide();
    event.returnValue = ""
  })
  ipcMain.on('clearLast', (event) => {
    clip.pop()
    let temp = clip.join("<NEXTPASTE>")
    if (temp.includes("<NEXTPASTE><NEXTPASTE>")) temp = temp.replaceAll("<NEXTPASTE><NEXTPASTE>", "<NEXTPASTE>")
    fs.writeFileSync(path.join(__dirname, 'paste'), temp, 'utf-8')
    clip = fs.readFileSync(path.join(__dirname, 'paste'), 'utf8').split("<NEXTPASTE>")
    mainWindow.webContents.send("renew")
    event.returnValue = ""
  })
  globalShortcut.register('Option+V', () => {
    mainWindow.webContents.send("renew")
    mainWindow.show()
  })
  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow.hide();
  });
  settings.on('close', (e) => {
    e.preventDefault();
    settings.hide();
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
};
app.on('ready', () => {
  createWindow()
  mainWindow.show()
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
  if (mainWindow) {
    mainWindow.webContents.send("renew")
    mainWindow.show()
  }
});

setInterval(() => {
  if (clipboard.readText().split("<PASTERECORD>")[0] != clip[clip.length - 1].split("<PASTERECORD>")[0]) {
    if (clipboard.readText().length > 90000) return;
    let date = new Date(); let dd = date.getDate(); 
    let dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
    let mm = date.getMonth() + 1; 
    let yyyy = date.getFullYear();
    let hour = date.getHours(); 
    hour = hour % 12;
    hour = hour ? hour : 12;
    let min = date.getMinutes();
    min = min < 10 ? '0' + min : min;
    let sec = date.getSeconds();
    sec = sec < 10 ? '0' + sec : sec;
    let record = `${dayName}, ${mm}/${dd}/${yyyy} ${hour}:${min}:${sec} ${date.getHours() >= 12 ? 'PM' : 'AM'}`
    clip.push(String(clipboard.readText())+"<PASTERECORD>"+record)
    try { fs.appendFileSync(path.join(__dirname, 'paste'), String(clipboard.readText())+"<PASTERECORD>"+record+"<NEXTPASTE>", 'utf-8')}
    catch(e) {}
  }
}, 300);