const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Enable Web Bluetooth and Web Platform features across Linux and Windows
app.commandLine.appendSwitch('enable-web-bluetooth');
app.commandLine.appendSwitch('enable-experimental-web-platform-features');

const isMac = process.platform === 'darwin';
const isWin = process.platform === 'win32';
const isLinux = process.platform === 'linux';

function createWindow() {
  const windowConfig = {
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0f1117',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, '../public/assets/assets/images/app_icon.png')
  };

  // Modern title bar overlay for Windows/macOS; standard native frame on Linux
  if (isWin || isMac) {
    windowConfig.titleBarStyle = 'hidden';
    windowConfig.titleBarOverlay = {
      color: '#0f1117',
      symbolColor: '#f1f5f9',
      height: 36
    };
  }

  const win = new BrowserWindow(windowConfig);

  // Auto-grant permissions for Web MIDI, Sysex, Web Audio (Mic for Tuner), and Bluetooth
  win.webContents.session.setPermissionCheckHandler((webContents, permission) => {
    return true;
  });

  win.webContents.session.setDevicePermissionHandler(() => {
    return true;
  });

  // Handle Web Bluetooth device selection
  let selectBluetoothCallback = null;
  let selectBluetoothTimeout = null;

  win.webContents.on('select-bluetooth-device', (event, deviceList, callback) => {
    event.preventDefault();
    selectBluetoothCallback = callback;

    if (deviceList && deviceList.length > 0) {
      const match = deviceList.find(d => 
        /pocket|sonic|smart|amp|qme|qbs|amphonix|matribox/i.test(d.deviceName)
      );
      if (match) {
        if (selectBluetoothTimeout) clearTimeout(selectBluetoothTimeout);
        selectBluetoothTimeout = null;
        callback(match.deviceId);
        selectBluetoothCallback = null;
        return;
      }
    }

    // Allow 15 seconds for Bluetooth adapter to discover the peripheral
    if (!selectBluetoothTimeout) {
      selectBluetoothTimeout = setTimeout(() => {
        if (selectBluetoothCallback) {
          const fallback = deviceList && deviceList[0];
          selectBluetoothCallback(fallback ? fallback.deviceId : '');
          selectBluetoothCallback = null;
        }
        selectBluetoothTimeout = null;
      }, 15000);
    }
  });

  const devUrl = 'http://localhost:3000';
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    win.loadURL(devUrl).catch(() => {
      win.loadFile(path.join(__dirname, '../dist/index.html'));
    });
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (!isMac) app.quit();
});
