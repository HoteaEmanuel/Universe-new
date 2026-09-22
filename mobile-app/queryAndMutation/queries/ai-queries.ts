import { useQuery } from "@tanstack/react-query";
import { createAiApi } from "@universe/shared/api";
import { httpClient } from "../../lib/http";

const aiApi = createAiApi(httpClient);

// Mirrors frontend/src/queryAndMutation/queries/ai-queries.ts: caption is the
// post body, debounced by the caller so a suggestion request only fires once
// typing pauses, not on every keystroke.
export const useSuggestHashtagsQuery = (caption: string, debouncedCaption: string) => {
  const trimmed = caption.trim();
  return useQuery({
    queryKey: ["aiHashtags", debouncedCaption],
    enabled: trimmed.length > 2 && debouncedCaption.trim().length > 2,
    queryFn: () => aiApi.suggestHashtags(debouncedCaption),
  });
};
