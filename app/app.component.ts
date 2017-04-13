import { Component } from '@angular/core';

@Component({
  selector: 'app',
  template: `
    <window-controls></window-controls>
    <router-outlet></router-outlet>
    <div class="loading" *ngIf="isLoading">Loading...</div>
  `
})
export class AppComponent {
    public isLoading: boolean = false;
}
