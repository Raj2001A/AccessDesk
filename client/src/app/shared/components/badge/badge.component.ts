import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="badge"
      [ngClass]="getBadgeClass()"
      [title]="text()"
    >
      {{ text() }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  readonly text = input.required<string>();
  readonly variant = input<'access' | 'role' | 'status'>('access');

  getBadgeClass(): string {
    const val = (this.text() || '').toLowerCase();
    
    // Access levels
    if (val === 'public') return 'badge-public';
    if (val === 'internal') return 'badge-internal';
    if (val === 'confidential') return 'badge-confidential';
    if (val === 'restricted') return 'badge-restricted';

    // Roles
    if (val.includes('admin')) return 'badge-admin';
    if (val.includes('general') || val.includes('user')) return 'badge-user';

    // Statuses
    if (val === 'active' || val === 'true') return 'badge-active';
    if (val === 'inactive' || val === 'false') return 'badge-inactive';

    return 'badge-internal';
  }
}
