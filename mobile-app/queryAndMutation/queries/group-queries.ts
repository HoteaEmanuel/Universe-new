import { createGroupQueryHooks } from "@universe/shared/queries";
import { httpClient } from "../../lib/http";

export const { useGetUserGroupsInfinite } = createGroupQueryHooks(httpClient);
