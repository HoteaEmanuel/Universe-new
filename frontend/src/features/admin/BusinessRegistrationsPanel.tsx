import { useGetBusinessRegistrationsQuery } from "@/queryAndMutation/queries/auth-queries";
import {
  useAcceptBusinessRegistrationMutation,
  useRejectBusinessRegistrationMutation,
} from "@/queryAndMutation/mutations/auth-mutation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatToLocalDate } from "@/utils/formatDatetoLocal";

const BusinessRegistrationsPanel = () => {
  const { data: businessRegistrations, isLoading } = useGetBusinessRegistrationsQuery();
  const { mutate: acceptBusinessRegistration } = useAcceptBusinessRegistrationMutation();
  const { mutate: rejectBusinessRegistration } = useRejectBusinessRegistrationMutation();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
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
    <ul className="flex flex-col divide-y divide-border">
      {businessRegistrations.map((registration) => (
        <li
          key={registration.id}
          className="flex flex-wrap items-center gap-4 py-3 first:pt-0 last:pb-0"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">
              {registration.name} {registration.email}
            </p>
            <p className="text-sm text-muted-foreground">
              Requested on {formatToLocalDate(new Date(registration.createdAt ?? ""))}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => acceptBusinessRegistration(registration.id)}
            >
              Accept
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => rejectBusinessRegistration(registration.id)}
            >
              Reject
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default BusinessRegistrationsPanel;
