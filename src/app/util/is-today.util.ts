export const isToday = (date: number): boolean => {
  const d = new Date(date);
  const isValid = d.getTime() > 0;
  if (!isValid) {
    throw new Error('Invalid date passed');
  }
  const today = new Date();
  // return (today.toDateString() === d.toDateString());
  // return  today.setHours(0, 0, 0, 0) === d.setHours(0, 0, 0, 0);
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
};
