import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-admin-placeholder-page',
  imports: [],
  templateUrl: './admin-placeholder-page.html',
  styleUrl: './admin-placeholder-page.scss'
})
export class AdminPlaceholderPage {
  private route = inject(ActivatedRoute);

  get title(): string {
    return this.route.snapshot.data['title'] ?? 'Admin';
  }
}
