export type ProfileUser = {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  profilePicture?: string | null;
  university?: string | null;
  major?: string | null;
  bio?: string | null;
  accountType?: "normal" | "business";
};
