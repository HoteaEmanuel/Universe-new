import { useState } from "react";
import { Check, X } from "lucide-react";
import { useGetBusinessRegistrationsQuery } from "@/queryAndMutation/queries/auth-queries";
import {
  useAcceptBusinessRegistrationMutation,
  useRejectBusinessRegistrationMutation,
} from "@/queryAndMutation/mutations/auth-mutation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatToLocalDate } from "@/utils/formatDatetoLocal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type RegistrationAction = { id: string; name: string; kind: "accept" | "reject" };

const BusinessRegistrationsPanel = () => {
  const { data: businessRegistrations, isLoading, isError, refetch } = useGetBusinessRegistrationsQuery();
  const [pendingAction, setPendingAction] = useState<RegistrationAction | null>(null);
  const { mutate: acceptBusinessRegistration, isPending: isAccepting } = useAcceptBusinessRegistrationMutation();
  const { mutate: rejectBusinessRegistration, isPending: isRejecting } = useRejectBusinessRegistrationMutation();
  const isMutating = isAccepting || isRejecting;

  const confirmAction = () => {
    if (!pendingAction) return;
    const mutation = pendingAction.kind === "accept" ? acceptBusinessRegistration : rejectBusinessRegistration;
    mutation(pendingAction.id, { onSuccess: () => setPendingAction(null) });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <button className="w-full rounded-lg bg-destructive/8 p-6 text-sm font-semibold" onClick={() => refetch()}>
        Registrations could not be loaded. Try again.
      </button>
    );
  }

  if (!businessRegistrations || businessRegistrations.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No business registrations found.
      </p>
    );
  }

  return (
    <>
    <ul className="flex flex-col divide-y divide-border">
      {businessRegistrations.map((registration) => (
        <li
          key={registration.id}
          className="flex flex-wrap items-center gap-4 py-3 first:pt-0 last:pb-0"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{registration.name}</p>
            <p className="truncate text-sm text-muted-foreground">{registration.email}</p>
            <p className="text-sm text-muted-foreground">
              Requested on {formatToLocalDate(new Date(registration.createdAt ?? ""))}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setPendingAction({ id: registration.id, name: registration.name ?? "This business", kind: "accept" })}
            >
              <Check className="size-4" aria-hidden="true" />
              Accept
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setPendingAction({ id: registration.id, name: registration.name ?? "This business", kind: "reject" })}
            >
              <X className="size-4" aria-hidden="true" />
              Reject
            </Button>
          </div>
        </li>
      ))}
    </ul>
    <AlertDialog open={!!pendingAction} onOpenChange={(open: boolean) => !open && !isMutating && setPendingAction(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{pendingAction?.kind === "accept" ? "Accept" : "Reject"} this registration?</AlertDialogTitle>
          <AlertDialogDescription>
            {pendingAction?.kind === "accept"
              ? `${pendingAction?.name} will receive business-account access.`
              : `${pendingAction?.name}'s request will be rejected. This action cannot be undone here.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isMutating}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={pendingAction?.kind === "reject" ? "destructive" : "default"}
            disabled={isMutating}
            onClick={confirmAction}
          >
            {isMutating ? "Saving..." : pendingAction?.kind === "accept" ? "Accept registration" : "Reject registration"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default BusinessRegistrationsPanel;
