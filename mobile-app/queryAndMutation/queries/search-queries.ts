import { createSearchQueryHooks } from "@universe/shared/queries";
import { httpClient } from "../../lib/http";

export const { useSearchUsersInfinite } = createSearchQueryHooks(httpClient);
