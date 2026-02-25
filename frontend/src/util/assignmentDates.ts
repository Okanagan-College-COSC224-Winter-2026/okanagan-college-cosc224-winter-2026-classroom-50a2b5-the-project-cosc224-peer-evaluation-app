export type AssignmentStatus = "No due date" | "Upcoming" | "Overdue";

export function formatDueDate(dueDate?: string): string {
  if (!dueDate) {
    return "No due date";
  }

  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) {
    return "Invalid due date";
  }

  return parsed.toLocaleDateString();
}

export function getAssignmentStatus(dueDate?: string): AssignmentStatus {
  if (!dueDate) {
    return "No due date";
  }

  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) {
    return "No due date";
  }

  return parsed.getTime() < Date.now() ? "Overdue" : "Upcoming";
}