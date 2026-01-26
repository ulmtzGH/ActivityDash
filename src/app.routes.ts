
import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { UsersComponent } from './components/users/users.component';
import { ActivitiesComponent } from './components/activities/activities.component';
import { ActivityLogComponent } from './components/activity-log/activity-log.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { authGuard } from './guards/auth.guard';
import { loginGuard } from './guards/login.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, title: 'Iniciar Sesión', canActivate: [loginGuard] },
  { path: 'register', component: RegisterComponent, title: 'Registrarse', canActivate: [loginGuard] },
  
  { path: 'dashboard', component: DashboardComponent, title: 'Panel Principal', canActivate: [authGuard] },
  { 
    path: 'users', 
    component: UsersComponent, 
    title: 'Usuarios', 
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin'] } 
  },
  { 
    path: 'activities', 
    component: ActivitiesComponent, 
    title: 'Actividades', 
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin'] }
  },
  { path: 'activity-log', component: ActivityLogComponent, title: 'Registro de Actividad', canActivate: [authGuard] },
  { path: 'leaderboard', component: LeaderboardComponent, title: 'Clasificación', canActivate: [authGuard] },

  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' } // Wildcard route
];
