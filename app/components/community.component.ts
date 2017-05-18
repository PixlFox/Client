import { Component, ChangeDetectorRef, Input, EventEmitter, Output, AfterViewInit, OnDestroy } from '@angular/core';
import { PixlFoxClientService } from "../services/pixlfox.service";
const electron = require("electron");

@Component({
	templateUrl: './app/templates/views/community.html'
})
export class CommunityComponent implements AfterViewInit, OnDestroy {
	public webView: any;
	public url: string = "https://pixlfox.com";

	constructor(private pixlfoxClient: PixlFoxClientService) {

	}

	ngAfterViewInit() {
		this.webView = document.querySelector('#community-webview');
		//this.webView.openDevTools();
	}

	ngOnDestroy(): void {
		this.pixlfoxClient.searchQuery = "";
	}

	public navigate(url: string) {
		if(url.startsWith("https://pixlfox.com/@")) {
			this.pixlfoxClient.searchQuery = url.substring(20);
		}
		else {
			this.pixlfoxClient.searchQuery = url;
		}

		if(!this.webView || this.url != url) {
			this.url = url;
		}
		else {
			this.webView.loadURL(url);
		}
	}
}