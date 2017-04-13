import { Component, OnInit, Input, ElementRef, ViewChild, AfterViewInit, ComponentFactoryResolver } from '@angular/core';
import { Router } from '@angular/router';
import { PixlFoxClientService } from "./services/pixlfox.service";
import { AppComponent } from "./app.component";
import { AccountInfo } from '../pixlfox';
import { ViewPanel } from "./view-panel";
import { CommunityComponent } from "./components/community.component";
import { LibraryComponent } from "./components/library.component";
import { ContextMenuService } from "angular2-contextmenu/angular2-contextmenu";
import { GameViewComponent } from "./components/game-view.component";
import { ChatComponent } from "./components/chat.component";
import { ViewPanelService } from "./services/view-panel.service";

@Component({
	templateUrl: './app/templates/pages/client-index.html'
})
export class ClientIndexComponent implements AfterViewInit {
	constructor(private router: Router, public pixlfoxClient: PixlFoxClientService, private app: AppComponent, private componentFactoryResolver: ComponentFactoryResolver, private contextMenuService: ContextMenuService, private viewPanelService: ViewPanelService) {
		this.app.isLoading = true;

		window["pixlfoxClient"] = pixlfoxClient;

		pixlfoxClient.rtc.onConnected = () => {
			this.app.isLoading = false;
			this.pixlfoxClient.setAccountStatus("Online");
		}

		pixlfoxClient.rtc.onDisconnected = (reason) => {
			this.app.isLoading = true;
		}

		pixlfoxClient.init().then(() => {
			pixlfoxClient.rtc.connect();
		}).catch((ev) => {
			console.error(ev);	
		});
	}

	ngAfterViewInit(): void {
		this.viewPanelService.loadView("default", LibraryComponent);
	}

	public viewProfile(accountId: string) {
		this.viewPanelService.loadView("default", CommunityComponent).navigate("https://pixlfox.com/account/profile/" + accountId);
	}

	public viewChat(accountId: string) {
		this.viewPanelService.loadView("default", ChatComponent).accountId = accountId;
	}

	public viewLibrary() {
		this.viewPanelService.loadView("default", LibraryComponent);
	}

	public viewGame(gameId: string) {
		let game = this.pixlfoxClient.getLibraryItem(gameId);
		let viewInstance = this.viewPanelService.loadView("default", GameViewComponent);
        viewInstance.game = game;
	}

	public log(message: any) {
		console.log(message);
	}
}

@Component({
	templateUrl: './app/templates/pages/auth.html'
})
export class AuthComponent implements OnInit {
	ngOnInit(): void {
		var authWebView = document.querySelector("#auth-webview");

		authWebView.addEventListener('close', () => {
			window.close();
		});
			
		authWebView.addEventListener("load-commit", (event:any) => {
			if(event.isMainFrame) {
				var url: any = new URL(event.url);

				console.log("AuthURL: ", url );

				if(url.host == "pixlfox.com" && url.pathname == "/client/auth") {
					if(url.searchParams.get("state") == "cancelled") {
						window.close();
					}
					else if(url.searchParams.get("state") == "complete") {
						this.app.isLoading = true;
						var authToken = url.searchParams.get("token");
						this.pixlfoxClient.authToken = authToken;
						this.router.navigate(["/client-index"]);
					}
				}
			}
		});
	}

	constructor(private router: Router, private pixlfoxClient: PixlFoxClientService, private app: AppComponent) {

	}
}