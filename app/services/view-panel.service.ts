import { Injectable, Type } from '@angular/core';
import * as PixlFox from '../../pixlfox';
import { ViewPanel } from "../view-panel";
import { GameViewComponent } from "../components/game-view.component";

@Injectable()
export class ViewPanelService {
    private viewPanels: any = { };

    public registerViewPanel(viewPanel: ViewPanel) {
        this.viewPanels[viewPanel.name] = viewPanel;
    }

    public destroyViewPanel(viewPanel: ViewPanel) {
        this.viewPanels[viewPanel.name] = undefined;
    }

    public loadView<T>(viewPanelName: string, viewType: Type<T>): T {
		let viewPanel: ViewPanel = this.viewPanels[viewPanelName];

        if(viewPanel) {
            return viewPanel.loadView(viewType);
        }

        return null;
	}
}