import { useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetUserByIdQuery } from "@/queryAndMutation/queries/user-queries";
import ChatUserHeader from "./components/ChatUserHeader";
import NewConversationPanel from "./components/NewConversationPanel";

const NewConvo = () => {
  const { id: userId } = useParams();
  const { data: user, isPending } = useGetUserByIdQuery(userId);

  return (
    <section className="flex h-[calc(100dvh-10rem)] flex-col overflow-hidden rounded-2xl border border-border md:h-[calc(100dvh-4rem)]">
      {isPending ? (
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Skeleton className="size-11 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ) : (
        user && <ChatUserHeader user={user} />
      )}

      {userId && <NewConversationPanel targetUserId={userId} />}
    </section>
  );
};

export default NewConvo;
