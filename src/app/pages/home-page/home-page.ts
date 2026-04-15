import { Component } from '@angular/core';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss'
})
export class HomePage {
  readonly moods = ['Relaxed', 'Curious', 'Romantic', 'Adventurous', 'Cozy', 'Energetic'];

  selectedMood = '';
  walkingDistanceKm = 2;
  selectedPoint: { xPercent: number; yPercent: number } | null = null;

  onMoodChange(value: string): void {
    this.selectedMood = value;
  }

  onDistanceInput(value: string): void {
    const parsed = Number.parseFloat(value);

    if (!Number.isFinite(parsed)) {
      return;
    }

    this.walkingDistanceKm = parsed;
  }

  onMapClick(event: MouseEvent): void {
    const mapSurface = event.currentTarget;

    if (!(mapSurface instanceof HTMLDivElement)) {
      return;
    }

    const bounds = mapSurface.getBoundingClientRect();
    const xPercent = ((event.clientX - bounds.left) / bounds.width) * 100;
    const yPercent = ((event.clientY - bounds.top) / bounds.height) * 100;

    this.selectedPoint = {
      xPercent: Math.min(100, Math.max(0, xPercent)),
      yPercent: Math.min(100, Math.max(0, yPercent))
    };
  }
}
