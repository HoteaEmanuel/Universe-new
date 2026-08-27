import { useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { useDeleteAccountMutation } from "@/queryAndMutation/mutations/account-mutation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type DeleteAccountDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DeleteAccountDialog = ({ open, onOpenChange }: DeleteAccountDialogProps) => {
  const { user } = useAuthStore();
  const { mutate: deleteAccount, isPending } = useDeleteAccountMutation();
  const [password, setPassword] = useState("");
  const [confirmUsername, setConfirmUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hasPassword = !user?.googleId;
  const canConfirm =
    confirmUsername === user?.username && (!hasPassword || password.length > 0);

  const handleClose = (next: boolean) => {
    if (!next) {
      setPassword("");
      setConfirmUsername("");
      setError(null);
    }
    onOpenChange(next);
  };

  const handleDelete = () => {
    setError(null);
    deleteAccount(hasPassword ? password : undefined, {
      onSuccess: () => toast.success("Account deleted"),
      onError: (err) => {
        const response = err as unknown as {
          response?: { data?: { message?: string } };
        };
        setError(response.response?.data?.message ?? "Could not delete account");
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete account</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes your posts, messages, groups, and
            everything else tied to your account. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-3">
          {hasPassword && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="delete-account-password">Confirm your password</Label>
              <Input
                id="delete-account-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(event.target.value)
                }
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="delete-account-username">
              Type <span className="font-semibold">{user?.username}</span> to confirm
            </Label>
            <Input
              id="delete-account-username"
              type="text"
              autoComplete="off"
              value={confirmUsername}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setConfirmUsername(event.target.value)
              }
            />
          </div>
          {error && <p className="error">{error}</p>}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!canConfirm || isPending}
            onClick={handleDelete}
          >
            {isPending ? "Deleting..." : "Delete account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;
