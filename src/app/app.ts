import { Component } from '@angular/core';
import { MapPage } from './pages/map-page/map-page';

@Component({
  selector: 'app-root',
  imports: [MapPage],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
}