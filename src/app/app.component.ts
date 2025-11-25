import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeadlineService } from './services/deadline.service';
import { Deadline, DeadlineStatus } from './models/deadline.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  deadlineService = inject(DeadlineService);

  // Form state signals
  subject = signal('');
  recipient = signal('');
  deadlineInput = signal('');
  errorMessage = signal<string | null>(null);

  deadlines = this.deadlineService.deadlines;
  
  sortedDeadlines = computed(() => {
    return this.deadlines().slice().sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  });
  
  hasDeadlines = computed(() => this.deadlines().length > 0);

  onSubjectInput(event: Event) {
    this.subject.set((event.target as HTMLInputElement).value);
  }

  onRecipientInput(event: Event) {
    this.recipient.set((event.target as HTMLInputElement).value);
  }

  onDeadlineInput(event: Event) {
    this.deadlineInput.set((event.target as HTMLInputElement).value);
  }
  
  addDeadline(): void {
    if (!this.subject().trim() || !this.recipient().trim() || !this.deadlineInput().trim()) {
        this.errorMessage.set('Todos os campos são obrigatórios.');
        return;
    }
    
    const success = this.deadlineService.addDeadline(
      this.subject(),
      this.recipient(),
      this.deadlineInput()
    );

    if (success) {
      this.subject.set('');
      this.recipient.set('');
      this.deadlineInput.set('');
      this.errorMessage.set(null);
    } else {
      this.errorMessage.set('Formato de prazo inválido. Use "X dias" ou "DD/MM/AAAA".');
    }
  }

  deleteDeadline(id: number): void {
    this.deadlineService.deleteDeadline(id);
  }
  
  getCardClasses(status: DeadlineStatus): string {
    const baseClasses = 'bg-slate-800 p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all duration-300 border-l-4';
    const statusClasses = {
      overdue: 'border-red-500',
      due: 'border-orange-500',
      upcoming: 'border-yellow-400',
      safe: 'border-green-500',
    };
    return `${baseClasses} ${statusClasses[status]}`;
  }

  getStatusText(status: DeadlineStatus): string {
     const statusText = {
      overdue: 'Vencido',
      due: 'Vence Hoje',
      upcoming: 'Próximo',
      safe: 'Em dia',
    };
    return statusText[status];
  }

  getDaysRemaining(dueDate: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const deadlineDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Venceu há ${Math.abs(diffDays)} dia(s)`;
    if (diffDays === 0) return 'Vence hoje';
    return `Vence em ${diffDays} dia(s)`;
  }
}