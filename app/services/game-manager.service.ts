import { Injectable, ChangeDetectorRef, ApplicationRef } from '@angular/core';

import * as fs from 'fs';
import * as path from 'path';
import * as ElectronConfig from 'electron-config';
import * as Electron from 'electron';
import * as crypto from 'crypto';
import * as PixlFox from '../../pixlfox';
import { PixlFoxClientService } from "./pixlfox.service";
import { exec } from 'child_process';
import * as rimraf from 'rimraf';
import { MdSnackBar } from "@angular/material";
import { ViewPanelService } from "./view-panel.service";

@Injectable()
export class GameManagerService {
    private config = new ElectronConfig();
    public downloads: any = { };

    constructor(private ref: ApplicationRef, private viewPanelService: ViewPanelService, private pixlfoxClient: PixlFoxClientService, private snackBar: MdSnackBar) {
        window["gameManager"] = this;
    }

    public async installOrRunAction(game: PixlFox.GameInfo, action: string) {
        if(!await this.pixlfoxClient.isGameUpToDate(game)) {
            await this.install(game);
        }

        let gameInstallPath = game["installPath"];
        let gameManifest = game["packageManifest"];
        let actionData = gameManifest == null ? null : gameManifest.info.actions[action];
        let gameSession = await this.pixlfoxClient.api.newGameSession(game.id);

        if(actionData != null) {
            this.pixlfoxClient.currentlyPlayingId = game.id;
            this.pixlfoxClient.setAccountStatus(this.pixlfoxClient.accountInfo.status);
            let gameProcess = exec(actionData.executable, { cwd: gameInstallPath, env: Object.assign({ "PIXLFOX_GAME_SESSION": gameSession.gameSessionToken, "PIXLFOX_RPC_ENDPOINT": "http://rpc.pixlfox.net:8850" }, process.env) });
            gameProcess.on("exit", () => {
                this.pixlfoxClient.currentlyPlayingId = null;
                this.pixlfoxClient.setAccountStatus(this.pixlfoxClient.accountInfo.status);
            });
        }
    }

    public uninstall(game: PixlFox.GameInfo) {
        rimraf.sync(game["installPath"]);
        fs.unlinkSync(path.join(game["installPath"], "..", game.id + ".json"));

        game["isInstalled"] = false;
        game["packageManifest"] = null;
    }

    public async install(game: PixlFox.GameInfo) {
        try {
            let installPath = game["installPath"];
            let packageInfo = await this.pixlfoxClient.api.getGamePackageInfo(game.id);
            let existingPackageManifest = game["packageManifest"];
            if(packageInfo.supportedPlatforms != null && packageInfo.supportedPlatforms.indexOf("any") == -1 && packageInfo.supportedPlatforms.indexOf(process.platform) == -1) {
                this.snackBar.open("Platform not supported " + game.name, null, { duration: 3000 });
            }
            else if(packageInfo.version != null && packageInfo.packageUrl != null) {
                let appPackage = new PixlFox.AppPackage();

                await appPackage.open(packageInfo.packageUrl);                

                let snackBarRef = this.snackBar.open("Installing " + game.name, null, { duration: 3000 });
                // snackBarRef.onAction().subscribe(() => {
                //     this.viewPanelService.loadView("default", DownloadsComponent);
                // });

                game["isDownloading"] = true;
                game["downloadingVersion"] = packageInfo.version;
                game["downloadState"] = "Processing";

                let invalidFiles = await appPackage.getInvalidFiles(installPath, existingPackageManifest);

                game["downloadState"] = "Downloading";
                
                // TODO: extract invalid files
                await appPackage.extractFiles(installPath, invalidFiles, null,
                    (p) => {
                        game["downloadProgress"] = p;
                        this.ref.tick();
                    }
                );

                game["downloadState"] = "Processing";
                fs.writeFileSync(path.join(installPath, "..", game.id + ".json"), JSON.stringify(appPackage.manifest));
                game["isDownloading"] = false;
                game["downloadState"] = "Complete";
                this.pixlfoxClient.refreshLocalLibraryData(game);

                if(process.platform == "darwin" || process.platform == "linux") {
                    for(let action in appPackage.manifest.info.actions) {
                        try {
                            fs.chmodSync(path.join(installPath, appPackage.manifest.info.actions[action].executable), 0o0700);
                        }
                        catch(e) { }
                    }
                }
            }
            else {
                game["isDownloading"] = false;
                console.warn("Unable to get package for", game.id);
                this.snackBar.open("Failed to install " + game.name, null, { duration: 3000 });
                // TODO: display popup saying app can't be installed, retry later
            }
        }
        catch(exception) {
            console.warn(exception);
            this.snackBar.open("Failed to install " + game.name, null, { duration: 3000 });
            // TODO: display popup saying app can't be installed, retry later
        }
    }
}