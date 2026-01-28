
import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  currentView = signal('Panel Principal');

  authService = inject(AuthService);
  private router = inject(Router);

  isLoggedIn = this.authService.isLoggedIn;
  isLoading = this.authService.isLoading;
  isAdmin = computed(() => this.authService.currentUser()?.role === 'Admin');
  currentUserName = computed(() => this.authService.currentUser()?.name);

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Get title from route data
      let route = this.router.routerState.root;
      while (route.firstChild) {
        route = route.firstChild;
      }
      const title = route.snapshot.title;
      this.currentView.set(title || 'Panel Principal');
    });
  }

  logout() {
    this.authService.logout();
  }
}
