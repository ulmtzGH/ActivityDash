
import { Injectable, signal, computed } from '@angular/core';
import { User } from '../models/user.model';
import { Activity } from '../models/activity.model';
import { ActivityLog } from '../models/activity-log.model';
import { supabase } from '../app/supabase.client';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  // Signals for reactive data management
  users = signal<User[]>([]);
  activities = signal<Activity[]>([]);
  activityLogs = signal<ActivityLog[]>([]);

  // Computed signals for derived data
  totalUsers = computed(() => this.users().length);
  activeUsers = computed(() => this.users().filter(u => u.isActive));
  totalActivities = computed(() => this.activities().length);
  totalLogs = computed(() => this.activityLogs().length);

  constructor() {
    this.loadData();
  }

  async loadData() {
    this.loadUsers();
    this.loadActivities();
    this.loadActivityLogs();
  }

  async loadUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    if (data) {
      this.users.set(data.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        role: p.role as 'Admin' | 'Colaborador',
        isActive: p.is_active,
        password: '' // Not available
      })));
    } else if (error) {
      console.error('Error loading users:', error);
    }
  }

  async loadActivities() {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('id', { ascending: true });
    if (data) {
      this.activities.set(data);
    } else if (error) {
      console.error('Error loading activities:', error);
    }
  }

  async loadActivityLogs() {
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        *,
        profiles:user_id (name)
      `)
      .order('date', { ascending: false });

    if (data) {
      this.activityLogs.set(data.map(log => ({
        id: log.id,
        userId: log.user_id,
        activityId: log.activity_id,
        date: log.date,
        description: log.description
      })));
    } else if (error) {
      console.error('Error loading logs:', error);
    }
  }

  // User Management
  // Note: Creating a user generally requires Auth.signUp which is in AuthService.
  // This method might be used for admin creating users, or just updating local state after a register event if we event-bus it.
  // For now, we'll assume addUser updates the signal optimistically or re-fetches.
  // Actually, AuthService handles registration. We might just re-fetch users in AuthService or here.
  // Let's expose simple state updaters or just rely on loadData everywhere.

  // Since the original app had synchronous `addUser` that updated the list, 
  // and we moved `register` to AuthService, `addUser` here acts as a "refresh" or manual insert if we had an admin panel for it.
  // The original `addUser` added to the list and generated an ID.
  // We'll keep `addUser` but implementation will use Supabase if we support "Invite User" flow (which needs edge functions or SMTP).
  // For 'Colaborador' creation, it's safer to just refresh the list or allow updating keys.
  // Let's stick to `updateUser` and `deleteUser` which operate on existing profiles.

  // Users are created via Auth. We can't easily "insert" into profiles without an auth user unless we use admin key (we have anon).
  // So `addUser` is effectively "Refresh Users" or no-op provided registration happens elsewhere.
  // I'll leave it as a no-op or a refresh trigger for now.
  addUser(userData: { name: string; email: string; password?: string }) {
    // Intentionally empty or calls loadUsers. 
    // Real user creation happens in AuthService.register().
    this.loadUsers();
  }

  async updateUser(updatedUser: User) {
    const { error } = await supabase
      .from('profiles')
      .update({
        name: updatedUser.name,
        role: updatedUser.role,
        is_active: updatedUser.isActive
      })
      .eq('id', updatedUser.id);

    if (!error) {
      this.users.update(users =>
        users.map(user => (user.id === updatedUser.id ? updatedUser : user))
      );
    } else {
      console.error('Error updating user:', error);
    }
  }

  async deleteUser(userId: string) {
    // We can't delete from auth.users easily with anon key, but we can delete from profiles if RLS allows.
    // My RLS says: "Users can update own profile" but nothing about deleting others.
    // Admins usually need delete permissions. I didn't add specific Admin RLS yet, just "Public profiles...".
    // I'll try to delete from `profiles`. If cascading to auth.users is needed, it's server-side.
    // If I delete profile, they might still be in auth but have no profile data.

    // For now, let's just try delete from profiles.
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (!error) {
      this.users.update(users => users.filter(user => user.id !== userId));
      this.activityLogs.update(logs => logs.filter(log => log.userId !== userId));
    } else {
      console.error('Error deleting user (profile):', error);
    }
  }

  // Activity Management
  async addActivity(activity: Omit<Activity, 'id'>) {
    const { data, error } = await supabase
      .from('activities')
      .insert({ ...activity })
      .select()
      .single();

    if (data) {
      this.activities.update(activities => [...activities, data]);
    } else {
      console.error('Error adding activity:', error);
    }
  }

  async updateActivity(updatedActivity: Activity) {
    const { error } = await supabase
      .from('activities')
      .update({ name: updatedActivity.name, description: updatedActivity.description })
      .eq('id', updatedActivity.id);

    if (!error) {
      this.activities.update(activities =>
        activities.map(activity => (activity.id === updatedActivity.id ? updatedActivity : activity))
      );
    } else {
      console.error('Error updating activity:', error);
    }
  }

  async deleteActivity(activityId: number) {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId);

    if (!error) {
      this.activities.update(activities => activities.filter(activity => activity.id !== activityId));
      this.activityLogs.update(logs => logs.filter(log => log.activityId !== activityId));
    } else {
      console.error('Error deleting activity:', error);
    }
  }

  // Activity Log Management
  async addActivityLog(log: Omit<ActivityLog, 'id'>) {
    const payload = {
      user_id: log.userId,
      activity_id: log.activityId,
      date: log.date,
      description: log.description || null
    };

    const { data, error } = await supabase
      .from('activity_logs')
      .insert(payload)
      .select()
      .single();

    if (data) {
      const newLog: ActivityLog = {
        id: data.id,
        userId: data.user_id,
        activityId: data.activity_id,
        date: data.date,
        description: data.description
      };
      this.activityLogs.update(logs => [...logs, newLog]);
    } else {
      console.error('Error adding log:', error);
    }
  }

  async updateActivityLog(updatedLog: ActivityLog) {
    const payload = {
      user_id: updatedLog.userId,
      activity_id: updatedLog.activityId,
      date: updatedLog.date,
      description: updatedLog.description || null
    };

    const { error } = await supabase
      .from('activity_logs')
      .update(payload)
      .eq('id', updatedLog.id);

    if (!error) {
      this.activityLogs.update(logs =>
        logs.map(log => (log.id === updatedLog.id ? updatedLog : log))
      );
    } else {
      console.error('Error updating log:', error);
    }
  }

  async deleteActivityLog(logId: number) {
    const { error } = await supabase
      .from('activity_logs')
      .delete()
      .eq('id', logId);

    if (!error) {
      this.activityLogs.update(logs => logs.filter(log => log.id !== logId));
    } else {
      console.error('Error deleting log:', error);
    }
  }

  // --- Helpers ---
  getUserById(id: string): User | undefined {
    return this.users().find(user => user.id === id);
  }

  getActivityById(id: number): Activity | undefined {
    return this.activities().find(activity => activity.id === id);
  }
}
