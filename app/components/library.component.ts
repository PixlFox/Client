import { Component, ChangeDetectorRef } from '@angular/core';
import { PixlFoxClientService } from "../services/pixlfox.service";
import { ClientIndexComponent } from "../pages.component";
import { ViewPanel } from "../view-panel";
import { ViewPanelService } from "../services/view-panel.service";
import { GameViewComponent } from "./game-view.component";

import * as PixlFox from '../../pixlfox';
import Vibrant = require('node-vibrant')
import { GameManagerService } from "../services/game-manager.service";
import electron = require('electron');
import { CommunityComponent } from "./community.component";

@Component({
	templateUrl: './app/templates/views/library.html'
})
export class LibraryComponent {
	constructor(private pixlfoxClient: PixlFoxClientService, private gameManager: GameManagerService, private viewPanelService: ViewPanelService) {
		
	}

	public viewGame(gameId: string) {
		let game = this.pixlfoxClient.getLibraryItem(gameId);
		this.viewPanelService.loadView("default", GameViewComponent).game = game;
	}

	public viewStorePage(gameId: string) {
		this.viewPanelService.loadView("default", CommunityComponent).navigate("https://pixlfox.com/store/games/view/" + gameId);
	}

	public getTileVibrantColor(gameInfo: PixlFox.GameInfo) {
		Vibrant.from(gameInfo.images["tile"]).getPalette((err, palette) => {
			console.log(palette.Vibrant.getHex());
		});
	}

	public openInstallPath(game: PixlFox.GameInfo) {
		electron.shell.showItemInFolder(game["installPath"]);
	}

	public isGameInstalledBound = this.isGameInstalled.bind(this);
	public isGameInstalled(game: PixlFox.GameInfo): boolean {
		return game["isInstalled"] === true;
	}

	public isGameUpToDateBound = this.isGameUpToDate.bind(this);
	public isGameUpToDate(game: PixlFox.GameInfo): boolean {
		return game["isUpToDate"] === true;
	}

	public isGameLaunchableBound = this.isGameLaunchable.bind(this);
	public isGameLaunchable(game: PixlFox.GameInfo): boolean {
		return game["isUpToDate"] && game["isInstalled"];
	}

	public isGameUpdatableBound = this.isGameUpdatable.bind(this);
	public isGameUpdatable(game: PixlFox.GameInfo): boolean {
		return !game["isUpToDate"] && game["isInstalled"];
	}

	public isGameInstallableBound = this.isGameInstallable.bind(this);
	public isGameInstallable(game: PixlFox.GameInfo): boolean {
		return !game["isInstalled"] && !game["isDownloading"] && game['supportedPlatforms'] && game['supportedPlatforms'].indexOf(this.pixlfoxClient.currentPlatform) != -1;
	}

	public isGameSupportedBound = this.isGameSupported.bind(this);
	public isGameSupported(game: PixlFox.GameInfo): boolean {
		return game['supportedPlatforms'] && game['supportedPlatforms'].indexOf(this.pixlfoxClient.currentPlatform) != -1;
	}
}