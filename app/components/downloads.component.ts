import { Component, ChangeDetectorRef } from '@angular/core';
import { PixlFoxClientService } from "../services/pixlfox.service";
import { ClientIndexComponent } from "../pages.component";
import { ViewPanel } from "../view-panel";
import { ViewPanelService } from "../services/view-panel.service";
import { GameViewComponent } from "./game-view.component";

import * as PixlFox from '../../pixlfox';
import Vibrant = require('node-vibrant')
import { GameManagerService } from "../services/game-manager.service";

@Component({
	templateUrl: './app/templates/views/downloads.html'
})
export class DownloadsComponent {
	constructor(private pixlfoxClient: PixlFoxClientService, private gameManager: GameManagerService, private viewPanelService: ViewPanelService) {
		
	}

	public viewGame(gameId: string) {
		let game = this.pixlfoxClient.getLibraryItem(gameId);
		this.viewPanelService.loadView("default", GameViewComponent).game = game;
	}
}