import { Directive, ViewContainerRef, ComponentFactoryResolver, Type, Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ViewPanelService } from "./services/view-panel.service";

@Directive({
	selector: 'view-panel',
})
export class ViewPanel implements OnInit, OnDestroy {
	public componentInstance: any;
	@Input() public name: string;

	constructor(private viewPanelService: ViewPanelService, private viewContainerRef: ViewContainerRef, private componentFactoryResolver: ComponentFactoryResolver) {
		
	}

	public loadView<T>(viewType: Type<T>): T {
		if(!this.componentInstance || this.componentInstance instanceof viewType === false) {
			let componentFactory = this.componentFactoryResolver.resolveComponentFactory(viewType);
			this.viewContainerRef.clear();
			this.componentInstance = this.viewContainerRef.createComponent(componentFactory).instance;
		}

		return (<T>this.componentInstance);
	}

	ngOnInit(): void {
		this.viewPanelService.registerViewPanel(this);
		console.log("View panel init:", this.name);
	}

	ngOnDestroy(): void {
		this.viewPanelService.destroyViewPanel(this);
		console.log("View panel destroy:", this.name);
	}
}