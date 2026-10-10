import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="skeleton"
      [style.width]="width()"
      [style.height]="height()"
      [style.borderRadius]="borderRadius()"
    ></div>
  `,
  styles: [`
    :host {
      display: inline-block;
      width: 100%;
    }
    .skeleton {
      display: block;
      width: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  readonly width = input<string>('100%');
  readonly height = input<string>('20px');
  readonly borderRadius = input<string>('var(--radius-sm)');
}
