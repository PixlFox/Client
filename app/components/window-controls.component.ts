import { Component, ChangeDetectorRef } from '@angular/core';
const electron = require("electron");

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
        
        this.window.on("maximize", () => {
            this.isWindowMaximized = true;
            cd.detectChanges();
        });
        this.window.on("unmaximize", () => {
            this.isWindowMaximized = false;
            cd.detectChanges();
        });
    }

    closeWindow() {
        this.window.hide();
    }

    maximizeWindow() {
        this.window.maximize();
    }

    restoreWindow() {
        this.window.unmaximize();
    }

    minimizeWindow() {
        this.window.minimize();
    }

}