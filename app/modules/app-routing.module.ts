import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ClientIndexComponent, AuthComponent } from '../pages.component';
import { LibraryComponent } from "../components/library.component";

const appRoutes: Routes = [
  {
    path: 'client-index',
    component: ClientIndexComponent,
  },
  {
    path: 'auth',
    component: AuthComponent,
  },
  { path: '', redirectTo: '/auth', pathMatch: 'full' },
  { path: '**', redirectTo: '/auth' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      appRoutes,
      { }
    )
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }