import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss'
})
export class AdminLayout {
  readonly sections = [
    { label: 'Dashboard', path: 'dashboard' },
    { label: 'Places', path: 'places' },
    { label: 'Weather Regions', path: 'weather-regions' },
    { label: 'Sources', path: 'sources' },
    { label: 'Jobs', path: 'jobs' },
    { label: 'Logs', path: 'logs' },
    { label: 'Settings', path: 'settings' }
  ];
}
