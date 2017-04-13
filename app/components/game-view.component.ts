import { Component, ChangeDetectorRef } from '@angular/core';
import { PixlFoxClientService } from "../services/pixlfox.service";
import * as PixlFox from "../../pixlfox";
import { ViewPanelService } from "../services/view-panel.service";

@Component({
	templateUrl: './app/templates/views/game-view.html'
})
export class GameViewComponent {
	public game: PixlFox.GameInfo = null;

	constructor(private pixlfoxClient: PixlFoxClientService) {
		
	}

	
}