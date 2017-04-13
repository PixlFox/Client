
import { Injectable } from '@angular/core';
import * as PixlFox from '../../pixlfox';
import { ViewPanel } from "../view-panel";
import { GameViewComponent } from "../components/game-view.component";
import * as moment from 'moment';
import * as ElectronConfig from 'electron-config';

@Injectable()
export class PixlFoxClientService {
    private _authToken: string = null;
    private dataPath: string = null;
    private config = new ElectronConfig();

    public api: PixlFox.Api = null;
    public rtc: PixlFox.RTCConnection = null;

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
    // public accountInfo: PixlFox.AccountInfo = null;
    // public friends: PixlFox.AccountInfo[] = null;

    public library: PixlFox.GameInfo[] = null;
    public chatMessages: any = { };//window.localStorage.getItem("chatMessages") ? JSON.parse(window.localStorage.getItem("chatMessages")) : { };

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
        });
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

    private onReceivedPong(packet: any) {
        
    }

    private onAccountChanged(packet: any) {
        this.fetchAccountInfo(packet.data.accountId);
    }

    private onReceivedChatMessage(packet: any) {
        packet.data.moment = moment();
        if(packet.data.from == this.accountId) {
            this.chatMessages[packet.data.to].push(packet.data);
        }
        else {
            packet.data.read = false;
            this.chatMessages[packet.data.from].push(packet.data);
        }

        //window.localStorage.setItem("chatMessages", JSON.stringify(this.chatMessages));
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
}