import { useEffect, useState } from "react";

// Search only earns its place once there's something to search through.
// Locks in visibility from the *unfiltered* result so a search that narrows
// the list to zero results doesn't make the box that would clear it vanish.
export const useShowSearchInput = (
  itemCount: number,
  isFiltered: boolean,
  isPending: boolean,
) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isPending || isFiltered) return;
    setShow(itemCount > 0);
  }, [isPending, isFiltered, itemCount]);

  return show;
};
