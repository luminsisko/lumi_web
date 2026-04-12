import { Routes } from '@angular/router';
import { MapPage } from './pages/map-page/map-page';
import { AdminPage } from './pages/admin-page/admin-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'client' },
  { path: 'client', component: MapPage, title: 'Lumi Client' },
  { path: 'admin', component: AdminPage, title: 'Lumi Admin' },
  { path: '**', redirectTo: 'client' }
];
