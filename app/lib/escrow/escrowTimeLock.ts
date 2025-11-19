import { Escrow } from "./escrow";

// Check if an escrow can be auto-released based on its release date
export function canAutoRelease(escrow: Escrow): boolean {
  if (!escrow.release_date || !escrow.auto_release) {
    return false;
  }

  if (escrow.status !== 'funded') {
    return false;
  }

  const releaseDate = new Date(escrow.release_date);
  const now = new Date();

  return now >= releaseDate;
}

// Check if the time lock has expired
export function isTimeLockExpired(releaseDate: string): boolean {
  const release = new Date(releaseDate);
  const now = new Date();
  return now >= release;
}

// Get remaining time as a formatted string
export function getRemainingTime(releaseDate: string): string {
  const release = new Date(releaseDate);
  const now = new Date();
  const diff = release.getTime() - now.getTime();

  if (diff <= 0) {
    return "Time lock expired";
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

// Get remaining time breakdown
export function getRemainingTimeBreakdown(releaseDate: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
} {
  const release = new Date(releaseDate);
  const now = new Date();
  const diff = release.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, expired: false };
}

// Format date for display
export function formatReleaseDate(releaseDate: string): string {
  const date = new Date(releaseDate);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

