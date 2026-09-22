import { createBlockQueryHooks } from "@universe/shared/queries";
import { httpClient } from "@/lib/api";

export const { useGetBlockedUsers } = createBlockQueryHooks(httpClient);
