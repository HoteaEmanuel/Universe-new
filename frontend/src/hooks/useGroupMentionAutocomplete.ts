import { useEffect, useMemo, useState, type RefObject } from "react";
import { useDebounce } from "@/hooks/Debounce";
import { useGroupMentionSearchUsersQuery } from "@/queryAndMutation/queries/group-queries";

const getMentionQuery = (
  input: HTMLInputElement | HTMLTextAreaElement | null,
  value: string,
) => {
  const caret = input?.selectionStart ?? value.length;
  return value.slice(0, caret).match(/(?:^|\s)@([a-z0-9_]*)$/i)?.[1] ?? null;
};

export const useGroupMentionAutocomplete = ({
  groupId,
  inputRef,
  value,
}: {
  groupId?: string;
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  value: string;
}) => {
  const [query, setQuery] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query ?? "", 150);
  const { data: users = [], isFetching } = useGroupMentionSearchUsersQuery(
    groupId,
    debouncedQuery,
    query !== null,
  );
  const refresh = () => setQuery(getMentionQuery(inputRef.current, value));

  useEffect(() => {
    if (!groupId) setQuery(null);
    else refresh();
  }, [groupId, value]);

  return useMemo(() => ({
    isOpen: query !== null && !!groupId,
    users,
    isLoading: isFetching,
    refresh,
  }), [groupId, isFetching, query, users]);
};
