export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // e.g., '2025-08-08'
  eventType: string; // e.g., 'meeting', 'task'
  duration: number; // in days
  top: number; // px from top of the calendar grid
  height: number; // px height
}

export type Category = "To Do" | "In Progress" | "Review" | "Completed" | "Overdue";

export type Task = {
  id: string;
  name: string;
  category: Category;
  start: string; // ISO date
  end: string; // ISO date (inclusive)
  color?: string;
};

export const COLORS = {
  "To Do": "bg-blue-400",
  "In Progress": "bg-yellow-400",
  "Review": "bg-purple-400",
  "Completed": "bg-green-400",
  "Overdue": "bg-red-600",
};