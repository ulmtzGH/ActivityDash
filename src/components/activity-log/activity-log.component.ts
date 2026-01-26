
import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivityLog } from '../../models/activity-log.model';

@Component({
  selector: 'app-activity-log',
  imports: [ReactiveFormsModule],
  templateUrl: './activity-log.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityLogComponent {
  dataService = inject(DataService);
  authService = inject(AuthService);

  // Permission check
  isAdmin = computed(() => this.authService.currentUser()?.role === 'Admin');

  // Forms for adding and editing logs
  addLogForm = new FormGroup({
    userId: new FormControl<number | null>(null, { validators: Validators.required }),
    activityId: new FormControl<number | null>(null, { validators: Validators.required }),
    date: new FormControl(this.getTodayDateString(), { validators: Validators.required, nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
  });

  editLogForm = new FormGroup({
    userId: new FormControl<number | null>(null, { validators: Validators.required }),
    activityId: new FormControl<number | null>(null, { validators: Validators.required }),
    date: new FormControl('', { validators: Validators.required, nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
  });
  
  // State signals
  showAddLogModal = signal(false);
  editingLog = signal<ActivityLog | null>(null);
  logToDelete = signal<ActivityLog | null>(null);

  // Computed signal to filter logs based on user role
  filteredActivityLogs = computed(() => {
    const logs = this.dataService.activityLogs();
    const currentUser = this.authService.currentUser();
    
    if (currentUser?.role === 'Admin') {
      return logs;
    }
    
    return logs.filter(log => log.userId === currentUser?.id);
  });

  // --- Helper Methods ---
  getUserName(userId: number): string {
    return this.dataService.getUserById(userId)?.name || 'Usuario Desconocido';
  }

  getActivityName(activityId: number): string {
    return this.dataService.getActivityById(activityId)?.name || 'Actividad Desconocida';
  }

  private getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // --- Add Log Modal ---
  openAddLogModal() {
    this.addLogForm.reset({
      userId: null,
      activityId: null,
      date: this.getTodayDateString(),
      description: ''
    });

    if (this.isAdmin()) {
      this.addLogForm.get('userId')?.enable();
    } else {
      const currentUserId = this.authService.currentUser()?.id;
      if (currentUserId) {
        this.addLogForm.get('userId')?.setValue(currentUserId);
        this.addLogForm.get('userId')?.disable();
      }
    }
    this.showAddLogModal.set(true);
  }

  closeAddLogModal() {
    this.showAddLogModal.set(false);
  }

  onAddSubmit() {
    if (this.addLogForm.valid) {
      const formValue = this.addLogForm.getRawValue();
      this.dataService.addActivityLog({
        userId: formValue.userId!,
        activityId: formValue.activityId!,
        date: formValue.date,
        description: formValue.description
      });
      this.closeAddLogModal();
    }
  }

  // --- Edit Log ---
  startEdit(log: ActivityLog) {
    this.editingLog.set(log);
    this.editLogForm.setValue({
      userId: log.userId,
      activityId: log.activityId,
      date: log.date,
      description: log.description || ''
    });
  }

  cancelEdit() {
    this.editingLog.set(null);
  }

  saveEdit() {
    const log = this.editingLog();
    if (log && this.editLogForm.valid) {
      const updatedLog = {
        ...log,
        ...this.editLogForm.getRawValue(),
        // Ensure userId and activityId are numbers
        userId: Number(this.editLogForm.value.userId),
        activityId: Number(this.editLogForm.value.activityId),
      };
      this.dataService.updateActivityLog(updatedLog);
      this.editingLog.set(null);
    }
  }

  // --- Delete Log ---
  requestDeleteLog(log: ActivityLog) {
    this.logToDelete.set(log);
  }

  cancelDelete() {
    this.logToDelete.set(null);
  }
  
  confirmDelete() {
    const log = this.logToDelete();
    if (log) {
      this.dataService.deleteActivityLog(log.id);
      this.logToDelete.set(null);
    }
  }
}
