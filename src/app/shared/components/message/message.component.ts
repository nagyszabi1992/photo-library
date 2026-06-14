import { Component, input } from '@angular/core';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss',
})
export class MessageComponent {
  readonly type = input<'info' | 'error'>('info');
  readonly message = input<string | null>(null);
}
