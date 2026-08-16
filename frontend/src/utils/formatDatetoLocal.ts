export const formatToLocalDate = (date: string | Date): string => {
  console.log("DATE:" + date);
  const data = new Date(date);
  const formattedDate = data.toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return formattedDate;
};
