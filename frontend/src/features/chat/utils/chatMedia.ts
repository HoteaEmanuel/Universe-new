export const formatMonthLabel = (monthStartIso: string) =>
  new Date(monthStartIso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
