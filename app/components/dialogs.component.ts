import { MdDialogRef } from "@angular/material";
import { Component } from "@angular/core";
import * as PixlFox from '../../pixlfox';

@Component({
  selector: 'dialog-game-info',
  templateUrl: './app/templates/dialogs/game-info.html',
})
export class GameSessionInfoDialog {
    public account: PixlFox.AccountInfo;

    constructor(private dialogRef: MdDialogRef<GameSessionInfoDialog>) {

    }
}