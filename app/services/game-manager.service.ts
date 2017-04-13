import { Injectable } from '@angular/core';

import * as fs from 'fs';
import * as path from 'path';
import * as ElectronConfig from 'electron-config';
import * as Electron from 'electron';

@Injectable()
export class GameManagerService {
    private config = new ElectronConfig();

    private get libraryPaths(): string[] {
        return this.config.get("libraryPaths");
    }

    private set libraryPaths(value: string[]) {
        this.config.set("libraryPaths", value);
    }

    constructor() {
        if(!this.libraryPaths) {
            this.addLibraryPath(path.join(Electron.remote.app.getPath("userData"), "library"));
        }
    }

    public addLibraryPath(path: string) {
        let libraryPaths = this.libraryPaths || [];

        if(!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }

        libraryPaths.push(path);
        this.libraryPaths = libraryPaths;
    }
}