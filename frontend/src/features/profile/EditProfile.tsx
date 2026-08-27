import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Camera, GraduationCap, BookOpen } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useUpdateBioMutation } from "@/queryAndMutation/mutations/user-mutation";
import ProfileImageModal from "@/Modals/ProfileImageModal";
import PostFormCard from "@/features/posts/components/PostFormCard";
import TextareaField from "@/components/TextareaField";
import SubmitButton from "@/components/SubmitButton";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UserAvatar from "@/components/UserAvatar";
import { getFullName } from "@/utils/fullName";
import { BIO_MAX_LENGTH } from "@/constants/profileForm";
import type { ProfileUser } from "./types";
import { useUserStore } from "@/store/userStore";
import { validateUsernameFormat } from "@/utils/usernameValidation";
import { useUsernameAvailability } from "@/hooks/useUsernameAvailability";

type EditProfileValues = {
  bio: string;
  username: string;
};

const EditProfile = () => {
  useEffect(() => {
    document.title = "Edit Profile";
  }, []);
  const navigate = useNavigate();
  const { user, updateCurrentUser } = useAuthStore() as {
    user?: ProfileUser;
    updateCurrentUser: (updates: Partial<ProfileUser>) => void;
  };
  const { updateUsername } = useUserStore();
  const [openImageModal, setOpenImageModal] = useState(false);
  const { mutateAsync: updateBio, isPending } = useUpdateBioMutation();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<EditProfileValues>({
    defaultValues: { bio: user?.bio ?? "", username: user?.username ?? "" },
  });
  const watchedBio = watch("bio");
  const watchedUsername = watch("username");
  const { availability, message: availabilityMessage } = useUsernameAvailability(
    user?.username ?? "",
    watchedUsername,
  );

  if (!user) return null;

  const onSubmit = async (data: EditProfileValues) => {
    const username = data.username.trim().toLowerCase();
    try {
      if (username !== user.username) {
        const updatedUser = await updateUsername(username);
        updateCurrentUser(updatedUser);
      }
      await updateBio(data.bio);
      navigate("/profile");
    } catch (error) {
      const response = error as { response?: { status?: number; data?: { message?: string; code?: string } } };
      setError("username", {
        message:
          response.response?.status === 409 || response.response?.data?.code === "USERNAME_TAKEN"
            ? "That username was just claimed. Please choose another."
            : response.response?.data?.message ?? "Could not save your profile. Please try again.",
      });
    }
  };

  return (
    <section className="w-full py-6">
      <PostFormCard title="Edit profile" maxWidthClass="max-w-md">
        <div className="flex flex-col items-center gap-3">
          <div className="group/avatar relative">
            <UserAvatar user={user} className="size-24 ring-1 ring-border" />
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label="Change profile picture"
                    onClick={() => setOpenImageModal(true)}
                    className="absolute inset-0 size-full rounded-full bg-black/0 p-0 text-transparent hover:bg-black/40 hover:text-white"
                  />
                }
              >
                <Camera className="size-6" />
              </TooltipTrigger>
              <TooltipContent>Change profile picture</TooltipContent>
            </Tooltip>
          </div>
          <h1 className="text-lg font-semibold">{getFullName(user)}</h1>
          {(user.university || user.major) && (
            <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
              {user.university && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="size-3.5" />
                  {user.university}
                </span>
              )}
              {user.major && (
                <span className="flex items-center gap-1.5">
                  <BookOpen className="size-3.5" />
                  {user.major}
                </span>
              )}
            </div>
          )}
        </div>

        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username">Username</Label>
            <div className="flex h-10 items-center rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-3 has-[[aria-invalid=true]]:ring-destructive/20 dark:bg-input/30">
              <span className="select-none ps-3 text-base text-muted-foreground" aria-hidden="true">@</span>
              <Input
                id="username"
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={30}
                aria-invalid={!!errors.username}
                aria-describedby="username-hint username-status"
                className="h-full rounded-none border-0 bg-transparent px-1 pe-3 shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
                {...register("username", {
                  validate: (value) => {
                    const canonical = value.trim().toLowerCase();
                    return validateUsernameFormat(canonical) ?? true;
                  },
                })}
              />
            </div>
            <p id="username-hint" className="text-xs text-muted-foreground">
              Your public profile link will be /u/{watchedUsername.trim().toLowerCase() || "username"}.
            </p>
            <p
              id="username-status"
              role="status"
              aria-live="polite"
              className={`text-xs ${errors.username || availability === "unavailable" ? "text-destructive" : availability === "available" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
            >
              {errors.username?.message ?? (availability === "checking" ? "Checking availability…" : availabilityMessage)}
            </p>
          </div>

          <TextareaField
            id="bio"
            label="Bio"
            placeholder="Write something about yourself..."
            rows={4}
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

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => navigate("/profile")}>
              Cancel
            </Button>
            <SubmitButton
              isLoading={isSubmitting || isPending}
              loadingText="Saving..."
              className="w-auto"
            >
              Save changes
            </SubmitButton>
          </div>
        </form>

        <ProfileImageModal
          open={openImageModal}
          onClose={() => setOpenImageModal(false)}
          entityType="user"
        />
      </PostFormCard>
    </section>
  );
};

export default EditProfile;
