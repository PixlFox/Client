import { Type, plainToClass } from "class-transformer";
import * as path from 'path';
import * as fs from 'fs';
import * as zlib from 'zlib';
import request = require('request');
import mkdirp = require('mkdirp');
import progressStream = require('progress-stream');

const {BrowserWindow} = require("electron");

const API_ENDPOINT : string = "https://pixlfox.com/api/v2";
const RTC_ENDPOINT : string = "wss://pixlfox.com/api/v2/ws";

export class Api {
    private authToken : string = null;

    constructor(authToken : string) {
        this.authToken = authToken;
    }

    getAccountInfo (accountId: string = "me") {
        return fetch(API_ENDPOINT + "/account/" + accountId, { method: 'GET', headers: new Headers({ "PixlFox-OAuthToken": this.authToken }) })
        .then((response) => response.json())
        .then((response: any) => plainToClass<AccountInfo, object>(AccountInfo, response));
    }

    getFriendsList () {
        return fetch(API_ENDPOINT + "/account/me/friends", { method: 'GET', headers: new Headers({ "PixlFox-OAuthToken": this.authToken }) })
        .then((response) => response.json())
        .then((response: any) => plainToClass<AccountInfo, object[]>(AccountInfo, response));
    }

    getLibrary () {
        return fetch(API_ENDPOINT + "/account/me/library", { method: 'GET', headers: new Headers({ "PixlFox-OAuthToken": this.authToken }) })
        .then((response) => response.json())
        .then((response: any) =>  plainToClass<GameInfo, object[]>(GameInfo, response));
    }

    getGamePackageInfo (gameId: string) {
        return fetch(API_ENDPOINT + "/game/" + gameId + "/package?platform=" + process.platform, { method: 'GET', headers: new Headers({ "PixlFox-OAuthToken": this.authToken }) })
        .then((response) => response.json())
        .then((response: any) => response);
    }

    public search (searchQuery: string) {
        return fetch(API_ENDPOINT + "/search?q=" + searchQuery, { method: 'GET', headers: new Headers({ "PixlFox-OAuthToken": this.authToken }) })
        .then((response) => response.json())
        .then((response: any) => response);
    }
}

export class RTCConnection {
    private authToken: string;
    private socket: WebSocket;
    private registeredPacketHandlers: any = { };
    private pingThreadInterval: NodeJS.Timer = null;
    private pingId: number = 0;

    public onConnected: () => void;
    public onDisconnected: (reason: string) => void;

    constructor(authToken: string) {
        this.authToken = authToken;
    }

    private onClose(reason: string): void {
        this.socket.onmessage = null;
        this.socket.onclose = null;
        this.socket.onerror = null;
        this.socket.onopen = null;
        this.socket = null;
        
        setTimeout(() => this.connect(), 5000);
        console.log('[RTC] Connection to RTC server lost: ' + reason);
    }

    private onMessage(packetData: string): void {
        var packet = JSON.parse(packetData);

        if(packet.type && this.registeredPacketHandlers[packet.type]) {
            this.registeredPacketHandlers[packet.type](packet);
        }
        else {
            console.warn("[RTC] Received unknown packet type:", packet.type);
        }
    }

    private ping(): void {
        if(this.socket.readyState == WebSocket.OPEN) {
            this.pingId++;
            this.send("Ping", { id: this.pingId });
        }
    }

    public connect(): void {
        console.log("[RTC] Connecting to RTC server...");

        if(this.pingThreadInterval != null) {
            clearInterval(this.pingThreadInterval);
            this.pingThreadInterval = null;
        }

        this.socket = new WebSocket(RTC_ENDPOINT + "?token=" + this.authToken);

        this.socket.onopen = (ev) => {
            this.pingThreadInterval = setInterval(() => this.ping(), 30000);
            console.log("[RTC] Connected to RTC server.");

            if(this.onConnected) {
                this.onConnected();
            }
        };

        this.socket.onmessage = (ev) => {
            this.onMessage(ev.data);
        };

        this.socket.onerror = (ev) => {
            setTimeout(() => this.connect(), 5000);
        };

        this.socket.onclose = (ev) => {
            this.onClose(ev.reason);

            if(this.onDisconnected) {
                this.onDisconnected(ev.reason);
            }
        };
    }

    public send(type: string, data: object): void {
        if(this.socket.readyState == WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: type, data: data }));
        }
    }

    public registerPacketHandler(packetType: string, handler: (packet: any) => void): void {
        this.registeredPacketHandlers[packetType] = handler;
    }
}

export class AccountInfo {
    public id: string;
    public username: string;
    public email: string;
    public displayName: string;
    public profileImageUrl: string;
    public status: string;

    public playingGame: GameInfo;

    public get statusSorting() {
        switch(this.status) {
            case "InGame": return "0" + this.displayName;
            case "Online": return "0" + this.displayName;
            case "Away": return "1" + this.displayName;
            case "Offline": return "2" + this.displayName;
            default: return "3" + this.displayName;
        }
    }
}

export class GameInfo {
    public id: string;
    public name: string;
    public description: string;
    public iconImageUrl: string;
    public iconImageSmallUrl: string;
    public images: any;
}

export class AppPackage {
    public manifest: any = null;
    private manifestLength: number = null;
    private packageUrl: string = null;

    public async open(packageUrl: string) {
        this.packageUrl = packageUrl;

        let headerResponse = await fetch(this.packageUrl, { headers: new Headers({"x-ms-range": "bytes=0-3"})});
        this.manifestLength = new Int32Array(await headerResponse.arrayBuffer())[0];

        let manifestResponse = await fetch(this.packageUrl, { headers: new Headers({"x-ms-range": "bytes=4-" + (this.manifestLength + 3)})});
        this.manifest = await manifestResponse.json();

        for(let i = 0; i < this.manifest.files.length; i++) {
            this.manifest.files[i].name = this.manifest.files[i].name.replace(/\\/g, "/");
        }
    }

    public async getInvalidFiles(basePath: string, manifest: any = null) {
        let invalidFiles = [];

        let getFileFromManifest = (fileName: string, _manifest: any) => {
            if(manifest != null) {
                for(let i = 0; i < _manifest.files.length; i++) {
                    let file = _manifest.files[i];

                    if(file.name == fileName) {
                        return file;
                    }
                }
            }

            return null;
        };

        for(let i = 0; i < this.manifest.files.length; i++) {
            let file = this.manifest.files[i];
            let filePath = path.join(basePath, file.name);

            if(fs.existsSync(filePath)) {
                let existingManifestFile = getFileFromManifest(file.name, manifest);
                if(fs.statSync(filePath).size != file.length) {
                    invalidFiles.push(file);
                }
                else if(manifest != null && (existingManifestFile == null || existingManifestFile.hash != file.hash)) {
                    invalidFiles.push(file);
                }
            }   
            else {         
                invalidFiles.push(file);
            }
        }

        return invalidFiles;
    }

    public getFile(fileName: string) {
        for(let i = 0; i < this.manifest.files.length; i++) {
            let file = this.manifest.files[i];

            if(file.name == fileName) {
                return file;
            }
        }

        return null;
    }

    public extractFile(fileName: string, basePath: string = "./", downloadProgress: (p) => void = null, extractProgress: (p) => void = null) {
        return new Promise<void>((resolve, reject) => {
            let file = this.getFile(fileName);
            let filePath = path.join(basePath, fileName);
            let fileBasePath = path.dirname(filePath);

            if(!fs.existsSync(fileBasePath)) {
                mkdirp.sync(fileBasePath);
            }

            let downloadProgressStream = progressStream({ length: file.compressedLength, time: 100});
            let extractProgressStream = progressStream({ length: file.length, time: 100});
            if(downloadProgress){
                downloadProgressStream.on('progress', downloadProgress);
            }
            if(extractProgress){
                extractProgressStream.on('progress', extractProgress);
            }

            request({
                headers: {
                    "x-ms-range": "bytes=" + (this.manifestLength + 4 + file.offset) + "-" + ((this.manifestLength + 4 + file.offset) + (file.compressedLength - 1))
                },
                uri: this.packageUrl,
                medhod: 'GET'
            })
            .pipe(downloadProgressStream)
            .pipe(zlib.createGunzip())
            .pipe(extractProgressStream)
            .pipe(fs.createWriteStream(filePath))
            .on("finish", () => resolve());
        });
        
        // let fileDataResponse = await fetch(this.packageUrl, { headers: new Headers({"x-ms-range": "bytes=" + (this.manifestLength + 4 + file.Offset) + "-" + ((this.manifestLength + 4 + file.Offset) + (file.CompressedLength - 1))})});
        // fileDataBuffer.pipe(zlib.createGunzip()).pipe(fs.createWriteStream("./test.data"));
    }

    public async extractFiles(basePath: string = "./", files: any, downloadProgress: (p) => void = null, extractProgress: (p) => void = null) {
        let totalDownloadSize = 0;
        let totalExtractSize = 0;

        let currentDownloadOffset = 0;
        let currentExtractOffset = 0;

        for(let i = 0; i < files.length; i++) {
            let file = files[i];

            totalDownloadSize += file.compressedLength;
            totalExtractSize += file.length;
        }

        for(let i = 0; i < files.length; i++) {
            let file = files[i];

            await this.extractFile(file.name, basePath,
            (p) => {
                if(downloadProgress) {
                    downloadProgress(((currentDownloadOffset + p.transferred) / totalDownloadSize) * 100);
                }
            },
            (p) => {
                if(extractProgress) {
                    extractProgress(((currentExtractOffset + p.transferred) / totalExtractSize) * 100);
                }
            });

            currentDownloadOffset += file.compressedLength;
            currentExtractOffset += file.length;
        }
    }

    public async extractAllFiles(basePath: string = "./", downloadProgress: (p) => void = null, extractProgress: (p) => void = null) {
        let totalDownloadSize = 0;
        let totalExtractSize = 0;

        let currentDownloadOffset = 0;
        let currentExtractOffset = 0;

        for(let i = 0; i < this.manifest.files.length; i++) {
            let file = this.manifest.files[i];

            totalDownloadSize += file.compressedLength;
            totalExtractSize += file.length;
        }

        for(let i = 0; i < this.manifest.files.length; i++) {
            let file = this.manifest.files[i];

            await this.extractFile(file.name, basePath,
            (p) => {
                if(downloadProgress) {
                    downloadProgress(((currentDownloadOffset + p.transferred) / totalDownloadSize) * 100);
                }
            },
            (p) => {
                if(extractProgress) {
                    extractProgress(((currentExtractOffset + p.transferred) / totalExtractSize) * 100);
                }
            });

            currentDownloadOffset += file.compressedLength;
            currentExtractOffset += file.length;
        }
    }
}