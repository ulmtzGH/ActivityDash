
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DataService } from '../../services/data.service';
import { User } from '../../models/user.model';

interface LeaderboardEntry {
  user: User;
  score: number;
}

@Component({
  selector: 'app-leaderboard',
  template: `
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div class="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h3 class="text-xl font-semibold w-full md:w-auto">Clasificación</h3>
        
        <!-- Activity Filter Dropdown -->
        <select 
          (change)="onActivityFilterChange($event)"
          class="w-full md:w-64 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">Todas las Actividades</option>
          @for(activity of dataService.activities(); track activity.id) {
            <option [value]="activity.id">{{ activity.name }}</option>
          }
        </select>
      </div>

      <!-- Mobile Card View -->
      <div class="md:hidden space-y-3">
        @for (entry of leaderboard(); track entry.user.id; let i = $index) {
          <div class="flex items-center p-3 rounded-lg border"
            [class.bg-yellow-100]="i === 0" [class.dark:bg-yellow-500/10]="i === 0" [class.border-yellow-400]="i === 0"
            [class.bg-gray-100]="i === 1" [class.dark:bg-gray-300/10]="i === 1" [class.border-gray-300]="i === 1"
            [class.bg-orange-100]="i === 2" [class.dark:bg-orange-500/10]="i === 2" [class.border-orange-400]="i === 2"
            [class.dark:border-gray-700]="i > 2"
          >
            <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
              [class.bg-yellow-400]="i === 0" [class.text-yellow-900]="i === 0"
              [class.bg-gray-300]="i === 1" [class.text-gray-800]="i === 1"
              [class.bg-orange-400]="i === 2" [class.text-orange-900]="i === 2"
              [class.bg-gray-200]="i > 2" [class.dark:bg-gray-600]="i > 2"
            >
              {{ i + 1 }}
            </div>
            <div class="ml-4 flex-grow">
              <p class="font-semibold text-gray-900 dark:text-white">{{ entry.user.name }}</p>
            </div>
            <div class="text-right">
              <p class="font-bold text-primary-600 dark:text-primary-400">{{ entry.score }}</p>
            </div>
          </div>
        } @empty {
          <p class="py-4 text-center text-gray-500 dark:text-gray-400">No hay datos para mostrar una clasificación.</p>
        }
      </div>


      <!-- Desktop Table View -->
      <div class="hidden md:block overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Puesto</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Usuario</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Actividades</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            @for (entry of leaderboard(); track entry.user.id; let i = $index) {
              <tr 
                [class.bg-yellow-100]="i === 0" [class.dark:bg-yellow-900/50]="i === 0"
                [class.bg-gray-50]="i === 1" [class.dark:bg-gray-700/50]="i === 1"
                [class.bg-orange-50]="i === 2" [class.dark:bg-orange-900/30]="i === 2"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" [class.text-yellow-600]="i === 0" [class.dark:text-yellow-400]="i === 0">
                  <span class="font-bold text-lg">{{ i + 1 }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ entry.user.name }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-600 dark:text-primary-400">{{ entry.score }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="3" class="px-6 py-4 text-center text-gray-500">No hay suficientes datos para una clasificación.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardComponent {
  dataService = inject(DataService);

  selectedActivityId = signal<number | null>(null);

  leaderboard = computed<LeaderboardEntry[]>(() => {
    const users = this.dataService.activeUsers();
    const allLogs = this.dataService.activityLogs();
    const filterId = this.selectedActivityId();

    const logs = filterId === null
      ? allLogs
      : allLogs.filter(log => log.activityId === filterId);

    const scores = new Map<string, number>();

    // Count the number of logs for each user
    for (const log of logs) {
      scores.set(log.userId, (scores.get(log.userId) || 0) + 1);
    }

    return users
      .map(user => ({
        user,
        score: scores.get(user.id) || 0,
      }))
      .sort((a, b) => b.score - a.score);
  });

  onActivityFilterChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedActivityId.set(value ? Number(value) : null);
  }
}
