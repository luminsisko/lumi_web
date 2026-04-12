import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LumiApi, PlaceCreateRequest, PlaceRecord } from '../../services/lumi-api';

interface PlaceFormValue {
  name: string;
  city: string;
  area: string;
  category: string;
  place_kind: string;
  description: string;
  latitude: string;
  longitude: string;
  address: string;
  open_time: string;
  close_time: string;
  mood_tags: string;
  weather_tags: string;
  time_of_day_tags: string;
  season_tags: string;
  best_months: string;
}

@Component({
  selector: 'app-admin-places-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-places-page.html',
  styleUrl: './admin-places-page.scss'
})
export class AdminPlacesPage {
  private lumiApi = inject(LumiApi);

  showForm = false;
  isSaving = false;
  saveStatus = '';
  createdPlace: PlaceRecord | null = null;

  form: PlaceFormValue = this.createEmptyForm();

  openForm(): void {
    this.showForm = true;
    this.saveStatus = '';
  }

  cancelForm(): void {
    this.showForm = false;
    this.isSaving = false;
    this.saveStatus = '';
    this.form = this.createEmptyForm();
  }

  savePlace(): void {
    this.isSaving = true;
    this.saveStatus = 'Saving place...';

    let payload: PlaceCreateRequest;

    try {
      payload = this.buildPayload();
    } catch (error) {
      this.isSaving = false;
      this.saveStatus = error instanceof Error ? error.message : 'Invalid form values';
      return;
    }

    this.lumiApi.createPlace(payload).subscribe({
      next: (response) => {
        this.createdPlace = response;
        this.isSaving = false;
        this.saveStatus = `Place saved: ${response.name}`;
        this.showForm = false;
        this.form = this.createEmptyForm();
      },
      error: (error) => {
        this.isSaving = false;
        this.saveStatus = `Save failed: ${error.message}`;
      }
    });
  }

  private buildPayload(): PlaceCreateRequest {
    const latitude = Number.parseFloat(this.form.latitude);
    const longitude = Number.parseFloat(this.form.longitude);

    if (!Number.isFinite(latitude)) {
      throw new Error('Latitude must be a valid number');
    }

    if (!Number.isFinite(longitude)) {
      throw new Error('Longitude must be a valid number');
    }

    return {
      name: this.form.name.trim(),
      city: this.form.city.trim(),
      area: this.form.area.trim(),
      category: this.form.category.trim(),
      place_kind: this.form.place_kind.trim(),
      description: this.form.description.trim(),
      latitude,
      longitude,
      address: this.toNullable(this.form.address),
      open_time: this.toNullable(this.form.open_time),
      close_time: this.toNullable(this.form.close_time),
      mood_tags: this.toNullable(this.form.mood_tags),
      weather_tags: this.toNullable(this.form.weather_tags),
      time_of_day_tags: this.toNullable(this.form.time_of_day_tags),
      season_tags: this.toNullable(this.form.season_tags),
      best_months: this.toNullable(this.form.best_months)
    };
  }

  private toNullable(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private createEmptyForm(): PlaceFormValue {
    return {
      name: '',
      city: '',
      area: '',
      category: '',
      place_kind: '',
      description: '',
      latitude: '',
      longitude: '',
      address: '',
      open_time: '',
      close_time: '',
      mood_tags: '',
      weather_tags: '',
      time_of_day_tags: '',
      season_tags: '',
      best_months: ''
    };
  }
}
