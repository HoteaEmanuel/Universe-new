import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { FaUserCircle } from "react-icons/fa";
import { Camera, GraduationCap, BookOpen } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useUpdateBioMutation } from "@/queryAndMutation/mutations/user-mutation";
import ProfileImageModal from "@/Modals/ProfileImageModal";
import PostFormCard from "@/features/posts/components/PostFormCard";
import TextareaField from "@/components/TextareaField";
import SubmitButton from "@/components/SubmitButton";
import { Button } from "@/components/ui/button";
import { getFullName } from "@/utils/fullName";
import { BIO_MAX_LENGTH } from "@/constants/profileForm";
import type { ProfileUser } from "./types";

type EditProfileValues = {
  bio: string;
};

const EditProfile = () => {
  useEffect(() => {
    document.title = "Edit Profile";
  }, []);
  const navigate = useNavigate();
  const { user } = useAuthStore() as { user?: ProfileUser };
  const [openImageModal, setOpenImageModal] = useState(false);
  const { mutate: updateBio, isPending } = useUpdateBioMutation();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditProfileValues>({
    defaultValues: { bio: user?.bio ?? "" },
  });
  const watchedBio = watch("bio");

  if (!user) return null;

  const onSubmit = (data: EditProfileValues) => {
    updateBio(data.bio);
    navigate("/profile");
  };

  return (
    <section className="w-full py-6">
      <PostFormCard title="Edit profile" maxWidthClass="max-w-md">
        <div className="flex flex-col items-center gap-3">
          <div className="group/avatar relative">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={getFullName(user)}
                className="size-24 rounded-full object-cover ring-1 ring-border"
              />
            ) : (
              <FaUserCircle className="size-24 text-muted-foreground" />
            )}
            <Button
              type="button"
              variant="ghost"
              aria-label="Change profile picture"
              onClick={() => setOpenImageModal(true)}
              className="absolute inset-0 size-full rounded-full bg-black/0 p-0 text-transparent hover:bg-black/40 hover:text-white"
            >
              <Camera className="size-6" />
            </Button>
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
