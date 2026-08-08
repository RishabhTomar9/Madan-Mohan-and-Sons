/**
 * Format a Firestore Timestamp or Date to readable string.
 */
export function formatDate(dateValue, options = {}) {
  if (!dateValue) return '';
  const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
  const defaultOpts = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  };
  return date.toLocaleDateString('en-IN', defaultOpts);
}

/**
 * Format date with time.
 */
export function formatDateTime(dateValue) {
  if (!dateValue) return '';
  const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format time only.
 */
export function formatTime(dateValue) {
  if (!dateValue) return '';
  const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get start and end of today.
 */
export function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Get start of this week (Monday).
 */
export function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Get start of this month.
 */
export function getMonthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Check if a date is overdue (past due date).
 */
export function isOverdue(dateValue) {
  if (!dateValue) return false;
  const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
  return date < new Date();
}

/**
 * Get relative time string (e.g., "2 hours ago").
 */
export function getRelativeTime(dateValue) {
  if (!dateValue) return '';
  const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}
