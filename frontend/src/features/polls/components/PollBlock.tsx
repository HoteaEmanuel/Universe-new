import type { QueryKey } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { useGetMyPollVoteQuery } from "@/queryAndMutation/queries/poll-queries";
import {
  useVoteOnPollMutation,
  useClosePollMutation,
} from "@/queryAndMutation/mutations/poll-mutation";
import { formatCount } from "@/utils/formatCount";
import type { Poll } from "@/queryAndMutation/types";

type PollBlockProps = {
  poll: Poll;
  invalidateKeys?: QueryKey[];
};

const PollBlock = ({ poll, invalidateKeys = [] }: PollBlockProps) => {
  const { user } = useAuthStore();
  const { data: myVote } = useGetMyPollVoteQuery(poll.id);
  const voteMutation = useVoteOnPollMutation(poll.id, invalidateKeys);
  const closeMutation = useClosePollMutation(poll.id, invalidateKeys);

  const isAuthor = user?.id === poll.authorId;
  const isClosed = poll.status === "closed";
  const showResults = !!myVote || isClosed;
  const canChangeVote = !isClosed;

  const handleVote = (
    e: React.MouseEvent<HTMLButtonElement>,
    optionId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (isClosed || optionId === myVote || voteMutation.isPending) return;
    voteMutation.mutate(optionId);
  };

  const handleClose = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    closeMutation.mutate();
  };

  return (
    <div
      className="flex flex-col gap-2 rounded-xl p-3"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-sm font-medium wrap-break-word">{poll.question}</p>
      <div className="flex flex-col gap-1.5">
        {poll.options.map((option) => {
          const percent =
            poll.totalVotes > 0
              ? Math.round((option.voteCount / poll.totalVotes) * 100)
              : 0;
          const isMyVote = myVote === option.id;

          if (showResults) {
            const resultRow = (
              <>
                <div
                  className="absolute inset-y-0 left-0 bg-primary/15"
                  style={{ width: `${percent}%` }}
                />
                <div className="relative flex items-center justify-between gap-2 px-3 py-1.5 text-sm">
                  <span className={isMyVote ? "font-semibold" : ""}>
                    {option.text}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {percent}%
                  </span>
                </div>
              </>
            );

            if (canChangeVote) {
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={voteMutation.isPending}
                  onClick={(e) => handleVote(e, option.id)}
                  className={`relative overflow-hidden rounded-lg text-left hover:bg-muted/50 disabled:opacity-60 ${
                    isMyVote ? "bg-primary/10" : "bg-muted/60"
                  }`}
                >
                  {resultRow}
                </button>
              );
            }

            return (
              <div
                key={option.id}
                className={`relative overflow-hidden rounded-lg ${isMyVote ? "bg-primary/10" : "bg-muted/60"}`}
              >
                {resultRow}
              </div>
            );
          }

          return (
            <button
              key={option.id}
              type="button"
              disabled={voteMutation.isPending}
              onClick={(e) => handleVote(e, option.id)}
              className="rounded-lg bg-muted/60 px-3 py-1.5 text-left text-sm hover:bg-muted disabled:opacity-60"
            >
              {option.text}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {formatCount(poll.totalVotes)}{" "}
          {poll.totalVotes === 1 ? "vote" : "votes"} ·{" "}
          {poll.status === "closed" ? "Closed" : "Open"}
        </span>
        {isAuthor && poll.status === "open" && (
          <button
            type="button"
            onClick={handleClose}
            disabled={closeMutation.isPending}
            className="hover:text-foreground disabled:opacity-60"
          >
            Close poll
          </button>
        )}
      </div>
    </div>
  );
};

export default PollBlock;
