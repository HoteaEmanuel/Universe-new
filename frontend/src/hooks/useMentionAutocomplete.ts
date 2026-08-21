import { useEffect, useMemo, useState, type RefObject } from "react";
import { useDebounce } from "@/hooks/Debounce";
import { useMentionSearchUsersQuery } from "@/queryAndMutation/queries/user-queries";

const getMentionQuery = (
  input: HTMLInputElement | HTMLTextAreaElement | null,
  value: string,
) => {
  const caret = input?.selectionStart ?? value.length;
  return value.slice(0, caret).match(/(?:^|\s)@([a-z0-9_]*)$/i)?.[1] ?? null;
};

export const useMentionAutocomplete = ({
  inputRef,
  value,
}: {
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  value: string;
}) => {
  const [query, setQuery] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query ?? "", 150);
  const { data: users = [], isFetching } = useMentionSearchUsersQuery(
    debouncedQuery,
    query !== null,
  );

  const refresh = () => setQuery(getMentionQuery(inputRef.current, value));
  useEffect(refresh, [value]);

  return useMemo(() => ({
    isOpen: query !== null,
    users,
    isLoading: isFetching,
    refresh,
  }), [query, users, isFetching]);
};
