
import { Injectable, signal, computed } from '@angular/core';
import { User } from '../models/user.model';
import { Activity } from '../models/activity.model';
import { ActivityLog } from '../models/activity-log.model';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  // Mock data
  private initialUsers: User[] = [
    { id: 1, name: 'Alicia Johnson', email: 'alicia@example.com', password: 'aliciajohnson', role: 'Admin', isActive: true },
    { id: 2, name: 'Roberto Williams', email: 'roberto@example.com', password: 'robertowilliams', role: 'Colaborador', isActive: true },
    { id: 3, name: 'Carlos Brown', email: 'carlos@example.com', password: 'carlosbrown', role: 'Colaborador', isActive: false },
    { id: 4, name: 'Diana Prince', email: 'diana@example.com', password: 'dianaprince', role: 'Colaborador', isActive: true },
  ];

  private initialActivities: Activity[] = [
    { id: 1, name: 'Commits de Código', description: 'Número de commits enviados al repositorio.' },
    { id: 2, name: 'Tareas Completadas', description: 'Número de tareas marcadas como completadas.' },
    { id: 3, name: 'Tickets de Soporte Resueltos', description: 'Número de tickets de soporte al cliente resueltos.' },
  ];

  private initialActivityLogs: ActivityLog[] = [
    { id: 1, userId: 1, activityId: 1, date: '2023-10-26', description: 'Refactorización del módulo de autenticación.' },
    { id: 2, userId: 2, activityId: 1, date: '2023-10-26', description: 'Añadidos tests unitarios para el servicio de usuarios.' },
    { id: 3, userId: 1, activityId: 2, date: '2023-10-26', description: 'Completada la tarea de diseño de la nueva interfaz.' },
    { id: 4, userId: 3, activityId: 2, date: '2023-10-27', description: 'Finalizada la implementación del endpoint de perfil.' },
    { id: 5, userId: 2, activityId: 3, date: '2023-10-27' },
    { id: 6, userId: 4, activityId: 1, date: '2023-10-28', description: 'Optimización de consultas a la base de datos.' },
    { id: 7, userId: 1, activityId: 1, date: '2023-10-28' },
    { id: 8, userId: 3, activityId: 3, date: '2023-10-28', description: 'Asistencia en la resolución de un bug crítico de producción.' },
  ];

  // Signals for reactive data management
  users = signal<User[]>(this.initialUsers);
  activities = signal<Activity[]>(this.initialActivities);
  activityLogs = signal<ActivityLog[]>(this.initialActivityLogs);

  // Computed signals for derived data
  totalUsers = computed(() => this.users().length);
  activeUsers = computed(() => this.users().filter(u => u.isActive));
  totalActivities = computed(() => this.activities().length);
  totalLogs = computed(() => this.activityLogs().length);

  constructor() {}

  // User Management
  addUser(userData: { name: string; email: string; password?: string }) {
    this.users.update(users => [
      ...users,
      {
        name: userData.name,
        email: userData.email,
        id: Math.max(...users.map(u => u.id), 0) + 1,
        role: 'Colaborador',
        isActive: true,
        password: userData.password || userData.name.toLowerCase().replace(/\s/g, ''),
      },
    ]);
  }

  updateUser(updatedUser: User) {
    this.users.update(users =>
      users.map(user => (user.id === updatedUser.id ? updatedUser : user))
    );
  }

  deleteUser(userId: number) {
    // Remove user
    this.users.update(users => users.filter(user => user.id !== userId));
    // Remove associated activity logs
    this.activityLogs.update(logs => logs.filter(log => log.userId !== userId));
  }

  // Activity Management
  addActivity(activity: Omit<Activity, 'id'>) {
    this.activities.update(activities => [
      ...activities,
      { ...activity, id: Math.max(...activities.map(a => a.id), 0) + 1 },
    ]);
  }

  updateActivity(updatedActivity: Activity) {
    this.activities.update(activities =>
      activities.map(activity => (activity.id === updatedActivity.id ? updatedActivity : activity))
    );
  }

  deleteActivity(activityId: number) {
    // Remove activity
    this.activities.update(activities => activities.filter(activity => activity.id !== activityId));
    // Remove associated activity logs
    this.activityLogs.update(logs => logs.filter(log => log.activityId !== activityId));
  }
  
  // Activity Log Management
  addActivityLog(log: Omit<ActivityLog, 'id'>) {
    const newLog: ActivityLog = { 
      ...log, 
      id: Math.max(...this.activityLogs().map(l => l.id), 0) + 1 
    };
    
    // Ensure empty string is stored as undefined
    if (newLog.description === '') {
      delete newLog.description;
    }

    this.activityLogs.update(logs => [
      ...logs,
      newLog,
    ]);
  }

  updateActivityLog(updatedLog: ActivityLog) {
     // Ensure empty string is stored as undefined
    if (updatedLog.description === '') {
      delete updatedLog.description;
    }
    this.activityLogs.update(logs =>
      logs.map(log => (log.id === updatedLog.id ? updatedLog : log))
    );
  }

  deleteActivityLog(logId: number) {
    this.activityLogs.update(logs => logs.filter(log => log.id !== logId));
  }

  // --- Helpers ---
  getUserById(id: number): User | undefined {
    return this.users().find(user => user.id === id);
  }

  getActivityById(id: number): Activity | undefined {
    return this.activities().find(activity => activity.id === id);
  }
}
