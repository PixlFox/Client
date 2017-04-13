import { Type, plainToClass } from "class-transformer";

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
        setTimeout(() => this.connect(), 30000);
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
            setTimeout(() => this.connect(), 30000);
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