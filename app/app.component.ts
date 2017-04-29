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

  constructor() {
    this.useDarkTheme = this.config.get("useDarkTheme") || false;
  }

  public set useDarkTheme(value: boolean) {
    if(value) {
      jQuery('body').addClass('dark-theme');
    }
    else {
      jQuery('body').removeClass('dark-theme');
    }

    this._useDarkTheme = value;
    this.config.set("useDarkTheme", value);
  }

  public get useDarkTheme(): boolean {
    return this._useDarkTheme;
  }

  public set isLoading(value: boolean) {
    if(value) {
      jQuery('.loading').fadeIn();
    }
    else {
      jQuery('.loading').fadeOut();
    }
  }
}
