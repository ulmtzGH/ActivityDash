
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-primary-600 dark:text-primary-400">ActivityDash</h1>
          <p class="mt-2 text-gray-500 dark:text-gray-400">Inicia sesión para acceder al panel</p>
        </div>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <div>
            <label for="email" class="text-sm font-medium text-gray-700 dark:text-gray-300">Correo Electrónico</label>
            <input 
              id="email" 
              type="email" 
              formControlName="email" 
              class="w-full px-4 py-2 mt-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="tu@example.com">
          </div>

          <div>
            <label for="password" class="text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
            <input 
              id="password" 
              type="password" 
              formControlName="password" 
              class="w-full px-4 py-2 mt-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="••••••••">
          </div>

          @if (errorMessage()) {
            <div class="px-4 py-2 text-sm text-center text-red-800 bg-red-100 rounded-md dark:bg-red-900/30 dark:text-red-300">
              {{ errorMessage() }}
            </div>
          }

          <div>
            <button 
              type="submit" 
              [disabled]="loginForm.invalid"
              class="w-full px-4 py-2 font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed">
              Iniciar Sesión
            </button>
          </div>
        </form>

        <p class="mt-4 text-sm text-center text-gray-600 dark:text-gray-400">
          ¿No tienes una cuenta? 
          <a routerLink="/register" class="font-medium text-primary-600 hover:underline dark:text-primary-400">Regístrate</a>
        </p>

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private authService = inject(AuthService);

  loginForm = new FormGroup({
    email: new FormControl('', { validators: [Validators.required, Validators.email], nonNullable: true }),
    password: new FormControl('', { validators: [Validators.required], nonNullable: true }),
  });

  errorMessage = signal<string | null>(null);

  async onSubmit() {
    this.errorMessage.set(null);
    if (this.loginForm.invalid) {
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    const success = await this.authService.login(email, password);

    if (!success) {
      this.errorMessage.set('Correo electrónico o contraseña incorrectos.');
      this.loginForm.get('password')?.reset();
    }
  }
}
