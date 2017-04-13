import { Component, ChangeDetectorRef, Input, EventEmitter, Output, AfterViewInit } from '@angular/core';
const electron = require("electron");

@Component({
	templateUrl: './app/templates/views/community.html'
})
export class CommunityComponent implements AfterViewInit {
	public webView: any;
	public url: string = "https://pixlfox.com";

	ngAfterViewInit() {
		this.webView = document.querySelector('#community-webview');
	}

	public navigate(url: string) {
		if(!this.webView || this.url != url) {
			this.url = url;
		}
		else {
			this.webView.loadURL(url);
		}
	}
}