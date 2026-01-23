
/**
 * Formats a date string or object intelligently.
 * If same year: HH:mm DD/MM
 * If different year: HH:mm DD/MM/YYYY
 */
export const formatSmartDate = (dateInput?: string | Date): string => {
  const date = dateInput ? new Date(dateInput) : new Date();
  const now = new Date();
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  const timePart = `${hours}:${minutes}`;
  const datePart = `${day}/${month}`;

  if (year === now.getFullYear()) {
    return `${timePart} ${datePart}`;
  }
  return `${timePart} ${datePart}/${year}`;
};

export const getCurrentTimeFormatted = (): string => {
  return formatSmartDate();
};

export const getEndOfDayTimeFormatted = (): string => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  
  // For the end of day string, we still use smart formatting logic
  const datePart = `${day}/${month}`;
  if (year === now.getFullYear()) {
    return `23:59 ${datePart}`;
  }
  return `23:59 ${datePart}/${year}`;
};

export const isFromToday = (isoString: string): boolean => {
  try {
    const d = new Date(isoString);
    const now = new Date();
    return d.getDate() === now.getDate() && 
           d.getMonth() === now.getMonth() && 
           d.getFullYear() === now.getFullYear();
  } catch (e) {
    return false;
  }
};

/**
 * Checks if current time is past the formatted time string (HH:mm DD/MM[/YYYY])
 */
export const isTimePassed = (timeStr: string): boolean => {
  try {
    const parts = timeStr.split(' ');
    if (parts.length < 2) return false;

    const [hours, minutes] = parts[0].split(':').map(Number);
    const dateParts = parts[1].split('/').map(Number);
    
    const day = dateParts[0];
    const month = dateParts[1];
    const year = dateParts[2] || new Date().getFullYear();
    
    const deadline = new Date(year, month - 1, day, hours, minutes);
    return new Date() > deadline;
  } catch (error) {
    return false;
  }
};
