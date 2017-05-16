//import { app, session, nativeImage, BrowserWindow, Tray, Menu } from 'electron';
import * as Electron from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as os from 'os';

let canQuit = false;
let mainWindow: Electron.BrowserWindow;
let tray;

const shouldQuit = Electron.app.makeSingleInstance((commandLine: any, workingDirectory: any) => {
    if(parseArgs(commandLine) === false) {
        return;
    }

	if (mainWindow) {
		if (!mainWindow.isVisible()) mainWindow.show();
		if (mainWindow.isMinimized()) mainWindow.restore()
		mainWindow.focus()
	}
})

function parseArgs(args: string[]) {
    if (shouldQuit || args.indexOf("--quit") != -1) {
        canQuit = true;
        Electron.app.quit();
        return false;
    }
	// if(args.indexOf("--signout") != -1) {
	// 	let pixlfoxSession = session.fromPartition('persist:pixlfox');
		
	// 	if(pixlfoxSession) {
	// 		pixlfoxSession.cookies.remove("pixlfox.sessionToken");
	// 	}

	// 	canQuit = true;
	// 	app.quit()
	// 	return;
	// }

    return true;
}


function createWindow() {
	let icon = "branding/logo_icon_round_512.png";
	if(process.platform == "win32") {
		icon = "branding/logo_icon_round_512.ico";
	}
	else if(process.platform == "darwin") {
		icon = "branding/logo_icon_round_512.icns";
	}

	mainWindow = new Electron.BrowserWindow({ width: 1014, height: 700, minWidth: 800, minHeight: 600, frame: false, transparent: true, icon: icon, show: false });

	mainWindow.on('ready-to-show',function() {
		if((process.platform == "win32" && os.release().startsWith("10"))) {
			var electronVibrancy = require('electron-vibrancy');
			electronVibrancy.SetVibrancy(mainWindow, 1);
		}
		else if(process.platform == "darwin") {
			mainWindow.setVibrancy("dark");
		}
		mainWindow.show();
	});

	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true
	}));

	if (process.argv.indexOf("--dev") != -1) {
		mainWindow.webContents.openDevTools()
	}

	// Emitted when the window is closed.
	mainWindow.on('close', function (event: any) {
		if (!canQuit) {
			event.preventDefault();
			mainWindow.hide();
		}
	});

	mainWindow.on('closed', function() {
		mainWindow = null;
	})
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
Electron.app.on('ready', function() {
    if(parseArgs(process.argv) === false || shouldQuit) {
        canQuit = true;
        Electron.app.quit();
        return;
    }

	if(process.platform == 'win32') {
		Electron.app.setUserTasks([
			{
				program: process.execPath,
				arguments: '"' + __dirname + '" --quit',
				iconPath: process.execPath,
				iconIndex: 0,
				title: 'Quit PixlFox Client',
				description: 'Quits the PixlFox Client.'
			}
		])
	}

	createWindow();

	const contextMenu = Electron.Menu.buildFromTemplate([
			{
				label: 'Show',
				click: function() {
					if (mainWindow) {
						if (!mainWindow.isVisible()) mainWindow.show();
						if (mainWindow.isMinimized()) mainWindow.restore()
						mainWindow.focus()
					}
				}
			},
			{type: 'separator'},
			{
				label: 'Exit',
				click: function() {
					canQuit = true;
					Electron.app.quit();
				}
			}
		]);

	if(process.platform == 'win32') {
		tray = new Electron.Tray(Electron.nativeImage.createFromPath(__dirname + '/branding/logo_icon_round_512.ico'));

		tray.setToolTip('PixlFox Client');
		tray.setContextMenu(contextMenu);
		tray.on("double-click", function() {
			if (mainWindow) {
				if (!mainWindow.isVisible()) mainWindow.show();
				if (mainWindow.isMinimized()) mainWindow.restore()
				mainWindow.focus()
			}
		});
	}
	else if(process.platform == 'darwin') {
		Electron.app.dock.setMenu(contextMenu);
	}
});

Electron.app.on('window-all-closed', function () {
	canQuit = true;
	Electron.app.quit();
});

Electron.app.on('activate', function () {
	if (mainWindow) {
		mainWindow.show();
	}
});