
import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private dataService = inject(DataService);
  private router = inject(Router);
  
  // Signal to hold the current user state. Initial value is null (logged out).
  currentUser = signal<User | null>(null);

  // Computed signal to easily check if a user is logged in.
  isLoggedIn = computed(() => this.currentUser() !== null);

  constructor() { }

  /**
   * Attempts to log in a user with the given credentials.
   * @param email The user's email.
   * @param password The user's password.
   * @returns True if login is successful, false otherwise.
   */
  login(email: string, password: string): boolean {
    const user = this.dataService.users().find(u => u.email.toLowerCase() === email.toLowerCase());
    
    // User must exist, be active, and password must match
    if (!user || !user.isActive || user.password !== password) {
      return false; 
    }

    this.currentUser.set(user);
    this.router.navigate(['/dashboard']);
    return true;
  }

  /**
   * Registers a new user, and then logs them in.
   * @param name The user's full name.
   * @param email The user's email.
   * @param password The user's password.
   * @returns An object indicating success and an optional error message.
   */
  register(name: string, email: string, password: string): { success: boolean, message?: string } {
    const existingUser = this.dataService.users().find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      return { success: false, message: 'El correo electrónico ya está en uso.' };
    }

    this.dataService.addUser({ name, email, password });

    // Automatically log in the new user
    this.login(email, password);
    
    return { success: true };
  }

  /**
   * Logs out the current user, clears the state, and redirects to the login page.
   */
  logout(): void {
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
