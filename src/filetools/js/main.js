const {
  app,
  BrowserWindow,
  Menu,
  dialog,
  ipcMain,
  globalShortcut,
} = require("electron");
const fs = require("fs");

let mainWindow;
let snippetWindow;
let mainWindowClosing = false;

process.env.NODE_ENV = "development";
const isDev = process.env.NODE_ENV !== "production" ? true : false;
const isMac = process.platform === "darwin" ? true : false;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: "Conphyig",
    height: 1000,
    width: 1300,
    resizable: true,
    backgroundColor: "black",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow.on("close", (e) => {
    if (
      dialog.showMessageBoxSync({
        type: "warning",
        buttons: ["OK", "Cancel"],
        message: "Warning: any unsaved changes to control file will be lost!",
        title: "Quit Conphyig :: filetools",
      }) == 0
    ) {
      mainWindowClosing = true;
    } else {
      e.preventDefault();
    }
  });
  mainWindow.loadFile("./html/index.html");
}

function createSnippetWindow() {
  snippetWindow = new BrowserWindow({
    title: "Conphyig :: Snippet Configurator",
    parent: mainWindow,
    width: 800,
    height: 800,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    backgroundColor: "#000000",
  });
  snippetWindow.loadFile("./html/snippetconfigurator.html");
  snippetWindow.setMenuBarVisibility(true);
  Menu.getApplicationMenu().getMenuItemById(
    "create-snippet-window"
  ).enabled = false;
  Menu.getApplicationMenu().getMenuItemById("activate-snippet").enabled = false;

  snippetWindow.setMenu(snpMB);
  if (isMac)
    // display snippet menu when snippetWindow has focus
    snippetWindow.on("focus", () => {
      Menu.setApplicationMenu(snpMB);
    });
  snippetWindow.on("close", (e) => {
    if (!mainWindowClosing) {
      // only show snippet warning when snippet configurator (SC) is closing NOT when main window and SC are both closing.
      if (
        dialog.showMessageBoxSync({
          type: "warning",
          buttons: ["OK", "Cancel"],
          message: "Warning: any unsaved changes to snippets will be lost!",
          title: "Close snippet configurator",
        }) == 0
      ) {
        Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
        Menu.getApplicationMenu().getMenuItemById(
          "create-snippet-window"
        ).enabled = true;
        Menu.getApplicationMenu().getMenuItemById(
          "activate-snippet"
        ).enabled = true;
      } else {
        e.preventDefault();
      }
    }
  });
}

app.on("ready", () => {
  createMainWindow();
  const mainMenu = Menu.buildFromTemplate(menu);
  if (isMac)
    // display main menu when mainWindow has focus
    mainWindow.on("focus", () => {
      Menu.setApplicationMenu(mainMenu);
    });
  Menu.setApplicationMenu(mainMenu);
  mainWindow.on("ready", () => (mainWindow = null));
});

// define menu for snippetconfigurator window
const snpcfgmenu = [
  {
    label: "Snippets",
    submenu: [
      {
        label: "Open Snippet",
        accelerator: "CmdOrCtrl+Shift+O",
        click: openSnippet,
      },
      {
        label: "Save",
        accelerator: "CmdOrCtrl+Shift+S",
        click: saveSnippet,
      },
      {
        label: "Save As...",
        accelerator: "CmdOrCtrl+Shift+A",
        click: saveAsSnippet,
      },
      {
        label: "Export...",
        accelerator: "CmdOrCtrl+Shift+E",
        click: exportSnippet,
      },
      {
        role: "toggledevtools",
        accelerator: "CmdOrCtrl+Shift+I",
        visible: false,
      },
    ],
  },
];

// functions for handling snippetconfigurator menu clicks
const snpMB = Menu.buildFromTemplate(snpcfgmenu);

function saveSnippet() {
  snippetWindow.webContents.send("savesnippet");
}

function saveAsSnippet() {
  snippetWindow.webContents.send("saveassnippet");
}

function openSnippet() {
  snippetWindow.webContents.send("opensnippet");
}

function exportSnippet() {
  snippetWindow.webContents.send("exportsnippet");
}

// define menu for main (editor) window
const menu = [
  {
    label: "File",
    submenu: [
      {
        label: "New Control File",
        accelerator: "CmdOrCtrl+N",
        click: newControlFile,
      },
      {
        label: "Open Control File",
        accelerator: "CmdOrCtrl+O",
        click: openControlFile,
      },
      {
        id: "save-control-file",
        label: "Save Control File",
        accelerator: "CmdOrCtrl+S",
        click: saveControlFile,
        enabled: false,
      },
      {
        id: "save-control-file-as",
        label: "Save Control File As...",
        click: saveControlFileAs,
        enabled: false,
      },
      {
        id: "close-control-file",
        label: "Close Control File",
        click: closeControlFile,
        enabled: false,
      },
      {
        role: "quit",
      },
    ],
  },
  {
    label: "Snippets",
    submenu: [
      {
        id: "create-snippet-window",
        label: "Open Snippet Configurator...",
        accelerator: "CmdOrCtrl+Alt+C",
        click: createSnippetWindow,
      },
      {
        id: "activate-snippet",
        label: "Activate Snippet...",
        accelerator: "CmdOrCtrl+Alt+A",
        click: activateSnippet,
      },
      {
        role: "reload",
        visible: false,
      },
      {
        role: "forcereload",
        visible: false,
      },
      {
        role: "toggledevtools",
        visible: false,
      },
    ],
  },
  ...[
    {
      label: "Projects",
      submenu: [
        {
          label: "Create New",
          accelerator: "CmdOrCtrl+Alt+N",
          click: createNewProject,
        },
        {
          label: "Open",
          accelerator: "CmdOrCtrl+Alt+O",
          click: openProject,
        },
        {
          label: "Save",
          accelerator: "CmdOrCtrl+Alt+S",
          click: saveProject,
        },
        {
          label: "Export",
          accelerator: "CmdOrCtrl+Alt+E",
          click: exportProject,
        },
      ],
    },
  ],
];

// functions for handling main (editor) windows clicks

function newControlFile() {
  Menu.getApplicationMenu().getMenuItemById("save-control-file").enabled = true;
  Menu.getApplicationMenu().getMenuItemById(
    "save-control-file-as"
  ).enabled = true;
  Menu.getApplicationMenu().getMenuItemById(
    "close-control-file"
  ).enabled = true;
  mainWindow.webContents.send("opencontrolfile", {
    content: undefined,
    path: undefined,
  });
}

function openControlFile() {
  const files = dialog.showOpenDialogSync(mainWindow, {
    title: "Choose a Control File",
    properties: ["openFile"],
  });
  if (!files) return;
  const file = files[0];
  const fileContent = fs.readFileSync(file).toString();
  Menu.getApplicationMenu().getMenuItemById("save-control-file").enabled = true;
  Menu.getApplicationMenu().getMenuItemById(
    "save-control-file-as"
  ).enabled = true;
  Menu.getApplicationMenu().getMenuItemById(
    "close-control-file"
  ).enabled = true;
  mainWindow.webContents.send("opencontrolfile", {
    content: fileContent,
    path: file,
  });
}

function saveControlFile() {
  mainWindow.webContents.send("savecontrolfile", "test");
}

function saveControlFileAs() {
  mainWindow.webContents.send("savecontrolfileas", "test");
}

function closeControlFile() {
  mainWindow.webContents.send("closecontrolfile", "test");
  Menu.getApplicationMenu().getMenuItemById(
    "save-control-file"
  ).enabled = false;
  Menu.getApplicationMenu().getMenuItemById(
    "save-control-file-as"
  ).enabled = false;
  Menu.getApplicationMenu().getMenuItemById(
    "close-control-file"
  ).enabled = false;
}

function activateSnippet() {
  const snpfileImport = dialog.showOpenDialogSync(mainWindow, {
    title: "Choose a Snippet File",
    properties: ["openFile"],
  });
  if (!snpfileImport) return;
  const file = snpfileImport[0];
  const fileContent = fs.readFileSync(file).toString();
  const activeSnippet = JSON.parse(fileContent);
  mainWindow.webContents.send("snippets", activeSnippet);
  console.log("activated snippet");
}

function createNewProject() {
  const files = dialog.showOpenDialogSync(mainWindow, {
    title: "Choose a Sequence Alignment for a New Project",
    properties: ["openFile"],
  });
  if (!files) return;
  const file = files[0];
  let fileContent = "";
  fs.readFile(file, "utf8", (err, data) => {
    fileContent = data.toString();
  });
  mainWindow.webContents.send("newprojectfile", fileContent);
}

function openProject() {
  console.log("clicked");
}

function saveProject() {
  console.log("clicked");
}

function exportProject() {
  console.log("clicked");
}

ipcMain.on("savecontrolfile", (event, arg) => {
  if (!arg.cfilePath) {
    const cFileName = dialog.showSaveDialogSync(mainWindow, {
      defaultPath: arg.cfilePath,
    });
    if (cFileName)
      fs.writeFile(cFileName, arg.cfileContent, (err) => {
        if (err) console.log(err);
        else {
          mainWindow.webContents.send("controlfilename", cFileName);
        }
      });
  } else {
    fs.writeFile(arg.cfilePath, arg.cfileContent, (err) => {
      if (err) console.log(err);
      else {
        mainWindow.webContents.send("controlfilename", false);
      }
    });
  }
});

ipcMain.on("savecontrolfileas", (event, arg) => {
  const cFileName = dialog.showSaveDialogSync(mainWindow, {
    defaultPath: arg.cfilePath,
  });
  if (cFileName)
    fs.writeFile(cFileName, arg.cfileContent, (err) => {
      if (err) console.log(err);
      else {
        mainWindow.webContents.send("controlfilename", cFileName);
      }
    });
});

// propagate snippet modifications from snippetWindow to mainWindow
ipcMain.on("updatesnippets", (event, arg) => {
  let snp = arg;
  mainWindow.webContents.send("snippets", snp);
});

// save current snippet
ipcMain.on("snpsave", (event, arg) => {
  let snpFileName = "";
  if (!arg.sfpath) {
    snpFileName = dialog.showSaveDialogSync({
      defaultPath: arg.sfpath,
    });
  } else snpFileName = arg.sfpath;
  if (snpFileName)
    fs.writeFile(snpFileName, JSON.stringify(arg.csnippet), (err) => {
      if (err) console.log(err);
      else {
        snippetWindow.webContents.send("snpfilename", snpFileName);
      }
    });
});

// save current snippet as new file
ipcMain.on("snpsaveas", (event, arg) => {
  let snpFileName = dialog.showSaveDialogSync({
    defaultPath: arg.sfpath,
  });
  if (snpFileName)
    fs.writeFile(snpFileName, JSON.stringify(arg.csnippet), (err) => {
      if (err) console.log(err);
      else {
        snippetWindow.webContents.send("snpfilename", snpFileName);
      }
    });
});

// import a snippet -> open a snippet file and pass JSON to snippetconfigurator
ipcMain.on("snpimport", (event) => {
  const snpfileImport = dialog.showOpenDialogSync(mainWindow, {
    title: "Choose a Snippet File",
    properties: ["openFile"],
  });
  if (!snpfileImport) return;
  const file = snpfileImport[0];
  const fileContent = fs.readFileSync(file).toString();
  snippetWindow.webContents.send("opensnpfile", {
    content: fileContent,
    path: file,
  });
});

// export current snippet as control file
ipcMain.on("activate", (event, arg) => {
  let cFileName = "";
  cFileName = dialog.showSaveDialogSync();
  if (cFileName)
    fs.writeFile(cFileName, arg, (err) => {
      if (err) console.log(err);
    });
});

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});
