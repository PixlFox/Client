import { Component } from '@angular/core';
import jQuery = require('jquery');
import * as ElectronConfig from 'electron-config';

@Component({
	selector: 'app',
	template: `
    <window-controls></window-controls>
    <router-outlet></router-outlet>
    `
})
export class AppComponent {
	private config = new ElectronConfig();
	private _useDarkTheme: boolean;
	private _useGlassTheme: boolean;

	constructor() {
		this.useDarkTheme = this.config.get("useDarkTheme") || false;
		this.useGlassTheme = this.config.get("useGlassTheme") || false;
	}

	public set useDarkTheme(value: boolean) {
		if (value) {
			jQuery('body').addClass('dark-theme');
		}
		else {
			jQuery('body').removeClass('dark-theme');
		}

		this._useDarkTheme = value;
		this.config.set("useDarkTheme", value);
	}

	public get useGlassTheme(): boolean {
		return this._useGlassTheme;
	}

	public set useGlassTheme(value: boolean) {
		if (value) {
			jQuery('body').addClass('glass');
		}
		else {
			jQuery('body').removeClass('glass');
		}

		this._useGlassTheme = value;
		this.config.set("useGlassTheme", value);
	}

	public get useDarkTheme(): boolean {
		return this._useDarkTheme;
	}

	public set isLoading(value: boolean) {
		if (value) {
			jQuery('.loading').fadeIn();
		}
		else {
			jQuery('.loading').fadeOut();
		}
	}
}
