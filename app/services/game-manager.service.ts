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

@Injectable()
export class GameManagerService {
    private config = new ElectronConfig();
    public downloads: any = { };

    constructor(private ref: ApplicationRef, private pixlfoxClient: PixlFoxClientService) {
        window["gameManager"] = this;
    }

    public async installOrRunAction(game: PixlFox.GameInfo, action: string) {
        if(!await this.pixlfoxClient.isGameUpToDate(game)) {
            await this.install(game);
        }

        let gameInstallPath = game["installPath"];
        let gameManifest = game["packageManifest"];
        let actionData = gameManifest == null ? null : gameManifest.info.actions[action];

        if(actionData != null) {
            this.pixlfoxClient.currentlyPlayingId = game.id;
            this.pixlfoxClient.setAccountStatus(this.pixlfoxClient.accountInfo.status);
            let process = exec(actionData.executable, { cwd: gameInstallPath });
            process.on("exit", () => {
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
            if(packageInfo.version != null && packageInfo.packageUrl != null) {
                let appPackage = new PixlFox.AppPackage();

                await appPackage.open(packageInfo.packageUrl);

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
            }
            else {
                game["isDownloading"] = false;
                console.warn("Unable to get package for", game.id);
                // TODO: display popup saying app can't be installed, retry later
            }
        }
        catch(exception) {
            console.warn(exception);
            // TODO: display popup saying app can't be installed, retry later
        }
    }
}