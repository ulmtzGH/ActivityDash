
import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { DataService } from '../../services/data.service';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Activity } from '../../models/activity.model';

@Component({
  selector: 'app-activities',
  imports: [ReactiveFormsModule],
  templateUrl: './activities.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivitiesComponent {
  dataService = inject(DataService);

  // Forms for adding and editing activities
  addActivityForm = new FormGroup({
    name: new FormControl('', { validators: Validators.required, nonNullable: true }),
    description: new FormControl('', { validators: Validators.required, nonNullable: true }),
  });

  editActivityForm = new FormGroup({
    name: new FormControl('', { validators: Validators.required, nonNullable: true }),
    description: new FormControl('', { validators: Validators.required, nonNullable: true }),
  });

  // State signals
  activityToDelete = signal<Activity | null>(null);
  editingActivity = signal<Activity | null>(null);
  showAddActivityModal = signal(false);
  searchTerm = signal('');

  // Computed signal for filtering activities
  filteredActivities = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      return this.dataService.activities();
    }
    return this.dataService.activities().filter(activity =>
      activity.name.toLowerCase().includes(term) ||
      activity.description.toLowerCase().includes(term)
    );
  });

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  // --- Add Activity Modal ---
  openAddActivityModal() {
    this.addActivityForm.reset();
    this.showAddActivityModal.set(true);
  }

  closeAddActivityModal() {
    this.showAddActivityModal.set(false);
  }

  // --- Add Activity ---
  onSubmit() {
    if (this.addActivityForm.valid) {
      this.dataService.addActivity(this.addActivityForm.getRawValue());
      this.closeAddActivityModal();
    }
  }

  // --- Edit Activity ---
  startEdit(activity: Activity) {
    this.editingActivity.set(activity);
    this.editActivityForm.setValue({ name: activity.name, description: activity.description });
  }

  cancelEdit() {
    this.editingActivity.set(null);
  }

  saveEdit() {
    const activity = this.editingActivity();
    if (activity && this.editActivityForm.valid) {
      const updatedActivity = {
        ...activity,
        ...this.editActivityForm.getRawValue()
      };
      this.dataService.updateActivity(updatedActivity);
      this.editingActivity.set(null);
    }
  }

  // --- Delete Activity ---
  requestDeleteActivity(activity: Activity) {
    this.activityToDelete.set(activity);
  }

  cancelDelete() {
    this.activityToDelete.set(null);
  }

  confirmDelete() {
    const activity = this.activityToDelete();
    if (activity) {
      this.dataService.deleteActivity(activity.id);
      this.activityToDelete.set(null);
    }
  }
}
