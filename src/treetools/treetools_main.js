const { app, BrowserWindow, Menu, ipcRenderer, ipcMain } = require('electron');

let mainWindow;

process.env.NODE_ENV = 'development'
const isDev = process.env.NODE_ENV !== 'production' ? true : false
const isMac = process.platform === 'darwin' ? true : false

function createMainWindow () {
    mainWindow = new BrowserWindow({
        title: 'Image Shrink',
        height: 600,
        width: 500,
        icon: './icons/crosshairs-solid.svg',
        resizable: isDev ? true : false,
        backgroundColor: 'black',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },

    });

    mainWindow.loadFile('./app/index.html')
};

app.on('ready', () => {
    createMainWindow();
    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);
    mainWindow.on('ready', () => mainWindow = null)
});

const menu = [
    ...(isMac ? [{
        label: app.name,
        submenu: [
            {
                label: 'About',
                click: createAboutWindow
            }
        ]
    }] : []),
    {
        role: 'fileMenu'
    },
    ...(!isMac ? [{
        label: 'Help',
        submenu: [
            {
                label: 'About',
                click: createAboutWindow
            }
        ]
    }] : []),
    ...(isDev ? [
        {
            label: 'Developer',
            submenu: [
                { role: 'reload' },
                { role: 'forcereload' },
                { role: 'separator' },
                { role: 'toggledevtools' }
            ]
        }
    ] : [])
]

function createAboutWindow() {
    aboutWindow = new BrowserWindow({
        title: 'About Imageshrink',
        width: 300,
        height: 300,
        icon: './icons/crosshairs-solid.svg',
        resizable: false
    });
    aboutWindow.loadFile('./app/about.html');
    aboutWindow.setMenuBarVisibility(false)
};

ipcMain.on('image:minimize', (e, options) => {
    console.log(options)
})

app.on('window-all-closed', () => {
    if (!isMac) {
        app.quit()
    }
})