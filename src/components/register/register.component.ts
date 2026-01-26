
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-primary-600 dark:text-primary-400">Crear Cuenta</h1>
          <p class="mt-2 text-gray-500 dark:text-gray-400">Únete a ActivityDash</p>
        </div>
        
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label for="name" class="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo</label>
            <input 
              id="name" 
              type="text" 
              formControlName="name" 
              class="w-full px-4 py-2 mt-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Alicia Johnson">
            @if (registerForm.get('name')?.invalid && registerForm.get('name')?.touched) {
              <p class="text-xs text-red-500 mt-1">El nombre completo es requerido.</p>
            }
          </div>
          <div>
            <label for="email" class="text-sm font-medium text-gray-700 dark:text-gray-300">Correo Electrónico</label>
            <input 
              id="email" 
              type="email" 
              formControlName="email" 
              class="w-full px-4 py-2 mt-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="tu@example.com">
            @if (registerForm.get('email')?.invalid && registerForm.get('email')?.touched) {
              <p class="text-xs text-red-500 mt-1">
                @if (registerForm.get('email')?.hasError('required')) {
                  El correo electrónico es requerido.
                } @else if (registerForm.get('email')?.hasError('email')) {
                  El formato del correo no es válido.
                }
              </p>
            }
          </div>
          <div>
            <label for="password" class="text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
            <input 
              id="password" 
              type="password" 
              formControlName="password" 
              class="w-full px-4 py-2 mt-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="••••••••">
            @if (registerForm.get('password')?.invalid && registerForm.get('password')?.touched) {
              <p class="text-xs text-red-500 mt-1">
                @if (registerForm.get('password')?.hasError('required')) {
                  La contraseña es requerida.
                } @else if (registerForm.get('password')?.hasError('minlength')) {
                  La contraseña debe tener al menos 6 caracteres.
                }
              </p>
            }
          </div>

          @if (errorMessage()) {
            <div class="px-4 py-2 text-sm text-center text-red-800 bg-red-100 rounded-md dark:bg-red-900/30 dark:text-red-300">
              {{ errorMessage() }}
            </div>
          }

          <div class="pt-2">
            <button 
              type="submit" 
              [disabled]="registerForm.invalid"
              class="w-full px-4 py-2 font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed">
              Registrarse
            </button>
          </div>
        </form>
         <p class="mt-4 text-sm text-center text-gray-600 dark:text-gray-400">
            ¿Ya tienes una cuenta? 
            <a routerLink="/login" class="font-medium text-primary-600 hover:underline dark:text-primary-400">Inicia sesión</a>
        </p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private authService = inject(AuthService);

  registerForm = new FormGroup({
    name: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    email: new FormControl('', { validators: [Validators.required, Validators.email], nonNullable: true }),
    password: new FormControl('', { validators: [Validators.required, Validators.minLength(6)], nonNullable: true }),
  });

  errorMessage = signal<string | null>(null);

  onSubmit() {
    this.errorMessage.set(null);
    if (this.registerForm.invalid) {
      // Mark all fields as touched to display validation messages
      this.registerForm.markAllAsTouched();
      return;
    }
    
    const { name, email, password } = this.registerForm.getRawValue();
    const result = this.authService.register(name, email, password);

    if (!result.success) {
      this.errorMessage.set(result.message || 'Ocurrió un error durante el registro.');
    }
    // On success, the auth service will redirect.
  }
}
