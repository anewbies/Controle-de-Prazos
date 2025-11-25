
import { Injectable, signal, effect } from '@angular/core';
import { Deadline, DeadlineStatus } from '../models/deadline.model';

@Injectable({
  providedIn: 'root',
})
export class DeadlineService {
  private readonly storageKey = 'deadlines';
  deadlines = signal<Deadline[]>([]);

  constructor() {
    this.loadFromLocalStorage();

    // Persist to localStorage whenever deadlines change
    effect(() => {
      this.saveToLocalStorage(this.deadlines());
    });
    
    // Periodically check and update deadline statuses every minute
    setInterval(() => this.updateStatuses(), 1000 * 60); 
  }

  private loadFromLocalStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
        const storedDeadlines = localStorage.getItem(this.storageKey);
        if (storedDeadlines) {
            const parsed = JSON.parse(storedDeadlines).map((d: any) => ({
                ...d,
                dueDate: new Date(d.dueDate) // Re-hydrate Date objects
            }));
            this.deadlines.set(parsed);
            this.updateStatuses();
        }
    }
  }

  private saveToLocalStorage(deadlines: Deadline[]): void {
     if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.storageKey, JSON.stringify(deadlines));
     }
  }

  private parseDeadlineInput(input: string): Date | null {
    const trimmedInput = input.trim().toLowerCase();

    // Check for "X dias" format
    if (trimmedInput.endsWith('dias')) {
      const days = parseInt(trimmedInput, 10);
      if (!isNaN(days) && days >= 0) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + days);
        return date;
      }
    }

    // Check for "DD/MM/YYYY" format
    const dateParts = trimmedInput.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dateParts) {
      const [, day, month, year] = dateParts;
      const date = new Date(+year, +month - 1, +day);
      if (date.getFullYear() === +year && date.getMonth() === +month - 1 && date.getDate() === +day) {
        return date;
      }
    }

    return null;
  }
  
  addDeadline(subject: string, recipient: string, deadlineInput: string): boolean {
    const dueDate = this.parseDeadlineInput(deadlineInput);
    if (!dueDate) return false;

    const newDeadline: Deadline = {
      id: Date.now(),
      subject,
      recipient,
      dueDate,
      originalInput: deadlineInput,
      status: this.getDeadlineStatus(dueDate),
    };

    this.deadlines.update(current => [...current, newDeadline]);
    return true;
  }

  deleteDeadline(id: number): void {
    this.deadlines.update(current => current.filter(d => d.id !== id));
  }

  updateStatuses(): void {
    let changed = false;
    const updatedDeadlines = this.deadlines().map(deadline => {
        const newStatus = this.getDeadlineStatus(deadline.dueDate);
        if (newStatus !== deadline.status) {
            changed = true;
            return { ...deadline, status: newStatus };
        }
        return deadline;
    });

    if (changed) {
        this.deadlines.set(updatedDeadlines);
    }
  }

  private getDeadlineStatus(dueDate: Date): DeadlineStatus {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const deadlineDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return 'overdue';
      if (diffDays === 0) return 'due';
      if (diffDays <= 7) return 'upcoming';
      return 'safe';
  }
}
