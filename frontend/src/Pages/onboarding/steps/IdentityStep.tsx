import { useState } from "react";
import { useForm } from "react-hook-form";
import { Camera } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useUserStore } from "@/store/userStore";
import { useUpdateBioMutation } from "@/queryAndMutation/mutations/user-mutation";
import { useUsernameAvailability } from "@/hooks/useUsernameAvailability";
import { validateUsernameFormat } from "@/utils/usernameValidation";
import ProfileImageModal from "@/Modals/ProfileImageModal";
import TextareaField from "@/components/TextareaField";
import SubmitButton from "@/components/SubmitButton";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BIO_MAX_LENGTH } from "@/constants/profileForm";
import type { ProfileUser } from "@/features/profile/types";
import OnboardingIllustration from "../OnboardingIllustration";
import identityIllustration from "@/assets/onboarding/identity.webp";

type IdentityStepValues = {
  bio: string;
  username: string;
};

type IdentityStepProps = {
  user: ProfileUser;
  onNext: () => void;
};

const IdentityStep = ({ user, onNext }: IdentityStepProps) => {
  const { updateCurrentUser } = useAuthStore() as {
    updateCurrentUser: (updates: Partial<ProfileUser>) => void;
  };
  const { updateUsername } = useUserStore();
  const { mutateAsync: updateBio, isPending } = useUpdateBioMutation();
  const [openImageModal, setOpenImageModal] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<IdentityStepValues>({
    defaultValues: { bio: user.bio ?? "", username: user.username },
  });
  const watchedBio = watch("bio");
  const watchedUsername = watch("username");
  const { availability, message: availabilityMessage } = useUsernameAvailability(
    user.username,
    watchedUsername,
  );

  const onSubmit = async (data: IdentityStepValues) => {
    const username = data.username.trim().toLowerCase();
    try {
      if (username !== user.username) {
        const updatedUser = await updateUsername(username);
        updateCurrentUser(updatedUser);
      }
      if (data.bio !== (user.bio ?? "")) {
        await updateBio(data.bio);
        updateCurrentUser({ bio: data.bio });
      }
      onNext();
    } catch (error) {
      const response = error as { response?: { status?: number; data?: { message?: string; code?: string } } };
      setError("username", {
        message:
          response.response?.status === 409 || response.response?.data?.code === "USERNAME_TAKEN"
            ? "That username was just claimed. Please choose another."
            : (response.response?.data?.message ?? "Could not save your profile. Please try again."),
      });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <OnboardingIllustration
          src={identityIllustration}
          alt="An illustrated student holding a student ID badge"
        />
        <div className="flex flex-col gap-1">
          <h2 className="heading-text-1 text-xl">Claim your identity</h2>
          <p className="text-sm text-muted-foreground">
            This is how people on Universe will find and recognize you.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="group/avatar relative">
          <UserAvatar user={user} className="size-24 ring-1 ring-border" />
          <Button
            type="button"
            variant="ghost"
            aria-label="Add a profile picture"
            onClick={() => setOpenImageModal(true)}
            className="absolute inset-0 size-full rounded-full bg-black/0 p-0 text-transparent hover:bg-black/40 hover:text-white"
          >
            <Camera className="size-6" />
          </Button>
        </div>
        <button
          type="button"
          onClick={() => setOpenImageModal(true)}
          className="text-xs font-semibold text-primary hover:underline"
        >
          {user.profilePicture ? "Change photo" : "Add a photo (optional)"}
        </button>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="onboarding-username">Username</Label>
          <div className="flex h-10 items-center rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-3 has-[[aria-invalid=true]]:ring-destructive/20 dark:bg-input/30">
            <span className="select-none ps-3 text-base text-muted-foreground" aria-hidden="true">@</span>
            <Input
              id="onboarding-username"
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={30}
              aria-invalid={!!errors.username}
              aria-describedby="onboarding-username-status"
              className="h-full rounded-none border-0 bg-transparent px-1 pe-3 shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
              {...register("username", {
                validate: (value) => validateUsernameFormat(value.trim().toLowerCase()) ?? true,
              })}
            />
          </div>
          <p
            id="onboarding-username-status"
            role="status"
            aria-live="polite"
            className={`text-xs ${errors.username || availability === "unavailable" ? "text-destructive" : availability === "available" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
          >
            {errors.username?.message ?? (availability === "checking" ? "Checking availability…" : availabilityMessage)}
          </p>
        </div>

        <TextareaField
          id="onboarding-bio"
          label="Bio (optional)"
          placeholder="Write a line about yourself..."
          rows={3}
          maxLength={BIO_MAX_LENGTH}
          currentLength={watchedBio?.length ?? 0}
          error={errors.bio?.message}
          registration={register("bio", {
            validate: (v) =>
              v.length > BIO_MAX_LENGTH
                ? `Bio should have less than ${BIO_MAX_LENGTH} characters`
                : true,
          })}
        />

        <SubmitButton isLoading={isSubmitting || isPending} loadingText="Saving...">
          Continue
        </SubmitButton>
      </form>

      <ProfileImageModal
        open={openImageModal}
        onClose={() => setOpenImageModal(false)}
        entityType="user"
      />
    </div>
  );
};

export default IdentityStep;
