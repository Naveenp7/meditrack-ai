// Date formatting utilities
export const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export const formatTime = (timeString: string): string => {
  // Assuming timeString is in 24-hour format (e.g., "14:30")
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM
  
  return `${hour12}:${minutes} ${period}`;
};

export const formatDateTime = (dateString: string, timeString: string): string => {
  return `${formatDate(dateString)} at ${formatTime(timeString)}`;
};

// Calculate age from date of birth
export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Generate time slots for appointment booking
export const generateTimeSlots = (startHour: number = 9, endHour: number = 17, intervalMinutes: number = 30): string[] => {
  const slots: string[] = [];
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      slots.push(`${formattedHour}:${formattedMinute}`);
    }
  }
  
  return slots;
};

// Generate a color based on a string (for avatars)
export const stringToColor = (string: string): string => {
  let hash = 0;
  let i;

  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  return color;
};

// Get initials from a name
export const getInitials = (name: string): string => {
  if (!name) return '';
  
  const nameParts = name.split(' ');
  
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }
  
  return (
    nameParts[0].charAt(0).toUpperCase() +
    nameParts[nameParts.length - 1].charAt(0).toUpperCase()
  );
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};



// Group array items by a key
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, currentValue) => {
    const groupKey = String(currentValue[key]);
    (result[groupKey] = result[groupKey] || []).push(currentValue);
    return result;
  }, {} as Record<string, T[]>);
};

// Sort array of objects by date
export const sortByDate = <T>(array: T[], dateKey: keyof T, ascending: boolean = false): T[] => {
  return [...array].sort((a, b) => {
    const dateA = new Date(a[dateKey] as string).getTime();
    const dateB = new Date(b[dateKey] as string).getTime();
    
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

// Debounce function for search inputs, etc.
export const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): Promise<ReturnType<F>> => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    
    return new Promise(resolve => {
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
  };
};

// Check if a date is in the past
export const isDateInPast = (dateString: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to beginning of day
  
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0); // Set to beginning of day
  
  return date < today;
};

// Check if a date is today
export const isToday = (dateString: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to beginning of day
  
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0); // Set to beginning of day
  
  return date.getTime() === today.getTime();
};

// Get date range for current week
export const getCurrentWeekRange = (): { start: string; end: string } => {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday, 6 = Saturday
  
  const start = new Date(today);
  start.setDate(today.getDate() - day);
  
  const end = new Date(today);
  end.setDate(today.getDate() + (6 - day));
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
};