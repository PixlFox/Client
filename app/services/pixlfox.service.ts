
import { Injectable } from '@angular/core';
import * as PixlFox from '../../pixlfox';
import { ViewPanel } from "../view-panel";
import { GameViewComponent } from "../components/game-view.component";
import * as moment from 'moment';
import * as ElectronConfig from 'electron-config';
import { GameManagerService } from "./game-manager.service";
import * as enumerable from 'linq';

import * as fs from 'fs';
import * as path from 'path';
import * as Electron from 'electron';

@Injectable()
export class PixlFoxClientService {
    private _authToken: string = null;
    private dataPath: string = null;
    private config = new ElectronConfig();

    public api: PixlFox.Api = null;
    public rtc: PixlFox.RTCConnection = null;
    public libraryPath: string = path.join(Electron.remote.app.getPath("userData"), "library");

    public searchQuery: string = "";
    public searchExpanded: boolean = false;
    public searchResults = [];

    public get currentPlatform(): string {
        return process.platform;
    }

    public accounts: any = { };

    private accountId: string = null;
    public get accountInfo(): PixlFox.AccountInfo {
        return this.accounts[this.accountId];
    }

    private friendIds: string[] = new Array<string>();
    public get friends(): PixlFox.AccountInfo[] {
        let friends = new Array<PixlFox.AccountInfo>();

        this.friendIds.forEach(friendId => {
            friends.push(this.accounts[friendId]);
        });

        return friends;
    }

    public get accountsEnum() {
        let accounts = new Array<PixlFox.AccountInfo>();

        this.friendIds.forEach(friendId => {
            accounts.push(this.accounts[friendId]);
        });

        accounts.push(this.accountInfo);

        return enumerable.from(accounts);
    }

    public get friendsEnum() {
        return enumerable.from(this.friends);
    }
    // public accountInfo: PixlFox.AccountInfo = null;
    // public friends: PixlFox.AccountInfo[] = null;

    public library: PixlFox.GameInfo[] = null;

    public get libraryEnum() {
        return enumerable.from(this.library);
    }

    public chatMessages: any = window.localStorage.getItem("chatMessages") ? JSON.parse(window.localStorage.getItem("chatMessages")) : { };

    public currentlyPlayingId: string = null;

    public get authToken() {
        return this._authToken;
    }

    public set authToken(value) {
        this._authToken = value;
        this.api = new PixlFox.Api(this._authToken);
        this.rtc = new PixlFox.RTCConnection(this._authToken);

        this.rtc.registerPacketHandler("Pong", (packet) => this.onReceivedPong(packet));
        this.rtc.registerPacketHandler("AccountChanged", (packet) => this.onAccountChanged(packet));
        this.rtc.registerPacketHandler("ChatMessage", (packet) => this.onReceivedChatMessage(packet));
    }
    
    public constructor() {
        console.log('%c WARNING', 'color: red; font-size: 42px; font-weight: bold;');
        console.log('%c Pasting anything in here could give attackers access to your account. Unlesss you know what you\'re doing, close this window.', 'color: red; font-size: 16px;');
    }

    public init() {
        return Promise.all([
            this.api.getAccountInfo(),
            this.api.getFriendsList(),
            this.api.getLibrary()
        ]).then((values) => {
            this.accounts[values[0].id] = values[0];
            this.accountId = values[0].id;

            values[1].forEach(friend => {
                this.accounts[friend.id] = friend;
                this.friendIds.push(friend.id);
                if(!this.chatMessages[friend.id]) {
                    this.chatMessages[friend.id] = [];
                }
            });

            this.library = values[2];

            this.refreshAllLocalLibraryData();
        });
    }

    public fetchAccountInfo(accountId: string) {
        return this.api.getAccountInfo(accountId).then((accountInfo) => {
            this.updateAccountInfo(accountInfo);
        });
    }

    public fetchFriendsList() {
        return this.api.getFriendsList().then((friends) => {
            friends.forEach(friend => {
                this.updateAccountInfo(friend);
            });
        });
    }

    public fetchLibrary() {
        return this.api.getLibrary().then((library) => {
            this.library = library;
            this.refreshAllLocalLibraryData();
        });
    }

    public search(searchQuery: string) {
        this.api.search(searchQuery).then((results) => {
            this.searchResults = results;
        })
    }

    public setAccountStatus(status: string) {
        this.rtc.send("SetAccountStatus", { status: status, currentlyPlayingId: this.currentlyPlayingId });
    }

    public updateAccountInfo(accountInfo: PixlFox.AccountInfo) {
        this.accounts[accountInfo.id] = accountInfo;
    }

    private getFriendIndex(id: string): number {
        for(var i = 0; i < this.friends.length; i++) {
            var friend = this.friends[i];
            if(friend.id == id) {
                return i;
            }
        }

        return -1;
    }

    public getUnreadChatMessages(accountId: string): any[] {
        let unreadChatMessages: any[] = [];

        for(let i = 0; i < this.chatMessages[accountId].length; i++) {
            let chatMessage = this.chatMessages[accountId][i];
            if(!chatMessage.read) {
                unreadChatMessages.push(chatMessage);
            }
        }

        return unreadChatMessages;
    }

    public getRecentChats() {
        let recentChats = [];

        for(let i = 0; i < this.friends.length; i++) {
            let friend = this.friends[i];
            let messages = enumerable.from(this.chatMessages[friend.id]).orderByDescending((e: any) => e.time);

            if(messages != null && messages.count() > 0) {
                recentChats.push(messages.first());
            }
        }

        return enumerable.from(recentChats).orderByDescending((e: any) => e.time);
    }

    private onReceivedPong(packet: any) {
        
    }

    private onAccountChanged(packet: any) {
        this.fetchAccountInfo(packet.data.accountId);
    }

    private onReceivedChatMessage(packet: any) {
        packet.data.time = moment().valueOf();
        if(packet.data.from == this.accountId) {
            packet.data.read = true;
            this.chatMessages[packet.data.to].push(packet.data);
        }
        else {
            packet.data.read = false;
            this.chatMessages[packet.data.from].push(packet.data);
        }

        window.localStorage.setItem("chatMessages", JSON.stringify(this.chatMessages));
    }

    public sendChatMessage(accountId: string, message: string) {
        message = message.trim();

        if(message) {
            this.rtc.send("ChatMessage", {
                from: this.accountInfo.id,
                to: accountId,
                message: message
            });
        }
    }

    public getAccountInfo(accountId: string): PixlFox.AccountInfo {
        return this.accounts[accountId];
    }

    public getLibraryItem(gameId: string): PixlFox.GameInfo {
        for(let i = 0; i < this.library.length; i++) {
            let libraryItem = this.library[i];

            if(libraryItem.id == gameId) {
                return libraryItem;
            }
        }

        return null;
    }

    public refreshAllLocalLibraryData() {
        this.library.forEach(game => {
            this.refreshLocalLibraryData(game);
        });
    }

    public refreshLocalLibraryData(game: PixlFox.GameInfo) {
        game["isInstalled"] = this.isGameInstalled(game.id);
        game["isUpToDate"] = true;
        game["installPath"] = path.join(this.libraryPath, game.id);
        game["packageManifest"] = this.getLocalPackageManifest(game.id);
        this.isGameUpToDate(game).then((isUpToDate) => {
            game["isUpToDate"] = isUpToDate;
        })
        this.api.getGamePackageInfo(game.id).then((packageInfo) => {
            game["supportedPlatforms"] = packageInfo.supportedPlatforms;
        })
    }

    public isGameInstalled(gameId: string): boolean {
        return fs.existsSync(path.join(this.libraryPath, gameId + ".json"));
    }

    public getLocalPackageManifest(gameId: string) {
        let gameInstallPath = path.join(this.libraryPath, gameId);

        if(this.isGameInstalled(gameId)) {
            return JSON.parse(fs.readFileSync(path.join(gameInstallPath, "..", gameId + ".json"), "UTF8"));
        }

        return null;
    }

    public async isGameUpToDate(game: PixlFox.GameInfo): Promise<boolean> {
        if(game["isInstalled"]) {
            let remotePackageInfo = await this.api.getGamePackageInfo(game.id);
            let localPackageManifest = game["packageManifest"];

            if(remotePackageInfo.version != null && localPackageManifest != null){
                return remotePackageInfo.version == localPackageManifest.info.version;
            }
        }

        return true;
    }
}