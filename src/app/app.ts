import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import LogIn from './auth/features/log-in/log-in';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('soporte-tecnico');
}
