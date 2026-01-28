
import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { DataService } from './data.service'; // Keep temporarily if other methods need it, but actually we removed it from usage.
import { supabase } from '../app/supabase.client';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);

  // Signal to hold the current user state. Initial value is null (logged out).
  currentUser = signal<User | null>(null);

  // Signal to track loading state
  private loading = signal(true);
  isLoading = computed(() => this.loading());

  // Computed signal to easily check if a user is logged in.
  isLoggedIn = computed(() => this.currentUser() !== null);

  private initPromise: Promise<void>;
  private initResolve!: () => void;
  private currentProfilePromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = new Promise((resolve) => {
      this.initResolve = resolve;
    });
    this.initializeAuth();
  }

  async ensureInitialized() {
    return this.initPromise;
  }

  private async initializeAuth() {
    // Check initial session
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      this.currentProfilePromise = this.fetchProfile(session.user.id, session.user.email!);
      await this.currentProfilePromise;
    }

    // Mark as initialized for the first time
    this.loading.set(false);
    this.initResolve();

    // Listen for future auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        this.loading.set(true);
        this.currentProfilePromise = this.fetchProfile(session.user.id, session.user.email!);
        await this.currentProfilePromise;
        this.loading.set(false);
      } else {
        this.currentUser.set(null);
        this.currentProfilePromise = null;
        this.loading.set(false);
      }
    });
  }

  private async fetchProfile(userId: string, email: string) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      this.currentUser.set(null);
      return;
    }

    if (profile) {
      this.currentUser.set({
        id: userId,
        email: email,
        name: profile.name,
        role: profile.role as 'Admin' | 'Colaborador',
        isActive: profile.is_active,
        password: '' // Password not stored locally
      });
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Login error:', error.message);
      return false;
    }

    // Explicitly fetch profile to ensure it's ready before navigation
    if (data.user) {
      await this.fetchProfile(data.user.id, data.user.email!);
    }

    this.router.navigate(['/dashboard']);
    return true;
  }

  async register(name: string, email: string, password: string): Promise<{ success: boolean, message?: string }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        }
      }
    });

    if (error) {
      return { success: false, message: error.message };
    }

    if (data.user) {
      // Profile is created automatically by database trigger 'on_auth_user_created'
      // If auto-confirm is on, we might have a session immediately.
      // We'll try to fetch profile just in case.
      await this.fetchProfile(data.user.id, data.user.email!);

      this.router.navigate(['/dashboard']);
      return { success: true };
    }

    return { success: false, message: 'Error desconocido al registrar.' };
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
