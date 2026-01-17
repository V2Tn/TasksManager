
export const getCurrentTimeFormatted = (): string => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${hours}:${minutes} ${day}/${month}`;
};

export const getEndOfDayTimeFormatted = (): string => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `23:59 ${day}/${month}`;
};

export const formatInputDateTime = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${hours}:${minutes} ${day}/${month}`;
};

export const isFromToday = (timeStr: string): boolean => {
  try {
    const parts = timeStr.split(' ');
    if (parts.length < 2) return false;
    const taskDate = parts[1]; // "DD/MM"
    
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const todayDate = `${day}/${month}`;
    
    return taskDate === todayDate;
  } catch (e) {
    return false;
  }
};

export const isTimePassed = (timeStr: string): boolean => {
  try {
    const [timePart, datePart] = timeStr.split(' ');
    const [hours, minutes] = timePart.split(':').map(Number);
    const [day, month] = datePart.split('/').map(Number);
    
    const now = new Date();
    // Assuming current year
    const year = now.getFullYear(); 
    const deadline = new Date(year, month - 1, day, hours, minutes);
    
    return now > deadline;
  } catch (error) {
    return false;
  }
};
