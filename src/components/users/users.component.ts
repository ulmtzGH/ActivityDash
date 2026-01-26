
import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { DataService } from '../../services/data.service';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-users',
  imports: [ReactiveFormsModule],
  templateUrl: './users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent {
  dataService = inject(DataService);

  // Form for adding a new user
  addUserForm = new FormGroup({
    name: new FormControl('', { validators: Validators.required, nonNullable: true }),
    email: new FormControl('', { validators: [Validators.required, Validators.email], nonNullable: true }),
  });

  // Form for editing an existing user
  editUserForm = new FormGroup({
    name: new FormControl('', { validators: Validators.required, nonNullable: true }),
    email: new FormControl('', { validators: [Validators.required, Validators.email], nonNullable: true }),
    isActive: new FormControl(false, { nonNullable: true }),
  });

  // State signals
  userToDelete = signal<User | null>(null);
  editingUser = signal<User | null>(null);
  showAddUserModal = signal(false);
  searchTerm = signal('');

  // Computed signal for filtering users
  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      return this.dataService.users();
    }
    return this.dataService.users().filter(user =>
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  });
  
  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  // --- Add User Modal ---
  openAddUserModal() {
    this.addUserForm.reset();
    this.showAddUserModal.set(true);
  }

  closeAddUserModal() {
    this.showAddUserModal.set(false);
  }

  // --- Add User ---
  onSubmit() {
    if (this.addUserForm.valid) {
      this.dataService.addUser(this.addUserForm.getRawValue());
      this.closeAddUserModal();
    }
  }

  // --- Edit User ---
  startEdit(user: User) {
    this.editingUser.set(user);
    this.editUserForm.setValue({ name: user.name, email: user.email, isActive: user.isActive });
  }

  cancelEdit() {
    this.editingUser.set(null);
  }

  saveEdit() {
    const user = this.editingUser();
    if (user && this.editUserForm.valid) {
      const formValue = this.editUserForm.getRawValue();
      const updatedUser: User = {
        ...user,
        name: formValue.name,
        email: formValue.email,
        isActive: formValue.isActive
      };
      this.dataService.updateUser(updatedUser);
      this.editingUser.set(null);
    }
  }

  // --- Delete User ---
  requestDeleteUser(user: User) {
    this.userToDelete.set(user);
  }

  cancelDelete() {
    this.userToDelete.set(null);
  }

  confirmDelete() {
    const user = this.userToDelete();
    if (user) {
      this.dataService.deleteUser(user.id);
      this.userToDelete.set(null);
    }
  }
}
