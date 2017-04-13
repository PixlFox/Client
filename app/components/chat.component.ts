import { Component, ChangeDetectorRef, Input, EventEmitter, Output, AfterViewInit } from '@angular/core';
import { PixlFoxClientService } from "../services/pixlfox.service";
import * as moment from 'moment';

@Component({
	templateUrl: './app/templates/views/chat.html'
})
export class ChatComponent {
	// public accountId: string = null;
	private previousMessage: any = null;
	private _accountId: string = null;

	public get accountId() {
		return this._accountId;
	}

	public set accountId(accountId: string) {
		this._accountId = accountId;
	}

	constructor(public pixlfoxClient: PixlFoxClientService) {
		
	}

	ngAfterViewInit() {
		
	}

	public markChatMessageRead(chatMessage: any) {
		chatMessage.read = true;
	}

	public markAllChatMessageRead() {
		
	}

	public sendChatMessage(message: string) {
		this.pixlfoxClient.sendChatMessage(this.accountId, message);
	}

	public setPreviousMessage(chatMessage: any) {
		this.previousMessage = chatMessage;
	}
}