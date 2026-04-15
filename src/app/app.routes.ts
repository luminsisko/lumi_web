import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home-page/home-page').then((module) => module.HomePage),
    title: 'Lumi Home'
  },
  {
    path: 'client',
    loadComponent: () =>
      import('./layouts/client-layout/client-layout').then(
        (module) => module.ClientLayout
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/map-page/map-page').then((module) => module.MapPage),
        title: 'Lumi Client'
      }
    ]
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout').then(
        (module) => module.AdminLayout
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/admin-placeholder-page/admin-placeholder-page').then(
            (module) => module.AdminPlaceholderPage
          ),
        title: 'Admin Dashboard',
        data: { title: 'Dashboard' }
      },
      {
        path: 'places',
        loadComponent: () =>
          import('./pages/admin-places-page/admin-places-page').then(
            (module) => module.AdminPlacesPage
          ),
        title: 'Admin Places',
        data: { title: 'Places' }
      },
      {
        path: 'weather-regions',
        loadComponent: () =>
          import('./pages/admin-placeholder-page/admin-placeholder-page').then(
            (module) => module.AdminPlaceholderPage
          ),
        title: 'Admin Weather Regions',
        data: { title: 'Weather Regions' }
      },
      {
        path: 'sources',
        loadComponent: () =>
          import('./pages/admin-placeholder-page/admin-placeholder-page').then(
            (module) => module.AdminPlaceholderPage
          ),
        title: 'Admin Sources',
        data: { title: 'Sources' }
      },
      {
        path: 'jobs',
        loadComponent: () =>
          import('./pages/admin-placeholder-page/admin-placeholder-page').then(
            (module) => module.AdminPlaceholderPage
          ),
        title: 'Admin Jobs',
        data: { title: 'Jobs' }
      },
      {
        path: 'logs',
        loadComponent: () =>
          import('./pages/admin-placeholder-page/admin-placeholder-page').then(
            (module) => module.AdminPlaceholderPage
          ),
        title: 'Admin Logs',
        data: { title: 'Logs' }
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/admin-placeholder-page/admin-placeholder-page').then(
            (module) => module.AdminPlaceholderPage
          ),
        title: 'Admin Settings',
        data: { title: 'Settings' }
      }
    ]
  },
  { path: '**', redirectTo: 'home' }
];
