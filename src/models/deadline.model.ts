
export type DeadlineStatus = 'overdue' | 'due' | 'upcoming' | 'safe';

export interface Deadline {
  id: number;
  subject: string;
  recipient: string;
  dueDate: Date;
  originalInput: string;
  status: DeadlineStatus;
}
