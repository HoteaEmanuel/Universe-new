const NAME_PART = /^\p{L}+(?:-\p{L}+)*$/u;

const capitalize = (part: string) =>
  part
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join("-");

// University emails commonly follow "firstname.lastname[NN]@domain" (the
// trailing digits disambiguate students sharing a name). When that pattern
// holds, the verified email itself is a stronger identity signal than a
// free-typed name field.
export const parseNameFromEmail = (
  localPart: string,
): { firstName: string; lastName: string } | null => {
  const parts = localPart.split(".");
  if (parts.length !== 2) return null;

  const [firstRaw, lastRaw] = parts;
  const first = firstRaw.replace(/\d+$/, "");
  const last = lastRaw.replace(/\d+$/, "");

  if (first.length < 2 || last.length < 2) return null;
  if (!NAME_PART.test(first) || !NAME_PART.test(last)) return null;

  return { firstName: capitalize(first), lastName: capitalize(last) };
};
