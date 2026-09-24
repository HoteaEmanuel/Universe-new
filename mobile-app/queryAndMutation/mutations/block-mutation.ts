import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBlockApi } from "@universe/shared/api";
import { createBlockMutations } from "@universe/shared/mutations";
import { httpClient } from "../../lib/http";

const blockApi = createBlockApi(httpClient);

export const useBlockUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(createBlockMutations(blockApi, queryClient).block());
};

export const useUnblockUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(createBlockMutations(blockApi, queryClient).unblock());
};
