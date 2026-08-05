export const formatShortDate = (d: string) => {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
