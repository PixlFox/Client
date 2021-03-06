import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AppComponent } from '../app.component';
import { WindowControlsComponent } from '../components/window-controls.component';
import { AppRoutingModule } from './app-routing.module';
import { ClientIndexComponent, AuthComponent } from "../pages.component";
import { PixlFoxClientService } from "../services/pixlfox.service";
import { OrderBy } from "../order-by";
import { LibraryComponent } from "../components/library.component";
import { ViewPanel } from "../view-panel";
import { CommunityComponent } from "../components/community.component";

import { ContextMenuModule } from 'ngx-contextmenu/bin';
import { GameViewComponent } from "../components/game-view.component";
import { ChatComponent } from "../components/chat.component";
import { ViewPanelService } from "../services/view-panel.service";
import { ViewportModule } from '../../custom_modules/angular2-viewport';
import { MessagePipe } from '../pipes/message.pipe';
import { GameManagerService } from "../services/game-manager.service";
import { SettingsComponent } from "../components/settings.component";

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { MaterialModule } from '@angular/material';
import { DownloadsComponent } from "../components/downloads.component";
import { PixlFoxRPCService } from "../services/pixlfox-rpc.service";
import { GameSessionInfoDialog } from "../components/dialogs.component";

@NgModule({
	imports: [
		BrowserModule,
		FormsModule,
		AppRoutingModule,
		ContextMenuModule,
		ViewportModule,
		BrowserAnimationsModule,
		MaterialModule
	],
	exports: [
		MessagePipe
	],
	declarations: [
		AppComponent,
		WindowControlsComponent,
		OrderBy,
		ViewPanel,
		[ClientIndexComponent, AuthComponent],
		[LibraryComponent, CommunityComponent, GameViewComponent, ChatComponent, DownloadsComponent, SettingsComponent],
		[GameSessionInfoDialog],
		MessagePipe
	],
	providers: [
		ViewPanelService,
		PixlFoxClientService,
		GameManagerService,
		PixlFoxRPCService
	],
	entryComponents: [
		LibraryComponent,
		CommunityComponent,
		GameViewComponent,
		ChatComponent,
		DownloadsComponent,
		SettingsComponent,
		[GameSessionInfoDialog]
	],
	bootstrap: [AppComponent],
	schemas: [
		NO_ERRORS_SCHEMA
	]
})
export class AppModule {
}
