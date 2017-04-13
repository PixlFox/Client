import { Component, ChangeDetectorRef } from '@angular/core';
import { PixlFoxClientService } from "../services/pixlfox.service";
import { ClientIndexComponent } from "../pages.component";
import { ViewPanel } from "../view-panel";
import { ViewPanelService } from "../services/view-panel.service";
import { GameViewComponent } from "./game-view.component";
const electron = require("electron");

@Component({
	templateUrl: './app/templates/views/library.html'
})
export class LibraryComponent {
	constructor(private pixlfoxClient: PixlFoxClientService, private viewPanelService: ViewPanelService) {
		
	}

	public viewGame(gameId: string) {
		let game = this.pixlfoxClient.getLibraryItem(gameId);
		this.viewPanelService.loadView("default", GameViewComponent).game = game;
	}
}