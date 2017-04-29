import { Component, ChangeDetectorRef } from '@angular/core';
import { PixlFoxClientService } from "../services/pixlfox.service";
import { ClientIndexComponent } from "../pages.component";
import { ViewPanel } from "../view-panel";
import { ViewPanelService } from "../services/view-panel.service";
import { GameViewComponent } from "./game-view.component";
import { AppComponent } from "../app.component";

@Component({
	templateUrl: './app/templates/views/settings.html'
})
export class SettingsComponent {
	constructor(private pixlfoxClient: PixlFoxClientService, private viewPanelService: ViewPanelService, private appComponent: AppComponent) {
		
	}
}