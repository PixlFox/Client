import { Component, ChangeDetectorRef, Input, EventEmitter, Output, AfterViewInit } from '@angular/core';
import { PixlFoxClientService } from "../services/pixlfox.service";
import * as moment from 'moment';
import * as _ from 'lodash';
import * as jQuery from 'jquery';
import { ViewPanelService } from "../services/view-panel.service";

@Component({
	templateUrl: './app/templates/views/chat.html'
})
export class ChatComponent {
	// public accountId: string = null;
	private previousMessage: any = null;
	private _accountId: string = null;
	private moment = moment;

	public get accountId() {
		return this._accountId;
	}

	public set accountId(accountId: string) {
		if(accountId != null) {
			this._accountId = accountId;
		}

		if(this._accountId == null) {
			let recentChat = this.pixlfoxClient.getRecentChats().firstOrDefault();

			if(recentChat != null && recentChat.from != this.pixlfoxClient.accountInfo.id) {
				this._accountId = recentChat.from;
			}
			else if(recentChat != null && recentChat.to != this.pixlfoxClient.accountInfo.id) {
				this._accountId = recentChat.to;
			}
		}

		this.cd.detectChanges();
		jQuery('.chat-history').scrollTop(jQuery('.chat-history ul').height());
	}

	constructor(public pixlfoxClient: PixlFoxClientService, private viewPanelService: ViewPanelService, private cd: ChangeDetectorRef) {
		
	}

	ngAfterViewInit() {
		
	}

	public markChatMessageRead(chatMessage: any) {
		if(!chatMessage.read) {
			chatMessage.read = true;
			window.localStorage.setItem("chatMessages", JSON.stringify(this.pixlfoxClient.chatMessages));
		}
	}

	public markAllChatMessageRead() {
		
	}

	public sendChatMessage(message: string) {
		this.pixlfoxClient.sendChatMessage(this.accountId, message);
	}

	public setPreviousMessage(chatMessage: any) {
		this.previousMessage = chatMessage;
	}

	public trimMessage(message: string) {
		return _.truncate(message, { length: 40, separator: /,?\.* +/, omission: '...' });
	}

	public viewChat(accountId: string) {
		this.viewPanelService.loadView("default", ChatComponent).accountId = accountId;
	}

	public clearChatMessages(accountId: string) {
		this.pixlfoxClient.chatMessages[accountId] = [];
		window.localStorage.setItem("chatMessages", JSON.stringify(this.pixlfoxClient.chatMessages));
	}
}