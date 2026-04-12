import { Routes } from '@angular/router';
import { ClientLayout } from './layouts/client-layout/client-layout';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { MapPage } from './pages/map-page/map-page';
import { AdminPlaceholderPage } from './pages/admin-placeholder-page/admin-placeholder-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'client' },
  {
    path: 'client',
    component: ClientLayout,
    children: [{ path: '', component: MapPage, title: 'Lumi Client' }]
  },
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        component: AdminPlaceholderPage,
        title: 'Admin Dashboard',
        data: { title: 'Dashboard' }
      },
      {
        path: 'places',
        component: AdminPlaceholderPage,
        title: 'Admin Places',
        data: { title: 'Places' }
      },
      {
        path: 'weather-regions',
        component: AdminPlaceholderPage,
        title: 'Admin Weather Regions',
        data: { title: 'Weather Regions' }
      },
      {
        path: 'sources',
        component: AdminPlaceholderPage,
        title: 'Admin Sources',
        data: { title: 'Sources' }
      },
      {
        path: 'jobs',
        component: AdminPlaceholderPage,
        title: 'Admin Jobs',
        data: { title: 'Jobs' }
      },
      {
        path: 'logs',
        component: AdminPlaceholderPage,
        title: 'Admin Logs',
        data: { title: 'Logs' }
      },
      {
        path: 'settings',
        component: AdminPlaceholderPage,
        title: 'Admin Settings',
        data: { title: 'Settings' }
      }
    ]
  },
  { path: '**', redirectTo: 'client' }
];
