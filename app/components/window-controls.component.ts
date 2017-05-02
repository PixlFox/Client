import { Component, ChangeDetectorRef } from '@angular/core';
import * as electron from 'electron';
import jQuery = require("jquery");

@Component({
  selector: 'window-controls',
  template: `
    <div class="titlebar">
      <button (click)="closeWindow()" class="window-action window-action-close"><i class="mdi mdi-window-close"></i></button>
      <button (click)="maximizeWindow()" *ngIf="!isWindowMaximized" class="window-action"><i class="mdi mdi-window-maximize"></i></button>
      <button (click)="restoreWindow()" *ngIf="isWindowMaximized" class="window-action"><i class="mdi mdi-window-restore"></i></button>
      <button (click)="minimizeWindow()" class="window-action"><i class="mdi mdi-window-minimize"></i></button>
    </div>
  `
})
export class WindowControlsComponent {
    isWindowMaximized : boolean = false;
    window : any = null;

    constructor(private cd: ChangeDetectorRef) {
        var self = this;
        this.window = electron.remote.getCurrentWindow();
        
        if(process.platform == "darwin") {
            this.window.on("enter-full-screen", () => {
                this.isWindowMaximized = true;
                cd.detectChanges();
                jQuery('html').addClass('maximized');
                if(process.platform == "win32") {
                    jQuery('html').addClass("padded");
                }
            });
            this.window.on("leave-full-screen", () => {
                this.isWindowMaximized = false;
                cd.detectChanges();
                jQuery('html').removeClass('maximized');
                if(process.platform == "win32") {
                    jQuery('html').removeClass("padded");
                }
            });
        }
        else {
            this.window.on("maximize", () => {
                this.isWindowMaximized = true;
                cd.detectChanges();
                jQuery('html').addClass('maximized');
                if(process.platform == "win32") {
                    jQuery('html').addClass("padded");
                }
            });
            this.window.on("unmaximize", () => {
                this.isWindowMaximized = false;
                cd.detectChanges();
                jQuery('html').removeClass('maximized');
                if(process.platform == "win32") {
                    jQuery('html').removeClass("padded");
                }
            });
        }
    }

    closeWindow() {
        this.window.hide();
    }

    maximizeWindow() {
        if(process.platform == "darwin") {
            this.window.setFullScreen(true);
        }
        else {
            this.window.maximize();
        }
    }

    restoreWindow() {
        if(process.platform == "darwin") {
            this.window.setFullScreen(false);
        }
        else {
            this.window.unmaximize();
        }
    }

    minimizeWindow() {
        this.window.minimize();
    }

}