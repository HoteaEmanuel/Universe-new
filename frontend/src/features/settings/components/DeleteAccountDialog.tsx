import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Image, MessageSquare, Users, UserX, type LucideIcon } from "lucide-react";
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
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DeleteAccountDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Blocks copy/cut/paste on the password fields below - a stolen, unlocked
// device shouldn't let someone delete the account just by pasting a
// password they lifted from elsewhere; they have to actually know it.
const preventClipboard = (event: React.ClipboardEvent<HTMLInputElement>) => event.preventDefault();

// Mirrors mobile's delete-account.tsx consequences list (same copy, same
// icon roles translated to lucide-react) so the two platforms make the same
// promise about what's lost.
const CONSEQUENCES: { icon: LucideIcon; label: string }[] = [
  { icon: Image, label: "All your posts and photos" },
  { icon: MessageSquare, label: "Your messages and conversations" },
  { icon: Users, label: "Your groups, events, and connections" },
  { icon: UserX, label: "Your profile, permanently" },
];

const DeleteAccountDialog = ({ open, onOpenChange }: DeleteAccountDialogProps) => {
  const { user } = useAuthStore();
  const { mutate: deleteAccount, isPending } = useDeleteAccountMutation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmUsername, setConfirmUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Not derived from googleId — see the matching note in SettingsAccount.tsx.
  const hasPassword = Boolean(user?.hasPassword);
  const passwordsMismatch = hasPassword && confirmPassword.length > 0 && password !== confirmPassword;
  const canConfirm =
    confirmUsername === user?.username &&
    (!hasPassword || (password.length > 0 && password === confirmPassword));

  const handleClose = (next: boolean) => {
    if (!next) {
      setPassword("");
      setConfirmPassword("");
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
      {/* size="sm" keeps the header centered/stacked at every breakpoint
          instead of "default"'s side-by-side icon+text layout on sm+ -
          matches mobile's always-centered warning composition. The !max-w-md
          override widens past size="sm"'s own max-w-xs (too tight for two
          password fields plus the consequences list) without losing that
          centering or the size="sm" footer's paired-button layout. */}
      <AlertDialogContent size="sm" className="max-w-md!">
        <AlertDialogHeader>
          <AlertDialogMedia className="mb-1 size-16 rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-7" />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-xl">Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            This is permanent and can't be undone. You'll lose:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="flex flex-col gap-2">
          {CONSEQUENCES.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3">
              <Icon className="size-5 shrink-0 text-destructive" />
              <span className="text-sm font-medium">{label}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-3">
          {hasPassword && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="delete-account-password">Password</Label>
                <Input
                  id="delete-account-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(event.target.value)
                  }
                  onCopy={preventClipboard}
                  onCut={preventClipboard}
                  onPaste={preventClipboard}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="delete-account-password-confirm">Confirm password</Label>
                <Input
                  id="delete-account-password-confirm"
                  type="password"
                  autoComplete="current-password"
                  value={confirmPassword}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setConfirmPassword(event.target.value)
                  }
                  onCopy={preventClipboard}
                  onCut={preventClipboard}
                  onPaste={preventClipboard}
                />
                {passwordsMismatch && (
                  <p className="error">Passwords don't match</p>
                )}
              </div>
            </>
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
